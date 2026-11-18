/**
 * P0-1 security regression tests.
 *
 * These are unit tests for the content-validation and response-type logic in
 * src/lib/documents.ts plus static invariants for the two route handlers.
 * They run without Supabase/Qdrant/network access.
 *
 * Run: npx tsx --test tests/p0-1-file-security.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  contentDispositionFilename,
  resolveStreamContentType,
  sniffDocumentFamily,
  validateUploadedDocument,
} from '../src/lib/documents';
import { resolveType } from '../src/components/file-preview/FilePreviewRenderer';

const encoder = new TextEncoder();

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, array) => sum + array.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}

function bytes(values: number[]): Uint8Array {
  return new Uint8Array(values);
}

function pdfBytes(leadingJunk = '') {
  return encoder.encode(
    `${leadingJunk}%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\nstream\nBT (hello) Tj ET\nendstream\n%%EOF\n`,
  );
}

const htmlBytes = encoder.encode(
  '<!DOCTYPE html><html><body><script>alert(document.domain)</script></body></html>',
);
const svgBytes = encoder.encode(
  '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(document.domain)"></svg>',
);
const textBytes = encoder.encode('Quarterly report\nRevenue: 42\nAll good.\n');
const csvBytes = encoder.encode('name,amount\nalpha,10\nbeta,20\n');
const elfBytes = bytes([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]);
const mzBytes = bytes([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);
const pngBytes = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const gifBytes = encoder.encode('GIF89a\x01\x00\x01\x00\x00\x00\x00;');
const randomBytes = bytes([0x13, 0x37, 0xde, 0xad, 0xbe, 0xef, 0x00, 0x01, 0x02]);

function ooxmlBytes(marker: 'word/document.xml' | 'xl/workbook.xml' | 'ppt/presentation.xml') {
  return concat(
    bytes([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]),
    encoder.encode('[Content_Types].xml'),
    encoder.encode('docProps/app.xml'),
    encoder.encode(marker),
  );
}

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';

function validate(filename: string, head: Uint8Array, size = Math.max(head.length, 1)) {
  return validateUploadedDocument({ filename, head, size });
}

test('sniffDocumentFamily identifies containers from bytes', () => {
  assert.equal(sniffDocumentFamily(pdfBytes()), 'pdf');
  assert.equal(sniffDocumentFamily(htmlBytes), 'text');
  assert.equal(sniffDocumentFamily(textBytes), 'text');
  assert.equal(sniffDocumentFamily(pngBytes), 'png');
  assert.equal(sniffDocumentFamily(gifBytes), 'gif');
  assert.equal(sniffDocumentFamily(ooxmlBytes('word/document.xml')), 'docx');
  assert.equal(sniffDocumentFamily(ooxmlBytes('xl/workbook.xml')), 'xlsx');
  assert.equal(sniffDocumentFamily(ooxmlBytes('ppt/presentation.xml')), 'pptx');
  assert.equal(sniffDocumentFamily(randomBytes), null);
  assert.equal(sniffDocumentFamily(new Uint8Array()), null);
});

test('malicious HTML renamed to .pdf is rejected', () => {
  const result = validate('invoice.pdf', htmlBytes);
  assert.equal(result.ok, false);
  assert.match(String(result.error), /does not match|Could not verify/i);
});

test('SVG renamed to .pdf is rejected', () => {
  assert.equal(validate('chart.pdf', svgBytes).ok, false);
});

test('executable renamed to an allowed extension is rejected', () => {
  assert.equal(validate('report.pdf', elfBytes).ok, false);
  assert.equal(validate('report.docx', mzBytes).ok, false);
});

test('PDF bytes are classified as application/pdf (no client MIME input)', () => {
  // validateUploadedDocument deliberately takes no client MIME argument, so a
  // forged `text/html` File.type cannot influence the stored/streamed type.
  // The route-level invariant is asserted separately below.
  const result = validate('contract.pdf', pdfBytes());
  assert.equal(result.ok, true);
  assert.equal(result.mime, 'application/pdf');
  assert.equal(result.extension, '.pdf');
});

test('valid PDF is accepted', () => {
  assert.equal(validate('handbook.pdf', pdfBytes()).ok, true);
});

test('valid PDF with permitted leading junk is accepted', () => {
  assert.equal(validate('handbook.pdf', pdfBytes('junk-before-header\n')).ok, true);
});

test('valid text document is accepted as text/plain', () => {
  const result = validate('notes.txt', textBytes);
  assert.equal(result.ok, true);
  assert.equal(result.mime, 'text/plain');
});

test('valid CSV is accepted as text/csv', () => {
  const result = validate('export.csv', csvBytes);
  assert.equal(result.ok, true);
  assert.equal(result.mime, 'text/csv');
});

test('valid OOXML documents are accepted with their canonical MIME types', () => {
  for (const [name, marker, mime] of [
    ['a.docx', 'word/document.xml', DOCX_MIME],
    ['a.xlsx', 'xl/workbook.xml', XLSX_MIME],
    ['a.pptx', 'ppt/presentation.xml', PPTX_MIME],
  ] as const) {
    const result = validate(name, ooxmlBytes(marker));
    assert.equal(result.ok, true, `${name} should be accepted`);
    assert.equal(result.mime, mime);
  }
});

test('a ZIP entry named like a word ("password/") is not mistaken for DOCX', () => {
  const zipWithPasswordCell = concat(
    bytes([0x50, 0x4b, 0x03, 0x04]),
    encoder.encode('[Content_Types].xml'),
    encoder.encode('xl/workbook.xml'),
    encoder.encode('password/'),
  );
  assert.equal(sniffDocumentFamily(zipWithPasswordCell), 'xlsx');
  assert.equal(validate('book.xlsx', zipWithPasswordCell).ok, true);
  assert.equal(validate('book.docx', zipWithPasswordCell).ok, false);
});

test('OOXML container must match the extension', () => {
  assert.equal(validate('sheet.docx', ooxmlBytes('xl/workbook.xml')).ok, false);
  assert.equal(validate('doc.xlsx', ooxmlBytes('word/document.xml')).ok, false);
});

test('docx without ZIP structure is rejected', () => {
  assert.equal(validate('fake.docx', htmlBytes).ok, false);
});

test('unsupported file types are rejected', () => {
  for (const name of ['photo.png', 'page.html', 'vector.svg', 'run.exe', 'archive.zip', 'no-extension']) {
    const result = validate(name, pngBytes);
    assert.equal(result.ok, false, `${name} must be rejected`);
    assert.match(String(result.error), /Unsupported file type/);
  }
});

test('empty files are rejected', () => {
  const result = validate('empty.pdf', new Uint8Array(), 0);
  assert.equal(result.ok, false);
  assert.match(String(result.error), /empty/i);
});

test('stream type is derived from bytes, not the stored file_type', () => {
  // HTML content behind a .pdf name/legacy MIME must never be served as HTML
  // or PDF. It is downgraded to an opaque download.
  const htmlPdf = resolveStreamContentType({ filename: 'evil.pdf', head: htmlBytes });
  assert.equal(htmlPdf.contentType, 'application/octet-stream');
  assert.equal(htmlPdf.disposition, 'attachment');

  const realPdf = resolveStreamContentType({ filename: 'good.pdf', head: pdfBytes() });
  assert.equal(realPdf.contentType, 'application/pdf');
  assert.equal(realPdf.disposition, 'inline');
});

test('stream downgrades extension/content mismatches', () => {
  const pdfAsText = resolveStreamContentType({ filename: 'renamed.txt', head: pdfBytes() });
  assert.equal(pdfAsText.contentType, 'application/octet-stream');
  assert.equal(pdfAsText.disposition, 'attachment');

  const pngAsPdf = resolveStreamContentType({ filename: 'image.pdf', head: pngBytes });
  assert.equal(pngAsPdf.contentType, 'application/octet-stream');
});

test('HTML bytes streamed as text stay inert (text/plain, text/csv)', () => {
  assert.equal(
    resolveStreamContentType({ filename: 'page.html', head: htmlBytes }).contentType,
    'application/octet-stream',
  );
  assert.equal(
    resolveStreamContentType({ filename: 'vector.svg', head: svgBytes }).contentType,
    'application/octet-stream',
  );
  assert.equal(
    resolveStreamContentType({ filename: 'evil.csv', head: htmlBytes }).contentType,
    'text/csv; charset=utf-8',
  );
});

test('valid legacy images stream inline as image types', () => {
  const png = resolveStreamContentType({ filename: 'photo.png', head: pngBytes });
  assert.equal(png.contentType, 'image/png');
  assert.equal(png.disposition, 'inline');

  const gif = resolveStreamContentType({ filename: 'anim.gif', head: gifBytes });
  assert.equal(gif.contentType, 'image/gif');
});

test('valid text/markdown streams inline; office files download', () => {
  const txt = resolveStreamContentType({ filename: 'notes.txt', head: textBytes });
  assert.equal(txt.contentType, 'text/plain; charset=utf-8');
  assert.equal(txt.disposition, 'inline');

  const md = resolveStreamContentType({ filename: 'readme.md', head: textBytes });
  assert.equal(md.contentType, 'text/markdown; charset=utf-8');

  const docx = resolveStreamContentType({ filename: 'a.docx', head: ooxmlBytes('word/document.xml') });
  assert.equal(docx.contentType, DOCX_MIME);
  assert.equal(docx.disposition, 'attachment');
});

test('empty or random bytes stream as opaque attachments', () => {
  assert.equal(
    resolveStreamContentType({ filename: 'x.pdf', head: new Uint8Array() }).contentType,
    'application/octet-stream',
  );
  assert.equal(
    resolveStreamContentType({ filename: 'x.pdf', head: randomBytes }).disposition,
    'attachment',
  );
});

const SAFE_STREAM_TYPES = new Set([
  'application/pdf',
  'application/octet-stream',
  'text/plain; charset=utf-8',
  'text/markdown; charset=utf-8',
  'text/csv; charset=utf-8',
  DOCX_MIME,
  XLSX_MIME,
  PPTX_MIME,
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);

test('fuzz: no allowed extension can produce HTML or SVG output', () => {
  const extensions = ['.pdf', '.txt', '.csv', '.docx', '.xlsx', '.pptx', '.md', '.png'];
  let seed = 123456789;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed % 256;
  };

  for (let round = 0; round < 250; round += 1) {
    const length = 1 + (round % 64);
    const head = new Uint8Array(length);
    for (let index = 0; index < length; index += 1) head[index] = next();
    const extension = extensions[round % extensions.length];
    const { contentType, disposition } = resolveStreamContentType({
      filename: `fuzz${extension}`,
      head,
    });
    assert.ok(SAFE_STREAM_TYPES.has(contentType), `unexpected content type: ${contentType}`);
    assert.ok(disposition === 'inline' || disposition === 'attachment');
    assert.ok(!contentType.includes('\n') && !contentType.includes('\r'));
    if (contentType === 'application/octet-stream') assert.equal(disposition, 'attachment');
  }
});

test('content-disposition filename cannot inject headers', () => {
  const name = contentDispositionFilename('evil"\r\nX-Injected: yes\\name.pdf');
  assert.ok(!name.includes('"'));
  assert.ok(!name.includes('\r'));
  assert.ok(!name.includes('\n'));
  assert.ok(!name.includes('\\'));
  assert.equal(contentDispositionFilename('   '), 'document');
});

test('renderer never routes HTML/SVG or unknown bytes to a renderer', () => {
  // The original exploit: HTML bytes named .pdf must not reach the PDF iframe.
  assert.equal(resolveType('text/html'), 'download');
  assert.equal(resolveType('text/html; charset=utf-8'), 'download');
  assert.equal(resolveType('image/svg+xml'), 'download');
  assert.equal(resolveType('application/octet-stream'), 'download');
  assert.equal(resolveType('application/javascript'), 'download');
  assert.equal(resolveType(''), 'download');
  assert.equal(resolveType('.pdf'), 'download');
  assert.equal(resolveType('application/pdf'), 'pdf');
});

test('renderer maps the server-verified MIME types', () => {
  assert.equal(resolveType('text/plain; charset=utf-8'), 'text');
  assert.equal(resolveType('text/csv; charset=utf-8'), 'csv');
  assert.equal(resolveType('text/markdown; charset=utf-8'), 'markdown');
  assert.equal(resolveType('image/png'), 'image');
  assert.equal(resolveType('image/jpeg'), 'image');
  assert.equal(resolveType(DOCX_MIME), 'docx');
  assert.equal(resolveType(XLSX_MIME), 'xlsx');
});

test('static invariant: upload route never reads the browser MIME type', () => {
  const source = readFileSync(
    fileURLToPath(new URL('../app/api/documents/upload/route.ts', import.meta.url)),
    'utf8',
  );
  assert.ok(!source.includes('file.type'), 'upload route must not trust file.type');
  assert.ok(source.includes('validateUploadedDocument'));
  assert.ok(source.includes('HEADER_SAMPLE_BYTES'));
  // The verified MIME must be the only value written to the row, the storage
  // object and the ingestion event.
  assert.ok((source.match(/verifiedMimeType/g) || []).length >= 3);
});

test('static invariant: stream route keeps workspace scoping and verified type', () => {
  const source = readFileSync(
    fileURLToPath(new URL('../app/api/documents/[id]/stream/route.ts', import.meta.url)),
    'utf8',
  );
  assert.ok(source.includes(".eq('workspace_id', profile.workspace_id)"));
  assert.ok(source.includes('resolveStreamContentType'));
  assert.ok(!source.includes('text/html'));
  assert.ok(!source.includes('image/svg+xml'));
});
