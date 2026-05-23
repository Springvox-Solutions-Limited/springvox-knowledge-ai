import 'server-only';

import { QdrantClient } from '@qdrant/js-client-rest';
import { getEmbeddingDimensions, getEmbeddingModelName, getEmbeddingProvider, logEmbeddingConfiguration } from '@/src/lib/ai';

const qdrantUrl = process.env.QDRANT_URL;
const qdrantApiKey = process.env.QDRANT_API_KEY;

if (!qdrantUrl) {
  throw new Error('QDRANT_URL is required');
}

if (!qdrantApiKey) {
  throw new Error('QDRANT_API_KEY is required');
}

export const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'springvox_knowledge';
export const QDRANT_DISTANCE = 'Cosine' as const;

export const qdrant = new QdrantClient({
  url: qdrantUrl,
  apiKey: qdrantApiKey,
});

let collectionInitPromise: Promise<void> | null = null;

async function ensurePayloadIndex(fieldName: 'workspace_id' | 'document_id') {
  try {
    await qdrant.createPayloadIndex(COLLECTION_NAME, {
      wait: true,
      field_name: fieldName,
      field_schema: 'keyword',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';

    if (!message.toLowerCase().includes('already')) {
      console.warn(`Qdrant payload index warning for ${fieldName}:`, error);
    }
  }
}

export async function ensureQdrantCollection() {
  if (!collectionInitPromise) {
    collectionInitPromise = (async () => {
      logEmbeddingConfiguration();
      const expectedVectorSize = getEmbeddingDimensions();
      const { exists } = await qdrant.collectionExists(COLLECTION_NAME);

      if (!exists) {
        await qdrant.createCollection(COLLECTION_NAME, {
          vectors: {
            size: expectedVectorSize,
            distance: QDRANT_DISTANCE,
          },
        });
      } else {
        const actualVectorSize = await getCollectionVectorSize();

        if (actualVectorSize && actualVectorSize !== expectedVectorSize) {
          throw new Error(
            [
              `Qdrant collection "${COLLECTION_NAME}" uses ${actualVectorSize}-dimension vectors,`,
              `but ${getEmbeddingProvider()} (${getEmbeddingModelName()}) is configured for ${expectedVectorSize} dimensions.`,
              'Reindex documents into a fresh collection before changing embedding providers or dimensions.',
            ].join(' '),
          );
        }
      }

      await ensurePayloadIndex('workspace_id');
      await ensurePayloadIndex('document_id');
    })();
  }

  return collectionInitPromise;
}

async function getCollectionVectorSize() {
  const collection = await qdrant.getCollection(COLLECTION_NAME);
  const vectors = collection.config?.params?.vectors;

  if (!vectors) {
    return null;
  }

  if ('size' in vectors && typeof vectors.size === 'number') {
    return vectors.size;
  }

  const firstVector = Object.values(vectors)[0] as { size?: unknown } | undefined;
  return typeof firstVector?.size === 'number' ? firstVector.size : null;
}

export async function deleteDocumentVectors(documentId: string, workspaceId: string) {
  await ensureQdrantCollection();

  await qdrant.delete(COLLECTION_NAME, {
    filter: {
      must: [
        { key: 'document_id', match: { value: documentId } },
        { key: 'workspace_id', match: { value: workspaceId } },
      ],
    },
  });
}
