import {
  BarChart3,
  CircleHelp,
  FolderTree,
  MessageSquare,
  Quote,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  Users,
  type LucideIcon,
} from 'lucide-react';

import type { DocsGroupId } from '@/src/lib/docs';

export const DOC_ICONS: Record<string, LucideIcon> = {
  'getting-started/quickstart': Rocket,
  'using/asking-questions': MessageSquare,
  'using/answer-modes': SlidersHorizontal,
  'using/sources-and-citations': Quote,
  'using/collections': FolderTree,
  'admin/documents-and-uploads': Upload,
  'admin/users-and-roles': Users,
  'admin/analytics-and-evaluations': BarChart3,
  'security/data-handling': ShieldCheck,
  'troubleshooting/faq': CircleHelp,
};

export const GROUP_ICONS: Record<DocsGroupId, LucideIcon> = {
  'getting-started': Rocket,
  using: MessageSquare,
  admin: Upload,
  security: ShieldCheck,
  troubleshooting: CircleHelp,
};
