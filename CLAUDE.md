# ArcLogs - Project Context for Claude Code

## What is ArcLogs?
ArcLogs is a **Slack-based async standup platform** that automates daily team check-ins with AI-powered insights. Users respond via **text or voice** in Slack DMs. The system transcribes audio (Whisper), analyzes responses (GPT-4 with team/sprint context), auto-comments on Jira tickets, transitions ticket statuses, sends help request DMs, and posts team digests.

## Monorepo Structure
```
/ArcLogs/
├── application/          # Next.js 16 frontend + API routes (TypeScript)
├── worker/               # Python backend worker (SQS consumer + AI processing)
```

## Architecture Overview
```
Slack Bot DM (text or audio)
    ↓
Next.js API (events/route.ts)
    ↓ detects audio? → save voiceUrl, queue as "audio_standup"
    ↓ text?          → parse responses, queue as "standup_response"
    ↓
PostgreSQL (standup_response) → AWS SQS
                                    ↓
                        Python Worker (main.py)
                                    ↓
              ┌─── audio_standup ───┤─── standup_response ───┐
              ↓                                              ↓
    Download from Slack                              Fetch team context
    Whisper transcription                            (members + sprint issues)
    GPT-4 parse to Q&A                                      ↓
    Update DB responses                              GPT-4 Analysis (Agno)
    → then run standup_response flow →               with team/sprint context
                                                            ↓
                                              ┌─────────────┼─────────────┐
                                              ↓             ↓             ↓
                                        Auto-comment   Task transitions  Help DMs
                                        on Jira keys   (To Do→Progress)  to @mentions
                                              ↓             ↓             ↓
                                              └─────────────┼─────────────┘
                                                            ↓
                                                   Completion DM to user
```

## Application (Next.js)

### Tech Stack
- **Framework**: Next.js 16, React 19, TypeScript
- **Database**: PostgreSQL on Neon (serverless), Drizzle ORM
- **Auth**: Better Auth with multi-org support (email/password, GitHub, Google, Microsoft)
- **Payments**: Stripe subscriptions via @better-auth/stripe
- **Queue**: AWS SQS (@aws-sdk/client-sqs)
- **Email**: Resend
- **UI**: Radix UI, Tailwind CSS 4, Recharts, Lucide icons

### Key Files
- `drizzle/schema.ts` - All database tables and relations
- `lib/db.ts` - Neon serverless pool + Drizzle instance
- `lib/auth.ts` - Better Auth config (org plugin, Stripe plugin, email invitations)
- `lib/db-types.ts` - TypeScript types inferred from schema
- `app/api/slack/events/route.ts` - **CRITICAL**: Receives Slack events (text + audio), saves responses, queues to SQS
- `app/api/slack/oauth/route.ts` - Slack OAuth installation flow
- `app/api/cron/send-standups/route.ts` - Cron job that sends standup DMs to team members
- `app/api/cron/generate-digests/route.ts` - Cron job for daily digest
- `app/api/jira/` - Jira connection management (connection, test-connection, links)
- `app/api/teams/` - Team CRUD, members, analytics, help requests

### Slack Event Handler (events/route.ts)
Handles both text and audio standup responses:
1. Slack sends `message` event (DM to bot)
2. Verify Slack signature
3. Find workspace → check subscription is active/trialing
4. `findAudioFile(event.files)` checks for audio attachments
5. **Audio path**: validate size/duration → save with `responseType: "voice"` + `voiceUrl` → queue `audio_standup` to SQS → DM "Got your audio! Transcribing..."
6. **Text path**: parse numbered responses → validate required questions → save with `responseType: "text"` → queue `standup_response` to SQS
7. Both paths support same-day update/replace (upsert on config+user+date)

### Slack Bot Required Scopes
`chat:write`, `im:write`, `channels:read`, `users:read`, `users:read.email`, `app_mentions:read`, `im:history`, **`files:read`** (required for audio download)

### Database Tables (drizzle/schema.ts)
| Table | Purpose |
|-------|---------|
| `user` | Users with email, name, Stripe customer ID |
| `session` | Auth sessions with activeOrganizationId |
| `account` | OAuth accounts (GitHub, Google, etc.) |
| `organization` | Multi-tenant orgs with slug, trial dates |
| `member` | Org membership with roles (owner/admin/member) |
| `invitation` | Email invitations to orgs |
| `slack_workspace` | Slack workspace connections per org (bot_token, team_id) |
| `jira_connection` | Jira config per org (domain, email, API token, project key) |
| `jira_link` | Maps standup responses to Jira actions (idempotency via blocker_hash + action_type) |
| `team` | Teams within orgs with Slack channel mapping |
| `team_member` | Team membership with slack_user_id |
| `standup_config` | Standup settings (questions, schedule, timezone, days, allowVoiceResponses) |
| `standup_response` | User responses with AI insights + voice fields (voiceUrl, voiceTranscript, voiceDurationSeconds) |
| `insight` | AI-detected blockers and insights |
| `help_request` | Help requests extracted from standups with @mentions |
| `subscription` | Stripe subscription tracking |

## Worker (Python)

### Tech Stack
- **Runtime**: Python 3.12+, managed by `uv`
- **AI**: OpenAI GPT-4 via Agno framework + OpenAI client (Whisper + transcript parsing)
- **Queue**: boto3 (AWS SQS)
- **Database**: psycopg2 (direct PostgreSQL)
- **HTTP**: httpx
- **Jira**: Custom JiraClient class (REST API v3 + Agile API + JQL via /search/jql)

### Key Files
- `main.py` - Main worker: SQS polling, audio processing, AI analysis, Jira sync, task transitions, Slack notifications
- `jira_client.py` - Jira REST API v3 client (create/update/comment/transition/sprint/search)
- `pyproject.toml` - Dependencies (agno, boto3, psycopg2-binary, openai, httpx, python-dotenv, nanoid)

### SQS Message Types
| Type | Handler | Description |
|------|---------|-------------|
| `standup_response` | `process_standup_response()` | Text standup → AI analysis → Jira + notifications |
| `audio_standup` | `process_audio_standup()` | Audio → download → Whisper → parse → then runs standup_response |
| `generate_digest` | `generate_team_digest()` | Daily team digest → post to Slack channel |

### Audio Processing Pipeline (process_audio_standup)
1. Fetch `voice_url` from DB + `bot_token` from `slack_workspace`
2. `download_slack_file()` - httpx GET with Bearer auth, returns (bytes, content_type)
3. `get_audio_extension()` - maps content-type to Whisper-supported extension (mp4, m4a, webm, etc.)
4. `transcribe_audio()` - OpenAI Whisper (`whisper-1` model)
5. `parse_transcript_to_responses()` - GPT-4 splits natural speech into per-question answers (temp=0.3)
6. Updates DB: `voice_transcript` + `responses`
7. Sends transcript preview DM to user
8. Calls `process_standup_response()` for AI analysis

### Context-Aware AI Analysis (extract_insights)
GPT-4 receives standup text PLUS team context for accurate matching:
- **Team members**: names from `team_member` + `user` tables (enables "Farris" → "Farris Abu-Hadba")
- **Sprint issues**: fetched via Jira JQL `sprint in openSprints()` (enables "task 1" → "SCRUM-1")

The AI prompt instructs GPT-4 to:
- Match spoken names to the closest team member (exact spelling)
- Match task references to Jira keys from the sprint
- Only set `jira_intent: "create"` when user EXPLICITLY asks to create a ticket (blockers alone are NOT create intent)

### AI Extraction Output (flat JSON)
```json
{
  "blockers": ["string"],
  "help_needed": [{"topic": "string", "mentions": ["@Name"]}],
  "sentiment": "positive|neutral|negative",
  "action_items": ["string"],
  "summary": "string",
  "referenced_jira_keys": ["SCRUM-1"],
  "jira_intent": "create|update|comment|none",
  "jira_suggestions": {"issue_type", "priority", "assignee", "title", "description"} | null,
  "task_updates": [{"task_ref": "SCRUM-1", "status": "in_progress|done|in_review"}]
}
```

### Jira Automation (sync_to_jira + transitions)

**Auto-comment on ALL referenced Jira keys** (always safe):
- Blocker comment (`⚠️`) if blocker text mentions the key
- Progress update (`✅`) if jira_intent is "update"
- General mention (`📝`) otherwise
- Idempotency: one `auto_comment` per key per response via `jira_link` table

**Ticket creation** (confirmation-based via Slack buttons):
- `jira_intent: "create"` required (user must say "create a ticket")
- Worker sends interactive Slack DM with `[Create Ticket]` / `[Skip]` buttons
- Button clicks handled by `app/api/slack/interactions/route.ts`
- On confirm: creates ticket via Jira REST API, assigns to active sprint, updates Slack message
- On skip: acknowledges and updates message
- `proxy.ts` must include `/api/slack/interactions` in `publicRoutes`

**Task transitions** (from `task_updates`):
- Matches task_ref to sprint issues by key, summary, or number
- `transition_issue()` with fuzzy status matching (aliases: "in_progress" → "In Progress", etc.)

**Help request DMs**:
- `fuzzy_match_team_member()` matches AI @mentions to DB team members (handles misspelled names)
- Falls back to Slack API `users.list` lookup
- Sends contextual help request DM with topic + standup summary

**Completion DM** (sent after all processing):
- Shows task transitions, tickets created, comments added, help requests sent
- Fixes the "stuck at Analyzing" issue for audio responses

### Jira Client (jira_client.py)
| Method | API | Purpose |
|--------|-----|---------|
| `create_issue()` | POST /rest/api/3/issue | Create ticket with ADF description |
| `add_comment()` | POST /rest/api/3/issue/{key}/comment | Add ADF comment |
| `get_issue()` | GET /rest/api/3/issue/{key} | Fetch issue details |
| `update_issue()` | PUT /rest/api/3/issue/{key} | Update fields |
| `transition_issue()` | GET+POST /rest/api/3/issue/{key}/transitions | Transition with fuzzy status matching |
| `get_sprint_issues()` | GET /rest/api/3/search/jql | JQL search for active sprint issues |
| `get_active_sprint()` | GET /rest/agile/1.0/board + sprint | Find active sprint (no board type filter) |
| `move_to_sprint()` | POST /rest/agile/1.0/sprint/{id}/issue | Assign issue to sprint |
| `search_user_by_email()` | GET /rest/api/3/user/search | Find Jira user by email |
| `test_connection()` | GET /rest/api/3/myself | Verify credentials |

**Important**: Jira Cloud deprecated `POST/GET /rest/api/3/search` (returns 410). Use `GET /rest/api/3/search/jql` instead.

### Environment Variables (worker/.env)
```
AWS_SQS_QUEUE_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
OPENAI_API_KEY
DATABASE_URL
API_BASE_URL (optional, default http://localhost:3000)
```

## Development Setup

### Application
```bash
cd application
npm install
npm run dev        # Next.js dev server (port 3000)
npm run db:push    # Push schema to Neon
npm run db:studio  # Drizzle Studio
```

### Worker
```bash
cd worker
uv sync            # Install dependencies
uv run python main.py  # Start worker
```

### Local Development
- Use **ngrok** to expose localhost:3000 for Slack webhooks: `ngrok http 3000`
- After ngrok restarts and gives a new URL, run **`npm run dev:urls`** from `application/` — this auto-updates `.env` and the Stripe webhook endpoint, then prints a copy-paste checklist for Google/Slack/Microsoft consoles
- Script location: `application/scripts/dev-urls.mjs`
- Auto-updated: `BETTER_AUTH_BASE_URL`, `NEXT_PUBLIC_APP_URL`, Stripe webhook URL (+ `STRIPE_WEBHOOK_SECRET` if a new endpoint is created)
- Manual (can't be API-automated): Google OAuth redirect URIs, Slack event/interactivity/OAuth URLs, Microsoft OAuth redirect URIs
- After running the script: `Ctrl+C` → `npm run dev` to pick up the new `.env`
- Debug scripts: `debug_audio.py`, `debug_sprint.py`, `debug_search.py`

## Subscription Plans

Plan limits are enforced in `lib/limits.ts`. The `subscription.plan` field (set by Better Auth Stripe plugin) is the source of truth. Plan names: `"free"` | `"pro"` | `"enterprise"`.

| Limit / Feature | Free | Pro ($8/user/mo) |
|---|---|---|
| Organizations | 1 | Up to 5 |
| Teams per org | 1 | Unlimited |
| Org members | 5 | Unlimited (billed per member via Stripe) |
| Standup configs per team | 1 | Unlimited |
| Voice standups (Whisper) | ❌ | ✅ |
| Jira automation | ❌ | ✅ |
| History retention | 30 days | Unlimited |

**Plan inheritance:** If a new org has no subscription, `getOrgPlan()` checks if the org owner has Pro on any other org they belong to and inherits that plan. This means a Pro user creating a second org gets Pro on it immediately without a separate Stripe subscription.

**Env vars:** `STRIPE_PRO_PRICE_ID`, `STRIPE_ENTERPRISE_PRICE_ID` (see `.env.example`)

**Frontend/API feature gate helpers:** `canUseVoice(orgId)`, `canUseJira(orgId)` in `lib/limits.ts`

**Voice UI gate (implemented):**
- `POST /api/standups` and `PUT /api/standups/[id]` — `canUseVoice(orgId)` clamps `allowVoiceResponses → false` for free orgs server-side
- `standups/new/page.tsx`, `standups/[configId]/edit/page.tsx` — fetch `features.voice` from `/api/organization-usage`, show Skeleton while loading, Lock row with "Upgrade to Pro" link for free, normal Switch for pro
- `components/team-setup-wizard.tsx` — same pattern; uses `voiceEnabled === false` (strict) so Switch stays visible while loading (`null`)

**Worker feature gates (`worker/main.py`):**
- `get_org_plan(cur, organization_id)` — Python mirror of `getOrgPlan()`, reads `subscription.plan`
- Voice gate in `process_audio_standup`: checked after `bot_token` is set, before `download_slack_file`. Free plan → DM user + mark response `failed` + return early.
- Jira gate in `process_standup_response`: checked after `jira_connection` is resolved, before `sync_to_jira`. Free plan → sets `jira_connection = None`, which also skips task transitions (both blocks already gated on `if jira_connection`).

**Architecture decision:** Slack workspace and Jira connection remain org-level (one per org). Teams select a channel from the org's Slack workspace. Team-level Jira project overrides (`team.jiraProjectKey`) handle the case where teams work on different Jira projects.

**Dashboard upgrade prompts (implemented):**
- `app/(dashboard)/page.tsx` — fetches `/api/organization-usage` on mount; renders a plan status banner for free orgs (amber/at-limit or blue/below-limit) with usage pills and "Upgrade" CTA → `/billing`; each stat card (Teams, Members, Standups) shows a `Progress` bar + `X/limit` text with `text-destructive` when at 100%
- `app/(dashboard)/billing/page.tsx` — fixed `currentPlan` to read `activeSubscription.plan` instead of hardcoded `"pro"` (enterprise was misidentified); fixed usage display to handle `null` limits (`"/ ∞"`); at-limit counts shown in `text-destructive`

**Stripe subscription webhook callbacks (`lib/auth.ts`):**
- Better Auth's Stripe plugin handles all Stripe webhook events automatically at `/api/auth/[...all]` (already in `publicRoutes` — no middleware change needed)
- `getOrgOwnerEmail(orgId)` — helper that queries `member` (role=owner) + `user` tables to get the org owner's name/email for transactional emails
- `onSubscriptionComplete` — sends "You're on Pro/Enterprise" upgrade confirmation email via Resend listing unlocked features
- `onSubscriptionUpdate` — logs id/org/status/plan with structured output
- `onSubscriptionCancel` — sends "Your subscription has ended" email via Resend listing what changes on Free + a Resubscribe CTA button
- Callbacks are wrapped in try/catch so email failures never break the webhook acknowledgement
- Schema imports aliased: `user as userTable` added alongside existing `member as memberTable`, `subscription as subscriptionTable`

**Jira UI gate (implemented):**
- `POST /api/jira/connection` — returns 403 `{ upgradeRequired: true }` on free plan
- `POST /api/jira/test-connection` — accepts `organizationId` in body, returns 403 on free plan
- `app/(dashboard)/settings/jira/page.tsx` — fetches `features.jira` from `/api/organization-usage`, shows upgrade wall (Lock icon + "Upgrade to Pro" → `/billing`) on free
- `components/team-jira-config.tsx` — same upgrade wall pattern

**Multi-org support:** `auth.ts` `organizationLimit` is an async function. Returns `true` (block) if `currentOrgCount >= maxOrgs`. `maxOrgs = 5` for Pro or Enterprise users (any of their existing orgs has active/trialing Pro/Enterprise subscription), otherwise `maxOrgs = 1` for Free. The "Create Organization" option in the Sidebar is only shown to Pro users who haven't hit the 5-org cap. Navigates to `/create-organization?new=1` (the `?new=1` param skips the "redirect if has orgs" logic, allowing intentional new org creation). After creation, `window.location.href = "/"` forces a full reload to clear Better Auth and React Query caches so the new org appears in the org switcher immediately.

## Current Feature Status (Feb 2026)

### Core Features (Tested & Working)
- [x] Slack bot standup DMs with customizable questions
- [x] Text response parsing and processing
- [x] **Voice/audio standup responses** (Whisper transcription + GPT-4 Q&A parsing)
- [x] Context-aware GPT-4 analysis (team members + sprint issues + board columns in prompt)
- [x] Auto-comment on all referenced Jira tickets (blocker/update/mention context)
- [x] Auto-transition Jira tickets with dynamic board column detection
- [x] Auto-assignment of tickets to user who mentions them
- [x] Smart ticket creation with Slack interactive buttons (suggest → confirm → create)
- [x] Fuzzy name matching for help request DMs
- [x] Completion DM with full action summary (transitions, comments, help requests, patterns)
- [x] Jira idempotency (SHA256 hash + DB unique constraint)
- [x] Daily team digest posted to Slack channel
- [x] Multi-org tenancy with Better Auth
- [x] Stripe subscription management
- [x] Same-day standup edit/update support
- [x] Jira connection management UI (/settings/jira)

### RAG Features (Implemented, Needs End-to-End Testing)
- [~] RAG Phase 1A: Whisper prompt injection (team names + sprint issues as context)
- [~] RAG Phase 1B: Historical context in GPT-4 prompt (last 5 standups + active blockers)
- [~] RAG Phase 1C: In-memory TTL cache for team members + sprint issues
- [x] RAG Phase 2: pgvector enabled, embeddings on standup_response + insight (backfilled)
- [~] RAG Phase 3A: Semantic task matching via embedding similarity fallback
- [~] RAG Phase 3B: Blocker pattern detection in daily digests + similar past blockers
- [~] RAG Phase 3C: Team knowledge base (expertise extraction + expert suggestions)
Note: [~] = implemented but not fully end-to-end tested in production-like scenario

### Not Yet Implemented
- [ ] RAG Phase 4: Learning system (decision tracking, feedback buttons, confidence tuning)
- [ ] Transcript preview & edit before AI submission (Slack modal)
- [ ] Web-based audio recorder
- [ ] Dashboard enhancements (show audio transcripts, Jira activity, expertise, patterns)
- [ ] Production deployment (move from ngrok to hosted)
- [ ] Redis caching (currently using in-memory, lost on worker restart)
- [ ] Monitoring/error tracking (Sentry)
- [ ] Unit/integration tests
- [ ] Team analytics & reporting (sentiment trends, velocity, weekly summaries)

## Analytics Fixes (Feb 2026)
**Files:** `app/api/teams/[id]/analytics/route.ts`, `app/(dashboard)/teams/[id]/analytics/page.tsx`, `app/(dashboard)/analytics/page.tsx`

Key bugs fixed:
1. **`awaiting_response` inflation** — cron pre-creates standup records before user replies; all count queries now add `AND processing_status != 'awaiting_response'` (response rate, total responses, member participation)
2. **Participation % denominator** — was dividing by calendar days (e.g. 30); now uses `analytics.responseRate.length` = actual days standups occurred, so Mon-Fri teams correctly show 100% for perfect responders
3. **Org sentiment unweighted** — now weighted by `total_responses` per team; teams with 0 responses excluded
4. **NULL sentiment counted as neutral** — added `AND ai_insights->>'sentiment' IS NOT NULL` to query; page skips null rows instead of bucketing as neutral
5. **Processing time "0s"** — shows "—" when `avgProcessingTime` is null/0
6. **Blank page on no data** — both analytics pages now show a proper empty state
7. **Division by zero in response rate** — guarded `item.total_members > 0`
8. **New stats added**: `completedResponses` (AI pipeline health), `voiceResponses`/`textResponses` (response type breakdown card)

## Slack Workspace Switching (fixed)
- **Root bug**: OAuth route searched for existing workspace by `slackTeamId` (Slack's ID), not `organizationId`. Switching workspaces created a second active record; `findFirst` returned the stale one.
- **Fix**: OAuth now finds the org's current active workspace by `organizationId` first. If the new workspace has a different `slackTeamId` (i.e. switching), it: (1) soft-deletes the old workspace record, (2) clears `slackUserId` for all team members in the org (their IDs came from the old workspace), (3) creates/restores the new workspace record.
- **Dashboard**: `slack_switched` redirect shows "workspace switched, re-add members" banner.
- **Standups page**: replaced `alert()` with inline `Alert` components; adds a persistent amber warning banner when any team member has no `slackUserId`, with a direct link to the members picker.

## Multi-User / Session Isolation (fixed bugs)
- `GET /api/slack/workspace` — added membership check (was missing, any user could see any org's Slack bot)
- `GET /api/slack/channels` — added membership check (same issue)
- `GET /api/jira/connection` — added membership check (same issue)
- `create-organization/page.tsx` — removed trust in client-cached `activeOrg`; always calls `authClient.organization.list()` server-side. Previously `else if (activeOrg) { router.push("/") }` would send a new user straight to the dashboard if the auth client had stale org data from the previous user.
- `Sidebar.tsx` `handleSignOut` — changed `router.push("/login")` to `window.location.href = "/login"` to force a full page reload, clearing all React state and auth-client in-memory caches between users.

## Standup Thread-Based Routing (multi-team users)

When a user is in multiple teams and both teams send standups, the bot sends separate messages for each team. The cron job pre-creates a `standup_response` row with `processingStatus = 'awaiting_response'` for each user+config, storing the Slack message `ts` in `slackMessageTs`. The message instructs users to **Reply in this thread**. When the user replies in a thread, `event.thread_ts = bot_message_ts` → events handler looks up the matching `awaiting_response` record → routes to the correct team's config. If the user types directly in the DM (no thread), the fallback picks the oldest unanswered standup and notifies them about other pending teams. `processingStatus` values: `awaiting_response` (pre-created) → `pending` (user replied, queued for AI) → `completed` / `failed`. Analytics queries must exclude `awaiting_response` records to avoid inflating response counts.

## Slack Workspace Switching

When an admin connects a **different** Slack workspace (not the same one reconnected), `app/api/slack/oauth/route.ts`:
1. Finds the org's current active workspace by `organizationId` (not `slackTeamId`)
2. Soft-deletes the old workspace record
3. Clears `slackUserId` for all team members in the org (their IDs came from the old workspace)
4. Redirects with `?success=slack_switched` banner warning admin to re-add membersAfter switching, the "Add Members" picker shows which Slack users are already in teams (Linked/Needs linking/New) and pre-selects "Needs linking" users for fast re-linking.

## Analytics

**Files:** `app/api/teams/[id]/analytics/route.ts`, `app/(dashboard)/teams/[id]/analytics/page.tsx`, `app/(dashboard)/analytics/page.tsx`

Key correctness rules:
- All response count queries exclude `processing_status = 'awaiting_response'` (pre-created, not yet answered)
- Participation % denominator = `analytics.responseRate.length` (actual standup days) not the calendar time range
- Org-level sentiment is weighted by `total_responses` per team (not simple average)
- `avgProcessingTime` returns `null` when no completed responses → UI shows `"—"` not `"0s"`
- Sentiment query includes `AND ai_insights->>'sentiment' IS NOT NULL` to exclude unprocessed rows

## Conventions
- **IDs**: nanoid for application-generated IDs, gen_random_uuid()::text in worker SQL
- **Soft deletes**: `deleted_at` column pattern throughout
- **Timestamps**: `created_at`, `updated_at` on all tables
- **Org scoping**: All data is scoped through organization → team → member chain
- **Slack user mapping**: `team_member.slack_user_id` maps Slack users to app users
- **SQS messages**: JSON with `type` field for routing (`standup_response`, `audio_standup`, `generate_digest`)
- **Jira idempotency**: `jira_link` table with unique constraint on (response_id, blocker_hash, action_type)
- **Jira search**: Use `GET /rest/api/3/search/jql` (POST /search is deprecated/410)
- **Audio file format**: Slack mic clips are `video/mp4`, use `get_audio_extension()` to map content-type to Whisper-supported extension
