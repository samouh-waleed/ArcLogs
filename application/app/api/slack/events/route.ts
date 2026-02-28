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
import { decrypt } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
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

// Audio file detection
const MAX_AUDIO_DURATION_SECONDS = 300; // 5 minutes
const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024; // 25MB (Whisper API limit)

function isAudioFile(file: any): boolean {
  const mimetype = file?.mimetype || "";
  // Accept any audio/* type, plus video/webm (Slack clips sometimes use this)
  return mimetype.startsWith("audio/") || mimetype === "video/webm";
}

function findAudioFile(files?: any[]): any | null {
  if (!Array.isArray(files) || files.length === 0) return null;
  return files.find((f: any) => isAudioFile(f)) || null;
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

      // Rate limit: 60 events per minute per workspace
      const rl = rateLimit(`slack:${teamId}`, { limit: 60, windowSeconds: 60 });
      if (!rl.allowed) {
        return NextResponse.json({ error: "Rate limited" }, { status: 429 });
      }

      console.log("📨 Received event:", {
        type: slackEvent.type,
        channel_type: slackEvent.channel_type,
        user: slackEvent.user,
        bot_id: slackEvent.bot_id,
        subtype: slackEvent.subtype,
      });

      const workspace = await db.query.slackWorkspace.findFirst({
        where: eq(slackWorkspace.slackTeamId, teamId),
        with: {
          organization: true,
        },
      });

      if (!workspace) {
        console.error("❌ Workspace not found for team:", teamId);
        return NextResponse.json({ ok: true });
      }

      // Decrypt the bot token once here; all downstream helpers receive it
      // already decrypted so they never touch the raw encrypted value.
      const workspaceDecrypted = {
        ...workspace,
        botToken: decrypt(workspace.botToken),
      };

      console.log("✅ Workspace found:", workspace.slackTeamName);

      const activeSubscription = await db.query.subscription.findFirst({
        where: eq(subscription.referenceId, workspace.organizationId),
      });

      if (
        !activeSubscription ||
        (activeSubscription.status !== "active" &&
          activeSubscription.status !== "trialing")
      ) {
        await sendSlackDM(
          workspaceDecrypted.botToken,
          workspaceDecrypted.installedBy!,
          "⚠️ Your ArcLogs subscription is inactive. Please update payment at " +
            process.env.NEXT_PUBLIC_APP_URL
        );
        return NextResponse.json({ ok: true });
      }

      switch (slackEvent.type) {
        case "message":
          if (slackEvent.channel_type === "im" && !slackEvent.bot_id && (!slackEvent.subtype || slackEvent.subtype === "file_share")) {
            await handleStandupResponse(slackEvent, workspaceDecrypted);
          }
          break;

        case "app_mention":
          await handleMention(slackEvent, workspaceDecrypted);
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

    // Check if this message contains an audio file
    const audioFile = findAudioFile(event.files);
    if (audioFile) {
      await handleAudioStandupResponse(event, workspace, audioFile);
      return;
    }

    const messageText = event.text;
    const threadTs = event.thread_ts as string | undefined;

    console.log("💬 Processing standup response:", {
      slackUserId,
      threadTs,
      messageText: messageText?.substring(0, 50) + "...",
    });

    // ── Thread-based routing ──────────────────────────────────────────────
    // When the user replies in a thread, thread_ts equals the bot's original
    // message ts. We pre-created a standup_response with that ts, so we can
    // find the exact config even when the user is in multiple teams.
    let pendingRecord: any = null;
    if (threadTs) {
      pendingRecord = await db.query.standupResponse.findFirst({
        where: and(
          eq(standupResponse.slackUserId, slackUserId),
          eq(standupResponse.slackMessageTs, threadTs),
          isNull(standupResponse.deletedAt)
        ),
        with: {
          standupConfig: {
            with: {
              team: true,
            },
          },
        },
      });
    }

    let config: any;
    let member: TeamMemberWithRelations | undefined;

    if (pendingRecord?.standupConfig) {
      // Thread reply matched a specific standup — use it directly.
      config = pendingRecord.standupConfig;
      member = (await db.query.teamMember.findFirst({
        where: and(
          eq(teamMember.slackUserId, slackUserId),
          eq(teamMember.teamId, config.teamId),
          isNull(teamMember.deletedAt)
        ),
        with: { team: { with: { standupConfigs: true } }, user: true },
      })) as TeamMemberWithRelations | undefined;
      console.log("🧵 Thread reply matched standup for team:", config.team?.name);
    } else {
      // ── Fallback: direct DM reply ─────────────────────────────────────
      // Find the oldest unanswered standup for this user today.
      // Uses findMany across all team memberships to avoid always picking
      // the same team when the user is in multiple teams.
      const today = new Date().toISOString().split("T")[0];

      const allMembers = await db.query.teamMember.findMany({
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
      });

      if (!allMembers.length) {
        console.log("⚠️ No team member found for Slack user:", slackUserId);
        return;
      }

      // Find the first team with an unanswered standup today
      let chosenMember: TeamMemberWithRelations | undefined;
      for (const m of allMembers as TeamMemberWithRelations[]) {
        if (!m.team.standupConfigs.length) continue;
        const cfg = m.team.standupConfigs[0];
        const existing = await db.query.standupResponse.findFirst({
          where: and(
            eq(standupResponse.standupConfigId, cfg.id),
            eq(standupResponse.userId, m.userId),
            eq(standupResponse.responseDate, today),
            isNull(standupResponse.deletedAt)
          ),
        });
        // Pick the first team with no completed response yet
        if (!existing || existing.processingStatus === "awaiting_response") {
          chosenMember = m;
          break;
        }
      }

      if (!chosenMember) {
        // All standups answered — take first membership as fallback
        chosenMember = allMembers[0] as TeamMemberWithRelations;
      }

      member = chosenMember;

      if (!member.team.standupConfigs.length) {
        console.log("⚠️ No active standup config for team:", member.teamId);
        return;
      }

      config = member.team.standupConfigs[0];

      // If user is in multiple teams with pending standups, let them know
      // they should reply in the thread next time.
      const teamsWithPending = (allMembers as TeamMemberWithRelations[]).filter(
        (m) => m.team.standupConfigs.length > 0 && m.teamId !== member!.teamId
      );
      if (teamsWithPending.length > 0) {
        const otherTeams = teamsWithPending
          .map((m) => `*${m.team.name}*`)
          .join(", ");
        await sendSlackDM(
          workspace.botToken,
          slackUserId,
          `ℹ️ Your response has been recorded for *${member.team.name}*.\n\nYou also have pending standups for: ${otherTeams}.\n_Tip: Reply directly in each standup's thread to answer the right team's questions._`
        );
      }
    }

    console.log("✅ Resolved member and config:", {
      memberEmail: member?.user?.email,
      teamName: member?.team?.name,
      configId: config?.id,
    });

    if (!member) {
      console.log("⚠️ Could not resolve team member for Slack user:", slackUserId);
      return;
    }

    const responses = parseStandupResponse(messageText, config.questions);

    const missingRequired = config.questions
      .filter((q: any) => q.required && !responses[q.id])
      .map((q: any) => q.text);

    if (missingRequired.length > 0) {
      await sendSlackDM(
        workspace.botToken,
        slackUserId,
        `⚠️ Please answer all required questions for *${member.team.name}*:\n\n${missingRequired
          .map((q: string, i: number) => `${i + 1}. ${q}`)
          .join("\n")}`
      );
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    // Use the pre-created record if available (thread reply path), otherwise query
    const existingResponse =
      pendingRecord?.standupConfig?.id === config.id
        ? pendingRecord
        : await db.query.standupResponse.findFirst({
            where: and(
              eq(standupResponse.userId, member.userId),
              eq(standupResponse.teamId, member.teamId),
              eq(standupResponse.standupConfigId, config.id),
              eq(standupResponse.responseDate, today),
              isNull(standupResponse.deletedAt)
            ),
          });

    let savedResponse;
    let isUpdate = false;

    if (existingResponse) {
      // Update existing response
      console.log("🔄 User already submitted today, updating existing response:", {
        existingId: existingResponse.id,
        userEmail: member.user.email,
      });

      const [updated] = await db
        .update(standupResponse)
        .set({
          responses,
          slackMessageTs: event.ts,
          processingStatus: "pending",
          updatedAt: new Date(),
        })
        .where(eq(standupResponse.id, existingResponse.id))
        .returning();

      savedResponse = updated;
      isUpdate = true;

      await sendSlackDM(
        workspace.botToken,
        slackUserId,
        `✏️ Your *${member.team.name}* standup has been updated and will be reprocessed.`
      );
    } else {
      // Create new response
      console.log("📝 Creating new standup response for:", {
        userEmail: member.user.email,
        date: today,
      });

      const [created] = await db
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

      savedResponse = created;

      await sendSlackDM(
        workspace.botToken,
        slackUserId,
        `✅ Thanks! Your *${member.team.name}* standup has been saved and will be processed.`
      );
    }

    console.log("📤 Sending to SQS:", {
      type: "standup_response",
      responseId: savedResponse.id,
      teamId: member.teamId,
      isUpdate,
    });

    await sendToSQS({
      type: "standup_response",
      responseId: savedResponse.id,
      responses,
      userId: member.userId,
      teamId: member.teamId,
    });

    console.log(
      `✅ ${isUpdate ? "Updated" : "Saved"} standup response from ${member.user.email} and sent to SQS`
    );
  } catch (error) {
    console.error("Error handling standup response:", error);
  }
}

async function handleAudioStandupResponse(
  event: any,
  workspace: any,
  audioFile: any
) {
  try {
    const slackUserId = event.user;

    console.log("🎤 Processing audio standup response:", {
      slackUserId,
      fileName: audioFile.name,
      mimetype: audioFile.mimetype,
      size: audioFile.size,
    });

    // Validate file size
    if (audioFile.size > MAX_AUDIO_SIZE_BYTES) {
      await sendSlackDM(
        workspace.botToken,
        slackUserId,
        "⚠️ Audio file is too large (max 25MB). Please record a shorter response."
      );
      return;
    }

    // Validate duration if available
    const durationSeconds = audioFile.duration_ms
      ? Math.round(audioFile.duration_ms / 1000)
      : null;

    if (durationSeconds && durationSeconds > MAX_AUDIO_DURATION_SECONDS) {
      await sendSlackDM(
        workspace.botToken,
        slackUserId,
        "⚠️ Audio is too long (max 5 minutes). Please record a shorter response."
      );
      return;
    }

    // Find team member and standup config
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

    if (!member) {
      console.log("⚠️ No team member found for Slack user:", slackUserId);
      return;
    }

    if (!member.team.standupConfigs.length) {
      console.log("⚠️ No active standup config for team:", member.teamId);
      return;
    }

    const config = member.team.standupConfigs[0];

    // Check if voice responses are allowed for this standup
    if (!config.allowVoiceResponses) {
      await sendSlackDM(
        workspace.botToken,
        slackUserId,
        "⚠️ Voice responses are not enabled for this standup. Please type your response instead."
      );
      return;
    }

    console.log("✅ Found member and config for audio:", {
      memberEmail: member.user.email,
      teamName: member.team.name,
      configId: config.id,
    });

    const today = new Date().toISOString().split("T")[0];
    const voiceUrl = audioFile.url_private_download || audioFile.url_private;

    // Check for existing response today
    const existingResponse = await db.query.standupResponse.findFirst({
      where: and(
        eq(standupResponse.userId, member.userId),
        eq(standupResponse.teamId, member.teamId),
        eq(standupResponse.standupConfigId, config.id),
        eq(standupResponse.responseDate, today),
        isNull(standupResponse.deletedAt)
      ),
    });

    let savedResponse;
    let isUpdate = false;

    if (existingResponse) {
      console.log("🔄 Updating existing response with audio:", {
        existingId: existingResponse.id,
        userEmail: member.user.email,
      });

      const [updated] = await db
        .update(standupResponse)
        .set({
          responseType: "voice",
          voiceUrl,
          voiceDurationSeconds: durationSeconds,
          voiceTranscript: null,
          responses: {},
          slackMessageTs: event.ts,
          processingStatus: "pending",
          updatedAt: new Date(),
        })
        .where(eq(standupResponse.id, existingResponse.id))
        .returning();

      savedResponse = updated;
      isUpdate = true;
    } else {
      console.log("📝 Creating new audio standup response:", {
        userEmail: member.user.email,
        date: today,
      });

      const [created] = await db
        .insert(standupResponse)
        .values({
          id: nanoid(),
          standupConfigId: config.id,
          teamId: member.teamId,
          userId: member.userId,
          slackUserId,
          slackMessageTs: event.ts,
          responseDate: today,
          responses: {},
          responseType: "voice",
          voiceUrl,
          voiceDurationSeconds: durationSeconds,
          processingStatus: "pending",
        })
        .returning();

      savedResponse = created;
    }

    // Send immediate acknowledgment
    await sendSlackDM(
      workspace.botToken,
      slackUserId,
      `🎤 Got your audio${isUpdate ? " update" : ""}! Transcribing and processing...`
    );

    // Queue for worker processing with audio_standup type
    console.log("📤 Sending audio to SQS:", {
      type: "audio_standup",
      responseId: savedResponse.id,
      teamId: member.teamId,
      isUpdate,
    });

    await sendToSQS({
      type: "audio_standup",
      responseId: savedResponse.id,
      userId: member.userId,
      teamId: member.teamId,
      organizationId: member.team.organizationId,
    });

    console.log(
      `✅ ${isUpdate ? "Updated" : "Saved"} audio standup from ${member.user.email} and sent to SQS`
    );
  } catch (error) {
    console.error("Error handling audio standup response:", error);
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
