import { getUserStatusMessage, getWorkspaceStatusMessage } from '@/src/lib/workspace';

const restrictedMessages = new Set([
  getWorkspaceStatusMessage('suspended'),
  getWorkspaceStatusMessage('inactive'),
  getWorkspaceStatusMessage('expired'),
  getWorkspaceStatusMessage('past_due'),
  getUserStatusMessage('suspended'),
  getUserStatusMessage('disabled'),
  'Your 14-day trial has ended. Please upgrade to continue using Rekall-IQ.',
]);

export function getRequestErrorStatus(message: string) {
  if (message === 'Unauthorized' || message === 'Missing bearer token') {
    return 401;
  }

  if (message === 'Forbidden') {
    return 403;
  }

  if (restrictedMessages.has(message)) {
    return 423;
  }

  return 500;
}

const SAFE_PREFIXES = [
  'Unauthorized',
  'Forbidden',
  'Missing bearer token',
  'Invalid ',
  'Unsupported file type',
  'File content does not match',
  'Could not verify this file',
  'The file is empty',
  'This file is too large',
  'Question is required',
  'Question is too long',
  'Too many ',
  'Rate limit exceeded',
  'Authentication session expired',
  'Not found',
  'Resource not found',
  'Chat message not found',
  'Chat session not found',
  'Document not found',
  'Source not found',
  'User not found',
  'Collection not found',
  'Invitation ',
  'This invitation ',
  'An account ',
  'Workspace ',
  'Password ',
  'Feedback ',
  'Evaluation set not found',
  'No text',
  'Invalid filename',
];

/**
 * Remove database/provider internals from client-facing errors. The API still
 * logs the original error server-side; this only controls what the caller sees.
 */
export function safeErrorMessage(message: string) {
  const value = (message || '').trim();

  if (!value) return 'An unexpected error occurred.';
  if (restrictedMessages.has(value)) return value;
  if (SAFE_PREFIXES.some((prefix) => value.startsWith(prefix))) return value;

  if (/high demand|503|temporarily unavailable|overloaded/i.test(value)) {
    return 'The AI provider is temporarily busy. Please try again in a moment.';
  }

  if (/no longer available|model.*not found|404.*model/i.test(value)) {
    return 'The configured AI model is unavailable. Please contact an administrator.';
  }

  if (/timeout|timed out|aborted/i.test(value)) {
    return 'The AI provider took too long to respond. Please try again.';
  }

  if (
    /duplicate key|violates|constraint|relation|column|syntax error|permission denied|row-level security|jwt|supabase|postgrest|qdrant|voyage|gemini|resend|inngest|econn|etimedout/i.test(
      value,
    )
  ) {
    return 'The request could not be completed.';
  }

  return 'The request could not be completed.';
}
