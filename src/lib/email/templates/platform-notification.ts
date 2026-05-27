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
      workspaceName ? `Workspace: ${workspaceName}` : 'SpringVox platform notice',
      '',
      message,
      '',
      `Open SpringVox: ${appUrl}/dashboard`,
      '',
      'SpringVox Team',
    ].join('\n'),
  };
}
