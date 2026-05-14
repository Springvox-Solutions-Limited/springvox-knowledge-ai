import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePlatformAdminRequest(req);
    const { id } = await params;
    const body = await req.json();
    const internalNotes =
      typeof body.internal_notes === 'string' ? body.internal_notes.trim() : null;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('workspaces')
      .update({
        internal_notes: internalNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return Response.json({ success: true });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected workspace notes update error');
  }
}
