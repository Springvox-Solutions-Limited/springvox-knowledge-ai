import { renderBrandedEmail } from '../layout';

export function buildTrialExpiredEmail({
  workspaceName,
  appUrl,
}: {
  workspaceName: string;
  appUrl: string;
}) {
  return {
    subject: `Your Rekall-IQ trial has ended`,
    text: [
      `Your 14-day Rekall-IQ trial for ${workspaceName} has ended.`,
      '',
      'Workspace access is paused until the workspace is upgraded or reactivated.',
      '',
      `Open Rekall-IQ: ${appUrl}/login`,
      '',
      'Rekall-IQ Team',
    ].join('\n'),
    html: renderBrandedEmail({
      heading: 'Your trial has ended',
      paragraphs: [
        `Your 14-day Rekall-IQ trial for ${workspaceName} has ended.`,
        'Workspace access is paused until the workspace is upgraded or reactivated. Your documents and data are safe.',
      ],
      button: { label: 'Reactivate Rekall-IQ', url: `${appUrl}/login` },
    }),
  };
}
