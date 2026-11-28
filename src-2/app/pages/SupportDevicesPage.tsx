import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ActiveDevicesSection } from '@/app/components/ActiveDevicesSection';
import { useDesktopSupportPermission } from '@/app/components/DesktopSupportLink';

function CustomerLookup() {
  const [email, setEmail] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCustomerEmail(email.trim().toLowerCase());
  }

  return (
    <>
      <form onSubmit={submit} className="my-6 rounded-2xl border border-[#e1e6ec] bg-white p-5">
        <label htmlFor="support-customer-email" className="block font-semibold">כתובת הדוא״ל של חשבון הלקוח</label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="support-customer-email" name="email" type="email" dir="ltr" required autoComplete="off" maxLength={254}
            value={email} onChange={event => { setEmail(event.target.value); setCustomerEmail(''); }}
            className="min-w-0 flex-1 rounded-lg border border-slate-400 px-3 py-2"
          />
          <button type="submit" className="rounded-lg bg-[#0d47a1] px-4 py-2 font-semibold text-white">
            הצגת מחשבים
          </button>
        </div>
      </form>
      {customerEmail && (
        <div>
          <p className="mb-3 text-sm text-slate-700">חשבון שנבחר: <bdi>{customerEmail}</bdi></p>
          <ActiveDevicesSection key={customerEmail} customerEmail={customerEmail} />
        </div>
      )}
    </>
  );
}

export function SupportDevicesPage() {
  const permission = useDesktopSupportPermission();
  return (
    <main className="min-h-[60vh] bg-slate-50 px-4 pb-20 pt-28 text-[#1a2332]" dir="rtl">
      <div className="mx-auto max-w-3xl">
        <Link to="/dashboard" className="font-medium text-[#0d47a1] underline underline-offset-4">חזרה לאזור האישי</Link>
        <h1 className="mt-5 text-2xl font-bold">ניהול מחשבי לקוחות</h1>
        {permission === 'loading' && <p role="status" className="mt-4">בודק הרשאות תמיכה…</p>}
        {permission === 'denied' && <p role="alert" className="mt-4">הגישה לכלי זה מיועדת לצוות התמיכה.</p>}
        {permission === 'error' && <p role="alert" className="mt-4">בדיקת ההרשאות נכשלה. רעננו את העמוד ונסו שוב.</p>}
        {permission === 'allowed' && <CustomerLookup />}
      </div>
    </main>
  );
}
