import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { team, teamMember } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamId = params.teamId;

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

    // Determine user's role and permissions
    const userOrgMember = activeOrg.members.find(
      (m) => m.userId === session.user.id
    );
    const isOrgOwner = userOrgMember?.role === "owner";
    const isOrgAdmin = userOrgMember?.role === "admin";

    const userTeamMember = teamData.teamMembers.find(
      (m) => m.userId === session.user.id
    );
    const isTeamLeader = userTeamMember?.role === "leader";
    const isTeamMember = !!userTeamMember;

    // Check if user can even view this team
    if (!isOrgOwner && !isOrgAdmin && !isTeamMember) {
      return NextResponse.json(
        { error: "You do not have access to this team" },
        { status: 403 }
      );
    }

    // Determine what the user can do
    const canManageMembers = isOrgOwner || isOrgAdmin || isTeamLeader;
    const canManageSettings = isOrgOwner || isOrgAdmin || isTeamLeader;
    const canDeleteTeam = isOrgOwner || isOrgAdmin;

    return NextResponse.json({
      team: teamData,
      userRole: userTeamMember?.role || null,
      orgRole: userOrgMember?.role || null,
      permissions: {
        canManageMembers,
        canManageSettings,
        canDeleteTeam,
        canViewUpdates: isTeamMember,
        canSubmitUpdates: isTeamMember,
      },
      // For convenience in the UI
      canManageMembers,
      canManageSettings,
      canDeleteTeam,
    });
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
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamId = params.teamId;

    // Get the team
    const teamData = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), isNull(team.deletedAt)),
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

    // Check permissions
    const userOrgMember = activeOrg.members.find(
      (m) => m.userId === session.user.id
    );
    const isOrgOwnerOrAdmin =
      userOrgMember?.role === "owner" || userOrgMember?.role === "admin";

    const userTeamMember = await db.query.teamMember.findFirst({
      where: and(
        eq(teamMember.teamId, teamId),
        eq(teamMember.userId, session.user.id),
        isNull(teamMember.deletedAt)
      ),
    });
    const isTeamLeader = userTeamMember?.role === "leader";

    if (!isOrgOwnerOrAdmin && !isTeamLeader) {
      return NextResponse.json(
        { error: "Only org owners/admins or team leaders can update teams" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description } = body;

    const updates: any = {
      updatedAt: new Date(),
    };

    if (name) updates.name = name.trim();
    if (description !== undefined)
      updates.description = description?.trim() || null;

    // Update team
    await db.update(team).set(updates).where(eq(team.id, teamId));

    // Fetch updated team
    const updatedTeam = await db.query.team.findFirst({
      where: eq(team.id, teamId),
      with: {
        teamMembers: {
          where: isNull(teamMember.deletedAt),
          with: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({
      team: updatedTeam,
      message: "Team updated successfully",
    });
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
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamId = params.teamId;

    // Get the team
    const teamData = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), isNull(team.deletedAt)),
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

    // Check permissions - only org owners and admins can delete teams
    const userOrgMember = activeOrg.members.find(
      (m) => m.userId === session.user.id
    );
    const canDelete =
      userOrgMember?.role === "owner" || userOrgMember?.role === "admin";

    if (!canDelete) {
      return NextResponse.json(
        { error: "Only org owners and admins can delete teams" },
        { status: 403 }
      );
    }

    // Soft delete the team
    await db
      .update(team)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(team.id, teamId));

    return NextResponse.json({
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
