/** 20 · מענה לפנייתך לגבי ClinicFlow Premium (Sales response) — Group E · Resend API. */
import * as React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './_layout';
import { CtaButton } from './components/ui';
import { brand, s } from './theme';

export interface SalesResponseProps {
  name: string;
  agentName?: string;
  ctaUrl?: string;
}

export function SalesResponse({
  name = 'ד״ר שרון לוי',
  agentName = 'יעל',
  ctaUrl = 'https://clinic-flow.co.il/premium',
}: SalesResponseProps) {
  return (
    <EmailLayout preheader="תודה על ההתעניינות — הנה המידע שביקשת.">
      <Text style={{ ...s.muted, margin: '0 0 6px', color: brand.primary, fontWeight: 600 }}>
        תוכנית Premium
      </Text>
      <Text style={s.h1}>תודה על ההתעניינות ב-Premium</Text>

      <Text style={s.p}>
        שלום שרון, תודה על הפנייה. ClinicFlow Premium מיועדת לאנשי מקצוע שצריכים יכולות מתקדמות — לצד אותה התחייבות לפרטיות ולעבודה אופליין.
      </Text>

      <Text style={s.p}>
        התוכנית כוללת חוות דעת משפטיות, יומן מקצועי מורחב, גיבויים מוצפנים מתקדמים ותמיכה בעדיפות.
      </Text>

      <CtaButton href={ctaUrl}>תיאום שיחה קצרה</CtaButton>

      <Text style={s.muted}>
        אפשר פשוט להשיב למייל הזה עם כל שאלה — אשמח לעזור. — {agentName}, צוות ClinicFlow
      </Text>
    </EmailLayout>
  );
}

SalesResponse.PreviewProps = {
  name: 'ד״ר שרון לוי',
  agentName: 'יעל',
  ctaUrl: 'https://clinic-flow.co.il/premium',
} as SalesResponseProps;

export default SalesResponse;
