export type QueryIntent =
  | 'factual_lookup'
  | 'summarization'
  | 'comparison'
  | 'troubleshooting'
  | 'analytics'
  | 'recommendation'
  | 'cross_document_reasoning'
  | 'unclear';

export type RetrievalSettings = {
  intent: QueryIntent;
  topK: number;
  scoreThreshold: number;
  maxFinalChunks: number;
  maxContextCharacters: number;
};

const DEFAULT_MAX_CONTEXT_CHARACTERS = 4500;

const INTENT_SETTINGS: Record<QueryIntent, Omit<RetrievalSettings, 'intent'>> = {
  factual_lookup: {
    topK: 5,
    scoreThreshold: 0.55,
    maxFinalChunks: 4,
    maxContextCharacters: DEFAULT_MAX_CONTEXT_CHARACTERS,
  },
  summarization: {
    topK: 10,
    scoreThreshold: 0.45,
    maxFinalChunks: 8,
    maxContextCharacters: DEFAULT_MAX_CONTEXT_CHARACTERS,
  },
  comparison: {
    topK: 12,
    scoreThreshold: 0.45,
    maxFinalChunks: 8,
    maxContextCharacters: DEFAULT_MAX_CONTEXT_CHARACTERS,
  },
  troubleshooting: {
    topK: 12,
    scoreThreshold: 0.45,
    maxFinalChunks: 8,
    maxContextCharacters: DEFAULT_MAX_CONTEXT_CHARACTERS,
  },
  analytics: {
    topK: 12,
    scoreThreshold: 0.4,
    maxFinalChunks: 8,
    maxContextCharacters: DEFAULT_MAX_CONTEXT_CHARACTERS,
  },
  recommendation: {
    topK: 10,
    scoreThreshold: 0.45,
    maxFinalChunks: 6,
    maxContextCharacters: DEFAULT_MAX_CONTEXT_CHARACTERS,
  },
  cross_document_reasoning: {
    topK: 15,
    scoreThreshold: 0.4,
    maxFinalChunks: 10,
    maxContextCharacters: DEFAULT_MAX_CONTEXT_CHARACTERS,
  },
  unclear: {
    topK: 6,
    scoreThreshold: 0.5,
    maxFinalChunks: 5,
    maxContextCharacters: DEFAULT_MAX_CONTEXT_CHARACTERS,
  },
};

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function classifyQueryIntent(question: string): QueryIntent {
  const normalized = question.toLowerCase().replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return 'unclear';
  }

  if (
    includesAny(normalized, [
      'based on these documents',
      'across documents',
      'across the documents',
      'using both',
      'from both',
      'connect',
      'relationship between',
      'do not assume causation',
    ])
  ) {
    return 'cross_document_reasoning';
  }

  if (
    includesAny(normalized, [
      'compare',
      'difference between',
      'differences between',
      'versus',
      ' vs ',
      'contrast',
      'which is better',
    ])
  ) {
    return 'comparison';
  }

  if (
    includesAny(normalized, [
      'summarize',
      'summarise',
      'overview',
      'key points',
      'main points',
      'brief',
      'recap',
    ])
  ) {
    return 'summarization';
  }

  if (
    includesAny(normalized, [
      'fail',
      'failing',
      'failure',
      'error',
      'issue',
      'problem',
      'troubleshoot',
      'fix',
      'not working',
      'why are',
      'why is',
    ])
  ) {
    return 'troubleshooting';
  }

  if (
    includesAny(normalized, [
      'pattern',
      'patterns',
      'trend',
      'trends',
      'most often',
      'highest',
      'lowest',
      'rate',
      'by day',
      'by month',
      'call records',
      'report',
      'count',
      'total',
    ])
  ) {
    return 'analytics';
  }

  if (
    includesAny(normalized, [
      'should we',
      'what should',
      'recommend',
      'recommendation',
      'best way',
      'next step',
      'next steps',
      'prioritize',
      'prioritise',
    ])
  ) {
    return 'recommendation';
  }

  if (/^(what|who|when|where|how|does|do|is|are|can)\b/.test(normalized)) {
    return 'factual_lookup';
  }

  if (normalized.length < 12) {
    return 'unclear';
  }

  return 'factual_lookup';
}

function getNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getRetrievalSettings(question: string): RetrievalSettings {
  const intent = classifyQueryIntent(question);
  const settings = INTENT_SETTINGS[intent];

  return {
    intent,
    ...settings,
    maxContextCharacters: getNumberEnv(
      'RAG_MAX_CONTEXT_CHARACTERS',
      settings.maxContextCharacters,
    ),
  };
}
