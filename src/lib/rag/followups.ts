import type { QueryIntent } from './intent';

export type FollowUpInput = {
  question: string;
  answer: string;
  intent: QueryIntent;
  filenames: string[];
  documentCategories?: string[];
  hasTableMetadata?: boolean;
  noAnswer: boolean;
};

function uniqueItems(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function cleanLabel(value: string) {
  return value
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sourceLabels(filenames: string[], categories: string[] = []) {
  const labels = uniqueItems([
    ...filenames.map(cleanLabel),
    ...categories.map(cleanLabel),
  ]);

  return labels.filter((label) => label.length >= 2).slice(0, 3);
}

function inferCategoryHints(categories: string[] = []) {
  const text = categories.join(' ').toLowerCase();

  return {
    hasSpreadsheet: text.includes('spreadsheet') || text.includes('financial report'),
    hasManual: text.includes('manual') || text.includes('technical guide'),
    hasPolicy: text.includes('policy') || text.includes('procedure'),
    hasPresentation: text.includes('presentation'),
  };
}

export function buildNoAnswerMessage(filenames: string[], categories: string[] = []) {
  const labels = sourceLabels(filenames, categories);
  const suggestion =
    labels.length > 0
      ? `Try naming one of the available sources (${labels.join(', ')}) or a broader topic covered by them.`
      : 'Try asking about a specific document, policy, process, or figure in the approved library.';

  return `I couldn't find support for that in the uploaded documents. I searched the most relevant approved documents for this workspace. ${suggestion}`;
}

export function generateFollowUps({
  intent,
  filenames,
  documentCategories = [],
  hasTableMetadata = false,
  noAnswer,
  answer,
}: FollowUpInput) {
  const categoryHints = inferCategoryHints(documentCategories);
  const labels = sourceLabels(filenames, documentCategories);
  const primaryLabel = labels[0];
  const answerText = answer.toLowerCase();
  const suggestions: string[] = [];

  if (noAnswer) {
    if (labels[0]) suggestions.push(`What does ${labels[0]} cover?`);
    if (labels[1]) suggestions.push(`What does ${labels[1]} cover?`);
    suggestions.push('Which approved documents are most relevant to this workspace?');
  }

  if (hasTableMetadata || categoryHints.hasSpreadsheet) {
    suggestions.push('Which status or category appears most often?');
    suggestions.push('What are the highest and lowest values in the retrieved rows?');
    suggestions.push('Can you summarize this by day?');
  }

  if (categoryHints.hasPolicy) {
    suggestions.push('What are the key requirements in this document?');
    suggestions.push('What exceptions or approvals are mentioned?');
  }

  if (categoryHints.hasManual) {
    suggestions.push('What setup steps are required?');
    suggestions.push('What troubleshooting steps does the guide recommend?');
  }

  if (categoryHints.hasPresentation) {
    suggestions.push('What are the main takeaways from this presentation?');
  }

  if (intent === 'summarization') {
    suggestions.push('What are the most important action items?');
    suggestions.push('Can you summarize this by section?');
  }

  if (intent === 'comparison' || intent === 'cross_document_reasoning') {
    suggestions.push('Which points are supported by both documents?');
    suggestions.push('Where do the documents discuss different topics?');
  }

  if (intent === 'analytics') {
    suggestions.push('What operational pattern stands out most?');
    suggestions.push('Which entries are highest or lowest?');
    suggestions.push('What caveats apply to this analysis?');
  }

  if (intent === 'recommendation' || intent === 'troubleshooting') {
    suggestions.push('What should we check first?');
    suggestions.push('What evidence supports the next step?');
  }

  if (answerText.includes('risk') || answerText.includes('issue')) {
    suggestions.push('What risks should we address first?');
  }

  if (answerText.includes('approve') || answerText.includes('approval')) {
    suggestions.push('Who approves this process?');
  }

  if (primaryLabel) {
    suggestions.push(`What else does ${primaryLabel} cover?`);
  }

  suggestions.push('Which section supports this answer?');

  return uniqueItems(suggestions).slice(0, 3);
}
