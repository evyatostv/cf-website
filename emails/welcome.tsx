/** 05 · ברוכים הבאים (Welcome) — Group A · Supabase Auth. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton, Chip, Callout } from './components/ui';
import { brand, s } from './theme';

export interface WelcomeProps {
  name: string;
}

export function Welcome({ name = 'ד״ר שרון לוי' }: WelcomeProps) {
  return (
    <EmailLayout preheader="החשבון שלך מוכן. הנה מה שחשוב לדעת.">
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        החשבון שלך מוכן
      </Text>
      <Text style={s.h1}>ברוכים הבאים ל-ClinicFlow, {name}</Text>
      <Text style={s.p}>
        שמחים שהצטרפת. ClinicFlow היא תוכנת ניהול קליניקה שנבנתה סביב עיקרון אחד: <strong>המידע שלך שייך לך בלבד</strong>.
      </Text>

      <Text style={{ ...s.p, margin: '0 0 16px' }}>
        <Chip>עובד לגמרי אופליין</Chip>
        <Chip>רישיון חד-פעמי</Chip>
        <Chip>תואם תיקון 13</Chip>
      </Text>

      <Callout tone="success" title="הנתונים נשארים אצלך">
        התוכנה רצה על המחשב שלך. פרטי המטופלים לא עולים לענן ולא עוזבים את המכשיר — לעולם.
      </Callout>

      <Text style={s.p}>
        מכאן אפשר להוריד את האפליקציה, להפעיל את הרישיון ולהתחיל לנהל את הקליניקה תוך דקות.
      </Text>

      <CtaButton href="https://clinic-flow.co.il/download">להורדת האפליקציה</CtaButton>

      <Text style={s.muted}>
        יש שאלה? פשוט השב למייל הזה — אנחנו כאן.
      </Text>
    </EmailLayout>
  );
}

Welcome.PreviewProps = {
  name: 'ד״ר שרון לוי',
} as WelcomeProps;

export default Welcome;
