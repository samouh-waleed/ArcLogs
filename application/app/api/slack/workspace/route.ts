// app/api/slack/workspace/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slackWorkspace, member } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    // Verify session
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

    // Verify the requesting user belongs to this org
    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, orgId),
        eq(member.userId, session.user.id),
        isNull(member.deletedAt)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch workspace
    const workspace = await db.query.slackWorkspace.findFirst({
      where: and(
        eq(slackWorkspace.organizationId, orgId),
        isNull(slackWorkspace.deletedAt)
      ),
    });

    if (!workspace) {
      return NextResponse.json({ workspace: null });
    }

    // Never expose the bot token to the frontend
    const { botToken: _bt, ...safeWorkspace } = workspace;
    return NextResponse.json({ workspace: safeWorkspace });
  } catch (error) {
    console.error("Error fetching Slack workspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
