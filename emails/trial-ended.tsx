/** 14 · הניסיון הסתיים — הנתונים שלך נשמרו (Trial ended) — Group C · Resend API. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton, Callout } from './components/ui';
import { brand, s } from './theme';

export interface TrialEndedProps {
  name: string;
  buyUrl: string;
}

export function TrialEnded({
  name = 'ד״ר שרון לוי',
  buyUrl = 'https://clinic-flow.co.il/pricing',
}: TrialEndedProps) {
  return (
    <EmailLayout preheader="האפליקציה עברה למצב קריאה בלבד. הנתונים שלך שמורים." unsubscribe>
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        הניסיון הסתיים
      </Text>
      <Text style={s.h1}>הניסיון הסתיים — הכול נשמר</Text>

      <Text style={s.p}>
        תקופת הניסיון הסתיימה. ClinicFlow עברה ל<strong>מצב קריאה בלבד</strong> — עדיין אפשר לצפות בכל המידע, אבל לא להוסיף או לערוך.
      </Text>

      <Callout tone="success" title="שום דבר לא נמחק">
        כל המטופלים, הביקורים והמסמכים שהזנת שמורים על המחשב שלך. רכישת רישיון פותחת מחדש את מלוא התכונות — בדיוק מאיפה שעצרת.
      </Callout>

      <CtaButton href={buyUrl}>הפעלת התוכנה עם רישיון</CtaButton>
    </EmailLayout>
  );
}

TrialEnded.PreviewProps = {
  name: 'ד״ר שרון לוי',
  buyUrl: 'https://clinic-flow.co.il/pricing',
} as TrialEndedProps;

export default TrialEnded;
