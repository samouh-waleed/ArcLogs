// app/api/slack/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  slackWorkspace,
  subscription,
  standupResponse,
  teamMember,
  standupConfig,
} from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import crypto from "crypto";
import { nanoid } from "nanoid";
import { TeamMemberWithRelations } from "@/lib/db-types";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

function verifySlackSignature(
  signingSecret: string,
  body: string,
  timestamp: string,
  signature: string
): boolean {
  const hmac = crypto.createHmac("sha256", signingSecret);
  const [version, hash] = signature.split("=");
  const baseString = `${version}:${timestamp}:${body}`;
  const expectedHash = hmac.update(baseString).digest("hex");

  return hash === expectedHash;
}

async function sendSlackDM(
  botToken: string,
  userId: string,
  text: string,
  blocks?: any[]
) {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${botToken}`,
    },
    body: JSON.stringify({
      channel: userId,
      text,
      blocks,
    }),
  });

  return response.json();
}

function parseStandupResponse(
  text: string,
  questions: any[]
): Record<string, string> {
  const responses: Record<string, string> = {};

  const lines = text.split("\n").filter((line) => line.trim());

  questions.forEach((question, index) => {
    const questionNum = index + 1;

    const patterns = [
      new RegExp(`^${questionNum}[\\.\\):]\\s*(.+)`, "i"),
      new RegExp(`^Q${questionNum}[\\.\\):]?\\s*(.+)`, "i"),
      new RegExp(`^Question\\s*${questionNum}[\\.\\):]?\\s*(.+)`, "i"),
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          responses[question.id] = match[1].trim();
          break;
        }
      }
      if (responses[question.id]) break;
    }

    if (!responses[question.id] && lines[index]) {
      if (!/^\d+[\.\):]/.test(lines[index])) {
        responses[question.id] = lines[index].trim();
      }
    }
  });

  return responses;
}

async function sendToSQS(message: any) {
  try {
    const command = new SendMessageCommand({
      QueueUrl: process.env.AWS_SQS_QUEUE_URL!,
      MessageBody: JSON.stringify(message),
    });

    await sqsClient.send(command);
    console.log("✅ Sent message to SQS");
  } catch (error) {
    console.error("❌ Failed to send to SQS:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const timestamp = req.headers.get("x-slack-request-timestamp");
    const signature = req.headers.get("x-slack-signature");

    if (
      timestamp &&
      signature &&
      !verifySlackSignature(
        process.env.SLACK_SIGNING_SECRET!,
        body,
        timestamp,
        signature
      )
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.type === "url_verification") {
      return NextResponse.json({ challenge: event.challenge });
    }

    if (event.type === "event_callback") {
      const slackEvent = event.event;
      const teamId = event.team_id;

      const workspace = await db.query.slackWorkspace.findFirst({
        where: eq(slackWorkspace.slackTeamId, teamId),
        with: {
          organization: true,
        },
      });

      if (!workspace) {
        console.error("Workspace not found for team:", teamId);
        return NextResponse.json({ ok: true });
      }

      const activeSubscription = await db.query.subscription.findFirst({
        where: eq(subscription.referenceId, workspace.organizationId),
      });

      if (
        !activeSubscription ||
        (activeSubscription.status !== "active" &&
          activeSubscription.status !== "trialing")
      ) {
        await sendSlackDM(
          workspace.botToken,
          workspace.installedBy!,
          "⚠️ Your ArcLogs subscription is inactive. Please update payment at " +
            process.env.NEXT_PUBLIC_APP_URL
        );
        return NextResponse.json({ ok: true });
      }

      switch (slackEvent.type) {
        case "message":
          if (slackEvent.channel_type === "im" && !slackEvent.bot_id) {
            await handleStandupResponse(slackEvent, workspace);
          }
          break;

        case "app_mention":
          await handleMention(slackEvent, workspace);
          break;

        default:
          console.log("Unhandled event type:", slackEvent.type);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Slack event error:", error);
    return NextResponse.json({ ok: true });
  }
}

async function handleStandupResponse(event: any, workspace: any) {
  try {
    const slackUserId = event.user;
    const messageText = event.text;

    const member = (await db.query.teamMember.findFirst({
      where: and(
        eq(teamMember.slackUserId, slackUserId),
        isNull(teamMember.deletedAt)
      ),
      with: {
        team: {
          with: {
            standupConfigs: {
              where: and(
                eq(standupConfig.isActive, true),
                isNull(standupConfig.deletedAt)
              ),
            },
          },
        },
        user: true,
      },
    })) as TeamMemberWithRelations | undefined;

    if (!member || !member.team.standupConfigs.length) {
      return;
    }

    const config = member.team.standupConfigs[0];

    const responses = parseStandupResponse(messageText, config.questions);

    const missingRequired = config.questions
      .filter((q: any) => q.required && !responses[q.id])
      .map((q: any) => q.text);

    if (missingRequired.length > 0) {
      await sendSlackDM(
        workspace.botToken,
        slackUserId,
        `⚠️ Please answer all required questions:\n\n${missingRequired
          .map((q, i) => `${i + 1}. ${q}`)
          .join("\n")}`
      );
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const [savedResponse] = await db
      .insert(standupResponse)
      .values({
        id: nanoid(),
        standupConfigId: config.id,
        teamId: member.teamId,
        userId: member.userId,
        slackUserId,
        slackMessageTs: event.ts,
        responseDate: today,
        responses,
        responseType: "text",
        processingStatus: "pending",
      })
      .returning();

    await sendSlackDM(
      workspace.botToken,
      slackUserId,
      "✅ Thanks! Your standup update has been saved and will be processed."
    );

    await sendToSQS({
      type: "standup_response",
      responseId: savedResponse.id,
      responses,
      userId: member.userId,
      teamId: member.teamId,
    });

    console.log(`✅ Saved standup response from ${member.user.email}`);
  } catch (error) {
    console.error("Error handling standup response:", error);
  }
}

async function handleMention(event: any, workspace: any) {
  const text = event.text.toLowerCase();

  if (text.includes("help")) {
    await sendSlackDM(
      workspace.botToken,
      event.user,
      "👋 *ArcLogs Help*\n\nI'll send you standup questions based on your team's schedule. Just reply to my messages with numbered answers!\n\nExample:\n1. Fixed bug #123\n2. Will deploy today\n3. No blockers\n\nNeed more help? Visit " +
        process.env.NEXT_PUBLIC_APP_URL
    );
  }
}
