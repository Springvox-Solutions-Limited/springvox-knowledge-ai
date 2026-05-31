export type DocumentParserInput = Buffer | ArrayBuffer;
export type ExtractionQuality = 'strong' | 'medium' | 'weak';

export type ParsedDocument = {
  text: string;
  metadata?: {
    parser: string;
    parser_used?: string;
    parser_mode?: 'off' | 'fallback' | 'force';
    llama_parse_job_id?: string;
    local_parser_used?: string;
    fallback_used?: boolean;
    extraction_quality?: ExtractionQuality;
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
    tableMetadata?: {
      sheets?: Array<{
        name: string;
        rowCount: number;
        columnCount: number;
        columns: string[];
        truncated?: boolean;
      }>;
      columns?: string[];
      rowCount?: number;
      columnCount?: number;
      truncated?: boolean;
    };
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

export function assessExtractionQuality(text: string, fileByteLength = 0): ExtractionQuality {
  if (isWeakParsedText(text, fileByteLength)) {
    return 'weak';
  }

  const trimmed = text.trim();
  const wordCount = countWords(trimmed);
  const isLikelyDocument = fileByteLength > 50 * 1024;
  const lines = trimmed.split(/\n+/).filter(Boolean).length;

  if (wordCount >= 250 || lines >= 20 || (isLikelyDocument && trimmed.length >= 1500)) {
    return 'strong';
  }

  return 'medium';
}
