import { STRICT_NO_ANSWER } from '@/src/lib/gemini';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { MANAGER_ROLES } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req, MANAGER_ROLES);
    const supabase = getSupabaseAdmin();
    const workspaceId = profile.workspace_id!;
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();

    const [
      documentsResult,
      chatMessagesResult,
      recentQuestionsResult,
      knowledgeGapsResult,
      profilesResult,
      invitationsResult,
      feedbackResult,
      workspaceResult,
    ] = await Promise.all([
      supabase
        .from('documents')
        .select('id, status, total_chunks, created_at')
        .eq('workspace_id', workspaceId),
      supabase
        .from('chat_messages')
        .select('id, user_id, question, answer, citations, created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false }),
      supabase
        .from('chat_messages')
        .select('id, user_id, question, answer, citations, created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('knowledge_gaps')
        .select('id, question, status, occurrence_count, last_asked_at, created_at')
        .eq('workspace_id', workspaceId)
        .order('last_asked_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .eq('workspace_id', workspaceId),
      supabase
        .from('invitations')
        .select('id, status, created_at')
        .eq('workspace_id', workspaceId),
      supabase
        .from('answer_feedback')
        .select('id, rating, created_at, chat_message_id')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false }),
      supabase
        .from('workspaces')
        .select('id, name, assistant_name')
        .eq('id', workspaceId)
        .single(),
    ]);

    const documents = documentsResult.data || [];
    const chatMessages = chatMessagesResult.data || [];
    const recentQuestions = recentQuestionsResult.data || [];
    const knowledgeGaps = knowledgeGapsResult.data || [];
    const profiles = profilesResult.data || [];
    const invitations = invitationsResult.data || [];
    const feedback = feedbackResult.data || [];
    const workspace = workspaceResult.data || null;

    const profileEmailById = new Map(profiles.map((item) => [item.id, item.email || 'Unknown user']));
    const docsCompleted = documents.filter((doc) => doc.status === 'completed').length;
    const docsFailed = documents.filter((doc) => doc.status === 'failed').length;
    const totalChunks = documents.reduce((sum, doc) => sum + Number(doc.total_chunks || 0), 0);
    const totalQuestions = chatMessages.length;
    const questionsLast7Days = chatMessages.filter((msg) => msg.created_at >= since).length;
    const openKnowledgeGaps = knowledgeGaps.filter((gap) => gap.status === 'open').length;
    const totalUsers = profiles.length;
    const viewers = profiles.filter((item) => item.role === 'viewer').length;
    const contentManagers = profiles.filter((item) => item.role === 'content_manager').length;
    const admins = profiles.filter((item) => item.role === 'admin').length;

    const dailyQuestionCounts = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const dayKey = date.toISOString().slice(0, 10);
      const count = chatMessages.filter((message) => message.created_at.slice(0, 10) === dayKey).length;
      return { date: dayKey, count };
    });

    const negativeFeedback = feedback.filter((item) =>
      ['not_helpful', 'wrong', 'outdated'].includes(item.rating),
    );

    return Response.json({
      workspace,
      summary: {
        totalDocuments: documents.length,
        completedDocuments: docsCompleted,
        failedDocuments: docsFailed,
        totalChunks,
        totalQuestions,
        questionsLast7Days,
        sourceBackedAnswers: chatMessages.filter((msg) => Array.isArray(msg.citations) && msg.citations.length > 0).length,
        fallbackAnswers: chatMessages.filter((msg) => msg.answer === STRICT_NO_ANSWER).length,
        openKnowledgeGaps,
        totalUsers,
        viewers,
        contentManagers,
        admins,
        pendingInvitations: invitations.filter((item) => item.status === 'pending').length,
        totalFeedback: feedback.length,
        helpfulFeedback: feedback.filter((item) => item.rating === 'helpful').length,
        negativeFeedback: negativeFeedback.length,
      },
      recentQuestions: recentQuestions.map((message) => ({
        id: message.id,
        question: message.question,
        user_email: profileEmailById.get(message.user_id) || 'Unknown user',
        had_sources: Array.isArray(message.citations) && message.citations.length > 0,
        knowledge_gap: message.answer === STRICT_NO_ANSWER,
        created_at: message.created_at,
      })),
      recentKnowledgeGaps: knowledgeGaps.slice(0, 8),
      dailyQuestionCounts,
      feedbackSummary: {
        recentNegativeFeedback: negativeFeedback.slice(0, 6),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected analytics error';
    const status =
      message === 'Unauthorized' || message === 'Missing bearer token'
        ? 401
        : message === 'Forbidden'
          ? 403
          : 500;

    return Response.json({ error: message }, { status });
  }
}
