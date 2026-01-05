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

  // Stripe plugin
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

    // Soft delete
    deletedAt: timestamp("deleted_at"),

    // Settings
    allowTeamLeadersCreateTeams: boolean("allow_team_leaders_create_teams")
      .default(false)
      .notNull(),
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
    // Role: 'owner' | 'admin' | 'member'
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Soft delete
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

    // Soft delete
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
    index("invitation_deletedAt_idx").on(table.deletedAt),
  ]
);

// ============================================
// TEAMS & TEAM MEMBERSHIP
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Soft delete
    deletedAt: timestamp("deleted_at"),
    archivedAt: timestamp("archived_at"), // Soft archive (can be restored)

    // Settings
    membersCanSeeUpdates: boolean("members_can_see_updates")
      .default(false)
      .notNull(),
    membersCanSeeInsights: boolean("members_can_see_insights")
      .default(true)
      .notNull(),
    updateEditWindowMinutes: integer("update_edit_window_minutes")
      .default(60)
      .notNull(),
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
    // Role: 'leader' | 'member'
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Soft delete
    deletedAt: timestamp("deleted_at"),

    // Status tracking
    lastUpdateAt: timestamp("last_update_at"),
    onLeave: boolean("on_leave").default(false).notNull(),
  },
  (table) => [
    index("team_member_teamId_idx").on(table.teamId),
    index("team_member_userId_idx").on(table.userId),
    index("team_member_deletedAt_idx").on(table.deletedAt),
    uniqueIndex("team_member_team_user_uidx").on(table.teamId, table.userId),
  ]
);

// ============================================
// DAILY QUESTIONS & UPDATES
// ============================================

export const dailyQuestion = pgTable(
  "daily_question",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    order: integer("order").notNull(),
    required: boolean("required").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Soft delete
    deletedAt: timestamp("deleted_at"),

    // ============================================
    // SCHEDULING FIELDS
    // ============================================

    // Schedule type: 'daily' | 'weekly' | 'specific_dates' | 'custom'
    scheduleType: text("schedule_type").default("daily").notNull(),

    // Schedule configuration (JSONB for flexibility)
    // Examples:
    // daily: { "enabled": true }
    // weekly: { "days": [1, 3, 5] } (0=Sunday, 6=Saturday)
    // specific_dates: { "dates": ["2025-01-15", "2025-01-20"] }
    // custom: { "pattern": "every_other_day", "start_date": "2025-01-01" }
    scheduleConfig: jsonb("schedule_config").default({}).notNull(),

    // Effective date range (optional)
    effectiveFrom: date("effective_from"),
    effectiveUntil: date("effective_until"),

    // Active status (can be toggled on/off)
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [
    index("daily_question_teamId_idx").on(table.teamId),
    index("daily_question_deletedAt_idx").on(table.deletedAt),
    index("daily_question_schedule_idx").on(
      table.teamId,
      table.scheduleType,
      table.isActive,
      table.deletedAt
    ),
    index("daily_question_dates_idx").on(
      table.teamId,
      table.effectiveFrom,
      table.effectiveUntil
    ),
  ]
);

export const teamUpdate = pgTable(
  "team_update",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Update content
    updateDate: timestamp("update_date").notNull(), // The date this update is for
    content: jsonb("content").notNull(), // { questionId: answer }

    // Voice or text
    updateType: text("update_type").notNull(), // 'voice' | 'text'
    voiceUrl: text("voice_url"), // S3/storage URL if voice
    voiceTranscript: text("voice_transcript"), // Transcribed text
    voiceDurationSeconds: integer("voice_duration_seconds"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Soft delete
    deletedAt: timestamp("deleted_at"),

    // Processing status
    processingStatus: text("processing_status").default("pending").notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
    processedAt: timestamp("processed_at"),
  },
  (table) => [
    index("team_update_teamId_idx").on(table.teamId),
    index("team_update_userId_idx").on(table.userId),
    index("team_update_updateDate_idx").on(table.updateDate),
    index("team_update_deletedAt_idx").on(table.deletedAt),
    index("team_update_processingStatus_idx").on(table.processingStatus),
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

    // Insight metadata
    insightDate: timestamp("insight_date").notNull(),
    insightType: text("insight_type").notNull(), // 'blocker' | 'help_request' | 'pattern' | 'dependency'
    title: text("title").notNull(),
    description: text("description").notNull(),
    severity: text("severity").notNull(), // 'low' | 'medium' | 'high' | 'critical'

    // Related updates
    relatedUpdateIds: jsonb("related_update_ids"), // Array of update IDs

    // Action tracking
    status: text("status").default("open").notNull(), // 'open' | 'acknowledged' | 'resolved' | 'dismissed'
    acknowledgedBy: text("acknowledged_by").references(() => user.id),
    acknowledgedAt: timestamp("acknowledged_at"),
    resolvedBy: text("resolved_by").references(() => user.id),
    resolvedAt: timestamp("resolved_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Soft delete
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("insight_teamId_idx").on(table.teamId),
    index("insight_insightDate_idx").on(table.insightDate),
    index("insight_insightType_idx").on(table.insightType),
    index("insight_status_idx").on(table.status),
    index("insight_deletedAt_idx").on(table.deletedAt),
  ]
);

export const helpRequest = pgTable(
  "help_request",
  {
    id: text("id").primaryKey(),
    teamUpdateId: text("team_update_id")
      .notNull()
      .references(() => teamUpdate.id, { onDelete: "cascade" }),
    requesterId: text("requester_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Help request details
    helpType: text("help_type").notNull(), // 'technical' | 'review' | 'unblock' | 'other'
    description: text("description").notNull(),

    // Routing
    routedToUserIds: jsonb("routed_to_user_ids"), // Array of user IDs
    notificationSent: boolean("notification_sent").default(false).notNull(),
    notificationSentAt: timestamp("notification_sent_at"),

    // Status
    status: text("status").default("open").notNull(), // 'open' | 'in_progress' | 'resolved'
    resolvedBy: text("resolved_by").references(() => user.id),
    resolvedAt: timestamp("resolved_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Soft delete
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("help_request_teamUpdateId_idx").on(table.teamUpdateId),
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

    // associated entity id (organization id)
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
    index("subscription_stripeCustomerId_idx").on(table.stripeCustomerId),
    index("subscription_stripeSubscriptionId_idx").on(
      table.stripeSubscriptionId
    ),
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
  invitations: many(invitation),
  teamMembers: many(teamMember),
  teamUpdates: many(teamUpdate),
  helpRequests: many(helpRequest),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  teams: many(team),
  subscriptions: many(subscription),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),
  teamMembers: many(teamMember),
  dailyQuestions: many(dailyQuestion),
  teamUpdates: many(teamUpdate),
  insights: many(insight),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMember.userId],
    references: [user.id],
  }),
}));

export const dailyQuestionRelations = relations(dailyQuestion, ({ one }) => ({
  team: one(team, {
    fields: [dailyQuestion.teamId],
    references: [team.id],
  }),
}));

export const teamUpdateRelations = relations(teamUpdate, ({ one, many }) => ({
  team: one(team, {
    fields: [teamUpdate.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamUpdate.userId],
    references: [user.id],
  }),
  helpRequests: many(helpRequest),
}));

export const insightRelations = relations(insight, ({ one }) => ({
  team: one(team, {
    fields: [insight.teamId],
    references: [team.id],
  }),
}));

export const helpRequestRelations = relations(helpRequest, ({ one }) => ({
  teamUpdate: one(teamUpdate, {
    fields: [helpRequest.teamUpdateId],
    references: [teamUpdate.id],
  }),
  requester: one(user, {
    fields: [helpRequest.requesterId],
    references: [user.id],
  }),
}));

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  organization: one(organization, {
    fields: [subscription.referenceId],
    references: [organization.id],
  }),
}));
