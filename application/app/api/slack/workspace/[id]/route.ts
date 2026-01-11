// app/api/slack/workspace/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slackWorkspace, member } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId } = await params;

    // Get workspace
    const workspace = await db.query.slackWorkspace.findFirst({
      where: eq(slackWorkspace.id, workspaceId),
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Verify user is admin or owner
    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, workspace.organizationId),
        eq(member.userId, session.user.id),
        isNull(member.deletedAt)
      ),
    });

    if (
      !membership ||
      (membership.role !== "admin" && membership.role !== "owner")
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Soft delete workspace
    await db
      .update(slackWorkspace)
      .set({ deletedAt: new Date() })
      .where(eq(slackWorkspace.id, workspaceId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting Slack:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
