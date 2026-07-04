/**
 * 07 · מסירת מפתח רישיון + הפעלה  (License key delivery + activation guide)
 * The single most important email in the set — a non-technical solo
 * practitioner must be able to activate the app OFFLINE by following it.
 * Group B · Resend API.
 */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton, KeyBox, Steps, Callout, Divider, Chip } from './components/ui';
import { brand, s } from './theme';

export interface LicenseDeliveryProps {
  name: string;
  plan: string;
  licenseKey: string;
  downloadUrl: string;
  os?: 'mac' | 'windows';
}

export function LicenseDelivery({
  name = 'ד״ר שרון לוי',
  plan = 'ClinicFlow Full',
  licenseKey = 'CF-FULL-7Q2M-4K9X-A1D3',
  downloadUrl = 'https://clinic-flow.co.il/download',
  os = 'mac',
}: LicenseDeliveryProps) {
  return (
    <EmailLayout preheader={`מפתח הרישיון שלך מוכן — הפעלה ב-3 שלבים, גם ללא חיבור לאינטרנט. (${licenseKey})`}>
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        הרישיון שלך מוכן
      </Text>
      <Text style={s.h1}>שלום {name}, ClinicFlow מוכנה להפעלה 🎉</Text>
      <Text style={s.p}>
        תודה על הרכישה. להלן מפתח הרישיון שלך לתוכנית <strong>{plan}</strong>. שמרו את המייל הזה — המפתח מאפשר
        הפעלה של התוכנה, כולל <strong>הפעלה מלאה ללא חיבור לאינטרנט</strong>.
      </Text>

      <KeyBox label="מפתח הרישיון שלך" value={licenseKey} />

      <Text style={{ ...s.p, fontWeight: 700, margin: '0 0 12px' }}>הפעלה ב-3 שלבים:</Text>
      <Steps
        items={[
          <>
            הורידו והתקינו את ClinicFlow למחשב ה{os === 'mac' ? 'Mac' : 'Windows'} שלכם מקישור ההורדה למטה.
          </>,
          <>
            פתחו את האפליקציה ובחרו <strong>״הפעלת רישיון״</strong> במסך הפתיחה.
          </>,
          <>
            הדביקו את המפתח שלמעלה ולחצו <strong>״הפעל״</strong>. זהו — הקליניקה שלכם מוכנה לעבודה.
          </>,
        ]}
      />

      <CtaButton href={downloadUrl}>הורדה והתקנה</CtaButton>

      <Callout tone="success" title="עובד גם בלי אינטרנט">
        אם המחשב לא מחובר לרשת, בחרו ״הפעלה לא-מקוונת״ במסך ההפעלה והזינו את המפתח ידנית. הרישיון נשמר על המחשב שלכם.
      </Callout>

      <Divider />

      <Text style={{ ...s.p, margin: '0 0 10px' }}>
        <Chip>תואם תיקון 13</Chip>
        <Chip>רישיון חד-פעמי</Chip>
      </Text>
      <Text style={s.muted}>
        צריכים להעביר את הרישיון למחשב אחר בעתיד? אין בעיה — ניתן להפעיל מחדש במכשיר חדש בקלות. לכל שאלה על ההתקנה,
        השיבו למייל הזה ונשמח לעזור.
      </Text>
    </EmailLayout>
  );
}

LicenseDelivery.PreviewProps = {
  name: 'ד״ר שרון לוי',
  plan: 'ClinicFlow Full',
  licenseKey: 'CF-FULL-7Q2M-4K9X-A1D3',
  downloadUrl: 'https://clinic-flow.co.il/download',
  os: 'mac',
} as LicenseDeliveryProps;

export default LicenseDelivery;
