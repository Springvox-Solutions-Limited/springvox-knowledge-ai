import Papa from 'papaparse';
import {
  assertReadableText,
  countWords,
  type DocumentParser,
  type DocumentParserInput,
  type ParsedDocument,
  toNodeBuffer,
} from './types';

export class CsvParser implements DocumentParser {
  async parse(input: DocumentParserInput, filename: string): Promise<ParsedDocument> {
    try {
      const csvString = toNodeBuffer(input).toString('utf-8');
      const result = Papa.parse(csvString, {
        header: false,
        skipEmptyLines: 'greedy',
      });

      const data = result.data as string[][];
      if (!data || data.length === 0) {
        throw new Error("No data found in the CSV file.");
      }

      const MAX_ROWS = 1000;
      const isTruncated = data.length > MAX_ROWS;
      const rowsToProcess = data.slice(0, MAX_ROWS);

      const escapeCell = (cell: any) => {
        if (cell === null || cell === undefined) return '';
        return String(cell).replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();
      };

      let markdown = '';
      if (rowsToProcess.length > 0) {
        const headers = rowsToProcess[0];
        markdown += `| ${headers.map(escapeCell).join(' | ')} |\n`;
        markdown += `| ${headers.map(() => '---').join(' | ')} |\n`;
        for (let i = 1; i < rowsToProcess.length; i++) {
          markdown += `| ${rowsToProcess[i].map(escapeCell).join(' | ')} |\n`;
        }
      }

      const warnings: string[] = [];
      if (isTruncated) {
        markdown += `\n\n*Note: The document was truncated. Only the first ${MAX_ROWS} rows were processed.*`;
        warnings.push(`CSV file was truncated to the first ${MAX_ROWS} rows to prevent overflow.`);
      }

      assertReadableText(markdown, 'CSV file');

      return {
        text: markdown,
        metadata: {
          parser: 'papaparse-csv',
          wordCount: countWords(markdown),
          warnings: warnings.length > 0 ? warnings : undefined,
        },
      };
    } catch (err) {
      throw new Error(
        `Failed to parse CSV file: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}
