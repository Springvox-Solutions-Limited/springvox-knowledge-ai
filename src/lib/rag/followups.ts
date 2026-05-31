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

function inferDocumentHints(filenames: string[]) {
  const text = filenames.join(' ').toLowerCase();

  return {
    hasCisco: text.includes('cisco') || text.includes('phone') || text.includes('7800'),
    hasCalls:
      text.includes('call') ||
      text.includes('record') ||
      text.includes('report') ||
      text.includes('xlsx') ||
      text.includes('csv'),
    hasPolicy:
      text.includes('policy') ||
      text.includes('handbook') ||
      text.includes('onboarding') ||
      text.includes('guide'),
  };
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

export function buildNoAnswerMessage(filenames: string[]) {
  const hints = inferDocumentHints(filenames);
  const topics = [
    hints.hasCisco ? 'Cisco phone setup and call handling features' : '',
    hints.hasCalls ? 'call record patterns and failure reasons' : '',
    hints.hasPolicy ? 'approved policy or handbook details' : '',
  ].filter(Boolean);

  const suggestion =
    topics.length > 0
      ? `Try asking about ${topics.join(', ')}.`
      : 'Try asking about the uploaded documents, specific file names, or the exact topic you want to find.';

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
  const hints = inferDocumentHints(filenames);
  const categoryHints = inferCategoryHints(documentCategories);
  const answerText = answer.toLowerCase();
  const suggestions: string[] = [];

  if (noAnswer) {
    suggestions.push('What topics are covered in the uploaded documents?');
    suggestions.push('Which document is most relevant to this question?');
  }

  if (hints.hasCisco) {
    suggestions.push('How do I transfer a call?');
    suggestions.push('What should I do if the phone loses connectivity?');
    suggestions.push('What call handling features are available?');
  }

  if (hints.hasCalls || categoryHints.hasSpreadsheet || hasTableMetadata) {
    suggestions.push('Which call failure reason appears most often?');
    suggestions.push('What time period had the most call activity?');
    suggestions.push('Which entries need investigation first?');
    suggestions.push('Which status or category appears most often?');
    suggestions.push('What are the highest and lowest values in the retrieved rows?');
  }

  if (hints.hasPolicy || categoryHints.hasPolicy) {
    suggestions.push('What are the key requirements in this document?');
    suggestions.push('What should a new team member do first?');
    suggestions.push('What exceptions or approvals are mentioned?');
  }

  if (categoryHints.hasManual) {
    suggestions.push('What setup steps are required?');
    suggestions.push('What troubleshooting steps does the guide recommend?');
  }

  if (categoryHints.hasPresentation) {
    suggestions.push('What are the main takeaways from this presentation?');
    suggestions.push('What decisions or actions does it support?');
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
    suggestions.push('Can you summarize this by day?');
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

  if (answerText.includes('trend') || answerText.includes('highest')) {
    suggestions.push('Show trends over time.');
  }

  suggestions.push('Show me the sources for the answer.');

  return uniqueItems(suggestions).slice(0, 3);
}
