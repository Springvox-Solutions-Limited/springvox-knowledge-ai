import { getUserStatusMessage, getWorkspaceStatusMessage } from '@/src/lib/workspace';

const restrictedMessages = new Set([
  getWorkspaceStatusMessage('suspended'),
  getWorkspaceStatusMessage('inactive'),
  getWorkspaceStatusMessage('expired'),
  getWorkspaceStatusMessage('past_due'),
  getUserStatusMessage('suspended'),
  getUserStatusMessage('disabled'),
  'Your 14-day trial has ended. Please upgrade to continue using SpringVox.',
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
