export function buildTrialExpiredEmail({
  workspaceName,
  appUrl,
}: {
  workspaceName: string;
  appUrl: string;
}) {
  return {
    subject: `Your SpringVox trial has ended`,
    text: [
      `Your 14-day SpringVox trial for ${workspaceName} has ended.`,
      '',
      'Workspace access is paused until the workspace is upgraded or reactivated.',
      '',
      `Open SpringVox: ${appUrl}/login`,
      '',
      'SpringVox Team',
    ].join('\n'),
  };
}
