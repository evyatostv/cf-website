import { usePageReturn } from '@/lib/use-page-return';
import { useSeatQuote } from '@/lib/use-seat-quote';
import { formatSeatPrice, matchesQuotedOrder } from '@/lib/seat-quote';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'motion/react';
import { AlertCircle, Shield, ArrowLeft, Check, Lock, Loader2 } from 'lucide-react';
import { supabase, logPolicyAcceptance, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { mapAuthError } from '@/lib/auth-errors';

const PLAN_INFO: Record<string, { name: string; features: string[] }> = {
  forever: {
    name: 'ClinicFlow — רישיון לצמיתות',
    features: [
      'ניהול יומן פגישות (יומי/שבועי/חודשי)',
      'ניהול תיק מטופל ורקע רפואי מלא', 
      'הפקת סיכומי ביקור מעוצבים ב-PDF', 
      'הנפקת חשבוניות, קבלות, וקבלות-חשבונית', 
      'דוחות מעקב, סטטיסטיקות פיננסיות ופעילות', 
      'חוות דעת מקצועיות (Medical Opinions) עם חתימה', 
      'הערות דביקות, יומן אישי, תיוגים וחיפוש מתקדם'
    ],
  },
};

export function PaymentPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const checkoutKey = JSON.stringify([user?.id, params.get('plan'), params.get('seat'), params.get('upgrade'), params.get('quantity')]);
  return <AccountCheckout key={checkoutKey} />;
}

function AccountCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [needsSupport, setNeedsSupport] = useState(false);
  const inFlight = useRef<AbortController | null>(null);
  useEffect(() => () => inFlight.current?.abort(), []);
  const [pendingOrder, setPendingOrder] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [licenseAlreadyActive, setLicenseAlreadyActive] = useState(false);
  const [acceptedQuote, setAcceptedQuote] = useState<string | null>(null);
  const [termsLogged, setTermsLogged] = useState(false);
  // Grow requires a full name and Israeli mobile number. Collect them before
  // the first request instead of waiting for a server validation error.
  const [needsCheckoutContact, setNeedsCheckoutContact] = useState(true);
  const [checkoutName, setCheckoutName] = useState<string>(() => user?.user_metadata?.full_name || '');
  const [targetOs, setTargetOs] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState<string>(() => user?.user_metadata?.phone || '');

  const plan = searchParams.get('plan') || '';
  const seatParam = searchParams.get('seat');
  const targetSeat = seatParam === null ? undefined : Number(seatParam);
  const validSeat = targetSeat === undefined || (Number.isSafeInteger(targetSeat) && targetSeat >= 2 && targetSeat <= 2147483647);
  const isUpgrade = searchParams.get('upgrade') === 'true';
  const planInfo = PLAN_INFO[plan];
  const requestedQuantity = searchParams.get('quantity') ?? '';
  const initialQuantity = /^(?:[1-9]\d?|100)$/.test(requestedQuantity) ? requestedQuantity : '1';
  const [quantityText, setQuantityText] = useState(initialQuantity);
  const quantity = /^(?:[1-9]\d?|100)$/.test(quantityText) ? Number(quantityText) : null;
  const revision = usePageReturn();
  const { quote, failed: quoteFailed, retry: retryQuote } = useSeatQuote(user?.id, revision, quantity);
  const matchesTarget = !!quote && quote.targetSeat === (targetSeat ?? 1);
  const price = matchesTarget && quote ? formatSeatPrice(quote.amount) : '—';
  const quoteKey = matchesTarget && quote && user ? `${user.id}:${quote.targetSeat}:${quote.quantity}:${quote.amount}` : null;
  const termsAccepted = quoteKey !== null && acceptedQuote === quoteKey;
  const savings = matchesTarget && quote ? quote.quantity * 149900 - quote.amount : 0;

  // The checkout URL to return to after (re)login. URL-encode it as a whole so
  // the nested ?plan=/&upgrade= query survives being a value of ?redirect=.
  const checkoutPath = `/payment?plan=${encodeURIComponent(plan)}${targetSeat === undefined ? '' : `&seat=${targetSeat}`}${isUpgrade ? '&upgrade=true' : ''}&quantity=${quantity ?? initialQuantity}`;
  const loginWithRedirect = `/login?redirect=${encodeURIComponent(checkoutPath)}`;

  useEffect(() => {
    if (!loading && !user) navigate(loginWithRedirect);
  }, [user, loading, navigate, loginWithRedirect]);

  const handleTermsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAcceptedQuote(checked ? quoteKey : null);
    if (checked && !termsLogged && user) {
      await logPolicyAcceptance(user.id, user.email!, plan);
      setTermsLogged(true);
    }
  };

  const handlePayment = async () => {
    if (!user || !targetOs || !planInfo || !termsAccepted || !matchesTarget || !quote || processing || inFlight.current) return;

    const request = new AbortController();
    inFlight.current = request;
    setProcessing(true);
    setNeedsSupport(false);
    setError('');
    setSessionExpired(false);
    setPendingOrder('');
    let authSessionFailed = false;

    try {
      // Prefer the current session. A refresh can fail transiently (blocked
      // third-party storage, a short network interruption, or an already
      // rotated refresh token); that must not turn a valid checkout into a
      // misleading generic network error.
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        authSessionFailed = true;
        setSessionExpired(true);
        throw sessionError;
      }
      let session = sessionData.session;
      if (!session?.access_token) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          authSessionFailed = true;
          setSessionExpired(true);
          throw refreshError;
        }
        session = refreshData.session;
      }

      if (request.signal.aborted) return;
      if (!session?.access_token || session.user.id !== user.id) {
        setError('פג תוקף ההתחברות — אנא התחבר/י מחדש');
        setSessionExpired(true);
        setProcessing(false);
        return;
      }

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/create-grow-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          signal: request.signal,
          body: JSON.stringify({
            plan,
            isUpgrade,
            os: targetOs,
            targetSeat,
            quantity,
            contact: needsCheckoutContact ? { fullName: checkoutName, phone: checkoutPhone } : undefined,
          }),
        }
      );

      const raw = await res.text();
      if (request.signal.aborted) return;
      let data: { orderId?: string; paymentUrl?: string; quantity?: number; amount?: number; currency?: string; error?: string; code?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { error: 'שירות התשלום החזיר תשובה לא תקינה' };
      }

      if (!res.ok || !data.paymentUrl) {
        // Edge-function errors may be raw/English — route through the Hebrew map.
        setError(data.error ? mapAuthError(data.error) : 'שגיאה ביצירת תשלום');
        // A 401/expired token surfaces here too — offer the re-login CTA.
        setNeedsSupport(res.status >= 500 || data.code === 'ORDER_LINK_PENDING');
        if (data.code === 'ORDER_LINK_PENDING' && data.orderId) setPendingOrder(data.orderId);
        if (res.status === 401) setSessionExpired(true);
        if (data.code === 'CHECKOUT_CONTACT_REQUIRED') setNeedsCheckoutContact(true);
        if (data.code === 'LICENSE_ALREADY_ACTIVE') setLicenseAlreadyActive(true);
        setProcessing(false);
        return;
      }

      if (!matchesQuotedOrder(quote, data)) {
        const storedPrice = data.currency === 'ILS' && typeof data.amount === 'number' && Number.isSafeInteger(data.amount) && data.amount > 0
          ? ` סכום ההזמנה הקיימת הוא ${formatSeatPrice(data.amount)}.` : '';
        setError(`פרטי ההזמנה לא תואמים לכמות ולמחיר שהוצגו.${storedPrice} פנו לתמיכה לפני התשלום.`);
        setNeedsSupport(true);
        if (data.orderId) setPendingOrder(data.orderId);
        setProcessing(false);
        return;
      }
      // Redirect to the provider checkout page.
      window.location.href = data.paymentUrl;
    } catch (err: any) {
      if (request.signal.aborted) return;
      setNeedsSupport(!authSessionFailed);
      setError(authSessionFailed ? 'פג תוקף ההתחברות — אנא התחבר/י מחדש' : (mapAuthError(err) || 'שגיאה ביצירת תשלום'));
      setProcessing(false);
    } finally {
      if (inFlight.current === request) inFlight.current = null;
    }
  };

  if (!plan || !planInfo || !validSeat) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" dir="rtl">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1a2332]">חבילה לא נמצאה</h1>
          <Link to="/pricing" className="mt-4 inline-block px-6 py-2.5 bg-[#0d47a1] text-white rounded-xl">
            חזור/י לתמחור
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-[#f5f7f9] pt-32 pb-20" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Plan summary */}
          <div className="bg-white rounded-2xl border border-[#e1e6ec] p-5 sm:p-8 flex flex-col">
            <Link to="/pricing" className="flex items-center gap-1.5 text-sm text-[#6b7c93] hover:text-[#0d47a1] mb-6 w-fit">
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              חזרה לתמחור
            </Link>

            <div className="flex-1">
              <p className="text-sm font-medium text-[#6b7c93] mb-1">הזמנה</p>
              <h2 className="text-2xl font-bold text-[#1a2332] mb-1">{planInfo.name}</h2>
              <label htmlFor="license-quantity" className="mt-4 mb-1 block font-semibold">מספר הרישיונות לרכישה עכשיו</label>
              <input id="license-quantity" type="number" min="1" max="100" step="1" inputMode="numeric"
                className="mb-2 w-24 rounded-lg border border-[#64748b] px-3 py-2 text-center"
                value={quantityText} disabled={processing} aria-invalid={quantity === null}
                aria-describedby="license-quantity-help" onChange={event => {
                  setQuantityText(event.target.value);
                  setAcceptedQuote(null);
                  setError('');
                  setPendingOrder('');
                  setNeedsSupport(false);
                  retryQuote();
                }} />
              <p id="license-quantity-help" className="mb-3 text-sm text-[#4a5568]">{quantity === null ? 'יש לבחור מספר שלם בין 1 ל־100.' : 'רישיון אחד לכל מחשב. כל הרישיונות בהזמנה ישויכו לחשבון זה.'}</p>
              <div aria-live="polite" className="text-4xl font-black text-[#0d47a1] mb-1">{price}</div>
              <p className="text-sm text-[#6b7c93] mb-8">תשלום חד־פעמי. רשומות המטופלים נשמרות בנפרד בכל מחשב.</p>

              <ul className="space-y-3">
                {planInfo.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#1a2332]">
                    <Check className="w-4 h-4 text-[#00838f] flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[#e1e6ec] flex items-center gap-2 text-xs text-[#6b7c93]">
              <Shield className="w-4 h-4 text-[#00838f]" />
              עסקה מאובטחת • ללא עלויות נסתרות
            </div>
          </div>

          {/* Payment action */}
          <div className="bg-white rounded-2xl border border-[#e1e6ec] p-5 sm:p-8 flex flex-col justify-between relative">
            {processing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-[#0d47a1] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#1a2332] font-semibold text-sm">מעביר לדף תשלום מאובטח...</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold text-[#1a2332] mb-2">תשלום מאובטח</h3>
              <p className="text-sm text-[#6b7c93] mb-6">תועבר/י לדף תשלום מאובטח להשלמת הרכישה.</p>

              <div className="bg-[#f5f7f9] rounded-xl p-4 mb-5">
                <p className="text-xs text-[#6b7c93] mb-1">הרכישה תירשם לחשבון</p>
                <p className="font-medium text-[#1a2332] text-sm">{user.email}</p>
              </div>

              <div className="border border-[#e1e6ec] rounded-xl p-4 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b7c93]">{quantity === null ? planInfo.name : `רישיונות למחשבים: ${quantity}`}</span>
                  <span className="font-medium text-[#1a2332]">{price}</span>
                </div>
                {savings > 0 && (
                  <p className="mt-2 text-sm text-[#0d47a1]">חיסכון לעומת מחיר מלא לכל רישיון: {formatSeatPrice(savings)}</p>
                )}
                <div className="flex justify-between text-sm border-t border-[#e1e6ec] pt-2 mt-2">
                  <span className="font-bold text-[#1a2332]">סה"כ בתשלום חד־פעמי</span>
                  <span className="font-bold text-[#0d47a1]">{price}</span>
                </div>
              </div>

              <p className="text-center text-xs text-[#6b7c93] mb-5">עד 3 תשלומים ללא ריבית</p>

              <label className="block text-sm mb-5">
                על איזה מחשב תותקן התוכנה?
                <select value={targetOs} onChange={(event) => setTargetOs(event.target.value)}
                  className="block w-full mt-1 rounded-lg border border-[#e1e6ec] p-2.5 text-base">
                  <option value="">בחירת מחשב</option>
                  <option value="win">Windows 10 או 11 עם מעבד Intel או AMD ‏(64 סיביות)</option>
                  <option value="mac">macOS 12 ומעלה עם שבב Apple Silicon</option>
                </select>
              </label>

              {targetOs === 'mac' && (
                <p className="text-sm mb-5 text-[#1a2332]">
                  לבדיקת סוג השבב ב־Mac, פתחו את תפריט Apple ובחרו ״אודות Mac זה״.
                </p>
              )}

              {needsCheckoutContact && (
                <fieldset className="border border-[#e1e6ec] rounded-xl p-4 mb-5 space-y-3" disabled={processing}>
                  <legend className="px-1 text-sm font-semibold">פרטי קשר לתשלום</legend>
                  <label className="block text-sm">
                    שם מלא
                    <input
                      className="block w-full mt-1 rounded-lg border border-[#e1e6ec] p-2.5 text-base"
                      autoComplete="name"
                      maxLength={150}
                      value={checkoutName}
                      onChange={(event) => setCheckoutName(event.target.value)}
                    />
                  </label>
                  <label className="block text-sm">
                    מספר נייד ישראלי
                    <input
                      type="tel"
                      dir="ltr"
                      className="block w-full mt-1 rounded-lg border border-[#e1e6ec] p-2.5 text-base"
                      autoComplete="tel"
                      maxLength={30}
                      value={checkoutPhone}
                      onChange={(event) => setCheckoutPhone(event.target.value)}
                    />
                  </label>
                </fieldset>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p role="alert" className="text-red-600 text-sm">{error}</p>
                    {licenseAlreadyActive && (
                      <Link to="/dashboard" className="inline-block mt-1 text-sm font-medium text-[#0d47a1] underline">
                        המשך לאזור האישי
                      </Link>
                    )}
                    {pendingOrder && (
                      <Link to={`/checkout/success?order=${encodeURIComponent(pendingOrder)}`} className="inline-block mt-1 text-sm font-medium text-[#0d47a1] underline">
                        בדיקת מצב ההזמנה
                      </Link>
                    )}
                    {needsSupport && (
                      <Link to="/contact" className="block mt-1 text-sm font-medium text-[#0d47a1] underline">פנייה לתמיכה בנושא התשלום</Link>
                    )}
                    {sessionExpired && (
                      <Link
                        to={loginWithRedirect}
                        className="inline-block mt-1 text-sm font-medium text-[#0d47a1] underline hover:no-underline"
                      >
                        התחבר/י מחדש
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="flex items-start gap-3 mb-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={handleTermsChange}
                  className="mt-0.5 w-4 h-4 accent-[#0d47a1] flex-shrink-0 cursor-pointer"
                />
                <span className="text-xs text-[#4a5568] leading-relaxed">
                  קראתי ואני מסכים/ה{" "}
                  <Link to="/terms" target="_blank" className="text-[#0d47a1] hover:underline">לתנאי השימוש</Link>
                  {", "}
                  <Link to="/privacy" target="_blank" className="text-[#0d47a1] hover:underline">מדיניות הפרטיות</Link>
                  {", "}
                  <Link to="/disclaimer" target="_blank" className="text-[#0d47a1] hover:underline">הסרת האחריות על נתונים</Link>
                  {" ו"}
                  <Link to="/refund" target="_blank" className="text-[#0d47a1] hover:underline">מדיניות ההחזרים</Link>
                  {" של ClinicFlow."}
                </span>
              </label>

              {quantity !== null && quoteFailed && <p role="alert" className="mb-4 text-center">לא הצלחנו לאמת את המחיר לחשבון. <button type="button" className="underline" onClick={retryQuote}>בדיקה חוזרת</button></p>}
              {quote && !matchesTarget && <p role="alert" className="mb-4 text-center">מספר הרישיונות בחשבון השתנה. <Link to="/dashboard" className="underline">לבדיקת הרישיונות באזור האישי</Link></p>}
              <button
                onClick={handlePayment}
                disabled={
                  processing || !matchesTarget || !targetOs || !termsAccepted || licenseAlreadyActive ||
                  (needsCheckoutContact && (!checkoutName.trim() || !checkoutPhone.trim()))
                }
                aria-busy={processing}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-bold py-4 rounded-xl hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed text-lg mb-3 min-h-[56px]"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    מעבד תשלום...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {matchesTarget ? `שלם/י ${price}` : 'ממתינים למחיר מאומת'}
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#4a5568]">פרטי התשלום מוזנים בעמוד התשלום של Grow.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
