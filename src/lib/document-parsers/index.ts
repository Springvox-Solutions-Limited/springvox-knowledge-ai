import { getFileExtension } from '../documents';
import { PdfParser } from './pdf';
import { TxtParser } from './txt';
import { DocxParser } from './docx';
import { CsvParser } from './csv';
import { XlsxParser } from './xlsx';
import { PptxParser } from './pptx';
import { LlamaParseParser } from './llamaparse';
import { isWeakParsedText, toNodeBuffer, type DocumentParser, type DocumentParserInput, type ParsedDocument } from './types';

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

function isLlamaParseSupportedFile(extension: string, mimeType?: string) {
  return (
    extension === '.pdf' ||
    extension === '.docx' ||
    extension === '.pptx' ||
    extension === '.xlsx' ||
    mimeType === 'application/pdf' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
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
  const shouldConsiderLlamaParse = isLlamaParseEnabled() && isLlamaParseSupportedFile(extension, mimeType);

  if (!shouldConsiderLlamaParse) {
    return parseLocalDocument(buffer, filename, extension, mimeType);
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

      return {
        ...localResult,
        metadata: {
          ...localResult.metadata,
          warnings,
          fallbackUsed: true,
          llamaParseMode: mode,
        },
      };
    }
  }

  let localResult: ParsedDocument | null = null;
  let localError: unknown = null;

  try {
    localResult = await parseLocalDocument(buffer, filename, extension, mimeType);
  } catch (error) {
    localError = error;
  }

  const fileByteLength = toNodeBuffer(buffer).byteLength;
  const localTextIsWeak = localResult ? isWeakParsedText(localResult.text, fileByteLength) : true;

  if (localResult && !localTextIsWeak) {
    return {
      ...localResult,
      metadata: {
        ...localResult.metadata,
        fallbackUsed: false,
        llamaParseMode: mode,
      },
    };
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
      return {
        ...localResult,
        metadata: {
          ...localResult.metadata,
          fallbackUsed: false,
          llamaParseMode: mode,
          warnings: [
            ...(localResult.metadata?.warnings || []),
            `LlamaParse fallback failed, so the local parser result was kept: ${
              llamaParseError instanceof Error ? llamaParseError.message : 'Unknown LlamaParse error'
            }`,
          ],
        },
      };
    }

    throw llamaParseError;
  }
}
