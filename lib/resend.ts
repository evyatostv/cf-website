/**
 * ClinicFlow — Resend send helper.
 * Groups B–E email are sent directly via the Resend API, passing the
 * React Email component to `react`. Group A auth emails go through
 * Supabase Auth's custom SMTP (Resend) using the standalone HTML in
 * emails/supabase/ — they do NOT use this helper.
 *
 *   npm i resend @react-email/components react-email
 *   env: RESEND_API_KEY, (optional) EMAIL_FROM
 */
import { Resend } from 'resend';
import type { ReactElement } from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

/** Verified sending identity. Use a subdomain (mail.clinic-flow.co.il) once DNS is set. */
export const FROM = process.env.EMAIL_FROM || 'ClinicFlow <info@clinic-flow.co.il>';
export const REPLY_TO = 'info@clinic-flow.co.il';

export interface SendEmailArgs {
  to: string | string[];
  subject: string;
  react: ReactElement;
  /** Plain-text fallback. React Email renders one automatically, but pass an explicit one for critical mail. */
  text?: string;
  replyTo?: string;
  /** For lifecycle/marketing mail — surfaces a List-Unsubscribe header. */
  unsubscribeUrl?: string;
}

export async function sendEmail({ to, subject, react, text, replyTo, unsubscribeUrl }: SendEmailArgs) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    react,
    text,
    replyTo: replyTo || REPLY_TO,
    headers: unsubscribeUrl
      ? {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }
      : undefined,
  });

  if (error) {
    // Surface to your logger / monitoring.
    console.error('[resend] send failed', { to, subject, error });
    throw error;
  }
  return data;
}

export { resend };
