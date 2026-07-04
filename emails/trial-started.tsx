/** 12 · תקופת הניסיון שלך ב-ClinicFlow התחילה (Trial started) — Group C · Resend API. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton, Callout } from './components/ui';
import { brand, s } from './theme';

export interface TrialStartedProps {
  name: string;
  daysTotal: number;
  endDate: string;
  downloadUrl: string;
}

export function TrialStarted({
  name = 'ד״ר שרון לוי',
  daysTotal = 14,
  endDate = '16 ביולי 2026',
  downloadUrl = 'https://clinic-flow.co.il/download',
}: TrialStartedProps) {
  return (
    <EmailLayout preheader="14 יום להתרשם, בלי כרטיס אשראי." unsubscribe>
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        הניסיון התחיל
      </Text>
      <Text style={s.h1}>14 יום להכיר את ClinicFlow</Text>

      <Text style={s.p}>
        תקופת הניסיון שלך התחילה — <strong>{daysTotal} יום מלאים, ללא צורך בכרטיס אשראי</strong>. כל התכונות פתוחות, וכל מה שתזין נשמר על המחשב שלך.
      </Text>

      <Callout tone="success" title="הנתונים שלך אצלך מהרגע הראשון">
        ClinicFlow עובדת אופליין. גם בזמן הניסיון, פרטי המטופלים לא עוזבים את המחשב.
      </Callout>

      <Text style={s.p}>
        הניסיון פעיל עד <strong>{endDate}</strong>. הדרך הכי טובה להתרשם — לנהל יום עבודה אמיתי בתוכנה.
      </Text>

      <CtaButton href={downloadUrl}>פתיחת האפליקציה</CtaButton>
    </EmailLayout>
  );
}

TrialStarted.PreviewProps = {
  name: 'ד״ר שרון לוי',
  daysTotal: 14,
  endDate: '16 ביולי 2026',
  downloadUrl: 'https://clinic-flow.co.il/download',
} as TrialStartedProps;

export default TrialStarted;
