// lib/limits.ts
import { db } from "@/lib/db";
import { subscription, member, team, standupConfig } from "@/drizzle/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";

// ============================================
// PLAN DEFINITIONS
// ============================================

export type OrgPlan = "free" | "pro" | "enterprise";
export type LimitType = "teams" | "members" | "standups";

type PlanConfig = {
  teams: number | null;     // null = unlimited
  members: number | null;
  standups: number | null;  // per team
  voice: boolean;
  jira: boolean;
  historyDays: number | null;
};

export const PLAN_LIMITS: Record<OrgPlan, PlanConfig> = {
  free: {
    teams: 1,
    members: 5,
    standups: 1,
    voice: false,
    jira: false,
    historyDays: 30,
  },
  pro: {
    teams: null,     // unlimited
    members: null,   // unlimited — charged at $8/member/month via Stripe
    standups: null,  // unlimited
    voice: true,
    jira: true,
    historyDays: null,
  },
  enterprise: {
    teams: null,
    members: null,
    standups: null,
    voice: true,
    jira: true,
    historyDays: null,
  },
};

// ============================================
// PLAN RESOLUTION
// ============================================

/**
 * Get the active plan name for an organization.
 *
 * Priority:
 *   1. The org's own active/trialing subscription (fastest path).
 *   2. Plan inheritance — if the org has no subscription, check whether the
 *      org's owner has a paid subscription on any other org they belong to.
 *      This covers the common case where a Pro user creates a second org:
 *      the new org has no subscription yet, but the owner is already paying.
 *
 * Returns 'free' if neither condition is met.
 */
export async function getOrgPlan(organizationId: string): Promise<OrgPlan> {
  // ── Fast path: own subscription ──────────────────────────────────────────
  const activeSub = await db.query.subscription.findFirst({
    where: and(
      eq(subscription.referenceId, organizationId),
      inArray(subscription.status, ["active", "trialing"])
    ),
    orderBy: (sub, { desc }) => [desc(sub.createdAt)],
  });

  if (activeSub?.plan) {
    const plan = activeSub.plan as OrgPlan;
    return plan === "pro" || plan === "enterprise" ? plan : "free";
  }

  // ── Inheritance: check the org owner's other orgs ────────────────────────
  // Find who owns this org (Better Auth sets role = 'owner' on creation).
  const ownerMembership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationId),
      eq(member.role, "owner"),
      isNull(member.deletedAt)
    ),
  });

  if (!ownerMembership) return "free";

  // Find all orgs this owner is a member of (excluding the current one).
  const ownerAllOrgs = await db.query.member.findMany({
    where: and(
      eq(member.userId, ownerMembership.userId),
      isNull(member.deletedAt)
    ),
    columns: { organizationId: true },
  });

  const otherOrgIds = ownerAllOrgs
    .map((m) => m.organizationId)
    .filter((id) => id !== organizationId);

  if (otherOrgIds.length === 0) return "free";

  // If the owner has Pro/Enterprise on any other org, this org inherits it.
  const inheritedSub = await db.query.subscription.findFirst({
    where: and(
      inArray(subscription.referenceId, otherOrgIds),
      inArray(subscription.status, ["active", "trialing"]),
      inArray(subscription.plan, ["pro", "enterprise"])
    ),
    orderBy: (sub, { desc }) => [desc(sub.createdAt)],
  });

  if (inheritedSub?.plan) {
    const plan = inheritedSub.plan as OrgPlan;
    return plan === "pro" || plan === "enterprise" ? plan : "free";
  }

  return "free";
}

// ============================================
// FEATURE GATES
// ============================================

export async function canUseVoice(organizationId: string): Promise<boolean> {
  const plan = await getOrgPlan(organizationId);
  return PLAN_LIMITS[plan].voice;
}

export async function canUseJira(organizationId: string): Promise<boolean> {
  const plan = await getOrgPlan(organizationId);
  return PLAN_LIMITS[plan].jira;
}

// ============================================
// LIMIT CHECKS
// ============================================

/**
 * Check if adding one more item would exceed the plan limit.
 * limit = null means unlimited.
 */
export async function canAddItem(
  organizationId: string,
  type: LimitType,
  currentCount: number
): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number | null;
  plan: OrgPlan;
}> {
  const plan = await getOrgPlan(organizationId);
  const limit = PLAN_LIMITS[plan][type];
  const allowed = limit === null || currentCount < limit;

  return { allowed, currentCount, limit, plan };
}

export async function checkMemberLimit(organizationId: string) {
  const members = await db.query.member.findMany({
    where: and(
      eq(member.organizationId, organizationId),
      isNull(member.deletedAt)
    ),
  });

  return canAddItem(organizationId, "members", members.length);
}

export async function checkTeamLimit(organizationId: string) {
  const teams = await db.query.team.findMany({
    where: and(eq(team.organizationId, organizationId), isNull(team.deletedAt)),
  });

  return canAddItem(organizationId, "teams", teams.length);
}

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

// ============================================
// USAGE SUMMARY
// ============================================

export async function getOrganizationUsage(organizationId: string) {
  const plan = await getOrgPlan(organizationId);
  const limits = PLAN_LIMITS[plan];

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

  const pct = (n: number, lim: number | null) =>
    lim === null ? 0 : Math.round((n / lim) * 100);

  return {
    plan,
    members: {
      current: members.length,
      limit: limits.members,
      percentage: pct(members.length, limits.members),
    },
    teams: {
      current: teams.length,
      limit: limits.teams,
      percentage: pct(teams.length, limits.teams),
    },
    standups: {
      current: totalStandups,
      limit: limits.standups,
      percentage: pct(totalStandups, limits.standups),
    },
    features: {
      voice: limits.voice,
      jira: limits.jira,
      historyDays: limits.historyDays,
    },
  };
}
