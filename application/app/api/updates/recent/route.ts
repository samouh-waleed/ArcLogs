// app/api/updates/recent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teamUpdate, team, teamMember } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { eq, and, isNull, desc, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get search params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get all teams the user is a member of
    const userTeamMemberships = await db.query.teamMember.findMany({
      where: and(
        eq(teamMember.userId, session.user.id),
        isNull(teamMember.deletedAt)
      ),
    });

    const userTeamIds = userTeamMemberships.map((tm) => tm.teamId);

    if (userTeamIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get recent updates from all teams user is a member of
    const updates = await db.query.teamUpdate.findMany({
      where: and(
        inArray(teamUpdate.teamId, userTeamIds),
        isNull(teamUpdate.deletedAt)
      ),
      orderBy: [desc(teamUpdate.createdAt)],
      limit,
      offset,
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          columns: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json(updates);
  } catch (error) {
    console.error("Error fetching recent updates:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent updates" },
      { status: 500 }
    );
  }
}
