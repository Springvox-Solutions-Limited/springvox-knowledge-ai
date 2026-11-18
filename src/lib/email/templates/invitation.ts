import { renderBrandedEmail } from '../layout';

export function buildInvitationEmail({
  workspaceName,
  roleLabel,
  inviteUrl,
}: {
  workspaceName: string;
  roleLabel: string;
  inviteUrl: string;
}) {
  return {
    subject: `You've been invited to ${workspaceName} on Rekall-IQ`,
    text: [
      `You've been invited to join ${workspaceName} on Rekall-IQ as a ${roleLabel}.`,
      '',
      'Rekall-IQ lets your team ask questions and get answers grounded in your organisation\'s approved documents.',
      '',
      `Accept your invitation: ${inviteUrl}`,
      '',
      'This invitation link expires in 7 days. If you weren\'t expecting it, you can ignore this email.',
      '',
      'Rekall-IQ Team',
    ].join('\n'),
    html: renderBrandedEmail({
      heading: `You're invited to ${workspaceName}`,
      paragraphs: [
        `You've been invited to join ${workspaceName} on Rekall-IQ as a ${roleLabel}.`,
        "Rekall-IQ lets your team ask questions and get answers grounded in your organisation's approved documents — with sources.",
        'This invitation link expires in 7 days.',
      ],
      button: { label: 'Accept invitation', url: inviteUrl },
    }),
  };
}
