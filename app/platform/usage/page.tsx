"use client";

import { useEffect, useState } from "react";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import { AppCard } from "@/src/components/ui/app-card";
import {
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
} from "@/src/components/ui/app-table";
import { OverflowGuard } from "@/src/components/layout/OverflowGuard";
import { fetchPlatformJson } from "@/src/lib/platform-client";

type UsageRow = {
  workspace_id: string;
  workspace_name: string;
  slug: string;
  questions_today: number;
  questions_month: number;
  uploads_today: number;
  uploads_month: number;
  documents_count: number;
  storage_bytes: number;
  embedding_calls: number;
  rerank_calls: number;
  llm_calls: number;
};

export default function PlatformUsagePage() {
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatformJson<{ usage: UsageRow[] }>("/api/platform/usage")
      .then((data) => setUsage(data.usage || []))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Failed to load usage"));
  }, []);

  return (
    <div className="admin-page">
      <PlatformPageHeader
        title="Usage"
        subtitle="Beta usage metering for future billing, support, and capacity planning."
      />

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <OverflowGuard mode="scroll">
        <AppCard className="overflow-hidden">
          <AppTable className="min-w-[980px]">
            <AppTableHeader>
              <AppTableRow>
                {["Workspace", "Questions", "Uploads", "Documents", "Storage", "AI calls"].map((column) => (
                  <AppTableHead key={column}>{column}</AppTableHead>
                ))}
              </AppTableRow>
            </AppTableHeader>
            <AppTableBody>
              {usage.map((row) => (
                <AppTableRow key={row.workspace_id}>
                  <AppTableCell>
                    <p className="font-semibold text-slate-950">{row.workspace_name}</p>
                    <p className="text-xs text-slate-500">{row.slug}</p>
                  </AppTableCell>
                  <AppTableCell>{row.questions_today} today · {row.questions_month} month</AppTableCell>
                  <AppTableCell>{row.uploads_today} today · {row.uploads_month} month</AppTableCell>
                  <AppTableCell>{row.documents_count}</AppTableCell>
                  <AppTableCell>{formatBytes(row.storage_bytes)}</AppTableCell>
                  <AppTableCell>
                    <p>{row.llm_calls} LLM</p>
                    <p className="text-xs text-slate-500">{row.embedding_calls} embedding · {row.rerank_calls} rerank</p>
                  </AppTableCell>
                </AppTableRow>
              ))}
              {usage.length === 0 ? (
                <AppTableRow>
                  <AppTableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                    No usage has been recorded yet.
                  </AppTableCell>
                </AppTableRow>
              ) : null}
            </AppTableBody>
          </AppTable>
        </AppCard>
      </OverflowGuard>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
