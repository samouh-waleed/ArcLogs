// app/api/teams/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { team, member, teamMember, standupConfig } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
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

    // Soft delete team
    await db
      .update(team)
      .set({ deletedAt: new Date() })
      .where(eq(team.id, teamId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
