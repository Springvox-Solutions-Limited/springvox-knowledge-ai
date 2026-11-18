import type { AnswerConfidence } from './confidence';
import type { QueryIntent } from './intent';

export type AnswerMode = 'summary' | 'detailed' | 'executive' | 'technical';

export type AnswerIntelligenceInput = {
  intent: QueryIntent;
  answerMode: AnswerMode;
  confidence: AnswerConfidence;
  documentCategories: string[];
  sourceTypes: string[];
  hasTableMetadata: boolean;
};

function uniqueLower(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function hasAny(values: string[], targets: string[]) {
  const normalized = uniqueLower(values).map((value) => value.toLowerCase());
  return targets.some((target) => normalized.includes(target.toLowerCase()));
}

function isReportLike(input: AnswerIntelligenceInput) {
  return (
    input.hasTableMetadata ||
    input.intent === 'analytics' ||
    hasAny(input.documentCategories, ['Spreadsheet', 'Financial Report', 'Presentation']) ||
    input.sourceTypes.some((type) => ['xlsx', 'csv'].includes(type.toLowerCase()))
  );
}

function isTechnicalLike(input: AnswerIntelligenceInput) {
  return (
    input.intent === 'troubleshooting' ||
    hasAny(input.documentCategories, ['Manual', 'Procedure', 'Technical Guide', 'Knowledge Base'])
  );
}

function getModeRules(answerMode: AnswerMode) {
  if (answerMode === 'summary') {
    return [
      'Answer mode rules:',
      '- Use 3-5 bullets maximum.',
      '- Avoid long explanations unless the question cannot be answered safely without them.',
      '- Include caveats only when they materially affect the answer.',
    ];
  }

  if (answerMode === 'executive') {
    return [
      'Answer mode rules:',
      '- Lead with business impact, risks, decisions, and recommended actions when supported.',
      '- Avoid implementation-level detail unless it changes the decision.',
      '- Use concise headings that a manager can scan quickly.',
    ];
  }

  if (answerMode === 'technical') {
    return [
      'Answer mode rules:',
      '- Include procedural detail, exact labels, model numbers, table fields, and troubleshooting steps when supported.',
      '- Preserve technical terms from the documents.',
      '- Clearly separate supported steps from caveats.',
    ];
  }

  return [
    'Answer mode rules:',
    '- Give a balanced structured answer.',
    '- Include important figures, caveats, and source-supported reasoning.',
    '- Prefer short sections over a wall of text.',
  ];
}

export function buildAnswerIntelligenceInstructions(input: AnswerIntelligenceInput) {
  const sections: string[] = [
    'Answer intelligence rules:',
    `- Query intent: ${input.intent}.`,
    `- Preliminary confidence: ${input.confidence}.`,
    '- Choose the structure that best fits the question and retrieved source types.',
    '- Do not claim totals, rankings, causation, trends, or recommendations unless the provided excerpts support them.',
    '- If sources are unrelated, answer them separately or say a direct relationship is not supported.',
    '',
    ...getModeRules(input.answerMode),
  ];

  if (isReportLike(input)) {
    sections.push(
      '',
      'For spreadsheets, reports, financial data, and table-heavy sources:',
      '- Prefer these headings when useful: Executive Summary, Key Findings, Important Numbers, Risks / Issues, Recommendations, Caveats / Missing Data.',
      '- Use column names, row relationships, statuses, counts, dates, top/bottom values, and anomalies when the excerpts contain enough evidence.',
      '- If only partial rows are retrieved, say the answer is based on the retrieved excerpts and avoid whole-file totals.',
      '- For analytical questions, distinguish observed patterns from conclusions that would require more data.',
    );
  } else if (isTechnicalLike(input)) {
    sections.push(
      '',
      'For manuals, procedures, technical guides, and support knowledge:',
      '- Prefer these headings when useful: Direct Answer, Steps / Explanation, Relevant Notes, Caveats, Suggested Follow-ups.',
      '- Give practical steps only when the document context contains them.',
      '- Preserve warnings, prerequisites, model names, and limits from the source text.',
    );
  }

  if (input.confidence === 'low') {
    sections.push(
      '',
      'Low confidence handling:',
      '- Include a brief "Confidence note" explaining that the retrieved excerpts only partially support the answer.',
      '- Include "What is missing" if the answer depends on unavailable rows, sections, dates, policies, or reports.',
      '- Suggest the next document or report that would make the answer safer.',
      '- Ask better follow-up questions rather than guessing.',
    );
  }

  return sections.join('\n');
}
