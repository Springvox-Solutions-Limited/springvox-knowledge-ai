type SearchPoint = {
  score?: number;
  payload?: Record<string, unknown> | null;
};

export type ContextChunk = {
  filename: string;
  documentId: string | null;
  chunkIndex: number;
  preview: string;
  text: string;
  score: number;
};

export type CompressedContext = {
  context: string;
  chunks: ContextChunk[];
  documentCount: number;
  characterCount: number;
};

const MAX_EXCERPT_CHARACTERS = 1100;

function normalizeText(value: unknown) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getPayloadString(point: SearchPoint, key: string) {
  return normalizeText(point.payload?.[key]);
}

function getPayloadNumber(point: SearchPoint, key: string) {
  const value = Number(point.payload?.[key]);
  return Number.isFinite(value) ? value : 0;
}

function trimExcerpt(text: string, maxLength = MAX_EXCERPT_CHARACTERS) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

export function toContextChunks(searchResults: SearchPoint[]) {
  return searchResults
    .map((point) => ({
      filename: getPayloadString(point, 'filename') || 'Unknown file',
      documentId: getPayloadString(point, 'document_id') || null,
      chunkIndex: getPayloadNumber(point, 'chunk_index'),
      preview: getPayloadString(point, 'preview'),
      text: getPayloadString(point, 'chunk_text'),
      score: Number(point.score || 0),
    }))
    .filter((chunk) => chunk.text);
}

function dedupeChunks(chunks: ContextChunk[]) {
  const seen = new Set<string>();

  return chunks.filter((chunk) => {
    const key = `${chunk.documentId || chunk.filename}::${chunk.chunkIndex}::${chunk.text.slice(0, 80)}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function selectDiverseChunks(chunks: ContextChunk[], maxFinalChunks: number) {
  const sorted = [...chunks].sort((a, b) => b.score - a.score);
  const selected: ContextChunk[] = [];
  const selectedKeys = new Set<string>();

  for (const chunk of sorted) {
    const key = chunk.documentId || chunk.filename;
    if (selectedKeys.has(key)) {
      continue;
    }

    selected.push(chunk);
    selectedKeys.add(key);

    if (selected.length >= maxFinalChunks) {
      return selected;
    }
  }

  for (const chunk of sorted) {
    if (selected.includes(chunk)) {
      continue;
    }

    selected.push(chunk);

    if (selected.length >= maxFinalChunks) {
      break;
    }
  }

  return selected.sort((a, b) => b.score - a.score);
}

function buildGroupedContext(chunks: ContextChunk[], maxContextCharacters: number) {
  const groups = new Map<string, ContextChunk[]>();

  for (const chunk of chunks) {
    const key = chunk.documentId || chunk.filename;
    const existing = groups.get(key) || [];
    existing.push(chunk);
    groups.set(key, existing);
  }

  const sections: string[] = [
    [
      'Use only the excerpts below.',
      'Excerpts are grouped by document. If documents are unrelated, answer separately or state that a direct relationship is not supported.',
    ].join(' '),
  ];

  for (const groupChunks of groups.values()) {
    const firstChunk = groupChunks[0];
    sections.push(`Document: ${firstChunk.filename}`);
    sections.push('Relevant excerpts:');

    for (const chunk of groupChunks.sort((a, b) => b.score - a.score)) {
      sections.push(
        `- Section ${chunk.chunkIndex} (score ${chunk.score.toFixed(3)}): ${trimExcerpt(chunk.text)}`,
      );
    }
  }

  let context = sections.join('\n');

  while (context.length > maxContextCharacters && sections.length > 3) {
    sections.pop();
    context = `${sections.join('\n')}\n[Additional excerpts omitted to keep the answer focused.]`;
  }

  return context;
}

export function compressSearchResults({
  searchResults,
  maxFinalChunks,
  maxContextCharacters,
}: {
  searchResults: SearchPoint[];
  maxFinalChunks: number;
  maxContextCharacters: number;
}): CompressedContext {
  const chunks = selectDiverseChunks(
    dedupeChunks(toContextChunks(searchResults)),
    maxFinalChunks,
  );
  const context = buildGroupedContext(chunks, maxContextCharacters);
  const documentCount = new Set(chunks.map((chunk) => chunk.documentId || chunk.filename)).size;

  return {
    context,
    chunks,
    documentCount,
    characterCount: context.length,
  };
}
