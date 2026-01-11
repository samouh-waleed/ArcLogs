// lib/limits.ts
import { db } from "@/lib/db";
import { subscription, member, team, standupConfig } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";

// Centralized subscription limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    teams: 1,
    members: 5, // Total organization members
    standups: 1,
  },
  trialing: {
    teams: 999,
    members: 999,
    standups: 999,
  },
  active: {
    teams: 999,
    members: 999,
    standups: 999,
  },
} as const;

export type SubscriptionStatus = keyof typeof SUBSCRIPTION_LIMITS;
export type LimitType = keyof typeof SUBSCRIPTION_LIMITS.free;

/**
 * Get the active subscription status for an organization
 */
export async function getSubscriptionStatus(
  organizationId: string
): Promise<SubscriptionStatus> {
  const subscriptions = await db.query.subscription.findMany({
    where: eq(subscription.referenceId, organizationId),
  });

  const activeSubscription = subscriptions.find(
    (sub: any) => sub.status === "active" || sub.status === "trialing"
  );

  return (activeSubscription?.status as SubscriptionStatus) || "free";
}

/**
 * Get the limits for a specific subscription status
 */
export function getLimits(status: SubscriptionStatus) {
  return SUBSCRIPTION_LIMITS[status] || SUBSCRIPTION_LIMITS.free;
}

/**
 * Check if adding one more item would exceed the limit
 */
export async function canAddItem(
  organizationId: string,
  type: LimitType,
  currentCount: number
): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
  status: SubscriptionStatus;
}> {
  const status = await getSubscriptionStatus(organizationId);
  const limits = getLimits(status);
  const limit = limits[type];
  const allowed = currentCount < limit;

  return {
    allowed,
    currentCount,
    limit,
    status,
  };
}

/**
 * Check if organization can add more members
 */
export async function checkMemberLimit(organizationId: string) {
  const members = await db.query.member.findMany({
    where: and(
      eq(member.organizationId, organizationId),
      isNull(member.deletedAt)
    ),
  });

  return canAddItem(organizationId, "members", members.length);
}

/**
 * Check if organization can add more teams
 */
export async function checkTeamLimit(organizationId: string) {
  const teams = await db.query.team.findMany({
    where: and(eq(team.organizationId, organizationId), isNull(team.deletedAt)),
  });

  return canAddItem(organizationId, "teams", teams.length);
}

/**
 * Check if team can add more standups
 */
export async function checkStandupLimit(
  teamId: string,
  organizationId: string
) {
  const standups = await db.query.standupConfig.findMany({
    where: and(
      eq(standupConfig.teamId, teamId),
      isNull(standupConfig.deletedAt)
    ),
  });

  return canAddItem(organizationId, "standups", standups.length);
}

/**
 * Get current usage for an organization
 */
export async function getOrganizationUsage(organizationId: string) {
  const [members, teams] = await Promise.all([
    db.query.member.findMany({
      where: and(
        eq(member.organizationId, organizationId),
        isNull(member.deletedAt)
      ),
    }),
    db.query.team.findMany({
      where: and(
        eq(team.organizationId, organizationId),
        isNull(team.deletedAt)
      ),
    }),
  ]);

  // Get standup count across all teams
  const standupCounts = await Promise.all(
    teams.map((t) =>
      db.query.standupConfig.findMany({
        where: and(
          eq(standupConfig.teamId, t.id),
          isNull(standupConfig.deletedAt)
        ),
      })
    )
  );

  const totalStandups = standupCounts.reduce(
    (sum, standups) => sum + standups.length,
    0
  );

  const status = await getSubscriptionStatus(organizationId);
  const limits = getLimits(status);

  return {
    members: {
      current: members.length,
      limit: limits.members,
      percentage: Math.round((members.length / limits.members) * 100),
    },
    teams: {
      current: teams.length,
      limit: limits.teams,
      percentage: Math.round((teams.length / limits.teams) * 100),
    },
    standups: {
      current: totalStandups,
      limit: limits.standups,
      percentage: Math.round((totalStandups / limits.standups) * 100),
    },
    status,
  };
}
