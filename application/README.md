# ArcLogs Application

Next.js 16 frontend and API layer for the ArcLogs standup platform.

## Tech Stack

- **Next.js 16** with App Router, React 19, TypeScript
- **PostgreSQL** on Neon (serverless) with Drizzle ORM + pgvector
- **Better Auth** - multi-org, email/password, GitHub/Google/Microsoft OAuth
- **Stripe** subscriptions via @better-auth/stripe
- **AWS SQS** for async message queuing to the Python worker
- **Radix UI** + Tailwind CSS 4 + Recharts for the dashboard

## Setup

```bash
npm install
npm run dev          # Dev server (port 3000)
npm run db:push      # Push Drizzle schema to Neon
npm run db:studio    # Drizzle Studio (DB browser)
```

## Project Structure

```
app/
├── (auth)/                    # Login, signup, invitations, org creation
├── (dashboard)/               # Dashboard, teams, settings, billing, analytics
│   └── settings/jira/         # Jira connection management
├── api/
│   ├── auth/[...all]/         # Better Auth proxy
│   ├── slack/
│   │   ├── events/            # Slack event handler (text + audio standups)
│   │   ├── interactions/      # Slack interactive buttons (ticket confirmation)
│   │   ├── oauth/             # Slack app installation
│   │   ├── channels/          # List Slack channels
│   │   ├── users/             # List Slack users
│   │   └── workspace/         # Workspace management
│   ├── jira/                  # Jira connection, test, sync history
│   ├── teams/                 # Team CRUD, members, analytics, help requests
│   ├── standups/              # Standup config CRUD, responses
│   ├── cron/                  # Scheduled standup delivery + digest generation
│   └── ...                    # Billing, usage, invitations
├── components/                # Sidebar, UI primitives, providers
├── drizzle/schema.ts          # All database tables and relations
└── lib/                       # DB, auth, types, utils, limits
```

## Key API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/slack/events` | Receives Slack messages (text + audio), saves to DB, queues to SQS |
| `POST /api/slack/interactions` | Handles interactive button clicks (ticket creation confirm/skip) |
| `GET /api/slack/oauth` | Slack app OAuth installation |
| `GET /api/cron/send-standups` | Cron: send standup DMs to team members |
| `GET /api/cron/generate-digests` | Cron: generate daily team digests |
| `POST /api/jira/test-connection` | Test Jira credentials |

## Database

PostgreSQL on Neon with pgvector extension. Key tables: `user`, `organization`, `team`, `team_member`, `standup_config`, `standup_response` (with `embedding vector(1536)`), `insight`, `help_request`, `jira_connection`, `jira_link`, `team_expertise`, `subscription`.

Schema managed via Drizzle ORM (`drizzle/schema.ts`). Vector columns managed via raw SQL migrations in `worker/migrations/`.

## Auth & Middleware

`proxy.ts` acts as middleware - redirects unauthenticated requests to `/login`. Public routes (no auth required): `/api/slack/events`, `/api/slack/interactions`, `/api/auth`, `/api/cron`.
