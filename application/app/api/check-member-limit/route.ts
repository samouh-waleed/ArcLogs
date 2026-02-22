// app/api/check-member-limit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkMemberLimit } from "@/lib/limits";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await req.json();

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 }
      );
    }

    const result = await checkMemberLimit(organizationId);

    return NextResponse.json({
      canAdd: result.allowed,
      currentCount: result.currentCount,
      limit: result.limit,
      plan: result.plan,
    });
  } catch (error) {
    console.error("Error checking member limit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
