import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunk text into smaller pieces for embedding
function chunkText(text: string, maxWords: number = 400): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).length;
    
    if (currentWordCount + words > maxWords && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
      currentWordCount = 0;
    }
    
    currentChunk.push(sentence);
    currentWordCount += words;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks.filter(chunk => chunk.trim().length > 50);
}

// Generate embedding using Lovable AI Gateway (OpenAI compatible)
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Embedding API error:', response.status, error);
    throw new Error(`Embedding API failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Action: Add knowledge content
    if (action === 'add' && req.method === 'POST') {
      const { content, category, source, title } = await req.json();

      if (!content || !category || !source) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: content, category, source' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Chunk the content
      const chunks = chunkText(content);
      console.log(`Processing ${chunks.length} chunks for category: ${category}`);

      const results = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          // Generate embedding for chunk
          const embedding = await generateEmbedding(chunk, lovableApiKey);
          
          // Store in database
          const { data, error } = await supabase
            .from('knowledge_base')
            .insert({
              category,
              source,
              title: title || `${source} - Part ${i + 1}`,
              content: chunk,
              embedding,
              tokens_count: chunk.split(/\s+/).length,
            })
            .select('id')
            .single();

          if (error) {
            console.error(`Error storing chunk ${i}:`, error);
            results.push({ index: i, success: false, error: error.message });
          } else {
            results.push({ index: i, success: true, id: data.id });
          }
        } catch (embeddingError) {
          console.error(`Error generating embedding for chunk ${i}:`, embeddingError);
          results.push({ index: i, success: false, error: 'Embedding generation failed' });
        }

        // Small delay to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const successCount = results.filter(r => r.success).length;
      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Processed ${successCount}/${chunks.length} chunks`,
          results 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Search knowledge base
    if (action === 'search' && req.method === 'POST') {
      const { query, category, limit = 5 } = await req.json();

      if (!query) {
        return new Response(
          JSON.stringify({ error: 'Missing query' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate embedding for query
      const queryEmbedding = await generateEmbedding(query, lovableApiKey);

      // Search using the database function
      const { data, error } = await supabase.rpc('search_knowledge_base', {
        query_embedding: queryEmbedding,
        match_count: limit,
        filter_category: category || null,
      });

      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ results: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Get stats
    if (action === 'stats') {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('category, id', { count: 'exact' });

      if (error) throw error;

      // Count by category
      const stats: Record<string, number> = {};
      for (const item of data || []) {
        stats[item.category] = (stats[item.category] || 0) + 1;
      }

      return new Response(
        JSON.stringify({ 
          total: data?.length || 0,
          byCategory: stats 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Delete document
    if (action === 'delete' && req.method === 'DELETE') {
      const { id } = await req.json();

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing document id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: List documents
    if (action === 'list') {
      const category = url.searchParams.get('category');
      
      let query = supabase
        .from('knowledge_base')
        .select('id, category, source, title, tokens_count, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ documents: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: add, search, stats, list, delete' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Knowledge base error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
