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
    teams: null,
    members: 50,
    standups: 3,
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
 * Returns 'free' if no active or trialing subscription exists.
 */
export async function getOrgPlan(organizationId: string): Promise<OrgPlan> {
  const activeSub = await db.query.subscription.findFirst({
    where: and(
      eq(subscription.referenceId, organizationId),
      inArray(subscription.status, ["active", "trialing"])
    ),
    orderBy: (sub, { desc }) => [desc(sub.createdAt)],
  });

  if (!activeSub?.plan) return "free";
  const plan = activeSub.plan as OrgPlan;
  return plan === "pro" || plan === "enterprise" ? plan : "free";
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
