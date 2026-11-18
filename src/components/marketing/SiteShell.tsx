import type { ReactNode } from "react";

import { AnnouncementBar } from "./AnnouncementBar";
import { MarketingMotion } from "./MarketingMotion";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { cn } from "@/src/lib/utils";

export function SiteShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("site-surface flex min-h-screen flex-col overflow-x-clip", className)}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-[8px] focus:bg-[var(--ink)] focus:px-4 focus:py-2 focus:text-[var(--canvas)]"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main" className="flex-1">
        <MarketingMotion>{children}</MarketingMotion>
      </main>
      <SiteFooter />
    </div>
  );
}
