/** 04 · אישור שינוי אימייל (Change email) — Group A · Supabase Auth. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton } from './components/ui';
import { brand, s } from './theme';

export interface ChangeEmailProps {
  confirmationUrl: string;
  newEmail: string;
}

export function ChangeEmail({
  confirmationUrl = 'https://clinic-flow.co.il/auth/confirm?token=demo',
  newEmail = 'newapp@clinic-flow.co.il',
}: ChangeEmailProps) {
  return (
    <EmailLayout preheader="אשרו את כתובת האימייל החדשה לחשבון שלך.">
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        עדכון חשבון
      </Text>
      <Text style={s.h1}>אישור כתובת אימייל חדשה</Text>
      <Text style={s.p}>
        התקבלה בקשה לעדכן את כתובת האימייל בחשבון שלך אל <strong>{newEmail}</strong>. אשר את השינוי כדי להחיל אותו.
      </Text>

      <CtaButton href={confirmationUrl}>אישור הכתובת החדשה</CtaButton>

      <Text style={s.muted}>
        אם לא ביקשת את השינוי, השב למייל הזה מיד — נשמור על החשבון שלך.
      </Text>
    </EmailLayout>
  );
}

ChangeEmail.PreviewProps = {
  confirmationUrl: 'https://clinic-flow.co.il/auth/confirm?token=demo',
  newEmail: 'newapp@clinic-flow.co.il',
} as ChangeEmailProps;

export default ChangeEmail;
