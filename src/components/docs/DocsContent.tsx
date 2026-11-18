import type { ReactNode } from 'react';

import { QuickstartContent } from './content/quickstart';
import { AskingQuestionsContent } from './content/asking-questions';
import { AnswerModesContent } from './content/answer-modes';
import { SourcesAndCitationsContent } from './content/sources-and-citations';
import { CollectionsContent } from './content/collections';
import { DocumentsAndUploadsContent } from './content/documents-and-uploads';
import { UsersAndRolesContent } from './content/users-and-roles';
import { AnalyticsAndEvaluationsContent } from './content/analytics-and-evaluations';
import { DataHandlingContent } from './content/data-handling';
import { FaqContent } from './content/faq';

const CONTENT: Record<string, () => ReactNode> = {
  'getting-started/quickstart': QuickstartContent,
  'using/asking-questions': AskingQuestionsContent,
  'using/answer-modes': AnswerModesContent,
  'using/sources-and-citations': SourcesAndCitationsContent,
  'using/collections': CollectionsContent,
  'admin/documents-and-uploads': DocumentsAndUploadsContent,
  'admin/users-and-roles': UsersAndRolesContent,
  'admin/analytics-and-evaluations': AnalyticsAndEvaluationsContent,
  'security/data-handling': DataHandlingContent,
  'troubleshooting/faq': FaqContent,
};

export function DocsContent({ slug }: { slug: string }) {
  const Content = CONTENT[slug];
  return Content ? <Content /> : null;
}
