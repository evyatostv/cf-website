/**
 * Shared ClinicFlow email primitives. All RTL-aware, inline-styled,
 * email-client safe (table/section based, no flexbox/grid).
 */
import * as React from 'react';
import { Section, Row, Column, Text, Link, Button as REButton, Hr } from '@react-email/components';
import { brand, fontStack, s } from '../theme';

/** Primary gradient CTA. Use exactly one per email. */
export function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={{ textAlign: 'center', margin: '8px 0 24px' }}>
      <REButton href={href} style={s.cta}>
        {children}
      </REButton>
    </Section>
  );
}

/** Monospace key / code display — used for license keys and OTP codes. */
export function KeyBox({ label, value }: { label?: string; value: string }) {
  return (
    <Section
      style={{
        backgroundColor: brand.accentSurface,
        border: `1px solid ${brand.border}`,
        borderRadius: `${brand.radius}px`,
        padding: '18px 20px',
        margin: '4px 0 22px',
        textAlign: 'center',
      }}
    >
      {label ? (
        <Text style={{ ...s.muted, textAlign: 'center', margin: '0 0 8px', color: brand.primary, fontWeight: 600 }}>
          {label}
        </Text>
      ) : null}
      <Text
        style={{
          fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
          fontSize: '22px',
          fontWeight: 700,
          letterSpacing: '2px',
          color: brand.text,
          margin: 0,
          direction: 'ltr',
          textAlign: 'center',
        }}
      >
        {value}
      </Text>
    </Section>
  );
}

/** A single label→value line for receipts. */
export function ReceiptRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <Row style={{ borderBottom: `1px solid ${brand.border}` }}>
      <Column style={{ padding: '11px 0', textAlign: 'right', verticalAlign: 'top' }}>
        <Text style={{ ...s.p, margin: 0, fontSize: '15px', color: brand.muted }}>{label}</Text>
      </Column>
      <Column style={{ padding: '11px 0', textAlign: 'left', verticalAlign: 'top' }}>
        <Text
          style={{
            ...s.p,
            margin: 0,
            fontSize: strong ? '17px' : '15px',
            fontWeight: strong ? 700 : 500,
            textAlign: 'left',
            direction: 'ltr',
          }}
        >
          {value}
        </Text>
      </Column>
    </Row>
  );
}

export function Receipt({ children }: { children: React.ReactNode }) {
  return (
    <Section
      style={{
        border: `1px solid ${brand.border}`,
        borderRadius: `${brand.radius}px`,
        padding: '4px 20px',
        margin: '4px 0 24px',
      }}
    >
      {children}
    </Section>
  );
}

/** Tinted callout box. Tone drives color. */
export function Callout({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'success' | 'warn' | 'danger';
  title?: string;
  children: React.ReactNode;
}) {
  const map = {
    info: { bg: brand.accentSurface, bar: brand.primary },
    success: { bg: brand.successSurface, bar: brand.success },
    warn: { bg: brand.warnSurface, bar: brand.warn },
    danger: { bg: brand.dangerSurface, bar: brand.danger },
  }[tone];
  return (
    <Section
      style={{
        backgroundColor: map.bg,
        borderRight: `3px solid ${map.bar}`,
        borderRadius: '10px',
        padding: '14px 18px',
        margin: '4px 0 22px',
      }}
    >
      {title ? (
        <Text style={{ ...s.p, margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: map.bar }}>
          {title}
        </Text>
      ) : null}
      <Text style={{ ...s.p, margin: 0, fontSize: '15px' }}>{children}</Text>
    </Section>
  );
}

/** Small pill, e.g. "תואם תיקון 13". */
export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: brand.accentSurface,
        color: brand.primary,
        border: `1px solid ${brand.border}`,
        borderRadius: '999px',
        padding: '5px 12px',
        fontSize: '12.5px',
        fontWeight: 600,
        fontFamily: fontStack,
        margin: '0 0 0 6px',
      }}
    >
      {children}
    </span>
  );
}

/** Numbered step list — used by the activation guide. */
export function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <Section style={{ margin: '4px 0 20px' }}>
      {items.map((item, i) => (
        <Row key={i} style={{ marginBottom: '10px' }}>
          <Column style={{ width: '34px', verticalAlign: 'top', paddingTop: '2px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                lineHeight: '26px',
                borderRadius: '999px',
                backgroundColor: brand.primary,
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                textAlign: 'center',
                fontFamily: fontStack,
              }}
            >
              {i + 1}
            </div>
          </Column>
          <Column style={{ verticalAlign: 'top', paddingRight: '10px' }}>
            <Text style={{ ...s.p, margin: '0 0 2px', fontSize: '15px', lineHeight: '1.6' }}>{item}</Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}

export function Divider() {
  return <Hr style={{ borderColor: brand.border, borderStyle: 'solid', borderWidth: '0.5px', margin: '24px 0' }} />;
}

/** Secondary/quiet link shown under a primary CTA (e.g. "or copy this link"). */
export function LinkFallback({ label, href }: { label: string; href: string }) {
  return (
    <Text style={{ ...s.muted, textAlign: 'center', margin: '0 0 18px', wordBreak: 'break-all' }}>
      {label}
      <br />
      <Link href={href} style={{ color: brand.primary, direction: 'ltr' }}>
        {href}
      </Link>
    </Text>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Text primitives + convenience wrappers.
 * These mirror the DESIGN-SOURCE anatomy (eyebrow → h1 → paragraphs → note)
 * and give the wiring/template agents a data-driven API (string[] / rows[])
 * on top of the composable components above.
 * ──────────────────────────────────────────────────────────────────────── */

/** Small primary-colored kicker above the H1 (".eyebrow" in DESIGN-SOURCE). */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ ...s.p, margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: brand.primary }}>
      {children}
    </Text>
  );
}

/** Email headline (".m-h1"). */
export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={s.h1}>{children}</Text>;
}

/** Body paragraph (".m-p"). */
export function P({ children }: { children: React.ReactNode }) {
  return <Text style={s.p}>{children}</Text>;
}

/** Quiet muted note (".m-note"). */
export function Note({ children }: { children: React.ReactNode }) {
  return <Text style={s.muted}>{children}</Text>;
}

/** Alias matching the design-system name used across templates/spec. */
export const CTAButton = CtaButton;

/** Data-driven chips row: <Chips items={["…","…"]} />. */
export function Chips({ items }: { items: string[] }) {
  return (
    <Section style={{ margin: '0 0 16px', textAlign: 'right' }}>
      {items.map((c, i) => (
        <Chip key={i}>{c}</Chip>
      ))}
    </Section>
  );
}

/**
 * Data-driven receipt: <Receipt rows={[['תוכנית','Full'], ['סה״כ','₪1,411', true]]} />.
 * Each row is [label, value, strong?]. Wraps the composable Receipt/ReceiptRow.
 */
export type ReceiptRowTuple = [label: string, value: string, strong?: boolean];
export function ReceiptTable({ rows }: { rows: ReceiptRowTuple[] }) {
  return (
    <Receipt>
      {rows.map(([label, value, strong], i) => (
        <ReceiptRow key={i} label={label} value={value} strong={!!strong} />
      ))}
    </Receipt>
  );
}
