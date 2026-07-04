/**
 * 11 · התראת אבטחה (Device reactivation) — Group B · Resend API.
 */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { Receipt, ReceiptRow, Callout } from './components/ui';
import { brand, s } from './theme';

export interface DeviceReactivationProps {
  name: string;
  deviceName: string;
  date: string;
  licenseKey: string;
}

export function DeviceReactivation({
  name = 'ד״ר שרון לוי',
  deviceName = 'MacBook Pro · שרון',
  date = '2 ביולי 2026, 14:32',
  licenseKey = 'CF-FULL-••••-A1D3',
}: DeviceReactivationProps) {
  return (
    <EmailLayout preheader="הפעלת את ClinicFlow במחשב חדש — אישור אבטחה.">
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        התראת אבטחה
      </Text>
      <Text style={s.h1}>שלום {name}, הרישיון הופעל במכשיר חדש</Text>
      <Text style={s.p}>
        הרישיון שלך הופעל בהצלחה במחשב חדש. שולחים אישור כדי שתמיד תדע מה קורה עם הרישיון שלך.
      </Text>

      <Receipt>
        <ReceiptRow label="מכשיר" value={deviceName} />
        <ReceiptRow label="תאריך הפעלה" value={date} />
        <ReceiptRow label="מפתח רישיון" value={licenseKey} />
      </Receipt>

      <Callout tone="info" title="זה היית אתה?">
        אם כן — אין צורך לעשות דבר. אם לא זיהית את ההפעלה הזו, השב למייל מיד ונאבטח את הרישיון שלך.
      </Callout>
    </EmailLayout>
  );
}

DeviceReactivation.PreviewProps = {
  name: 'ד״ר שרון לוי',
  deviceName: 'MacBook Pro · שרון',
  date: '2 ביולי 2026, 14:32',
  licenseKey: 'CF-FULL-••••-A1D3',
} as DeviceReactivationProps;

export default DeviceReactivation;
