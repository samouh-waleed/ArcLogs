"""Detect recurring blocker patterns across standup responses using vector similarity.

Uses pgvector cosine distance to cluster similar blockers and surface
patterns that affect multiple team members over time.
"""
from typing import Dict, List, Optional


def detect_blocker_patterns(
    cur,
    team_id: str,
    days: int = 14,
    similarity_threshold: float = 0.35,
    min_occurrences: int = 2,
) -> List[Dict]:
    """Find recurring blocker themes by clustering similar blocker embeddings.

    Algorithm:
    1. Fetch all blockers from last N days that have embeddings
    2. For each pair, compute cosine distance via pgvector
    3. Group into clusters where distance < threshold
    4. Report clusters with min_occurrences+ as patterns

    Returns list of patterns sorted by occurrence count (descending).
    """
    try:
        cur.execute("""
            SELECT
                i.id,
                i.title,
                i.description,
                i.severity,
                i.status,
                i.created_at::text as created_at
            FROM insight i
            WHERE i.team_id = %s
              AND i.insight_type = 'blocker'
              AND i.embedding IS NOT NULL
              AND i.created_at >= NOW() - INTERVAL '%s days'
              AND i.deleted_at IS NULL
            ORDER BY i.created_at DESC
        """, (team_id, days))

        blockers = cur.fetchall()

        if len(blockers) < min_occurrences:
            return []

        # Compute pairwise distances using pgvector
        # Build clusters: for each blocker, find similar ones
        clusters: List[List[Dict]] = []
        used = set()

        for i, b1 in enumerate(blockers):
            if b1["id"] in used:
                continue

            cluster = [b1]
            used.add(b1["id"])

            for j, b2 in enumerate(blockers):
                if i == j or b2["id"] in used:
                    continue

                # Use pgvector to compute cosine distance between embeddings
                cur.execute("""
                    SELECT
                        (SELECT embedding FROM insight WHERE id = %s)
                        <=>
                        (SELECT embedding FROM insight WHERE id = %s)
                    AS distance
                """, (b1["id"], b2["id"]))

                row = cur.fetchone()
                if row and row["distance"] is not None and row["distance"] < similarity_threshold:
                    cluster.append(b2)
                    used.add(b2["id"])

            if len(cluster) >= min_occurrences:
                # Extract unique info from the cluster
                dates = [b["created_at"] for b in cluster]
                statuses = set(b["status"] for b in cluster)
                descriptions = [b["description"] for b in cluster if b.get("description")]

                clusters.append({
                    "theme": cluster[0]["title"],
                    "occurrences": len(cluster),
                    "first_seen": min(dates),
                    "last_seen": max(dates),
                    "still_open": "open" in statuses,
                    "severity": cluster[0].get("severity", "medium"),
                    "examples": descriptions[:3],
                })

        return sorted(clusters, key=lambda c: c["occurrences"], reverse=True)

    except Exception as e:
        print(f"⚠️ Blocker pattern detection failed: {e}")
        return []


def find_similar_past_blockers(
    cur,
    blocker_text: str,
    team_id: str,
    embedding_func,
    limit: int = 3,
) -> List[Dict]:
    """Find past blockers similar to the current one.

    Useful for suggesting resolutions - if a similar blocker was resolved before,
    the resolution might apply again.
    """
    try:
        embedding = embedding_func(blocker_text)
        if not embedding:
            return []

        # Convert to pgvector format
        emb_str = "[" + ",".join(str(float(x)) for x in embedding) + "]"

        cur.execute("""
            SELECT
                i.id,
                i.title,
                i.description,
                i.severity,
                i.status,
                i.resolved_at,
                i.created_at::text as created_at,
                i.embedding <=> %s::vector AS distance
            FROM insight i
            WHERE i.team_id = %s
              AND i.insight_type = 'blocker'
              AND i.embedding IS NOT NULL
              AND i.deleted_at IS NULL
            ORDER BY i.embedding <=> %s::vector
            LIMIT %s
        """, (emb_str, team_id, emb_str, limit))

        results = cur.fetchall()

        # Only return actually similar ones (distance < 0.5)
        return [r for r in results if r["distance"] < 0.5]

    except Exception as e:
        print(f"⚠️ Similar blocker search failed: {e}")
        return []
