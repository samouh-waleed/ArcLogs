// app/api/teams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { team, member, subscription } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

// Subscription limits
const LIMITS = {
  free: { teams: 1, membersPerTeam: 5, standups: 1 },
  trialing: { teams: 999, membersPerTeam: 999, standups: 999 },
  active: { teams: 999, membersPerTeam: 999, standups: 999 },
};

async function checkSubscriptionLimits(
  organizationId: string,
  type: "teams" | "members" | "standups",
  currentCount: number
) {
  const subscriptions = await db.query.subscription.findMany({
    where: eq(subscription.referenceId, organizationId),
  });

  const activeSubscription = subscriptions.find(
    (sub: any) => sub.status === "active" || sub.status === "trialing"
  );

  const status = activeSubscription?.status || "free";
  const limits = LIMITS[status as keyof typeof LIMITS] || LIMITS.free;

  switch (type) {
    case "teams":
      return currentCount < limits.teams;
    case "members":
      return currentCount < limits.membersPerTeam;
    case "standups":
      return currentCount < limits.standups;
    default:
      return false;
  }
}

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
      with: {
        teamMembers: {
          where: isNull(member.deletedAt),
        },
      },
      orderBy: (team, { desc }) => [desc(team.createdAt)],
    });

    return NextResponse.json({
      teams: teams.map((t) => ({
        ...t,
        memberCount: t.teamMembers.length,
      })),
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

    // Check team limit
    const existingTeams = await db.query.team.findMany({
      where: and(
        eq(team.organizationId, organizationId),
        isNull(team.deletedAt)
      ),
    });

    const canCreate = await checkSubscriptionLimits(
      organizationId,
      "teams",
      existingTeams.length
    );
    if (!canCreate) {
      return NextResponse.json(
        { error: "Team limit reached. Please upgrade your subscription." },
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
