-- Enable the pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge base table for RAG
CREATE TABLE public.knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('diagnosis', 'treatment', 'lifestyle', 'education', 'research')),
  source text NOT NULL,
  title text,
  content text NOT NULL,
  embedding vector(1536),
  tokens_count integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create index for vector similarity search
CREATE INDEX knowledge_base_embedding_idx ON public.knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for category filtering
CREATE INDEX knowledge_base_category_idx ON public.knowledge_base(category);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Allow service role full access for edge functions
CREATE POLICY "Service role can manage knowledge base"
ON public.knowledge_base
FOR ALL
USING (auth.role() = 'service_role');

-- Allow authenticated users to read knowledge (for potential future features)
CREATE POLICY "Authenticated users can read knowledge"
ON public.knowledge_base
FOR SELECT
TO authenticated
USING (true);

-- Create function to search knowledge base by embedding similarity
CREATE OR REPLACE FUNCTION public.search_knowledge_base(
  query_embedding vector(1536),
  match_count integer DEFAULT 5,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  category text,
  source text,
  title text,
  content text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.category,
    kb.source,
    kb.title,
    kb.content,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  WHERE 
    kb.embedding IS NOT NULL
    AND (filter_category IS NULL OR kb.category = filter_category)
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;