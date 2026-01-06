// drizzle/schema.ts
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
  uniqueIndex,
  jsonb,
  date,
} from "drizzle-orm/pg-core";

// ============================================
// BETTER AUTH TABLES (Required by Better Auth)
// ============================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  stripeCustomerId: text("stripe_customer_id"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

// ============================================
// ORGANIZATION & MEMBERSHIP
// ============================================

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    metadata: jsonb("metadata"),
    deletedAt: timestamp("deleted_at"),
    trialEndsAt: timestamp("trial_ends_at"),
  },
  (table) => [
    uniqueIndex("organization_slug_uidx").on(table.slug),
    index("organization_deletedAt_idx").on(table.deletedAt),
  ]
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
    index("member_deletedAt_idx").on(table.deletedAt),
    uniqueIndex("member_org_user_uidx").on(table.organizationId, table.userId),
  ]
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
    index("invitation_deletedAt_idx").on(table.deletedAt),
  ]
);

// ============================================
// SLACK INTEGRATION
// ============================================

export const slackWorkspace = pgTable(
  "slack_workspace",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    slackTeamId: text("slack_team_id").notNull().unique(),
    slackTeamName: text("slack_team_name"),
    botToken: text("bot_token").notNull(),
    botUserId: text("bot_user_id"),
    installedBy: text("installed_by"),
    installedAt: timestamp("installed_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    uniqueIndex("slack_workspace_teamId_uidx").on(table.slackTeamId),
    index("slack_workspace_organizationId_idx").on(table.organizationId),
    index("slack_workspace_deletedAt_idx").on(table.deletedAt),
  ]
);

// ============================================
// TEAMS & STANDUPS
// ============================================

export const team = pgTable(
  "team",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    slackChannelId: text("slack_channel_id"),
    slackChannelName: text("slack_channel_name"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    archivedAt: timestamp("archived_at"),
  },
  (table) => [
    index("team_organizationId_idx").on(table.organizationId),
    index("team_deletedAt_idx").on(table.deletedAt),
    index("team_archivedAt_idx").on(table.archivedAt),
  ]
);

export const teamMember = pgTable(
  "team_member",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slackUserId: text("slack_user_id"),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("team_member_teamId_idx").on(table.teamId),
    index("team_member_userId_idx").on(table.userId),
    index("team_member_slackUserId_idx").on(table.slackUserId),
    index("team_member_deletedAt_idx").on(table.deletedAt),
    uniqueIndex("team_member_team_user_uidx").on(table.teamId, table.userId),
  ]
);

export const standupConfig = pgTable(
  "standup_config",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    timezone: text("timezone").notNull().default("UTC"),
    scheduleTime: text("schedule_time").notNull(),
    scheduleDays: jsonb("schedule_days")
      .$type<number[]>()
      .notNull()
      .default([1, 2, 3, 4, 5]),
    questions: jsonb("questions")
      .$type<
        Array<{
          id: string;
          text: string;
          required: boolean;
          order: number;
        }>
      >()
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    allowVoiceResponses: boolean("allow_voice_responses")
      .default(true)
      .notNull(),
    reminderMinutes: integer("reminder_minutes").default(30),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("standup_config_teamId_idx").on(table.teamId),
    index("standup_config_isActive_idx").on(table.isActive),
    index("standup_config_deletedAt_idx").on(table.deletedAt),
  ]
);

export const standupResponse = pgTable(
  "standup_response",
  {
    id: text("id").primaryKey(),
    standupConfigId: text("standup_config_id")
      .notNull()
      .references(() => standupConfig.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slackUserId: text("slack_user_id").notNull(),
    slackMessageTs: text("slack_message_ts"),
    responseDate: date("response_date").notNull(),
    responses: jsonb("responses").$type<Record<string, string>>().notNull(),
    responseType: text("response_type").notNull(),
    voiceUrl: text("voice_url"),
    voiceTranscript: text("voice_transcript"),
    voiceDurationSeconds: integer("voice_duration_seconds"),
    processingStatus: text("processing_status").default("pending").notNull(),
    processedAt: timestamp("processed_at"),
    aiInsights: jsonb("ai_insights").$type<{
      blockers?: string[];
      helpNeeded?: Array<{ mention: string; topic: string }>;
      sentiment?: "positive" | "neutral" | "negative";
      actionItems?: string[];
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("standup_response_standupConfigId_idx").on(table.standupConfigId),
    index("standup_response_teamId_idx").on(table.teamId),
    index("standup_response_userId_idx").on(table.userId),
    index("standup_response_responseDate_idx").on(table.responseDate),
    index("standup_response_processingStatus_idx").on(table.processingStatus),
    index("standup_response_deletedAt_idx").on(table.deletedAt),
    uniqueIndex("standup_response_config_user_date_uidx").on(
      table.standupConfigId,
      table.userId,
      table.responseDate
    ),
  ]
);

// ============================================
// AI INSIGHTS & HELP REQUESTS
// ============================================

export const insight = pgTable(
  "insight",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    relatedResponseIds: jsonb("related_response_ids").$type<string[]>(),
    insightDate: date("insight_date").notNull(),
    insightType: text("insight_type").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    severity: text("severity").notNull(),
    status: text("status").default("open").notNull(),
    acknowledgedBy: text("acknowledged_by").references(() => user.id),
    acknowledgedAt: timestamp("acknowledged_at"),
    resolvedBy: text("resolved_by").references(() => user.id),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("insight_teamId_idx").on(table.teamId),
    index("insight_insightDate_idx").on(table.insightDate),
    index("insight_status_idx").on(table.status),
    index("insight_deletedAt_idx").on(table.deletedAt),
  ]
);

export const helpRequest = pgTable(
  "help_request",
  {
    id: text("id").primaryKey(),
    responseId: text("response_id")
      .notNull()
      .references(() => standupResponse.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    requesterId: text("requester_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mentionedUserIds: jsonb("mentioned_user_ids").$type<string[]>(),
    mentionedSlackUserIds: jsonb("mentioned_slack_user_ids").$type<string[]>(),
    description: text("description").notNull(),
    topic: text("topic"),
    notificationsSent: boolean("notifications_sent").default(false).notNull(),
    notificationsSentAt: timestamp("notifications_sent_at"),
    status: text("status").default("open").notNull(),
    resolvedBy: text("resolved_by").references(() => user.id),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("help_request_responseId_idx").on(table.responseId),
    index("help_request_teamId_idx").on(table.teamId),
    index("help_request_requesterId_idx").on(table.requesterId),
    index("help_request_status_idx").on(table.status),
    index("help_request_deletedAt_idx").on(table.deletedAt),
  ]
);

// ============================================
// STRIPE SUBSCRIPTIONS
// ============================================

export const subscription = pgTable(
  "subscription",
  {
    id: text("id").primaryKey(),
    plan: text("plan").notNull(),
    referenceId: text("reference_id").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    status: text("status").notNull(),
    periodStart: timestamp("period_start"),
    periodEnd: timestamp("period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end"),
    seats: integer("seats"),
    trialStart: timestamp("trial_start"),
    trialEnd: timestamp("trial_end"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("subscription_referenceId_idx").on(table.referenceId),
    index("subscription_status_idx").on(table.status),
  ]
);

// ============================================
// RELATIONS
// ============================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  teamMembers: many(teamMember),
  standupResponses: many(standupResponse),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  teams: many(team),
  slackWorkspaces: many(slackWorkspace),
  subscriptions: many(subscription),
}));

export const slackWorkspaceRelations = relations(slackWorkspace, ({ one }) => ({
  organization: one(organization, {
    fields: [slackWorkspace.organizationId],
    references: [organization.id],
  }),
}));

export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),
  teamMembers: many(teamMember),
  standupConfigs: many(standupConfig),
  standupResponses: many(standupResponse),
  insights: many(insight),
}));

export const standupConfigRelations = relations(
  standupConfig,
  ({ one, many }) => ({
    team: one(team, {
      fields: [standupConfig.teamId],
      references: [team.id],
    }),
    responses: many(standupResponse),
  })
);

export const standupResponseRelations = relations(
  standupResponse,
  ({ one, many }) => ({
    standupConfig: one(standupConfig, {
      fields: [standupResponse.standupConfigId],
      references: [standupConfig.id],
    }),
    team: one(team, {
      fields: [standupResponse.teamId],
      references: [team.id],
    }),
    user: one(user, {
      fields: [standupResponse.userId],
      references: [user.id],
    }),
    helpRequests: many(helpRequest),
  })
);

export const helpRequestRelations = relations(helpRequest, ({ one }) => ({
  response: one(standupResponse, {
    fields: [helpRequest.responseId],
    references: [standupResponse.id],
  }),
  team: one(team, {
    fields: [helpRequest.teamId],
    references: [team.id],
  }),
  requester: one(user, {
    fields: [helpRequest.requesterId],
    references: [user.id],
  }),
}));
