import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

type LimitField =
  | 'monthly_question_limit'
  | 'daily_upload_limit'
  | 'storage_byte_limit'
  | 'monthly_llm_token_limit';

const LIMIT_FIELDS: LimitField[] = [
  'monthly_question_limit',
  'daily_upload_limit',
  'storage_byte_limit',
  'monthly_llm_token_limit',
];

function parseLimit(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdminRequest(req);
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('workspace_limits')
      .select('monthly_question_limit, daily_upload_limit, storage_byte_limit, monthly_llm_token_limit, updated_at')
      .eq('workspace_id', id)
      .maybeSingle();

    if (error) throw error;

    return Response.json({
      limits:
        data || {
          monthly_question_limit: null,
          daily_upload_limit: null,
          storage_byte_limit: null,
          monthly_llm_token_limit: null,
          updated_at: null,
        },
    });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected workspace limits fetch error');
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdminRequest(req);
    const { id } = await params;
    const body = await req.json();

    const update: Record<string, number | null | string> = { updated_at: new Date().toISOString() };
    for (const field of LIMIT_FIELDS) {
      update[field] = parseLimit(body[field]);
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('workspace_limits')
      .upsert({ workspace_id: id, ...update }, { onConflict: 'workspace_id' });

    if (error) throw error;

    return Response.json({ success: true });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected workspace limits update error');
  }
}
