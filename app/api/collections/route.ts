import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { assertWorkspaceOperational } from '@/src/lib/workspace-access';
import { isWorkspaceAdminRole } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export async function GET(req: Request) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('collections')
      .select('id, name, slug, is_default, created_at')
      .eq('workspace_id', profile.workspace_id)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;

    return Response.json({ collections: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected collections error';
    return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
  }
}

export async function POST(req: Request) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req);
    await assertWorkspaceOperational(profile.workspace_id!);

    if (!isWorkspaceAdminRole(profile.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name || name.length > 48) {
      return Response.json({ error: 'A collection name (1-48 characters) is required' }, { status: 400 });
    }

    const slug = slugify(name);
    if (!slug) {
      return Response.json({ error: 'Collection name must contain letters or numbers' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('collections')
      .insert({
        workspace_id: profile.workspace_id,
        name,
        slug,
        is_default: false,
      })
      .select('id, name, slug, is_default, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return Response.json({ error: 'A collection with that name already exists' }, { status: 409 });
      }
      throw error;
    }

    return Response.json({ collection: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected collection creation error';
    return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
  }
}
