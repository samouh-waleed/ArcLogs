// This file should be placed in: app/api/update-subscription-seats/route.ts
// Call this endpoint whenever you add/remove organization members

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { subscription } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Get full organization with members - response IS the data directly
    const fullOrg = await auth.api.getFullOrganization({
      query: {
        organizationId,
      },
      headers: request.headers,
    });

    if (!fullOrg) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get active subscription for this organization
    // Better Auth subscription table doesn't have deletedAt
    const subscriptions = await db.query.subscription.findMany({
      where: eq(subscription.referenceId, organizationId),
    });

    const activeSubscription = subscriptions.find(
      (sub: any) => sub.status === "active" || sub.status === "trialing"
    );

    if (!activeSubscription || !activeSubscription.stripeSubscriptionId) {
      return NextResponse.json(
        { message: "No active subscription to update" },
        { status: 200 }
      );
    }

    // Count current members from fullOrg
    const memberCount = fullOrg.members?.length || 1;

    // Update Stripe subscription quantity
    const stripeSubscription = await stripe.subscriptions.retrieve(
      activeSubscription.stripeSubscriptionId
    );

    if (stripeSubscription.items.data.length > 0) {
      await stripe.subscriptions.update(
        activeSubscription.stripeSubscriptionId,
        {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              quantity: memberCount,
            },
          ],
          proration_behavior: "always_invoice", // Pro-rate immediately
        }
      );

      // Update local subscription record
      await db
        .update(subscription)
        .set({
          seats: memberCount,
        })
        .where(eq(subscription.id, activeSubscription.id));

      return NextResponse.json({
        message: "Subscription updated successfully",
        newQuantity: memberCount,
      });
    }

    return NextResponse.json({ message: "No update needed" });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}
