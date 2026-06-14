import { v4 as uuidv4 } from 'uuid';
import { inngest } from './client';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';
import { buildPreview, chunkDocumentText } from '@/src/lib/documents';
import { embedMany, generateDocumentIntelligence, getEmbeddingProvider } from '@/src/lib/ai';
import { COLLECTION_NAME, ensureQdrantCollection, qdrant } from '@/src/lib/qdrant';
import { parseDocument } from '@/src/lib/document-parsers';
import { sendEmail } from '@/src/lib/email';
import { buildTrialExpiredEmail } from '@/src/lib/email/templates/trial-expired';
import { buildTrialReminderEmail } from '@/src/lib/email/templates/trial-reminder';
import { buildPlatformNotificationEmail } from '@/src/lib/email/templates/platform-notification';
import { buildWorkspaceDeletedEmail } from '@/src/lib/email/templates/lifecycle';
import { createAuditLog } from '@/src/lib/audit-log';
import { deleteWorkspaceVectors } from '@/src/lib/qdrant';
import { logSystemEvent } from '@/src/lib/system-events';
import { estimateTokens, incrementWorkspaceUsage } from '@/src/lib/usage-metering';

type SerializedError = {
  message: string;
  name?: string;
  stack?: string;
  code?: unknown;
  status?: unknown;
  details?: unknown;
  body?: unknown;
  raw?: string;
};

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    const extended = error as Error & {
      code?: unknown;
      status?: unknown;
      details?: unknown;
      body?: unknown;
      cause?: unknown;
    };

    return {
      message: error.message || error.name || 'Unknown error',
      name: error.name,
      stack: error.stack,
      code: extended.code,
      status: extended.status,
      details: extended.details || extended.cause,
      body: extended.body,
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const message =
      getStringValue(record.message) ||
      getStringValue(record.error_description) ||
      getStringValue(record.error) ||
      getStringValue(record.hint) ||
      safeStringify(error) ||
      'Unknown object error';

    return {
      message,
      name: getStringValue(record.name),
      stack: getStringValue(record.stack),
      code: record.code,
      status: record.status || record.statusCode,
      details: record.details || record.hint || record.cause,
      body: record.body || record.response || record.data,
      raw: safeStringify(error),
    };
  }

  return {
    message: error == null ? 'Unknown error' : String(error),
  };
}

function getStringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function safeStringify(value: unknown) {
  try {
    const seen = new WeakSet<object>();

    return JSON.stringify(value, (_key, nestedValue) => {
      if (typeof nestedValue === 'object' && nestedValue !== null) {
        if (seen.has(nestedValue)) {
          return '[Circular]';
        }

        seen.add(nestedValue);
      }

      return nestedValue;
    });
  } catch {
    try {
      return String(value);
    } catch {
      return null;
    }
  }
}

function formatSerializedError(serialized: SerializedError) {
  const parts = [serialized.message];

  if (serialized.code) {
    parts.push(`code=${String(serialized.code)}`);
  }

  if (serialized.status) {
    parts.push(`status=${String(serialized.status)}`);
  }

  if (serialized.details) {
    parts.push(`details=${safeStringify(serialized.details) || String(serialized.details)}`);
  }

  if (serialized.body) {
    parts.push(`body=${safeStringify(serialized.body) || String(serialized.body)}`);
  }

  return parts.filter(Boolean).join(' | ').slice(0, 2000);
}

function toOperationError(operation: string, error: unknown) {
  const serialized = serializeError(error);
  const wrapped = new Error(`${operation} failed: ${formatSerializedError(serialized)}`);
  wrapped.name = serialized.name || 'IngestionOperationError';
  wrapped.stack = serialized.stack || wrapped.stack;
  return wrapped;
}

function isMissingDocumentMetadataColumnError(error: unknown) {
  const serialized = serializeError(error);
  const message = serialized.message.toLowerCase();

  return (
    serialized.code === 'PGRST204' &&
    (message.includes("'parser' column") ||
      message.includes("'parser_metadata' column") ||
      message.includes("'word_count' column") ||
      message.includes("'document_summary' column") ||
      message.includes("'document_keywords' column") ||
      message.includes("'document_category' column"))
  );
}

function inferDocumentCategory(filename: string, parser?: string | null) {
  const lower = filename.toLowerCase();

  if (parser?.includes('xlsx') || parser?.includes('csv') || /\.(xlsx|csv)$/.test(lower)) return 'Spreadsheet';
  if (lower.includes('policy') || lower.includes('handbook')) return 'Policy';
  if (lower.includes('contract') || lower.includes('agreement')) return 'Contract';
  if (lower.includes('manual')) return 'Manual';
  if (lower.includes('guide') || lower.includes('cisco')) return 'Technical Guide';
  if (lower.endsWith('.pptx')) return 'Presentation';
  if (lower.includes('report') || lower.includes('financial')) return 'Financial Report';
  return 'Other';
}

async function runLoggedOperation<T>(operation: string, fn: () => Promise<T> | T) {
  console.info(`[Inngest] ${operation} started`);

  try {
    const result = await fn();
    console.info(`[Inngest] ${operation} completed`);
    return result;
  } catch (error) {
    const serialized = serializeError(error);
    console.error(`[Inngest] ${operation} failed`, serialized);
    throw toOperationError(operation, error);
  }
}

export const processDocument = inngest.createFunction(
  { id: "process-document", retries: 3, triggers: [{ event: "document/process.started" }] },
  async ({ event, step }) => {
    const { documentId, workspaceId, storagePath, originalFilename, mimeType, userId } =
      event.data as any;

    try {
      // Keep the full file, extracted text, chunks, and vectors inside this step.
      // Inngest checkpoints step return values, so returning those large payloads
      // can exceed response limits for PDFs, spreadsheets, and presentations.
      const processedSummary = await step.run("process-document", async () => {
        const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'documents';
        if (!storagePath) {
          throw toOperationError('download-file', new Error("Missing document storage path"));
        }

        const supabase = getSupabaseAdmin();
        const buffer = await runLoggedOperation('download-file', async () => {
          console.info(`[Inngest] Downloading document from bucket: "${bucket}", path: "${storagePath}"`);
          const { data, error } = await supabase.storage
            .from(bucket)
            .download(storagePath);

          if (error) {
            throw toOperationError('download-file', error);
          }

          if (!data) {
            throw new Error("File not found in storage");
          }

          return Buffer.from(await data.arrayBuffer());
        });

        const parsedResult = await runLoggedOperation('parse-content', () =>
          parseDocument({
            buffer,
            filename: originalFilename,
            mimeType,
          }),
        );

        const parserMetadata = parsedResult.metadata;
        const chunks = chunkDocumentText(parsedResult.text);

        if (chunks.length === 0) {
          throw new Error('No readable text could be extracted from this document.');
        }

        await runLoggedOperation('qdrant-ensure-collection', () => ensureQdrantCollection());

        const documentIntelligence = await runLoggedOperation('document-intelligence', async () => {
          try {
            return await generateDocumentIntelligence({
              filename: originalFilename,
              text: parsedResult.text,
              parser: parserMetadata?.parser || null,
            });
          } catch (error) {
            console.warn('[Inngest] document-intelligence skipped', serializeError(error));
            return {
              summary: buildPreview(parsedResult.text, 500),
              keywords: originalFilename
                .replace(/\.[^.]+$/, '')
                .split(/[\s_\-.,]+/)
                .filter(Boolean)
                .slice(0, 8),
              category: inferDocumentCategory(originalFilename, parserMetadata?.parser),
            };
          }
        });

        await runLoggedOperation('cleanup-existing-index', async () => {
          await qdrant.delete(COLLECTION_NAME, {
            filter: {
              must: [
                { key: 'document_id', match: { value: documentId } },
                { key: 'workspace_id', match: { value: workspaceId } },
              ],
            },
          });

          const { error: chunkDeleteError } = await supabase
            .from('document_chunks')
            .delete()
            .eq('document_id', documentId)
            .eq('workspace_id', workspaceId);

          if (chunkDeleteError) {
            throw toOperationError('cleanup-existing-index', chunkDeleteError);
          }
        });
        
        const chunkRows = [];
        const points = [];
        const vectors = await runLoggedOperation('embed-many', () => embedMany(chunks, { inputType: 'document' }));
        await incrementWorkspaceUsage(workspaceId, {
          embedding_calls: Math.ceil(chunks.length / 20),
          embedding_tokens: estimateTokens(chunks.join('\n')),
        });
        
        for (const [index, chunkText] of chunks.entries()) {
          const chunkIndex = index + 1;
          const pointId = uuidv4();
          // NOTE: If Qdrant or the embedding provider fails here, this whole step retries natively via Inngest
          const vector = vectors[index];

          chunkRows.push({
            user_id: userId,
            workspace_id: workspaceId,
            document_id: documentId,
            chunk_index: chunkIndex,
            chunk_text: chunkText,
            qdrant_point_id: pointId,
            table_metadata: parserMetadata?.tableMetadata || {},
          });

          points.push({
            id: pointId,
            vector,
            payload: {
              workspace_id: workspaceId,
              uploaded_by: userId,
              document_id: documentId,
              filename: originalFilename,
              document_summary: documentIntelligence.summary,
              document_keywords: documentIntelligence.keywords,
              document_category: documentIntelligence.category,
              table_metadata: parserMetadata?.tableMetadata || {},
              chunk_index: chunkIndex,
              chunk_text: chunkText,
              preview: buildPreview(chunkText),
            },
          });
        }

        await runLoggedOperation('qdrant-upsert', async () => {
          await qdrant.upsert(COLLECTION_NAME, {
            wait: true,
            points,
          });
        });

        await runLoggedOperation('insert-chunks', async () => {
          const { error: chunkInsertError } = await supabase.from('document_chunks').insert(chunkRows);
          if (chunkInsertError) {
            throw toOperationError('insert-chunks', chunkInsertError);
          }
        });

        await runLoggedOperation('mark-ready', async () => {
          const { error: completeError } = await supabase
            .from('documents')
            .update({
              status: 'ready',
              error_message: null,
              total_chunks: chunkRows.length,
              parser: parserMetadata?.parser || null,
              parser_metadata: parserMetadata || null,
              word_count: parserMetadata?.wordCount || null,
              document_summary: documentIntelligence.summary || null,
              document_keywords: documentIntelligence.keywords || [],
              document_category: documentIntelligence.category || 'Other',
            })
            .eq('id', documentId);

          if (completeError) {
            if (isMissingDocumentMetadataColumnError(completeError)) {
              console.warn(
                '[Inngest] mark-ready metadata columns missing; falling back to core document status update. Run sql/document_parser_metadata.sql to store parser metadata.',
                serializeError(completeError),
              );

              const { error: fallbackError } = await supabase
                .from('documents')
                .update({
                  status: 'ready',
                  error_message: null,
                  total_chunks: chunkRows.length,
                })
                .eq('id', documentId);

              if (fallbackError) {
                throw toOperationError('mark-ready', fallbackError);
              }

              return;
            }

            throw toOperationError('mark-ready', completeError);
          }
        });

        await incrementWorkspaceUsage(workspaceId, {
          documents_count: 1,
        });

        return {
          totalChunks: chunkRows.length,
          parser: parserMetadata?.parser || null,
          embeddingProvider: getEmbeddingProvider(),
          wordCount: parserMetadata?.wordCount || null,
          documentCategory: documentIntelligence.category || 'Other',
        };
      });

      return { success: true, documentId, totalChunks: processedSummary.totalChunks };
    } catch (error) {
      const serialized = serializeError(error);
      const readableMessage = formatSerializedError(serialized);
      console.error('[Inngest] process-document failed', serialized);
      await logSystemEvent({
        workspaceId,
        userId,
        eventType: 'ingestion.failed',
        severity: 'error',
        message: readableMessage,
        metadata: { document_id: documentId, filename: originalFilename },
      });

      // Record failure on the document
      await step.run("mark-failed", async () => {
        const supabase = getSupabaseAdmin();
        const { error: markFailedError } = await supabase
          .from('documents')
          .update({
            status: 'failed',
            error_message: readableMessage,
          })
          .eq('id', documentId);

        if (markFailedError) {
          console.error('[Inngest] mark-failed failed', serializeError(markFailedError));
        }
      });
      // Rethrow to fail the Inngest function
      throw toOperationError('process-document', error);
    }
  }
);

export const deleteWorkspaceData = inngest.createFunction(
  { id: 'delete-workspace-data', retries: 1, triggers: [{ event: 'workspace/delete.started' }] },
  async ({ event, step }) => {
    const { workspaceId, actorUserId, force } = event.data as {
      workspaceId: string;
      actorUserId?: string | null;
      force?: boolean;
    };

    await step.run('mark-deleting', async () => {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from('workspaces')
        .update({
          deletion_status: 'deleting',
          status: 'suspended',
          subscription_status: 'suspended',
          billing_status: 'suspended',
          updated_at: new Date().toISOString(),
        })
        .eq('id', workspaceId);

      if (error) throw error;
      await logSystemEvent({
        workspaceId,
        userId: actorUserId,
        eventType: 'workspace_deletion.started',
        severity: force ? 'critical' : 'warning',
        message: 'Workspace deletion started.',
      });
    });

    // Email the admin before their profile is purged.
    await step.run('notify-workspace-admin-deleted', async () => {
      const supabase = getSupabaseAdmin();
      const [{ data: workspaceRow }, { data: admin }] = await Promise.all([
        supabase.from('workspaces').select('name').eq('id', workspaceId).maybeSingle(),
        supabase
          .from('profiles')
          .select('email')
          .eq('workspace_id', workspaceId)
          .in('role', ['tenant_admin', 'admin', 'content_manager'])
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);
      if (admin?.email) {
        await sendEmail({
          to: admin.email,
          ...buildWorkspaceDeletedEmail({ workspaceName: workspaceRow?.name || 'your workspace' }),
        });
      }
    });

    await step.run('delete-qdrant-vectors', () => deleteWorkspaceVectors(workspaceId));

    await step.run('delete-storage-files', async () => {
      const supabase = getSupabaseAdmin();
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'documents';
      const { data: documents, error } = await supabase
        .from('documents')
        .select('file_path')
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      const paths = (documents || []).map((document) => document.file_path).filter(Boolean);
      for (let index = 0; index < paths.length; index += 100) {
        const batch = paths.slice(index, index + 100);
        if (batch.length > 0) {
          const { error: removeError } = await supabase.storage.from(bucket).remove(batch);
          if (removeError) throw removeError;
        }
      }
    });

    await step.run('delete-workspace-rows', async () => {
      const supabase = getSupabaseAdmin();
      const tables = [
        'document_chunks',
        'documents',
        'chat_messages',
        'chat_sessions',
        'invitations',
        'platform_notifications',
        'workspace_usage_daily',
        'rag_eval_sets',
      ];

      for (const table of tables) {
        const { error } = await supabase.from(table).delete().eq('workspace_id', workspaceId);
        if (error) throw error;
      }

      // Permanently erase tenant members — auth account + profile (GDPR right-to-erasure).
      // Platform admins are never deleted.
      const { data: members } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('workspace_id', workspaceId);

      for (const member of members || []) {
        if (member.role === 'platform_admin') continue;
        try {
          await supabase.auth.admin.deleteUser(member.id);
        } catch (authDeleteError) {
          // Best-effort: a missing/already-deleted auth user must not abort the purge.
          console.warn('Failed to delete auth user during workspace deletion:', member.id, authDeleteError);
        }
      }

      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .eq('workspace_id', workspaceId)
        .neq('role', 'platform_admin');

      if (profilesError) throw profilesError;
    });

    await step.run('mark-deleted', async () => {
      const supabase = getSupabaseAdmin();
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('workspaces')
        .update({
          status: 'suspended',
          subscription_status: 'suspended',
          billing_status: 'suspended',
          deletion_status: 'deleted',
          deleted_at: now,
          updated_at: now,
        })
        .eq('id', workspaceId);

      if (error) throw error;
      if (actorUserId) {
        await createAuditLog({
          workspaceId,
          actorUserId,
          action: 'workspace.deleted',
          metadata: { force: Boolean(force) },
        });
      }
      await logSystemEvent({
        workspaceId,
        userId: actorUserId,
        eventType: 'workspace_deletion.completed',
        severity: 'critical',
        message: 'Workspace deletion completed.',
      });
    });

    return { success: true, workspaceId };
  },
);

export const scheduledWorkspaceDeletionCheck = inngest.createFunction(
  { id: 'scheduled-workspace-deletion-check', retries: 1, triggers: [{ cron: '0 * * * *' }] },
  async ({ step }) => {
    return step.run('queue-due-workspace-deletions', async () => {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('workspaces')
        .select('id')
        .eq('deletion_status', 'scheduled')
        .lte('deletion_scheduled_for', new Date().toISOString())
        .limit(25);

      if (error) throw error;

      const dueWorkspaces = data || [];
      await Promise.all(
        dueWorkspaces.map((workspace) =>
          inngest.send({
            name: 'workspace/delete.started',
            data: { workspaceId: workspace.id, actorUserId: null, force: false },
          }),
        ),
      );

      return { queued: dueWorkspaces.length };
    });
  },
);

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function daysBefore(dateValue: string, days: number) {
  const date = new Date(dateValue);
  date.setDate(date.getDate() - days);
  return date;
}

async function loadWorkspaceTrialRecipient(workspaceId: string) {
  const supabase = getSupabaseAdmin();
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, name, trial_ends_at, subscription_status')
    .eq('id', workspaceId)
    .maybeSingle();

  if (workspaceError || !workspace) {
    throw workspaceError || new Error('Workspace not found');
  }

  const { data: admin, error: adminError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('workspace_id', workspaceId)
    .eq('role', 'tenant_admin')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (adminError) {
    throw adminError;
  }

  if (!admin?.email) {
    throw new Error('No active workspace admin email found');
  }

  return { workspace, admin };
}

export const sendTrialLifecycleEmails = inngest.createFunction(
  { id: 'send-trial-lifecycle-emails', retries: 2, triggers: [{ event: 'workspace/trial.started' }] },
  async ({ event, step }) => {
    const { workspaceId, trialEndsAt } = event.data;

    // Welcome + trial-started emails are sent inline at workspace creation
    // (app/api/workspaces/create). This function now only schedules the
    // time-delayed reminders, which genuinely need a background scheduler.
    const threeDayReminderAt = daysBefore(trialEndsAt, 3);
    const oneDayReminderAt = daysBefore(trialEndsAt, 1);

    if (threeDayReminderAt.getTime() > Date.now()) {
      await step.sleepUntil('wait-until-3-day-reminder', threeDayReminderAt);
      await step.sendEvent('send-3-day-trial-reminder', {
        name: 'workspace/trial.reminder',
        data: { workspaceId, daysRemaining: 3 },
      });
    }

    if (oneDayReminderAt.getTime() > Date.now()) {
      await step.sleepUntil('wait-until-1-day-reminder', oneDayReminderAt);
      await step.sendEvent('send-1-day-trial-reminder', {
        name: 'workspace/trial.reminder',
        data: { workspaceId, daysRemaining: 1 },
      });
    }

    const expiresAt = new Date(trialEndsAt);
    if (expiresAt.getTime() > Date.now()) {
      await step.sleepUntil('wait-until-trial-expired', expiresAt);
    }

    await step.sendEvent('send-trial-expired-email', {
      name: 'workspace/trial.expired',
      data: { workspaceId },
    });

    return { success: true, workspaceId };
  },
);

export const sendTrialReminderEmail = inngest.createFunction(
  { id: 'send-trial-reminder-email', retries: 2, triggers: [{ event: 'workspace/trial.reminder' }] },
  async ({ event, step }) => {
    const { workspaceId, daysRemaining } = event.data;

    return step.run('send-trial-reminder-email', async () => {
      const { workspace, admin } = await loadWorkspaceTrialRecipient(workspaceId);
      if (workspace.subscription_status !== 'trial') {
        return { skipped: true, reason: 'workspace is no longer trialing' };
      }

      const email = buildTrialReminderEmail({
        workspaceName: workspace.name,
        daysRemaining,
        appUrl: getAppUrl(),
      });
      await sendEmail({ to: admin.email!, ...email });
      return { skipped: false };
    });
  },
);

export const sendTrialExpiredEmail = inngest.createFunction(
  { id: 'send-trial-expired-email', retries: 2, triggers: [{ event: 'workspace/trial.expired' }] },
  async ({ event, step }) => {
    const { workspaceId } = event.data;

    return step.run('expire-trial-and-send-email', async () => {
      const { workspace, admin } = await loadWorkspaceTrialRecipient(workspaceId);
      const supabase = getSupabaseAdmin();

      if (workspace.subscription_status === 'trial') {
        const { error } = await supabase
          .from('workspaces')
          .update({
            status: 'expired',
            subscription_status: 'expired',
            billing_status: 'expired',
            payment_required_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', workspaceId)
          .eq('subscription_status', 'trial');

        if (error) {
          throw error;
        }
      }

      const email = buildTrialExpiredEmail({
        workspaceName: workspace.name,
        appUrl: getAppUrl(),
      });
      await sendEmail({ to: admin.email!, ...email });
      return { success: true };
    });
  },
);

export const dailyTrialExpiryCheck = inngest.createFunction(
  { id: 'daily-trial-expiry-check', retries: 2, triggers: [{ cron: '0 9 * * *' }] },
  async ({ step }) => {
    return step.run('expire-overdue-trials', async () => {
      const supabase = getSupabaseAdmin();
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('workspaces')
        .select('id')
        .eq('subscription_status', 'trial')
        .lte('trial_ends_at', now);

      if (error) {
        throw error;
      }

      const workspaceIds = (data || []).map((item) => item.id);
      if (workspaceIds.length === 0) {
        return { expired: 0 };
      }

      const { error: updateError } = await supabase
        .from('workspaces')
        .update({
          status: 'expired',
          subscription_status: 'expired',
          billing_status: 'expired',
          payment_required_at: now,
          updated_at: now,
        })
        .in('id', workspaceIds);

      if (updateError) {
        throw updateError;
      }

      return { expired: workspaceIds.length };
    });
  },
);

export const sendPlatformNotification = inngest.createFunction(
  { id: 'send-platform-notification', retries: 2, triggers: [{ event: 'platform/notification.send' }] },
  async ({ event, step }) => {
    const { notificationId } = event.data;

    return step.run('send-platform-notification', async () => {
      const supabase = getSupabaseAdmin();
      const { data: notification, error } = await supabase
        .from('platform_notifications')
        .select('id, workspace_id, type, title, message, channel, status')
        .eq('id', notificationId)
        .maybeSingle();

      if (error || !notification) {
        throw error || new Error('Notification not found');
      }

      if (notification.status === 'cancelled') {
        return { skipped: true, reason: 'notification cancelled' };
      }

      if (notification.channel === 'in_app') {
        const { error: updateError } = await supabase
          .from('platform_notifications')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', notificationId);

        if (updateError) throw updateError;
        return { sent: 'in_app' };
      }

      if (!process.env.RESEND_API_KEY) {
        const shouldSendInApp = notification.channel === 'both';
        const { error: updateError } = await supabase
          .from('platform_notifications')
          .update({
            status: shouldSendInApp ? 'sent' : 'queued',
            sent_at: shouldSendInApp ? new Date().toISOString() : null,
            metadata: { email_delivery: 'skipped_no_provider' },
          })
          .eq('id', notificationId);

        if (updateError) throw updateError;
        console.warn('[Email] Platform notification email skipped; RESEND_API_KEY is not configured.');
        return { skipped: true, reason: 'email provider not configured' };
      }

      let recipientsQuery = supabase
        .from('profiles')
        .select('email, full_name, workspace_id')
        .eq('role', 'tenant_admin')
        .eq('status', 'active');

      if (notification.workspace_id) {
        recipientsQuery = recipientsQuery.eq('workspace_id', notification.workspace_id);
      }

      const { data: recipients, error: recipientsError } = await recipientsQuery;
      if (recipientsError) throw recipientsError;

      const workspaceIds = Array.from(new Set((recipients || []).map((item) => item.workspace_id).filter(Boolean)));
      const { data: workspaces } = workspaceIds.length
        ? await supabase.from('workspaces').select('id, name').in('id', workspaceIds)
        : { data: [] };
      const workspaceNameById = new Map((workspaces || []).map((item) => [item.id, item.name]));

      for (const recipient of recipients || []) {
        if (!recipient.email) continue;
        const email = buildPlatformNotificationEmail({
          title: notification.title,
          message: notification.message,
          workspaceName: recipient.workspace_id ? workspaceNameById.get(recipient.workspace_id) : null,
          appUrl: getAppUrl(),
        });
        await sendEmail({ to: recipient.email, ...email });
      }

      const { error: updateError } = await supabase
        .from('platform_notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (updateError) throw updateError;
      return { sent: recipients?.length || 0 };
    });
  },
);

export const scheduledPlatformNotificationCheck = inngest.createFunction(
  { id: 'scheduled-platform-notification-check', retries: 2, triggers: [{ cron: '*/15 * * * *' }] },
  async ({ step }) => {
    return step.run('queue-due-platform-notifications', async () => {
      const supabase = getSupabaseAdmin();
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('platform_notifications')
        .select('id')
        .eq('status', 'queued')
        .not('scheduled_for', 'is', null)
        .lte('scheduled_for', now)
        .limit(50);

      if (error) {
        throw error;
      }

      const notificationIds = (data || []).map((item) => item.id);
      if (notificationIds.length === 0) {
        return { queued: 0 };
      }

      await Promise.all(
        notificationIds.map((notificationId) =>
          inngest.send({
            name: 'platform/notification.send',
            data: { notificationId },
          }),
        ),
      );

      return { queued: notificationIds.length };
    });
  },
);
