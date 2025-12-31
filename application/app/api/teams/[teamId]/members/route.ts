import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teamMember, team } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";
import { eq, and, isNull } from "drizzle-orm";

// POST - Add member to team
export async function POST(
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

    // Check permissions - need to be org owner/admin OR team leader
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
        { error: "Only org owners/admins or team leaders can add members" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId, role = "member" } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify user is in the organization
    const targetOrgMember = activeOrg.members.find((m) => m.userId === userId);
    if (!targetOrgMember) {
      return NextResponse.json(
        { error: "User is not a member of this organization" },
        { status: 400 }
      );
    }

    // Check if user is already in team
    const existingTeamMember = await db.query.teamMember.findFirst({
      where: and(
        eq(teamMember.teamId, teamId),
        eq(teamMember.userId, userId),
        isNull(teamMember.deletedAt)
      ),
    });

    if (existingTeamMember) {
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 400 }
      );
    }

    // Add user to team
    const newTeamMemberId = nanoid();
    await db.insert(teamMember).values({
      id: newTeamMemberId,
      teamId,
      userId,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Fetch the new member with user info
    const newMember = await db.query.teamMember.findFirst({
      where: eq(teamMember.id, newTeamMemberId),
      with: {
        user: true,
      },
    });

    return NextResponse.json(
      {
        member: newMember,
        message: "Team member added successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    );
  }
}

// DELETE - Remove member from team
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
    const { searchParams } = new URL(request.url);
    const userIdToRemove = searchParams.get("userId");

    if (!userIdToRemove) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

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

    // Can remove if: org owner/admin, team leader, or removing yourself
    const canRemove =
      isOrgOwnerOrAdmin || isTeamLeader || session.user.id === userIdToRemove;

    if (!canRemove) {
      return NextResponse.json(
        {
          error:
            "Only org owners/admins, team leaders, or the member themselves can remove members",
        },
        { status: 403 }
      );
    }

    // Soft delete the team member
    await db
      .update(teamMember)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(teamMember.teamId, teamId),
          eq(teamMember.userId, userIdToRemove),
          isNull(teamMember.deletedAt)
        )
      );

    return NextResponse.json({
      message: "Team member removed successfully",
    });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}

// PATCH - Update member role
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

    // Check permissions - only org owner/admin or team leader
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
        { error: "Only org owners/admins or team leaders can update roles" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }

    if (role !== "leader" && role !== "member") {
      return NextResponse.json(
        { error: "Role must be 'leader' or 'member'" },
        { status: 400 }
      );
    }

    // Update the member's role
    await db
      .update(teamMember)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(teamMember.teamId, teamId),
          eq(teamMember.userId, userId),
          isNull(teamMember.deletedAt)
        )
      );

    // Fetch updated member
    const updatedMember = await db.query.teamMember.findFirst({
      where: and(
        eq(teamMember.teamId, teamId),
        eq(teamMember.userId, userId),
        isNull(teamMember.deletedAt)
      ),
      with: {
        user: true,
      },
    });

    return NextResponse.json({
      member: updatedMember,
      message: "Member role updated successfully",
    });
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}
