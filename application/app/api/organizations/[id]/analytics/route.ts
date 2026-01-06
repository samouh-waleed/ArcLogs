// app/api/organizations/[id]/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { standupResponse, team, member, organization } from "@/drizzle/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
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

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");
    const { id: orgId } = await params;

    // Verify access
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

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Get team stats
    const teamStats = await db.execute(sql`
      SELECT 
        t.id,
        t.name,
        COUNT(DISTINCT sr.user_id) as active_members,
        COUNT(DISTINCT sr.response_date) as active_days,
        COUNT(sr.id) as total_responses,
        AVG(CASE WHEN sr.ai_insights->>'sentiment' = 'positive' THEN 1 
                 WHEN sr.ai_insights->>'sentiment' = 'neutral' THEN 0.5 
                 ELSE 0 END) as avg_sentiment
      FROM team t
      LEFT JOIN standup_response sr ON sr.team_id = t.id 
        AND sr.response_date >= ${startDateStr}
        AND sr.deleted_at IS NULL
      WHERE t.organization_id = ${orgId}
        AND t.deleted_at IS NULL
      GROUP BY t.id, t.name
      ORDER BY total_responses DESC
    `);

    // Get org-wide response rate
    const responseRate = await db.execute(sql`
      SELECT 
        response_date::date as date,
        COUNT(DISTINCT user_id) as responses
      FROM standup_response sr
      JOIN team t ON sr.team_id = t.id
      WHERE t.organization_id = ${orgId}
        AND sr.response_date >= ${startDateStr}
        AND sr.deleted_at IS NULL
      GROUP BY response_date
      ORDER BY response_date ASC
    `);

    // Get org-wide sentiment
    const sentiment = await db.execute(sql`
      SELECT 
        ai_insights->>'sentiment' as sentiment,
        COUNT(*) as count
      FROM standup_response sr
      JOIN team t ON sr.team_id = t.id
      WHERE t.organization_id = ${orgId}
        AND sr.response_date >= ${startDateStr}
        AND sr.deleted_at IS NULL
        AND sr.processing_status = 'completed'
      GROUP BY ai_insights->>'sentiment'
    `);

    return NextResponse.json({
      teams: teamStats.rows,
      responseRate: responseRate.rows,
      sentiment: sentiment.rows,
    });
  } catch (error) {
    console.error("Error fetching org analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
