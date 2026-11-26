/** 17 · חידוש העדכונים אושר — תודה (Renewal confirmation) — Group D · Resend API. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton } from './components/ui';
import { s } from './theme';

export interface RenewalConfirmationProps {
  name: string;
  plan: string;
  amount: string;
  newPeriodEnd: string;
  invoiceUrl?: string;
}

export function RenewalConfirmation({ plan }: RenewalConfirmationProps) {
  return <EmailLayout preheader="פרטי הרישיון החד־פעמי">
    <Text style={s.h1}>פרטי הרישיון שלך</Text>
    <Text style={s.p}>{plan} נרכש בתשלום חד־פעמי לכל מחשב. אין צורך בתשלום חידוש שנתי.</Text>
    <CtaButton href="https://www.clinic-flow.co.il/dashboard">לחשבון שלי</CtaButton>
  </EmailLayout>;
}

RenewalConfirmation.PreviewProps = {
  name: 'ד״ר שרון לוי',
  plan: 'ClinicFlow Full',
  amount: 'הסכום ששולם בפועל',
  newPeriodEnd: '1 באוגוסט 2027',
  invoiceUrl: 'https://clinic-flow.co.il/account/invoices',
} as RenewalConfirmationProps;

export default RenewalConfirmation;
