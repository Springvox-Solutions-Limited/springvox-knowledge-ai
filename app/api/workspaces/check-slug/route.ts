import { validateWorkspaceSlug } from '@/src/lib/onboarding';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug') || '';
    const validation = validateWorkspaceSlug(slug);

    if (!validation.valid) {
      return Response.json(
        { available: false, error: validation.error, slug: validation.normalized },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', validation.normalized)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return Response.json({
      available: !data,
      slug: validation.normalized,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected slug check error';
    return Response.json({ available: false, error: message }, { status: 500 });
  }
}
