/**
 * ClinicFlow email design tokens — single source of truth.
 * Mirrors the marketing site (src-2/styles/theme.css). Values are literal
 * (no CSS vars) because email clients don't support custom properties.
 */

export const brand = {
  // Core palette (from the live site)
  primary: '#0d47a1', // deep brand blue
  logoBlue: '#2756A6', // "The Current" mark blue
  teal: '#00838f', // accent teal
  text: '#1a2332', // body text
  muted: '#6b7c93', // secondary text
  border: '#e1e6ec', // hairlines
  bg: '#f8fafb', // outer email background
  card: '#ffffff', // content surface
  accentSurface: '#e8f4f8', // soft cyan panel (chips, callouts)
  success: '#0f7b4f',
  successSurface: '#e7f6ee',
  warn: '#b45309',
  warnSurface: '#fdf2e3',
  danger: '#c0362c',
  dangerSurface: '#fbecea',

  // Brand gradient (header rule + primary CTA)
  gradient: 'linear-gradient(90deg, #0d47a1 0%, #00838f 100%)',

  // Hosted logo — absolute URL (email clients can't use local/SVG assets).
  // Use the www host directly: the apex clinic-flow.co.il 307-redirects to www,
  // and some email clients won't follow a redirect for an <img> src.
  logoUrl: 'https://www.clinic-flow.co.il/logo/cf-lockup-horizontal.png',
  logoWidth: 190,
  logoHeight: 54,

  // Sender identity
  siteName: 'ClinicFlow',
  siteUrl: 'https://clinic-flow.co.il',
  siteUrlLabel: 'clinic-flow.co.il',
  supportEmail: 'info@clinic-flow.co.il',

  radius: 14,
  maxWidth: 600,
} as const;

/** Web font with a mandatory Arial fallback (Outlook/Gmail strip web fonts; Arial renders Hebrew fine). */
export const fontStack =
  "'Heebo', 'Rubik', 'Assistant', Arial, 'Helvetica Neue', Helvetica, sans-serif";

/** Shared inline style fragments reused across templates. */
export const s = {
  body: {
    backgroundColor: brand.bg,
    fontFamily: fontStack,
    color: brand.text,
    margin: 0,
    padding: 0,
    WebkitTextSizeAdjust: '100%',
  } as const,
  container: {
    width: '100%',
    maxWidth: `${brand.maxWidth}px`,
    margin: '0 auto',
  } as const,
  card: {
    backgroundColor: brand.card,
    borderRadius: `${brand.radius}px`,
    border: `1px solid ${brand.border}`,
    overflow: 'hidden',
  } as const,
  contentPad: { padding: '32px 36px' } as const,
  h1: {
    fontFamily: fontStack,
    fontSize: '24px',
    lineHeight: '1.35',
    fontWeight: 700,
    color: brand.text,
    margin: '0 0 12px',
    textAlign: 'right' as const,
  },
  p: {
    fontFamily: fontStack,
    fontSize: '16px',
    lineHeight: '1.7',
    color: brand.text,
    margin: '0 0 16px',
    textAlign: 'right' as const,
  },
  muted: {
    fontFamily: fontStack,
    fontSize: '13px',
    lineHeight: '1.6',
    color: brand.muted,
    textAlign: 'right' as const,
    margin: '0 0 8px',
  },
  cta: {
    backgroundImage: brand.gradient,
    backgroundColor: brand.primary, // fallback for clients that drop gradients
    color: '#ffffff',
    fontFamily: fontStack,
    fontSize: '16px',
    fontWeight: 700,
    textDecoration: 'none',
    borderRadius: `${brand.radius}px`,
    padding: '14px 34px',
    display: 'inline-block',
    textAlign: 'center' as const,
  },
};
