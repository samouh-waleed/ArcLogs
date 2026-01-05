// app/api/teams/[teamId]/questions/calendar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyQuestion, teamMember } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { eq, and, isNull, or, lte, gte, sql } from "drizzle-orm";

// Helper function to check if question is active on a specific date
function isQuestionActiveOnDate(question: any, date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const dateString = date.toISOString().split("T")[0];

  // Check effective date range
  if (question.effectiveFrom && new Date(question.effectiveFrom) > date) {
    return false;
  }
  if (question.effectiveUntil && new Date(question.effectiveUntil) < date) {
    return false;
  }

  if (!question.isActive) {
    return false;
  }

  const config = question.scheduleConfig || {};

  switch (question.scheduleType) {
    case "daily":
      return config.enabled !== false;

    case "weekly":
      // config.days is array like [1, 3, 5] for Mon, Wed, Fri
      return config.days?.includes(dayOfWeek) ?? false;

    case "specific_dates":
      // config.dates is array like ["2025-01-15", "2025-01-20"]
      return config.dates?.includes(dateString) ?? false;

    case "custom":
      // Custom patterns can be extended
      if (config.pattern === "every_other_day") {
        const startDate = new Date(config.start_date || question.createdAt);
        const daysDiff = Math.floor(
          (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysDiff % 2 === 0;
      }
      return false;

    default:
      return true; // Default to always active
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get("start_date"); // YYYY-MM-DD
    const endDateStr = searchParams.get("end_date"); // YYYY-MM-DD
    const dateStr = searchParams.get("date"); // Single date YYYY-MM-DD

    // Check team membership
    const teamMemberData = await db.query.teamMember.findFirst({
      where: and(
        eq(teamMember.teamId, teamId),
        eq(teamMember.userId, session.user.id),
        isNull(teamMember.deletedAt)
      ),
    });

    if (!teamMemberData) {
      return NextResponse.json(
        { error: "Not a member of this team" },
        { status: 403 }
      );
    }

    // Get all questions for the team
    const questions = await db.query.dailyQuestion.findMany({
      where: and(
        eq(dailyQuestion.teamId, teamId),
        isNull(dailyQuestion.deletedAt),
        eq(dailyQuestion.isActive, true)
      ),
      orderBy: (dailyQuestion, { asc }) => [asc(dailyQuestion.order)],
    });

    // If single date requested
    if (dateStr) {
      const date = new Date(dateStr);
      const activeQuestions = questions.filter((q) =>
        isQuestionActiveOnDate(q, date)
      );

      return NextResponse.json({
        date: dateStr,
        questions: activeQuestions,
      });
    }

    // If date range requested, return calendar data
    if (startDateStr && endDateStr) {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      const calendar: Record<string, any[]> = {};

      // Iterate through each day in range
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateKey = d.toISOString().split("T")[0];
        const activeQuestions = questions.filter((q) =>
          isQuestionActiveOnDate(q, new Date(d))
        );
        calendar[dateKey] = activeQuestions;
      }

      return NextResponse.json({
        start_date: startDateStr,
        end_date: endDateStr,
        calendar,
      });
    }

    // Default: return all questions with their schedules
    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions calendar:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions calendar" },
      { status: 500 }
    );
  }
}
