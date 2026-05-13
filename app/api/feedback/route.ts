import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { FEEDBACK_RATINGS, MANAGER_ROLES } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { user, profile } = await getAuthenticatedUserWithProfile(req);
    const body = await req.json();
    const chatMessageId = typeof body.chatMessageId === 'string' ? body.chatMessageId : '';
    const rating = typeof body.rating === 'string' ? body.rating : '';
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';

    if (!chatMessageId || !FEEDBACK_RATINGS.includes(rating as (typeof FEEDBACK_RATINGS)[number])) {
      return Response.json({ error: 'Invalid feedback request' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: chatMessage, error: chatMessageError } = await supabase
      .from('chat_messages')
      .select('id, workspace_id')
      .eq('id', chatMessageId)
      .eq('workspace_id', profile.workspace_id)
      .single();

    if (chatMessageError || !chatMessage) {
      return Response.json({ error: 'Chat message not found' }, { status: 404 });
    }

    const { data: existingFeedback } = await supabase
      .from('answer_feedback')
      .select('id')
      .eq('workspace_id', profile.workspace_id)
      .eq('chat_message_id', chatMessageId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingFeedback) {
      const { error: updateError } = await supabase
        .from('answer_feedback')
        .update({
          rating,
          comment: comment || null,
        })
        .eq('id', existingFeedback.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase.from('answer_feedback').insert({
        workspace_id: profile.workspace_id,
        chat_message_id: chatMessageId,
        user_id: user.id,
        rating,
        comment: comment || null,
      });

      if (insertError) {
        throw insertError;
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected feedback error';
    const status =
      message === 'Unauthorized' || message === 'Missing bearer token'
        ? 401
        : message === 'Forbidden'
          ? 403
          : 500;

    return Response.json({ error: message }, { status });
  }
}

export async function GET(req: Request) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req, MANAGER_ROLES);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('answer_feedback')
      .select('id, rating, comment, created_at, chat_message_id')
      .eq('workspace_id', profile.workspace_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return Response.json({ feedback: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected feedback lookup error';
    const status =
      message === 'Unauthorized' || message === 'Missing bearer token'
        ? 401
        : message === 'Forbidden'
          ? 403
          : 500;

    return Response.json({ error: message }, { status });
  }
}
