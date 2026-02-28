// app/api/teams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { team, member, teamMember } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { checkTeamLimit } from "@/lib/limits";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 }
      );
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, orgId),
        eq(member.userId, session.user.id),
        isNull(member.deletedAt)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const teams = await db.query.team.findMany({
      where: and(eq(team.organizationId, orgId), isNull(team.deletedAt)),
      orderBy: (team, { desc }) => [desc(team.createdAt)],
    });

    // Get member counts separately
    const teamsWithCounts = await Promise.all(
      teams.map(async (t) => {
        const members = await db.query.teamMember.findMany({
          where: and(eq(teamMember.teamId, t.id), isNull(teamMember.deletedAt)),
        });
        return {
          ...t,
          memberCount: members.length,
        };
      })
    );

    return NextResponse.json({
      teams: teamsWithCounts,
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
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
      name,
      description,
      slackChannelId,
      slackChannelName,
      organizationId,
    } = body;

    if (!name || !organizationId) {
      return NextResponse.json(
        { error: "Name and organizationId required" },
        { status: 400 }
      );
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, organizationId),
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

    // Check team limit using centralized function
    const limitCheck = await checkTeamLimit(organizationId);

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Team limit reached (${limitCheck.currentCount}/${limitCheck.limit}) on the ${limitCheck.plan} plan. Please upgrade your subscription.`,
        },
        { status: 403 }
      );
    }

    const [newTeam] = await db
      .insert(team)
      .values({
        id: nanoid(),
        name,
        description: description || null,
        organizationId,
        slackChannelId: slackChannelId || null,
        slackChannelName: slackChannelName || null,
      })
      .returning();

    return NextResponse.json({ team: newTeam }, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
