// app/api/teams/[teamId]/questions/route.ts - FIXED
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyQuestion, teamMember } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { eq, and, isNull, sql } from "drizzle-orm";

import { nanoid } from "nanoid";

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

    // Check team membership
    const teamMemberData = await db.query.teamMember.findFirst({
      where: and(
        eq(teamMember.teamId, teamId),
        eq(teamMember.userId, session.user.id),
        isNull(teamMember.deletedAt)
      ),
    });

    if (!teamMemberData) {
      return NextResponse.json(
        { error: "Not a member of this team" },
        { status: 403 }
      );
    }

    const questions = await db.query.dailyQuestion.findMany({
      where: and(
        eq(dailyQuestion.teamId, teamId),
        isNull(dailyQuestion.deletedAt)
      ),
      orderBy: (dailyQuestion, { asc }) => [asc(dailyQuestion.order)],
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const {
      question,
      required = false,
      scheduleType = "daily",
      scheduleConfig = {},
      effectiveFrom,
      effectiveUntil,
      isActive = true,
    } = body;

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

    // Get max order
    const maxOrderResult = await db
      .select({
        maxOrder: sql<number>`COALESCE(MAX(${dailyQuestion.order}), 0)`,
      })
      .from(dailyQuestion)
      .where(
        and(eq(dailyQuestion.teamId, teamId), isNull(dailyQuestion.deletedAt))
      );

    const maxOrder = Number(maxOrderResult[0]?.maxOrder || 0);

    // Generate ID manually
    const questionId = nanoid();

    const newQuestion = await db
      .insert(dailyQuestion)
      .values({
        id: questionId,
        teamId,
        question,
        required,
        order: maxOrder + 1,
        scheduleType,
        scheduleConfig,
        effectiveFrom: effectiveFrom ? effectiveFrom : null,
        effectiveUntil: effectiveUntil ? effectiveUntil : null,
        isActive,
      })
      .returning();

    return NextResponse.json(newQuestion[0]);
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}
