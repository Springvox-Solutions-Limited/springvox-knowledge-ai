import { renderBrandedEmail } from '../layout';

export function buildWelcomeEmail({
  name,
  workspaceName,
  appUrl,
}: {
  name?: string | null;
  workspaceName: string;
  appUrl: string;
}) {
  const greeting = name ? `Hi ${name},` : 'Hello,';

  return {
    subject: `Welcome to Rekall-IQ, ${workspaceName}`,
    text: [
      greeting,
      '',
      `Your Rekall-IQ workspace for ${workspaceName} is ready.`,
      'You can now upload approved documents, invite your team, and ask questions from company knowledge with sources.',
      '',
      `Open Rekall-IQ: ${appUrl}/login`,
      '',
      'Rekall-IQ Team',
    ].join('\n'),
    html: renderBrandedEmail({
      heading: 'Welcome to Rekall-IQ',
      paragraphs: [
        greeting,
        `Your Rekall-IQ workspace for ${workspaceName} is ready.`,
        'You can now upload approved documents, invite your team, and ask questions from company knowledge — every answer comes with its sources.',
      ],
      button: { label: 'Open Rekall-IQ', url: `${appUrl}/login` },
    }),
  };
}
