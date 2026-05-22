import { OfficeParser, type OfficeContentNode } from 'officeparser';
import {
  assertReadableText,
  countWords,
  type DocumentParser,
  type DocumentParserInput,
  type ParsedDocument,
  toNodeBuffer,
} from './types';

function getNodeText(node: OfficeContentNode): string {
  const ownText = typeof node.text === 'string' ? node.text : '';
  const childText = (node.children || []).map(getNodeText).filter(Boolean).join('\n');

  return [ownText, childText].filter(Boolean).join('\n').trim();
}

function formatSlideText(slide: OfficeContentNode, index: number) {
  const lines = getNodeText(slide)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const title = lines[0] || `Slide ${index + 1}`;
  const body = lines.slice(1).map((line) => `- ${line}`).join('\n');

  return [`Slide ${index + 1}: ${title}`, body].filter(Boolean).join('\n');
}

export class PptxParser implements DocumentParser {
  async parse(input: DocumentParserInput, filename: string): Promise<ParsedDocument> {
    try {
      const buffer = toNodeBuffer(input);
      const ast = await OfficeParser.parseOffice(buffer, {
        fileType: 'pptx',
        ignoreNotes: false,
      });

      const slideNodes = (ast.content || []).filter((node) => node.type === 'slide');
      const text =
        slideNodes.length > 0
          ? slideNodes.map(formatSlideText).join('\n\n')
          : String((await ast.to('md')).value);

      assertReadableText(text, 'PPTX presentation');

      const slideCount = slideNodes.length;

      const warnings = (ast.warnings || []).map((w) => `${w.type}: ${w.message}`);

      return {
        text,
        metadata: {
          parser: 'officeparser-pptx',
          slideCount: slideCount > 0 ? slideCount : undefined,
          wordCount: countWords(text),
          warnings: warnings.length > 0 ? warnings : undefined,
        },
      };
    } catch (err) {
      throw new Error(
        `Failed to parse PPTX file: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}
