export function buildTrialReminderEmail({
  workspaceName,
  daysRemaining,
  appUrl,
}: {
  workspaceName: string;
  daysRemaining: 1 | 3;
  appUrl: string;
}) {
  const dayLabel = daysRemaining === 1 ? '1 day' : `${daysRemaining} days`;

  return {
    subject: `${dayLabel} left in your Rekall-IQ trial`,
    text: [
      `Your Rekall-IQ trial for ${workspaceName} ends in ${dayLabel}.`,
      '',
      'Upgrade before the trial ends to keep uploads, chat, document search, and team access available.',
      '',
      `Open Rekall-IQ: ${appUrl}/dashboard`,
      '',
      'Rekall-IQ Team',
    ].join('\n'),
  };
}
