// app/api/slack/users/route.ts
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

    // Fetch users from Slack API
    const response = await fetch("https://slack.com/api/users.list", {
      headers: {
        Authorization: `Bearer ${workspace.botToken}`,
      },
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("Slack API error:", data.error);
      return NextResponse.json(
        { error: "Failed to fetch Slack users" },
        { status: 500 }
      );
    }

    // Filter out bots and deleted users
    const users = data.members
      .filter((member: any) => !member.is_bot && !member.deleted)
      .map((member: any) => ({
        id: member.id,
        name: member.real_name || member.name,
        email: member.profile.email,
        avatar: member.profile.image_72,
        displayName: member.profile.display_name,
      }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching Slack users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
