import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Seo } from '@/app/components/Seo';

export function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading');
  useEffect(() => { let alive = true; const id = params.get('order'); if (!id) { setStatus('failed'); return; } const check = async () => { const { data } = await supabase.from('orders').select('status').eq('id', id).maybeSingle(); if (alive) setStatus(data?.status === 'PAID' ? 'paid' : data?.status === 'FAILED' || data?.status === 'CANCELLED' ? 'failed' : 'pending'); }; check(); const timer = window.setInterval(check, 4000); return () => { alive = false; window.clearInterval(timer); }; }, [params]);
  const text = status === 'paid' ? ['התשלום אושר', 'הרישיון הופעל. בדקו את תיבת הדואר לקבלת הוראות ההתקנה.'] : status === 'failed' ? ['התשלום לא אושר', 'לא הופעל חיוב מאושר עבור ההזמנה הזו.'] : ['קיבלנו את החזרה מדף התשלום', 'אנחנו ממתינים לאישור המאובטח. אין צורך לשלם שוב — הדף יתעדכן אוטומטית.'];
  return <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[#f5f7f9] p-6"><Seo title="סטטוס תשלום | ClinicFlow" description="סטטוס התשלום והמשך הפעולה ב־ClinicFlow. אפשר לחזור לתמחור או להמשיך לאזור האישי לאחר אישור ההזמנה." canonicalPath="/checkout/success" noindex /><div className="bg-white rounded-2xl border p-8 max-w-lg text-center"><h1 className="text-2xl font-bold text-[#1a2332]">{text[0]}</h1><p className="mt-3 text-[#6b7c93]">{text[1]}</p><Link className="inline-block mt-6 rounded-xl bg-[#0d47a1] px-6 py-3 text-white" to={status === 'failed' ? '/pricing' : '/dashboard'}>{status === 'failed' ? 'חזרה לתמחור' : 'המשך ל-ClinicFlow'}</Link></div></div>;
}
export function CheckoutCancelPage() { return <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[#f5f7f9] p-6"><Seo title="התשלום בוטל | ClinicFlow" description="התשלום בוטל ללא חיוב. אפשר לחזור לעמוד התמחור של ClinicFlow." canonicalPath="/checkout/cancel" noindex /><div className="bg-white rounded-2xl border p-8 max-w-lg text-center"><h1 className="text-2xl font-bold text-[#1a2332]">התשלום בוטל</h1><p className="mt-3 text-[#6b7c93]">לא בוצע חיוב. אפשר לנסות שוב בכל עת.</p><Link className="inline-block mt-6 rounded-xl bg-[#0d47a1] px-6 py-3 text-white" to="/pricing">חזרה לתמחור</Link></div></div>; }
