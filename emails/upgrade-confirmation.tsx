/**
 * 08 · אישור שדרוג (Upgrade confirmation) — Group B · Resend API.
 */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton, Receipt, ReceiptRow } from './components/ui';
import { brand, s } from './theme';

export interface UpgradeConfirmationProps {
  name: string;
  fromPlan: string;
  toPlan: string;
  credit: string;
  difference: string;
  licenseKey?: string;
}

export function UpgradeConfirmation({
  name = 'ד״ר שרון לוי',
  fromPlan = 'ClinicFlow Pro',
  toPlan = 'ClinicFlow Full',
  credit = '−₪690',
  difference = '₪721',
  licenseKey,
}: UpgradeConfirmationProps) {
  return (
    <EmailLayout preheader="שילמת רק את ההפרש — הנה הפירוט.">
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        אישור שדרוג
      </Text>
      <Text style={s.h1}>שלום {name}, השדרוג הושלם</Text>
      <Text style={s.p}>
        שדרגת בהצלחה מ-<strong>{fromPlan}</strong> ל-<strong>{toPlan}</strong>. כמו שהובטח — שילמת רק את ההפרש, בזיכוי מלא של מה ששילמת קודם.
      </Text>

      <Receipt>
        <ReceiptRow label="תוכנית קודמת" value={fromPlan} />
        <ReceiptRow label="תוכנית חדשה" value={toPlan} />
        <ReceiptRow label="זיכוי על התוכנית הקודמת" value={credit} />
        <ReceiptRow label="הפרש ששולם" value={difference} strong />
      </Receipt>

      <Text style={s.p}>
        כל התכונות הנוספות כבר פעילות ברישיון הקיים שלך — אין צורך להזין מפתח חדש.
      </Text>

      <CtaButton href="https://clinic-flow.co.il/whats-new">מה חדש בתוכנית Full</CtaButton>
    </EmailLayout>
  );
}

UpgradeConfirmation.PreviewProps = {
  name: 'ד״ר שרון לוי',
  fromPlan: 'ClinicFlow Pro',
  toPlan: 'ClinicFlow Full',
  credit: '−₪690',
  difference: '₪721',
  licenseKey: 'CF-FULL-••••-A1D3',
} as UpgradeConfirmationProps;

export default UpgradeConfirmation;
