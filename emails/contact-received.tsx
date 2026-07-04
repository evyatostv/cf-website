/** 19 · קיבלנו את פנייתך — נחזור אליך בהקדם (Contact received) — Group E · Resend API. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { Callout } from './components/ui';
import { brand, s } from './theme';

export interface ContactReceivedProps {
  name: string;
  messagePreview?: string;
  ticketId?: string;
}

export function ContactReceived({
  name = 'ד״ר שרון לוי',
  messagePreview = '״שלום, אשמח לדעת אם אפשר לייבא רשומות מטופלים מתוכנה קיימת…״',
  ticketId = 'SUP-4471',
}: ContactReceivedProps) {
  return (
    <EmailLayout preheader="הפנייה שלך התקבלה. נענה בדרך כלל תוך יום עסקים.">
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        קיבלנו את פנייתך
      </Text>
      <Text style={s.h1}>תודה שפנית אלינו</Text>

      <Text style={s.p}>
        שלום שרון, קיבלנו את הפנייה שלך ונחזור אליך בהקדם — בדרך כלל תוך <strong>יום עסקים אחד</strong>.
      </Text>

      <Callout tone="info" title={`פנייה מס׳ ${ticketId}`}>
        {messagePreview}
      </Callout>

      <Text style={s.muted}>
        אין צורך לענות למייל הזה — זו הודעת אישור אוטומטית. נחזור אליך מכתובת אמיתית.
      </Text>
    </EmailLayout>
  );
}

ContactReceived.PreviewProps = {
  name: 'ד״ר שרון לוי',
  messagePreview: '״שלום, אשמח לדעת אם אפשר לייבא רשומות מטופלים מתוכנה קיימת…״',
  ticketId: 'SUP-4471',
} as ContactReceivedProps;

export default ContactReceived;
