import { createRequire } from 'module';
import {
  assertReadableText,
  countWords,
  type DocumentParser,
  type DocumentParserInput,
  type ParsedDocument,
  toNodeBuffer,
} from './types';

export class PdfParser implements DocumentParser {
  async parse(input: DocumentParserInput, filename: string): Promise<ParsedDocument> {
    const require = createRequire(import.meta.url);
    const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
      buffer: Buffer,
    ) => Promise<{ text: string; numpages?: number }>;

    const buffer = toNodeBuffer(input);
    const parsed = await pdfParse(buffer);
    const text = parsed.text || '';

    assertReadableText(text, 'PDF');

    return {
      text,
      metadata: {
        parser: 'pdf-parse',
        pageCount: parsed.numpages,
        wordCount: countWords(text),
      },
    };
  }
}
