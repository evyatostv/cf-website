import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router';
import { BarChart3, CheckCircle2, Mail, MousePointerClick, RefreshCw, Reply, ShoppingCart, TriangleAlert } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Contact = {
  id: string;
  name: string;
  email: string;
  specialty: string | null;
  variant: 'A' | 'B';
  status: string;
  sent_at: string | null;
};

type CampaignEvent = {
  id: number;
  contact_id: string;
  event_type: string;
  is_proxy: boolean;
  occurred_at: string;
};

type WebsiteLead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  created_at: string;
};

const ADMIN_EMAIL = 'evyatar.druyan@gmail.com';

function Metric({ title, value, note, icon: Icon, tone = 'blue' }: { title: string; value: number | string; note: string; icon: typeof Mail; tone?: 'blue' | 'teal' | 'green' | 'amber' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    teal: 'bg-teal-50 text-teal-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${colors[tone]}`}><Icon className="h-5 w-5" /></div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 font-medium text-slate-800">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{note}</div>
    </div>
  );
}

export function CampaignDashboardPage() {
  const { user, loading } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [websiteLeads, setWebsiteLeads] = useState<WebsiteLead[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setBusy(true);
    setError(null);
    const [contactsResult, eventsResult, websiteLeadsResult] = await Promise.all([
      supabase.from('email_campaign_contacts').select('id,name,email,specialty,variant,status,sent_at').order('sent_at', { ascending: false }),
      supabase.from('email_campaign_events').select('id,contact_id,event_type,is_proxy,occurred_at').order('occurred_at', { ascending: false }),
      supabase.from('contact_messages').select('id,name,email,phone,source,utm_campaign,utm_content,created_at').order('created_at', { ascending: false }).limit(100),
    ]);
    if (contactsResult.error || eventsResult.error || websiteLeadsResult.error) {
      setError(contactsResult.error?.message || eventsResult.error?.message || websiteLeadsResult.error?.message || 'טעינת הנתונים נכשלה');
    } else {
      setContacts((contactsResult.data || []) as Contact[]);
      setEvents((eventsResult.data || []) as CampaignEvent[]);
      setWebsiteLeads((websiteLeadsResult.data || []) as WebsiteLead[]);
    }
    setBusy(false);
  };

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) void refresh();
  }, [user?.email]);

  const stats = useMemo(() => {
    const eventContacts = (type: string, includeProxy = true) => new Set(events.filter((e) => e.event_type === type && (includeProxy || !e.is_proxy)).map((e) => e.contact_id)).size;
    const sent = contacts.filter((c) => c.sent_at || c.status !== 'queued').length;
    const demoLeads = new Set(
      contacts
        .filter((c) => ['demo', 'won'].includes(c.status))
        .map((c) => c.email.toLowerCase()),
    );
    websiteLeads
      .filter((lead) => lead.source?.includes('demo') || lead.utm_campaign?.startsWith('doctors_'))
      .forEach((lead) => demoLeads.add(lead.email?.toLowerCase() || `website:${lead.id}`));
    return {
      sent,
      delivered: contacts.filter((c) => c.status !== 'bounced' && (c.sent_at || c.status !== 'queued')).length,
      bounced: contacts.filter((c) => c.status === 'bounced').length,
      opens: eventContacts('open', false),
      clicks: eventContacts('click'),
      replies: contacts.filter((c) => ['replied', 'positive', 'demo', 'won'].includes(c.status)).length,
      positive: contacts.filter((c) => ['positive', 'demo', 'won'].includes(c.status)).length,
      demos: demoLeads.size,
      sales: contacts.filter((c) => c.status === 'won').length,
    };
  }, [contacts, events, websiteLeads]);

  const variants = useMemo(() => ['A', 'B'].map((variant) => {
    const group = contacts.filter((c) => c.variant === variant);
    const ids = new Set(group.map((c) => c.id));
    return {
      variant: `גרסה ${variant}`,
      sent: group.filter((c) => c.sent_at || c.status !== 'queued').length,
      opens: new Set(events.filter((e) => ids.has(e.contact_id) && e.event_type === 'open' && !e.is_proxy).map((e) => e.contact_id)).size,
      clicks: new Set(events.filter((e) => ids.has(e.contact_id) && e.event_type === 'click').map((e) => e.contact_id)).size,
      replies: group.filter((c) => ['replied', 'positive', 'demo', 'won'].includes(c.status)).length,
    };
  }), [contacts, events]);

  if (loading) return <div className="min-h-screen bg-slate-50 pt-32 text-center">טוען…</div>;
  if (!user) return <Navigate to="/login?redirect=/campaign-dashboard" replace />;
  if (user.email !== ADMIN_EMAIL) return <Navigate to="/dashboard" replace />;

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 pb-20 pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold text-teal-700">ClinicFlow · מרכז מכירות</p>
            <h1 className="text-3xl font-bold text-slate-950">דשבורד קמפיין רופאים</h1>
            <p className="mt-2 text-sm text-slate-500">A/B, מסירה, מעורבות והתקדמות עד מכירה — במקום אחד.</p>
          </div>
          <button onClick={() => void refresh()} disabled={busy} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /> רענון נתונים
          </button>
        </div>

        {error && <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><TriangleAlert className="h-5 w-5" />{error}</div>}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric title="נשלחו" value={stats.sent} note={`${stats.delivered} ללא החזרה`} icon={Mail} />
          <Metric title="פתיחות אנושיות משוערות" value={stats.opens} note="ללא טעינות שזוהו כפרוקסי" icon={CheckCircle2} tone="teal" />
          <Metric title="לחיצות" value={stats.clicks} note="לחיצה היא אות אמין יותר מפתיחה" icon={MousePointerClick} tone="green" />
          <Metric title="תגובות" value={stats.replies} note={`${stats.positive} חיוביות`} icon={Reply} tone="amber" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-700" /><h2 className="font-bold text-slate-900">השוואת A/B</h2></div>
            <div className="h-72" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={variants}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="variant" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="sent" name="נשלחו" fill="#0d47a1" radius={[6, 6, 0, 0]} /><Bar dataKey="opens" name="פתיחות" fill="#00838f" radius={[6, 6, 0, 0]} /><Bar dataKey="clicks" name="לחיצות" fill="#26a69a" radius={[6, 6, 0, 0]} /><Bar dataKey="replies" name="תגובות" fill="#f59e0b" radius={[6, 6, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 font-bold text-slate-900">משפך מכירה</h2>
            {[['נמסרו', stats.delivered], ['תגובות חיוביות', stats.positive], ['הדגמות', stats.demos], ['מכירות', stats.sales]].map(([label, value], index) => (
              <div key={String(label)} className="mb-5">
                <div className="mb-2 flex justify-between text-sm"><span className="text-slate-600">{label}</span><strong className="text-slate-900">{value}</strong></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-l from-blue-700 to-teal-600" style={{ width: `${stats.delivered ? Math.max(3, (Number(value) / stats.delivered) * 100) : 0}%`, opacity: 1 - index * 0.12 }} /></div>
              </div>
            ))}
            <div className="mt-8 flex items-center gap-3 rounded-xl bg-slate-50 p-4"><ShoppingCart className="h-5 w-5 text-teal-700" /><div><div className="text-xs text-slate-500">הכנסה</div><div className="font-bold text-slate-900">₪{(stats.sales * 1499).toLocaleString('he-IL')}</div></div></div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">לידים אחרונים</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-4">רופא/ה</th><th className="p-4">תחום</th><th className="p-4">גרסה</th><th className="p-4">סטטוס</th><th className="p-4">נשלח</th></tr></thead>
              <tbody>{contacts.slice(0, 50).map((c) => <tr key={c.id} className="border-t border-slate-100"><td className="p-4"><div className="font-medium text-slate-900">{c.name}</div><div className="text-xs text-slate-400">{c.email}</div></td><td className="p-4 text-slate-600">{c.specialty || '—'}</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${c.variant === 'A' ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-700'}`}>{c.variant}</span></td><td className="p-4 text-slate-700">{c.status}</td><td className="p-4 text-slate-500">{c.sent_at ? new Date(c.sent_at).toLocaleString('he-IL') : '—'}</td></tr>)}</tbody>
            </table>
          </div>
          {!busy && contacts.length === 0 && <div className="p-10 text-center text-sm text-slate-500">הדשבורד מוכן. יופיעו כאן לידים לאחר סנכרון הקמפיין.</div>}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-900">בקשות הדגמה ופניות מהאתר</h2>
            <p className="mt-1 text-xs text-slate-500">כולל מקור הקמפיין והמייל הייחודי שהוביל לפנייה.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-4">שם</th><th className="p-4">פרטי קשר</th><th className="p-4">קמפיין</th><th className="p-4">מזהה נמען</th><th className="p-4">התקבל</th></tr></thead>
              <tbody>{websiteLeads.map((lead) => <tr key={lead.id} className="border-t border-slate-100"><td className="p-4 font-medium text-slate-900">{lead.name || '—'}</td><td className="p-4"><div className="text-slate-700">{lead.email || '—'}</div><div className="text-xs text-slate-400">{lead.phone || 'ללא טלפון'}</div></td><td className="p-4 text-slate-600">{lead.utm_campaign || lead.source || 'אתר'}</td><td className="p-4 font-mono text-xs text-slate-500">{lead.utm_content || '—'}</td><td className="p-4 text-slate-500">{new Date(lead.created_at).toLocaleString('he-IL')}</td></tr>)}</tbody>
            </table>
          </div>
          {!busy && websiteLeads.length === 0 && <div className="p-10 text-center text-sm text-slate-500">עדיין לא התקבלו בקשות הדגמה.</div>}
        </section>
      </div>
    </main>
  );
}
