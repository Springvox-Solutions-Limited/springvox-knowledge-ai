"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/src/lib/auth-client";
import { AppButton } from "@/src/components/ui/app-button";
import { AppCard } from "@/src/components/ui/app-card";
import { AppPageHeader } from "@/src/components/shared/AppPageHeader";

type EvalSet = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  rag_eval_questions?: { id: string }[];
  rag_eval_runs?: Array<{
    id: string;
    status: string;
    passed_questions: number;
    total_questions: number;
    average_latency_ms: number | null;
    created_at: string;
  }>;
};

export default function EvaluationsPage() {
  const [evalSets, setEvalSets] = useState<EvalSet[]>([]);
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [keywords, setKeywords] = useState("");
  const [documentNames, setDocumentNames] = useState("");
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const api = async (path: string, init?: RequestInit) => {
    const token = await getAccessToken();
    const response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  };

  const load = async () => {
    const data = await api("/api/evaluations");
    setEvalSets(data.evalSets || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const createSet = async () => {
    await api("/api/evaluations", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setName("");
    setMessage("Evaluation set created.");
    await load();
  };

  const addQuestion = async () => {
    if (!selectedSetId) return;
    await api(`/api/evaluations/${selectedSetId}/questions`, {
      method: "POST",
      body: JSON.stringify({
        question,
        expectedKeywords: splitCsv(keywords),
        expectedDocumentNames: splitCsv(documentNames),
      }),
    });
    setQuestion("");
    setKeywords("");
    setDocumentNames("");
    setMessage("Golden question added.");
    await load();
  };

  const runEval = async (id: string) => {
    const result = await api(`/api/evaluations/${id}/run`, { method: "POST" });
    setMessage(`Evaluation completed: ${result.passed}/${result.total} checks passed.`);
    await load();
  };

  return (
    <div className="admin-page">
      <AppPageHeader
        eyebrow="Answer quality"
        title="Evaluations"
        subtitle="Create golden questions and run deterministic retrieval checks before beta users hit issues."
      />

      {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <AppCard className="space-y-3 p-5">
          <h2 className="text-base font-semibold text-slate-950">Create eval set</h2>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Cisco manual beta checks"
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
          <AppButton onClick={createSet} disabled={!name.trim()}>Create set</AppButton>
        </AppCard>

        <AppCard className="space-y-3 p-5">
          <h2 className="text-base font-semibold text-slate-950">Add golden question</h2>
          <select
            value={selectedSetId || ""}
            onChange={(event) => setSelectedSetId(event.target.value || null)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          >
            <option value="">Choose eval set</option>
            {evalSets.map((set) => <option key={set.id} value={set.id}>{set.name}</option>)}
          </select>
          <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="How do I transfer a call?" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          <input value={documentNames} onChange={(event) => setDocumentNames(event.target.value)} placeholder="Expected document names, comma separated" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          <input value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="Expected keywords, comma separated" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          <AppButton onClick={addQuestion} disabled={!selectedSetId || !question.trim()}>Add question</AppButton>
        </AppCard>
      </div>

      <div className="grid gap-4">
        {evalSets.map((set) => {
          const latestRun = set.rag_eval_runs?.[0];
          return (
            <AppCard key={set.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold text-slate-950">{set.name}</h2>
                <p className="text-sm text-slate-500">{set.rag_eval_questions?.length || 0} golden questions</p>
                {latestRun ? (
                  <p className="text-xs text-slate-500">
                    Latest: {latestRun.passed_questions}/{latestRun.total_questions} passed · {latestRun.average_latency_ms || 0}ms avg
                  </p>
                ) : null}
              </div>
              <AppButton onClick={() => runEval(set.id)} tone="secondary">Run evaluation</AppButton>
            </AppCard>
          );
        })}
      </div>
    </div>
  );
}

function splitCsv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
