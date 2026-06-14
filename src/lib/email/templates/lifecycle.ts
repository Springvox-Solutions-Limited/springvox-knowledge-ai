import { renderBrandedEmail } from '../layout';

/** Sent to a new member right after they accept an invite. */
export function buildMemberWelcomeEmail({
  workspaceName,
  appUrl,
}: {
  workspaceName: string;
  appUrl: string;
}) {
  return {
    subject: `You've joined ${workspaceName} on Rekall-IQ`,
    text: [
      `You've joined ${workspaceName} on Rekall-IQ.`,
      '',
      'You can now ask questions and get answers grounded in your organisation\'s approved documents, with sources.',
      '',
      `Open Rekall-IQ: ${appUrl}/login`,
      '',
      'Rekall-IQ Team',
    ].join('\n'),
    html: renderBrandedEmail({
      heading: `Welcome to ${workspaceName}`,
      paragraphs: [
        `You've joined ${workspaceName} on Rekall-IQ.`,
        "You can now ask questions and get answers grounded in your organisation's approved documents — every answer comes with its sources.",
      ],
      button: { label: 'Open Rekall-IQ', url: `${appUrl}/login` },
    }),
  };
}

/** Sent to a user when their account is suspended or reactivated. */
export function buildAccountStatusEmail({
  workspaceName,
  suspended,
  appUrl,
}: {
  workspaceName: string;
  suspended: boolean;
  appUrl: string;
}) {
  if (suspended) {
    return {
      subject: `Your Rekall-IQ access has been suspended`,
      text: [
        `Your access to ${workspaceName} on Rekall-IQ has been suspended by a workspace admin.`,
        '',
        'If you think this is a mistake, please contact your workspace administrator.',
        '',
        'Rekall-IQ Team',
      ].join('\n'),
      html: renderBrandedEmail({
        heading: 'Your access has been suspended',
        paragraphs: [
          `Your access to ${workspaceName} on Rekall-IQ has been suspended by a workspace admin.`,
          'If you think this is a mistake, please contact your workspace administrator.',
        ],
      }),
    };
  }

  return {
    subject: `Your Rekall-IQ access has been restored`,
    text: [
      `Your access to ${workspaceName} on Rekall-IQ has been restored.`,
      '',
      `You can sign in again here: ${appUrl}/login`,
      '',
      'Rekall-IQ Team',
    ].join('\n'),
    html: renderBrandedEmail({
      heading: 'Your access has been restored',
      paragraphs: [`Your access to ${workspaceName} on Rekall-IQ has been restored.`],
      button: { label: 'Sign in', url: `${appUrl}/login` },
    }),
  };
}

/** Sent to a workspace admin when the workspace is suspended or reactivated. */
export function buildWorkspaceStatusEmail({
  workspaceName,
  status,
  appUrl,
}: {
  workspaceName: string;
  status: 'active' | 'suspended';
  appUrl: string;
}) {
  const suspended = status === 'suspended';
  return {
    subject: suspended
      ? `${workspaceName} has been suspended on Rekall-IQ`
      : `${workspaceName} has been reactivated on Rekall-IQ`,
    text: [
      suspended
        ? `Your workspace ${workspaceName} has been suspended. Uploads, chat, and member access are paused until it is reactivated.`
        : `Your workspace ${workspaceName} has been reactivated. Your team can use Rekall-IQ again.`,
      '',
      `Open Rekall-IQ: ${appUrl}/dashboard`,
      '',
      'Rekall-IQ Team',
    ].join('\n'),
    html: renderBrandedEmail({
      heading: suspended ? `${workspaceName} has been suspended` : `${workspaceName} is active again`,
      paragraphs: [
        suspended
          ? 'Uploads, chat, and member access are paused until the workspace is reactivated.'
          : 'Your team can use Rekall-IQ again.',
      ],
      button: { label: 'Open Rekall-IQ', url: `${appUrl}/dashboard` },
    }),
  };
}

/** Sent to a workspace admin when the workspace is permanently deleted. */
export function buildWorkspaceDeletedEmail({ workspaceName }: { workspaceName: string }) {
  return {
    subject: `${workspaceName} has been deleted from Rekall-IQ`,
    text: [
      `Your workspace ${workspaceName} and all of its documents, chats, and data have been permanently deleted from Rekall-IQ.`,
      '',
      'This action cannot be undone. If this was unexpected, please contact support.',
      '',
      'Rekall-IQ Team',
    ].join('\n'),
    html: renderBrandedEmail({
      heading: `${workspaceName} has been deleted`,
      paragraphs: [
        `Your workspace ${workspaceName} and all of its documents, chats, and data have been permanently deleted from Rekall-IQ.`,
        'This action cannot be undone. If this was unexpected, please contact support.',
      ],
    }),
  };
}
