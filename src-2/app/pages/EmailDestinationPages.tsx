import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft, CheckCircle2, Download, FileText, Headphones,
  History, Loader2, MailCheck, RefreshCw, Rocket, ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getPurchaseHistory, type Purchase, supabase } from '@/lib/supabase';

const shell = 'min-h-screen bg-gradient-to-b from-[#eef6ff] via-white to-[#f0fdfa] pt-32 pb-20';
const card = 'bg-white rounded-3xl border border-[#dce6ef] shadow-[0_18px_60px_rgba(13,71,161,0.10)]';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d47a1] to-[#00838f] px-6 py-3.5 font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg';
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-[#cbd8e5] bg-white px-6 py-3.5 font-semibold text-[#0d47a1] transition hover:bg-[#f5f9fc]';

function HeroIcon({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0d47a1] to-[#00838f] text-white shadow-lg">{children}</div>;
}

export function DownloadPage() {
  const { user, loading } = useAuth();
  const destination = user ? '/dashboard' : '/login?redirect=%2Fdashboard';
  return (
    <main className={shell} dir="rtl">
      <div className="mx-auto max-w-5xl px-4">
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`${card} overflow-hidden p-8 text-center md:p-12`}>
          <HeroIcon><Download className="h-10 w-10" /></HeroIcon>
          <p className="mb-2 text-sm font-bold text-[#00838f]">הורדה מאובטחת</p>
          <h1 className="mb-4 text-3xl font-black text-[#1a2332] md:text-5xl">ClinicFlow מחכה לך</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-[#607086]">ההורדה זמינה מתוך החשבון שלך כדי לוודא שהמתקין והרישיון הנכון מגיעים רק אליך.</p>
          <div className="mb-9 grid gap-4 text-right md:grid-cols-3">
            {[
              [ShieldCheck, 'הורדה מאומתת', 'קובץ ההתקנה העדכני מתוך החשבון שלך'],
              [Download, 'Windows ו-macOS', 'המערכת מזהה את המחשב ומציעה את הגרסה המתאימה'],
              [Headphones, 'עזרה בהתקנה', 'הדרכה ברורה ותמיכה אם משהו לא מסתדר'],
            ].map(([Icon, title, text]) => {
              const C = Icon as typeof Download;
              return <div key={String(title)} className="rounded-2xl bg-[#f6f9fc] p-5"><C className="mb-3 h-6 w-6 text-[#0d47a1]" /><h2 className="mb-1 font-bold text-[#1a2332]">{String(title)}</h2><p className="text-sm leading-6 text-[#6b7c93]">{String(text)}</p></div>;
            })}
          </div>
          <Link to={destination} className={primary}>{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}כניסה להורדה<ArrowLeft className="h-4 w-4" /></Link>
        </motion.section>
      </div>
    </main>
  );
}

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Purchase[] | null>(null);
  useEffect(() => { if (user) getPurchaseHistory(user.id).then(setOrders); }, [user]);
  return (
    <main className={shell} dir="rtl"><div className="mx-auto max-w-4xl px-4">
      <section className={`${card} p-7 md:p-10`}>
        <div className="mb-8 flex items-center gap-4"><div className="rounded-2xl bg-[#eaf2ff] p-4 text-[#0d47a1]"><FileText className="h-8 w-8" /></div><div><p className="text-sm font-bold text-[#00838f]">החשבון שלי</p><h1 className="text-3xl font-black text-[#1a2332]">הזמנות ורכישות</h1></div></div>
        {orders === null ? <div className="flex justify-center py-16"><Loader2 className="h-9 w-9 animate-spin text-[#0d47a1]" /></div> : orders.length === 0 ? <div className="rounded-2xl bg-[#f6f9fc] p-10 text-center"><History className="mx-auto mb-3 h-10 w-10 text-[#789]" /><h2 className="mb-2 text-xl font-bold">עדיין אין הזמנות</h2><p className="mb-5 text-[#6b7c93]">לא נמצאה רכישה בחשבון הזה.</p><Link to="/pricing" className={primary}>לצפייה בחבילות</Link></div> : <div className="space-y-3">{orders.map((order) => <article key={order.id} className="grid gap-3 rounded-2xl border border-[#e1e8ef] p-5 sm:grid-cols-3"><div><p className="text-xs text-[#6b7c93]">תוכנית</p><p className="font-bold text-[#1a2332]">{order.plan || order.version}</p></div><div><p className="text-xs text-[#6b7c93]">תאריך</p><p className="font-medium">{new Date(order.purchased_at).toLocaleDateString('he-IL')}</p></div><div><p className="text-xs text-[#6b7c93]">סכום</p><p className="font-bold text-[#0d47a1]">{typeof order.amount === 'number' ? `₪${order.amount.toLocaleString('he-IL')}` : '—'}</p></div></article>)}</div>}
        <div className="mt-8 flex flex-wrap gap-3"><Link to="/dashboard" className={primary}>חזרה לחשבון</Link><Link to="/contact" className={secondary}>שאלה לגבי חיוב</Link></div>
      </section>
    </div></main>
  );
}

type ActionVariant = 'renew' | 'premium' | 'retry' | 'whats-new';
const actionCopy: Record<ActionVariant, { icon: typeof Rocket; eyebrow: string; title: string; body: string; cta: string; href: string; secondary: string; secondaryHref: string }> = {
  renew: { icon: RefreshCw, eyebrow: 'חידוש עדכונים', title: 'שומרים על ClinicFlow מעודכנת', body: 'הרישיון שלך ממשיך לעבוד לתמיד. חידוש תקופת העדכונים מוסיף גרסאות חדשות, תיקוני אבטחה ועדכוני תאימות.', cta: 'בחירת חבילת חידוש', href: '/pricing?intent=renew', secondary: 'חזרה לחשבון', secondaryHref: '/dashboard' },
  premium: { icon: Sparkles, eyebrow: 'ClinicFlow Premium', title: 'בואו נתאים את ClinicFlow לקליניקה שלך', body: 'פתרון מורחב, ליווי אישי והתאמה לצרכים מיוחדים של קליניקות פעילות. נשמח להבין מה נדרש ולחזור עם תשובה ברורה.', cta: 'לתיאום שיחה', href: '/contact?topic=premium', secondary: 'צפייה ביכולות', secondaryHref: '/features' },
  retry: { icon: RefreshCw, eyebrow: 'השלמת תשלום', title: 'אפשר לנסות שוב בבטחה', body: 'לא בוצע חיוב כפול דרך הקישור הזה. נבחר מחדש את החבילה ונפתח ניסיון תשלום חדש ומאובטח.', cta: 'בחירת חבילה וניסיון חוזר', href: '/pricing?intent=retry', secondary: 'בדיקת ההזמנות שלי', secondaryHref: '/account/orders' },
  'whats-new': { icon: Rocket, eyebrow: 'מה חדש', title: 'כל מה שהשתפר ב-ClinicFlow', body: 'שיפרנו את חוויית העבודה, האבטחה והביצועים — תוך שמירה על העיקרון החשוב ביותר: המידע הקליני נשאר אצלך, על המחשב.', cta: 'לכל יכולות המערכת', href: '/features', secondary: 'הורדת הגרסה העדכנית', secondaryHref: '/download' },
};

export function EmailActionPage({ variant }: { variant: ActionVariant }) {
  const cfg = actionCopy[variant]; const Icon = cfg.icon;
  return <main className={shell} dir="rtl"><div className="mx-auto max-w-4xl px-4"><motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`${card} p-8 text-center md:p-12`}><HeroIcon><Icon className="h-10 w-10" /></HeroIcon><p className="mb-2 text-sm font-bold text-[#00838f]">{cfg.eyebrow}</p><h1 className="mb-5 text-3xl font-black text-[#1a2332] md:text-5xl">{cfg.title}</h1><p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-[#607086]">{cfg.body}</p><div className="flex flex-col justify-center gap-3 sm:flex-row"><Link to={cfg.href} className={primary}>{cfg.cta}<ArrowLeft className="h-4 w-4" /></Link><Link to={cfg.secondaryHref} className={secondary}>{cfg.secondary}</Link></div></motion.section></div></main>;
}

export function UnsubscribePage() {
  const location = useLocation();
  const initialEmail = new URLSearchParams(location.search).get('email') || '';
  const [email, setEmail] = useState(initialEmail); const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const submit = async (event: FormEvent) => { event.preventDefault(); setState('saving'); const normalized = email.trim().toLowerCase(); const { error } = await supabase.from('contact_messages').insert({ name: 'בקשת הסרה מרשימת תפוצה', email: normalized, phone: '', message: `UNSUBSCRIBE_LIFECYCLE_EMAILS: ${normalized}` }); setState(error ? 'error' : 'done'); };
  return <main className={shell} dir="rtl"><div className="mx-auto max-w-xl px-4"><section className={`${card} p-8 text-center md:p-10`}><HeroIcon>{state === 'done' ? <CheckCircle2 className="h-10 w-10" /> : <MailCheck className="h-10 w-10" />}</HeroIcon>{state === 'done' ? <><h1 className="mb-3 text-3xl font-black text-[#1a2332]">בקשת ההסרה התקבלה</h1><p className="mb-8 leading-7 text-[#607086]">הבקשה נרשמה ותטופל בתוך יום עסקים. לאחר מכן יישארו פעילים רק מיילים חיוניים על אבטחה, רכישה ורישיון.</p><Link to="/" className={secondary}>חזרה לאתר</Link></> : <><p className="mb-2 text-sm font-bold text-[#00838f]">העדפות דיוור</p><h1 className="mb-3 text-3xl font-black text-[#1a2332]">הסרה מהודעות עדכון</h1><p className="mb-7 leading-7 text-[#607086]">הזינו את כתובת האימייל שאליה נשלחו ההודעות. נטפל בבקשה ונשאיר פעילים רק מיילים חיוניים לחשבון ולרישיון.</p><form onSubmit={submit} className="space-y-4"><label className="block text-right font-semibold text-[#1a2332]" htmlFor="unsubscribe-email">כתובת אימייל</label><input id="unsubscribe-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-[#cbd8e5] px-4 py-3 text-left outline-none focus:border-[#0d47a1] focus:ring-2 focus:ring-[#0d47a1]/15" dir="ltr" placeholder="name@example.com" /><button disabled={state === 'saving'} className={`${primary} w-full disabled:opacity-60`}>{state === 'saving' ? <Loader2 className="h-5 w-5 animate-spin" /> : null}אישור הסרה</button>{state === 'error' ? <p className="text-sm text-red-600">לא הצלחנו לשמור את הבקשה. אפשר לפנות אלינו דרך עמוד יצירת הקשר.</p> : null}</form></>}</section></div></main>;
}
