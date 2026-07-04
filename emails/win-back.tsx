/** 15 · הנתונים שלך עדיין כאן, מחכים לך (Win-back) — Group C · Resend API. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton } from './components/ui';
import { brand, s } from './theme';

export interface WinBackProps {
  name: string;
  resumeUrl: string;
}

export function WinBack({
  name = 'ד״ר שרון לוי',
  resumeUrl = 'https://clinic-flow.co.il/pricing',
}: WinBackProps) {
  return (
    <EmailLayout preheader="שום דבר לא נמחק — אפשר להמשיך בדיוק מאיפה שעצרת." unsubscribe>
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        נשמח לראותך שוב
      </Text>
      <Text style={s.h1}>הנתונים שלך עדיין כאן</Text>

      <Text style={s.p}>
        עבר קצת זמן מאז שהתנסית ב-ClinicFlow. רצינו רק להזכיר: <strong>כל מה שהזנת עדיין שמור על המחשב שלך</strong>, ואפשר להמשיך בכל רגע.
      </Text>

      <Text style={s.p}>
        אם משהו חסר לך בתוכנה או לא היה ברור — נשמח לשמוע. תשובה למייל הזה מגיעה ישירות אלינו.
      </Text>

      <CtaButton href={resumeUrl}>חזרה ל-ClinicFlow</CtaButton>
    </EmailLayout>
  );
}

WinBack.PreviewProps = {
  name: 'ד״ר שרון לוי',
  resumeUrl: 'https://clinic-flow.co.il/pricing',
} as WinBackProps;

export default WinBack;
