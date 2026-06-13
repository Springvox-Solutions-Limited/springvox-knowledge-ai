import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Update the authenticated user's own profile. Scoped to the caller's own id,
 * so a user can only edit themselves.
 */
export async function PATCH(req: Request) {
  try {
    const { user } = await getAuthenticatedUserWithProfile(req);
    const body = await req.json().catch(() => ({}));
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';

    if (!fullName) {
      return Response.json({ error: 'Name is required.' }, { status: 400 });
    }
    if (fullName.length > 80) {
      return Response.json({ error: 'Name must be 80 characters or fewer.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (error) throw error;

    return Response.json({ success: true, fullName });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
  }
}
