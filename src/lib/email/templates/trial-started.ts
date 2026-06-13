import { renderBrandedEmail } from '../layout';

export function buildTrialStartedEmail({
  workspaceName,
  trialEndsAt,
  appUrl,
}: {
  workspaceName: string;
  trialEndsAt: string;
  appUrl: string;
}) {
  const endDate = new Date(trialEndsAt).toLocaleDateString();
  return {
    subject: `Your 14-day Rekall-IQ trial has started`,
    text: [
      `Your 14-day trial for ${workspaceName} has started.`,
      '',
      `Trial end date: ${endDate}`,
      '',
      'During the trial, you can upload approved documents, invite users, and review source-backed answers with your team.',
      '',
      `Open your workspace: ${appUrl}/dashboard`,
      '',
      'Rekall-IQ Team',
    ].join('\n'),
    html: renderBrandedEmail({
      heading: 'Your 14-day trial has started',
      paragraphs: [
        `Your 14-day trial for ${workspaceName} is now active.`,
        `Trial end date: ${endDate}.`,
        'During the trial you can upload approved documents, invite your team, and review source-backed answers together.',
      ],
      button: { label: 'Open your workspace', url: `${appUrl}/dashboard` },
    }),
  };
}
