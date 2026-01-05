// app/api/teams/[teamId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { team, teamMember } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the team with members
    const teamData = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), isNull(team.deletedAt)),
      with: {
        teamMembers: {
          where: isNull(teamMember.deletedAt),
          with: {
            user: true,
          },
        },
      },
    });

    if (!teamData) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get user's org membership
    const activeOrg = await auth.api.getFullOrganization({
      headers: request.headers,
    });

    if (!activeOrg || activeOrg.id !== teamData.organizationId) {
      return NextResponse.json(
        { error: "Not authorized for this organization" },
        { status: 403 }
      );
    }

    return NextResponse.json(teamData);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, membersCanSeeUpdates, membersCanSeeInsights } =
      body;

    // Get the team
    const teamData = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), isNull(team.deletedAt)),
    });

    if (!teamData) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is a team leader or org owner/admin
    const teamMemberData = await db.query.teamMember.findFirst({
      where: and(
        eq(teamMember.teamId, teamId),
        eq(teamMember.userId, session.user.id),
        isNull(teamMember.deletedAt)
      ),
    });

    const activeOrg = await auth.api.getFullOrganization({
      headers: request.headers,
    });

    const userOrgMember = activeOrg?.members?.find(
      (m: any) => m.userId === session.user.id
    );

    const isTeamLeader = teamMemberData?.role === "leader";
    const isOrgAdmin =
      userOrgMember?.role === "owner" || userOrgMember?.role === "admin";

    if (!isTeamLeader && !isOrgAdmin) {
      return NextResponse.json(
        { error: "Only team leaders and org admins can update team settings" },
        { status: 403 }
      );
    }

    // Update team
    const updated = await db
      .update(team)
      .set({
        name: name || teamData.name,
        description:
          description !== undefined ? description : teamData.description,
        membersCanSeeUpdates:
          membersCanSeeUpdates !== undefined
            ? membersCanSeeUpdates
            : teamData.membersCanSeeUpdates,
        membersCanSeeInsights:
          membersCanSeeInsights !== undefined
            ? membersCanSeeInsights
            : teamData.membersCanSeeInsights,
        updatedAt: new Date(),
      })
      .where(eq(team.id, teamId))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the team
    const teamData = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), isNull(team.deletedAt)),
    });

    if (!teamData) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is org owner/admin
    const activeOrg = await auth.api.getFullOrganization({
      headers: request.headers,
    });

    const userOrgMember = activeOrg?.members?.find(
      (m: any) => m.userId === session.user.id
    );

    const isOrgAdmin =
      userOrgMember?.role === "owner" || userOrgMember?.role === "admin";

    if (!isOrgAdmin) {
      return NextResponse.json(
        { error: "Only org admins can delete teams" },
        { status: 403 }
      );
    }

    // Soft delete team
    await db
      .update(team)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(team.id, teamId));

    return NextResponse.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
