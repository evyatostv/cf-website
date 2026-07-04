/** 13 · הניסיון שלך מסתיים בקרוב (Trial ending) — Group C · Resend API. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton, Callout } from './components/ui';
import { brand, s } from './theme';

export interface TrialEndingProps {
  name: string;
  daysLeft: number;
  endDate: string;
  upgradeUrl: string;
}

export function TrialEnding({
  name = 'ד״ר שרון לוי',
  daysLeft = 3,
  endDate = '16 ביולי 2026',
  upgradeUrl = 'https://clinic-flow.co.il/pricing',
}: TrialEndingProps) {
  return (
    <EmailLayout preheader="נותרו לך עוד כמה ימים — כדאי לשמור על הרצף." unsubscribe>
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        תזכורת ניסיון
      </Text>
      <Text style={s.h1}>נותרו לך {daysLeft} ימים בניסיון</Text>

      <Text style={s.p}>
        תקופת הניסיון שלך ב-ClinicFlow מסתיימת ב-<strong>{endDate}</strong>. אם התוכנה מתאימה לך, זה הזמן לעבור לרישיון קבוע ולשמור על רצף העבודה.
      </Text>

      <Callout tone="info" title="רישיון חד-פעמי, בלי מנוי">
        תשלום אחד והתוכנה שלך לתמיד. בלי חיובים חודשיים, בלי הפתעות.
      </Callout>

      <CtaButton href={upgradeUrl}>מעבר לרישיון מלא</CtaButton>

      <Text style={s.muted}>
        גם אם הניסיון יסתיים — הנתונים שהזנת יישמרו במלואם.
      </Text>
    </EmailLayout>
  );
}

TrialEnding.PreviewProps = {
  name: 'ד״ר שרון לוי',
  daysLeft: 3,
  endDate: '16 ביולי 2026',
  upgradeUrl: 'https://clinic-flow.co.il/pricing',
} as TrialEndingProps;

export default TrialEnding;
