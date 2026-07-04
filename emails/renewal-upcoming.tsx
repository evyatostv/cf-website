/** 16 · חידוש תקופת העדכונים שלך מתקרב (Renewal upcoming) — Group D · Resend API. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton, Callout, Receipt, ReceiptRow } from './components/ui';
import { brand, s } from './theme';

export interface RenewalUpcomingProps {
  name: string;
  plan: string;
  renewDate: string;
  renewUrl: string;
  amount: string;
}

export function RenewalUpcoming({
  name = 'ד״ר שרון לוי',
  plan = 'ClinicFlow Full',
  renewDate = '1 באוגוסט 2026',
  renewUrl = 'https://clinic-flow.co.il/account/renew',
  amount = '₪149',
}: RenewalUpcomingProps) {
  return (
    <EmailLayout preheader="העדכונים ותאימות תיקון 13 — כדי שהכל יישאר עדכני." unsubscribe>
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        חידוש עדכונים
      </Text>
      <Text style={s.h1}>תקופת העדכונים שלך מתקרבת לסיום</Text>

      <Text style={s.p}>
        תקופת העדכונים והתאימות השנתית שלך תסתיים ב-<strong>{renewDate}</strong>. חידוש שומר על התוכנה מעודכנת — כולל פורמטי חשבונית מס ותאימות שוטפת ל<strong>תיקון 13</strong>.
      </Text>

      <Callout tone="info" title="התוכנה תמשיך לעבוד בכל מקרה">
        גם בלי חידוש — ClinicFlow ממשיכה לעבוד אופליין, ללא הגבלה. החידוש נועד רק לעדכונים ולתאימות רגולטורית חדשה.
      </Callout>

      <Receipt>
        <ReceiptRow label="תוכנית" value={plan} />
        <ReceiptRow label="חידוש עד" value={renewDate} />
        <ReceiptRow label="עלות שנתית" value={amount} />
      </Receipt>

      <CtaButton href={renewUrl}>חידוש תקופת העדכונים</CtaButton>
    </EmailLayout>
  );
}

RenewalUpcoming.PreviewProps = {
  name: 'ד״ר שרון לוי',
  plan: 'ClinicFlow Full',
  renewDate: '1 באוגוסט 2026',
  renewUrl: 'https://clinic-flow.co.il/account/renew',
  amount: '₪149',
} as RenewalUpcomingProps;

export default RenewalUpcoming;
