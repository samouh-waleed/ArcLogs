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
| `main.py` | Core worker: SQS polling, audio processing, AI analysis, Jira sync, transitions, notifications |
| `jira_client.py` | Jira REST API v3 + Agile API client (create/comment/transition/search/sprint) |
| `pattern_detector.py` | Blocker pattern detection via pgvector embedding clustering |
| `knowledge_base.py` | Team expertise tracking + expert suggestions |
| `migrations/` | SQL migrations (pgvector extension, team_expertise table) |
| `backfill_embeddings.py` | One-time script to embed existing standup responses and insights |
| `debug_audio.py` | Debug Slack audio file download |
| `debug_sprint.py` | Debug sprint issues + team member fetching |
| `debug_search.py` | Debug Jira search API endpoints |

## Processing Pipeline

### Text Standups (`standup_response`)
1. Fetch response + team context (members, sprint issues, board columns, history)
2. GPT-4 extracts insights: blockers, help requests, sentiment, task updates, Jira references
3. Auto-comment on referenced Jira tickets
4. Suggest ticket creation with Slack interactive buttons (user confirms)
5. Transition Jira tickets based on standup context + auto-assign
6. Send help request DMs with expert suggestions
7. Generate + store pgvector embedding
8. Update team knowledge base (expertise topics)
9. Send completion DM with full action summary

### Audio Standups (`audio_standup`)
1. Download audio from Slack (Bearer auth with bot token)
2. Transcribe with Whisper (team names + sprint issues as prompt context)
3. GPT-4 parses transcript into per-question answers
4. Update DB with transcript + parsed responses
5. Send transcript preview DM
6. Run the text standup pipeline above

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
```

## Jira API Notes

- `POST/GET /rest/api/3/search` is **deprecated** (returns 410) - use `GET /rest/api/3/search/jql`
- Board columns fetched via `GET /rest/agile/1.0/board/{id}/configuration` (no type filter)
- Sprint issues fetched via JQL: `project = "X" AND sprint in openSprints()`
