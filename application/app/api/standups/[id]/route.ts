// app/api/standups/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { standupConfig, team, member } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

    const { id: standupId } = await params;

    const standup = await db.query.standupConfig.findFirst({
      where: and(
        eq(standupConfig.id, standupId),
        isNull(standupConfig.deletedAt)
      ),
      with: {
        team: true,
      },
    });

    if (!standup) {
      return NextResponse.json({ error: "Standup not found" }, { status: 404 });
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, standup.team.organizationId),
        eq(member.userId, session.user.id),
        isNull(member.deletedAt)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ standup });
  } catch (error) {
    console.error("Error fetching standup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { id: standupId } = await params;
    const body = await req.json();

    const existingStandup = await db.query.standupConfig.findFirst({
      where: and(
        eq(standupConfig.id, standupId),
        isNull(standupConfig.deletedAt)
      ),
      with: {
        team: true,
      },
    });

    if (!existingStandup) {
      return NextResponse.json({ error: "Standup not found" }, { status: 404 });
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, existingStandup.team.organizationId),
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

    const [updatedStandup] = await db
      .update(standupConfig)
      .set({
        name: body.name || existingStandup.name,
        timezone:
          body.timezone !== undefined
            ? body.timezone
            : existingStandup.timezone,
        scheduleTime: body.scheduleTime || existingStandup.scheduleTime,
        scheduleDays: body.scheduleDays || existingStandup.scheduleDays,
        questions: body.questions || existingStandup.questions,
        allowVoiceResponses:
          body.allowVoiceResponses !== undefined
            ? body.allowVoiceResponses
            : existingStandup.allowVoiceResponses,
        reminderMinutes:
          body.reminderMinutes !== undefined
            ? body.reminderMinutes
            : existingStandup.reminderMinutes,
        isActive:
          body.isActive !== undefined
            ? body.isActive
            : existingStandup.isActive,
        updatedAt: new Date(),
      })
      .where(eq(standupConfig.id, standupId))
      .returning();

    return NextResponse.json({ standup: updatedStandup });
  } catch (error) {
    console.error("Error updating standup:", error);
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

    const { id: standupId } = await params;

    const existingStandup = await db.query.standupConfig.findFirst({
      where: and(
        eq(standupConfig.id, standupId),
        isNull(standupConfig.deletedAt)
      ),
      with: {
        team: true,
      },
    });

    if (!existingStandup) {
      return NextResponse.json({ error: "Standup not found" }, { status: 404 });
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, existingStandup.team.organizationId),
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

    await db
      .update(standupConfig)
      .set({ deletedAt: new Date() })
      .where(eq(standupConfig.id, standupId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting standup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
