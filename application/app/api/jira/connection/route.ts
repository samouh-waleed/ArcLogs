// app/api/jira/connection/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jiraConnection, member } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { canUseJira } from "@/lib/limits";

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

    // Get Jira connection for organization
    const connection = await db.query.jiraConnection.findFirst({
      where: and(
        eq(jiraConnection.organizationId, orgId),
        isNull(jiraConnection.deletedAt)
      ),
    });

    return NextResponse.json({
      connection: connection || null,
    });
  } catch (error) {
    console.error("Error fetching Jira connection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      organizationId,
      jiraDomain,
      jiraEmail,
      jiraApiToken,
      defaultProjectKey,
      defaultIssueType,
    } = body;

    if (!organizationId || !jiraDomain || !jiraEmail || !jiraApiToken) {
      return NextResponse.json(
        {
          error:
            "Organization ID, Jira domain, email, and API token are required",
        },
        { status: 400 }
      );
    }

    // Plan gate: Jira integration is Pro+ only
    const jiraAllowed = await canUseJira(organizationId);
    if (!jiraAllowed) {
      return NextResponse.json(
        {
          error: "Jira integration requires a Pro plan.",
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Check if connection already exists
    const existingConnection = await db.query.jiraConnection.findFirst({
      where: and(
        eq(jiraConnection.organizationId, organizationId),
        isNull(jiraConnection.deletedAt)
      ),
    });

    let connection;

    if (existingConnection) {
      // Update existing connection
      const [updated] = await db
        .update(jiraConnection)
        .set({
          jiraDomain: jiraDomain.replace(/^https?:\/\//, ""),
          jiraEmail,
          jiraApiToken, // In production, encrypt this!
          defaultProjectKey: defaultProjectKey || null,
          defaultIssueType: defaultIssueType || "Task",
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(jiraConnection.id, existingConnection.id))
        .returning();

      connection = updated;
    } else {
      // Create new connection
      const [newConnection] = await db
        .insert(jiraConnection)
        .values({
          id: nanoid(),
          organizationId,
          jiraDomain: jiraDomain.replace(/^https?:\/\//, ""),
          jiraEmail,
          jiraApiToken, // In production, encrypt this!
          defaultProjectKey: defaultProjectKey || null,
          defaultIssueType: defaultIssueType || "Task",
          isActive: true,
        })
        .returning();

      connection = newConnection;
    }

    return NextResponse.json({ connection }, { status: 200 });
  } catch (error) {
    console.error("Error saving Jira connection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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

    // Soft delete
    await db
      .update(jiraConnection)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(eq(jiraConnection.organizationId, orgId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Jira connection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
