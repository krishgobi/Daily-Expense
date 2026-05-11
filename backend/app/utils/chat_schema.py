# Chat History Table Schema for Supabase

CHAT_HISTORY_TABLE_SQL = """
-- Create chat_history table for storing user conversations
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL, -- To group conversations
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'assistant')),
    message_content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- Store additional context like timestamps, tokens, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_session ON chat_history(user_id, session_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own chat history" ON chat_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages" ON chat_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" ON chat_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" ON chat_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at
CREATE TRIGGER chat_history_updated_at_trigger
    BEFORE UPDATE ON chat_history
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_history_updated_at();
"""

# RAG Context Table for storing expense/transaction embeddings
RAG_CONTEXT_TABLE_SQL = """
-- Enable pgvector extension if available
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        CREATE EXTENSION IF NOT EXISTS vector;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If vector extension is not available, create table without vector column
        RAISE NOTICE 'pgvector extension not available, creating table without vector support';
END
$$;

-- Create rag_context table for storing embeddings and context
CREATE TABLE IF NOT EXISTS rag_context (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('expense', 'transaction', 'summary')),
    content_id UUID NOT NULL, -- Reference to expense or transaction ID
    content_text TEXT NOT NULL, -- The text to be embedded
    metadata JSONB DEFAULT '{}', -- Additional context like dates, amounts, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add vector column if pgvector is available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        ALTER TABLE rag_context ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add vector column';
END
$$;

-- Create indexes for RAG performance
CREATE INDEX IF NOT EXISTS idx_rag_context_user_id ON rag_context(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_context_content_type ON rag_context(content_type);
CREATE INDEX IF NOT EXISTS idx_rag_context_content_id ON rag_context(content_id);
CREATE INDEX IF NOT EXISTS idx_rag_context_user_content ON rag_context(user_id, content_type);

-- Enable Row Level Security (RLS)
ALTER TABLE rag_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies for RAG context
CREATE POLICY "Users can view their own RAG context" ON rag_context
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own RAG context" ON rag_context
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RAG context" ON rag_context
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RAG context" ON rag_context
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for automatic updated_at
CREATE TRIGGER rag_context_updated_at_trigger
    BEFORE UPDATE ON rag_context
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_history_updated_at();
"""

# Function to create similarity search for RAG (only if pgvector is available)
SIMILARITY_SEARCH_FUNCTION_SQL = """
-- Create function for similarity search using cosine similarity (only if vector extension is available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        CREATE OR REPLACE FUNCTION search_similar_content(
            p_user_id UUID,
            p_query_embedding VECTOR(1536),
            p_content_type VARCHAR(50) DEFAULT NULL,
            p_limit INTEGER DEFAULT 5
        )
        RETURNS TABLE (
            id UUID,
            content_type VARCHAR(50),
            content_id UUID,
            content_text TEXT,
            metadata JSONB,
            similarity_score FLOAT
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                rc.id,
                rc.content_type,
                rc.content_id,
                rc.content_text,
                rc.metadata,
                1 - (rc.embedding <=> p_query_embedding) as similarity_score
            FROM rag_context rc
            WHERE rc.user_id = p_user_id
                AND (p_content_type IS NULL OR rc.content_type = p_content_type)
            ORDER BY rc.embedding <=> p_query_embedding
            LIMIT p_limit;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create similarity search function';
END
$$;
"""
