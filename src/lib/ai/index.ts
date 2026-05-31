import 'server-only';

import {
  GEMINI_EMBEDDING_DIMENSIONS,
  embedManyWithGemini,
  generateStrictAnswer,
  generateDocumentIntelligence,
  streamStrictAnswer,
  STRICT_NO_ANSWER,
} from './providers/gemini';
import {
  VOYAGE_BATCH_DELAY_MS,
  VOYAGE_BATCH_SIZE,
  VOYAGE_EMBEDDING_MODEL,
  VOYAGE_MAX_CONCURRENT_BATCHES,
  VOYAGE_RERANK_MODEL,
  embedBatchWithVoyage,
  getVoyageEmbeddingDimensions,
  rerankWithVoyage,
} from './providers/voyage';

type EmbeddingProvider = 'gemini' | 'voyage';
type ChatProvider = 'gemini';
type EmbeddingInputType = 'document' | 'query';

export { generateStrictAnswer, generateDocumentIntelligence, streamStrictAnswer, STRICT_NO_ANSWER };
export { VOYAGE_RERANK_MODEL, rerankWithVoyage };

export function getChatProvider(): ChatProvider {
  const provider = (process.env.SPRINGVOX_CHAT_PROVIDER || 'gemini').toLowerCase();

  if (provider !== 'gemini') {
    throw new Error(`Unsupported chat provider "${provider}". SpringVox currently supports Gemini for chat generation.`);
  }

  return 'gemini';
}

export function getEmbeddingProvider(): EmbeddingProvider {
  const provider = (process.env.SPRINGVOX_EMBEDDING_PROVIDER || 'voyage').toLowerCase();

  if (provider !== 'voyage' && provider !== 'gemini') {
    throw new Error(`Unsupported embedding provider "${provider}". Use "voyage" or "gemini".`);
  }

  return provider;
}

export function getEmbeddingDimensions() {
  const provider = getEmbeddingProvider();

  if (provider === 'voyage') {
    return getVoyageEmbeddingDimensions();
  }

  return GEMINI_EMBEDDING_DIMENSIONS;
}

export function getEmbeddingModelName() {
  const provider = getEmbeddingProvider();

  if (provider === 'voyage') {
    return VOYAGE_EMBEDDING_MODEL;
  }

  return process.env.EMBEDDING_MODEL || 'gemini-embedding-001';
}

export function logEmbeddingConfiguration() {
  console.info(
    `[Embeddings] provider=${getEmbeddingProvider()} model=${getEmbeddingModelName()} dimensions=${getEmbeddingDimensions()}`,
  );
}

export async function embedOne(text: string, inputType: EmbeddingInputType = 'document') {
  const [embedding] = await embedMany([text], { inputType });
  return embedding;
}

export async function embedMany(
  texts: string[],
  options: { inputType?: EmbeddingInputType } = {},
) {
  const provider = getEmbeddingProvider();
  const inputType = options.inputType || 'document';
  const cleanedTexts = texts.map((text) => text.trim());

  if (cleanedTexts.some((text) => !text)) {
    throw new Error('Cannot embed empty text.');
  }

  if (provider === 'gemini') {
    return embedManyWithGemini(cleanedTexts);
  }

  return embedManyWithVoyage(cleanedTexts, inputType);
}

async function embedManyWithVoyage(texts: string[], inputType: EmbeddingInputType) {
  const batches = chunk(texts, VOYAGE_BATCH_SIZE);
  const embeddings = new Array<number[]>(texts.length);
  let totalRetries = 0;
  let nextBatchIndex = 0;

  console.info(
    `[Embeddings] provider=voyage model=${VOYAGE_EMBEDDING_MODEL} totalChunks=${texts.length} totalBatches=${batches.length} batchSize=${VOYAGE_BATCH_SIZE} concurrency=${VOYAGE_MAX_CONCURRENT_BATCHES}`,
  );

  const workerCount = Math.min(VOYAGE_MAX_CONCURRENT_BATCHES, batches.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextBatchIndex < batches.length) {
        const batchIndex = nextBatchIndex;
        nextBatchIndex += 1;

        if (batchIndex > 0) {
          await sleep(VOYAGE_BATCH_DELAY_MS);
        }

        const batch = batches[batchIndex];
        const { embeddings: batchEmbeddings, retries } = await embedBatchWithVoyage(batch, inputType);
        totalRetries += retries;

        const offset = batchIndex * VOYAGE_BATCH_SIZE;
        batchEmbeddings.forEach((embedding, index) => {
          embeddings[offset + index] = embedding;
        });
      }
    }),
  );

  console.info(
    `[Embeddings] provider=voyage totalChunks=${texts.length} totalBatches=${batches.length} retries=${totalRetries} batchSize=${VOYAGE_BATCH_SIZE}`,
  );

  return embeddings;
}

function chunk<T>(items: T[], size: number) {
  const batches: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
