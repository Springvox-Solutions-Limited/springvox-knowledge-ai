import { getFileExtension } from '../documents';
import { PdfParser } from './pdf';
import { TxtParser } from './txt';
import { DocxParser } from './docx';
import { CsvParser } from './csv';
import { XlsxParser } from './xlsx';
import { PptxParser } from './pptx';
import { LlamaParseParser } from './llamaparse';
import {
  assessExtractionQuality,
  isWeakParsedText,
  toNodeBuffer,
  type DocumentParser,
  type DocumentParserInput,
  type ParsedDocument,
} from './types';

export * from './types';
export * from './pdf';
export * from './txt';
export * from './docx';
export * from './csv';
export * from './xlsx';
export * from './pptx';
export * from './llamaparse';

type LlamaParseMode = 'off' | 'fallback' | 'force';

function getLlamaParseMode(): LlamaParseMode {
  const mode = (process.env.LLAMAPARSE_MODE || 'fallback').toLowerCase();

  if (mode === 'off' || mode === 'force' || mode === 'fallback') {
    return mode;
  }

  return 'fallback';
}

function isLlamaParseEnabled() {
  return process.env.LLAMAPARSE_ENABLED === 'true' && getLlamaParseMode() !== 'off';
}

function hasLlamaParseApiKey() {
  return Boolean(process.env.LLAMAPARSE_API_KEY || process.env.LLAMA_CLOUD_API_KEY);
}

function isLlamaParseComplexOnly() {
  return process.env.LLAMAPARSE_COMPLEX_ONLY !== 'false';
}

function isLlamaParseSupportedFile(extension: string, mimeType?: string) {
  const complexOnly = isLlamaParseComplexOnly();
  const isComplexFile =
    extension === '.pdf' ||
    extension === '.docx' ||
    extension === '.pptx' ||
    extension === '.xlsx' ||
    mimeType === 'application/pdf' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

  if (complexOnly) {
    return isComplexFile;
  }

  return isComplexFile;
}

function withParserMetadata(
  result: ParsedDocument,
  {
    mode,
    parserUsed,
    fallbackUsed,
    localParser,
    warnings,
    fileByteLength,
  }: {
    mode: LlamaParseMode;
    parserUsed?: string;
    fallbackUsed: boolean;
    localParser?: string;
    warnings?: string[];
    fileByteLength: number;
  },
): ParsedDocument {
  const parser = parserUsed || result.metadata?.parser || 'unknown';

  return {
    ...result,
    metadata: {
      ...result.metadata,
      parser,
      parser_used: parser,
      parser_mode: mode,
      local_parser_used: localParser || result.metadata?.localParser || result.metadata?.parser,
      fallback_used: fallbackUsed,
      fallbackUsed,
      llamaParseMode: mode,
      extraction_quality: assessExtractionQuality(result.text, fileByteLength),
      warnings: warnings || result.metadata?.warnings,
    },
  };
}

function warnMissingLlamaParseKey() {
  console.warn(
    '[LlamaParse] LLAMAPARSE_ENABLED is true, but LLAMAPARSE_API_KEY is not configured. Using local parsers only.',
  );
}

function getLocalParser(extension: string, mimeType?: string): DocumentParser {
  if (extension === '.pdf' || mimeType === 'application/pdf') {
    return new PdfParser();
  }

  if (extension === '.txt' || mimeType === 'text/plain') {
    return new TxtParser();
  }

  if (
    extension === '.docx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return new DocxParser();
  }

  if (extension === '.csv' || mimeType === 'text/csv') {
    return new CsvParser();
  }

  if (
    extension === '.xlsx' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return new XlsxParser();
  }

  if (
    extension === '.pptx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return new PptxParser();
  }

  throw new Error(`Unsupported file type: extension="${extension}", mimeType="${mimeType}"`);
}

async function parseLocalDocument(
  buffer: DocumentParserInput,
  filename: string,
  extension: string,
  mimeType?: string,
) {
  const parser = getLocalParser(extension, mimeType);
  return parser.parse(buffer, filename);
}

async function parseWithLlamaParse({
  buffer,
  filename,
  mimeType,
  mode,
  fallbackUsed,
  localParser,
  warnings,
}: {
  buffer: DocumentParserInput;
  filename: string;
  mimeType?: string;
  mode: LlamaParseMode;
  fallbackUsed: boolean;
  localParser?: string;
  warnings?: string[];
}) {
  const parser = new LlamaParseParser({
    mimeType,
    mode,
    fallbackUsed,
    localParser,
    warnings,
  });

  return parser.parse(buffer, filename);
}

export async function parseDocument({
  buffer,
  filename,
  mimeType,
}: {
  buffer: DocumentParserInput;
  filename: string;
  mimeType?: string;
}): Promise<ParsedDocument> {
  const extension = getFileExtension(filename);
  const mode = getLlamaParseMode();
  const fileByteLength = toNodeBuffer(buffer).byteLength;
  const shouldConsiderLlamaParse = isLlamaParseEnabled() && isLlamaParseSupportedFile(extension, mimeType);

  if (!shouldConsiderLlamaParse) {
    const localResult = await parseLocalDocument(buffer, filename, extension, mimeType);
    return withParserMetadata(localResult, {
      mode: 'off',
      fallbackUsed: false,
      fileByteLength,
    });
  }

  if (!hasLlamaParseApiKey()) {
    warnMissingLlamaParseKey();
    const localResult = await parseLocalDocument(buffer, filename, extension, mimeType);
    return withParserMetadata(localResult, {
      mode,
      fallbackUsed: false,
      fileByteLength,
      warnings: [
        ...(localResult.metadata?.warnings || []),
        'LlamaParse was enabled but no API key was configured, so the local parser was used.',
      ],
    });
  }

  if (mode === 'force') {
    try {
      return await parseWithLlamaParse({
        buffer,
        filename,
        mimeType,
        mode,
        fallbackUsed: false,
      });
    } catch (llamaParseError) {
      const localResult = await parseLocalDocument(buffer, filename, extension, mimeType);
      const warnings = [
        ...(localResult.metadata?.warnings || []),
        `LlamaParse failed in force mode, so the local parser was used instead: ${
          llamaParseError instanceof Error ? llamaParseError.message : 'Unknown LlamaParse error'
        }`,
      ];

      return withParserMetadata(localResult, {
        mode,
        fallbackUsed: true,
        fileByteLength,
        warnings,
      });
    }
  }

  let localResult: ParsedDocument | null = null;
  let localError: unknown = null;

  try {
    localResult = await parseLocalDocument(buffer, filename, extension, mimeType);
  } catch (error) {
    localError = error;
  }

  const localTextIsWeak = localResult ? isWeakParsedText(localResult.text, fileByteLength) : true;

  if (localResult && !localTextIsWeak) {
    return withParserMetadata(localResult, {
      mode,
      fallbackUsed: false,
      fileByteLength,
    });
  }

  try {
    return await parseWithLlamaParse({
      buffer,
      filename,
      mimeType,
      mode,
      fallbackUsed: true,
      localParser: localResult?.metadata?.parser,
      warnings: [
        ...(localResult?.metadata?.warnings || []),
        localError instanceof Error
          ? `Local parser failed before LlamaParse fallback: ${localError.message}`
          : 'Local parser output was too weak, so LlamaParse fallback was used.',
      ],
    });
  } catch (llamaParseError) {
    if (localResult) {
      return withParserMetadata(localResult, {
        mode,
        fallbackUsed: false,
        fileByteLength,
        warnings: [
          ...(localResult.metadata?.warnings || []),
          `LlamaParse fallback failed, so the local parser result was kept: ${
            llamaParseError instanceof Error ? llamaParseError.message : 'Unknown LlamaParse error'
          }`,
        ],
      });
    }

    throw llamaParseError;
  }
}
