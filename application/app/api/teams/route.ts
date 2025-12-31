import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { team, teamMember } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's active organization from Better Auth
    const activeOrg = await auth.api.getFullOrganization({
      headers: request.headers,
    });

    if (!activeOrg) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    const userMember = activeOrg.members.find(
      (m) => m.userId === session.user.id
    );
    const isOwnerOrAdmin =
      userMember?.role === "owner" || userMember?.role === "admin";

    // Get teams based on role
    let teams;
    if (isOwnerOrAdmin) {
      // Org owners/admins see all teams
      teams = await db.query.team.findMany({
        where: and(
          eq(team.organizationId, activeOrg.id),
          isNull(team.deletedAt),
          isNull(team.archivedAt)
        ),
        with: {
          teamMembers: {
            where: isNull(teamMember.deletedAt),
            with: {
              user: true,
            },
          },
        },
        orderBy: (teams, { desc }) => [desc(teams.createdAt)],
      });
    } else {
      // Regular members only see teams they're part of
      const userTeamMemberships = await db.query.teamMember.findMany({
        where: and(
          eq(teamMember.userId, session.user.id),
          isNull(teamMember.deletedAt)
        ),
        with: {
          team: {
            with: {
              teamMembers: {
                where: isNull(teamMember.deletedAt),
                with: {
                  user: true,
                },
              },
            },
          },
        },
      });

      teams = userTeamMemberships
        .map((tm) => tm.team)
        .filter(
          (t) =>
            t.organizationId === activeOrg.id && !t.deletedAt && !t.archivedAt
        );
    }

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's active organization from Better Auth
    const activeOrg = await auth.api.getFullOrganization({
      headers: request.headers,
    });

    if (!activeOrg) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 404 }
      );
    }

    // Check permissions - only owners and admins can create teams
    const userMember = activeOrg.members.find(
      (m) => m.userId === session.user.id
    );
    const canCreateTeam =
      userMember?.role === "owner" || userMember?.role === "admin";

    if (!canCreateTeam) {
      return NextResponse.json(
        { error: "You don't have permission to create teams" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Team name must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Create team and add creator as leader
    const teamId = nanoid();
    const teamMemberId = nanoid();

    await db.transaction(async (tx) => {
      // Create team
      await tx.insert(team).values({
        id: teamId,
        name: name.trim(),
        description: description?.trim() || null,
        organizationId: activeOrg.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add creator as team leader
      await tx.insert(teamMember).values({
        id: teamMemberId,
        teamId,
        userId: session.user.id,
        role: "leader",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // Fetch the created team
    const newTeam = await db.query.team.findFirst({
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

    return NextResponse.json(
      {
        team: newTeam,
        message: "Team created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
