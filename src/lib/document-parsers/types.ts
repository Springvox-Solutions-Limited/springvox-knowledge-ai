export type DocumentParserInput = Buffer | ArrayBuffer;

export type ParsedDocument = {
  text: string;
  metadata?: {
    parser: string;
    fallbackUsed?: boolean;
    extractedFormat?: 'markdown' | 'text';
    localParser?: string;
    llamaParseJobId?: string;
    llamaParseMode?: 'off' | 'fallback' | 'force';
    pageCount?: number;
    sheetCount?: number;
    slideCount?: number;
    wordCount?: number;
    warnings?: string[];
  };
};

export interface DocumentParser {
  parse(buffer: DocumentParserInput, filename: string): Promise<ParsedDocument>;
}

export function toNodeBuffer(input: DocumentParserInput) {
  return Buffer.isBuffer(input) ? input : Buffer.from(input);
}

export function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

export function assertReadableText(text: string, fileType: string) {
  if (!text.trim()) {
    throw new Error(`No readable text could be extracted from this ${fileType}.`);
  }
}

export function isWeakParsedText(text: string, fileByteLength = 0) {
  const trimmed = text.trim();

  if (!trimmed) {
    return true;
  }

  const isLikelyDocument = fileByteLength > 50 * 1024;
  if (isLikelyDocument && trimmed.length < 300) {
    return true;
  }

  const replacementCharacters = (trimmed.match(/\uFFFD/g) || []).length;
  if (replacementCharacters > 10 || replacementCharacters / Math.max(trimmed.length, 1) > 0.02) {
    return true;
  }

  const repeatedWhitespaceBlocks = (trimmed.match(/\s{20,}/g) || []).length;
  if (repeatedWhitespaceBlocks > 8) {
    return true;
  }

  const obviousGarbageMarkers = [
    /undefined\s+undefined/i,
    /null\s+null\s+null/i,
    /%PDF-\d\.\d/,
    /obj\s*<<\s*\/Type/i,
    /endobj\s+stream/i,
  ];

  if (obviousGarbageMarkers.some((pattern) => pattern.test(trimmed))) {
    return true;
  }

  const letters = (trimmed.match(/[A-Za-z]/g) || []).length;
  const visibleCharacters = (trimmed.match(/\S/g) || []).length;
  const alphabeticRatio = letters / Math.max(visibleCharacters, 1);

  return visibleCharacters > 200 && alphabeticRatio < 0.2;
}
