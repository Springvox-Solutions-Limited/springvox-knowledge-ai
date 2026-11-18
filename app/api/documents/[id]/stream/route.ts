import { getRequestErrorStatus, safeErrorMessage } from '@/src/lib/api-errors';
import {
  contentDispositionFilename,
  HEADER_SAMPLE_BYTES,
  resolveStreamContentType,
} from '@/src/lib/documents';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { assertWorkspaceOperational } from '@/src/lib/workspace-access';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req);
    await assertWorkspaceOperational(profile.workspace_id!);
    const { id } = await params;

    const supabase = getSupabaseAdmin();

    // Look up the document and enforce tenant isolation: a user may only stream
    // a file whose workspace_id matches their own.
    const { data: document, error } = await supabase
      .from('documents')
      .select('id, filename, file_path, workspace_id')
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)
      .maybeSingle();

    if (error || !document) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!document.file_path) {
      return Response.json({ error: 'This document has no stored file' }, { status: 404 });
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'documents';
    const { data: blob, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(document.file_path);

    if (downloadError || !blob) {
      return Response.json({ error: 'File could not be retrieved' }, { status: 404 });
    }

    const arrayBuffer = await blob.arrayBuffer();

    // Never trust `documents.file_type` (legacy rows may hold a spoofed MIME
    // value). The response type is derived from the bytes we are about to
    // serve; anything that does not validate is downloaded, not rendered.
    const head = new Uint8Array(
      arrayBuffer,
      0,
      Math.min(arrayBuffer.byteLength, HEADER_SAMPLE_BYTES),
    );
    const { contentType, disposition } = resolveStreamContentType({
      filename: document.filename,
      head,
    });
    const safeName = contentDispositionFilename(document.filename);

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `${disposition}; filename="${safeName}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'same-origin',
    };

    // A CSP sandbox neutralises any script if a browser ignores nosniff. It is
    // omitted for PDFs because it can suppress the built-in PDF viewer; PDF
    // safety relies on the verified `application/pdf` type plus nosniff.
    if (contentType !== 'application/pdf') {
      headers['Content-Security-Policy'] = "default-src 'none'; sandbox";
    }

    return new Response(arrayBuffer, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected document stream error';
    return Response.json({ error: safeErrorMessage(message) }, { status: getRequestErrorStatus(message) });
  }
}
