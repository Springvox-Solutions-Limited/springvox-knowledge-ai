import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { getOwnedChatSession } from '@/src/lib/chat-sessions';
import {
  getAuthenticatedUserWithProfile,
  getSupabaseAdmin,
} from '@/src/lib/supabase-server';
import { assertWorkspaceOperational } from '@/src/lib/workspace-access';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user, profile } = await getAuthenticatedUserWithProfile(req);
    await assertWorkspaceOperational(profile.workspace_id!);

    const supabase = getSupabaseAdmin();
    const session = await getOwnedChatSession(
      supabase,
      id,
      profile.workspace_id!,
      user.id,
    );

    if (!session) {
      return Response.json({ error: 'Chat session not found' }, { status: 404 });
    }

    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id, question, answer, citations, created_at')
      .eq('workspace_id', profile.workspace_id)
      .eq('user_id', user.id)
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    return Response.json({
      session,
      messages: messages || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected session lookup error';
    const status = getRequestErrorStatus(message);

    return Response.json({ error: message }, { status });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user, profile } = await getAuthenticatedUserWithProfile(req);
    await assertWorkspaceOperational(profile.workspace_id!);

    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';

    if (!title) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const session = await getOwnedChatSession(
      supabase,
      id,
      profile.workspace_id!,
      user.id,
    );

    if (!session) {
      return Response.json({ error: 'Chat session not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .update({
        title: title.slice(0, 50),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, title, created_at, updated_at')
      .maybeSingle();

    if (error || !data) {
      throw error || new Error('Failed to update chat session');
    }

    return Response.json({ session: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected session update error';
    const status = getRequestErrorStatus(message);

    return Response.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user, profile } = await getAuthenticatedUserWithProfile(req);
    await assertWorkspaceOperational(profile.workspace_id!);

    const supabase = getSupabaseAdmin();
    const session = await getOwnedChatSession(
      supabase,
      id,
      profile.workspace_id!,
      user.id,
    );

    if (!session) {
      return Response.json({ error: 'Chat session not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected session delete error';
    const status = getRequestErrorStatus(message);

    return Response.json({ error: message }, { status });
  }
}
