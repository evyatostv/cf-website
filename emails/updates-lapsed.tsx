/** 18 · תקופת העדכונים הסתיימה — האפליקציה ממשיכה לעבוד (Updates lapsed) — Group D · Resend API. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton, Callout } from './components/ui';
import { brand, s } from './theme';

export interface UpdatesLapsedProps {
  name: string;
  plan: string;
  renewUrl: string;
}

export function UpdatesLapsed({
  name = 'ד״ר שרון לוי',
  plan = 'ClinicFlow Full',
  renewUrl = 'https://clinic-flow.co.il/account/renew',
}: UpdatesLapsedProps) {
  return (
    <EmailLayout preheader="התוכנה ממשיכה לעבוד לתמיד. רק העדכונים החדשים מושהים." unsubscribe>
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        עדכונים
      </Text>
      <Text style={s.h1}>תקופת העדכונים הסתיימה</Text>

      <Callout tone="success" title="התוכנה שלך ממשיכה לעבוד — לתמיד">
        הרישיון שלך הוא חד-פעמי. סיום תקופת העדכונים לא משפיע על השימוש: כל התכונות והנתונים ממשיכים לעבוד כרגיל, אופליין.
      </Callout>

      <Text style={s.p}>
        מה שמושהה הוא רק <strong>עדכוני גרסה חדשים</strong> ותאימות לרגולציה עתידית. חידוש מפעיל אותם מחדש מיד.
      </Text>

      <CtaButton href={renewUrl}>חידוש כדי לחדש עדכונים</CtaButton>
    </EmailLayout>
  );
}

UpdatesLapsed.PreviewProps = {
  name: 'ד״ר שרון לוי',
  plan: 'ClinicFlow Full',
  renewUrl: 'https://clinic-flow.co.il/account/renew',
} as UpdatesLapsedProps;

export default UpdatesLapsed;
