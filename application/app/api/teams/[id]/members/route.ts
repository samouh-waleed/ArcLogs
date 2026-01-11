// app/api/teams/[id]/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { team, member, teamMember, user } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

// POST - Add members to team
export async function POST(
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
    const { members: membersToAdd } = body;

    if (!Array.isArray(membersToAdd) || membersToAdd.length === 0) {
      return NextResponse.json(
        { error: "Members array required" },
        { status: 400 }
      );
    }

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

    // Process each member
    const addedMembers = [];
    for (const memberData of membersToAdd) {
      const { slackUserId, email, name, role = "member" } = memberData;

      // Find or create user by email
      let dbUser = await db.query.user.findFirst({
        where: eq(user.email, email),
      });

      if (!dbUser) {
        // Create user
        const [newUser] = await db
          .insert(user)
          .values({
            id: nanoid(),
            email,
            name: name || email,
            emailVerified: false,
          })
          .returning();
        dbUser = newUser;
      }

      // Check if user is org member, if not add them
      const orgMembership = await db.query.member.findFirst({
        where: and(
          eq(member.organizationId, existingTeam.organizationId),
          eq(member.userId, dbUser.id),
          isNull(member.deletedAt)
        ),
      });

      if (!orgMembership) {
        await db.insert(member).values({
          id: nanoid(),
          organizationId: existingTeam.organizationId,
          userId: dbUser.id,
          role: "member",
        });
      }

      // Check if already team member
      const existingTeamMember = await db.query.teamMember.findFirst({
        where: and(
          eq(teamMember.teamId, teamId),
          eq(teamMember.userId, dbUser.id),
          isNull(teamMember.deletedAt)
        ),
      });

      if (existingTeamMember) {
        // Update existing
        await db
          .update(teamMember)
          .set({
            slackUserId,
            role,
            updatedAt: new Date(),
          })
          .where(eq(teamMember.id, existingTeamMember.id));
        addedMembers.push(existingTeamMember);
      } else {
        // Create new team member
        const [newTeamMember] = await db
          .insert(teamMember)
          .values({
            id: nanoid(),
            teamId,
            userId: dbUser.id,
            slackUserId,
            role,
          })
          .returning();
        addedMembers.push(newTeamMember);
      }
    }

    return NextResponse.json({ members: addedMembers }, { status: 201 });
  } catch (error) {
    console.error("Error adding team members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
