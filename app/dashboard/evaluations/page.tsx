"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Loader2, Play, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAccessToken } from "@/src/lib/auth-client";
import { AppButton } from "@/src/components/ui/app-button";
import { AppPageHeader } from "@/src/components/shared/AppPageHeader";
import { EmptyState } from "@/src/components/ui/empty-state";
import { cn } from "@/src/lib/utils";

type EvalRun = {
  id: string;
  status: string;
  passed_questions: number;
  total_questions: number;
  average_latency_ms: number | null;
  created_at: string;
};

type EvalSet = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  rag_eval_questions?: Array<{
    id: string;
    question: string;
    expected_keywords?: string[] | null;
    expected_document_names?: string[] | null;
  }>;
  rag_eval_runs?: EvalRun[];
};

function sortRuns(runs?: EvalRun[]) {
  return [...(runs ?? [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function passRateFor(run: EvalRun) {
  if (!run.total_questions) return null;
  return Math.round((run.passed_questions / run.total_questions) * 100);
}

function runDot(run: EvalRun | undefined) {
  if (!run) return "bg-[var(--ink-muted)]";
  if (run.status === "failed") return "bg-red-400";
  if (run.status !== "completed") return "bg-[var(--ink-muted)]";
  const rate = passRateFor(run);
  return rate !== null && rate >= 80 ? "bg-emerald-400" : "bg-amber-400";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRunDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function EvaluationsPage() {
  const [evalSets, setEvalSets] = useState<EvalSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  // Create set form
  const [setName, setSetName] = useState("");
  const [creatingSet, setCreatingSet] = useState(false);
  const [showCreateSet, setShowCreateSet] = useState(false);

  // Add question form
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [keywords, setKeywords] = useState("");
  const [documentNames, setDocumentNames] = useState("");
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const api = async (path: string, init?: RequestInit) => {
    const token = await getAccessToken();
    if (!token) throw new Error("Authentication session expired.");
    const response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Request failed");
    return data;
  };

  const load = async () => {
    try {
      setError(null);
      const data = await api("/api/evaluations");
      const nextSets: EvalSet[] = data.evalSets ?? [];
      setEvalSets(nextSets);
      setSelectedSetId((current) =>
        current && nextSets.some((set) => set.id === current)
          ? current
          : (nextSets[0]?.id ?? null),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load evaluations",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void load();
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createSet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setCreatingSet(true);
      await api("/api/evaluations", {
        method: "POST",
        body: JSON.stringify({ name: setName }),
      });
      setSetName("");
      setShowCreateSet(false);
      toast.success("Evaluation set created.");
      await load();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to create evaluation set",
      );
    } finally {
      setCreatingSet(false);
    }
  };

  const addQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSetId) return;
    try {
      setAddingQuestion(true);
      await api(`/api/evaluations/${selectedSetId}/questions`, {
        method: "POST",
        body: JSON.stringify({
          question: questionText,
          expectedKeywords: splitCsv(keywords),
          expectedDocumentNames: splitCsv(documentNames),
        }),
      });
      setQuestionText("");
      setKeywords("");
      setDocumentNames("");
      setShowAddQuestion(false);
      toast.success("Golden question added.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add question");
    } finally {
      setAddingQuestion(false);
    }
  };

  const runEval = async (id: string) => {
    try {
      setRunningId(id);
      const result = await api(`/api/evaluations/${id}/run`, { method: "POST" });
      toast.success(
        `Evaluation complete: ${result.passed}/${result.total} checks passed.`,
      );
      await load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Evaluation run failed",
      );
    } finally {
      setRunningId(null);
    }
  };

  const selectedSet =
    evalSets.find((set) => set.id === selectedSetId) ?? null;
  const selectedRuns = sortRuns(selectedSet?.rag_eval_runs);
  const latestRun = selectedRuns[0];
  const selectedQuestionCount = selectedSet?.rag_eval_questions?.length ?? 0;
  const selectedPassRate = latestRun ? passRateFor(latestRun) : null;
  const selectedLatency = latestRun?.average_latency_ms ?? null;

  const metrics = [
    { label: "Questions", value: String(selectedQuestionCount) },
    {
      label: "Latest run",
      value: latestRun
        ? `${latestRun.passed_questions}/${latestRun.total_questions}`
        : "—",
    },
    {
      label: "Pass rate",
      value: selectedPassRate !== null ? `${selectedPassRate}%` : "—",
    },
    {
      label: "Avg latency",
      value: selectedLatency !== null ? `${selectedLatency} ms` : "—",
    },
  ];

  return (
    <div className="admin-page">
      <AppPageHeader
        title="Evaluations"
        subtitle="Create golden questions and run deterministic retrieval checks before answer quality issues reach your team."
        aside={
          <AppButton
            type="button"
            onClick={() => setShowCreateSet(true)}
            className="h-9 shrink-0 rounded-md px-3 text-[13px]"
          >
            <Plus size={15} />
            New eval set
          </AppButton>
        }
      />

      {error && (
        <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[12px] text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <div className="h-56 animate-pulse rounded-[10px] border border-[var(--line)] bg-[var(--surface)]" />
          <div className="h-56 animate-pulse rounded-[10px] border border-[var(--line)] bg-[var(--surface)]" />
        </div>
      ) : evalSets.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No evaluation sets yet"
          description="Create your first evaluation set to start testing answer quality against golden questions."
          className="rounded-[10px]"
          action={
            <AppButton
              type="button"
              tone="secondary"
              onClick={() => setShowCreateSet(true)}
              className="h-9 rounded-md px-3 text-[13px]"
            >
              <Plus size={15} />
              Create first eval set
            </AppButton>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
              <p className="text-[14px] font-medium text-[var(--ink)]">
                Evaluation sets
              </p>
              <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
                {evalSets.length}
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto lg:max-h-[34rem]">
              {evalSets.map((set) => {
                const runs = sortRuns(set.rag_eval_runs);
                const latest = runs[0];
                const rate = latest ? passRateFor(latest) : null;
                const questionCount = set.rag_eval_questions?.length ?? 0;
                const isSelected = set.id === selectedSetId;

                return (
                  <button
                    key={set.id}
                    type="button"
                    aria-current={isSelected ? "true" : undefined}
                    onClick={() => setSelectedSetId(set.id)}
                    className={cn(
                      "flex w-full flex-col border-b border-[var(--line-soft)] px-3 py-2.5 text-left transition-colors last:border-b-0",
                      isSelected
                        ? "bg-[var(--accent-jade-50)]"
                        : "hover:bg-[var(--canvas-soft)]",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          runDot(latest),
                        )}
                      />
                      <span
                        className={cn(
                          "truncate text-[13px]",
                          isSelected
                            ? "font-medium text-[var(--ink)]"
                            : "text-[var(--ink-soft)]",
                        )}
                      >
                        {set.name}
                      </span>
                    </span>
                    <span className="mt-0.5 flex min-w-0 items-center gap-1.5 pl-3 text-[11px] text-[var(--ink-muted)]">
                      <span>
                        {questionCount}{" "}
                        {questionCount === 1 ? "question" : "questions"}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">
                        {latest
                          ? rate !== null
                            ? `${rate}% passed`
                            : statusLabel(latest.status)
                          : "No runs"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
            {selectedSet ? (
              <>
                <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-[14px] font-semibold text-[var(--ink)]">
                      {selectedSet.name}
                    </h2>
                    <p className="mt-0.5 line-clamp-2 text-[12px] text-[var(--ink-soft)]">
                      {selectedSet.description || "No description"}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                      Created {formatDate(selectedSet.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <AppButton
                      type="button"
                      tone="secondary"
                      onClick={() => setShowAddQuestion(true)}
                      className="h-8 rounded-md px-2.5 text-[12px]"
                    >
                      <Plus size={13} />
                      Add question
                    </AppButton>
                    <AppButton
                      type="button"
                      tone="subtle"
                      onClick={() => runEval(selectedSet.id)}
                      disabled={
                        runningId === selectedSet.id ||
                        selectedQuestionCount === 0
                      }
                      className="h-8 rounded-md px-2.5 text-[12px]"
                    >
                      {runningId === selectedSet.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Play size={13} />
                      )}
                      {runningId === selectedSet.id
                        ? "Running..."
                        : "Run evaluation"}
                    </AppButton>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px border-b border-[var(--line)] bg-[var(--line-soft)] sm:grid-cols-4">
                  {metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="bg-[var(--surface)] px-3 py-2.5"
                    >
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        {metric.label}
                      </p>
                      <p className="mt-0.5 text-[14px] font-medium tabular-nums text-[var(--ink)]">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-b border-[var(--line)] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-[14px] font-medium text-[var(--ink)]">Golden questions</h3>
                    <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
                      {selectedQuestionCount} {selectedQuestionCount === 1 ? "question" : "questions"}
                    </span>
                  </div>
                  {selectedQuestionCount === 0 ? (
                    <p className="rounded-md border border-dashed border-[var(--line)] px-3 py-6 text-center text-[12px] text-[var(--ink-muted)]">
                      No questions yet. Add a golden question to define expected coverage.
                    </p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto rounded-md border border-[var(--line)]">
                      <table className="w-full min-w-[32rem] text-left">
                        <thead className="sticky top-0 bg-[var(--canvas-soft)]">
                          <tr className="border-b border-[var(--line)]">
                            <th className="px-3 py-1.5 text-[11px] font-medium text-[var(--ink-muted)]">#</th>
                            <th className="px-3 py-1.5 text-[11px] font-medium text-[var(--ink-muted)]">Question</th>
                            <th className="px-3 py-1.5 text-[11px] font-medium text-[var(--ink-muted)]">Expected coverage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedSet.rag_eval_questions ?? []).map((question, index) => (
                            <tr key={question.id} className="border-b border-[var(--line-soft)] last:border-b-0">
                              <td className="px-3 py-2 text-[11px] tabular-nums text-[var(--ink-muted)]">{index + 1}</td>
                              <td className="px-3 py-2 text-[12px] text-[var(--ink)]">{question.question}</td>
                              <td className="px-3 py-2 text-[11px] text-[var(--ink-muted)]">
                                {[...(question.expected_document_names || []), ...(question.expected_keywords || [])].slice(0, 3).join(", ") || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[14px] font-medium text-[var(--ink)]">
                      Run history
                    </h3>
                    <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
                      {selectedRuns.length}{" "}
                      {selectedRuns.length === 1 ? "run" : "runs"}
                    </span>
                  </div>

                  {selectedRuns.length === 0 ? (
                    <p className="rounded-md border border-dashed border-[var(--line)] px-3 py-6 text-center text-[12px] text-[var(--ink-muted)]">
                      No runs yet. Run the set to record a result.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-[var(--line)]">
                      <table className="w-full min-w-[30rem] text-left">
                        <thead>
                          <tr className="border-b border-[var(--line)] bg-[var(--canvas-soft)]">
                            <th className="px-3 py-1.5 text-[11px] font-medium text-[var(--ink-muted)]">
                              Run
                            </th>
                            <th className="px-3 py-1.5 text-[11px] font-medium text-[var(--ink-muted)]">
                              Status
                            </th>
                            <th className="px-3 py-1.5 text-[11px] font-medium text-[var(--ink-muted)]">
                              Passed
                            </th>
                            <th className="px-3 py-1.5 text-[11px] font-medium text-[var(--ink-muted)]">
                              Latency
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRuns.map((run) => {
                            const rate = passRateFor(run);
                            return (
                              <tr
                                key={run.id}
                                className="border-b border-[var(--line-soft)] last:border-b-0"
                              >
                                <td className="whitespace-nowrap px-3 py-2 text-[11px] tabular-nums text-[var(--ink-muted)]">
                                  {formatRunDate(run.created_at)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2">
                                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ink-soft)]">
                                    <span
                                      aria-hidden="true"
                                      className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        runDot(run),
                                      )}
                                    />
                                    {statusLabel(run.status)}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-[12px] tabular-nums text-[var(--ink-soft)]">
                                  {run.passed_questions}/{run.total_questions}
                                  {rate !== null ? (
                                    <span className="ml-1 text-[var(--ink-muted)]">
                                      ({rate}%)
                                    </span>
                                  ) : null}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-[11px] tabular-nums text-[var(--ink-muted)]">
                                  {run.average_latency_ms !== null &&
                                  run.average_latency_ms !== undefined
                                    ? `${run.average_latency_ms} ms`
                                    : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="px-4 py-16 text-center text-[12px] text-[var(--ink-muted)]">
                Select an evaluation set to see its runs.
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog
        open={showCreateSet}
        onOpenChange={(open) => {
          if (!creatingSet) setShowCreateSet(open);
        }}
      >
        <DialogContent
          showCloseButton={!creatingSet}
          onEscapeKeyDown={(event) => {
            if (creatingSet) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (creatingSet) event.preventDefault();
          }}
          className="rounded-[10px] border-[var(--line)] bg-[var(--surface)] p-0 sm:max-w-md"
        >
          <div className="p-5">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-[15px] font-semibold text-[var(--ink)]">
                New evaluation set
              </DialogTitle>
              <DialogDescription className="text-[12px] text-[var(--ink-muted)]">
                Group the golden questions that check answer quality.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createSet} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="eval-set-name"
                  className="text-[11px] font-medium text-[var(--ink-muted)]"
                >
                  Set name
                </label>
                <Input
                  id="eval-set-name"
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  placeholder="e.g. Cisco manual quality checks"
                  className="h-9 rounded-md border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 text-[13px] shadow-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <AppButton
                  type="button"
                  tone="ghost"
                  disabled={creatingSet}
                  onClick={() => setShowCreateSet(false)}
                  className="h-9 rounded-md px-3 text-[13px]"
                >
                  Cancel
                </AppButton>
                <AppButton
                  type="submit"
                  disabled={!setName.trim() || creatingSet}
                  className="h-9 rounded-md px-3 text-[13px]"
                >
                  {creatingSet ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  Create set
                </AppButton>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showAddQuestion}
        onOpenChange={(open) => {
          if (!addingQuestion) setShowAddQuestion(open);
        }}
      >
        <DialogContent
          showCloseButton={!addingQuestion}
          onEscapeKeyDown={(event) => {
            if (addingQuestion) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (addingQuestion) event.preventDefault();
          }}
          className="rounded-[10px] border-[var(--line)] bg-[var(--surface)] p-0 sm:max-w-lg"
        >
          <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-[15px] font-semibold text-[var(--ink)]">
                Add golden question
              </DialogTitle>
              <DialogDescription className="text-[12px] text-[var(--ink-muted)]">
                A run checks whether retrieval returns the expected documents and
                keywords.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={addQuestion} className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="eval-question"
                  className="text-[11px] font-medium text-[var(--ink-muted)]"
                >
                  Question
                </label>
                <Input
                  id="eval-question"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="How do I transfer a call?"
                  className="h-9 rounded-md border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 text-[13px] shadow-none"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="eval-docs"
                    className="text-[11px] font-medium text-[var(--ink-muted)]"
                  >
                    Expected documents
                  </label>
                  <Input
                    id="eval-docs"
                    value={documentNames}
                    onChange={(e) => setDocumentNames(e.target.value)}
                    placeholder="doc1.pdf, doc2.pdf"
                    className="h-9 rounded-md border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 text-[13px] shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="eval-keywords"
                    className="text-[11px] font-medium text-[var(--ink-muted)]"
                  >
                    Expected keywords
                  </label>
                  <Input
                    id="eval-keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="transfer, hold, extension"
                    className="h-9 rounded-md border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 text-[13px] shadow-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--ink-muted)]">
                  Eval set
                </label>
                <Select
                  value={selectedSetId ?? ""}
                  onValueChange={(value) => setSelectedSetId(value || null)}
                >
                  <SelectTrigger className="h-9 w-full rounded-md border-[var(--line)] bg-[var(--canvas-soft)] text-[13px] shadow-none">
                    <SelectValue placeholder="Choose set" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {evalSets.map((set) => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <AppButton
                  type="button"
                  tone="ghost"
                  disabled={addingQuestion}
                  onClick={() => setShowAddQuestion(false)}
                  className="h-9 rounded-md px-3 text-[13px]"
                >
                  Cancel
                </AppButton>
                <AppButton
                  type="submit"
                  disabled={
                    !selectedSetId || !questionText.trim() || addingQuestion
                  }
                  className="h-9 rounded-md px-3 text-[13px]"
                >
                  {addingQuestion ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  Add question
                </AppButton>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
