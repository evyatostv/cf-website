import { useEffect, useId, useRef, useState } from 'react';
import { Monitor } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ActiveDevice = { device_id: string; seat_number: number; device_code: string };

type Props = {
  customerEmail?: string;
  reloadKey?: number;
  onDisconnected?: () => void;
};

export function ActiveDevicesSection({ customerEmail, reloadKey = 0, onDisconnected }: Props) {
  const headingId = useId();
  const [devices, setDevices] = useState<ActiveDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const pending = useRef(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const request = new AbortController();
    setLoading(true);
    setListError('');
    setSelected(null);
    async function load() {
      try {
        const { data, error } = await supabase.rpc('desktop_active_devices', customerEmail ? { p_customer_email: customerEmail } : {}).abortSignal(request.signal);
        if (request.signal.aborted) return;
        if (error?.code === 'P0002') {
          setListError('לא נמצא חשבון בכתובת הדוא״ל הזו.');
        } else if (error?.code === '42501') {
          setListError('אין הרשאה לצפייה במחשבים בחשבון הזה.');
        } else if (error || !Array.isArray(data)) {
          throw new Error('Device list unavailable');
        } else {
          setDevices(data);
        }
      } catch {
        if (!request.signal.aborted) setListError('טעינת רשימת המחשבים נכשלה.');
      } finally {
        if (!request.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => request.abort();
  }, [customerEmail, reloadKey, revision]);

  async function disconnect(device: ActiveDevice) {
    if (pending.current || selected !== device.device_id || (customerEmail && reason.trim().length < 3)) return;
    pending.current = true;
    setSending(true);
    setNotice('');
    try {
      const args = customerEmail
        ? { p_device_id: device.device_id, p_customer_email: customerEmail, p_reason: reason.trim() }
        : { p_device_id: device.device_id };
      const { data, error } = await supabase.rpc('desktop_disconnect_device', args);
      if (error || typeof data !== 'boolean') throw new Error('Disconnect not confirmed');
      setNotice(data
        ? 'המחשב נותק. אפשר להפעיל את ClinicFlow במחשב החלופי עם אותו חשבון.'
        : 'ההפעלה שנבחרה כבר אינה פעילה. רשימת המחשבים עודכנה.');
    } catch {
      setNotice('לא התקבל אישור לניתוק. בדקו אם המחשב עדיין מופיע ברשימה לפני ניסיון נוסף.');
    } finally {
      pending.current = false;
      setSending(false);
      setSelected(null);
      setReason('');
      setRevision(value => value + 1);
      onDisconnected?.();
    }
  }

  return (
    <section aria-labelledby={headingId} className="mt-4 border-t border-[#dce3e9] pt-4">
      <h3 id={headingId} className="font-bold text-[#1a2332]">מחשבים פעילים</h3>
      <p role="status" className="text-sm text-[#31586a]">{notice}</p>
      {loading ? <p role="status" className="mt-2 text-sm">טוען מחשבים…</p> : listError ? (
        <div role="alert" className="mt-2 text-sm">
          {listError}{' '}
          <button type="button" className="underline" onClick={() => setRevision(n => n + 1)}>ניסיון חוזר</button>
        </div>
      ) : devices.length === 0 ? <p className="mt-2 text-sm">אין מחשבים פעילים בחשבון.</p> : (
        <>
          <p className="my-2 text-sm text-[#536575]">
            לזיהוי המחשב, השוו את המזהה לשדה ״מותקן על מכשיר״ בהגדרות הרישיון של ClinicFlow.
            אם מחשב התקלקל, אפשר לבדוק את המזהים במחשבים שברצונכם להשאיר פעילים.
          </p>
          <ul className="divide-y divide-[#dce3e9]">
            {devices.map(device => {
              const expanded = selected === device.device_id;
              const title = `מחשב ברישיון ${device.seat_number}`;
              return (
                <li key={device.device_id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-2"><Monitor size={18} aria-hidden="true" />{title} <bdi dir="ltr" className="font-mono text-sm">{device.device_code}</bdi></span>
                    <button type="button" aria-label={`ניתוק ${title}, מזהה ${device.device_code}`}
                      aria-expanded={expanded} disabled={sending} className="rounded-lg border border-[#cbd5df] bg-white px-3 py-2 text-sm"
                      onClick={() => { setSelected(expanded ? null : device.device_id); setReason(''); setNotice(''); }}>
                      ניתוק מחשב
                    </button>
                  </div>
                  {expanded && (
                    <form className="mt-3 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm"
                      onSubmit={event => { event.preventDefault(); void disconnect(device); }}>
                      <p className="font-bold">לנתק את {title} (<bdi dir="ltr">{device.device_code}</bdi>){customerEmail && <> בחשבון <bdi>{customerEmail}</bdi></>}?</p>
                      <p>הניתוק יפנה מקום למחשב חלופי. במחשב שנותק, השינוי ייכנס לתוקף בבדיקת הרישיון הבאה באינטרנט. להעברת תיקי המטופלים יש לשחזר גיבוי במחשב החלופי.</p>
                      {customerEmail && <label className="block">סיבת הניתוק
                        <textarea required minLength={3} maxLength={500} value={reason} onChange={event => setReason(event.target.value)}
                          className="mt-1 block w-full rounded border border-[#aebbc6] bg-white p-2" />
                      </label>}
                      <div className="flex gap-3">
                        <button type="button" disabled={sending} onClick={() => setSelected(null)} className="rounded-lg border border-[#cbd5df] bg-white px-3 py-2">ביטול</button>
                        <button type="submit" disabled={sending || Boolean(customerEmail && reason.trim().length < 3)}
                          className="rounded-lg bg-red-700 px-3 py-2 text-white disabled:opacity-50">{sending ? 'מנתק…' : 'אישור ניתוק'}</button>
                      </div>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
