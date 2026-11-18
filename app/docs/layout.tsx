import type { ReactNode } from 'react';

import { SiteShell } from '@/src/components/marketing/SiteShell';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
