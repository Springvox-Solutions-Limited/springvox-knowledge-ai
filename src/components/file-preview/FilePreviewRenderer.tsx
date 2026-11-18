"use client";

import { useEffect, useState } from "react";
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
  | "download";

function normalizeMime(value: string | null | undefined) {
  return (value || "").split(";")[0].trim().toLowerCase();
}

/**
 * The stream endpoint returns a server-verified Content-Type. Only that value
 * is used: `file.mimeType` can originate from a legacy, client-supplied
 * `file_type`, and filenames are attacker-controlled. HTML, SVG and unknown
 * types fall through to the download fallback.
 */
export function resolveType(mimeType: string): RendererType {
  const declared = normalizeMime(mimeType);

  if (declared === "application/pdf") return "pdf";
  if (["image/png", "image/jpeg", "image/gif", "image/webp"].includes(declared)) return "image";
  if (declared === "text/markdown") return "markdown";
  if (declared === "text/csv") return "csv";
  if (declared.includes("spreadsheetml")) return "xlsx";
  if (declared.includes("wordprocessingml")) return "docx";
  if (declared.startsWith("text/plain")) return "text";

  return "download";
}

export interface PreviewFile {
  blobUrl: string;
  blob: Blob;
  filename: string;
  mimeType: string;
}

export function FilePreviewRenderer({ file }: { file: PreviewFile }) {
  // `blob.type` comes from the streaming endpoint's verified Content-Type and
  // takes precedence over the stored (potentially legacy) MIME hint.
  const type = resolveType(file.blob.type);

  switch (type) {
    case "pdf":
      return (
        <iframe
          src={file.blobUrl}
          title={file.filename}
          referrerPolicy="no-referrer"
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

/**
 * DOCX previews are rendered from mammoth's semantic HTML inside a fully
 * sandboxed iframe. `docx-preview` is intentionally not used: it writes
 * attacker-controlled values into `innerHTML` (w:sym `&#x…`, altChunk
 * `srcdoc`), which is a stored-XSS sink. The sandbox (`sandbox=""`) blocks
 * scripts, forms, popups and same-origin access, and the embedded CSP blocks
 * every network request except inline styles and data-URI images.
 */
function buildDocxPreviewDocument(bodyHtml: string) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:" />
<style>
  body { margin: 0; padding: 24px; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
         font-size: 14px; line-height: 1.65; color: #e8ece9; background: #141816; }
  h1, h2, h3, h4 { color: #f3f6f4; line-height: 1.3; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #2b332e; padding: 6px 8px; text-align: left; }
  img { max-width: 100%; height: auto; }
  a { color: #5eead4; pointer-events: none; }
  pre { white-space: pre-wrap; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

function DocxPreview({ blob }: { blob: Blob }) {
  const [html, setHtml] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() });
        if (!alive) return;
        setHtml(result.value);
        setStatus("ready");
      } catch {
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [blob]);

  if (status === "loading") return <PreviewLoading />;
  if (status === "error" || html === null) {
    return (
      <p className="p-6 text-sm text-[var(--ink-muted)]">
        This document couldn&apos;t be rendered in the browser. Use the download button to open it.
      </p>
    );
  }

  return (
    <iframe
      title="DOCX preview"
      sandbox=""
      srcDoc={buildDocxPreviewDocument(html)}
      className="h-full w-full rounded-lg border border-[var(--line)] bg-[var(--surface)]"
    />
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
