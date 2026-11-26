/** 18 · תקופת העדכונים הסתיימה — האפליקציה ממשיכה לעבוד (Updates lapsed) — Group D · Resend API. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton } from './components/ui';
import { s } from './theme';

export interface UpdatesLapsedProps {
  name: string;
  plan: string;
  renewUrl: string;
}

export function UpdatesLapsed({ plan }: UpdatesLapsedProps) {
  return <EmailLayout preheader="פרטי הרישיון החד־פעמי" unsubscribe>
    <Text style={s.h1}>פרטי הרישיון שלך</Text>
    <Text style={s.p}>{plan} נרכש בתשלום חד־פעמי לכל מחשב. אין צורך בתשלום חידוש שנתי.</Text>
    <CtaButton href="https://www.clinic-flow.co.il/dashboard">לחשבון שלי</CtaButton>
  </EmailLayout>;
}

UpdatesLapsed.PreviewProps = {
  name: 'ד״ר שרון לוי',
  plan: 'ClinicFlow Full',
  renewUrl: 'https://clinic-flow.co.il/account/renew',
} as UpdatesLapsedProps;

export default UpdatesLapsed;
