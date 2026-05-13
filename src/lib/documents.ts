const MAX_CHUNK_LENGTH = 1000;
const CHUNK_OVERLAP = 200;

export const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;
export const ALLOWED_FILE_EXTENSIONS = new Set(['.pdf', '.txt']);
export const ALLOWED_FILE_MIME_TYPES = new Set(['application/pdf', 'text/plain']);

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

  if (extension === '.txt' && !file.type) {
    return true;
  }

  return ALLOWED_FILE_MIME_TYPES.has(file.type);
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
