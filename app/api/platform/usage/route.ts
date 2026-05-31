import { createPlatformErrorResponse, requirePlatformAdminRequest } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

function startOfMonth() {
  const date = new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  try {
    await requirePlatformAdminRequest(req);
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = startOfMonth();

    const [workspacesResult, usageResult, documentsResult] = await Promise.all([
      supabase.from('workspaces').select('id, name, slug').order('name'),
      supabase
        .from('workspace_usage_daily')
        .select('workspace_id, usage_date, questions_count, uploads_count, documents_count, storage_bytes, embedding_calls, rerank_calls, llm_calls')
        .gte('usage_date', monthStart),
      supabase.from('documents').select('id, workspace_id'),
    ]);

    if (workspacesResult.error) throw workspacesResult.error;
    if (usageResult.error) throw usageResult.error;
    if (documentsResult.error) throw documentsResult.error;

    const documentsByWorkspace = new Map<string, number>();
    for (const document of documentsResult.data || []) {
      documentsByWorkspace.set(document.workspace_id, (documentsByWorkspace.get(document.workspace_id) || 0) + 1);
    }

    const rows = (workspacesResult.data || []).map((workspace) => {
      const usageRows = (usageResult.data || []).filter((row) => row.workspace_id === workspace.id);
      const todayRows = usageRows.filter((row) => row.usage_date === today);
      const sum = (rows: typeof usageRows, key: keyof (typeof usageRows)[number]) =>
        rows.reduce((total, row) => total + Number(row[key] || 0), 0);

      return {
        workspace_id: workspace.id,
        workspace_name: workspace.name,
        slug: workspace.slug,
        questions_today: sum(todayRows, 'questions_count'),
        questions_month: sum(usageRows, 'questions_count'),
        uploads_today: sum(todayRows, 'uploads_count'),
        uploads_month: sum(usageRows, 'uploads_count'),
        documents_count: documentsByWorkspace.get(workspace.id) || 0,
        storage_bytes: sum(usageRows, 'storage_bytes'),
        embedding_calls: sum(usageRows, 'embedding_calls'),
        rerank_calls: sum(usageRows, 'rerank_calls'),
        llm_calls: sum(usageRows, 'llm_calls'),
      };
    });

    return Response.json({ usage: rows });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected usage error');
  }
}
