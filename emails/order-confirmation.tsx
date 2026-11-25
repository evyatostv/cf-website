/**
 * 06 · אישור הזמנה (Order confirmation) — Group B · Resend API.
 */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton, Receipt, ReceiptRow } from './components/ui';
import { brand, s } from './theme';

export interface OrderConfirmationProps {
  name: string;
  plan: string;
  total: string;
  orderId: string;
  invoiceUrl?: string;
}

export function OrderConfirmation({
  name = 'ד״ר שרון לוי',
  plan = 'ClinicFlow Full',
  total = '₪1,499',
  orderId = 'CF-10428',
  invoiceUrl = 'https://clinic-flow.co.il/account/orders',
}: OrderConfirmationProps) {
  return (
    <EmailLayout preheader="תודה על הרכישה — הנה סיכום ההזמנה שלך.">
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        אישור הזמנה
      </Text>
      <Text style={s.h1}>{name ? `שלום ${name}, ` : ''}תודה על הרכישה 🎉</Text>
      <Text style={s.p}>
        התשלום התקבל. אפשר להיכנס לאזור האישי עם החשבון ששימש לרכישה כדי להוריד את התוכנה.
      </Text>

      <Receipt>
        <ReceiptRow label="תוכנית" value={plan} />
        <ReceiptRow label="סוג רישיון" value="תשלום חד-פעמי" />
        <ReceiptRow label="מספר הזמנה" value={orderId} />
        <ReceiptRow label="סה״כ ששולם" value={total} strong />
      </Receipt>

      <CtaButton href={invoiceUrl}>צפייה בהזמנה</CtaButton>
    </EmailLayout>
  );
}

OrderConfirmation.PreviewProps = {
  name: 'ד״ר שרון לוי',
  plan: 'ClinicFlow Full',
  total: '₪1,499',
  orderId: 'CF-10428',
  invoiceUrl: 'https://clinic-flow.co.il/account/orders',
} as OrderConfirmationProps;

export default OrderConfirmation;
