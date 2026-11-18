import { renderBrandedEmail } from '../layout';

export function buildPlatformNotificationEmail({
  title,
  message,
  workspaceName,
  appUrl,
}: {
  title: string;
  message: string;
  workspaceName?: string | null;
  appUrl: string;
}) {
  return {
    subject: title,
    text: [
      workspaceName ? `Workspace: ${workspaceName}` : 'Rekall-IQ platform notice',
      '',
      message,
      '',
      `Open Rekall-IQ: ${appUrl}/dashboard`,
      '',
      'Rekall-IQ Team',
    ].join('\n'),
    html: renderBrandedEmail({
      heading: title,
      paragraphs: [
        workspaceName ? `Workspace: ${workspaceName}` : 'Rekall-IQ platform notice',
        message,
      ],
      button: { label: 'Open Rekall-IQ', url: `${appUrl}/dashboard` },
    }),
  };
}
