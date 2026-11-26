import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { MARKETING_CONSENT_KEY, COOKIE_SETTINGS_EVENT, syncMetaPixel } from '@/lib/meta-pixel';
import { syncGoogleAnalytics } from '@/lib/google-analytics';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { allowHostedMetric } from '@/lib/hosted-metrics';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = MARKETING_CONSENT_KEY;

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const [measure, setMeasure] = useState(false);

  const sync = () => {
    syncMetaPixel();
    syncGoogleAnalytics();
    setMeasure(Boolean(allowHostedMetric({url: window.location.href})));
  };
  useEffect(sync, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
    const open = () => setVisible(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, open);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(COOKIE_SETTINGS_EVENT, open);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, 'accepted'); } catch {}
    sync();
    setVisible(false);
  };

  const reject = () => {
    try { localStorage.setItem(STORAGE_KEY, 'rejected'); } catch {}
    sync();
    setVisible(false);
  };

  if (!visible) return measure ? <><Analytics beforeSend={allowHostedMetric} /><SpeedInsights beforeSend={allowHostedMetric} /></> : null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="הסכמה לעוגיות"
      dir="rtl"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-40 bg-white rounded-2xl shadow-2xl border border-[#e1e6ec] p-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#f0f4ff] flex items-center justify-center flex-shrink-0">
          <Cookie className="w-5 h-5 text-[#0d47a1]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1a2332] mb-1">אנחנו משתמשים בעוגיות</p>
          <p className="text-xs text-[#6b7c93] leading-relaxed mb-3">
            אנחנו משתמשים בעוגיות חיוניות לתפקוד האתר. באישורכם נשתמש גם ב־Google Analytics, בפיקסל של Meta ובכלי המדידה של Vercel לבדיקת שימוש וביצועים בעמודי השיווק.
            לפרטים נוספים ניתן לעיין ב<Link to="/privacy" className="text-[#0d47a1] underline">מדיניות הפרטיות</Link>.
          </p>
          <div className="flex gap-2">
            <button
              onClick={accept}
              className="flex-1 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white text-xs font-medium py-2 rounded-lg hover:shadow-md transition"
            >
              אישור
            </button>
            <button
              onClick={reject}
              className="flex-1 bg-[#f5f7f9] text-[#1a2332] text-xs font-medium py-2 rounded-lg hover:bg-[#e8eaf0] transition border border-[#e1e6ec]"
            >
              עוגיות חיוניות בלבד
            </button>
          </div>
        </div>
        <button
          onClick={reject}
          aria-label="סגור"
          className="text-[#6b7c93] hover:text-[#1a2332] transition flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
