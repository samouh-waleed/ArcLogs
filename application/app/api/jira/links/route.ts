// app/api/jira/links/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
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
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 }
      );
    }

    // Get recent Jira links for this organization
    const links = await db.query.jiraLink.findMany({
      with: {
        standupResponse: {
          with: {
            user: true,
            team: true,
          },
        },
      },
      limit,
      orderBy: (jiraLink, { desc }) => [desc(jiraLink.syncedAt)],
    });

    // Filter by organization (through standup response -> team -> org)
    const filteredLinks = links.filter(
      (link) =>
        link.standupResponse?.team?.organizationId === orgId
    );

    return NextResponse.json({
      links: filteredLinks.slice(0, limit),
    });
  } catch (error) {
    console.error("Error fetching Jira links:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
