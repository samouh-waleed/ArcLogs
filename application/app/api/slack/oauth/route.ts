// app/api/slack/oauth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slackWorkspace, organization, team, teamMember } from "@/drizzle/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { encrypt } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // Contains orgId
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/?error=slack_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/?error=invalid_slack_callback`
      );
    }

    // Get session to verify user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?redirect=/`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/oauth`,
      }),
    });

    const data = await tokenResponse.json();

    if (!data.ok) {
      console.error("Slack OAuth error:", data);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/?error=slack_auth_failed`
      );
    }

    // Verify organization exists
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, state),
    });

    if (!org) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/?error=org_not_found`
      );
    }

    // Find the org's CURRENTLY ACTIVE workspace (by org, not by Slack workspace ID).
    // This is what the org is actually using right now.
    const currentOrgWorkspace = await db.query.slackWorkspace.findFirst({
      where: and(
        eq(slackWorkspace.organizationId, state),
        isNull(slackWorkspace.deletedAt)
      ),
    });

    const isSwitchingWorkspace =
      currentOrgWorkspace &&
      currentOrgWorkspace.slackTeamId !== data.team.id;

    if (isSwitchingWorkspace) {
      // Admin is connecting a DIFFERENT Slack workspace.
      // 1. Soft-delete the old workspace record.
      await db
        .update(slackWorkspace)
        .set({ deletedAt: new Date() })
        .where(eq(slackWorkspace.id, currentOrgWorkspace!.id));

      // 2. Clear slackUserId for all team members in this org.
      //    Their Slack IDs came from the old workspace. Users who are not in
      //    the new workspace would silently receive 0 standups otherwise.
      //    This forces the admin to re-add members from the new workspace picker.
      const orgTeams = await db.query.team.findMany({
        where: and(eq(team.organizationId, state), isNull(team.deletedAt)),
        columns: { id: true },
      });
      const teamIds = orgTeams.map((t) => t.id);

      if (teamIds.length > 0) {
        await db
          .update(teamMember)
          .set({ slackUserId: null, updatedAt: new Date() })
          .where(
            and(inArray(teamMember.teamId, teamIds), isNull(teamMember.deletedAt))
          );
      }
    }

    // Look up the Slack workspace by its Slack team ID across ALL orgs.
    // The previous lookup filtered by organizationId too, which caused a crash
    // when connecting a workspace that already exists in a different org:
    //   lookup returns null → INSERT → unique constraint violation on slackTeamId.
    // By searching globally, we find any existing record and UPDATE it (reassigning
    // it to the new org) instead of inserting a duplicate.
    const existingForThisSlack = await db.query.slackWorkspace.findFirst({
      where: eq(slackWorkspace.slackTeamId, data.team.id),
    });

    if (existingForThisSlack) {
      // Workspace exists (same org reconnect, or reassignment from another org).
      // Update the record to point to the current org with fresh credentials.
      await db
        .update(slackWorkspace)
        .set({
          organizationId: state,
          botToken: encrypt(data.access_token),
          botUserId: data.bot_user_id,
          slackTeamName: data.team.name,
          installedBy: data.authed_user.id,
          installedAt: new Date(),
          deletedAt: null,
        })
        .where(eq(slackWorkspace.id, existingForThisSlack.id));
    } else {
      // Truly new workspace — no record exists for this slackTeamId at all.
      await db.insert(slackWorkspace).values({
        id: nanoid(),
        organizationId: state,
        slackTeamId: data.team.id,
        slackTeamName: data.team.name,
        botToken: encrypt(data.access_token),
        botUserId: data.bot_user_id,
        installedBy: data.authed_user.id,
      });
    }

    const redirectSuffix = isSwitchingWorkspace
      ? "?success=slack_switched"
      : "?success=slack_connected";

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/${redirectSuffix}`
    );
  } catch (error) {
    console.error("Slack OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?error=slack_error`
    );
  }
}
