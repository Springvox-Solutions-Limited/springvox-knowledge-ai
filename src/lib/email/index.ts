import 'server-only';

import { Resend } from 'resend';

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

function getEmailFrom() {
  return process.env.EMAIL_FROM || 'SpringVox <no-reply@example.com>';
}

export async function sendEmail({ to, subject, text }: SendEmailInput) {
  const provider = process.env.EMAIL_PROVIDER || 'resend';

  if (provider !== 'resend') {
    throw new Error(`Unsupported EMAIL_PROVIDER "${provider}"`);
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY is not configured; skipping email send.');
    return { skipped: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: getEmailFrom(),
    to,
    subject,
    text,
  });

  if (error) {
    throw error;
  }

  return { skipped: false };
}
