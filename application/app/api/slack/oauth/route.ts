// app/api/slack/oauth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slackWorkspace, organization } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // Contains orgId
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=slack_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=invalid_slack_callback`
      );
    }

    // Get session to verify user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?redirect=/dashboard`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/oauth`,
      }),
    });

    const data = await tokenResponse.json();

    if (!data.ok) {
      console.error("Slack OAuth error:", data);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=slack_auth_failed`
      );
    }

    // Verify organization exists
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, state),
    });

    if (!org) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=org_not_found`
      );
    }

    // Check if workspace already connected
    const existingWorkspace = await db.query.slackWorkspace.findFirst({
      where: eq(slackWorkspace.slackTeamId, data.team.id),
    });

    if (existingWorkspace) {
      // Update existing workspace
      await db
        .update(slackWorkspace)
        .set({
          botToken: data.access_token,
          botUserId: data.bot_user_id,
          slackTeamName: data.team.name,
          installedBy: data.authed_user.id,
          installedAt: new Date(),
          deletedAt: null,
        })
        .where(eq(slackWorkspace.id, existingWorkspace.id));
    } else {
      // Create new workspace
      await db.insert(slackWorkspace).values({
        id: nanoid(),
        organizationId: state,
        slackTeamId: data.team.id,
        slackTeamName: data.team.name,
        botToken: data.access_token,
        botUserId: data.bot_user_id,
        installedBy: data.authed_user.id,
      });
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=slack_connected`
    );
  } catch (error) {
    console.error("Slack OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=slack_error`
    );
  }
}
