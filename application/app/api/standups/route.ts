// app/api/standups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { standupConfig, team, member } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { checkStandupLimit, canUseVoice } from "@/lib/limits";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json({ error: "Team ID required" }, { status: 400 });
    }

    const teamData = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), isNull(team.deletedAt)),
    });

    if (!teamData) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

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

    const standups = await db.query.standupConfig.findMany({
      where: and(
        eq(standupConfig.teamId, teamId),
        isNull(standupConfig.deletedAt)
      ),
      orderBy: (standupConfig, { desc }) => [desc(standupConfig.createdAt)],
    });

    return NextResponse.json({ standups });
  } catch (error) {
    console.error("Error fetching standups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      teamId,
      name,
      timezone,
      scheduleTime,
      scheduleDays,
      questions,
      allowVoiceResponses,
      reminderMinutes,
    } = body;

    if (
      !teamId ||
      !name ||
      !scheduleTime ||
      !questions ||
      questions.length === 0
    ) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    const teamData = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), isNull(team.deletedAt)),
    });

    if (!teamData) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, teamData.organizationId),
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

    // Check standup limit using centralized function
    const limitCheck = await checkStandupLimit(teamId, teamData.organizationId);

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Standup limit reached (${limitCheck.currentCount}/${limitCheck.limit}). Please upgrade your subscription.`,
        },
        { status: 403 }
      );
    }

    // Plan gate: clamp voice to false for free orgs regardless of what was sent
    const voiceAllowed = await canUseVoice(teamData.organizationId);
    const effectiveVoice = voiceAllowed
      ? allowVoiceResponses !== undefined
        ? allowVoiceResponses
        : true
      : false;

    const [newStandup] = await db
      .insert(standupConfig)
      .values({
        id: nanoid(),
        teamId,
        name,
        timezone: timezone || "UTC",
        scheduleTime,
        scheduleDays: scheduleDays || [1, 2, 3, 4, 5],
        questions,
        allowVoiceResponses: effectiveVoice,
        reminderMinutes: reminderMinutes || 30,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ standup: newStandup }, { status: 201 });
  } catch (error) {
    console.error("Error creating standup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
