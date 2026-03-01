// app/api/teams/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  team,
  member,
  teamMember,
  standupConfig,
  standupResponse,
  insight,
  helpRequest,
  jiraLink,
} from "@/drizzle/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Get single team with members
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId } = await params;

    // Fetch team
    const teamData = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), isNull(team.deletedAt)),
    });

    if (!teamData) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verify user has access
    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, teamData.organizationId),
        eq(member.userId, session.user.id),
        isNull(member.deletedAt)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch team members with relations
    const members = await db.query.teamMember.findMany({
      where: and(eq(teamMember.teamId, teamId), isNull(teamMember.deletedAt)),
      with: {
        user: true,
      },
    });

    // Fetch all non-deleted standup configs for the count display
    const standupConfigs = await db.query.standupConfig.findMany({
      where: and(
        eq(standupConfig.teamId, teamId),
        isNull(standupConfig.deletedAt)
      ),
      columns: { id: true, name: true, isActive: true },
    });

    return NextResponse.json({
      team: {
        ...teamData,
        teamMembers: members,
        standupConfigs,
      },
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT and DELETE remain the same...
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId } = await params;
    const body = await req.json();
    const { name, description, slackChannelId, slackChannelName } = body;

    // Get team
    const existingTeam = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), isNull(team.deletedAt)),
    });

    if (!existingTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verify user is admin or owner
    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, existingTeam.organizationId),
        eq(member.userId, session.user.id),
        isNull(member.deletedAt)
      ),
    });

    if (
      !membership ||
      (membership.role !== "admin" && membership.role !== "owner")
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update team
    const [updatedTeam] = await db
      .update(team)
      .set({
        name: name || existingTeam.name,
        description:
          description !== undefined ? description : existingTeam.description,
        slackChannelId:
          slackChannelId !== undefined
            ? slackChannelId
            : existingTeam.slackChannelId,
        slackChannelName:
          slackChannelName !== undefined
            ? slackChannelName
            : existingTeam.slackChannelName,
        updatedAt: new Date(),
      })
      .where(eq(team.id, teamId))
      .returning();

    return NextResponse.json({ team: updatedTeam });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId } = await params;

    // Get team
    const existingTeam = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), isNull(team.deletedAt)),
    });

    if (!existingTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verify user is admin or owner
    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, existingTeam.organizationId),
        eq(member.userId, session.user.id),
        isNull(member.deletedAt)
      ),
    });

    if (
      !membership ||
      (membership.role !== "admin" && membership.role !== "owner")
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Cascade soft-delete: team + all related records in a transaction
    const now = new Date();

    await db.transaction(async (tx) => {
      // 1. Help requests
      await tx
        .update(helpRequest)
        .set({ deletedAt: now })
        .where(
          and(eq(helpRequest.teamId, teamId), isNull(helpRequest.deletedAt))
        );

      // 2. Insights
      await tx
        .update(insight)
        .set({ deletedAt: now })
        .where(and(eq(insight.teamId, teamId), isNull(insight.deletedAt)));

      // 3. Jira links (linked through standup_response)
      const teamResponses = await tx
        .select({ id: standupResponse.id })
        .from(standupResponse)
        .where(
          and(
            eq(standupResponse.teamId, teamId),
            isNull(standupResponse.deletedAt)
          )
        );

      if (teamResponses.length > 0) {
        const responseIds = teamResponses.map((r) => r.id);
        await tx
          .update(jiraLink)
          .set({ deletedAt: now })
          .where(
            and(
              inArray(jiraLink.standupResponseId, responseIds),
              isNull(jiraLink.deletedAt)
            )
          );
      }

      // 4. Standup responses
      await tx
        .update(standupResponse)
        .set({ deletedAt: now })
        .where(
          and(
            eq(standupResponse.teamId, teamId),
            isNull(standupResponse.deletedAt)
          )
        );

      // 5. Standup configs
      await tx
        .update(standupConfig)
        .set({ deletedAt: now })
        .where(
          and(
            eq(standupConfig.teamId, teamId),
            isNull(standupConfig.deletedAt)
          )
        );

      // 6. Team members
      await tx
        .update(teamMember)
        .set({ deletedAt: now })
        .where(
          and(eq(teamMember.teamId, teamId), isNull(teamMember.deletedAt))
        );

      // 7. Team itself (last)
      await tx
        .update(team)
        .set({ deletedAt: now })
        .where(eq(team.id, teamId));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
