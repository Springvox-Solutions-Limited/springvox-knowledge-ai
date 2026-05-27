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
    subject: `Welcome to SpringVox, ${workspaceName}`,
    text: [
      greeting,
      '',
      `Your SpringVox workspace for ${workspaceName} is ready.`,
      'You can now upload approved documents, invite your team, and ask questions from company knowledge with sources.',
      '',
      `Open SpringVox: ${appUrl}/login`,
      '',
      'SpringVox Team',
    ].join('\n'),
  };
}
