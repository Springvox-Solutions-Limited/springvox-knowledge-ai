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

type DiagnosticEvent = {
  id: string;
  event_type: string;
  severity: string;
  message: string;
  created_at: string;
  workspaces?: { name?: string; slug?: string } | null;
};

export default function PlatformDiagnosticsPage() {
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatformJson<{ events: DiagnosticEvent[] }>("/api/platform/diagnostics")
      .then((data) => setEvents(data.events || []))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Failed to load diagnostics"));
  }, []);

  return (
    <div className="admin-page">
      <PlatformPageHeader
        title="Diagnostics"
        subtitle="Recent beta safety events, ingestion failures, rate limits, and operational warnings."
      />

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <OverflowGuard mode="scroll">
        <AppCard className="overflow-hidden">
          <AppTable className="min-w-[920px]">
            <AppTableHeader>
              <AppTableRow>
                {["Time", "Severity", "Event", "Workspace", "Message"].map((column) => (
                  <AppTableHead key={column}>{column}</AppTableHead>
                ))}
              </AppTableRow>
            </AppTableHeader>
            <AppTableBody>
              {events.map((event) => (
                <AppTableRow key={event.id}>
                  <AppTableCell className="text-sm text-slate-600">{new Date(event.created_at).toLocaleString()}</AppTableCell>
                  <AppTableCell className="text-sm font-semibold capitalize text-slate-700">{event.severity}</AppTableCell>
                  <AppTableCell className="text-sm text-slate-600">{event.event_type}</AppTableCell>
                  <AppTableCell className="text-sm text-slate-600">{event.workspaces?.name || "Global"}</AppTableCell>
                  <AppTableCell className="max-w-xl text-sm text-slate-700">{event.message}</AppTableCell>
                </AppTableRow>
              ))}
              {events.length === 0 ? (
                <AppTableRow>
                  <AppTableCell colSpan={5} className="py-10 text-center text-sm text-slate-500">
                    No diagnostic events have been recorded yet.
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
