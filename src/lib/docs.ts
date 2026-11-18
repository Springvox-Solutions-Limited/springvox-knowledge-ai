export type DocsGroupId =
  | 'getting-started'
  | 'using'
  | 'admin'
  | 'security'
  | 'troubleshooting';

export type DocsSectionMeta = {
  id: string;
  title: string;
};

export type DocsPage = {
  /** Path below /docs, without a leading slash. */
  slug: string;
  title: string;
  description: string;
  group: DocsGroupId;
  sections: DocsSectionMeta[];
  /** Extra terms the client-side search should match. */
  keywords: string[];
};

export type DocsGroup = {
  id: DocsGroupId;
  title: string;
  description: string;
};

export const DOCS_LAST_REVIEWED = 'November 2026';
export const DOCS_LAST_REVIEWED_ISO = '2026-11-18';

export const DOCS_GROUPS: DocsGroup[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    description: 'Set up a workspace and get from an empty account to a cited answer.',
  },
  {
    id: 'using',
    title: 'Asking questions',
    description: 'Ask well, choose an answer mode, and check the sources behind a reply.',
  },
  {
    id: 'admin',
    title: 'Admin',
    description: 'Manage documents, processing, people, access, and answer quality.',
  },
  {
    id: 'security',
    title: 'Security and data',
    description: 'How workspace isolation, providers, and deletion work.',
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Fix the problems people hit most often.',
  },
];

export const DOCS: DocsPage[] = [
  {
    slug: 'getting-started/quickstart',
    title: 'Quickstart',
    description:
      'Create a workspace, add the approved documents, invite your team, and get a first cited answer.',
    group: 'getting-started',
    sections: [
      { id: 'before-you-start', title: 'Before you start' },
      { id: 'create-workspace', title: 'Create or join a workspace' },
      { id: 'upload-documents', title: 'Upload the approved set' },
      { id: 'invite-team', title: 'Invite your team' },
      { id: 'ask-first-question', title: 'Ask your first question' },
      { id: 'read-citation', title: 'Read a citation' },
      { id: 'expected-result', title: 'What success looks like' },
      { id: 'if-something-fails', title: 'If something fails' },
      { id: 'next-steps', title: 'Next steps' },
    ],
    keywords: [
      'start',
      'setup',
      'onboarding',
      'register',
      'trial',
      'first question',
      'upload',
      'invite',
      'beta',
    ],
  },
  {
    slug: 'using/asking-questions',
    title: 'Asking questions',
    description:
      'Write a question that retrieves the right passages, read the answer, and refine it with follow-ups.',
    group: 'using',
    sections: [
      { id: 'where-to-ask', title: 'Where to ask' },
      { id: 'write-question', title: 'Write a question that works' },
      { id: 'send-and-shortcuts', title: 'Send, dictate, or stop' },
      { id: 'read-answer', title: 'Read the answer' },
      { id: 'follow-ups', title: 'Follow up and refine' },
      { id: 'confidence', title: 'Understand confidence' },
      { id: 'no-answer', title: 'When there is no answer' },
      { id: 'privacy', title: 'Chat history and privacy' },
      { id: 'troubleshooting', title: 'Troubleshooting' },
      { id: 'next-steps', title: 'Next steps' },
    ],
    keywords: [
      'chat',
      'question',
      'prompt',
      'follow up',
      'regenerate',
      'edit',
      'stop',
      'microphone',
      'dictate',
      'history',
      'private',
      'confidence',
      'no answer',
    ],
  },
  {
    slug: 'using/answer-modes',
    title: 'Answer modes',
    description:
      'Choose summary, detailed, executive, or technical output for the job in front of you.',
    group: 'using',
    sections: [
      { id: 'what-a-mode-changes', title: 'What an answer mode changes' },
      { id: 'summary', title: 'Summary' },
      { id: 'detailed', title: 'Detailed' },
      { id: 'executive', title: 'Executive' },
      { id: 'technical', title: 'Technical' },
      { id: 'choosing-a-mode', title: 'Choosing a mode' },
      { id: 'mode-and-scope', title: 'Mode is not scope' },
      { id: 'what-it-does-not-change', title: 'What a mode does not change' },
      { id: 'next-steps', title: 'Next steps' },
    ],
    keywords: [
      'summary',
      'detailed',
      'executive',
      'technical',
      'style',
      'answer format',
      'tone',
    ],
  },
  {
    slug: 'using/sources-and-citations',
    title: 'Sources and citations',
    description:
      'Open the document behind an answer, read the excerpt, and check the original before you act.',
    group: 'using',
    sections: [
      { id: 'what-a-citation-is', title: 'What a citation is' },
      { id: 'open-a-source', title: 'Open a source' },
      { id: 'read-the-excerpt', title: 'Read the excerpt' },
      { id: 'confidence-and-coverage', title: 'Confidence and coverage' },
      { id: 'check-before-acting', title: 'Check before acting' },
      { id: 'missing-citations', title: 'When citations are missing' },
      { id: 'send-feedback', title: 'Send feedback' },
      { id: 'next-steps', title: 'Next steps' },
    ],
    keywords: [
      'citation',
      'source',
      'reference',
      'original document',
      'preview',
      'excerpt',
      'trust',
      'verify',
      'feedback',
    ],
  },
  {
    slug: 'using/collections',
    title: 'Collections and scope',
    description:
      'Group documents by department and limit a question to one collection without changing who can ask.',
    group: 'using',
    sections: [
      { id: 'what-collections-are', title: 'What a collection is' },
      { id: 'default-collections', title: 'The default collections' },
      { id: 'assign-documents', title: 'Assign a document' },
      { id: 'scope-a-question', title: 'Scope a question' },
      { id: 'when-to-scope', title: 'When scope helps' },
      { id: 'keep-them-useful', title: 'Keep collections useful' },
      { id: 'not-a-permission-boundary', title: 'Collections are not permissions' },
      { id: 'next-steps', title: 'Next steps' },
    ],
    keywords: [
      'collection',
      'scope',
      'department',
      'hr',
      'finance',
      'legal',
      'operations',
      'all documents',
      'filter',
    ],
  },
  {
    slug: 'admin/documents-and-uploads',
    title: 'Documents and uploads',
    description:
      'Upload the approved set in bulk, understand processing, fix failures, and keep the library current.',
    group: 'admin',
    sections: [
      { id: 'before-you-upload', title: 'Before you upload' },
      { id: 'supported-formats', title: 'Supported formats and size' },
      { id: 'upload-files', title: 'Upload files' },
      { id: 'processing', title: 'What happens after upload' },
      { id: 'document-status', title: 'Read the document status' },
      { id: 'organize-with-collections', title: 'Organise with collections' },
      { id: 'replace-or-delete', title: 'Replace or delete a document' },
      { id: 'fix-a-failure', title: 'Fix a failed upload' },
      { id: 'what-to-upload', title: 'What to upload, and what not to' },
      { id: 'next-steps', title: 'Next steps' },
    ],
    keywords: [
      'upload',
      'documents',
      'pdf',
      'docx',
      'xlsx',
      'pptx',
      'csv',
      'txt',
      'processing',
      'failed',
      'reprocess',
      'delete',
      '20mb',
      'bulk',
    ],
  },
  {
    slug: 'admin/users-and-roles',
    title: 'Users and roles',
    description:
      'Invite teammates, choose the right role, manage pending invitations, and control access.',
    group: 'admin',
    sections: [
      { id: 'roles', title: 'The three roles' },
      { id: 'invite-a-teammate', title: 'Invite a teammate' },
      { id: 'accept-an-invite', title: 'Accept an invitation' },
      { id: 'manage-invitations', title: 'Manage invitations' },
      { id: 'change-a-role', title: 'Change a role' },
      { id: 'suspend-or-reactivate', title: 'Suspend or reactivate' },
      { id: 'admin-boundaries', title: 'Administrative boundaries' },
      { id: 'troubleshooting', title: 'Troubleshooting' },
      { id: 'next-steps', title: 'Next steps' },
    ],
    keywords: [
      'users',
      'roles',
      'invite',
      'invitation',
      'viewer',
      'workspace admin',
      'platform admin',
      'suspend',
      'reactivate',
      'access',
      'expiry',
    ],
  },
  {
    slug: 'admin/analytics-and-evaluations',
    title: 'Analytics, gaps, and evaluations',
    description:
      'Measure usage, work the unanswered-question list, and run repeatable retrieval checks.',
    group: 'admin',
    sections: [
      { id: 'analytics', title: 'Analytics' },
      { id: 'recent-questions', title: 'Recent questions' },
      { id: 'unanswered-questions', title: 'Unanswered questions' },
      { id: 'work-the-gap-list', title: 'Work the gap list' },
      { id: 'evaluations', title: 'Evaluations' },
      { id: 'create-a-set', title: 'Create an evaluation set' },
      { id: 'golden-questions', title: 'Write golden questions' },
      { id: 'run-and-read-results', title: 'Run and read results' },
      { id: 'settings-and-limits', title: 'Settings and workspace limits' },
      { id: 'weekly-rhythm', title: 'A weekly rhythm' },
      { id: 'next-steps', title: 'Next steps' },
    ],
    keywords: [
      'analytics',
      'coverage',
      'unanswered',
      'knowledge gaps',
      'evaluations',
      'golden questions',
      'regression',
      'feedback',
      'settings',
      'limits',
    ],
  },
  {
    slug: 'security/data-handling',
    title: 'Security and data handling',
    description:
      'How workspaces stay isolated, which providers process data, how deletion works, and what is not claimed.',
    group: 'security',
    sections: [
      { id: 'workspace-isolation', title: 'Workspace isolation' },
      { id: 'access-boundaries', title: 'Access boundaries' },
      { id: 'data-flow', title: 'What moves, and where' },
      { id: 'providers', title: 'Providers' },
      { id: 'retention-and-deletion', title: 'Retention and deletion' },
      { id: 'what-is-not-claimed', title: 'What is not claimed' },
      { id: 'planned-work', title: 'Planned work' },
      { id: 'admin-checklist', title: 'Admin checklist' },
      { id: 'report-a-vulnerability', title: 'Report a vulnerability' },
      { id: 'next-steps', title: 'Next steps' },
    ],
    keywords: [
      'security',
      'data handling',
      'privacy',
      'workspace isolation',
      'rls',
      'subprocessors',
      'retention',
      'deletion',
      'gdpr',
      'ndpa',
      'vulnerability',
      'soc 2',
    ],
  },
  {
    slug: 'troubleshooting/faq',
    title: 'FAQ and troubleshooting',
    description:
      'Short answers for access, uploads, citations, privacy, beta limits, and the problems that stop work.',
    group: 'troubleshooting',
    sections: [
      { id: 'account-and-access', title: 'Account and access' },
      { id: 'documents-and-processing', title: 'Documents and processing' },
      { id: 'asking-and-answers', title: 'Asking and answers' },
      { id: 'privacy-and-permissions', title: 'Privacy and permissions' },
      { id: 'beta-limits', title: 'Beta limits' },
      { id: 'troubleshooting', title: 'Common fixes' },
      { id: 'contact', title: 'Talk to us' },
      { id: 'next-steps', title: 'Keep going' },
    ],
    keywords: [
      'faq',
      'help',
      'fix',
      'problem',
      'error',
      'rate limit',
      '429',
      'password',
      'invite expired',
      'upload failed',
      'no answer',
      'sso',
      'connectors',
      'ocr',
    ],
  },
];

const GROUP_BY_ID = new Map(DOCS_GROUPS.map((group) => [group.id, group]));
const DOC_INDEX = new Map(DOCS.map((doc, index) => [doc.slug, index]));

export function getDocsGroup(id: DocsGroupId): DocsGroup {
  return GROUP_BY_ID.get(id) ?? DOCS_GROUPS[0];
}

export function getDocsPage(slug: string): DocsPage | undefined {
  return DOCS.find((doc) => doc.slug === slug);
}

export function getDocsHref(doc: Pick<DocsPage, 'slug'>): string {
  return `/docs/${doc.slug}`;
}

export function getDocsLabel(doc: DocsPage): string {
  return doc.title;
}

export const DOCS_BY_GROUP = DOCS_GROUPS.map((group) => ({
  group,
  docs: DOCS.filter((doc) => doc.group === group.id),
}));

export function getAdjacentDocs(slug: string): {
  previous: DocsPage | null;
  next: DocsPage | null;
} {
  const index = DOC_INDEX.get(slug);
  if (index === undefined) {
    return { previous: null, next: null };
  }

  return {
    previous: index > 0 ? DOCS[index - 1] : null,
    next: index < DOCS.length - 1 ? DOCS[index + 1] : null,
  };
}

export type DocsSearchHit = {
  doc: DocsPage;
  section?: DocsSectionMeta;
  score: number;
};

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s/-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Client-side documentation search. It scores titles above section headings,
 * descriptions, and keywords, then returns the most relevant section link.
 */
export function searchDocs(query: string, limit = 8): DocsSearchHit[] {
  const normalisedQuery = normalise(query);
  if (!normalisedQuery) return [];

  const tokens = normalisedQuery.split(' ').filter(Boolean);

  const hits: DocsSearchHit[] = [];

  for (const doc of DOCS) {
    const group = getDocsGroup(doc.group);
    const title = normalise(doc.title);
    const description = normalise(doc.description);
    const groupTitle = normalise(group.title);
    const keywords = doc.keywords.map(normalise);
    const sections = doc.sections.map((section) => ({
      section,
      text: normalise(section.title),
    }));

    const haystack = [
      title,
      description,
      groupTitle,
      keywords.join(' '),
      sections.map((entry) => entry.text).join(' '),
    ].join(' ');

    const everyTokenMatches = tokens.every((token) => haystack.includes(token));
    if (!everyTokenMatches) continue;

    let score = 0;

    if (title === normalisedQuery) score += 140;
    else if (title.includes(normalisedQuery)) score += 90;
    else if (tokens.every((token) => title.includes(token))) score += 55;

    if (description.includes(normalisedQuery)) score += 28;
    else if (tokens.every((token) => description.includes(token))) score += 14;

    if (groupTitle.includes(normalisedQuery)) score += 12;

    for (const keyword of keywords) {
      if (keyword === normalisedQuery) score += 36;
      else if (keyword.includes(normalisedQuery)) score += 16;
    }

    let bestSection: DocsSectionMeta | undefined;
    let bestSectionScore = 0;

    for (const entry of sections) {
      let sectionScore = 0;

      if (entry.text === normalisedQuery) sectionScore += 80;
      else if (entry.text.includes(normalisedQuery)) sectionScore += 48;
      else if (tokens.every((token) => entry.text.includes(token))) sectionScore += 26;

      if (sectionScore > bestSectionScore) {
        bestSectionScore = sectionScore;
        bestSection = entry.section;
      }

      score += sectionScore;
    }

    // A title or keyword match is useful even when no heading matches.
    hits.push({ doc, section: bestSection, score });
  }

  return hits
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return (DOC_INDEX.get(left.doc.slug) ?? 0) - (DOC_INDEX.get(right.doc.slug) ?? 0);
    })
    .slice(0, limit);
}
