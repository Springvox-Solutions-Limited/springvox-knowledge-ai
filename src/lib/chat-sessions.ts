import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_CHAT_SESSION_TITLE = 'New chat';
export const LEGACY_CHAT_SESSION_TITLE = 'Earlier chat';
const CHAT_SESSION_TITLE_LIMIT = 50;

type ChatSessionRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export function buildChatSessionTitle(question: string) {
  const normalized = question.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return DEFAULT_CHAT_SESSION_TITLE;
  }

  if (normalized.length <= CHAT_SESSION_TITLE_LIMIT) {
    return normalized;
  }

  const clipped = normalized.slice(0, CHAT_SESSION_TITLE_LIMIT - 1).trim();
  return `${clipped}…`;
}

export async function getOwnedChatSession(
  supabase: SupabaseClient,
  sessionId: string,
  workspaceId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id, workspace_id, user_id, title, created_at, updated_at')
    .eq('id', sessionId)
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ChatSessionRow | null) ?? null;
}

export async function createChatSession(
  supabase: SupabaseClient,
  {
    workspaceId,
    userId,
    title = DEFAULT_CHAT_SESSION_TITLE,
    createdAt,
    updatedAt,
  }: {
    workspaceId: string;
    userId: string;
    title?: string;
    createdAt?: string;
    updatedAt?: string;
  },
) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      title,
      created_at: createdAt,
      updated_at: updatedAt,
    })
    .select('id, workspace_id, user_id, title, created_at, updated_at')
    .maybeSingle();

  if (error || !data) {
    throw error || new Error('Failed to create chat session');
  }

  return data as ChatSessionRow;
}

export async function resolveOwnedChatSession(
  supabase: SupabaseClient,
  {
    sessionId,
    workspaceId,
    userId,
  }: {
    sessionId?: string | null;
    workspaceId: string;
    userId: string;
  },
) {
  if (!sessionId) {
    return createChatSession(supabase, {
      workspaceId,
      userId,
    });
  }

  const session = await getOwnedChatSession(supabase, sessionId, workspaceId, userId);

  if (!session) {
    throw new Error('Chat session not found');
  }

  return session;
}

export async function touchChatSession(
  supabase: SupabaseClient,
  sessionId: string,
) {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    throw error;
  }
}

export async function setSessionTitleFromFirstQuestionIfNeeded(
  supabase: SupabaseClient,
  {
    sessionId,
    question,
  }: {
    sessionId: string;
    question: string;
  },
) {
  const { count, error: countError } = await supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  if (countError) {
    throw countError;
  }

  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('id, title')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    throw sessionError || new Error('Chat session not found');
  }

  if (count === 0 && session.title === DEFAULT_CHAT_SESSION_TITLE) {
    const { error: updateError } = await supabase
      .from('chat_sessions')
      .update({
        title: buildChatSessionTitle(question),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      throw updateError;
    }

    return;
  }

  await touchChatSession(supabase, sessionId);
}
