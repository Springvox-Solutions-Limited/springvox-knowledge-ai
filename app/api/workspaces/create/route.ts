import { getSupabaseAdmin } from '@/src/lib/supabase-server';
import { inngest } from '@/src/lib/inngest/client';
import { isValidEmail, isValidUrl, validateWorkspaceSlug } from '@/src/lib/onboarding';
import { assertRateLimit, BETA_RATE_LIMITS, getClientIp, maybeRateLimitResponse } from '@/src/lib/rate-limit';
import { sendEmail } from '@/src/lib/email';
import { buildWelcomeEmail } from '@/src/lib/email/templates/welcome';
import { buildTrialStartedEmail } from '@/src/lib/email/templates/trial-started';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  let createdUserId: string | null = null;
  let createdWorkspaceId: string | null = null;

  try {
    await assertRateLimit({
      key: getClientIp(req),
      scope: 'signup',
      ...BETA_RATE_LIMITS.signup,
    });

    const body = await req.json();
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
    const slugInput = typeof body.slug === 'string' ? body.slug.trim() : '';
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const industry = typeof body.industry === 'string' ? body.industry.trim() : '';
    const website = typeof body.website === 'string' ? body.website.trim() : '';

    if (!companyName) {
      return Response.json({ error: 'Company name is required' }, { status: 400 });
    }

    if (!fullName) {
      return Response.json({ error: 'Full name is required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return Response.json({ error: 'A valid work email is required' }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (website && !isValidUrl(website)) {
      return Response.json({ error: 'Website must be a valid URL' }, { status: 400 });
    }

    const slugValidation = validateWorkspaceSlug(slugInput);
    if (!slugValidation.valid) {
      return Response.json({ error: slugValidation.error }, { status: 400 });
    }

    const { data: existingWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', slugValidation.normalized)
      .maybeSingle();

    if (existingWorkspace) {
      return Response.json({ error: 'Workspace slug is already taken' }, { status: 409 });
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      return Response.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createUserError || !createdUser.user) {
      throw createUserError || new Error('Failed to create user');
    }

    createdUserId = createdUser.user.id;

    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: companyName,
        slug: slugValidation.normalized,
        status: 'trial',
        plan: 'pilot',
        trial_started_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_status: 'trial',
        subscription_plan: 'trial',
        billing_status: 'trialing',
        assistant_name: `${companyName} AI Assistant`,
        welcome_message: `Ask questions from ${companyName}'s approved documents.`,
        industry: industry || null,
        website: website || null,
      })
      .select('id, slug')
      .single();

    if (workspaceError || !workspace) {
      throw workspaceError || new Error('Failed to create workspace');
    }

    createdWorkspaceId = workspace.id;

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: createdUserId,
        email,
        full_name: fullName,
        role: 'tenant_admin',
        status: 'active',
        workspace_id: workspace.id,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      throw profileError;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // Send the immediate welcome + trial-started emails INLINE (fast Resend calls).
    // They must not depend on Inngest being up, and a mail failure must not fail signup.
    try {
      await sendEmail({ to: email, ...buildWelcomeEmail({ name: fullName, workspaceName: companyName, appUrl }) });
      await sendEmail({ to: email, ...buildTrialStartedEmail({ workspaceName: companyName, trialEndsAt, appUrl }) });
    } catch (emailError) {
      console.warn('Workspace created, but welcome/trial email failed to send:', emailError);
    }

    // Inngest handles only the SCHEDULED reminders (3-day / 1-day before trial end).
    try {
      await inngest.send({
        name: 'workspace/trial.started',
        data: {
          workspaceId: workspace.id,
          workspaceName: companyName,
          adminUserId: createdUserId,
          adminEmail: email,
          adminName: fullName,
          trialEndsAt,
        },
      });
    } catch (emailEventError) {
      console.warn('Workspace created, but trial reminder schedule could not be queued:', emailEventError);
    }

    return Response.json({
      success: true,
      workspace: {
        id: workspace.id,
        slug: workspace.slug,
      },
      user: {
        id: createdUserId,
        email,
      },
    });
  } catch (error) {
    const rateLimit = maybeRateLimitResponse(error);
    if (rateLimit) return rateLimit;

    if (createdWorkspaceId) {
      await supabase.from('workspaces').delete().eq('id', createdWorkspaceId);
    }

    if (createdUserId) {
      await supabase.auth.admin.deleteUser(createdUserId);
    }

    const message = error instanceof Error ? error.message : 'Unexpected workspace creation error';
    return Response.json({ error: message }, { status: 500 });
  }
}
