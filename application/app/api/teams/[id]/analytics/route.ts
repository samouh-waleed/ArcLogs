// app/api/teams/[id]/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  standupResponse,
  insight,
  helpRequest,
  team,
  member,
  teamMember,
} from "@/drizzle/schema";
import { eq, and, isNull, gte, sql, desc } from "drizzle-orm";
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

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");
    const teamId = params.id;

    // Verify access
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

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Get response rate over time
    const responseRateData = await db.execute(sql`
      SELECT 
        response_date::date as date,
        COUNT(DISTINCT user_id) as response_count,
        (SELECT COUNT(*) FROM team_member WHERE team_id = ${teamId} AND deleted_at IS NULL) as total_members
      FROM standup_response
      WHERE team_id = ${teamId}
        AND response_date >= ${startDateStr}
        AND deleted_at IS NULL
      GROUP BY response_date
      ORDER BY response_date ASC
    `);

    // Get sentiment distribution over time
    const sentimentData = await db.execute(sql`
      SELECT 
        response_date::date as date,
        ai_insights->>'sentiment' as sentiment,
        COUNT(*) as count
      FROM standup_response
      WHERE team_id = ${teamId}
        AND response_date >= ${startDateStr}
        AND deleted_at IS NULL
        AND processing_status = 'completed'
        AND ai_insights IS NOT NULL
      GROUP BY response_date, ai_insights->>'sentiment'
      ORDER BY response_date ASC
    `);

    // Get blocker trends
    const blockerData = await db.execute(sql`
      SELECT 
        insight_date::date as date,
        COUNT(*) as count,
        severity
      FROM insight
      WHERE team_id = ${teamId}
        AND insight_date >= ${startDateStr}
        AND insight_type = 'blocker'
        AND deleted_at IS NULL
      GROUP BY insight_date, severity
      ORDER BY insight_date ASC
    `);

    // Get help request stats
    const helpRequestData = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        status,
        COUNT(*) as count
      FROM help_request
      WHERE team_id = ${teamId}
        AND created_at >= ${startDate.toISOString()}
        AND deleted_at IS NULL
      GROUP BY DATE(created_at), status
      ORDER BY DATE(created_at) ASC
    `);

    // Get member participation stats
    const memberParticipation = await db.execute(sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(DISTINCT sr.response_date) as days_responded,
        AVG(CASE WHEN sr.ai_insights->>'sentiment' = 'positive' THEN 1 
                 WHEN sr.ai_insights->>'sentiment' = 'neutral' THEN 0.5 
                 ELSE 0 END) as avg_sentiment_score
      FROM team_member tm
      JOIN "user" u ON tm.user_id = u.id
      LEFT JOIN standup_response sr ON sr.user_id = u.id 
        AND sr.team_id = ${teamId}
        AND sr.response_date >= ${startDateStr}
        AND sr.deleted_at IS NULL
      WHERE tm.team_id = ${teamId}
        AND tm.deleted_at IS NULL
      GROUP BY u.id, u.name, u.email
      ORDER BY days_responded DESC
    `);

    // Get top blockers
    const topBlockers = await db.execute(sql`
      SELECT 
        description,
        severity,
        status,
        created_at
      FROM insight
      WHERE team_id = ${teamId}
        AND insight_type = 'blocker'
        AND insight_date >= ${startDateStr}
        AND deleted_at IS NULL
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          ELSE 4 
        END,
        created_at DESC
      LIMIT 10
    `);

    // Get overall stats
    const totalResponses = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM standup_response
      WHERE team_id = ${teamId}
        AND response_date >= ${startDateStr}
        AND deleted_at IS NULL
    `);

    const totalBlockers = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM insight
      WHERE team_id = ${teamId}
        AND insight_type = 'blocker'
        AND insight_date >= ${startDateStr}
        AND deleted_at IS NULL
    `);

    const totalHelpRequests = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
      FROM help_request
      WHERE team_id = ${teamId}
        AND created_at >= ${startDate.toISOString()}
        AND deleted_at IS NULL
    `);

    const avgResponseTime = await db.execute(sql`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_seconds
      FROM standup_response
      WHERE team_id = ${teamId}
        AND response_date >= ${startDateStr}
        AND processing_status = 'completed'
        AND deleted_at IS NULL
    `);

    return NextResponse.json({
      responseRate: responseRateData.rows,
      sentiment: sentimentData.rows,
      blockers: blockerData.rows,
      helpRequests: helpRequestData.rows,
      memberParticipation: memberParticipation.rows,
      topBlockers: topBlockers.rows,
      stats: {
        totalResponses: Number(totalResponses.rows[0]?.count) || 0,
        totalBlockers: Number(totalBlockers.rows[0]?.count) || 0,
        totalHelpRequests: Number(totalHelpRequests.rows[0]?.total) || 0,
        resolvedHelpRequests: Number(totalHelpRequests.rows[0]?.resolved) || 0,
        avgProcessingTime: Math.round(
          Number(avgResponseTime.rows[0]?.avg_seconds) || 0
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
