import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Phone, ShieldCheck } from 'lucide-react';
import { submitLead } from '@/lib/leads';
import { trackLeadEvent } from '@/lib/meta-pixel';
import { readStoredAttribution } from '@/app/components/AttributionCapture';
import { CONTACT_WHATSAPP_URL } from '@/app/config/site';
import { Seo } from '@/app/components/Seo';

export const PRACTICE_OPTIONS = ['רופא/ה שעובד/ת לבד', 'רופא/ה עם מזכירות', 'קליניקה עם כמה רופאים'];
export const SYSTEM_OPTIONS = ['Word / Excel / נייר', 'תוכנה קיימת', 'עדיין מקימים את הפעילות'];

export function DoctorLeadPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const done = location.pathname === '/start/thanks';
  const [step, setStep] = useState(0);
  const [practice, setPractice] = useState('');
  const [system, setSystem] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sending = useRef(false);
  const started = useRef(false);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus(); }, [step, done]);

  const advance = () => {
    if (!started.current) { trackLeadEvent('LeadFormStart'); started.current = true; }
    setError('');
    setStep((value) => value + 1);
  };

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current) return;
    const normalized = phone.replace(/[\s()-]/g, '');
    if (!/^(?:0[2-9]\d{7,8}|\+972[2-9]\d{7,8})$/.test(normalized)) {
      setError('בדקו שמספר הטלפון הישראלי מלא ותקין.'); return;
    }
    if (!name.trim() || !consent || !practice || !system) { setError('נא להשלים את הפרטים ולאשר שנוכל לחזור אליכם.'); return; }
    sending.current = true; setBusy(true); setError('');
    const stored = readStoredAttribution();
    const params = new URLSearchParams(location.search);
    const sourceValue = (key: string) => (params.get(key) || stored[key] || '').slice(0, 160);
    try {
      const result = await submitLead({
        name: name.trim(), email: email.trim(), phone: normalized,
        source: 'doctor-lead-website-ab',
        message: `[פניית התאמה — טופס אתר]\nמבנה הפעילות: ${practice}\nניהול כיום: ${system}\nאישור לחזרה בקשר לפנייה: כן\nמועד האישור: ${new Date().toISOString()}\nגרסת טופס: website-v1`,
        attribution: { source: sourceValue('utm_source'), medium: sourceValue('utm_medium'), campaign: sourceValue('utm_campaign'), content: sourceValue('utm_content') },
      });
      if (!result.ok) { setError(result.error || 'הפנייה לא נשמרה. נסו שוב.'); return; }
      trackLeadEvent('Lead');
      navigate('/start/thanks', { replace: true });
    } catch {
      setError('לא הצלחנו לשמור את הפנייה. הפרטים נשארו כאן — אפשר לנסות שוב.');
    } finally { sending.current = false; setBusy(false); }
  };

  const choices = step === 0 ? PRACTICE_OPTIONS : SYSTEM_OPTIONS;
  const selected = step === 0 ? practice : system;
  const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-600';
  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f8fc] text-[#172b45] px-5 py-7 sm:py-10">
      <Seo title={done ? 'תודה על הפנייה | ClinicFlow' : 'פחות ניירת בקליניקה הפרטית | ClinicFlow'} description="בואו נבדוק איך ClinicFlow יכולה להתאים לפעילות הפרטית שלכם. כמה שאלות קצרות ונחזור אליכם." canonicalPath={done ? '/start/thanks' : '/start'} />
      <div className="mx-auto max-w-xl">
        <img src="/logo/cf-lockup-horizontal.svg" alt="ClinicFlow" className="h-10 w-auto mx-auto mb-8" />
        {done ? (
          <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-9 shadow-sm text-center">
            <CheckCircle2 className="mx-auto mb-4 text-teal-600" size={42} />
            <h1 ref={title} tabIndex={-1} className="text-3xl font-bold outline-none">תודה, נהיה בקשר 😊</h1>
            <p className="text-slate-600 mt-3 mb-7">בינתיים, הנה הצצה ל־ClinicFlow ולדרך שבה היא מרכזת את העבודה בקליניקה.</p>
            <video controls playsInline preload="metadata" poster="/og-image.png" className="w-full rounded-2xl bg-slate-950" aria-label="סרטון היכרות עם ClinicFlow">
              <source src="/clinicflow-promo.mp4" type="video/mp4" />
              הדפדפן אינו תומך בסרטון. <a href="/clinicflow-promo.mp4">פתיחת הסרטון</a>
            </video>
            <a href={`${CONTACT_WHATSAPP_URL}?text=${encodeURIComponent('היי אביתר, השארתי פרטים לגבי ClinicFlow ואשמח לדבר.')}`} className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white px-6 py-3 font-semibold">רוצים לדבר כבר עכשיו? בווטסאפ <ArrowLeft size={18} /></a>
            <p className="text-sm text-slate-500 mt-4">אין צורך להשאיר פרטים שוב.</p>
          </section>
        ) : (
          <>
            <p className="text-center text-sm font-semibold text-teal-700 mb-3">לרופאים פרטיים ולקליניקות קטנות</p>
            <h1 className="text-center text-3xl sm:text-4xl font-bold leading-tight">פחות ניירת.<br />יותר זמן לרפואה.</h1>
            <p className="text-center text-slate-600 mt-4 mb-7 leading-relaxed">תיקי מטופלים, תורים ומסמכים במקום אחד.<br />נכיר את הפעילות שלכם ונבדוק יחד אם ClinicFlow מתאימה.</p>
            <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex justify-between text-xs text-slate-500 mb-3"><span>היכרות קצרה</span><span>שלב {step + 1} מתוך 3</span></div>
              <div role="progressbar" aria-label="התקדמות הטופס" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1} className="flex gap-2 mb-8">{[0, 1, 2].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-teal-600' : 'bg-slate-100'}`} />)}</div>
              <h2 ref={title} tabIndex={-1} className="text-2xl font-bold mb-5 outline-none">{step === 0 ? 'איך נראית הפעילות הפרטית שלכם?' : step === 1 ? 'איך מנהלים היום תיקים ותורים?' : 'לאן נוכל לחזור אליכם?'}</h2>
              {step < 2 ? <>
                <div role="radiogroup" aria-label={step === 0 ? 'מבנה הפעילות' : 'ניהול כיום'} className="space-y-3">{choices.map(option => <label key={option} className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer ${selected === option ? 'border-teal-600 bg-teal-50' : 'border-slate-200 hover:bg-slate-50'}`}><input type="radio" name={`step-${step}`} value={option} checked={selected === option} onChange={() => step === 0 ? setPractice(option) : setSystem(option)} className="accent-teal-700 w-4 h-4" /><span>{option}</span>{selected === option && <Check size={18} className="mr-auto text-teal-700" />}</label>)}</div>
                <button type="button" disabled={!selected} onClick={advance} className="w-full flex justify-center items-center gap-2 mt-7 rounded-xl bg-[#0d47a1] text-white font-semibold py-3.5 disabled:opacity-40">ממשיכים <ArrowLeft size={18} /></button>
              </> : <form onSubmit={send} className="space-y-4">
                <label className="block text-sm font-medium">שם מלא<input required maxLength={120} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className={`${inputClass} mt-1.5`} /></label>
                <label className="block text-sm font-medium">טלפון לחזרה<input required type="tel" inputMode="tel" dir="ltr" autoComplete="tel" maxLength={25} value={phone} onChange={e => setPhone(e.target.value)} className={`${inputClass} mt-1.5 text-right`} /></label>
                <label className="block text-sm font-medium">אימייל<input required type="email" dir="ltr" autoComplete="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className={`${inputClass} mt-1.5 text-right`} /></label>
                <label className="flex items-start gap-2 text-sm leading-relaxed text-slate-600"><input required type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 w-4 h-4 accent-teal-700 shrink-0" /><span>מאשר/ת ל־ClinicFlow לחזור אליי בטלפון או באימייל בקשר לפנייה, בהתאם ל<Link to="/privacy" target="_blank" className="underline">מדיניות הפרטיות</Link>.</span></label>
                {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
                <button disabled={busy} className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#0d47a1] text-white font-semibold py-3.5 disabled:opacity-60">{busy ? 'שומרים את הפנייה…' : 'שלחו פרטים וחזרו אליי'}<Phone size={17} /></button>
                <p className="text-xs text-center text-slate-500">לאחר השליחה ייפתח סרטון ההיכרות. ללא התחייבות.</p>
              </form>}
              {step > 0 && <button type="button" disabled={busy} onClick={() => { setStep(step - 1); setError(''); }} className="mt-5 inline-flex items-center gap-1 text-sm text-slate-600"><ArrowRight size={16} /> חזרה</button>}
            </section>
            <p className="flex justify-center items-center gap-2 mt-5 text-sm text-slate-500"><ShieldCheck size={16} /> בלי מנוי חודשי · על המחשב שלכם</p>
          </>
        )}
        <footer className="text-center mt-8 text-xs text-slate-500"><Link to="/privacy" target="_blank" className="underline">פרטיות</Link><span className="mx-3">·</span>ClinicFlow</footer>
      </div>
    </div>
  );
}
