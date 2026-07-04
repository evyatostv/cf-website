/** 02 · קוד כניסה חד-פעמי (Magic link) — Group A · Supabase Auth. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton, KeyBox } from './components/ui';
import { brand, s } from './theme';

export interface MagicLinkProps {
  token: string;
  confirmationUrl: string;
}

export function MagicLink({
  token = '429-8153',
  confirmationUrl = 'https://clinic-flow.co.il/auth/confirm?token=demo',
}: MagicLinkProps) {
  return (
    <EmailLayout preheader="קוד חד-פעמי לכניסה לחשבון שלך.">
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        כניסה מאובטחת
      </Text>
      <Text style={s.h1}>קוד הכניסה החד-פעמי שלך</Text>
      <Text style={s.p}>
        הזן את הקוד הבא כדי להיכנס לחשבון ClinicFlow שלך. הקוד תקף ל-10 דקות.
      </Text>

      <KeyBox label="קוד כניסה" value={token} />

      <Text style={s.p}>או פשוט לחץ לכניסה מיידית:</Text>

      <CtaButton href={confirmationUrl}>כניסה לחשבון</CtaButton>

      <Text style={s.muted}>
        לא ביקשת להתחבר? התעלם מהמייל — אף אחד לא נכנס ללא הקוד הזה.
      </Text>
    </EmailLayout>
  );
}

MagicLink.PreviewProps = {
  token: '429-8153',
  confirmationUrl: 'https://clinic-flow.co.il/auth/confirm?token=demo',
} as MagicLinkProps;

export default MagicLink;
