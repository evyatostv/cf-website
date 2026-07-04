/**
 * 06 · אישור הזמנה (Order confirmation) — Group B · Resend API.
 */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton, Receipt, ReceiptRow, Chip } from './components/ui';
import { brand, s } from './theme';

export interface OrderConfirmationProps {
  name: string;
  plan: string;
  amount: string;
  vat: string;
  total: string;
  orderId: string;
  invoiceUrl?: string;
}

export function OrderConfirmation({
  name = 'ד״ר שרון לוי',
  plan = 'ClinicFlow Full',
  amount = '₪1,196',
  vat = '₪215',
  total = '₪1,411',
  orderId = 'CF-10428',
  invoiceUrl = 'https://clinic-flow.co.il/account/orders',
}: OrderConfirmationProps) {
  return (
    <EmailLayout preheader="תודה על הרכישה — הנה סיכום ההזמנה שלך.">
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        אישור הזמנה
      </Text>
      <Text style={s.h1}>שלום {name}, תודה על הרכישה 🎉</Text>
      <Text style={s.p}>
        קיבלנו את התשלום שלך. הנה סיכום ההזמנה. מפתח הרישיון והוראות ההפעלה נשלחים במייל נפרד — הוא בדרך אליך עכשיו.
      </Text>

      <Receipt>
        <ReceiptRow label="תוכנית" value={plan} />
        <ReceiptRow label="סוג רישיון" value="תשלום חד-פעמי" />
        <ReceiptRow label="מספר הזמנה" value={orderId} />
        <ReceiptRow label="סכום לפני מע״מ" value={amount} />
        <ReceiptRow label="מע״מ (18%)" value={vat} />
        <ReceiptRow label="סה״כ ששולם" value={total} strong />
      </Receipt>

      <Text style={{ ...s.p, margin: '0 0 16px' }}>
        <Chip>תואם תיקון 13</Chip>
        <Chip>ללא מנוי חודשי</Chip>
      </Text>

      <Text style={s.muted}>
        חשבונית מס/קבלה רשמית תישלח בנפרד או זמינה להורדה מאזור החשבון.
      </Text>

      <CtaButton href={invoiceUrl}>צפייה בהזמנה</CtaButton>
    </EmailLayout>
  );
}

OrderConfirmation.PreviewProps = {
  name: 'ד״ר שרון לוי',
  plan: 'ClinicFlow Full',
  amount: '₪1,196',
  vat: '₪215',
  total: '₪1,411',
  orderId: 'CF-10428',
  invoiceUrl: 'https://clinic-flow.co.il/account/orders',
} as OrderConfirmationProps;

export default OrderConfirmation;
