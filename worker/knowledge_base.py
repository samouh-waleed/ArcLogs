"""Team knowledge base - tracks expertise topics from standup history.

Extracts what topics each team member works on and enables
expert suggestions for help requests.
"""
import json
from typing import Dict, List, Optional


def update_expertise(
    cur,
    user_id: str,
    team_id: str,
    insights: Dict,
    openai_client,
    embedding_func,
):
    """Extract expertise topics from standup insights and update the knowledge base.

    Uses GPT-4o-mini (cheap) to extract 1-3 technical topics from the standup,
    then upserts into team_expertise with embeddings for semantic search.
    """
    summary = insights.get("summary", "")
    action_items = insights.get("action_items", [])
    referenced_keys = insights.get("referenced_jira_keys", [])

    if not summary:
        return

    # Build a concise input for topic extraction
    context_parts = [f"Summary: {summary}"]
    if action_items:
        context_parts.append(f"Actions: {', '.join(action_items)}")
    if referenced_keys:
        context_parts.append(f"Jira keys: {', '.join(referenced_keys)}")
    context = " | ".join(context_parts)

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract 1-3 short technical expertise topics from this standup summary. "
                        "Topics should be specific skills or areas (e.g., 'authentication', 'SQS debugging', 'React frontend', 'database migrations'). "
                        "Return ONLY a JSON array of lowercase strings. No explanation."
                    ),
                },
                {"role": "user", "content": context},
            ],
            temperature=0,
            max_tokens=100,
        )

        content = response.choices[0].message.content.strip()
        # Handle markdown code blocks
        if content.startswith("```"):
            content = content.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

        topics = json.loads(content)
        if not isinstance(topics, list):
            return

        for topic in topics[:3]:
            topic = str(topic).lower().strip()
            if not topic or len(topic) < 2:
                continue

            # Generate embedding for the topic
            topic_embedding = embedding_func(topic)

            if topic_embedding:
                emb_str = "[" + ",".join(str(float(x)) for x in topic_embedding) + "]"
            else:
                emb_str = None

            # Upsert: increment count if exists, create if not
            if emb_str:
                cur.execute("""
                    INSERT INTO team_expertise (id, team_id, user_id, topic, mention_count, embedding, last_mentioned_at)
                    VALUES (gen_random_uuid()::text, %s, %s, %s, 1, %s::vector, NOW())
                    ON CONFLICT (team_id, user_id, topic)
                    DO UPDATE SET
                        mention_count = team_expertise.mention_count + 1,
                        last_mentioned_at = NOW(),
                        embedding = %s::vector,
                        updated_at = NOW()
                """, (team_id, user_id, topic, emb_str, emb_str))
            else:
                cur.execute("""
                    INSERT INTO team_expertise (id, team_id, user_id, topic, mention_count, last_mentioned_at)
                    VALUES (gen_random_uuid()::text, %s, %s, %s, 1, NOW())
                    ON CONFLICT (team_id, user_id, topic)
                    DO UPDATE SET
                        mention_count = team_expertise.mention_count + 1,
                        last_mentioned_at = NOW(),
                        updated_at = NOW()
                """, (team_id, user_id, topic))

        print(f"🧠 Updated expertise: {', '.join(topics[:3])}")

    except Exception as e:
        print(f"⚠️ Expertise extraction failed: {e}")


def find_experts(
    cur,
    team_id: str,
    query: str,
    embedding_func,
    exclude_user_id: Optional[str] = None,
    limit: int = 3,
) -> List[Dict]:
    """Find team members with expertise matching the query topic.

    Uses semantic similarity to find the best matches, not just keyword matching.
    Returns experts sorted by relevance (closest embedding distance + highest mention count).
    """
    try:
        query_embedding = embedding_func(query)
        if not query_embedding:
            return []

        emb_str = "[" + ",".join(str(float(x)) for x in query_embedding) + "]"

        exclude_clause = ""
        params = [emb_str, team_id, emb_str, limit]
        if exclude_user_id:
            exclude_clause = "AND te.user_id != %s"
            params = [emb_str, team_id, exclude_user_id, emb_str, limit]

        cur.execute(f"""
            SELECT
                te.user_id,
                u.name,
                te.topic,
                te.mention_count,
                te.embedding <=> %s::vector AS distance
            FROM team_expertise te
            JOIN "user" u ON te.user_id = u.id
            WHERE te.team_id = %s
              AND te.embedding IS NOT NULL
              {exclude_clause}
            ORDER BY te.embedding <=> %s::vector
            LIMIT %s
        """, params)

        results = cur.fetchall()

        # Filter to only relevant results (distance < 0.6)
        return [r for r in results if r["distance"] < 0.6]

    except Exception as e:
        print(f"⚠️ Expert search failed: {e}")
        return []
