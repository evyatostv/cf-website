/** 01 · אימות כתובת האימייל (Confirm email) — Group A · Supabase Auth. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton, LinkFallback } from './components/ui';
import { brand, s } from './theme';

export interface ConfirmEmailProps {
  confirmationUrl: string;
}

export function ConfirmEmail({
  confirmationUrl = 'https://clinic-flow.co.il/auth/confirm?token=demo',
}: ConfirmEmailProps) {
  return (
    <EmailLayout preheader="עוד לחיצה אחת ונסיים את ההרשמה שלך.">
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        אימות חשבון
      </Text>
      <Text style={s.h1}>נותר רק לאמת את האימייל</Text>
      <Text style={s.p}>
        תודה שנרשמת ל-ClinicFlow. כדי להשלים את יצירת החשבון ולהבטיח שנוכל להגיע אליך, נאמת את כתובת האימייל שלך.
      </Text>

      <CtaButton href={confirmationUrl}>אימות כתובת האימייל</CtaButton>

      <LinkFallback label="או העתק את הקישור הזה לדפדפן:" href={confirmationUrl} />

      <Text style={s.muted}>
        אם לא נרשמת ל-ClinicFlow, אפשר להתעלם מהמייל הזה — לא נוצר עבורך חשבון.
      </Text>
    </EmailLayout>
  );
}

ConfirmEmail.PreviewProps = {
  confirmationUrl: 'https://clinic-flow.co.il/auth/confirm?token=demo',
} as ConfirmEmailProps;

export default ConfirmEmail;
