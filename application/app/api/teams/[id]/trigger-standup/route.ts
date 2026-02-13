// app/api/teams/[id]/trigger-standup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  standupConfig,
  teamMember,
  slackWorkspace,
  team,
} from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ConfigWithFullData } from "@/lib/db-types";

function buildStandupBlocks(questions: any[], standupConfigId: string) {
  const blocks: any[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "👋 *[TEST] Time for your daily standup!*\n\nPlease answer the following questions:",
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
          text: `🧪 *Test Mode* | Standup ID: \`${standupConfigId}\``,
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;

    // Verify authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get team data
    const teamData = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), isNull(team.deletedAt)),
    });

    if (!teamData) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get active standup configs for this team
    const configs = (await db.query.standupConfig.findMany({
      where: and(
        eq(standupConfig.teamId, teamId),
        eq(standupConfig.isActive, true),
        isNull(standupConfig.deletedAt)
      ),
      with: {
        team: {
          with: {
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

    if (configs.length === 0) {
      return NextResponse.json(
        { error: "No active standup configurations found for this team" },
        { status: 404 }
      );
    }

    // Get Slack workspace
    const workspace = await db.query.slackWorkspace.findFirst({
      where: eq(slackWorkspace.organizationId, teamData.organizationId),
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "No Slack workspace connected" },
        { status: 404 }
      );
    }

    let sentCount = 0;
    const errors: string[] = [];
    const recipients: string[] = [];

    // Send standups for each config
    for (const config of configs) {
      const blocks = buildStandupBlocks(config.questions, config.id);
      const fallbackText = `[TEST] Time for your daily standup! Please answer ${config.questions.length} questions.`;

      for (const member of config.team.teamMembers) {
        if (!member.slackUserId) {
          console.log(`⚠️ No Slack user ID for ${member.user.email}`);
          errors.push(`No Slack ID for ${member.user.email}`);
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
          recipients.push(member.user.email);
          console.log(`✉️ [TEST] Sent standup to ${member.user.email}`);
        } else {
          errors.push(
            `Failed to send to ${member.user.email}: ${result.error}`
          );
          console.error(
            `❌ Failed to send to ${member.user.email}:`,
            result.error
          );
        }

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      recipients,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully sent ${sentCount} standup prompt(s)`,
    });
  } catch (error) {
    console.error("Error triggering standup:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
