/**
 * 10 · אישור החזר (Refund confirmation) — Group B · Resend API.
 */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { Receipt, ReceiptRow } from './components/ui';
import { brand, s } from './theme';

export interface RefundConfirmationProps {
  name: string;
  plan: string;
  amount: string;
  refundId: string;
  days?: string;
}

export function RefundConfirmation({
  name = 'ד״ר שרון לוי',
  plan = 'ClinicFlow Full',
  amount = '₪1,411',
  refundId = 'RF-20915',
  days,
}: RefundConfirmationProps) {
  return (
    <EmailLayout preheader="ההחזר שלך עובד — הנה הפרטים.">
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        אישור החזר
      </Text>
      <Text style={s.h1}>שלום {name}, אישור החזר כספי</Text>
      <Text style={s.p}>
        עיבדנו את ההחזר הכספי עבור הרכישה שלך. הסכום יופיע באמצעי התשלום המקורי תוך 5–10 ימי עסקים, בהתאם לחברת האשראי.
      </Text>

      <Receipt>
        <ReceiptRow label="תוכנית" value={plan} />
        <ReceiptRow label="מספר החזר" value={refundId} />
        <ReceiptRow label="סכום שהוחזר" value={amount} strong />
      </Receipt>

      <Text style={s.muted}>
        אם ההחזר לא יופיע תוך 10 ימי עסקים, השב למייל הזה ונבדוק עבורך.
      </Text>
    </EmailLayout>
  );
}

RefundConfirmation.PreviewProps = {
  name: 'ד״ר שרון לוי',
  plan: 'ClinicFlow Full',
  amount: '₪1,411',
  refundId: 'RF-20915',
  days: '5–10',
} as RefundConfirmationProps;

export default RefundConfirmation;
