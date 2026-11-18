import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Lightweight platform health: surfaces the config that, when missing, causes
 * the "silent queue" failures — email provider, sender domain, Inngest
 * connection, app URL — plus a count of documents stuck in processing.
 */
export async function GET(req: Request) {
  try {
    await requirePlatformAdminRequest(req);
    const supabase = getSupabaseAdmin();

    const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: stuckDocuments } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'processing')
      .lt('created_at', cutoff);

    const emailFrom = process.env.EMAIL_FROM || null;

    return Response.json({
      health: {
        resendConfigured: Boolean(process.env.RESEND_API_KEY),
        emailFrom,
        emailFromIsDefault: !emailFrom || emailFrom.includes('example.com'),
        inngestConfigured: Boolean(process.env.INNGEST_EVENT_KEY || process.env.INNGEST_SIGNING_KEY),
        appUrlConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL),
        stuckDocuments: stuckDocuments ?? 0,
      },
    });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected health error');
  }
}
