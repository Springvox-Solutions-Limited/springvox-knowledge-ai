import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { isAdminRole, type WorkspaceSettings } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

function isValidHexColor(value: string) {
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('workspaces')
      .select('id, name, slug, logo_url, primary_color, welcome_message, assistant_name, support_email, industry, website, updated_at')
      .eq('id', profile.workspace_id)
      .single();

    if (error || !data) {
      throw error || new Error('Workspace not found');
    }

    return Response.json({ workspace: data as WorkspaceSettings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected workspace settings error';
    const status =
      message === 'Unauthorized' || message === 'Missing bearer token'
        ? 401
        : message === 'Forbidden'
          ? 403
          : 500;

    return Response.json({ error: message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req);

    if (!isAdminRole(profile.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const assistantName = typeof body.assistant_name === 'string' ? body.assistant_name.trim() : '';
    const welcomeMessage = typeof body.welcome_message === 'string' ? body.welcome_message.trim() : '';
    const supportEmail = typeof body.support_email === 'string' ? body.support_email.trim() : '';
    const website = typeof body.website === 'string' ? body.website.trim() : '';
    const industry = typeof body.industry === 'string' ? body.industry.trim() : '';
    const primaryColor = typeof body.primary_color === 'string' ? body.primary_color.trim() : '';
    const logoUrl = typeof body.logo_url === 'string' ? body.logo_url.trim() : '';

    if (!name) {
      return Response.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    if (supportEmail && !isValidEmail(supportEmail)) {
      return Response.json({ error: 'Support email must be valid' }, { status: 400 });
    }

    if (website && !isValidUrl(website)) {
      return Response.json({ error: 'Website must be a valid URL' }, { status: 400 });
    }

    if (logoUrl && !isValidUrl(logoUrl)) {
      return Response.json({ error: 'Logo URL must be a valid URL' }, { status: 400 });
    }

    if (primaryColor && !isValidHexColor(primaryColor)) {
      return Response.json({ error: 'Primary color must be a valid hex value' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('workspaces')
      .update({
        name,
        assistant_name: assistantName || null,
        welcome_message: welcomeMessage || null,
        support_email: supportEmail || null,
        website: website || null,
        industry: industry || null,
        primary_color: primaryColor || null,
        logo_url: logoUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.workspace_id)
      .select('id, name, slug, logo_url, primary_color, welcome_message, assistant_name, support_email, industry, website, updated_at')
      .single();

    if (error || !data) {
      throw error || new Error('Failed to update workspace');
    }

    return Response.json({ workspace: data as WorkspaceSettings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected workspace settings update error';
    const status =
      message === 'Unauthorized' || message === 'Missing bearer token'
        ? 401
        : message === 'Forbidden'
          ? 403
          : 500;

    return Response.json({ error: message }, { status });
  }
}
