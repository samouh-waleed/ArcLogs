# ArcLogs Application

Next.js 16 frontend and API layer for the ArcLogs standup platform.

## Tech Stack

- **Next.js 16** with App Router, React 19, TypeScript
- **PostgreSQL** on Neon (serverless) with Drizzle ORM + pgvector
- **Better Auth** — multi-org, email/password, GitHub/Google/Microsoft OAuth
- **Stripe** per-user subscriptions ($8/user/month) via @better-auth/stripe
- **AWS SQS** for async message queuing to the Python worker
- **Resend** for transactional emails (invitations, upgrade/cancel notifications)
- **Radix UI** + Tailwind CSS 4 + Recharts for the dashboard

## Setup

```bash
npm install
npm run dev          # Dev server (port 3000)
npm run db:push      # Push Drizzle schema to Neon
npm run db:studio    # Drizzle Studio (DB browser)
npm run dev:urls     # Update ngrok URLs in .env + Stripe (run after ngrok restarts)
```

## Environment Variables

See `.env.example` for the full list. Key variables:

```
BETTER_AUTH_SECRET, BETTER_AUTH_BASE_URL
DATABASE_URL
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
STRIPE_PRO_PRICE_ID, STRIPE_ENTERPRISE_PRICE_ID
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
RESEND_API_KEY
AWS_SQS_QUEUE_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
CRON_SECRET
NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SLACK_CLIENT_ID
SLACK_CLIENT_SECRET, SLACK_SIGNING_SECRET
```

## Project Structure

```
app/
├── (auth)/                    # Login, signup, invitations, org creation
├── (dashboard)/               # Dashboard, teams, settings, billing, analytics
│   ├── analytics/             # Org-level analytics
│   └── settings/jira/         # Jira connection management
├── api/
│   ├── auth/[...all]/         # Better Auth proxy (handles Stripe webhooks too)
│   ├── slack/
│   │   ├── events/            # Slack event handler (text + audio standups)
│   │   ├── interactions/      # Slack interactive buttons (ticket confirmation)
│   │   ├── oauth/             # Slack app installation (multi-workspace)
│   │   ├── channels/          # List Slack channels (membership-gated)
│   │   ├── users/             # List Slack users (membership-gated)
│   │   └── workspace/         # Workspace management (membership-gated)
│   ├── jira/                  # Jira connection, test, sync history (Pro-gated)
│   ├── teams/                 # Team CRUD, members, analytics, help requests
│   ├── standups/              # Standup config CRUD, responses
│   ├── cron/                  # Scheduled standup delivery + digest generation
│   ├── organizations/[id]/    # Org-level analytics
│   └── organization-usage/    # Plan + usage limits (plan, members, teams, features)
├── components/                # Sidebar, onboarding checklist, UI primitives
├── drizzle/schema.ts          # All database tables and relations
├── lib/
│   ├── limits.ts              # Plan definitions + feature gates (canUseVoice, canUseJira)
│   ├── auth.ts                # Better Auth config (org limits, Stripe plans, email callbacks)
│   ├── db.ts                  # Neon serverless pool + Drizzle instance
│   └── auth-client.ts         # Better Auth React client
└── scripts/
    └── dev-urls.mjs           # Dev utility: update ngrok URLs in .env + Stripe
```

## Key API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/slack/events` | Receives Slack messages (text + audio), saves to DB, queues to SQS |
| `POST /api/slack/interactions` | Handles interactive button clicks (ticket creation confirm/skip) |
| `GET /api/slack/oauth` | Slack app OAuth installation — handles workspace switching (clears stale member IDs) |
| `GET /api/cron/send-standups` | Cron: send standup DMs; pre-creates `awaiting_response` records with message ts for thread routing |
| `GET /api/cron/generate-digests` | Cron: generate daily team digests |
| `POST /api/jira/connection` | Save Jira credentials — Pro plan required |
| `POST /api/jira/test-connection` | Test Jira credentials — Pro plan required |
| `GET /api/organization-usage` | Returns `{ plan, members, teams, standups, features }` for plan-aware UI |

## Subscription Plans & Feature Gates

Plan limits are defined in `lib/limits.ts` and enforced at both the API and worker levels.

| Plan | Orgs | Teams | Members | Standups/team | Voice | Jira |
|------|------|-------|---------|---------------|-------|------|
| Free | 1 | 1 | 5 | 1 | ❌ | ❌ |
| Pro | 5 | ∞ | ∞ (billed) | ∞ | ✅ | ✅ |

Key functions: `getOrgPlan(orgId)` — reads `subscription.plan` with **plan inheritance** (if the org has no subscription, inherits from the org owner's other paid orgs). `canUseVoice(orgId)`, `canUseJira(orgId)`.

Stripe plans: `STRIPE_PRO_PRICE_ID` (pro), `STRIPE_ENTERPRISE_PRICE_ID` (enterprise).

Subscription emails sent via Resend in `lib/auth.ts` callbacks: upgrade confirmation and cancellation notice.

## Slack Integration Architecture

- **One Slack workspace per organization** (org-level). All teams share the bot.
- Each team selects a **channel** from the org's workspace for digests.
- Each team can have a **Jira project override** (`team.jiraProjectKey`).
- Slack bot required scopes: `channels:read`, `chat:write`, `im:write`, `im:history`, `users:read`, `users:read.email`, `files:read`, `app_mentions:read`
- **Workspace switching**: when admin connects a different workspace, all team members' `slackUserId` values are cleared and must be re-linked via the Slack user picker.
- **Thread routing**: standup questions are sent as Slack messages. Users reply in the thread. The cron pre-creates `standup_response` rows with `slackMessageTs` so the events handler can match thread replies to the correct team's config (critical for users in multiple teams).

## Database

PostgreSQL on Neon. Key tables: `user`, `organization`, `team`, `team_member`, `standup_config`, `standup_response` (`processingStatus` values: `awaiting_response` → `pending` → `completed`/`failed`), `insight`, `help_request`, `jira_connection`, `jira_link`, `subscription`.

Schema managed via Drizzle ORM (`drizzle/schema.ts`).

**Soft-delete cascade:** Deleting a team (`DELETE /api/teams/[id]`) soft-deletes all child records in a transaction: `help_request`, `insight`, `jira_link`, `standup_response`, `standup_config`, `team_member`, then `team`. All team-related tables have a `deleted_at` column. A one-time backfill script is at `scripts/backfill-soft-delete-cascade.sql`.

## Auth & Middleware

`proxy.ts` acts as middleware — redirects unauthenticated requests to `/login`. Public routes: `/api/slack/events`, `/api/slack/interactions`, `/api/auth`, `/api/cron`.

Organization limit: Free = 1 org, Pro/Enterprise = up to 5. Enforced via `organizationLimit` async function in `lib/auth.ts`.

## Local Development (ngrok)

```bash
ngrok http 3000          # Start ngrok
npm run dev:urls         # Auto-update .env + Stripe; prints checklist for Google/Slack
```

Manual updates still required after ngrok URL change:
- Google OAuth: add new redirect URI in Google Cloud Console
- Slack: update Event Subscriptions + Interactivity URLs in api.slack.com
