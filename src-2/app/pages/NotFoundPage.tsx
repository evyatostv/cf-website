import { Link } from 'react-router';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7f9] to-[#e8f4f8] flex items-center justify-center px-4" dir="rtl">
      <div className="max-w-md text-center">
        <div className="text-7xl font-bold bg-gradient-to-r from-[#0d47a1] to-[#00838f] bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-[#1a2332] mb-3">העמוד לא נמצא</h1>
        <p className="text-[#6b7c93] mb-8">
          הקישור שניסית לפתוח לא קיים או הוסר. בוא/י נחזור אותך לעמוד הבית.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition"
        >
          <Home className="w-4 h-4" />
          חזרה לעמוד הבית
        </Link>
      </div>
    </div>
  );
}
