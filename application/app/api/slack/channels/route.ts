// app/api/slack/channels/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slackWorkspace } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 }
      );
    }

    // Get Slack workspace
    const workspace = await db.query.slackWorkspace.findFirst({
      where: eq(slackWorkspace.organizationId, orgId),
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Slack workspace not connected" },
        { status: 404 }
      );
    }

    // Fetch channels from Slack API
    const response = await fetch(
      "https://slack.com/api/conversations.list?types=public_channel,private_channel",
      {
        headers: {
          Authorization: `Bearer ${workspace.botToken}`,
        },
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error("Slack API error:", data.error);
      return NextResponse.json(
        { error: "Failed to fetch Slack channels" },
        { status: 500 }
      );
    }

    const channels = data.channels.map((channel: any) => ({
      id: channel.id,
      name: channel.name,
      isPrivate: channel.is_private,
      memberCount: channel.num_members,
    }));

    return NextResponse.json({ channels });
  } catch (error) {
    console.error("Error fetching Slack channels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
