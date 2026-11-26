import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { usePageReturn } from '@/lib/use-page-return';
import { useAuth } from '@/lib/auth-context';
import { getPaidUserAccess, UserAccess, PLAN_LABELS, supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { DeleteAccountSection } from '@/app/components/DeleteAccountSection';
import { DataExportSection } from '@/app/components/DataExportSection';
import { TwoFactorSection } from '@/app/components/TwoFactorSection';
// MFA is now enforced by the route-level RequireAuth guard (requireMfa).

import { motion, AnimatePresence } from 'motion/react';
import {
  Download, LogOut, Clock, CheckCircle2, XCircle, AlertCircle,
  BookOpen, MessageCircle, Monitor, HardDrive, Cpu, RefreshCw,
  Star, ArrowLeft, Shield, Zap, ChevronDown, ChevronUp, ArrowUpCircle,
  X, Check
} from 'lucide-react';

const QUICK_ACTIONS = [
  { icon: Download, title: 'הורדת התוכנה', desc: 'התקן את המערכת על המחשב שלך', action: 'download' },
  { icon: BookOpen, title: 'מדריך למשתמש', desc: 'למד איך להפיק את המירב', action: 'guide' },
  { icon: MessageCircle, title: 'תמיכה טכנית', desc: 'צור קשר עם הצוות', action: 'support' },
];

const GETTING_STARTED_URL = 'https://docs.clinic-flow.co.il/#/getting-started';

const RESOURCES = [
  { icon: BookOpen, title: 'מדריך התחלה מהירה', desc: 'כל מה שצריך לדעת להתחיל', href: GETTING_STARTED_URL, color: '#0d47a1' },
  { icon: MessageCircle, title: 'תמיכה טכנית', desc: 'נענה תוך 24 שעות', href: 'mailto:contact@clinic-flow.co.il', color: '#00838f' },
];

const SYSTEM_REQ = [
  { icon: Monitor, label: 'מערכת הפעלה', value: 'Windows 10/11 או macOS 12+' },
  { icon: Cpu, label: 'מעבד', value: 'Windows: Intel/AMD x64 · Mac: Apple Silicon' },
  { icon: HardDrive, label: 'דיסק', value: '500MB פנויים לפחות' },
];

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-[#e1e6ec] ${className}`}>
      {children}
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const pageReturn = usePageReturn();
  const [seatSummary, setSeatSummary] = useState<{ userId: string; count: number | null } | null>(null);
  const [seatAttempt, setSeatAttempt] = useState(0);
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    let current = true;
    setSeatSummary(null);
    const loadSeats = async () => {
      let count: number | null = null;
      try {
        const result = await supabase.rpc('my_paid_seat_count');
        if (!result.error && Number.isSafeInteger(result.data) && result.data >= 0) count = result.data;
      } catch {
        // Keep the retry available when the network request itself fails.
      }
      if (current) setSeatSummary({ userId, count });
    };
    void loadSeats();
    return () => { current = false; };
  }, [user?.id, pageReturn, seatAttempt]);
  const [access, setAccess] = useState<UserAccess | null | undefined>(undefined);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [lookupAttempt, setLookupAttempt] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [osType, setOsType] = useState<'mac' | 'win' | 'unknown'>('unknown');
  const [showWindowsGuideModal, setShowWindowsGuideModal] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent || '';
    if (userAgent.indexOf('Mac') !== -1) setOsType('mac');
    else if (userAgent.indexOf('Win') !== -1) setOsType('win');
  }, []);

  const handleDownload = async (targetOs?: 'mac' | 'win') => {
    if (downloading) return;
    if (!user || !access || access.user_id !== user.id) {
      setDownloadError('הורדת התוכנה זמינה רק לאחר אישור תשלום.');
      navigate('/payment?plan=forever');
      return;
    }
    const finalOs = targetOs || osType;
    if (finalOs === 'unknown') {
      document.getElementById('installer-options')?.scrollIntoView({ block: 'center' });
      return;
    }
    setDownloadError(null);
    setDownloading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('ההתחברות פגה. יש להתחבר מחדש.');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/download-installer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ os: finalOs }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 403 && ['NO_ACTIVE_LICENSE', 'PAYMENT_REQUIRED'].includes(payload.code)) {
        setAccess(null);
        setSeatSummary(null);
        return;
      }
      if (!response.ok || !payload.downloadUrl) {
        throw new Error(payload.error || 'ההורדה זמינה רק לאחר אישור תשלום.');
      }
      // The URL is short-lived and issued only by the access-gated Edge
      // Function; installer objects remain private in Supabase Storage.
      window.location.href = payload.downloadUrl;
      
      // Show SmartScreen guide modal only after downloading an .exe installer
      const isExeDownload = finalOs === 'win';
      if (isExeDownload) {
        setShowWindowsGuideModal(true);
      }
    } catch (err: any) {
      console.error('Download error:', err);
      setDownloadError('ההורדה נכשלה. אנא נסה שוב או פנה לתמיכה.');
    } finally {
      setDownloading(false);
    }
  };


  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    let current = true;
    setAccess(undefined);
    setLookupFailed(false);
    getPaidUserAccess(user.id).then(result => {
      if (current) setAccess(result);
    }).catch(() => {
      if (current) setLookupFailed(true);
    });
    return () => { current = false; };
  }, [user, loading, navigate, lookupAttempt, pageReturn]);

  const handleSignOut = async () => {
    try { await signOut(); navigate('/'); } catch (err) { console.error(err); }
  };

  if (loading || (!lookupFailed && access === undefined) || (access && access.user_id !== user?.id)) {
    return (
      <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d47a1]" />
          <p className="mt-4 text-[#6b7c93]">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const hasActiveAccess = Boolean(access);
  const planLabel = access ? PLAN_LABELS[access.plan] ?? access.plan : null;
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString('he-IL') : '—';
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'משתמש';

  return (
    <div className="min-h-screen bg-[#f5f7f9] pt-28 pb-20" dir="rtl">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0d47a1] to-[#00838f] flex items-center justify-center text-white text-2xl font-bold select-none">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1a2332]">שלום, {displayName}</h1>
                <p className="text-[#6b7c93] text-sm">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#1a2332] rounded-xl hover:bg-[#f5f7f9] transition border border-[#e1e6ec] text-sm"
            >
              <LogOut className="w-4 h-4" />
              התנתק/י
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Left column — status + download */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Access Status */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="p-6">
                  {lookupFailed ? (
                    <div className="text-center space-y-3" role="alert">
                      <p>בדיקת הרישיון נכשלה. אפשר לנסות שוב.</p>
                      <button className="underline" onClick={() => setLookupAttempt(value => value + 1)}>בדיקה חוזרת</button>
                    </div>
                  ) : !access ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-amber-500" />
                      </div>
                      <h2 className="text-lg font-bold text-[#1a2332] mb-2">אין רישיון מאומת</h2>
                      <p className="text-[#6b7c93] text-sm max-w-sm mx-auto">
                        ההורדה זמינה לבעלי רישיון פעיל עם תשלום מאושר. אם כבר שילמת, אפשר לפנות לתמיכה.
                      </p>
                      <Link to="/payment?plan=forever" className="underline">לרכישת רישיון</Link>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <h2 className="font-bold text-[#1a2332]">גישה פעילה</h2>
                        </div>
                        <span className="mr-auto text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">פעיל</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-gradient-to-br from-[#0d47a1] to-[#00838f] rounded-xl p-4 text-white">
                          <p className="text-xs opacity-70 mb-0.5">החבילה שלך</p>
                          <p className="font-bold">{planLabel}</p>
                        </div>
                        <div className="bg-[#f5f7f9] rounded-xl p-4">
                          <p className="text-xs text-[#6b7c93] mb-0.5">סוג רישיון</p>
                          <p className="font-bold text-[#1a2332]">לצמיתות</p>
                        </div>
                      </div>

                      
                      {seatSummary?.userId === user.id && seatSummary.count === null && (
                        <div className="mb-5" role="alert">
                          <p>לא הצלחנו לבדוק כמה רישיונות למחשבים יש בחשבון.</p>
                          <button className="underline" onClick={() => setSeatAttempt(value => value + 1)}>בדיקה חוזרת של מספר הרישיונות</button>
                        </div>
                      )}
                      {seatSummary?.userId === user.id && seatSummary.count !== null && seatSummary.count > 0 && (
                        <div className="mb-5">
                          <p>רישיונות למחשבים בחשבון שלך: {seatSummary.count}</p>
                          <Link className="underline text-[#0d47a1]" to={`/payment?plan=forever&seat=${seatSummary.count + 1}`}>
                            רכישת רישיון למחשב נוסף ב־1,499 ₪ בתשלום חד־פעמי
                          </Link>
                        </div>
                      )}
                      <div id="installer-options">
                      {downloadError && <p role="alert">{downloadError}</p>}
                      {osType === 'unknown' ? (
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => handleDownload('mac')}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white px-6 py-3.5 rounded-xl hover:shadow-lg transition w-full font-medium"
                          >
                            <Download className="w-5 h-5" />
                            הורדה ל-Mac (Apple Silicon)
                          </button>
                          <button
                            onClick={() => handleDownload('win')}
                            className="flex items-center justify-center gap-2 bg-[#f5f7f9] text-[#1a2332] px-6 py-3.5 rounded-xl hover:shadow-lg transition w-full font-medium border border-[#e1e6ec]"
                          >
                            <Download className="w-5 h-5" />
                            הורדה ל-Windows
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowWindowsGuideModal(true)}
                            className="text-xs text-[#0284c7] hover:underline self-center"
                          >
                            מדריך וידאו: התקנה ב-Windows והפעלת SmartScreen
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleDownload()}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white px-6 py-3.5 rounded-xl hover:shadow-lg transition w-full font-medium"
                          >
                            <Download className="w-5 h-5" />
                            {osType === 'mac' ? 'הורדה ל-Mac' : 'הורדה ל-Windows'}
                          </button>
                          {osType === 'mac' && <p className="text-xs text-center text-gray-500">גרסת Mac נתמכת למעבדי Apple Silicon בלבד.</p>}
                          {osType === 'win' && (
                            <button
                              type="button"
                              onClick={() => setShowWindowsGuideModal(true)}
                              className="text-xs text-[#0284c7] hover:underline self-center mt-0.5"
                            >
                              מדריך וידאו: התקנה ב-Windows והפעלת SmartScreen
                            </button>
                          )}
                          
                          <button
                            onClick={() => setOsType('unknown')}
                            className="text-sm text-[#0d47a1] hover:underline mt-1 self-center"
                          >
                            הורדה למערכת הפעלה אחרת
                          </button>
                        </div>
                      )}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="p-6">
                  <h3 className="font-bold text-[#1a2332] mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#00838f]" />
                    פעולות מהירות
                  </h3>
                  <div className="flex flex-col gap-3">
                    {QUICK_ACTIONS.filter(item => hasActiveAccess || item.action !== 'download').map(({ icon: Icon, title, desc, action }) => (
                      <button
                        key={title}
                        onClick={() => {
                          if (action === 'download') handleDownload();
                          else if (action === 'guide') window.location.assign(GETTING_STARTED_URL);
                          else if (action === 'support') window.location.href = 'mailto:contact@clinic-flow.co.il';
                        }}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-[#f5f7f9] border border-transparent hover:border-[#e1e6ec] transition text-right w-full"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0d47a1] to-[#00838f] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1a2332] text-sm">{title}</p>
                          <p className="text-xs text-[#6b7c93] mt-0.5">{desc}</p>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-[#6b7c93] mr-auto" />
                      </button>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-5">

              {/* Account info */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="p-5">
                  <h3 className="font-bold text-[#1a2332] mb-4 text-sm">פרטי חשבון</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-[#6b7c93]">דוא"ל</p>
                      <p className="text-sm font-medium text-[#1a2332] truncate">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7c93]">חבר מאז</p>
                      <p className="text-sm font-medium text-[#1a2332]">{memberSince}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7c93]">סטטוס</p>
                      <p className="text-sm font-medium">
                        {hasActiveAccess
                          ? <span className="text-green-600">פעיל</span>
                          : <span className="text-amber-500">{lookupFailed ? 'הבדיקה נכשלה' : 'אין רישיון מאומת'}</span>}
                      </p>
                    </div>
                    {planLabel && (
                      <div>
                        <p className="text-xs text-[#6b7c93]">חבילה</p>
                        <p className="text-sm font-medium text-[#1a2332]">{planLabel}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* System requirements */}
              {hasActiveAccess && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <Card className="p-5">
                    <h3 className="font-bold text-[#1a2332] mb-4 text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#00838f]" />
                      דרישות מערכת
                    </h3>
                    <div className="space-y-3">
                      {SYSTEM_REQ.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-[#e8f4f8] rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-3.5 h-3.5 text-[#0d47a1]" />
                          </div>
                          <div>
                            <p className="text-xs text-[#6b7c93]">{label}</p>
                            <p className="text-xs font-medium text-[#1a2332]">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Resources */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="p-5">
                  <h3 className="font-bold text-[#1a2332] mb-4 text-sm">קישורים שימושיים</h3>
                  <div className="space-y-2">
                    {RESOURCES.map(({ icon: Icon, title, desc, href, color }) => (
                      <a
                        key={title}
                        href={href}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f5f7f9] transition group"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1a2332] group-hover:text-[#0d47a1] transition">{title}</p>
                          <p className="text-xs text-[#6b7c93]">{desc}</p>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 text-[#6b7c93] group-hover:text-[#0d47a1] transition flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* Contact */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <div className="bg-gradient-to-br from-[#0d47a1] to-[#00838f] rounded-2xl p-5 text-white text-center">
                  <MessageCircle className="w-7 h-7 mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-sm mb-1">צריכ/ה עזרה?</p>
                  <p className="text-xs opacity-70 mb-3">צוות התמיכה שלנו כאן</p>
                  <a
                    href="mailto:contact@clinic-flow.co.il"
                    className="inline-block bg-white text-[#0d47a1] text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#f5f7f9] transition"
                  >
                    contact@clinic-flow.co.il
                  </a>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Two-factor authentication */}
          <div className="mt-6">
            <TwoFactorSection />
          </div>

          {/* Download my data */}
          <div className="mt-6">
            <DataExportSection />
          </div>

          {/* Account data deletion */}
          <div className="mt-6">
            <DeleteAccountSection />
          </div>
        </motion.div>
      </div>

      {/* Windows Defender SmartScreen Guide Popup Modal */}
      <AnimatePresence>
        {showWindowsGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWindowsGuideModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#e1e6ec] overflow-hidden z-10 text-right my-8"
              dir="rtl"
            >
              {/* Header with Title and Close 'X' Button */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#f0f4f8]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center font-bold shadow-sm">
                    <Shield className="w-5 h-5 text-[#0284c7]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#1a2332] leading-tight">
                      התקנה ב-Windows • מדריך קצר
                    </h3>
                    <p className="text-xs text-[#6b7c93] mt-0.5">
                      Windows Defender מציג התראה? כך מפעילים ב-2 קליקים פשוטים
                    </p>
                  </div>
                </div>

                {/* Small 'X' to close the popup */}
                <button
                  type="button"
                  onClick={() => setShowWindowsGuideModal(false)}
                  className="p-2 text-[#94a3b8] hover:text-[#1a2332] hover:bg-[#f1f5f9] rounded-full transition"
                  aria-label="סגור חלון"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player Container */}
              <div className="p-6 pb-4">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-md border border-[#e1e6ec]">
                  <video
                    src="/windows-install-guide.mp4"
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* 2 Step Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-3 bg-[#f0f9ff] border border-[#bae6fd] p-3.5 rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-[#0284c7] text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0">
                      1
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-[#0f172a] block">לחצו על ״מידע נוסף״</span>
                      <span className="text-[#64748b]">(More info במסך הכחול)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#f0fdf4] border border-[#bbf7d0] p-3.5 rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-[#10b981] text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0">
                      2
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-[#0f172a] block">לחצו על ״הפעל בכל מקרה״</span>
                      <span className="text-[#64748b]">(Run anyway להפעלת התוכנה)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#f0f4f8] flex items-center justify-between">
                <p className="text-xs text-[#64748b] flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#10b981]" />
                  <span>קליניק פלואו מאובטחת ועובדת 100% אופליין במחשב שלכם</span>
                </p>
                <button
                  type="button"
                  onClick={() => setShowWindowsGuideModal(false)}
                  className="bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:shadow-md transition"
                >
                  הבנתי, תודה!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
