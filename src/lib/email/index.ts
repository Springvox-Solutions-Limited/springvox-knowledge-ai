import 'server-only';

import { Resend } from 'resend';

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const FROM_DISPLAY_NAME = 'Rekall-IQ';

function getEmailFrom() {
  const raw = (process.env.EMAIL_FROM || '').trim();
  if (!raw) {
    return `${FROM_DISPLAY_NAME} <no-reply@rekalliq.springvoxsl.com>`;
  }
  // Already includes a display name (e.g. "Rekall-IQ <no-reply@...>") — use as-is.
  if (raw.includes('<')) {
    return raw;
  }
  // Bare address (e.g. "no-reply@...") — prepend the brand so inboxes show "Rekall-IQ".
  return `${FROM_DISPLAY_NAME} <${raw}>`;
}

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
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
    ...(html ? { html } : {}),
  });

  if (error) {
    throw error;
  }

  return { skipped: false };
}
