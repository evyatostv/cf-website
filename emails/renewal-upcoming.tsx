/** 16 · חידוש תקופת העדכונים שלך מתקרב (Renewal upcoming) — Group D · Resend API. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton } from './components/ui';
import { s } from './theme';

export interface RenewalUpcomingProps {
  name: string;
  plan: string;
  renewDate: string;
  renewUrl: string;
  amount: string;
}

export function RenewalUpcoming({ plan }: RenewalUpcomingProps) {
  return <EmailLayout preheader="פרטי הרישיון החד־פעמי" unsubscribe>
    <Text style={s.h1}>פרטי הרישיון שלך</Text>
    <Text style={s.p}>{plan} נרכש בתשלום חד־פעמי לכל מחשב. אין צורך בתשלום חידוש שנתי.</Text>
    <CtaButton href="https://www.clinic-flow.co.il/dashboard">לחשבון שלי</CtaButton>
  </EmailLayout>;
}

RenewalUpcoming.PreviewProps = {
  name: 'ד״ר שרון לוי',
  plan: 'ClinicFlow Full',
  renewDate: '1 באוגוסט 2026',
  renewUrl: 'https://clinic-flow.co.il/account/renew',
  amount: 'המחיר שיוצג בעמוד החידוש',
} as RenewalUpcomingProps;

export default RenewalUpcoming;
