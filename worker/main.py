# worker/main.py
import os
import json
import time
import base64
import boto3
from dotenv import load_dotenv
from agno.agent import Agent
from agno.models.openai import OpenAIChat
import httpx
import re
import hashlib
import io
from datetime import datetime
from typing import Dict, List, Optional
import psycopg2
from openai import OpenAI
from psycopg2.extras import RealDictCursor
from nanoid import generate as nanoid
from jira_client import JiraClient

try:
    from pgvector.psycopg2 import register_vector
    PGVECTOR_AVAILABLE = True
except ImportError:
    PGVECTOR_AVAILABLE = False
    print("⚠️ pgvector not installed, embeddings disabled")

load_dotenv()

# ── Sentry error monitoring ──────────────────────────────────────────────────
import sentry_sdk

if os.getenv("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        traces_sample_rate=0.1,
        send_default_pii=False,
    )
    print("Sentry initialized")

# ── Secret decryption ─────────────────────────────────────────────────────────
# Mirrors lib/crypto.ts in the Next.js app.
# Stored format:  base64(iv):base64(authTag):base64(ciphertext)   (AES-256-GCM)
# Falls back to returning the raw value if it doesn't look encrypted, so
# existing plaintext values keep working while the DB migration runs.

def decrypt_value(text: str) -> str:
    """Decrypt an AES-256-GCM value encrypted by the Next.js app.

    Returns the plaintext, or the original text if it is not in the encrypted
    format (graceful fallback for legacy plaintext values).
    """
    if not text or text.count(":") != 2:
        return text  # plaintext fallback

    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM

        key_hex = os.getenv("ENCRYPTION_KEY", "")
        if not key_hex:
            print("⚠️ ENCRYPTION_KEY not set — using value as-is")
            return text

        iv_b64, auth_tag_b64, ciphertext_b64 = text.split(":")
        iv = base64.b64decode(iv_b64)
        auth_tag = base64.b64decode(auth_tag_b64)
        ciphertext = base64.b64decode(ciphertext_b64)

        key = bytes.fromhex(key_hex)
        aesgcm = AESGCM(key)
        # Python's cryptography library expects ciphertext + authTag concatenated
        decrypted = aesgcm.decrypt(iv, ciphertext + auth_tag, None)
        return decrypted.decode("utf-8")
    except Exception as e:
        print(f"⚠️ decrypt_value() failed: {e} — using value as-is")
        return text

# ─────────────────────────────────────────────────────────────────────────────


# Configuration
SQS_QUEUE_URL = os.getenv("AWS_SQS_QUEUE_URL")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")
SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN")

# Initialize SQS
sqs = boto3.client(
    "sqs",
    region_name=AWS_REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

# Initialize OpenAI client (for Whisper + transcript parsing)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Initialize Agent with GPT-4
agent = Agent(
    name="StandupAnalyzer",
    model=OpenAIChat(id="gpt-4", api_key=OPENAI_API_KEY),
    description="Analyzes daily standup responses to extract insights, blockers, help requests, and sentiment",
    instructions=[
        "You are an expert at analyzing team standup responses.",
        "Extract key information: blockers, help requests (with @mentions), sentiment, and action items.",
        "Be concise and accurate. Focus on actionable insights.",
        "When someone mentions needing help or asks for assistance, identify who they're asking.",
        "Detect sentiment: positive (making progress), neutral (routine updates), negative (blocked/frustrated).",
    ],
    markdown=True,
)


# Database helper
def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    if PGVECTOR_AVAILABLE:
        try:
            register_vector(conn)
        except Exception:
            pass  # pgvector extension may not be enabled yet
    return conn


# ============================================
# IN-MEMORY CONTEXT CACHE (10-minute TTL)
# ============================================
_cache: Dict = {}
_cache_ttl = 600  # seconds

def get_cached(key: str):
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < _cache_ttl:
        return entry["data"]
    return None

def set_cached(key: str, data):
    _cache[key] = {"data": data, "ts": time.time()}

def get_team_members_cached(cur, team_id: str) -> List[Dict]:
    cache_key = f"members:{team_id}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached
    cur.execute("""
        SELECT u.name, tm.slack_user_id
        FROM team_member tm
        JOIN "user" u ON tm.user_id = u.id
        WHERE tm.team_id = %s AND tm.deleted_at IS NULL
    """, (team_id,))
    members = [{"name": r["name"], "slack_user_id": r["slack_user_id"]} for r in cur.fetchall()]
    set_cached(cache_key, members)
    return members

def get_sprint_issues_cached(jira_connection: Dict) -> List[Dict]:
    pk = jira_connection.get("default_project_key", "")
    cache_key = f"sprint:{jira_connection['id']}:{pk}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached
    jc = JiraClient(
        domain=jira_connection["jira_domain"],
        email=jira_connection["jira_email"],
        api_token=decrypt_value(jira_connection["jira_api_token"]),
    )
    issues = jc.get_sprint_issues(pk)
    set_cached(cache_key, issues)
    return issues


def get_board_columns_cached(jira_connection: Dict) -> List[str]:
    pk = jira_connection.get("default_project_key", "")
    cache_key = f"columns:{jira_connection['id']}:{pk}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached
    jc = JiraClient(
        domain=jira_connection["jira_domain"],
        email=jira_connection["jira_email"],
        api_token=decrypt_value(jira_connection["jira_api_token"]),
    )
    columns = jc.get_board_columns(pk)
    set_cached(cache_key, columns)
    return columns


# ============================================
# HISTORICAL CONTEXT FOR AI
# ============================================
def fetch_recent_context(cur, user_id: str, team_id: str, days: int = 5) -> Dict:
    """Fetch recent standup history for context injection into GPT-4 prompt."""
    # User's recent standups
    cur.execute("""
        SELECT response_date, ai_insights
        FROM standup_response
        WHERE user_id = %s AND team_id = %s
          AND processing_status = 'completed'
          AND deleted_at IS NULL
        ORDER BY response_date DESC
        LIMIT %s
    """, (user_id, team_id, days))
    user_history = cur.fetchall()

    # Active blockers for the team
    cur.execute("""
        SELECT title, description, severity
        FROM insight
        WHERE team_id = %s
          AND insight_type = 'blocker'
          AND status = 'open'
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 10
    """, (team_id,))
    active_blockers = cur.fetchall()

    # Open help requests
    cur.execute("""
        SELECT topic, description, status
        FROM help_request
        WHERE team_id = %s
          AND status = 'open'
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 5
    """, (team_id,))
    open_help = cur.fetchall()

    return {
        "user_history": user_history,
        "active_blockers": active_blockers,
        "open_help_requests": open_help,
    }


# ============================================
# EMBEDDING GENERATION (pgvector / RAG)
# ============================================

def generate_embedding(text: str) -> Optional[List[float]]:
    """Generate a 1536-dim embedding using OpenAI text-embedding-3-small.

    Cost: ~$0.00002 per call. Returns None on failure.
    """
    if not text or not text.strip():
        return None
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text[:8000],  # Model limit is 8191 tokens
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"⚠️ Embedding generation failed: {e}")
        return None


def build_embedding_text(
    responses: Dict, insights: Dict, user_name: str
) -> str:
    """Build rich text for embedding from standup data.

    Combines raw responses + AI-extracted meaning for a semantic
    representation that captures both what was said and what it means.
    """
    parts = [f"Standup by {user_name}:"]

    # Raw response text
    for value in responses.values():
        if value and value not in ("No answer", "Not mentioned", "(covered in audio response above)"):
            parts.append(value)

    # AI summary
    summary = insights.get("summary", "")
    if summary:
        parts.append(f"Summary: {summary}")

    # Blockers (important for pattern detection)
    blockers = insights.get("blockers", [])
    if blockers:
        parts.append("Blockers: " + "; ".join(blockers))

    # Action items
    actions = insights.get("action_items", [])
    if actions:
        parts.append("Actions: " + "; ".join(actions))

    # Referenced Jira keys
    jira_keys = insights.get("referenced_jira_keys", [])
    if jira_keys:
        parts.append("Jira: " + ", ".join(jira_keys))

    return " ".join(parts)


def _to_pgvector_str(embedding) -> str:
    """Convert an embedding (list or numpy array) to pgvector-compatible string."""
    return "[" + ",".join(str(float(x)) for x in embedding) + "]"


def store_embedding(cur, table: str, record_id: str, embedding: List[float]):
    """Store an embedding vector in a table's embedding column."""
    try:
        cur.execute(
            f'UPDATE {table} SET embedding = %s::vector WHERE id = %s',
            (_to_pgvector_str(embedding), record_id),
        )
    except Exception as e:
        print(f"⚠️ Failed to store embedding for {table}/{record_id}: {e}")


def find_similar_standups(
    cur,
    query_embedding: List[float],
    team_id: str,
    limit: int = 5,
    exclude_response_id: Optional[str] = None,
) -> List[Dict]:
    """Find semantically similar past standups using pgvector cosine similarity.

    Returns top N most similar standup responses from the same team,
    ordered by similarity (lower distance = more similar).
    """
    try:
        embedding_str = _to_pgvector_str(query_embedding)

        if exclude_response_id:
            cur.execute("""
                SELECT
                    sr.id,
                    sr.response_date,
                    sr.ai_insights,
                    u.name as user_name,
                    sr.embedding <=> %s::vector AS distance
                FROM standup_response sr
                JOIN "user" u ON sr.user_id = u.id
                WHERE sr.team_id = %s
                  AND sr.embedding IS NOT NULL
                  AND sr.id != %s
                  AND sr.deleted_at IS NULL
                ORDER BY sr.embedding <=> %s::vector
                LIMIT %s
            """, (embedding_str, team_id, exclude_response_id, embedding_str, limit))
        else:
            cur.execute("""
                SELECT
                    sr.id,
                    sr.response_date,
                    sr.ai_insights,
                    u.name as user_name,
                    sr.embedding <=> %s::vector AS distance
                FROM standup_response sr
                JOIN "user" u ON sr.user_id = u.id
                WHERE sr.team_id = %s
                  AND sr.embedding IS NOT NULL
                  AND sr.deleted_at IS NULL
                ORDER BY sr.embedding <=> %s::vector
                LIMIT %s
            """, (embedding_str, team_id, embedding_str, limit))

        return cur.fetchall()
    except Exception as e:
        print(f"⚠️ Similarity search failed: {e}")
        return []


def find_similar_blockers(
    cur,
    query_embedding: List[float],
    team_id: str,
    limit: int = 5,
) -> List[Dict]:
    """Find similar past blockers using pgvector cosine similarity."""
    try:
        embedding_str = _to_pgvector_str(query_embedding)
        cur.execute("""
            SELECT
                i.id,
                i.title,
                i.description,
                i.severity,
                i.status,
                i.created_at,
                i.embedding <=> %s::vector AS distance
            FROM insight i
            WHERE i.team_id = %s
              AND i.insight_type = 'blocker'
              AND i.embedding IS NOT NULL
              AND i.deleted_at IS NULL
            ORDER BY i.embedding <=> %s::vector
            LIMIT %s
        """, (embedding_str, team_id, embedding_str, limit))
        return cur.fetchall()
    except Exception as e:
        print(f"⚠️ Blocker similarity search failed: {e}")
        return []


# Validate and extract Jira keys from text
def extract_jira_keys(text: str) -> List[str]:
    """Extract valid Jira issue keys from text (e.g., ABC-123, PROJ-456)"""
    # Jira key pattern: 2-10 uppercase letters, hyphen, 1+ digits
    pattern = r'\b([A-Z]{2,10}-\d+)\b'
    matches = re.findall(pattern, text)
    # Remove duplicates while preserving order
    seen = set()
    unique_keys = []
    for key in matches:
        if key not in seen:
            seen.add(key)
            unique_keys.append(key)
    return unique_keys


# Calculate blocker hash for idempotency
def calculate_blocker_hash(blocker_text: str) -> str:
    """
    Generate consistent hash for blocker deduplication

    Normalizes text (lowercase, remove punctuation, collapse whitespace)
    then creates SHA256 hash for idempotency checks
    """
    # Normalize: lowercase, strip whitespace
    normalized = blocker_text.lower().strip()

    # Remove punctuation, keep only alphanumeric and spaces
    normalized = ''.join(c for c in normalized if c.isalnum() or c.isspace())

    # Collapse whitespace
    normalized = ' '.join(normalized.split())

    # SHA256 hash
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()


# Get Jira connection for organization
def get_jira_connection(cur, organization_id: str) -> Optional[Dict]:
    """Get active Jira connection for organization"""
    cur.execute("""
        SELECT *
        FROM jira_connection
        WHERE organization_id = %s
          AND is_active = TRUE
          AND deleted_at IS NULL
    """, (organization_id,))
    return cur.fetchone()


def get_org_plan(cur, organization_id: str) -> str:
    """Return active plan name ('free', 'pro', 'enterprise') for the given org.

    Mirrors lib/limits.ts getOrgPlan(). Reads subscription.plan for the most
    recent active or trialing subscription. Falls back to 'free'.
    """
    cur.execute("""
        SELECT plan
        FROM subscription
        WHERE reference_id = %s
          AND status IN ('active', 'trialing')
        ORDER BY created_at DESC
        LIMIT 1
    """, (organization_id,))
    row = cur.fetchone()
    if not row or not row["plan"]:
        return "free"
    plan = row["plan"]
    return plan if plan in ("pro", "enterprise") else "free"


# Check if Jira link already exists (idempotency)
def check_existing_jira_link(
    cur,
    standup_response_id: str,
    blocker_hash: str,
    action_type: str
) -> Optional[Dict]:
    """Check if Jira ticket already created for this blocker"""
    cur.execute("""
        SELECT *
        FROM jira_link
        WHERE standup_response_id = %s
          AND blocker_hash = %s
          AND action_type = %s
    """, (standup_response_id, blocker_hash, action_type))
    return cur.fetchone()


# Create Jira link record
def create_jira_link(
    cur,
    standup_response_id: str,
    jira_issue_key: str,
    jira_issue_id: str,
    jira_issue_url: str,
    blocker_hash: str,
    action_type: str,
    jira_response: Dict,
    error_message: Optional[str] = None
):
    """Insert Jira link record"""
    cur.execute("""
        INSERT INTO jira_link (
            id, standup_response_id, jira_issue_key, jira_issue_id,
            jira_issue_url, blocker_hash, action_type, synced_at,
            jira_response, error_message, created_at, updated_at
        )
        VALUES (
            %s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s, NOW(), NOW()
        )
        ON CONFLICT (standup_response_id, blocker_hash, action_type)
        DO NOTHING
    """, (
        nanoid(),
        standup_response_id,
        jira_issue_key,
        jira_issue_id,
        jira_issue_url,
        blocker_hash,
        action_type,
        json.dumps(jira_response),
        error_message,
    ))


# Extract insights from responses using Agno
def extract_insights(
    responses: Dict[str, str],
    questions: List[Dict],
    team_context: Optional[Dict] = None,
) -> Dict:
    """Use Agno agent to extract insights from standup responses.

    team_context can include:
        - team_members: list of {name, slack_user_id}
        - sprint_issues: list of {key, summary, status}
    """

    # Format the standup for analysis
    standup_text = "Daily Standup Response:\n\n"
    for question in questions:
        answer = responses.get(question["id"], "No answer")
        standup_text += f"Q: {question['text']}\nA: {answer}\n\n"

    # Build context section if available
    context_section = ""
    if team_context:
        members = team_context.get("team_members", [])
        issues = team_context.get("sprint_issues", [])

        if members:
            member_lines = "\n".join(
                [f"- {m['name']}" for m in members]
            )
            context_section += f"""
TEAM MEMBERS (match spoken names to the closest name here, use exact spelling):
{member_lines}
"""

        if issues:
            issue_lines = "\n".join(
                [f"- {i['key']}: {i['summary']} (Status: {i['status']})" for i in issues]
            )
            context_section += f"""
ACTIVE SPRINT ISSUES (match mentioned tasks to the closest Jira key here):
{issue_lines}
"""

        if members or issues:
            context_section += """
MATCHING RULES:
- When the user mentions a person by name (even if mispronounced/misspelled), match to the closest TEAM MEMBER above and use their exact name with @.
- When the user mentions a task by name or number (e.g., "task one", "task 2", "the login bug"), match to the closest SPRINT ISSUE above and use the Jira key (e.g., SCRUM-1) as the task_ref.
- For help_needed mentions, ALWAYS use the exact team member name from the list above.
- For task_updates task_ref, ALWAYS use the Jira key (e.g., SCRUM-1) from the list above.
"""

        # Historical context
        recent = team_context.get("recent_context", {})
        user_history = recent.get("user_history", [])
        active_blockers = recent.get("active_blockers", [])
        open_help = recent.get("open_help_requests", [])

        if user_history:
            history_lines = []
            for h in user_history[:3]:
                insights_data = h.get("ai_insights") or {}
                summary = insights_data.get("summary", "")
                hblockers = insights_data.get("blockers", [])
                date = str(h.get("response_date", ""))
                line = f"- {date}: {summary}"
                if hblockers:
                    line += f" [Blockers: {'; '.join(hblockers[:2])}]"
                history_lines.append(line)
            context_section += f"""
THIS USER'S RECENT STANDUPS (detect continuity, resolved blockers, ongoing work):
{chr(10).join(history_lines)}
"""

        if active_blockers:
            blocker_lines = [f"- {b['title']}" for b in active_blockers[:5]]
            context_section += f"""
TEAM'S ACTIVE BLOCKERS (flag if user mentions resolving any):
{chr(10).join(blocker_lines)}
"""

        # Board workflow columns (dynamic per team)
        board_columns = team_context.get("board_columns", [])
        if board_columns:
            workflow = " → ".join(board_columns)
            context_section += f"""
BOARD WORKFLOW (this team's actual columns, in order):
{workflow}

For task_updates "status" field, use the EXACT column name from above.
The workflow is sequential. When a user says "done" or "finished", move to the NEXT column (not the last one).
Only move to the final column ("{board_columns[-1]}") when the user explicitly says "shipped", "closed", "fully completed", or names that column directly.
"""

    # Create the analysis prompt
    prompt = f"""Analyze this standup response and extract insights.

{standup_text}
{context_section}
IMPORTANT: Return a FLAT JSON object (not nested) with ALL fields at the top level.

Required fields (return ALL of these in a single flat object):

1. "blockers": Array of strings describing any blockers or obstacles mentioned
2. "help_needed": Array of objects with "topic" and "mentions" (usernames with @) if they're asking for help
3. "sentiment": One of "positive", "neutral", or "negative"
4. "action_items": Array of strings for any specific tasks or next steps mentioned
5. "summary": A brief 1-2 sentence summary of what this person is working on
6. "referenced_jira_keys": Array of Jira issue keys mentioned (e.g., ["ABC-123", "PROJ-456"]). Look for patterns like UPPERCASE-NUMBER.
9. "task_updates": Array of status changes for EVERY task the user mentions working on. Check ALL referenced_jira_keys and any task mentioned by name/number. Each object:
   {{
     "task_ref": Use the Jira key from ACTIVE SPRINT ISSUES if matched (e.g., "SCRUM-1"), otherwise the task name
     "status": Use the EXACT column name from the BOARD WORKFLOW section above. If no board workflow is provided, use one of: "In Progress", "In Review", "Done"
   }}
   RULES (follow these in priority order):
   1. If user EXPLICITLY names a column/status ("move to review", "send to QA", "put in testing") → use the matching column name from the BOARD WORKFLOW
   2. "I worked on X" / "I'm working on X" / "continuing X" / "starting X" → use the second column (typically "In Progress")
   3. "X is done" / "finished X" / "completed X" → move to the NEXT column after the ticket's current status (NOT the last column! "done" means the user's work is done, so move one step forward in the workflow)
   4. Only move to the FINAL column when user explicitly says "shipped", "closed", "fully completed", or names the final column directly
   5. "I need help with X" alone is NOT a status change
   6. Include a task_update for EVERY task the user mentions doing work on
7. "jira_intent": One of:
   - "create": ONLY when the user EXPLICITLY says they want to create/make a new ticket, issue, or task. Phrases like "create a ticket for...", "make a Jira issue", "need to file a ticket". A blocker or help request alone is NOT a create intent!
   - "update": Jira key mentioned + progress/status update on it
   - "comment": Jira key mentioned + general context
   - "none": Default. Use this for blockers, help requests, and general updates that don't mention creating tickets or reference Jira keys.
8. "jira_suggestions": Object with Jira fields (ONLY if jira_intent is "create"):
   {{
     "issue_type": "Task" (default) or "Bug" (if it's a bug/error) or "Story" (if it's a feature)
     "priority": "Highest", "High", "Medium", or "Low"
     "assignee": "unassigned"
     "title": Concise issue title (max 100 chars)
     "description": Brief one-line description of the ticket only
   }}
   Use null if jira_intent is not "create"

IMPORTANT: For "issue_type", ONLY use "Task", "Bug", or "Story". Do NOT use "Blocker" - that's a priority level, not a type!
IMPORTANT: Do NOT set jira_intent to "create" just because there is a blocker. Only set it to "create" if the user explicitly says they want to create/make/file a new ticket.

EXAMPLE 1 - User starting a task (Board: To Do → In Progress → In Review → Done):
{{
  "task_updates": [{{"task_ref": "SCRUM-1", "status": "In Progress"}}]
}}

EXAMPLE 2 - User says task is done, should move to NEXT column (not last):
If board is: To Do → In Progress → In Review → Done
And ticket is currently "In Progress", "finished" means move to "In Review" (next step):
{{
  "task_updates": [{{"task_ref": "SCRUM-9", "status": "In Review"}}]
}}

EXAMPLE 3 - User explicitly says "shipped to production" (move to final column):
{{
  "task_updates": [{{"task_ref": "SCRUM-2", "status": "Done"}}]
}}

CRITICAL: Do NOT nest fields under "core_insights" or "jira_integration_fields". Return ONE flat object with ALL fields at the root level.
"""
    
    # Run the agent
    response = agent.run(prompt, stream=False)
    
    # Parse the response
    try:
        # Extract JSON from markdown code blocks if present
        content = response.content
        if "```json" in content:
            json_match = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
            if json_match:
                content = json_match.group(1)
        elif "```" in content:
            json_match = re.search(r"```\s*(\{.*?\})\s*```", content, re.DOTALL)
            if json_match:
                content = json_match.group(1)
        
        insights = json.loads(content)

        # Validate and normalize Jira keys
        if "referenced_jira_keys" in insights:
            # Re-extract Jira keys from the full standup text to catch any AI missed
            all_text = " ".join([responses.get(q["id"], "") for q in questions])
            detected_keys = extract_jira_keys(all_text)

            # Merge AI-detected keys with regex-detected keys
            ai_keys = insights.get("referenced_jira_keys", [])
            combined_keys = list(set(ai_keys + detected_keys))
            insights["referenced_jira_keys"] = combined_keys

            print(f"🔍 Detected Jira keys: {combined_keys}")

        # Set defaults for Jira fields if missing
        insights.setdefault("referenced_jira_keys", [])
        insights.setdefault("jira_intent", "none")
        insights.setdefault("jira_suggestions", None)
        insights.setdefault("task_updates", [])

        return insights
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse AI response as JSON: {e}")
        print(f"Raw response: {response.content}")
        # Return minimal structure with Jira fields
        return {
            "blockers": [],
            "help_needed": [],
            "sentiment": "neutral",
            "action_items": [],
            "summary": "Unable to process response",
            "referenced_jira_keys": [],
            "jira_intent": "none",
            "jira_suggestions": None,
            "task_updates": [],
        }


# Fuzzy name matching against known team members
def fuzzy_match_team_member(mention: str, team_members: List[Dict]) -> Optional[str]:
    """
    Match a spoken/transcribed name to a team member using fuzzy matching.
    Returns the slack_user_id of the best match, or None.

    Handles cases like "Fares Wadba" matching "Farris Abu-Hadba" by:
    - Normalizing names (lowercase, remove @, remove hyphens)
    - Splitting into name parts
    - Checking if first name parts share 3+ starting characters
    - Scoring by how many name parts match
    """
    search = mention.lstrip("@").lower().strip()
    search_parts = search.replace("-", " ").split()

    if not search_parts:
        return None

    best_match = None
    best_score = 0

    for member in team_members:
        name = (member.get("user_name") or "").lower()
        name_parts = name.replace("-", " ").split()

        if not name_parts:
            continue

        score = 0

        for s_part in search_parts:
            for n_part in name_parts:
                # Exact match
                if s_part == n_part:
                    score += 3
                    break
                # First 3+ chars match (handles Fares/Farris, etc.)
                if len(s_part) >= 3 and len(n_part) >= 3 and s_part[:3] == n_part[:3]:
                    score += 2
                    break
                # One contains the other (handles partial names)
                if len(s_part) >= 3 and (s_part in n_part or n_part in s_part):
                    score += 1
                    break

        # Require minimum score to avoid false positives
        # At least one strong match (first 3 chars or exact)
        if score >= 2 and score > best_score:
            best_score = score
            best_match = member

    if best_match:
        print(f"🔍 Fuzzy matched '{mention}' → '{best_match['user_name']}' (score: {best_score})")
        return best_match["slack_user_id"]

    return None


# Get Slack user ID by email or username
def get_slack_user_id(bot_token: str, identifier: str) -> Optional[str]:
    """Get Slack user ID from @mention or email"""
    # Remove @ if present
    identifier = identifier.lstrip("@")
    
    try:
        # Try to find user by email first
        if "@" in identifier:
            response = httpx.post(
                "https://slack.com/api/users.lookupByEmail",
                headers={"Authorization": f"Bearer {bot_token}"},
                json={"email": identifier},
            )
            data = response.json()
            if data.get("ok"):
                return data["user"]["id"]
        
        # Otherwise, search by display name or real name
        response = httpx.get(
            "https://slack.com/api/users.list",
            headers={"Authorization": f"Bearer {bot_token}"},
        )
        data = response.json()
        
        if data.get("ok"):
            for user in data.get("members", []):
                if (
                    user.get("name") == identifier
                    or user.get("real_name", "").lower() == identifier.lower()
                    or user.get("profile", {}).get("display_name", "").lower() == identifier.lower()
                ):
                    return user["id"]
    except Exception as e:
        print(f"❌ Error looking up Slack user {identifier}: {e}")
    
    return None


# Send Slack notification
def send_slack_notification(bot_token: str, user_id: str, message: str):
    """Send a DM to a Slack user"""
    try:
        response = httpx.post(
            "https://slack.com/api/chat.postMessage",
            headers={
                "Authorization": f"Bearer {bot_token}",
                "Content-Type": "application/json",
            },
            json={
                "channel": user_id,
                "text": message,
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": message,
                        },
                    },
                ],
            },
        )
        data = response.json()
        return data.get("ok", False)
    except Exception as e:
        print(f"❌ Error sending Slack notification: {e}")
        return False


# Send interactive ticket suggestion with buttons
def send_ticket_suggestion(bot_token: str, user_id: str, suggestion: Dict) -> bool:
    """Send a Slack DM with interactive buttons to confirm ticket creation"""
    title = suggestion.get("title", "Untitled")
    issue_type = suggestion.get("issue_type", "Task")
    priority = suggestion.get("priority", "Medium")
    project_key = suggestion.get("project_key", "")

    # Encode suggestion data in button value (Slack limit: 2000 chars)
    button_value = json.dumps({
        "t": title,
        "ty": issue_type,
        "pr": priority,
        "pk": project_key,
        "rid": suggestion.get("response_id", ""),
        "oid": suggestion.get("organization_id", ""),
        "un": suggestion.get("user_name", ""),
    })

    try:
        response = httpx.post(
            "https://slack.com/api/chat.postMessage",
            headers={
                "Authorization": f"Bearer {bot_token}",
                "Content-Type": "application/json",
            },
            json={
                "channel": user_id,
                "text": f"Ticket suggestion: {title}",
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"🎫 *Ticket Suggestion*\n\n"
                                    f"*Title:* {title}\n"
                                    f"*Type:* {issue_type} | *Priority:* {priority}\n"
                                    f"*Project:* {project_key}",
                        },
                    },
                    {
                        "type": "actions",
                        "block_id": "ticket_suggestion",
                        "elements": [
                            {
                                "type": "button",
                                "text": {"type": "plain_text", "text": "✅ Create Ticket"},
                                "style": "primary",
                                "action_id": "create_ticket",
                                "value": button_value,
                            },
                            {
                                "type": "button",
                                "text": {"type": "plain_text", "text": "❌ Skip"},
                                "action_id": "skip_ticket",
                                "value": button_value,
                            },
                        ],
                    },
                ],
            },
        )
        data = response.json()
        if data.get("ok"):
            print(f"✅ Sent ticket suggestion to user: {title}")
        else:
            print(f"❌ Failed to send suggestion: {data.get('error')}")
        return data.get("ok", False)
    except Exception as e:
        print(f"❌ Error sending ticket suggestion: {e}")
        return False


# Post digest to team channel
def post_team_digest(bot_token: str, channel_id: str, digest: str):
    """Post standup digest to team channel"""
    try:
        response = httpx.post(
            "https://slack.com/api/chat.postMessage",
            headers={
                "Authorization": f"Bearer {bot_token}",
                "Content-Type": "application/json",
            },
            json={
                "channel": channel_id,
                "text": digest,
                "blocks": [
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": "📊 Daily Standup Summary",
                        },
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": digest,
                        },
                    },
                ],
            },
        )
        data = response.json()
        return data.get("ok", False)
    except Exception as e:
        print(f"❌ Error posting team digest: {e}")
        return False


# Sync standup response to Jira
def sync_to_jira(
    cur,
    response_id: str,
    organization_id: str,
    user_name: str,
    insights: Dict,
    jira_connection: Dict
) -> List[Dict]:
    """
    Sync standup response to Jira based on AI insights

    Returns list of created/updated Jira issues
    """
    jira_results = []

    try:
        # Initialize Jira client
        jira_client = JiraClient(
            domain=jira_connection["jira_domain"],
            email=jira_connection["jira_email"],
            api_token=decrypt_value(jira_connection["jira_api_token"]),
        )

        jira_intent = insights.get("jira_intent", "none")
        referenced_keys = insights.get("referenced_jira_keys", [])
        suggestions = insights.get("jira_suggestions")

        print(f"🔧 Jira intent: {jira_intent}, Keys: {referenced_keys}")

        # Handle CREATE intent - Suggest ticket creation (user confirms via Slack buttons)
        if jira_intent == "create" and suggestions:
            project_key = jira_connection.get("default_project_key")
            if project_key:
                # Validate issue type
                suggested_type = suggestions.get("issue_type", "Task")
                valid_issue_types = ["Task", "Story", "Bug", "Epic"]
                if suggested_type not in valid_issue_types:
                    suggested_type = jira_connection.get("default_issue_type", "Task")

                title = suggestions.get("title", "")[:100]
                priority = suggestions.get("priority", "Medium")

                jira_results.append({
                    "action": "suggested",
                    "suggestion": {
                        "title": title,
                        "issue_type": suggested_type,
                        "priority": priority,
                        "project_key": project_key,
                        "response_id": response_id,
                        "organization_id": organization_id,
                        "user_name": user_name,
                    },
                })
                print(f"📋 Suggesting ticket: {title} ({suggested_type}, {priority})")

        # ============================================
        # AUTO-COMMENT on ALL referenced Jira tickets
        # Always safe: if a user mentions a ticket, add context to it
        # ============================================
        if referenced_keys:
            blockers = insights.get("blockers", [])
            summary = insights.get("summary", "Standup update")
            action_items = insights.get("action_items", [])

            for jira_key in referenced_keys:
                try:
                    # Check idempotency - one auto-comment per key per response
                    existing = check_existing_jira_link(
                        cur, response_id, jira_key, "auto_comment"
                    )
                    if existing:
                        print(f"⏭️ Already commented on {jira_key} for this response")
                        jira_results.append({
                            "action": "skipped",
                            "key": jira_key,
                            "reason": "already_commented",
                        })
                        continue

                    # Check if any blocker references this ticket
                    related_blockers = [
                        b for b in blockers
                        if jira_key.lower() in b.lower()
                    ]

                    # Build context-aware comment
                    if related_blockers:
                        # Blocker on this ticket - high priority comment
                        comment = f"⚠️ *Blocker reported by {user_name}*\n\n"
                        for b in related_blockers:
                            comment += f"• {b}\n"
                        comment += f"\n📝 Standup summary: {summary}"
                    elif jira_intent == "update":
                        # Progress update
                        comment = f"✅ *Progress update from {user_name}*\n\n{summary}"
                        if action_items:
                            comment += "\n\n📋 Next steps:\n"
                            for item in action_items:
                                comment += f"• {item}\n"
                    else:
                        # General mention / context
                        comment = f"📝 *Mentioned in standup by {user_name}*\n\n{summary}"

                    jira_client.add_comment(jira_key, comment)

                    # Store link with jira_key as blocker_hash for idempotency
                    create_jira_link(
                        cur,
                        response_id,
                        jira_key,
                        None,
                        f"https://{jira_connection['jira_domain']}/browse/{jira_key}",
                        jira_key,  # Use jira_key as hash for per-key idempotency
                        "auto_comment",
                        {"key": jira_key, "comment_type": "blocker" if related_blockers else "update" if jira_intent == "update" else "mention"},
                    )

                    comment_type = "blocker comment" if related_blockers else "update" if jira_intent == "update" else "mention"
                    jira_results.append({
                        "action": "auto_commented",
                        "key": jira_key,
                        "comment_type": comment_type,
                    })

                    print(f"✅ Auto-commented on {jira_key} ({comment_type})")

                except Exception as e:
                    print(f"❌ Failed to auto-comment on {jira_key}: {e}")
                    jira_results.append({
                        "action": "error",
                        "key": jira_key,
                        "error": str(e),
                    })

    except Exception as e:
        print(f"❌ Jira sync error: {e}")

    return jira_results


# ============================================
# AUDIO STANDUP PROCESSING
# ============================================

def download_slack_file(file_url: str, bot_token: str) -> tuple:
    """Download a file from Slack using bot token authentication.
    Returns (bytes, content_type)"""
    response = httpx.get(
        file_url,
        headers={"Authorization": f"Bearer {bot_token}"},
        follow_redirects=True,
        timeout=60.0,
    )
    response.raise_for_status()
    content_type = response.headers.get("content-type", "")
    return response.content, content_type


def get_audio_extension(content_type: str, file_url: str = "") -> str:
    """Map content-type to a file extension that Whisper API accepts.
    Supported: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm"""
    ct_map = {
        "audio/mp4": "mp4",
        "audio/x-m4a": "m4a",
        "audio/m4a": "m4a",
        "audio/aac": "m4a",
        "audio/aacp": "m4a",
        "audio/webm": "webm",
        "audio/ogg": "ogg",
        "audio/oga": "oga",
        "audio/wav": "wav",
        "audio/wave": "wav",
        "audio/x-wav": "wav",
        "audio/mpeg": "mp3",
        "audio/mp3": "mp3",
        "audio/flac": "flac",
        "video/webm": "webm",
        "video/mp4": "mp4",
        "application/octet-stream": "mp4",
    }
    base_type = content_type.split(";")[0].strip().lower()
    ext = ct_map.get(base_type)
    if ext:
        return ext

    # Fallback: try to extract extension from URL
    for supported in ["webm", "m4a", "mp4", "mp3", "ogg", "wav", "flac", "mpeg"]:
        if f".{supported}" in file_url.lower():
            return supported

    # Final fallback
    return "mp4"


def build_whisper_prompt(team_members: List[Dict], sprint_issues: List[Dict]) -> str:
    """Build a Whisper prompt with team vocabulary for better transcription accuracy.

    Whisper's prompt parameter (max ~224 tokens) guides the model to correctly
    spell domain-specific terms, names, and project references.
    """
    parts = []

    if team_members:
        names = [m["name"] for m in team_members if m.get("name")]
        if names:
            parts.append(f"Team members: {', '.join(names)}.")

    if sprint_issues:
        keys = list(set(i["key"].split("-")[0] for i in sprint_issues[:10]))
        parts.append(f"Jira project: {', '.join(keys)}.")
        summaries = [f"{i['key']} {i['summary']}" for i in sprint_issues[:5]]
        parts.append("Current tasks: " + "; ".join(summaries) + ".")

    prompt = " ".join(parts)
    return prompt[:500]  # Stay within Whisper's token limit


def transcribe_audio(audio_bytes: bytes, extension: str = "mp4", prompt: str = "") -> str:
    """Transcribe audio using OpenAI Whisper API with optional context prompt."""
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = f"audio.{extension}"

    print(f"🗣️ Sending to Whisper as audio.{extension} ({len(audio_bytes)} bytes)")
    if prompt:
        print(f"🗣️ Whisper prompt: {prompt[:100]}...")

    kwargs: Dict = {"model": "whisper-1", "file": audio_file}
    if prompt:
        kwargs["prompt"] = prompt

    transcript = openai_client.audio.transcriptions.create(**kwargs)
    return transcript.text


def parse_transcript_to_responses(
    transcript: str, questions: List[Dict]
) -> Dict[str, str]:
    """Use GPT-4 to split a voice transcript into per-question answers"""
    questions_formatted = "\n".join(
        [f"{i+1}. {q['text']}" for i, q in enumerate(questions)]
    )

    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": "You split voice transcripts into structured standup answers. Return only valid JSON.",
            },
            {
                "role": "user",
                "content": f"""Split this voice standup transcript into answers for each question.

Transcript: "{transcript}"

Questions:
{questions_formatted}

Return a JSON object where keys are question numbers (as strings) and values are the relevant answer text.
Example: {{"1": "answer to Q1", "2": "answer to Q2", "3": "answer to Q3"}}

Rules:
- Map relevant parts of the transcript to each question
- If a question isn't addressed, use "Not mentioned"
- Keep the speaker's original wording
- Don't add information not in the transcript

Return ONLY the JSON object.""",
            },
        ],
        temperature=0.3,
    )

    content = response.choices[0].message.content

    # Extract JSON from markdown code blocks if present
    if "```json" in content:
        json_match = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
        if json_match:
            content = json_match.group(1)
    elif "```" in content:
        json_match = re.search(r"```\s*(\{.*?\})\s*```", content, re.DOTALL)
        if json_match:
            content = json_match.group(1)

    parsed = json.loads(content)

    # Map numbered keys back to question IDs
    responses = {}
    for i, question in enumerate(questions):
        key = str(i + 1)
        responses[question["id"]] = parsed.get(key, "Not mentioned")

    return responses


def process_audio_standup(message_data: Dict):
    """Process an audio standup: download from Slack, transcribe, parse, then run AI analysis"""

    response_id = message_data.get("responseId")

    if not response_id:
        print("❌ No response ID in audio message")
        return

    print(f"🎤 Processing audio standup {response_id}")

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Get response data with voice URL
        cur.execute("""
            SELECT
                sr.*,
                sc.questions,
                sc.name as standup_name,
                t.name as team_name,
                t.organization_id,
                u.name as user_name
            FROM standup_response sr
            JOIN standup_config sc ON sr.standup_config_id = sc.id
            JOIN team t ON sr.team_id = t.id
            JOIN "user" u ON sr.user_id = u.id
            WHERE sr.id = %s AND sr.deleted_at IS NULL
        """, (response_id,))

        response_data = cur.fetchone()

        if not response_data:
            print(f"❌ Audio response {response_id} not found")
            return

        voice_url = response_data.get("voice_url")
        if not voice_url:
            print(f"❌ No voice URL for response {response_id}")
            return

        # Get bot token for downloading from Slack
        cur.execute("""
            SELECT bot_token
            FROM slack_workspace
            WHERE organization_id = %s AND deleted_at IS NULL
        """, (response_data["organization_id"],))

        workspace = cur.fetchone()
        if not workspace:
            print(f"❌ No workspace found for org {response_data['organization_id']}")
            return

        bot_token = decrypt_value(workspace["bot_token"])

        # Voice is available on all plans (free + pro + enterprise).
        # Jira automation remains Pro-only.

        # Step 1: Download audio from Slack
        print(f"📥 Downloading audio from Slack...")
        audio_bytes, content_type = download_slack_file(voice_url, bot_token)
        audio_ext = get_audio_extension(content_type, voice_url)
        print(f"✅ Downloaded {len(audio_bytes)} bytes (type: {content_type}, ext: {audio_ext})")

        # Fetch team context for Whisper prompt (cached, improves name recognition)
        whisper_prompt = ""
        try:
            whisper_members = get_team_members_cached(cur, response_data["team_id"])
            whisper_issues = []
            jira_conn = get_jira_connection(cur, response_data["organization_id"])
            if jira_conn and jira_conn.get("default_project_key"):
                try:
                    whisper_issues = get_sprint_issues_cached(jira_conn)
                except Exception as e:
                    print(f"⚠️ Could not fetch sprint issues for Whisper: {e}")
            whisper_prompt = build_whisper_prompt(whisper_members, whisper_issues)
        except Exception as e:
            print(f"⚠️ Could not build Whisper prompt: {e}")

        # Step 2: Transcribe with Whisper (with team context prompt)
        print(f"🗣️ Transcribing audio with Whisper...")
        raw_transcript = transcribe_audio(audio_bytes, audio_ext, prompt=whisper_prompt)
        print(f"✅ Transcript: {raw_transcript[:200]}...")

        if not raw_transcript.strip():
            print(f"⚠️ Empty transcript, notifying user")
            send_slack_notification(
                bot_token,
                response_data["slack_user_id"],
                "⚠️ Couldn't transcribe your audio. It may be too quiet or unclear. Please try again or type your response.",
            )
            cur.execute("""
                UPDATE standup_response
                SET processing_status = 'failed', updated_at = NOW()
                WHERE id = %s
            """, (response_id,))
            conn.commit()
            return

        # Step 3: Parse transcript into per-question responses
        print(f"📋 Parsing transcript into question answers...")
        questions = response_data["questions"]
        try:
            responses = parse_transcript_to_responses(raw_transcript, questions)
        except Exception as e:
            print(f"⚠️ Failed to parse transcript into answers, using raw text: {e}")
            # Fallback: put full transcript as answer to first question
            responses = {}
            for i, q in enumerate(questions):
                if i == 0:
                    responses[q["id"]] = raw_transcript
                else:
                    responses[q["id"]] = "(covered in audio response above)"
        print(f"✅ Parsed into {len(responses)} answers")

        # Step 4: Update the standup_response with transcript and parsed responses
        cur.execute("""
            UPDATE standup_response
            SET
                voice_transcript = %s,
                responses = %s,
                updated_at = NOW()
            WHERE id = %s
        """, (raw_transcript, json.dumps(responses), response_id))

        conn.commit()

        # Step 5: Send transcript preview to user
        truncated = raw_transcript[:300] + ("..." if len(raw_transcript) > 300 else "")
        send_slack_notification(
            bot_token,
            response_data["slack_user_id"],
            f"✅ *Transcript:*\n\n_{truncated}_\n\nAnalyzing your response now...",
        )

        print(f"✅ Audio transcription complete, running AI analysis...")

    except Exception as e:
        print(f"❌ Error in audio processing for {response_id}: {e}")
        conn.rollback()

        # Mark as failed
        try:
            cur.execute("""
                UPDATE standup_response
                SET processing_status = 'failed', updated_at = NOW()
                WHERE id = %s
            """, (response_id,))
            conn.commit()
        except:
            pass

        # Notify user of failure
        try:
            cur.execute("""
                SELECT sw.bot_token, sr.slack_user_id
                FROM standup_response sr
                JOIN team t ON sr.team_id = t.id
                JOIN slack_workspace sw ON sw.organization_id = t.organization_id AND sw.deleted_at IS NULL
                WHERE sr.id = %s
            """, (response_id,))
            row = cur.fetchone()
            if row:
                send_slack_notification(
                    decrypt_value(row["bot_token"]),
                    row["slack_user_id"],
                    "⚠️ There was an error processing your audio. Please try again or type your response.",
                )
        except:
            pass

        return
    finally:
        cur.close()
        conn.close()

    # Step 6: Run the normal standup processing pipeline
    # (re-fetches from DB where responses are now populated, runs AI analysis + Jira + notifications)
    process_standup_response(message_data)


# Process a single standup response
def process_standup_response(message_data: Dict):
    """Process a standup response and extract insights"""
    
    response_id = message_data.get("responseId")
    
    if not response_id:
        print("❌ No response ID in message")
        return
    
    print(f"🔄 Processing response {response_id}")
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Get response data with related info
        cur.execute("""
            SELECT 
                sr.*,
                sc.questions,
                sc.name as standup_name,
                t.name as team_name,
                t.slack_channel_id,
                t.organization_id,
                u.email as user_email,
                u.name as user_name
            FROM standup_response sr
            JOIN standup_config sc ON sr.standup_config_id = sc.id
            JOIN team t ON sr.team_id = t.id
            JOIN "user" u ON sr.user_id = u.id
            WHERE sr.id = %s AND sr.deleted_at IS NULL
        """, (response_id,))
        
        response_data = cur.fetchone()
        
        if not response_data:
            print(f"❌ Response {response_id} not found")
            return
        
        print(f"📝 Analyzing response from {response_data['user_name']}")

        # Build team context for AI (team members + sprint issues + history)
        team_context = {}

        # Fetch team members (cached)
        team_context["team_members"] = get_team_members_cached(cur, response_data["team_id"])
        print(f"👥 Team context: {len(team_context['team_members'])} members")

        # Fetch sprint issues from Jira (cached)
        jira_connection = get_jira_connection(cur, response_data["organization_id"])
        if jira_connection and jira_connection.get("default_project_key"):
            try:
                sprint_issues = get_sprint_issues_cached(jira_connection)
                team_context["sprint_issues"] = sprint_issues
                print(f"📋 Sprint context: {len(sprint_issues)} issues")

                # Fetch board columns (the actual workflow for this team)
                board_columns = get_board_columns_cached(jira_connection)
                if board_columns:
                    team_context["board_columns"] = board_columns
                    print(f"📊 Board workflow: {' → '.join(board_columns)}")
            except Exception as e:
                print(f"⚠️ Could not fetch sprint/board context: {e}")

        # Fetch historical context (user's recent standups + team blockers)
        try:
            recent_context = fetch_recent_context(
                cur, response_data["user_id"], response_data["team_id"]
            )
            team_context["recent_context"] = recent_context
            print(f"📚 History: {len(recent_context['user_history'])} recent standups, {len(recent_context['active_blockers'])} active blockers")
        except Exception as e:
            print(f"⚠️ Could not fetch historical context: {e}")

        # Extract insights using Agno with team context
        insights = extract_insights(
            response_data["responses"],
            response_data["questions"],
            team_context,
        )
        
        print(f"✅ Extracted insights: {json.dumps(insights, indent=2)}")
        
        # Update response with AI insights
        cur.execute("""
            UPDATE standup_response
            SET
                ai_insights = %s,
                processing_status = 'completed',
                processed_at = NOW(),
                updated_at = NOW()
            WHERE id = %s
        """, (json.dumps(insights), response_id))

        # Generate and store embedding for this standup (non-blocking, best-effort)
        if PGVECTOR_AVAILABLE:
            try:
                embedding_text = build_embedding_text(
                    response_data["responses"], insights, response_data["user_name"]
                )
                embedding = generate_embedding(embedding_text)
                if embedding:
                    store_embedding(cur, "standup_response", response_id, embedding)
                    print(f"📊 Stored standup embedding ({len(embedding)} dims)")
            except Exception as e:
                print(f"⚠️ Standup embedding failed (non-blocking): {e}")

        # Update team knowledge base with expertise topics (non-blocking)
        if PGVECTOR_AVAILABLE:
            try:
                from knowledge_base import update_expertise
                update_expertise(
                    cur,
                    response_data["user_id"],
                    response_data["team_id"],
                    insights,
                    openai_client,
                    generate_embedding,
                )
            except Exception as e:
                print(f"⚠️ Knowledge base update failed: {e}")

        # Sync to Jira if connection exists (jira_connection already fetched above for context)
        if not jira_connection:
            jira_connection = get_jira_connection(cur, response_data["organization_id"])
        jira_results = []

        # ── Jira feature gate ─────────────────────────────────────────────
        # Nulling jira_connection disables both sync_to_jira and task
        # transitions below, since both blocks are gated on `if jira_connection`.
        if jira_connection:
            org_plan = get_org_plan(cur, response_data["organization_id"])
            if org_plan == "free":
                print(f"⛔ Jira integration not available on free plan (org {response_data['organization_id']})")
                jira_connection = None
        # ── End Jira gate ─────────────────────────────────────────────────

        if jira_connection:
            print(f"🔧 Jira connection found, syncing...")
            jira_results = sync_to_jira(
                cur,
                response_id,
                response_data["organization_id"],
                response_data["user_name"],
                insights,
                jira_connection
            )
            print(f"✅ Jira sync completed: {len(jira_results)} actions")
        else:
            print("⚠️ No Jira connection configured for this organization")

        # Get Slack workspace
        cur.execute("""
            SELECT bot_token, slack_team_id
            FROM slack_workspace
            WHERE organization_id = %s AND deleted_at IS NULL
        """, (response_data["organization_id"],))

        workspace = cur.fetchone()

        if not workspace:
            print("❌ No Slack workspace found")
            conn.commit()
            return

        bot_token = decrypt_value(workspace["bot_token"])

        # Process help requests
        help_requests = insights.get("help_needed", [])
        if help_requests:
            print(f"🆘 Found {len(help_requests)} help requests")

            # Fetch all team members for fuzzy name matching
            cur.execute("""
                SELECT tm.slack_user_id, u.name as user_name, u.email
                FROM team_member tm
                JOIN "user" u ON tm.user_id = u.id
                WHERE tm.team_id = %s AND tm.deleted_at IS NULL AND tm.slack_user_id IS NOT NULL
            """, (response_data["team_id"],))
            team_members = cur.fetchall()

            for help_req in help_requests:
                topic = help_req.get("topic", "General help needed")
                mentions = help_req.get("mentions", [])

                # Create help_request record
                cur.execute("""
                    INSERT INTO help_request (
                        id, response_id, team_id, requester_id,
                        mentioned_slack_user_ids, description, topic,
                        status, created_at, updated_at
                    )
                    VALUES (
                        gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, 'open', NOW(), NOW()
                    )
                    RETURNING id
                """, (
                    response_id,
                    response_data["team_id"],
                    response_data["user_id"],
                    json.dumps(mentions),
                    f"{response_data['user_name']} needs help: {topic}",
                    topic,
                ))

                help_request_id = cur.fetchone()["id"]

                # Find experts for this topic via knowledge base
                expert_names = []
                if PGVECTOR_AVAILABLE:
                    try:
                        from knowledge_base import find_experts
                        experts = find_experts(
                            cur, response_data["team_id"], topic,
                            generate_embedding,
                            exclude_user_id=response_data["user_id"],
                        )
                        expert_names = [e["name"] for e in experts]
                        if expert_names:
                            print(f"💡 Suggested experts for '{topic}': {', '.join(expert_names)}")
                    except Exception as e:
                        print(f"⚠️ Expert search failed: {e}")

                # Send notifications to mentioned users
                for mention in mentions:
                    # First try fuzzy match against known team members
                    slack_user_id = fuzzy_match_team_member(mention, team_members)

                    # Fall back to Slack API lookup
                    if not slack_user_id:
                        slack_user_id = get_slack_user_id(bot_token, mention)

                    if slack_user_id:
                        message = f"""🆘 *Help Request from {response_data['user_name']}*

Team: {response_data['team_name']}
Topic: {topic}

From their standup:
{insights.get('summary', 'See full standup for details')}"""

                        if expert_names:
                            message += f"\n\n💡 *Others with expertise:* {', '.join(expert_names[:3])}"

                        message += f"\n\n_Reply in #{response_data['team_name']} or DM them directly._"

                        success = send_slack_notification(bot_token, slack_user_id, message)
                        if success:
                            print(f"✉️ Notified {mention} → {slack_user_id} about help request")
                        else:
                            print(f"❌ Failed to notify {mention}")
                    else:
                        print(f"⚠️ Could not find Slack user for mention: {mention}")

                # Mark notifications as sent
                cur.execute("""
                    UPDATE help_request
                    SET notifications_sent = true, notifications_sent_at = NOW()
                    WHERE id = %s
                """, (help_request_id,))
        
        # Create insight record for blockers
        similar_blockers = []
        blockers = insights.get("blockers", [])
        if blockers:
            print(f"🚧 Found {len(blockers)} blockers")
            
            blocker_description = "\n".join([f"• {blocker}" for blocker in blockers])

            cur.execute("""
                INSERT INTO insight (
                    id, team_id, related_response_ids, insight_date,
                    insight_type, title, description, severity, status,
                    created_at, updated_at
                )
                VALUES (
                    gen_random_uuid()::text, %s, %s, CURRENT_DATE,
                    'blocker', %s, %s, %s, 'open', NOW(), NOW()
                )
                RETURNING id
            """, (
                response_data["team_id"],
                json.dumps([response_id]),
                f"Blockers reported by {response_data['user_name']}",
                blocker_description,
                "high" if len(blockers) > 1 else "medium",
            ))

            # Embed the blocker insight and find similar past blockers
            similar_blockers = []
            if PGVECTOR_AVAILABLE:
                try:
                    insight_row = cur.fetchone()
                    if insight_row:
                        blocker_text = f"Blockers by {response_data['user_name']}: {blocker_description}"
                        blocker_embedding = generate_embedding(blocker_text)
                        if blocker_embedding:
                            store_embedding(cur, "insight", insight_row["id"], blocker_embedding)
                            print(f"📊 Stored blocker embedding")

                            # Search for similar past blockers
                            from pattern_detector import find_similar_past_blockers
                            similar_blockers = find_similar_past_blockers(
                                cur, blocker_description, response_data["team_id"],
                                generate_embedding, limit=3
                            )
                            # Filter out the one we just created
                            similar_blockers = [
                                sb for sb in similar_blockers
                                if sb["id"] != insight_row["id"]
                            ]
                            if similar_blockers:
                                print(f"🔍 Found {len(similar_blockers)} similar past blockers")
                except Exception as e:
                    print(f"⚠️ Blocker embedding/search failed: {e}")

        # Send interactive ticket suggestions (buttons) for "suggested" results
        suggested_tickets = [r for r in jira_results if r["action"] == "suggested"]
        if suggested_tickets:
            # Get user's Slack ID for the suggestion DM
            cur.execute("""
                SELECT slack_user_id
                FROM team_member
                WHERE user_id = %s AND team_id = %s AND deleted_at IS NULL
            """, (response_data["user_id"], response_data["team_id"]))
            tm_for_suggest = cur.fetchone()

            if tm_for_suggest and tm_for_suggest["slack_user_id"]:
                for s in suggested_tickets:
                    send_ticket_suggestion(
                        bot_token,
                        tm_for_suggest["slack_user_id"],
                        s["suggestion"],
                    )

        # Send Jira sync notifications to user
        if jira_results:
            jira_notification = f"🔗 *Jira Integration Update*\n\n"

            auto_commented = [r for r in jira_results if r["action"] == "auto_commented"]
            skipped_tickets = [r for r in jira_results if r["action"] == "skipped"]
            errors = [r for r in jira_results if r["action"] == "error"]

            if auto_commented:
                # Group by comment type for cleaner notification
                blocker_comments = [r for r in auto_commented if r.get("comment_type") == "blocker"]
                update_comments = [r for r in auto_commented if r.get("comment_type") == "update"]
                mention_comments = [r for r in auto_commented if r.get("comment_type") == "mention"]

                if blocker_comments:
                    jira_notification += "⚠️ *Blocker added to:*\n"
                    for ticket in blocker_comments:
                        jira_notification += f"• <https://{jira_connection['jira_domain']}/browse/{ticket['key']}|{ticket['key']}>\n"
                    jira_notification += "\n"

                if update_comments:
                    jira_notification += "📝 *Progress update added to:*\n"
                    for ticket in update_comments:
                        jira_notification += f"• <https://{jira_connection['jira_domain']}/browse/{ticket['key']}|{ticket['key']}>\n"
                    jira_notification += "\n"

                if mention_comments:
                    jira_notification += "💬 *Standup context added to:*\n"
                    for ticket in mention_comments:
                        jira_notification += f"• <https://{jira_connection['jira_domain']}/browse/{ticket['key']}|{ticket['key']}>\n"
                    jira_notification += "\n"

            if skipped_tickets:
                jira_notification += "⏭️ *Skipped (already synced):*\n"
                for ticket in skipped_tickets:
                    jira_notification += f"• {ticket['key']}\n"
                jira_notification += "\n"

            if errors:
                jira_notification += f"⚠️ *Errors:* {len(errors)} failed\n\n"

            # Get user's Slack ID to send DM
            cur.execute("""
                SELECT slack_user_id
                FROM team_member
                WHERE user_id = %s AND team_id = %s AND deleted_at IS NULL
            """, (response_data["user_id"], response_data["team_id"]))

            team_member = cur.fetchone()
            if team_member and team_member["slack_user_id"]:
                success = send_slack_notification(
                    bot_token,
                    team_member["slack_user_id"],
                    jira_notification
                )
                if success:
                    print(f"✉️ Sent Jira sync notification to {response_data['user_name']}")
                else:
                    print(f"❌ Failed to send Jira notification")

        # ============================================
        # AUTO-TRANSITION tasks based on standup context
        # ============================================
        task_updates = insights.get("task_updates", [])
        transition_results = []

        if task_updates and jira_connection:
            project_key = jira_connection.get("default_project_key")
            if project_key:
                jira_client = JiraClient(
                    domain=jira_connection["jira_domain"],
                    email=jira_connection["jira_email"],
                    api_token=decrypt_value(jira_connection["jira_api_token"]),
                )

                # Fetch sprint issues once for matching
                sprint_issues = jira_client.get_sprint_issues(project_key)

                for update in task_updates:
                    task_ref = update.get("task_ref", "").strip()
                    target_status = update.get("status", "")

                    if not task_ref or not target_status:
                        continue

                    # Match task_ref to a sprint issue
                    matched_issue = None
                    task_ref_lower = task_ref.lower()

                    # Pass 1: Exact/substring matching
                    for issue in sprint_issues:
                        key_lower = issue["key"].lower()
                        summary_lower = issue["summary"].lower()

                        # Exact key match (e.g., "SCRUM-1")
                        if task_ref_lower == key_lower:
                            matched_issue = issue
                            break
                        # Summary contains task ref (e.g., "task 1" in "Task 1")
                        if task_ref_lower in summary_lower:
                            matched_issue = issue
                            break
                        # Task ref contains summary (e.g., "the login bug task" contains "login bug")
                        if summary_lower in task_ref_lower and len(summary_lower) >= 3:
                            matched_issue = issue
                            break
                        # Number matching: "task 1" matches "SCRUM-1"
                        ref_nums = re.findall(r'\d+', task_ref)
                        key_nums = re.findall(r'\d+', issue["key"])
                        if ref_nums and key_nums and ref_nums[-1] == key_nums[-1]:
                            matched_issue = issue
                            break

                    # Pass 2: Semantic embedding fallback (if exact match failed)
                    if not matched_issue and PGVECTOR_AVAILABLE and sprint_issues:
                        try:
                            ref_embedding = generate_embedding(task_ref)
                            if ref_embedding:
                                best_score = 0
                                best_issue = None
                                # Batch embed sprint issues (cached)
                                cache_key = f"issue_embs:{':'.join(i['key'] for i in sprint_issues[:20])}"
                                issue_embeddings = get_cached(cache_key)
                                if issue_embeddings is None:
                                    texts = [f"{i['key']} {i['summary']}" for i in sprint_issues]
                                    resp = openai_client.embeddings.create(
                                        model="text-embedding-3-small", input=texts
                                    )
                                    issue_embeddings = {
                                        sprint_issues[idx]["key"]: resp.data[idx].embedding
                                        for idx in range(len(sprint_issues))
                                    }
                                    set_cached(cache_key, issue_embeddings)

                                for issue in sprint_issues:
                                    ie = issue_embeddings.get(issue["key"])
                                    if not ie:
                                        continue
                                    # Cosine similarity (embeddings are normalized)
                                    score = sum(a * b for a, b in zip(ref_embedding, ie))
                                    if score > best_score:
                                        best_score = score
                                        best_issue = issue

                                if best_issue and best_score > 0.45:
                                    matched_issue = best_issue
                                    print(f"🔍 Semantic match: '{task_ref}' → {best_issue['key']} ({best_issue['summary']}) [score={best_score:.3f}]")
                                else:
                                    print(f"⚠️ No semantic match for '{task_ref}' (best score: {best_score:.3f})")
                        except Exception as e:
                            print(f"⚠️ Semantic matching failed for '{task_ref}': {e}")

                    if matched_issue:
                        current_status = matched_issue["status"]
                        print(f"🔄 Transitioning {matched_issue['key']} ({matched_issue['summary']}): {current_status} → {target_status}")

                        success = jira_client.transition_issue(matched_issue["key"], target_status)
                        if success:
                            # Auto-assign ticket to the user who mentioned it
                            try:
                                user_email = response_data.get("user_email", "")
                                if user_email:
                                    account_id = jira_client.search_user_by_email(user_email)
                                    if account_id and matched_issue.get("assignee") == "Unassigned":
                                        jira_client.update_issue(
                                            matched_issue["key"],
                                            assignee_account_id=account_id,
                                        )
                                        print(f"👤 Auto-assigned {matched_issue['key']} to {response_data['user_name']}")
                            except Exception as e:
                                print(f"⚠️ Auto-assign failed for {matched_issue['key']}: {e}")

                            transition_results.append({
                                "key": matched_issue["key"],
                                "summary": matched_issue["summary"],
                                "from": current_status,
                                "to": target_status,
                            })
                    else:
                        print(f"⚠️ Could not match '{task_ref}' to any sprint issue")

        # Send completion DM (especially important for audio responses)
        completion_parts = []

        if transition_results:
            completion_parts.append("📋 *Task Updates:*")
            for t in transition_results:
                completion_parts.append(f"• {t['key']} ({t['summary']}): {t['from']} → {t['to']}")

        if jira_results:
            commented = [r for r in jira_results if r["action"] == "auto_commented"]
            suggested = [r for r in jira_results if r["action"] == "suggested"]
            if suggested:
                completion_parts.append("🎫 *Ticket Suggestions Sent:*")
                for r in suggested:
                    completion_parts.append(f"• {r['suggestion']['title']} (check DM for buttons)")
            if commented:
                completion_parts.append("💬 *Comments Added:*")
                for r in commented:
                    completion_parts.append(f"• {r['key']}")

        help_sent = insights.get("help_needed", [])
        if help_sent:
            completion_parts.append("🆘 *Help Requests Sent:*")
            for h in help_sent:
                mentions_str = ", ".join(h.get("mentions", []))
                topic = h.get("topic", "")
                # Find experts for this topic for the completion summary
                expert_line = ""
                if PGVECTOR_AVAILABLE and topic:
                    try:
                        from knowledge_base import find_experts as _fe
                        _experts = _fe(cur, response_data["team_id"], topic, generate_embedding, exclude_user_id=response_data["user_id"])
                        if _experts:
                            expert_line = f" (💡 experts: {', '.join(e['name'] for e in _experts[:2])})"
                    except Exception:
                        pass
                completion_parts.append(f"• {topic} → {mentions_str}{expert_line}")

        # Show similar past blockers if found
        if similar_blockers:
            completion_parts.append("🔍 *Similar Past Blockers:*")
            for sb in similar_blockers[:2]:
                status_icon = "✅" if sb["status"] != "open" else "🔴"
                completion_parts.append(f"• {status_icon} {sb['title']} ({sb['status']})")

        # Always send a completion message
        cur.execute("""
            SELECT slack_user_id
            FROM team_member
            WHERE user_id = %s AND team_id = %s AND deleted_at IS NULL
        """, (response_data["user_id"], response_data["team_id"]))
        tm = cur.fetchone()

        if tm and tm["slack_user_id"]:
            if completion_parts:
                completion_msg = "✅ *Standup processed!*\n\n" + "\n".join(completion_parts)
            else:
                completion_msg = "✅ *Standup processed!* No Jira actions needed."
            send_slack_notification(bot_token, tm["slack_user_id"], completion_msg)

        # Commit all changes
        conn.commit()

        print(f"✅ Successfully processed response {response_id}")
        
    except Exception as e:
        print(f"❌ Error processing response {response_id}: {e}")
        conn.rollback()
        
        # Mark as failed
        try:
            cur.execute("""
                UPDATE standup_response
                SET processing_status = 'failed', updated_at = NOW()
                WHERE id = %s
            """, (response_id,))
            conn.commit()
        except:
            pass
    
    finally:
        cur.close()
        conn.close()


# Generate daily digest for team
def generate_team_digest(team_id: str, date: str):
    """Generate and post daily digest to team channel"""
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Get all responses for the team today
        cur.execute("""
            SELECT 
                sr.ai_insights,
                u.name as user_name
            FROM standup_response sr
            JOIN "user" u ON sr.user_id = u.id
            WHERE sr.team_id = %s 
            AND sr.response_date = %s 
            AND sr.processing_status = 'completed'
            AND sr.deleted_at IS NULL
            ORDER BY sr.created_at
        """, (team_id, date))
        
        responses = cur.fetchall()
        
        if not responses:
            print(f"No responses to digest for team {team_id}")
            return
        
        # Get team info
        cur.execute("""
            SELECT t.name, t.slack_channel_id, t.organization_id
            FROM team t
            WHERE t.id = %s AND t.deleted_at IS NULL
        """, (team_id,))
        
        team = cur.fetchone()
        
        if not team or not team["slack_channel_id"]:
            print(f"Team {team_id} has no Slack channel configured")
            return
        
        # Get workspace
        cur.execute("""
            SELECT bot_token
            FROM slack_workspace
            WHERE organization_id = %s AND deleted_at IS NULL
        """, (team["organization_id"],))
        
        workspace = cur.fetchone()
        
        if not workspace:
            print(f"No workspace for team {team_id}")
            return
        
        # Build digest
        digest = f"*{len(responses)} team members* submitted their standup today:\n\n"
        
        all_blockers = []
        all_help_requests = []
        positive_count = 0
        
        for resp in responses:
            insights = resp["ai_insights"]
            user_name = resp["user_name"]
            
            summary = insights.get("summary", "")
            digest += f"*{user_name}:* {summary}\n"
            
            # Collect blockers
            blockers = insights.get("blockers", [])
            if blockers:
                all_blockers.extend([f"{user_name}: {b}" for b in blockers])
            
            # Collect help requests
            help_needed = insights.get("help_needed", [])
            if help_needed:
                all_help_requests.extend([f"{user_name} needs help with: {h.get('topic', 'Unknown')}" for h in help_needed])
            
            # Count sentiment
            if insights.get("sentiment") == "positive":
                positive_count += 1
        
        digest += "\n"
        
        # Add blockers section
        if all_blockers:
            digest += f"\n🚧 *Blockers:*\n"
            for blocker in all_blockers:
                digest += f"• {blocker}\n"
        
        # Add help requests section
        if all_help_requests:
            digest += f"\n🆘 *Help Needed:*\n"
            for req in all_help_requests:
                digest += f"• {req}\n"
        
        # Add team mood
        mood_emoji = "😊" if positive_count > len(responses) / 2 else "😐" if positive_count > len(responses) / 4 else "😟"
        digest += f"\n{mood_emoji} *Team Mood:* {positive_count}/{len(responses)} positive updates"

        # Detect recurring blocker patterns (last 14 days)
        if PGVECTOR_AVAILABLE:
            try:
                from pattern_detector import detect_blocker_patterns
                patterns = detect_blocker_patterns(cur, team_id)
                if patterns:
                    digest += f"\n\n🔄 *Recurring Blocker Patterns (last 2 weeks):*\n"
                    for p in patterns[:3]:
                        status_indicator = "🔴 still open" if p["still_open"] else "✅ resolved"
                        digest += f"• *{p['theme']}* — {p['occurrences']}x ({status_indicator})\n"
            except Exception as e:
                print(f"⚠️ Pattern detection for digest failed: {e}")

        # Post to channel
        success = post_team_digest(
            workspace["bot_token"],
            team["slack_channel_id"],
            digest
        )
        
        if success:
            print(f"✅ Posted digest to #{team['name']} channel")
        else:
            print(f"❌ Failed to post digest to #{team['name']} channel")
    
    except Exception as e:
        print(f"❌ Error generating digest: {e}")
    finally:
        cur.close()
        conn.close()


# Main worker loop
def main():
    print("🚀 ArcLogs AI Worker started")
    print(f"📬 Polling SQS queue: {SQS_QUEUE_URL}")
    
    while True:
        try:
            # Poll for messages
            response = sqs.receive_message(
                QueueUrl=SQS_QUEUE_URL,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=20,  # Long polling
                VisibilityTimeout=300,  # 5 minutes to process
            )
            
            messages = response.get("Messages", [])
            
            if not messages:
                print("💤 No messages, waiting...")
                continue
            
            print(f"📨 Received {len(messages)} messages")
            
            for message in messages:
                try:
                    # Parse message
                    body = json.loads(message["Body"])
                    message_type = body.get("type")
                    
                    if message_type == "standup_response":
                        process_standup_response(body)
                    elif message_type == "audio_standup":
                        process_audio_standup(body)
                    elif message_type == "generate_digest":
                        generate_team_digest(body.get("teamId"), body.get("date"))
                    else:
                        print(f"⚠️ Unknown message type: {message_type}")
                    
                    # Delete message from queue
                    sqs.delete_message(
                        QueueUrl=SQS_QUEUE_URL,
                        ReceiptHandle=message["ReceiptHandle"],
                    )
                    print(f"✅ Deleted message from queue")
                    
                except Exception as e:
                    print(f"❌ Error processing message: {e}")
                    # Message will become visible again after timeout
        
        except KeyboardInterrupt:
            print("\n👋 Worker stopped by user")
            break
        except Exception as e:
            print(f"❌ Worker error: {e}")
            time.sleep(5)  # Wait before retrying


if __name__ == "__main__":
    main()