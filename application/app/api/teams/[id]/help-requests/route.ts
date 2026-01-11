// app/api/teams/[id]/help-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { helpRequest, team, member } from "@/drizzle/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
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

    const { id: teamId } = await params;

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

    const helpRequests = await db.query.helpRequest.findMany({
      where: and(eq(helpRequest.teamId, teamId), isNull(helpRequest.deletedAt)),
      with: {
        requester: true,
        response: true,
      },
      orderBy: [desc(helpRequest.createdAt)],
    });

    return NextResponse.json({ helpRequests });
  } catch (error) {
    console.error("Error fetching help requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
