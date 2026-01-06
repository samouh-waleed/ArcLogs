// app/api/standups/[id]/responses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { standupResponse, standupConfig, team, member } from "@/drizzle/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const standupId = params.id;

    // Get standup config
    const config = await db.query.standupConfig.findFirst({
      where: and(
        eq(standupConfig.id, standupId),
        isNull(standupConfig.deletedAt)
      ),
      with: {
        team: true,
      },
    });

    if (!config) {
      return NextResponse.json({ error: "Standup not found" }, { status: 404 });
    }

    // Verify access
    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, config.team.organizationId),
        eq(member.userId, session.user.id),
        isNull(member.deletedAt)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get responses
    const responses = await db.query.standupResponse.findMany({
      where: and(
        eq(standupResponse.standupConfigId, standupId),
        isNull(standupResponse.deletedAt)
      ),
      with: {
        user: true,
      },
      orderBy: [
        desc(standupResponse.responseDate),
        desc(standupResponse.createdAt),
      ],
      limit: 50,
    });

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
