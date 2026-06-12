import ExcelJS from 'exceljs';
import {
  assertReadableText,
  countWords,
  type DocumentParser,
  type DocumentParserInput,
  type ParsedDocument,
  toNodeBuffer,
} from './types';

const MAX_SHEET_ROWS = 500;

// ExcelJS cell values can be primitives or rich objects (formula results,
// hyperlinks, rich text). Normalize any of those to a plain string.
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.text === 'string') return record.text;
    if (typeof record.result === 'string' || typeof record.result === 'number') {
      return String(record.result);
    }
    if (typeof record.hyperlink === 'string') return record.hyperlink;
    if (Array.isArray(record.richText)) {
      return record.richText.map((part) => (part as { text?: string }).text || '').join('');
    }
  }

  return String(value);
}

function escapeCell(value: unknown): string {
  return cellToString(value).replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();
}

export class XlsxParser implements DocumentParser {
  async parse(input: DocumentParserInput, _filename: string): Promise<ParsedDocument> {
    try {
      const buffer = toNodeBuffer(input);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

      let markdown = '';
      const warnings: string[] = [];
      const sheets: Array<{
        name: string;
        rowCount: number;
        columnCount: number;
        columns: string[];
        truncated?: boolean;
      }> = [];

      workbook.eachSheet((worksheet) => {
        // Collect rows as plain arrays (ExcelJS row.values is 1-indexed).
        const rows: unknown[][] = [];
        worksheet.eachRow({ includeEmpty: false }, (row) => {
          const values = Array.isArray(row.values) ? row.values.slice(1) : [];
          rows.push(values);
        });

        if (rows.length === 0) return;

        markdown += `### Sheet: ${worksheet.name}\n\n`;

        const isTruncated = rows.length > MAX_SHEET_ROWS;
        const rowsToProcess = rows.slice(0, MAX_SHEET_ROWS);
        const headers = rowsToProcess[0] || [];
        const formattedHeaders = headers.map((cell, index) => {
          const text = cellToString(cell);
          return text !== '' ? text : `Column ${index + 1}`;
        });

        sheets.push({
          name: worksheet.name,
          rowCount: rows.length,
          columnCount: formattedHeaders.length,
          columns: formattedHeaders,
          truncated: isTruncated || undefined,
        });

        markdown += `| ${formattedHeaders.map(escapeCell).join(' | ')} |\n`;
        markdown += `| ${formattedHeaders.map(() => '---').join(' | ')} |\n`;

        for (let i = 1; i < rowsToProcess.length; i++) {
          const row = rowsToProcess[i] || [];
          const rowData = Array.from(
            { length: formattedHeaders.length },
            (_, colIdx) => row[colIdx],
          );
          markdown += `| ${rowData.map(escapeCell).join(' | ')} |\n`;
        }

        markdown += '\n';

        if (isTruncated) {
          markdown += `*Note: Sheet "${worksheet.name}" was truncated. Only the first ${MAX_SHEET_ROWS} rows were processed.*\n\n`;
          warnings.push(`Sheet "${worksheet.name}" was truncated to ${MAX_SHEET_ROWS} rows.`);
        }
      });

      assertReadableText(markdown, 'Excel file');

      return {
        text: markdown.trim(),
        metadata: {
          parser: 'exceljs-xlsx',
          sheetCount: workbook.worksheets.length,
          wordCount: countWords(markdown),
          warnings: warnings.length > 0 ? warnings : undefined,
          tableMetadata: {
            sheets,
          },
        },
      };
    } catch (err) {
      throw new Error(
        `Failed to parse Excel file: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
