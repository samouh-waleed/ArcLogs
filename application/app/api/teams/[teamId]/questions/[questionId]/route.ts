// app/api/teams/[teamId]/questions/[questionId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyQuestion, teamMember } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { eq, and, isNull } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; questionId: string }> }
) {
  try {
    const { teamId, questionId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { question, required, order } = body;

    // Check if user is team leader or org owner/admin
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
        { error: "Only team leaders and org admins can manage questions" },
        { status: 403 }
      );
    }

    // Update question
    const updated = await db
      .update(dailyQuestion)
      .set({
        question: question !== undefined ? question : undefined,
        required: required !== undefined ? required : undefined,
        order: order !== undefined ? order : undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(dailyQuestion.id, questionId),
          eq(dailyQuestion.teamId, teamId),
          isNull(dailyQuestion.deletedAt)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; questionId: string }> }
) {
  try {
    const { teamId, questionId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is team leader or org owner/admin
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
        { error: "Only team leaders and org admins can manage questions" },
        { status: 403 }
      );
    }

    // Soft delete question
    await db
      .update(dailyQuestion)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(dailyQuestion.id, questionId),
          eq(dailyQuestion.teamId, teamId),
          isNull(dailyQuestion.deletedAt)
        )
      );

    return NextResponse.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
