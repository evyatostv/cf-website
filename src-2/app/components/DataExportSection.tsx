import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { downloadUserData } from '@/lib/data-export';
import { Download, FileText } from 'lucide-react';

// Lets a user download a copy of everything we hold on them (account + UID,
// licensing, purchases, consent) as a single JSON file — a "keep a record before
// you delete" safety net and a GDPR/right-to-access nicety.
export function DataExportSection() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await downloadUserData(user);
    } catch {
      setError('הורדת המידע נכשלה. בדקו את החיבור ונסו שוב.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div dir="rtl" className="bg-white rounded-2xl shadow-sm border border-[#e1e6ec] p-6">
      <div className="flex items-start gap-3">
        <FileText className="w-6 h-6 text-[#0d47a1] shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">הורדת המידע שלי</h3>
          <p className="text-sm text-gray-600 mb-4">
            הורד/י עותק של כל המידע שאנו מחזיקים עליך — פרטי החשבון, מזהה המשתמש (UID),
            רישוי, רכישות ואישורי מדיניות — כקובץ אחד. מומלץ לשמור עותק לפני מחיקת החשבון.
            הנתונים הרפואיים של המרפאה שמורים מקומית במחשב שלך בלבד ואינם כלולים כאן.
          </p>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <button
            onClick={handleDownload}
            disabled={busy || !user}
            className="inline-flex items-center gap-2 bg-white border border-[#0d47a1] text-[#0d47a1] font-medium px-5 py-2.5 rounded-lg hover:bg-[#0d47a1]/5 transition disabled:opacity-60 min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            {busy ? 'מכין/ה קובץ…' : 'הורדת המידע שלי (JSON)'}
          </button>
        </div>
      </div>
    </div>
  );
}
