import mammoth from 'mammoth';
import {
  assertReadableText,
  countWords,
  type DocumentParser,
  type DocumentParserInput,
  type ParsedDocument,
  toNodeBuffer,
} from './types';

export class DocxParser implements DocumentParser {
  async parse(input: DocumentParserInput, filename: string): Promise<ParsedDocument> {
    try {
      const buffer = toNodeBuffer(input);
      const result = await (mammoth as typeof mammoth & {
        convertToMarkdown: typeof mammoth.convertToHtml;
      }).convertToMarkdown({ buffer });
      const text = result.value || '';

      assertReadableText(text, 'DOCX document');

      const warnings = result.messages.map((m) => `${m.type}: ${m.message}`);

      return {
        text,
        metadata: {
          parser: 'mammoth-docx',
          wordCount: countWords(text),
          warnings: warnings.length > 0 ? warnings : undefined,
        },
      };
    } catch (err) {
      throw new Error(
        `Failed to parse DOCX file: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}
