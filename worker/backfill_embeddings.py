"""Backfill embeddings for existing standup responses and insights.

Run once after enabling pgvector to embed all historical data.

Usage:
    uv run python backfill_embeddings.py
"""
import os
import json
import time
from dotenv import load_dotenv

load_dotenv()

import psycopg2
from psycopg2.extras import RealDictCursor
from pgvector.psycopg2 import register_vector
from openai import OpenAI

DATABASE_URL = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

openai_client = OpenAI(api_key=OPENAI_API_KEY)


def generate_embedding(text: str):
    if not text or not text.strip():
        return None
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text[:8000],
    )
    return response.data[0].embedding


def build_embedding_text(responses, insights, user_name):
    parts = [f"Standup by {user_name}:"]
    if isinstance(responses, dict):
        for value in responses.values():
            if value and value not in ("No answer", "Not mentioned"):
                parts.append(value)
    if isinstance(insights, dict):
        summary = insights.get("summary", "")
        if summary:
            parts.append(f"Summary: {summary}")
        blockers = insights.get("blockers", [])
        if blockers:
            parts.append("Blockers: " + "; ".join(blockers))
        actions = insights.get("action_items", [])
        if actions:
            parts.append("Actions: " + "; ".join(actions))
        jira_keys = insights.get("referenced_jira_keys", [])
        if jira_keys:
            parts.append("Jira: " + ", ".join(jira_keys))
    return " ".join(parts)


def backfill():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    register_vector(conn)
    cur = conn.cursor()

    # --- Backfill standup_response embeddings ---
    cur.execute("""
        SELECT sr.id, sr.responses, sr.ai_insights, u.name as user_name
        FROM standup_response sr
        JOIN "user" u ON sr.user_id = u.id
        WHERE sr.embedding IS NULL
          AND sr.ai_insights IS NOT NULL
          AND sr.processing_status = 'completed'
          AND sr.deleted_at IS NULL
        ORDER BY sr.response_date DESC
    """)
    responses = cur.fetchall()
    print(f"📊 Found {len(responses)} standup responses to backfill")

    for i, row in enumerate(responses):
        text = build_embedding_text(row["responses"], row["ai_insights"], row["user_name"])
        embedding = generate_embedding(text)
        if embedding:
            cur.execute(
                "UPDATE standup_response SET embedding = %s::vector WHERE id = %s",
                (str(embedding), row["id"]),
            )

        if (i + 1) % 5 == 0:
            conn.commit()
            print(f"  ✅ Responses: {i + 1}/{len(responses)}")
            time.sleep(0.2)  # Rate limiting

    conn.commit()
    print(f"✅ Backfilled {len(responses)} standup response embeddings")

    # --- Backfill insight embeddings ---
    cur.execute("""
        SELECT id, title, description
        FROM insight
        WHERE embedding IS NULL
          AND deleted_at IS NULL
        ORDER BY created_at DESC
    """)
    insights = cur.fetchall()
    print(f"\n📊 Found {len(insights)} insights to backfill")

    for i, row in enumerate(insights):
        text = f"{row['title']}: {row['description']}"
        embedding = generate_embedding(text)
        if embedding:
            cur.execute(
                "UPDATE insight SET embedding = %s::vector WHERE id = %s",
                (str(embedding), row["id"]),
            )

        if (i + 1) % 5 == 0:
            conn.commit()
            print(f"  ✅ Insights: {i + 1}/{len(insights)}")
            time.sleep(0.2)

    conn.commit()
    print(f"✅ Backfilled {len(insights)} insight embeddings")

    # --- Verify ---
    cur.execute("SELECT COUNT(*) as total, COUNT(embedding) as embedded FROM standup_response WHERE deleted_at IS NULL")
    stats = cur.fetchone()
    print(f"\n📊 Standup responses: {stats['embedded']}/{stats['total']} have embeddings")

    cur.execute("SELECT COUNT(*) as total, COUNT(embedding) as embedded FROM insight WHERE deleted_at IS NULL")
    stats = cur.fetchone()
    print(f"📊 Insights: {stats['embedded']}/{stats['total']} have embeddings")

    cur.close()
    conn.close()
    print("\n✅ Backfill complete!")


if __name__ == "__main__":
    backfill()
