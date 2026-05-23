import type { QueryIntent } from './intent';

export type FollowUpInput = {
  question: string;
  answer: string;
  intent: QueryIntent;
  filenames: string[];
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
  noAnswer,
}: FollowUpInput) {
  const hints = inferDocumentHints(filenames);
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

  if (hints.hasCalls) {
    suggestions.push('Which call failure reason appears most often?');
    suggestions.push('What time period had the most call activity?');
    suggestions.push('Which entries need investigation first?');
  }

  if (hints.hasPolicy) {
    suggestions.push('What are the key requirements in this document?');
    suggestions.push('What should a new team member do first?');
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
  }

  if (intent === 'recommendation' || intent === 'troubleshooting') {
    suggestions.push('What should we check first?');
    suggestions.push('What evidence supports the next step?');
  }

  suggestions.push('Show me the sources for the answer.');

  return uniqueItems(suggestions).slice(0, 5);
}
