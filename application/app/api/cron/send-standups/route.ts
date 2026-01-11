// app/api/cron/send-standups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  standupConfig,
  teamMember,
  slackWorkspace,
  subscription,
} from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { ConfigWithFullData } from "@/lib/db-types";

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${cronSecret}`;
}

function getCurrentTimeInfo(timezone: string) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "long",
  });

  const parts = formatter.formatToParts(now);
  const hour = parts.find((p) => p.type === "hour")?.value || "00";
  const minute = parts.find((p) => p.type === "minute")?.value || "00";
  const weekday = parts.find((p) => p.type === "weekday")?.value || "";

  const timeString = `${hour}:${minute}`;
  const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  return {
    time: timeString,
    day: dayMap[weekday] ?? 0,
  };
}

function buildStandupBlocks(questions: any[], standupConfigId: string) {
  const blocks: any[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "👋 *Time for your daily standup!*\n\nPlease answer the following questions:",
      },
    },
    {
      type: "divider",
    },
  ];

  questions.forEach((question, index) => {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${index + 1}. ${question.text}*${
          question.required ? " _(required)_" : ""
        }`,
      },
    });
  });

  blocks.push(
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Reply to this message with your answers. Number each response to match the questions above.\n\n_Example:_\n1. Fixed bug #123\n2. Will deploy to production\n3. No blockers",
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Standup ID: \`${standupConfigId}\``,
        },
      ],
    }
  );

  return blocks;
}

async function sendSlackDM(
  botToken: string,
  userId: string,
  text: string,
  blocks?: any[]
) {
  try {
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

    const data = await response.json();

    if (!data.ok) {
      console.error("Slack API error:", data);
      return { success: false, error: data.error };
    }

    return { success: true, messageTs: data.ts };
  } catch (error) {
    console.error("Error sending Slack DM:", error);
    return { success: false, error: "Network error" };
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!verifyCronSecret(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Cron job started - checking for standups to send");

    const configs = (await db.query.standupConfig.findMany({
      where: and(
        eq(standupConfig.isActive, true),
        isNull(standupConfig.deletedAt)
      ),
      with: {
        team: {
          with: {
            organization: true,
            teamMembers: {
              where: isNull(teamMember.deletedAt),
              with: {
                user: true,
              },
            },
          },
        },
      },
    })) as ConfigWithFullData[];

    console.log(`📋 Found ${configs.length} active standup configs`);

    let sentCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const config of configs) {
      try {
        const { time, day } = getCurrentTimeInfo(config.timezone);

        const timeMatches = config.scheduleTime === time;
        const dayMatches = config.scheduleDays.includes(day);

        if (!timeMatches || !dayMatches) {
          skippedCount++;
          continue;
        }

        console.log(`✅ Time match for "${config.name}" (${config.timezone})`);

        const subscriptions = await db.query.subscription.findMany({
          where: eq(subscription.referenceId, config.team.organizationId),
        });

        const activeSubscription = subscriptions.find(
          (sub: any) => sub.status === "active" || sub.status === "trialing"
        );

        if (!activeSubscription) {
          console.log(
            `⚠️ No active subscription for org ${config.team.organizationId}`
          );
          skippedCount++;
          continue;
        }

        const workspace = await db.query.slackWorkspace.findFirst({
          where: eq(slackWorkspace.organizationId, config.team.organizationId),
        });

        if (!workspace) {
          console.log(
            `⚠️ No Slack workspace for org ${config.team.organizationId}`
          );
          errors.push(`No Slack workspace for team ${config.team.name}`);
          skippedCount++;
          continue;
        }

        const blocks = buildStandupBlocks(config.questions, config.id);
        const fallbackText = `Time for your daily standup! Please answer ${config.questions.length} questions.`;

        for (const member of config.team.teamMembers) {
          if (!member.slackUserId) {
            console.log(`⚠️ No Slack user ID for ${member.user.email}`);
            continue;
          }

          const result = await sendSlackDM(
            workspace.botToken,
            member.slackUserId,
            fallbackText,
            blocks
          );

          if (result.success) {
            sentCount++;
            console.log(`✉️ Sent standup to ${member.user.email}`);
          } else {
            errors.push(
              `Failed to send to ${member.user.email}: ${result.error}`
            );
            console.error(
              `❌ Failed to send to ${member.user.email}:`,
              result.error
            );
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error processing config ${config.id}:`, error);
        errors.push(`Error with config ${config.name}: ${error}`);
      }
    }

    console.log(
      `✅ Cron job complete - Sent: ${sentCount}, Skipped: ${skippedCount}`
    );

    return NextResponse.json({
      success: true,
      sent: sentCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
