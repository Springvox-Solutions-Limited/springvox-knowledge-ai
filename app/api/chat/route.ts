import { generateStrictAnswer, getEmbedding, STRICT_NO_ANSWER } from '@/src/lib/gemini';
import { COLLECTION_NAME, ensureQdrantCollection, qdrant } from '@/src/lib/qdrant';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { ALL_ROLES } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

type Citation = {
  filename: string;
  chunk_index: number;
  preview: string;
};

function dedupeCitations(citations: Citation[]) {
  const seen = new Set<string>();

  return citations.filter((citation) => {
    const key = `${citation.filename}::${citation.chunk_index}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getRagTopK() {
  const value = Number(process.env.RAG_TOP_K || 3);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 3;
}

function getRagScoreThreshold() {
  const value = Number(process.env.RAG_SCORE_THRESHOLD || 0.55);
  return Number.isFinite(value) && value >= 0 ? value : 0.55;
}

export async function POST(req: Request) {
  try {
    const { user, profile } = await getAuthenticatedUserWithProfile(req, ALL_ROLES);
    const { question } = await req.json();

    if (typeof question !== 'string' || !question.trim()) {
      return Response.json({ error: 'Question is required' }, { status: 400 });
    }

    const normalizedQuestion = question.trim();
    const supabase = getSupabaseAdmin();

    await ensureQdrantCollection();

    const queryVector = await getEmbedding(normalizedQuestion);
    const searchResults = await qdrant.search(COLLECTION_NAME, {
      vector: queryVector,
      filter: {
        must: [{ key: 'workspace_id', match: { value: profile.workspace_id } }],
      },
      limit: getRagTopK(),
      score_threshold: getRagScoreThreshold(),
      with_payload: true,
    });

    const citations = dedupeCitations(searchResults.map((result) => ({
      filename: String(result.payload?.filename || 'Unknown file'),
      chunk_index: Number(result.payload?.chunk_index || 0),
      preview: String(result.payload?.preview || ''),
    })));

    let answer = STRICT_NO_ANSWER;

    if (searchResults.length > 0) {
      const context = searchResults
        .map((result, index) => {
          const filename = String(result.payload?.filename || 'Unknown file');
          const chunkNumber = Number(result.payload?.chunk_index || 0);
          const preview = String(result.payload?.preview || '');
          const chunkText = String(result.payload?.chunk_text || '');

          return [
            `Source ${index + 1}:`,
            `Filename: ${filename}`,
            `Chunk Number: ${chunkNumber}`,
            `Preview: ${preview}`,
            `Content: ${chunkText}`,
          ].join('\n');
        })
        .join('\n\n');

      const generatedAnswer = await generateStrictAnswer(normalizedQuestion, context);
      answer = generatedAnswer || STRICT_NO_ANSWER;
    }

    const { error: insertError } = await supabase.from('chat_messages').insert({
      user_id: user.id,
      workspace_id: profile.workspace_id,
      question: normalizedQuestion,
      answer,
      citations,
    });

    if (insertError) {
      throw insertError;
    }

    return Response.json({ answer, citations });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected chat error';
    const status =
      message === 'Unauthorized' || message === 'Missing bearer token'
        ? 401
        : message === 'Forbidden'
          ? 403
          : 500;

    console.error('Chat error:', error);
    return Response.json({ error: message }, { status });
  }
}
