const MAX_CHUNK_LENGTH = 1000;
const CHUNK_OVERLAP = 200;
export const DEFAULT_MAX_UPLOAD_MB = 20;
export const ALLOWED_FILE_EXTENSIONS = new Set([
  '.pdf',
  '.txt',
  '.docx',
  '.csv',
  '.xlsx',
  '.pptx',
]);
export const ALLOWED_FILE_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

export function sanitizeFilename(filename: string) {
  return filename
    .replace(/[/\\]/g, '-')
    .replace(/[^a-zA-Z0-9._ -]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getFileExtension(filename: string) {
  const normalized = filename.toLowerCase();
  const lastDotIndex = normalized.lastIndexOf('.');
  return lastDotIndex >= 0 ? normalized.slice(lastDotIndex) : '';
}

export function isSupportedDocument(file: File) {
  const extension = getFileExtension(file.name);

  if (!ALLOWED_FILE_EXTENSIONS.has(extension)) {
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Server-side content validation (P0-1)
//
// The browser controls both `File.name` and `File.type`. Neither is trusted.
// Uploads are accepted only when the extension is on the allowlist AND the
// bytes match the expected container family (PDF header, OOXML ZIP structure,
// or valid UTF-8 text). The stored/served MIME type is always derived from
// that verification, never from the client.
// ---------------------------------------------------------------------------

/** Number of leading bytes used for signature and container detection. */
export const HEADER_SAMPLE_BYTES = 16 * 1024;

export type DocumentFamily =
  | 'pdf'
  | 'text'
  | 'docx'
  | 'xlsx'
  | 'pptx'
  | 'png'
  | 'jpeg'
  | 'gif'
  | 'webp';

type UploadTarget = {
  mime: string;
  /** Family that the bytes must match. CSV is text on the wire. */
  family: Exclude<DocumentFamily, 'png' | 'jpeg' | 'gif' | 'webp'>;
};

/**
 * Canonical upload allowlist. Keep in sync with ALLOWED_FILE_EXTENSIONS.
 * MIME types are the values written to `documents.file_type` and used for the
 * storage object content type.
 */
const UPLOAD_TARGETS: Record<string, UploadTarget> = {
  '.pdf': { mime: 'application/pdf', family: 'pdf' },
  '.txt': { mime: 'text/plain', family: 'text' },
  '.csv': { mime: 'text/csv', family: 'text' },
  '.docx': {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    family: 'docx',
  },
  '.xlsx': {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    family: 'xlsx',
  },
  '.pptx': {
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    family: 'pptx',
  },
};

/**
 * Formats that may be *served* (streamed) but not uploaded. Legacy rows can
 * contain images and Markdown; SVG and HTML are deliberately absent because
 * they are executable in a browser.
 */
const STREAM_TARGETS: Record<string, { mime: string; family: DocumentFamily; inline: boolean }> = {
  '.pdf': { mime: 'application/pdf', family: 'pdf', inline: true },
  '.txt': { mime: 'text/plain; charset=utf-8', family: 'text', inline: true },
  '.md': { mime: 'text/markdown; charset=utf-8', family: 'text', inline: true },
  '.csv': { mime: 'text/csv; charset=utf-8', family: 'text', inline: true },
  '.docx': { ...UPLOAD_TARGETS['.docx'], inline: false },
  '.xlsx': { ...UPLOAD_TARGETS['.xlsx'], inline: false },
  '.pptx': { ...UPLOAD_TARGETS['.pptx'], inline: false },
  '.png': { mime: 'image/png', family: 'png', inline: true },
  '.jpg': { mime: 'image/jpeg', family: 'jpeg', inline: true },
  '.jpeg': { mime: 'image/jpeg', family: 'jpeg', inline: true },
  '.gif': { mime: 'image/gif', family: 'gif', inline: true },
  '.webp': { mime: 'image/webp', family: 'webp', inline: true },
};

function startsWithBytes(bytes: Uint8Array, signature: number[]) {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

function containsAscii(bytes: Uint8Array, marker: string) {
  const needle = Array.from(marker, (char) => char.charCodeAt(0));
  if (needle.length === 0 || bytes.length < needle.length) return false;

  outer: for (let index = 0; index <= bytes.length - needle.length; index += 1) {
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (bytes[index + offset] !== needle[offset]) continue outer;
    }
    return true;
  }

  return false;
}

function looksLikeUtf8Text(bytes: Uint8Array) {
  if (bytes.length === 0) return false;

  let controlCharacters = 0;
  for (const byte of bytes) {
    // NUL means binary. Allow tab (9), LF (10), FF (12), CR (13).
    if (byte === 0) return false;
    if (byte < 9 || (byte > 13 && byte < 32)) controlCharacters += 1;
  }

  if (controlCharacters / bytes.length > 0.02) return false;

  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect the container family from raw bytes. Returns null for anything that is
 * not a recognised document/image format (including unknown ZIPs and binaries).
 */
export function sniffDocumentFamily(bytes: Uint8Array): DocumentFamily | null {
  if (bytes.length === 0) return null;

  // PDF header may be preceded by up to 1024 bytes of junk per the spec.
  const pdfWindow = bytes.subarray(0, Math.min(bytes.length, 1024));
  if (containsAscii(pdfWindow, '%PDF-')) return 'pdf';

  if (startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (containsAscii(bytes.subarray(0, 6), 'GIF87a') || containsAscii(bytes.subarray(0, 6), 'GIF89a')) {
    return 'gif';
  }
  if (containsAscii(bytes.subarray(0, 12), 'RIFF') && containsAscii(bytes.subarray(0, 16), 'WEBP')) {
    return 'webp';
  }

  // OOXML files are ZIP containers. Local file-header names are stored
  // uncompressed, so the family marker is visible in the leading bytes. Match
  // full entry names: a bare "word/" also appears inside words such as
  // "password/" and would misclassify a legitimate XLSX.
  if (startsWithBytes(bytes, [0x50, 0x4b, 0x03, 0x04]) || startsWithBytes(bytes, [0x50, 0x4b, 0x05, 0x06])) {
    if (containsAscii(bytes, 'word/document.xml')) return 'docx';
    if (containsAscii(bytes, 'xl/workbook.xml')) return 'xlsx';
    if (containsAscii(bytes, 'ppt/presentation.xml')) return 'pptx';
    return null;
  }

  if (looksLikeUtf8Text(bytes)) return 'text';

  return null;
}

// Note: kept as a single object shape (not a discriminated union) because this
// project compiles with `strictNullChecks: false`, where boolean-literal
// narrowing does not apply.
export type UploadValidationResult = {
  ok: boolean;
  mime?: string;
  extension?: string;
  family?: DocumentFamily;
  error?: string;
};

/**
 * Validate an upload using the filename extension and the leading bytes only.
 * The client-supplied `File.type` is intentionally not read.
 */
export function validateUploadedDocument({
  filename,
  head,
  size,
}: {
  filename: string;
  head: Uint8Array;
  size: number;
}): UploadValidationResult {
  const extension = getFileExtension(filename);
  const target = UPLOAD_TARGETS[extension];

  if (!target) {
    return {
      ok: false,
      error: 'Unsupported file type. Supported formats are PDF, TXT, DOCX, CSV, XLSX, and PPTX.',
    };
  }

  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, error: 'The file is empty.' };
  }

  const detected = sniffDocumentFamily(head);

  if (!detected) {
    return {
      ok: false,
      error: 'Could not verify this file. It does not look like a valid PDF, TXT, DOCX, CSV, XLSX, or PPTX file.',
    };
  }

  const matches =
    target.family === detected || (target.family === 'text' && detected === 'text');

  if (!matches) {
    return {
      ok: false,
      error: 'File content does not match its extension. Rename the file to its real format or upload the correct document.',
    };
  }

  return { ok: true, mime: target.mime, extension, family: target.family };
}

export type StreamContentType = {
  contentType: string;
  disposition: 'inline' | 'attachment';
};

const UNSAFE_STREAM_CONTENT: StreamContentType = {
  contentType: 'application/octet-stream',
  disposition: 'attachment',
};

/**
 * Derive the response content type for a stored file from its leading bytes and
 * filename. The database `file_type` value is deliberately ignored: legacy rows
 * may contain client-supplied (spoofable) MIME types.
 */
export function resolveStreamContentType({
  filename,
  head,
}: {
  filename: string;
  head: Uint8Array;
}): StreamContentType {
  const extension = getFileExtension(filename);
  const target = STREAM_TARGETS[extension];
  if (!target) return UNSAFE_STREAM_CONTENT;

  const detected = sniffDocumentFamily(head);
  if (!detected) return UNSAFE_STREAM_CONTENT;

  // Text containers cannot distinguish TXT/CSV/MD by bytes, so both sides map
  // to the text family; every other format must match exactly.
  const matches = target.family === detected || (target.family === 'text' && detected === 'text');
  if (!matches) return UNSAFE_STREAM_CONTENT;

  return {
    contentType: target.mime,
    disposition: target.inline ? 'inline' : 'attachment',
  };
}

/** Strip CR/LF/quotes/non-ASCII so a filename cannot break out of the header. */
export function contentDispositionFilename(filename: string) {
  const cleaned = filename
    // Headers must be ISO-8859-1; non-ASCII would throw in undici Headers.
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '')
    .trim()
    .slice(0, 255);
  return cleaned || 'document';
}

export function getMaxUploadMb() {
  const rawValue = process.env.MAX_UPLOAD_MB;
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : DEFAULT_MAX_UPLOAD_MB;

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_MAX_UPLOAD_MB;
  }

  return parsedValue;
}

export function getMaxUploadBytes() {
  return getMaxUploadMb() * 1024 * 1024;
}

export function normalizeDocumentText(text: string) {
  return text.replace(/\r\n/g, '\n').replace(/\u0000/g, '').trim();
}

export function buildPreview(text: string, maxLength = 160) {
  return text.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function chunkDocumentText(text: string) {
  const normalized = normalizeDocumentText(text);
  if (!normalized) {
    return [];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + MAX_CHUNK_LENGTH, normalized.length);
    const chunk = normalized.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= normalized.length) {
      break;
    }

    start += MAX_CHUNK_LENGTH - CHUNK_OVERLAP;
  }

  return chunks;
}
