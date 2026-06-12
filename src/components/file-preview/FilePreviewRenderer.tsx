"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

type RendererType =
  | "pdf"
  | "image"
  | "markdown"
  | "text"
  | "csv"
  | "xlsx"
  | "docx"
  | "html"
  | "download";

function getExtension(filename: string) {
  return (filename.split(".").pop() || "").toLowerCase();
}

function resolveType(mimeType: string, filename: string): RendererType {
  const ext = getExtension(filename);
  if (mimeType === "application/pdf" || ext === "pdf") return "pdf";
  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (mimeType === "text/markdown" || ext === "md") return "markdown";
  if (mimeType === "text/csv" || ext === "csv") return "csv";
  if (ext === "xlsx" || mimeType.includes("spreadsheetml")) return "xlsx";
  if (ext === "docx" || mimeType.includes("wordprocessingml")) return "docx";
  if (mimeType.startsWith("text/html") || ext === "html" || ext === "htm") return "html";
  if (mimeType.startsWith("text/") || ["txt", "log", "json"].includes(ext)) return "text";
  return "download";
}

export interface PreviewFile {
  blobUrl: string;
  blob: Blob;
  filename: string;
  mimeType: string;
}

export function FilePreviewRenderer({ file }: { file: PreviewFile }) {
  const type = resolveType(file.mimeType, file.filename);

  switch (type) {
    case "pdf":
      return (
        <iframe
          src={file.blobUrl}
          title={file.filename}
          className="h-full w-full rounded-lg border border-[var(--line)] bg-[var(--surface)]"
        />
      );
    case "image":
      return (
        <div className="flex h-full items-center justify-center overflow-auto rounded-lg border border-[var(--line)] bg-[var(--canvas-soft)] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={file.blobUrl} alt={file.filename} className="max-h-full max-w-full object-contain" />
        </div>
      );
    case "markdown":
      return <TextLikePreview blob={file.blob} mode="markdown" />;
    case "text":
    case "html":
      return <TextLikePreview blob={file.blob} mode="text" />;
    case "csv":
      return <CsvPreview blob={file.blob} />;
    case "xlsx":
      return <XlsxPreview blob={file.blob} />;
    case "docx":
      return <DocxPreview blob={file.blob} />;
    default:
      return <DownloadFallback file={file} />;
  }
}

function PreviewLoading() {
  return (
    <div className="flex h-full items-center justify-center gap-3 text-sm text-[var(--ink-muted)]">
      <Loader2 size={18} className="animate-spin text-[var(--accent-jade)]" />
      Rendering preview…
    </div>
  );
}

function TextLikePreview({ blob, mode }: { blob: Blob; mode: "markdown" | "text" }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    blob.text().then((value) => {
      if (active) setText(value);
    });
    return () => {
      active = false;
    };
  }, [blob]);

  if (text === null) return <PreviewLoading />;

  if (mode === "markdown") {
    return (
      <div className="markdown-container h-full overflow-auto rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    );
  }

  return (
    <pre className="h-full overflow-auto rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 text-[13px] leading-6 text-[var(--ink-soft)] whitespace-pre-wrap wrap-anywhere">
      {text}
    </pre>
  );
}

function CsvPreview({ blob }: { blob: Blob }) {
  const [rows, setRows] = useState<string[][] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ default: Papa }, text] = await Promise.all([import("papaparse"), blob.text()]);
      const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
      if (active) setRows((parsed.data as string[][]).slice(0, 500));
    })();
    return () => {
      active = false;
    };
  }, [blob]);

  if (rows === null) return <PreviewLoading />;
  return <SheetTable rows={rows} />;
}

function XlsxPreview({ blob }: { blob: Blob }) {
  const [sheets, setSheets] = useState<Array<{ name: string; rows: string[][] }> | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await blob.arrayBuffer());
      const result: Array<{ name: string; rows: string[][] }> = [];
      workbook.eachSheet((ws) => {
        const rows: string[][] = [];
        ws.eachRow({ includeEmpty: false }, (row) => {
          const values = Array.isArray(row.values) ? row.values.slice(1) : [];
          rows.push(values.map((v) => (v == null ? "" : String(typeof v === "object" && "text" in (v as object) ? (v as { text?: string }).text ?? "" : v))));
        });
        result.push({ name: ws.name, rows: rows.slice(0, 500) });
      });
      if (alive) setSheets(result);
    })();
    return () => {
      alive = false;
    };
  }, [blob]);

  if (sheets === null) return <PreviewLoading />;
  if (sheets.length === 0) return <p className="p-6 text-sm text-[var(--ink-muted)]">No sheets found.</p>;

  return (
    <div className="flex h-full flex-col">
      {sheets.length > 1 ? (
        <div className="flex flex-wrap gap-1.5 border-b border-[var(--line)] p-2">
          {sheets.map((sheet, index) => (
            <button
              key={sheet.name}
              type="button"
              onClick={() => setActive(index)}
              className={
                index === active
                  ? "rounded-md bg-[var(--accent-jade-50)] px-3 py-1 text-xs font-semibold text-[var(--accent-jade)]"
                  : "rounded-md px-3 py-1 text-xs font-medium text-[var(--ink-muted)] hover:bg-[var(--surface-2)]"
              }
            >
              {sheet.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto">
        <SheetTable rows={sheets[active]?.rows || []} />
      </div>
    </div>
  );
}

function SheetTable({ rows }: { rows: string[][] }) {
  if (rows.length === 0) return <p className="p-6 text-sm text-[var(--ink-muted)]">Empty.</p>;
  const [header, ...body] = rows;
  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-[var(--canvas-soft)]">
          <tr>
            {header.map((cell, i) => (
              <th key={i} className="border-b border-[var(--line)] px-3 py-2 font-semibold text-[var(--ink-soft)]">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, r) => (
            <tr key={r} className="even:bg-[var(--canvas-soft)]/40">
              {header.map((_, c) => (
                <td key={c} className="border-b border-[var(--line-soft)] px-3 py-1.5 text-[var(--ink-soft)]">
                  {row[c] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocxPreview({ blob }: { blob: Blob }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { renderAsync } = await import("docx-preview");
        if (!alive || !containerRef.current) return;
        containerRef.current.innerHTML = "";
        await renderAsync(blob, containerRef.current, undefined, {
          className: "docx",
          inWrapper: true,
        });
        if (alive) setStatus("ready");
      } catch {
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [blob]);

  return (
    <div className="h-full overflow-auto rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      {status === "loading" ? <PreviewLoading /> : null}
      {status === "error" ? (
        <p className="p-6 text-sm text-[var(--ink-muted)]">
          This document couldn&apos;t be rendered in the browser. Use the download button to open it.
        </p>
      ) : null}
      <div ref={containerRef} className="p-4" />
    </div>
  );
}

function DownloadFallback({ file }: { file: PreviewFile }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-[var(--line)] bg-[var(--canvas-soft)] p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
        <FileText size={22} />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--ink)]">Preview not available</p>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">{file.filename}</p>
      </div>
      <a
        href={file.blobUrl}
        download={file.filename}
        className="app-button-secondary"
      >
        <Download size={15} />
        Download file
      </a>
    </div>
  );
}
