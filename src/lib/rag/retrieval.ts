import 'server-only';

import { rerankWithVoyage, VOYAGE_RERANK_MODEL } from '@/src/lib/ai';
import { COLLECTION_NAME, qdrant } from '@/src/lib/qdrant';

type SearchPoint = Awaited<ReturnType<typeof qdrant.search>>[number];

export type RetrievalCandidate = SearchPoint & {
  rerank_score?: number;
  hybrid_source?: 'vector' | 'keyword';
};

function getNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function isRerankEnabled() {
  return process.env.RAG_RERANK_ENABLED !== 'false';
}

export function getQdrantFetchK() {
  return getNumberEnv('RAG_QDRANT_FETCH_K', 30);
}

export function getRerankTopK() {
  return getNumberEnv('RAG_RERANK_TOP_K', 8);
}

export async function rerankCandidates({
  query,
  candidates,
}: {
  query: string;
  candidates: RetrievalCandidate[];
}) {
  if (!isRerankEnabled() || candidates.length === 0) {
    return {
      candidates: candidates.slice(0, getRerankTopK()),
      provider: 'none',
      rerankedCount: 0,
      latencyMs: 0,
      fallbackUsed: false,
    };
  }

  const startedAt = Date.now();

  try {
    const documents = candidates.map((candidate) =>
      [
        candidate.payload?.filename ? `Document: ${candidate.payload.filename}` : '',
        candidate.payload?.document_category ? `Category: ${candidate.payload.document_category}` : '',
        candidate.payload?.document_keywords ? `Keywords: ${candidate.payload.document_keywords}` : '',
        String(candidate.payload?.chunk_text || candidate.payload?.preview || ''),
      ]
        .filter(Boolean)
        .join('\n'),
    );
    const reranked = await rerankWithVoyage({ query, documents });
    const rerankedCandidates = reranked
      .map((result) => {
        const candidate = candidates[result.index];
        if (!candidate) return null;
        return {
          ...candidate,
          rerank_score: result.relevanceScore,
        };
      })
      .filter(Boolean) as RetrievalCandidate[];

    return {
      candidates: rerankedCandidates.slice(0, getRerankTopK()),
      provider: `voyage:${VOYAGE_RERANK_MODEL}`,
      rerankedCount: rerankedCandidates.length,
      latencyMs: Date.now() - startedAt,
      fallbackUsed: false,
    };
  } catch (error) {
    console.warn('[RAG] Voyage rerank unavailable; falling back to vector/keyword ranking.', error);
    return {
      candidates: candidates.slice(0, getRerankTopK()),
      provider: `voyage:${VOYAGE_RERANK_MODEL}`,
      rerankedCount: 0,
      latencyMs: Date.now() - startedAt,
      fallbackUsed: true,
    };
  }
}

export function mergeRetrievalCandidates(...candidateGroups: RetrievalCandidate[][]) {
  const byKey = new Map<string, RetrievalCandidate>();

  for (const candidate of candidateGroups.flat()) {
    const key = [
      candidate.payload?.document_id || 'unknown',
      candidate.payload?.chunk_index || candidate.id,
      String(candidate.payload?.chunk_text || '').slice(0, 80),
    ].join('::');
    const existing = byKey.get(key);

    if (!existing || Number(candidate.score || 0) > Number(existing.score || 0)) {
      byKey.set(key, candidate);
    }
  }

  return Array.from(byKey.values()).sort((left, right) => Number(right.score || 0) - Number(left.score || 0));
}

export async function searchQdrantVector({
  vector,
  workspaceId,
  limit,
  scoreThreshold,
  documentIds,
}: {
  vector: number[];
  workspaceId: string;
  limit: number;
  scoreThreshold?: number;
  /** Optional: restrict results to these document ids (e.g. a collection scope). */
  documentIds?: string[];
}) {
  // The workspace_id filter is mandatory and never removed (tenant isolation).
  const must: Array<Record<string, unknown>> = [
    { key: 'workspace_id', match: { value: workspaceId } },
  ];

  // When documentIds is provided (a collection scope), always apply it — even
  // if empty, which correctly matches nothing for an empty collection.
  if (Array.isArray(documentIds)) {
    must.push({ key: 'document_id', match: { any: documentIds } });
  }

  return qdrant.search(COLLECTION_NAME, {
    vector,
    filter: { must },
    limit,
    score_threshold: scoreThreshold,
    with_payload: true,
  }) as Promise<RetrievalCandidate[]>;
}
