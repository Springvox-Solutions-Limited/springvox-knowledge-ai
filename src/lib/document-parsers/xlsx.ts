import * as XLSX from 'xlsx';
import {
  assertReadableText,
  countWords,
  type DocumentParser,
  type DocumentParserInput,
  type ParsedDocument,
  toNodeBuffer,
} from './types';

export class XlsxParser implements DocumentParser {
  async parse(input: DocumentParserInput, filename: string): Promise<ParsedDocument> {
    try {
      const buffer = toNodeBuffer(input);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let markdown = '';
      const warnings: string[] = [];
      const sheets: Array<{
        name: string;
        rowCount: number;
        columnCount: number;
        columns: string[];
        truncated?: boolean;
      }> = [];
      const MAX_SHEET_ROWS = 500;

      const escapeCell = (cell: any) => {
        if (cell === null || cell === undefined) return '';
        return String(cell).replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();
      };

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (!data || data.length === 0) return;

        markdown += `### Sheet: ${sheetName}\n\n`;

        const isTruncated = data.length > MAX_SHEET_ROWS;
        const rowsToProcess = data.slice(0, MAX_SHEET_ROWS);

        if (rowsToProcess.length > 0) {
          const headers = rowsToProcess[0];
          const formattedHeaders = headers.map((h, i) =>
            h !== undefined && h !== null && h !== '' ? String(h) : `Column ${i + 1}`
          );
          sheets.push({
            name: sheetName,
            rowCount: data.length,
            columnCount: formattedHeaders.length,
            columns: formattedHeaders.map(String),
            truncated: isTruncated || undefined,
          });

          markdown += `| ${formattedHeaders.map(escapeCell).join(' | ')} |\n`;
          markdown += `| ${formattedHeaders.map(() => '---').join(' | ')} |\n`;

          for (let i = 1; i < rowsToProcess.length; i++) {
            const row = rowsToProcess[i] || [];
            const rowData = Array.from(
              { length: formattedHeaders.length },
              (_, colIdx) => row[colIdx]
            );
            markdown += `| ${rowData.map(escapeCell).join(' | ')} |\n`;
          }
        }

        markdown += '\n';

        if (isTruncated) {
          markdown += `*Note: Sheet "${sheetName}" was truncated. Only the first ${MAX_SHEET_ROWS} rows were processed.*\n\n`;
          warnings.push(`Sheet "${sheetName}" was truncated to ${MAX_SHEET_ROWS} rows.`);
        }
      });

      assertReadableText(markdown, 'Excel file');

      return {
        text: markdown.trim(),
        metadata: {
          parser: 'sheetjs-xlsx',
          sheetCount: workbook.SheetNames.length,
          wordCount: countWords(markdown),
          warnings: warnings.length > 0 ? warnings : undefined,
          tableMetadata: {
            sheets,
          },
        },
      };
    } catch (err) {
      throw new Error(
        `Failed to parse Excel file: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}
