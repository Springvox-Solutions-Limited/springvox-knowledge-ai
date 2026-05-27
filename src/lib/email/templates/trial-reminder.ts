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
    subject: `${dayLabel} left in your SpringVox trial`,
    text: [
      `Your SpringVox trial for ${workspaceName} ends in ${dayLabel}.`,
      '',
      'Upgrade before the trial ends to keep uploads, chat, document search, and team access available.',
      '',
      `Open SpringVox: ${appUrl}/dashboard`,
      '',
      'SpringVox Team',
    ].join('\n'),
  };
}
