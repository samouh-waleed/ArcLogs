-- 001_enable_pgvector.sql
-- Enable pgvector extension and add embedding columns for RAG

-- Enable the vector extension (Neon supports this natively)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to standup_response for semantic search
ALTER TABLE standup_response
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Add embedding column to insight for blocker pattern detection
ALTER TABLE insight
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- HNSW indexes for fast cosine similarity search
-- Only index non-null embeddings on non-deleted records
CREATE INDEX IF NOT EXISTS standup_response_embedding_idx
ON standup_response
USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS insight_embedding_idx
ON insight
USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL AND deleted_at IS NULL;
