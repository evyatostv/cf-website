/** 17 · חידוש העדכונים אושר — תודה (Renewal confirmation) — Group D · Resend API. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { Receipt, ReceiptRow } from './components/ui';
import { brand, s } from './theme';

export interface RenewalConfirmationProps {
  name: string;
  plan: string;
  amount: string;
  newPeriodEnd: string;
  invoiceUrl?: string;
}

export function RenewalConfirmation({
  name = 'ד״ר שרון לוי',
  plan = 'ClinicFlow Full',
  amount = '₪149',
  newPeriodEnd = '1 באוגוסט 2027',
  invoiceUrl,
}: RenewalConfirmationProps) {
  return (
    <EmailLayout preheader="תקופת עדכונים חדשה נפתחה. הנה הקבלה.">
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        אישור חידוש
      </Text>
      <Text style={s.h1}>תקופת העדכונים חודשה</Text>

      <Text style={s.p}>
        תודה על החידוש. תקופת העדכונים והתאימות שלך פעילה כעת לשנה נוספת — נמשיך לעדכן את התוכנה ולשמור על תאימות תיקון 13.
      </Text>

      <Receipt>
        <ReceiptRow label="תוכנית" value={plan} />
        <ReceiptRow label="תקופת עדכונים חדשה עד" value={newPeriodEnd} />
        <ReceiptRow label="סכום ששולם" value={amount} strong />
      </Receipt>

      <Text style={s.muted}>
        חשבונית מס/קבלה זמינה להורדה מאזור החשבון.
      </Text>
    </EmailLayout>
  );
}

RenewalConfirmation.PreviewProps = {
  name: 'ד״ר שרון לוי',
  plan: 'ClinicFlow Full',
  amount: '₪149',
  newPeriodEnd: '1 באוגוסט 2027',
  invoiceUrl: 'https://clinic-flow.co.il/account/invoices',
} as RenewalConfirmationProps;

export default RenewalConfirmation;
