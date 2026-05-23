import 'server-only';

export const VOYAGE_EMBEDDING_MODEL = process.env.VOYAGE_EMBEDDING_MODEL || 'voyage-4-lite';
export const VOYAGE_DEFAULT_DIMENSIONS = 1024;
export const VOYAGE_BATCH_SIZE = 20;
export const VOYAGE_BATCH_DELAY_MS = 500;
export const VOYAGE_MAX_CONCURRENT_BATCHES = 2;

type VoyageInputType = 'document' | 'query';

type VoyageEmbeddingResponse = {
  data?: Array<{
    embedding?: number[];
    index?: number;
  }>;
};

function getVoyageApiKey() {
  const apiKey = process.env.VOYAGE_API_KEY;

  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY is required when SPRINGVOX_EMBEDDING_PROVIDER=voyage.');
  }

  return apiKey;
}

export function getVoyageEmbeddingDimensions() {
  const configured = process.env.SPRINGVOX_EMBEDDING_DIMENSIONS;
  const parsed = configured ? Number.parseInt(configured, 10) : VOYAGE_DEFAULT_DIMENSIONS;

  if (![256, 512, 1024, 2048].includes(parsed)) {
    throw new Error('SPRINGVOX_EMBEDDING_DIMENSIONS for Voyage must be one of 256, 512, 1024, or 2048.');
  }

  return parsed;
}

export async function embedBatchWithVoyage(
  texts: string[],
  inputType: VoyageInputType,
  attempt = 1,
): Promise<{ embeddings: number[][]; retries: number }> {
  const apiKey = getVoyageApiKey();
  const model = VOYAGE_EMBEDDING_MODEL;
  const outputDimension = getVoyageEmbeddingDimensions();

  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: texts,
        model,
        input_type: inputType,
        output_dimension: outputDimension,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const temporary = response.status === 429 || response.status >= 500;

      if (temporary && attempt < 4) {
        const delayMs = 750 * 2 ** (attempt - 1);
        await sleep(delayMs);
        const result = await embedBatchWithVoyage(texts, inputType, attempt + 1);
        return { embeddings: result.embeddings, retries: result.retries + 1 };
      }

      throw new Error(`Voyage embedding request failed (${response.status}): ${body || response.statusText}`);
    }

    const payload = (await response.json()) as VoyageEmbeddingResponse;
    const embeddings = (payload.data || [])
      .sort((a, b) => (a.index || 0) - (b.index || 0))
      .map((item) => item.embedding || []);

    if (embeddings.length !== texts.length || embeddings.some((embedding) => embedding.length !== outputDimension)) {
      throw new Error('Voyage embedding response did not match the expected batch size or vector dimension.');
    }

    return { embeddings, retries: attempt - 1 };
  } catch (error) {
    if (attempt < 4 && isTemporaryNetworkError(error)) {
      const delayMs = 750 * 2 ** (attempt - 1);
      await sleep(delayMs);
      const result = await embedBatchWithVoyage(texts, inputType, attempt + 1);
      return { embeddings: result.embeddings, retries: result.retries + 1 };
    }

    throw normalizeVoyageError(error);
  }
}

function normalizeVoyageError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }

  try {
    return new Error(`Voyage embedding request failed: ${JSON.stringify(error)}`);
  } catch {
    return new Error('Voyage embedding request failed with an unknown error.');
  }
}

function isTemporaryNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('fetch failed') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('network') ||
    message.includes('temporarily')
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
