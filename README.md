# ArcLogs

Slack-based async standup platform with AI-powered insights and Jira automation.

## What is ArcLogs?

ArcLogs replaces synchronous daily standups with async text and voice responses via Slack. The system transcribes audio (OpenAI Whisper), analyzes responses (GPT-4 with team/sprint context), auto-comments on Jira tickets, transitions ticket statuses, sends help request DMs, and posts team digests.

## Monorepo Structure

```
ArcLogs/
├── application/    # Next.js 16 frontend + API routes (TypeScript)
├── worker/         # Python backend worker (SQS consumer + AI processing)
├── landing/        # Landing page
└── CLAUDE.md       # Full project context for AI assistants
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.12+
- PostgreSQL (Neon recommended)
- AWS account (for SQS)
- OpenAI API key
- Slack workspace (for bot installation)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/samouh-waleed/ArcLogs.git
cd ArcLogs
```

2. **Configure Application**
```bash
cd application
npm install
cp .env.example .env
# Edit .env with your credentials
npm run db:push      # Push schema to Neon PostgreSQL
npm run dev          # Dev server on port 3000
```

3. **Configure Worker**
```bash
cd ../worker
uv sync              # Install dependencies
cp .env.example .env
# Edit .env with your credentials
uv run python migrations/run_migrations.py  # Setup database
uv run python main.py    # Start SQS worker
```

### Local Development
- Use **ngrok** to expose localhost:3000 for Slack webhooks
- Configure Slack app event URL: `https://<ngrok>/api/slack/events`
- Configure Slack interactivity URL: `https://<ngrok>/api/slack/interactions`

## Architecture

```
User records audio or types in Slack DM
    ↓
Next.js API receives Slack event → saves to PostgreSQL → queues to AWS SQS
    ↓
Python Worker picks up message
    ↓ audio? → Download from Slack → Whisper transcription (with team name context)
    ↓         → GPT-4 parses transcript into per-question answers
    ↓
GPT-4 Analysis (with team members + sprint issues + board columns + history)
    ↓
Auto-comment on Jira tickets │ Transition ticket statuses │ Help request DMs
    ↓
Completion DM to user with full action summary
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Database | PostgreSQL on Neon (pgvector enabled) |
| Auth | Better Auth (multi-org, GitHub/Google/Microsoft OAuth) |
| Payments | Stripe subscriptions |
| Queue | AWS SQS |
| AI | OpenAI GPT-4 (Agno framework), Whisper, text-embedding-3-small |
| Worker | Python 3.12+, psycopg2, httpx, pgvector |
| Integrations | Slack API, Jira REST API v3 + Agile API |

## Key Features

- **Voice & text standups** via Slack DM
- **Context-aware AI** - injects team members, sprint issues, board columns, and historical standups into GPT-4
- **Jira automation** - auto-comment on referenced tickets, transition statuses, suggest ticket creation with interactive buttons
- **Smart name matching** - Whisper prompt hints + fuzzy matching handle mispronounced names
- **RAG pipeline** - pgvector embeddings for semantic task matching, blocker pattern detection, team expertise tracking
- **Multi-org tenancy** with role-based access and Stripe billing

## Documentation

See `CLAUDE.md` for comprehensive technical documentation including database schema, API routes, worker pipeline details, and conventions.
