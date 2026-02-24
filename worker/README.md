# ArcLogs Worker

Python-based AI processing service for the ArcLogs standup platform. Consumes messages from AWS SQS, processes standups with GPT-4, manages Jira automation, and sends Slack notifications.

## Tech Stack

- **Python 3.12+** managed by `uv`
- **OpenAI GPT-4** via Agno framework (insight extraction)
- **OpenAI Whisper** for audio transcription (with team context prompt)
- **OpenAI text-embedding-3-small** for pgvector embeddings
- **AWS SQS** (boto3) for message queue
- **PostgreSQL** (psycopg2) with pgvector for vector similarity search
- **Jira REST API v3** + Agile API via custom JiraClient
- **Slack API** (httpx) for notifications

## Setup

```bash
uv sync                       # Install dependencies
uv run python migrations/run_migrations.py   # Enable pgvector + create tables
uv run python backfill_embeddings.py         # One-time: embed existing data
uv run python main.py                        # Start the worker
```

## Files

| File | Purpose |
|------|---------|
| `main.py` | Core worker: SQS polling, plan gates, audio processing, AI analysis, Jira sync, transitions, notifications |
| `jira_client.py` | Jira REST API v3 + Agile API client (create/comment/transition/search/sprint) |
| `pattern_detector.py` | Blocker pattern detection via pgvector embedding clustering |
| `knowledge_base.py` | Team expertise tracking + expert suggestions |
| `migrations/` | SQL migrations (pgvector extension, team_expertise table) |
| `backfill_embeddings.py` | One-time script to embed existing standup responses and insights |
| `debug_audio.py` | Debug Slack audio file download |
| `debug_sprint.py` | Debug sprint issues + team member fetching |
| `debug_search.py` | Debug Jira search API endpoints |

## Subscription Plan Gates

The worker enforces plan gates before running paid features. `get_org_plan(cur, organization_id)` mirrors `lib/limits.ts getOrgPlan()` — reads `subscription.plan` for the org's active/trialing subscription.

| Gate | Location | Free behaviour |
|------|----------|---------------|
| Voice standups | `process_audio_standup()` — before `download_slack_file()` | DMs user to type instead, marks response `failed` |
| Jira automation | `process_standup_response()` — before `sync_to_jira()` | Sets `jira_connection = None`, skips sync + task transitions |

## Processing Pipeline

### Text Standups (`standup_response`)
1. Fetch response + team context (members, sprint issues, board columns, history)
2. GPT-4 extracts insights: blockers, help requests, sentiment, task updates, Jira references
3. **[Pro gate]** Auto-comment on referenced Jira tickets
4. Suggest ticket creation with Slack interactive buttons (user confirms)
5. **[Pro gate]** Transition Jira tickets based on standup context + auto-assign
6. Send help request DMs with expert suggestions
7. Generate + store pgvector embedding
8. Update team knowledge base (expertise topics)
9. Send completion DM with full action summary

### Audio Standups (`audio_standup`)
1. **[Pro gate]** Check voice plan — if Free, DM user and return early
2. Download audio from Slack (Bearer auth with bot token)
3. Transcribe with Whisper (team names + sprint issues as prompt context)
4. GPT-4 parses transcript into per-question answers
5. Update DB with transcript + parsed responses
6. Send transcript preview DM
7. Run the text standup pipeline above

### Daily Digest (`generate_digest`)
1. Aggregate completed responses for team/date
2. Build summary with highlights, blockers, help requests, mood
3. Detect recurring blocker patterns via pgvector clustering
4. Post to team's Slack channel

## Environment Variables

```
AWS_SQS_QUEUE_URL
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
OPENAI_API_KEY
DATABASE_URL
API_BASE_URL   (optional, default http://localhost:3000)
```

## Jira API Notes

- `POST/GET /rest/api/3/search` is **deprecated** (returns 410) — use `GET /rest/api/3/search/jql`
- Board columns fetched via `GET /rest/agile/1.0/board/{id}/configuration` (no type filter)
- Sprint issues fetched via JQL: `project = "X" AND sprint in openSprints()`
- Jira automation only runs when org plan is `pro` or `enterprise` (checked via `get_org_plan()`)

## Multi-Team Standup Routing

When a user is in multiple teams, the cron job pre-creates a `standup_response` record per user per team with `processing_status = 'awaiting_response'` and stores the Slack message `ts` in `slackMessageTs`. When the user replies in a Slack thread, `event.thread_ts` matches the stored `slackMessageTs`, routing the reply to exactly the right team's standup config.

Direct DM replies (no thread) fall back to picking the oldest unanswered standup for that user.
