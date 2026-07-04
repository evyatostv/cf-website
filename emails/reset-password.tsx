/** 03 · איפוס סיסמה (Reset password) — Group A · Supabase Auth. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton, LinkFallback } from './components/ui';
import { brand, s } from './theme';

export interface ResetPasswordProps {
  confirmationUrl: string;
}

export function ResetPassword({
  confirmationUrl = 'https://clinic-flow.co.il/auth/confirm?token=demo',
}: ResetPasswordProps) {
  return (
    <EmailLayout preheader="קיבלנו בקשה לאיפוס הסיסמה שלך.">
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        אבטחת חשבון
      </Text>
      <Text style={s.h1}>איפוס סיסמה</Text>
      <Text style={s.p}>
        קיבלנו בקשה לאיפוס הסיסמה של חשבונך. לחץ על הכפתור כדי לבחור סיסמה חדשה. הקישור תקף לשעה אחת.
      </Text>

      <CtaButton href={confirmationUrl}>בחירת סיסמה חדשה</CtaButton>

      <LinkFallback label="או העתק קישור זה:" href={confirmationUrl} />

      <Text style={s.muted}>
        אם לא ביקשת לאפס סיסמה, אין צורך לעשות דבר — הסיסמה הנוכחית נשארת בתוקף.
      </Text>
    </EmailLayout>
  );
}

ResetPassword.PreviewProps = {
  confirmationUrl: 'https://clinic-flow.co.il/auth/confirm?token=demo',
} as ResetPasswordProps;

export default ResetPassword;
