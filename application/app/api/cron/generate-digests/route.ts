// app/api/cron/generate-digests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { db } from "@/lib/db";
import { team, standupConfig } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
  try {
    if (!verifyCronSecret(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("📊 Generating daily digests");

    // Get all teams with active standups
    const teams = await db.query.team.findMany({
      where: and(isNull(team.deletedAt), isNull(team.archivedAt)),
      with: {
        standupConfigs: {
          where: and(
            eq(standupConfig.isActive, true),
            isNull(standupConfig.deletedAt)
          ),
        },
      },
    });

    const today = new Date().toISOString().split("T")[0];
    let sent = 0;

    for (const t of teams) {
      if (t.standupConfigs.length > 0 && t.slackChannelId) {
        // Send digest generation request to SQS
        const command = new SendMessageCommand({
          QueueUrl: process.env.AWS_SQS_QUEUE_URL!,
          MessageBody: JSON.stringify({
            type: "generate_digest",
            teamId: t.id,
            date: today,
          }),
        });

        await sqsClient.send(command);
        sent++;
        console.log(`✅ Queued digest for team ${t.name}`);
      }
    }

    return NextResponse.json({
      success: true,
      digests_queued: sent,
    });
  } catch (error) {
    console.error("Digest generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
