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

export const SYSTEM_PROMPT = `You are SpringVox Knowledge AI.
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

export async function generateStrictAnswer(question: string, context: string) {
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
            text: buildStrictAnswerPrompt(question, context),
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

export async function streamStrictAnswer(question: string, context: string) {
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
            text: buildStrictAnswerPrompt(question, context),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
    },
  });
}

function buildStrictAnswerPrompt(question: string, context: string) {
  return [
    'You are SpringVox Knowledge AI.',
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
    'Context:',
    context,
    '',
    'User question:',
    question,
  ].join('\n');
}
