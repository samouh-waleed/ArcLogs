import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teamUpdate, teamMember, dailyQuestion, team } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";
import { eq, and, isNull, gte } from "drizzle-orm";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

// Initialize SQS client
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const QUEUE_URL = process.env.AWS_SQS_QUEUE_URL!;

// Get updates for a team
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // YYYY-MM-DD format

    // Verify user has access to this team
    const teamData = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), isNull(team.deletedAt)),
    });

    if (!teamData) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const activeOrg = await auth.api.getFullOrganization({
      headers: request.headers,
    });

    if (!activeOrg || activeOrg.id !== teamData.organizationId) {
      return NextResponse.json(
        { error: "Not authorized for this organization" },
        { status: 403 }
      );
    }

    // Check if user is org owner/admin or team member
    const userOrgMember = activeOrg.members.find(
      (m) => m.userId === session.user.id
    );
    const isOrgOwnerOrAdmin =
      userOrgMember?.role === "owner" || userOrgMember?.role === "admin";

    const userTeamMember = await db.query.teamMember.findFirst({
      where: and(
        eq(teamMember.teamId, teamId),
        eq(teamMember.userId, session.user.id),
        isNull(teamMember.deletedAt)
      ),
    });

    if (!isOrgOwnerOrAdmin && !userTeamMember) {
      return NextResponse.json(
        { error: "You do not have access to this team" },
        { status: 403 }
      );
    }

    // Get updates for date or today
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const updates = await db.query.teamUpdate.findMany({
      where: and(
        eq(teamUpdate.teamId, teamId),
        gte(teamUpdate.updateDate, targetDate),
        isNull(teamUpdate.deletedAt)
      ),
      with: {
        user: true,
      },
      orderBy: (updates, { desc }) => [desc(updates.createdAt)],
    });

    // Filter based on team settings if regular member
    const isTeamLeader = userTeamMember?.role === "leader";
    const canSeeAllUpdates =
      isOrgOwnerOrAdmin || isTeamLeader || teamData.membersCanSeeUpdates;

    const filteredUpdates = canSeeAllUpdates
      ? updates
      : updates.filter((u) => u.userId === session.user.id);

    return NextResponse.json({ updates: filteredUpdates });
  } catch (error) {
    console.error("Error fetching updates:", error);
    return NextResponse.json(
      { error: "Failed to fetch updates" },
      { status: 500 }
    );
  }
}

// Submit a new update
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Verify user is a team member
    const teamData = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), isNull(team.deletedAt)),
    });

    if (!teamData) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const userTeamMember = await db.query.teamMember.findFirst({
      where: and(
        eq(teamMember.teamId, teamId),
        eq(teamMember.userId, session.user.id),
        isNull(teamMember.deletedAt)
      ),
    });

    if (!userTeamMember) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      content, // { questionId: answer }
      updateType, // 'voice' | 'text'
      voiceUrl,
      voiceTranscript,
      voiceDurationSeconds,
      updateDate, // Optional, defaults to today
    } = body;

    if (!content || typeof content !== "object") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (!updateType || !["voice", "text"].includes(updateType)) {
      return NextResponse.json(
        { error: "Update type must be 'voice' or 'text'" },
        { status: 400 }
      );
    }

    // Validate required questions are answered
    const questions = await db.query.dailyQuestion.findMany({
      where: and(
        eq(dailyQuestion.teamId, teamId),
        isNull(dailyQuestion.deletedAt),
        eq(dailyQuestion.required, true)
      ),
    });

    const missingRequired = questions.filter(
      (q) => !content[q.id] || content[q.id].trim() === ""
    );

    if (missingRequired.length > 0) {
      return NextResponse.json(
        {
          error: "Please answer all required questions",
          missingQuestions: missingRequired.map((q) => q.question),
        },
        { status: 400 }
      );
    }

    // Check if user already submitted update for this date
    const targetDate = updateDate ? new Date(updateDate) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const existingUpdate = await db.query.teamUpdate.findFirst({
      where: and(
        eq(teamUpdate.teamId, teamId),
        eq(teamUpdate.userId, session.user.id),
        gte(teamUpdate.updateDate, targetDate),
        isNull(teamUpdate.deletedAt)
      ),
    });

    if (existingUpdate) {
      return NextResponse.json(
        { error: "You have already submitted an update for today" },
        { status: 400 }
      );
    }

    // Create update
    const updateId = nanoid();
    await db.insert(teamUpdate).values({
      id: updateId,
      teamId,
      userId: session.user.id,
      updateDate: targetDate,
      content,
      updateType,
      voiceUrl: voiceUrl || null,
      voiceTranscript: voiceTranscript || null,
      voiceDurationSeconds: voiceDurationSeconds || null,
      processingStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send message to SQS for AI processing
    try {
      const command = new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({
          updateId,
          teamId,
          userId: session.user.id,
          organizationId: teamData.organizationId,
          updateType,
          content,
          voiceTranscript: voiceTranscript || null,
          timestamp: new Date().toISOString(),
        }),
        MessageAttributes: {
          updateType: {
            DataType: "String",
            StringValue: updateType,
          },
          teamId: {
            DataType: "String",
            StringValue: teamId,
          },
        },
      });

      await sqsClient.send(command);
      console.log(`Update ${updateId} sent to SQS for processing`);
    } catch (sqsError) {
      console.error("Failed to send to SQS:", sqsError);
      // Don't fail the request if SQS fails - update is still saved
      // We can retry processing later
    }

    // Fetch the created update
    const newUpdate = await db.query.teamUpdate.findFirst({
      where: eq(teamUpdate.id, updateId),
      with: {
        user: true,
      },
    });

    return NextResponse.json(
      {
        update: newUpdate,
        message: "Update submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting update:", error);
    return NextResponse.json(
      { error: "Failed to submit update" },
      { status: 500 }
    );
  }
}
