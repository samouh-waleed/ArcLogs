// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { team, teamMember, teamUpdate } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { eq, and, isNull, gte, sql, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active organization
    const activeOrg = await auth.api.getFullOrganization({
      headers: request.headers,
    });

    if (!activeOrg) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 400 }
      );
    }

    // Get all teams in organization
    const allTeams = await db.query.team.findMany({
      where: and(eq(team.organizationId, activeOrg.id), isNull(team.deletedAt)),
      with: {
        teamMembers: {
          where: isNull(teamMember.deletedAt),
        },
      },
    });

    // Filter teams user is a member of
    const myTeams = allTeams.filter((t) =>
      t.teamMembers.some((tm) => tm.userId === session.user.id)
    );

    // Count teams where user is a leader
    const leaderTeamsCount = myTeams.filter((t) => {
      const member = t.teamMembers.find((tm) => tm.userId === session.user.id);
      return member?.role === "leader";
    }).length;

    // Get team IDs user is a member of
    const myTeamIds = myTeams.map((t) => t.id);

    // Count updates today from user's teams
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let updatesToday = 0;
    if (myTeamIds.length > 0) {
      const updatesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(teamUpdate)
        .where(
          and(
            inArray(teamUpdate.teamId, myTeamIds),
            gte(teamUpdate.updateDate, today),
            isNull(teamUpdate.deletedAt)
          )
        );

      updatesToday = Number(updatesResult[0]?.count || 0);
    }

    let myUpdatesToday = 0;
    if (myTeamIds.length > 0) {
      const myUpdatesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(teamUpdate)
        .where(
          and(
            inArray(teamUpdate.teamId, myTeamIds),
            eq(teamUpdate.userId, session.user.id),
            gte(teamUpdate.updateDate, today),
            isNull(teamUpdate.deletedAt)
          )
        );

      myUpdatesToday = Number(myUpdatesResult[0]?.count || 0);
    }

    // Count total organization members
    const orgMembersCount = activeOrg.members?.length || 0;

    // Calculate stats
    const stats = {
      totalTeams: allTeams.length,
      myTeamsCount: myTeams.length,
      leaderTeamsCount,
      orgMembersCount,
      updatesToday,
      myUpdatesToday,
      hasSubmittedToday: myUpdatesToday > 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
