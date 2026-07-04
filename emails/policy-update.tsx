/** 21 · עדכון במדיניות ובתנאי השימוש (Policy update) — Group E · Resend API. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton, LinkFallback } from './components/ui';
import { brand, s } from './theme';

export interface PolicyUpdateProps {
  effectiveDate: string;
  termsUrl: string;
  privacyUrl: string;
  name?: string;
}

export function PolicyUpdate({
  effectiveDate = '1 באוגוסט 2026',
  termsUrl = 'https://clinic-flow.co.il/terms',
  privacyUrl = 'https://clinic-flow.co.il/privacy',
  name = 'ד״ר שרון לוי',
}: PolicyUpdateProps) {
  return (
    <EmailLayout preheader="עדכנו את התנאים ומדיניות הפרטיות. הנה מה שהשתנה." unsubscribe>
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        עדכון מדיניות
      </Text>
      <Text style={s.h1}>עדכנו את התנאים ומדיניות הפרטיות</Text>

      <Text style={s.p}>
        עדכנו את תנאי השימוש ומדיניות הפרטיות של ClinicFlow. השינויים נכנסים לתוקף ב-<strong>{effectiveDate}</strong>.
      </Text>

      <Text style={s.p}>
        עיקרי העדכון: הבהרות לגבי אחסון מקומי של נתונים, ניסוח מעודכן בהתאם לתיקון 13, ופרטי יצירת קשר לממונה הגנת הפרטיות. <strong>העיקרון לא השתנה — המידע שלך נשאר על המחשב שלך.</strong>
      </Text>

      <CtaButton href={termsUrl}>קריאת התנאים המעודכנים</CtaButton>

      <LinkFallback label="מדיניות הפרטיות:" href={privacyUrl} />
    </EmailLayout>
  );
}

PolicyUpdate.PreviewProps = {
  effectiveDate: '1 באוגוסט 2026',
  termsUrl: 'https://clinic-flow.co.il/terms',
  privacyUrl: 'https://clinic-flow.co.il/privacy',
  name: 'ד״ר שרון לוי',
} as PolicyUpdateProps;

export default PolicyUpdate;
