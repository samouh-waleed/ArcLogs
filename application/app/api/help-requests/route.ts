// app/api/help-requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { helpRequest } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json();

    const [updated] = await db
      .update(helpRequest)
      .set({
        status,
        resolvedBy: session.user.id,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(helpRequest.id, params.id))
      .returning();

    return NextResponse.json({ helpRequest: updated });
  } catch (error) {
    console.error("Error updating help request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
