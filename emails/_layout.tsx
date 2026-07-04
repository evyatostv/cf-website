/**
 * ClinicFlow shared email layout. Every template composes this so branding,
 * RTL wrapper, header and footer are defined exactly once.
 */
import * as React from 'react';
import {
  Html,
  Head,
  Font,
  Preview,
  Body,
  Container,
  Section,
  Img,
  Text,
  Link,
  Hr,
} from '@react-email/components';
import { brand, fontStack, s } from './theme';

export interface EmailLayoutProps {
  /** Hidden inbox-preview snippet. Required per template. */
  preheader: string;
  /** Show unsubscribe line — true ONLY for lifecycle/marketing emails (§4 legal). */
  unsubscribe?: boolean;
  /** Optional unsubscribe URL; defaults to the hosted preferences page. */
  unsubscribeUrl?: string;
  children: React.ReactNode;
}

export function EmailLayout({ preheader, unsubscribe = false, unsubscribeUrl, children }: EmailLayoutProps) {
  return (
    <Html lang="he" dir="rtl">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <Font
          fontFamily="Heebo"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/heebo/v26/NGSpv5_NC0k9P_v6ZUCbLRAHxK1EiSysdUmj.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preheader}</Preview>
      <Body style={s.body}>
        <Container style={{ ...s.container, padding: '24px 12px 8px' }}>
          {/* Header — white, logo, gradient rule */}
          <Section style={{ padding: '4px 4px 0', textAlign: 'right' }}>
            <Link href={brand.siteUrl}>
              <Img
                src={brand.logoUrl}
                width={brand.logoWidth}
                height={brand.logoHeight}
                alt="ClinicFlow"
                style={{ display: 'block', border: 0, outline: 'none', textDecoration: 'none' }}
              />
            </Link>
          </Section>
          <div style={{ height: '3px', backgroundImage: brand.gradient, borderRadius: '3px', margin: '14px 0 18px' }} />
        </Container>

        {/* Content card */}
        <Container style={s.container}>
          <Section style={s.card}>
            <Section style={s.contentPad}>{children}</Section>
          </Section>
        </Container>

        {/* Footer */}
        <Container style={{ ...s.container, padding: '20px 24px 32px' }}>
          <Text style={{ ...s.muted, textAlign: 'center', margin: '0 0 6px', fontWeight: 600, color: brand.text }}>
            {brand.siteName}
          </Text>
          <Text style={{ ...s.muted, textAlign: 'center', margin: '0 0 10px' }}>
            תוכנת ניהול קליניקה שעובדת אופליין — המידע שלך נשאר על המחשב שלך.
          </Text>
          <Text style={{ ...s.muted, textAlign: 'center', margin: '0 0 10px' }}>
            <Link href={brand.siteUrl} style={{ color: brand.primary }}>
              {brand.siteUrlLabel}
            </Link>
            {'  ·  '}
            <Link href={`mailto:${brand.supportEmail}`} style={{ color: brand.primary }}>
              {brand.supportEmail}
            </Link>
          </Text>
          {unsubscribe ? (
            <>
              <Hr style={{ borderColor: brand.border, borderStyle: 'solid', borderWidth: '0.5px', margin: '12px 0' }} />
              <Text style={{ ...s.muted, textAlign: 'center', margin: 0, fontSize: '12px' }}>
                קיבלת מייל זה כי נרשמת ל-ClinicFlow.{' '}
                <Link href={unsubscribeUrl || `${brand.siteUrl}/unsubscribe`} style={{ color: brand.muted, textDecoration: 'underline' }}>
                  להסרה מרשימת התפוצה
                </Link>
              </Text>
            </>
          ) : null}
          <Text style={{ ...s.muted, textAlign: 'center', margin: '10px 0 0', fontSize: '11.5px' }}>
            © {new Date().getFullYear()} ClinicFlow · כל הזכויות שמורות
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default EmailLayout;

/**
 * Shared building-block components, re-exported so templates can import
 * everything from a single module (`./_layout`). The implementations live in
 * `./components/ui` to keep this file focused on the page shell.
 */
export {
  CtaButton,
  CTAButton,
  KeyBox,
  Receipt,
  ReceiptRow,
  ReceiptTable,
  Callout,
  Chip,
  Chips,
  Steps,
  Divider,
  LinkFallback,
  Eyebrow,
  H1,
  P,
  Note,
} from './components/ui';
export type { ReceiptRowTuple } from './components/ui';
