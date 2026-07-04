/**
 * 09 · נדרשת פעולה (Payment failed) — Group B · Resend API.
 */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton, Callout } from './components/ui';
import { brand, s } from './theme';

export interface PaymentFailedProps {
  name: string;
  plan: string;
  amount: string;
  retryUrl: string;
}

export function PaymentFailed({
  name = 'ד״ר שרון לוי',
  plan = 'ClinicFlow Full',
  amount = '₪1,411',
  retryUrl = 'https://clinic-flow.co.il/checkout/retry',
}: PaymentFailedProps) {
  return (
    <EmailLayout preheader="לא הצלחנו לחייב את אמצעי התשלום. אפשר לנסות שוב.">
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        נדרשת פעולה
      </Text>
      <Text style={s.h1}>שלום {name}, התשלום לא הושלם</Text>

      <Callout tone="warn" title="החיוב נכשל">
        לא הצלחנו לחייב את אמצעי התשלום עבור {plan} ({amount}). ייתכן שהכרטיס פג תוקף או שלא אושר.
      </Callout>

      <Text style={s.p}>
        אין צורך לדאוג — לא בוצע חיוב וההזמנה שמורה. אפשר לעדכן את אמצעי התשלום ולנסות שוב בלחיצה אחת.
      </Text>

      <CtaButton href={retryUrl}>עדכון תשלום וניסיון חוזר</CtaButton>

      <Text style={s.muted}>
        נתקלת בבעיה? השב למייל ונשמח לעזור להשלים את הרכישה.
      </Text>
    </EmailLayout>
  );
}

PaymentFailed.PreviewProps = {
  name: 'ד״ר שרון לוי',
  plan: 'ClinicFlow Full',
  amount: '₪1,411',
  retryUrl: 'https://clinic-flow.co.il/checkout/retry',
} as PaymentFailedProps;

export default PaymentFailed;
