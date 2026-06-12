import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { assertWorkspaceOperational } from '@/src/lib/workspace-access';

export const dynamic = 'force-dynamic';

function contentTypeFor(fileType: string | null, filename: string): string {
  if (fileType && fileType.includes('/')) return fileType;
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    txt: 'text/plain; charset=utf-8',
    md: 'text/markdown; charset=utf-8',
    csv: 'text/csv; charset=utf-8',
    json: 'application/json',
    html: 'text/html; charset=utf-8',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return map[ext] || 'application/octet-stream';
}

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
      .select('id, filename, file_path, file_type, workspace_id')
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
    const contentType = contentTypeFor(document.file_type, document.filename);
    const safeName = document.filename.replace(/"/g, '');

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${safeName}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected document stream error';
    return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
  }
}
