import 'server-only';

import { GoogleGenerativeAI } from '@google/generative-ai';

export const STRICT_NO_ANSWER = "I don't know based on the uploaded documents.";

export const GEMINI_CHAT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
export const GEMINI_EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'gemini-embedding-001';
export const GEMINI_EMBEDDING_DIMENSIONS = 3072;

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required for Gemini chat or embedding requests.');
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(apiKey);
  }

  return geminiClient;
}

export const SYSTEM_PROMPT = `You are Rekall-IQ.
Answer only from the provided document context.
Do not use outside knowledge or assumptions.
If the answer is not clearly contained in the context, say: "${STRICT_NO_ANSWER}"
Format answers in clean Markdown using short paragraphs, headings, bullet points, and numbered lists when useful.
Do not include inline citations after every sentence or list item.
Do not add a Sources section in the answer body.
The frontend will render citations separately.
Never invent facts beyond the provided context.`;

export async function embedManyWithGemini(texts: string[]) {
  const cleanedTexts = texts.map((text) => text.trim()).filter(Boolean);

  if (cleanedTexts.length !== texts.length) {
    throw new Error('Cannot embed empty text.');
  }

  const model = getGeminiClient().getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL });
  const embeddings = [];

  for (const text of cleanedTexts) {
    const result = await model.embedContent(text);
    const values = result.embedding.values;

    if (!values?.length) {
      throw new Error('Gemini embedding request returned no vector values.');
    }

    embeddings.push(values);
  }

  return embeddings;
}

export type AnswerMode = 'summary' | 'detailed' | 'executive' | 'technical';

export async function generateStrictAnswer(
  question: string,
  context: string,
  answerMode: AnswerMode = 'detailed',
  answerIntelligenceInstructions = '',
) {
  const model = getGeminiClient().getGenerativeModel({
    model: GEMINI_CHAT_MODEL,
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: buildStrictAnswerPrompt(question, context, answerMode, answerIntelligenceInstructions),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
    },
  });

  return result.response.text().trim();
}

export async function streamStrictAnswer(
  question: string,
  context: string,
  answerMode: AnswerMode = 'detailed',
  answerIntelligenceInstructions = '',
) {
  const model = getGeminiClient().getGenerativeModel({
    model: GEMINI_CHAT_MODEL,
    systemInstruction: SYSTEM_PROMPT,
  });

  return model.generateContentStream({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: buildStrictAnswerPrompt(question, context, answerMode, answerIntelligenceInstructions),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
    },
  });
}

export async function generateDocumentIntelligence({
  filename,
  text,
  parser,
}: {
  filename: string;
  text: string;
  parser?: string | null;
}) {
  const model = getGeminiClient().getGenerativeModel({
    model: GEMINI_CHAT_MODEL,
    systemInstruction:
      'You are a document analyst for an enterprise knowledge base. You classify and summarize uploaded business documents so staff can find them by meaning. Return only valid compact JSON.',
  });
  const clippedText = text.slice(0, 12000);
  const looksTabular =
    /\|\s*---|\bSheet:|\t.*\t/.test(clippedText) ||
    /\.(xlsx|xls|csv)$/i.test(filename) ||
    Boolean(parser && /xlsx|csv|sheet/i.test(parser));

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: [
              'Analyze this uploaded document for Rekall-IQ and return JSON only with keys: summary, keywords, category.',
              '',
              'summary: 2-4 sentences describing what the document is and what specific topics, entities, figures, or procedures it covers — enough that someone deciding whether it answers their question can tell from the summary alone. Do not start with "This document".',
              looksTabular
                ? 'This is a spreadsheet/table. In the summary, describe what the data represents: the sheets/tabs, the key columns, the time period or entities covered, and what questions the numbers could answer (e.g. totals, trends, per-item values). Mention notable column names.'
                : 'Capture the document\'s purpose and the most important named topics.',
              'keywords: 6-14 specific search terms a colleague might actually type — prefer concrete names, IDs, product/section names, and domain terms over generic words.',
              'category: exactly one of Manual, Policy, Procedure, Contract, Financial Report, Spreadsheet, Presentation, Technical Guide, Knowledge Base, Other.',
              '',
              `Filename: ${filename}`,
              `Parser: ${parser || 'unknown'}`,
              '',
              'Document text (may be truncated):',
              clippedText,
            ].join('\n'),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  });

  const raw = result.response.text().trim();
  const parsed = JSON.parse(raw) as {
    summary?: unknown;
    keywords?: unknown;
    category?: unknown;
  };

  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim().slice(0, 1200) : '';
  const keywords = Array.isArray(parsed.keywords)
    ? parsed.keywords.map((item) => String(item).trim()).filter(Boolean).slice(0, 12)
    : [];
  const category = normalizeDocumentCategory(String(parsed.category || 'Other'));

  return {
    summary,
    keywords,
    category,
  };
}

function normalizeDocumentCategory(category: string) {
  const allowed = new Set([
    'Manual',
    'Policy',
    'Procedure',
    'Contract',
    'Financial Report',
    'Spreadsheet',
    'Presentation',
    'Technical Guide',
    'Knowledge Base',
    'Other',
  ]);

  return allowed.has(category) ? category : 'Other';
}

function getAnswerModeInstructions(answerMode: AnswerMode) {
  if (answerMode === 'summary') {
    return [
      'Answer mode: Summary.',
      '- Use 3-5 bullets maximum.',
      '- Include only the most relevant details.',
      '- Avoid extra narrative.',
    ];
  }

  if (answerMode === 'executive') {
    return [
      'Answer mode: Executive.',
      '- Use business-focused language.',
      '- Highlight recommendations, risks, decisions, and next actions when supported.',
      '- Call out operational or commercial impact when the context supports it.',
      '- Avoid unnecessary technical detail.',
    ];
  }

  if (answerMode === 'technical') {
    return [
      'Answer mode: Technical.',
      '- Include procedural detail, implementation steps, exact values, model numbers, and references when supported.',
      '- Preserve technical terminology from the documents.',
      '- Include troubleshooting detail when the source supports it.',
      '- Be precise about limits and source support.',
    ];
  }

  return [
    'Answer mode: Detailed.',
    '- Give a balanced structured answer with useful figures and caveats when supported.',
    '- Use headings or bullets when helpful.',
  ];
}

function buildStrictAnswerPrompt(
  question: string,
  context: string,
  answerMode: AnswerMode,
  answerIntelligenceInstructions = '',
) {
  return [
    'You are Rekall-IQ.',
    '',
    'You answer only from the provided document context.',
    'Do not use outside knowledge.',
    `If the answer is not clearly contained in the context, return exactly:`,
    `"${STRICT_NO_ANSWER}"`,
    '',
    'When answering:',
    '- Use clear markdown formatting.',
    '- Use headings and bullet points where helpful.',
    '- Do not repeat citations after every sentence.',
    '- Do not invent products, names, numbers, or claims.',
    '- Keep the answer concise but complete.',
    '- The frontend will display source citations separately, so do not overload the answer with repeated inline citations.',
    '',
    ...getAnswerModeInstructions(answerMode),
    answerIntelligenceInstructions ? ['', answerIntelligenceInstructions].join('\n') : '',
    '',
    'Context:',
    context,
    '',
    'User question:',
    question,
  ].join('\n');
}
