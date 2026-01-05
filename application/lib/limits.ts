import { dailyQuestion, member, team } from "@/drizzle/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// lib/limits.ts
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    priceId: null,
    limits: {
      members: 5,
      teams: 3,
      questionsPerTeam: 3,
      updatesPerMonth: 100,
      aiInsights: false,
      voiceUpdates: false,
      customBranding: false,
      apiAccess: false,
    },
    features: [
      "Up to 5 team members",
      "Up to 3 teams",
      "3 questions per team",
      "Basic updates",
      "Email support",
    ],
  },
  pro: {
    name: "Pro",
    price: 8, // per user per month
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
    limits: {
      members: Infinity,
      teams: Infinity,
      questionsPerTeam: Infinity,
      updatesPerMonth: Infinity,
      aiInsights: true,
      voiceUpdates: true,
      customBranding: true,
      apiAccess: true,
    },
    features: [
      "Unlimited team members",
      "Unlimited teams",
      "Unlimited questions",
      "AI-powered insights",
      "Voice updates",
      "Custom branding",
      "Priority support",
      "API access",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: null,
    priceId: null,
    limits: {
      members: Infinity,
      teams: Infinity,
      questionsPerTeam: Infinity,
      updatesPerMonth: Infinity,
      aiInsights: true,
      voiceUpdates: true,
      customBranding: true,
      apiAccess: true,
      sso: true,
      dedicatedSupport: true,
      sla: true,
    },
    features: [
      "Everything in Pro",
      "SSO & SAML",
      "Dedicated account manager",
      "Custom integrations",
      "Advanced security",
      "SLA guarantee",
      "On-premise deployment options",
    ],
  },
} as const;

export type PlanName = keyof typeof PLANS;

// Helper to get current plan limits
export function getPlanLimits(plan: PlanName = "free") {
  return PLANS[plan].limits;
}

// Check if org is within limits
export async function checkOrgLimits(orgId: string, plan: PlanName = "free") {
  const limits = getPlanLimits(plan);

  // Get current usage from database
  const [memberCount, teamCount, questionCount] = await Promise.all([
    db.query.member.findMany({ where: eq(member.organizationId, orgId) }),
    db.query.team.findMany({ where: eq(team.organizationId, orgId) }),
    db.query.dailyQuestion.findMany({
      where: eq(dailyQuestion.teamId /* first team */),
    }), // You'd need to iterate
  ]);

  const overages = {
    members:
      memberCount.length > limits.members
        ? memberCount.length - limits.members
        : 0,
    teams:
      teamCount.length > limits.teams ? teamCount.length - limits.teams : 0,
    questionsPerTeam: 0, // Calculate based on teams
  };

  const hasOverages = Object.values(overages).some((v) => v > 0);

  return {
    within: !hasOverages,
    overages,
    current: {
      members: memberCount.length,
      teams: teamCount.length,
    },
    limits,
  };
}
