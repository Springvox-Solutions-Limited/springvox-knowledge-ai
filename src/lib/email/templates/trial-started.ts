export function buildTrialStartedEmail({
  workspaceName,
  trialEndsAt,
  appUrl,
}: {
  workspaceName: string;
  trialEndsAt: string;
  appUrl: string;
}) {
  return {
    subject: `Your 14-day Rekall-IQ trial has started`,
    text: [
      `Your 14-day trial for ${workspaceName} has started.`,
      '',
      `Trial end date: ${new Date(trialEndsAt).toLocaleDateString()}`,
      '',
      'During the trial, you can upload approved documents, invite users, and review source-backed answers with your team.',
      '',
      `Open your workspace: ${appUrl}/dashboard`,
      '',
      'Rekall-IQ Team',
    ].join('\n'),
  };
}
