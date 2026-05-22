import {
  assertReadableText,
  countWords,
  type DocumentParser,
  type DocumentParserInput,
  type ParsedDocument,
  toNodeBuffer,
} from './types';

export class TxtParser implements DocumentParser {
  async parse(input: DocumentParserInput, filename: string): Promise<ParsedDocument> {
    const text = toNodeBuffer(input).toString('utf-8');

    assertReadableText(text, 'text file');

    return {
      text,
      metadata: {
        parser: 'txt-utf8',
        wordCount: countWords(text),
      },
    };
  }
}
