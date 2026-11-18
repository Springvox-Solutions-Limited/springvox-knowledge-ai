import { getRequestErrorStatus, safeErrorMessage } from '@/src/lib/api-errors';
import {
  getMaxUploadBytes,
  getMaxUploadMb,
  HEADER_SAMPLE_BYTES,
  sanitizeFilename,
  validateUploadedDocument,
} from '@/src/lib/documents';
import { deleteDocumentVectors } from '@/src/lib/qdrant';
import { assertRateLimit, BETA_RATE_LIMITS, maybeRateLimitResponse } from '@/src/lib/rate-limit';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { logSystemEvent } from '@/src/lib/system-events';
import { incrementWorkspaceUsage } from '@/src/lib/usage-metering';
import { assertWorkspaceOperational } from '@/src/lib/workspace-access';
import { assertWorkspaceLimit, maybeLimitResponse } from '@/src/lib/workspace-limits';
import { WORKSPACE_ADMIN_ROLES } from '@/src/lib/workspace';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {

  let authenticatedUserId: string | null = null;
  let authenticatedWorkspaceId: string | null = null;
  let documentId: string | null = null;
  let uploadedFilePath: string | null = null;

  try {
    const { user, profile } = await getAuthenticatedUserWithProfile(req, WORKSPACE_ADMIN_ROLES);
    authenticatedUserId = user.id;
    authenticatedWorkspaceId = profile.workspace_id;
    await assertWorkspaceOperational(profile.workspace_id!);
    await assertRateLimit({
      key: profile.workspace_id!,
      scope: 'upload',
      ...BETA_RATE_LIMITS.upload,
      userId: user.id,
      workspaceId: profile.workspace_id,
    });
    const supabase = getSupabaseAdmin();
    const formData = await req.formData();
    const file = formData.get('file');
    const collectionIdRaw = formData.get('collectionId');
    const requestedCollectionId =
      typeof collectionIdRaw === 'string' && collectionIdRaw && collectionIdRaw !== 'none'
        ? collectionIdRaw
        : null;

    if (!(file instanceof File)) {
      return Response.json({ error: 'A supported document file (PDF, TXT, DOCX, CSV, XLSX, PPTX) is required' }, { status: 400 });
    }

    // Validate the collection belongs to this workspace before assigning.
    let collectionId: string | null = null;
    if (requestedCollectionId) {
      const { data: collection } = await supabase
        .from('collections')
        .select('id')
        .eq('id', requestedCollectionId)
        .eq('workspace_id', profile.workspace_id)
        .maybeSingle();
      collectionId = collection?.id ?? null;
    }

    const maxUploadMb = getMaxUploadMb();
    const maxUploadBytes = getMaxUploadBytes();

    if (file.size > maxUploadBytes) {
      return Response.json(
        {
          error: `This file is too large. Please upload a supported document up to ${maxUploadMb}MB.`,
        },
        { status: 400 },
      );
    }

    const filename = sanitizeFilename(file.name);
    if (!filename) {
      return Response.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Verify the bytes, not the browser-supplied name or MIME type. The
    // canonical type below comes only from signature/structure checks.
    const headerSample = new Uint8Array(
      await file.slice(0, HEADER_SAMPLE_BYTES).arrayBuffer(),
    );
    const validation = validateUploadedDocument({
      filename,
      head: headerSample,
      size: file.size,
    });

    if (!validation.ok) {
      return Response.json(
        { error: validation.error || 'Unsupported file type.' },
        { status: 400 },
      );
    }

    const verifiedMimeType = validation.mime as string;

    // Enforce configured per-workspace caps (no-op if unset / fails open).
    await assertWorkspaceLimit(profile.workspace_id!, 'uploads');
    await assertWorkspaceLimit(profile.workspace_id!, 'storage', file.size);

    documentId = crypto.randomUUID();
    uploadedFilePath = `${user.id}/${documentId}/${filename}`;

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'documents';
    if (!uploadedFilePath) {
      throw new Error("Missing document storage path");
    }

    const { error: documentError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        workspace_id: profile.workspace_id,
        user_id: user.id,
        filename,
        file_path: uploadedFilePath,
        file_type: verifiedMimeType,
        status: 'processing',
        error_message: null,
        total_chunks: 0,
        collection_id: collectionId,
      });

    if (documentError) {
      throw documentError || new Error('Failed to create document record');
    }

    const { error: uploadError } = await supabase.storage.from(bucket).upload(uploadedFilePath, file, {
      upsert: false,
      contentType: verifiedMimeType,
    });

    if (uploadError) {
      throw uploadError;
    }

    // Dispatch the background event to Inngest to parse, chunk, and embed asynchronously
    const { inngest } = await import('@/src/lib/inngest/client');
    await inngest.send({
      name: "document/process.started",
      data: {
        documentId,
        workspaceId: profile.workspace_id,
        storagePath: uploadedFilePath,
        originalFilename: filename,
        mimeType: verifiedMimeType,
        userId: user.id,
      },
    });

    await incrementWorkspaceUsage(profile.workspace_id!, {
      uploads_count: 1,
      storage_bytes: file.size,
    });

    return Response.json({
      success: true,
      documentId,
      status: 'processing',
    });
  } catch (error) {
    const rateLimit = maybeRateLimitResponse(error);
    if (rateLimit) return rateLimit;
    const limit = maybeLimitResponse(error);
    if (limit) return limit;

    const message = error instanceof Error ? error.message : 'Unexpected upload error';
    const status =
      message.startsWith('Unsupported file type') ||
            message.startsWith('No text') ||
            message === 'Invalid filename'
          ? 400
          : getRequestErrorStatus(message);

    if (documentId && authenticatedUserId && authenticatedWorkspaceId) {
      const supabase = getSupabaseAdmin();

      try {
        await supabase
          .from('document_chunks')
          .delete()
          .eq('document_id', documentId)
          .eq('workspace_id', authenticatedWorkspaceId);

        await deleteDocumentVectors(documentId, authenticatedWorkspaceId);

        if (uploadedFilePath) {
          const cleanupBucket = process.env.SUPABASE_STORAGE_BUCKET || 'documents';
          await supabase.storage.from(cleanupBucket).remove([uploadedFilePath]);
        }

        await supabase
          .from('documents')
          .update({
            status: 'failed',
            error_message: message,
            total_chunks: 0,
          })
          .eq('id', documentId)
          .eq('workspace_id', authenticatedWorkspaceId);
      } catch (cleanupError) {
        console.error('Upload cleanup error:', cleanupError);
      }
    }

    if (authenticatedWorkspaceId) {
      await logSystemEvent({
        workspaceId: authenticatedWorkspaceId,
        userId: authenticatedUserId,
        eventType: 'upload.failed',
        severity: 'error',
        message,
      });
    }

    console.error('Upload error:', error);
    return Response.json({ error: safeErrorMessage(message) }, { status });
  }
}
