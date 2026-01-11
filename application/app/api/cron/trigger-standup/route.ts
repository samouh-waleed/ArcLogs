// app/api/cron/trigger-standup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { standupConfig, teamMember, slackWorkspace } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { TeamMemberWithUser, StandupConfigWithTeam } from "@/lib/db-types";

function buildStandupBlocks(questions: any[], standupConfigId: string) {
  const blocks: any[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "👋 *Time for your daily standup!* _(Test mode)_\n\nPlease answer the following questions:",
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

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { standupConfigId, userId } = await req.json();

    if (!standupConfigId) {
      return NextResponse.json(
        { error: "Standup config ID required" },
        { status: 400 }
      );
    }

    const config = (await db.query.standupConfig.findFirst({
      where: and(
        eq(standupConfig.id, standupConfigId),
        isNull(standupConfig.deletedAt)
      ),
      with: {
        team: {
          with: {
            organization: true,
          },
        },
      },
    })) as StandupConfigWithTeam | undefined;

    if (!config) {
      return NextResponse.json(
        { error: "Standup config not found" },
        { status: 404 }
      );
    }

    const workspace = await db.query.slackWorkspace.findFirst({
      where: eq(slackWorkspace.organizationId, config.team.organizationId),
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Slack workspace not connected" },
        { status: 404 }
      );
    }

    let members: TeamMemberWithUser[];
    if (userId) {
      const member = (await db.query.teamMember.findFirst({
        where: and(
          eq(teamMember.userId, userId),
          eq(teamMember.teamId, config.teamId),
          isNull(teamMember.deletedAt)
        ),
        with: {
          user: true,
        },
      })) as TeamMemberWithUser | undefined;
      members = member ? [member] : [];
    } else {
      members = (await db.query.teamMember.findMany({
        where: and(
          eq(teamMember.teamId, config.teamId),
          isNull(teamMember.deletedAt)
        ),
        with: {
          user: true,
        },
      })) as TeamMemberWithUser[];
    }

    if (members.length === 0) {
      return NextResponse.json(
        { error: "No team members found" },
        { status: 404 }
      );
    }

    const blocks = buildStandupBlocks(config.questions, config.id);
    const fallbackText = `Time for your daily standup! Please answer ${config.questions.length} questions.`;

    const results = [];
    for (const member of members) {
      if (!member.slackUserId) {
        results.push({
          email: member.user.email,
          success: false,
          error: "No Slack user ID",
        });
        continue;
      }

      const result = await sendSlackDM(
        workspace.botToken,
        member.slackUserId,
        fallbackText,
        blocks
      );

      results.push({
        email: member.user.email,
        success: result.ok,
        error: result.ok ? undefined : result.error,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error("Error triggering standup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
