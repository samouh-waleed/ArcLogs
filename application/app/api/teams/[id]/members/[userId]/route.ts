// app/api/teams/[teamId]/members/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { team, member, teamMember } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId, userId } = await params;

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

    // Soft delete team member
    await db
      .update(teamMember)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(teamMember.teamId, teamId),
          eq(teamMember.userId, userId),
          isNull(teamMember.deletedAt)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
