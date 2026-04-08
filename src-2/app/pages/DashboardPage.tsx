import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { getUserAccess, UserAccess, PLAN_LABELS } from '@/lib/supabase';
import { motion } from 'motion/react';
import {
  Download, LogOut, Clock, CheckCircle2, XCircle, AlertCircle,
  BookOpen, MessageCircle, Monitor, HardDrive, Cpu, RefreshCw,
  Star, ArrowLeft, Shield, Zap, ChevronDown, ChevronUp, ArrowUpCircle
} from 'lucide-react';

const CHANGELOG = [
  { version: '0.1.0', date: '04/2026', items: ['הפעלת יישום עם מערכת רישוי', 'כניסה מאובטחת עם PIN', 'ניהול מטופלים, ביקורים ומסמכים', 'יומן תורים', 'כתיבת חוות דעת רפואית', 'גיבוי ושחזור מוצפן'] },
];

const RESOURCES = [
  { icon: BookOpen, title: 'מדריך התחלה מהירה', desc: 'כל מה שצריך לדעת להתחיל', href: '/contact', color: '#0d47a1' },
  { icon: MessageCircle, title: 'תמיכה טכנית', desc: 'נענה תוך 24 שעות', href: 'mailto:contact@clinic-flow.co.il', color: '#00838f' },
  { icon: Star, title: 'שדרוג חבילה', desc: 'גלה את כל היכולות', href: '/pricing', color: '#f59e0b' },
];

const SYSTEM_REQ = [
  { icon: Monitor, label: 'מערכת הפעלה', value: 'Windows 10/11 או macOS 12+' },
  { icon: Cpu, label: 'מעבד', value: 'Intel / AMD x64 (כל דגם מ-2015)' },
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
  const [access, setAccess] = useState<UserAccess | null | undefined>(undefined);
  const [showChangelog, setShowChangelog] = useState(false);

  useEffect(() => {
    if (!loading && !user) { navigate('/login'); return; }
    if (user) getUserAccess(user.id).then(setAccess);
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    try { await signOut(); navigate('/'); } catch (err) { console.error(err); }
  };

  if (loading || access === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f7f9] to-[#e8f4f8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d47a1]" />
          <p className="mt-4 text-[#6b7c93]">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isTrialExpired = access?.plan === 'trial' && access?.expires_at && new Date(access.expires_at) < new Date();
  const hasActiveAccess = access?.is_active && !isTrialExpired;
  const planLabel = access ? PLAN_LABELS[access.plan] ?? access.plan : null;

  const UPGRADE_NEXT: Record<string, { label: string; desc: string; features: string[]; to: string; btnLabel: string }> = {
    trial: { label: 'חבילה בסיסית', desc: 'רכוש רישיון לצמיתות ותמשיך להשתמש ללא הגבלת זמן', features: ['סיכומי ביקור ו-PDF', 'ניהול יומן תורים', 'כרטיס מטופל מלא'], to: '/pricing', btnLabel: 'בחר חבילה' },
    basic: { label: 'חבילה מקצועית', desc: 'קבל כלים מתקדמים לניתוח הפעילות שלך', features: ['דוחות סטטיסטיים וגרפים', 'יומן אישי ותיוג רשומות', 'הערות דביקות וחיפוש מתקדם'], to: '/payment?plan=professional&upgrade=true', btnLabel: 'שדרג עכשיו' },
    professional: { label: 'חבילת ניהול מלאה', desc: 'הוסף ניהול כספי מלא לקליניקה שלך', features: ['חשבוניות וקבלות אוטומטיות', 'דוחות הכנסות פיננסיים', 'מעקב שיטות תשלום'], to: '/payment?plan=full&upgrade=true', btnLabel: 'שדרג עכשיו' },
  };
  const upgradeNext = access?.plan ? UPGRADE_NEXT[access.plan] : null;
  const trialDaysLeft = access?.plan === 'trial' && access.expires_at && !isTrialExpired
    ? Math.ceil((new Date(access.expires_at).getTime() - Date.now()) / 86400000) : null;
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString('he-IL') : '—';
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'משתמש';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7f9] to-[#e8f4f8] pt-28 pb-20" dir="rtl">
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
              התנתק
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Left column — status + download */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Access Status */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="p-6">
                  {!access ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-amber-500" />
                      </div>
                      <h2 className="text-lg font-bold text-[#1a2332] mb-2">ממתין לאישור</h2>
                      <p className="text-[#6b7c93] text-sm max-w-sm mx-auto">
                        החשבון שלך נוצר. ברגע שהרכישה תאושר תוכל/י להפעיל את האפליקציה.
                      </p>
                    </div>
                  ) : !access.is_active ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-red-400" />
                      </div>
                      <h2 className="text-lg font-bold text-[#1a2332] mb-2">גישה מושהית</h2>
                      <p className="text-[#6b7c93] text-sm">הגישה שלך הושהתה. לפרטים נוספים צור/י קשר.</p>
                    </div>
                  ) : isTrialExpired ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                      </div>
                      <h2 className="text-lg font-bold text-[#1a2332] mb-2">תקופת הניסיון הסתיימה</h2>
                      <p className="text-[#6b7c93] text-sm mb-4">רכוש רישיון כדי להמשיך להשתמש באפליקציה.</p>
                      <Link to="/pricing" className="inline-block bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:shadow-md transition">
                        לבחירת חבילה
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <h2 className="font-bold text-[#1a2332]">גישה פעילה</h2>
                          {trialDaysLeft !== null && (
                            <p className="text-xs text-amber-600 font-medium">ניסיון חינם — {trialDaysLeft} ימים נותרו</p>
                          )}
                        </div>
                        <span className="mr-auto text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">פעיל</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-gradient-to-br from-[#0d47a1] to-[#00838f] rounded-xl p-4 text-white">
                          <p className="text-xs opacity-70 mb-0.5">החבילה שלך</p>
                          <p className="font-bold">{planLabel}</p>
                        </div>
                        <div className="bg-[#f5f7f9] rounded-xl p-4">
                          <p className="text-xs text-[#6b7c93] mb-0.5">{access.plan === 'trial' ? 'תוקף' : 'סוג רישיון'}</p>
                          <p className="font-bold text-[#1a2332]">
                            {access.plan === 'trial' && access.expires_at
                              ? new Date(access.expires_at).toLocaleDateString('he-IL')
                              : <span>לנצח <span className="text-2xl">♾</span></span>}
                          </p>
                        </div>
                      </div>

                      <a
                        href="https://github.com/evyatostv/ClinicFlow/releases/latest"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white px-6 py-3.5 rounded-xl hover:shadow-lg transition w-full font-medium"
                      >
                        <Download className="w-5 h-5" />
                        הורד את האפליקציה (Windows / macOS)
                      </a>

                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Upgrade CTA */}
              {upgradeNext && hasActiveAccess && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <div className="rounded-2xl border-2 border-[#0d47a1]/20 bg-gradient-to-br from-[#f0f4ff] to-[#e8f4f8] p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0d47a1] to-[#00838f] flex items-center justify-center flex-shrink-0">
                        <ArrowUpCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-[#6b7c93] mb-0.5">הצעד הבא עבורך</p>
                        <h3 className="font-bold text-[#1a2332]">{upgradeNext.label}</h3>
                        <p className="text-sm text-[#6b7c93] mt-0.5">{upgradeNext.desc}</p>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-5">
                      {upgradeNext.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-[#1a2332]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00838f] flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={upgradeNext.to}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white text-sm font-bold py-3 rounded-xl hover:shadow-md transition w-full"
                    >
                      {upgradeNext.btnLabel}
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* Installation Steps */}
              {hasActiveAccess && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="p-6">
                    <h3 className="font-bold text-[#1a2332] mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#0d47a1]" />
                      התקנה בשלושה צעדים
                    </h3>
                    <div className="flex flex-col gap-4">
                      {[
                        { n: 1, title: 'הורד את הקובץ', desc: 'לחץ על כפתור ההורדה למעלה ושמור את הקובץ' },
                        { n: 2, title: 'הפעל את ה-Installer', desc: 'פתח את הקובץ שהורדת ועקוב אחרי הוראות ההתקנה' },
                        { n: 3, title: 'הפעל עם הדוא"ל שלך', desc: 'בפתיחה ראשונה הזן את הדוא"ל והסיסמה שלך מהאתר' },
                      ].map(({ n, title, desc }) => (
                        <div key={n} className="flex gap-4 items-start">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0d47a1] to-[#00838f] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                            {n}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1a2332] text-sm">{title}</p>
                            <p className="text-xs text-[#6b7c93] mt-0.5">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Changelog */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="overflow-hidden">
                  <button
                    onClick={() => setShowChangelog(v => !v)}
                    className="w-full flex items-center justify-between p-5 text-right hover:bg-[#f9fafc] transition"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-[#0d47a1]" />
                      <span className="font-bold text-[#1a2332]">מה חדש</span>
                      <span className="text-xs bg-[#0d47a1]/10 text-[#0d47a1] px-2 py-0.5 rounded-full font-medium">v0.1.0</span>
                    </div>
                    {showChangelog ? <ChevronUp className="w-4 h-4 text-[#6b7c93]" /> : <ChevronDown className="w-4 h-4 text-[#6b7c93]" />}
                  </button>
                  {showChangelog && (
                    <div className="px-5 pb-5 border-t border-[#e1e6ec]">
                      {CHANGELOG.map(({ version, date, items }) => (
                        <div key={version} className="mt-4">
                          <p className="text-xs text-[#6b7c93] mb-2">{date}</p>
                          <ul className="space-y-1.5">
                            {items.map(item => (
                              <li key={item} className="flex items-start gap-2 text-sm text-[#1a2332]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
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
                          : <span className="text-amber-500">ממתין לאישור</span>}
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
        </motion.div>
      </div>
    </div>
  );
}
