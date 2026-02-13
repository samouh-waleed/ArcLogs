-- 002_team_knowledge_base.sql
-- Track team member expertise topics extracted from standups

CREATE TABLE IF NOT EXISTS team_expertise (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    team_id TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    mention_count INTEGER DEFAULT 1,
    last_mentioned_at TIMESTAMP DEFAULT NOW(),
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(team_id, user_id, topic)
);

CREATE INDEX IF NOT EXISTS team_expertise_team_idx ON team_expertise(team_id);
CREATE INDEX IF NOT EXISTS team_expertise_user_idx ON team_expertise(user_id);
CREATE INDEX IF NOT EXISTS team_expertise_embedding_idx
ON team_expertise USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL;
