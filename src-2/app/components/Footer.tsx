import { Heart } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_WHATSAPP_URL } from "@/app/config/site";

export function Footer() {
  return (
    <footer className="bg-[#1a2332] text-white py-12 sm:py-24 relative overflow-hidden">
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 sm:gap-16 mb-8 sm:mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <svg viewBox="0 0 24 24" className="w-10 h-10 rounded-xl" role="img" aria-label="ClinicFlow">
                <rect width="24" height="24" rx="5.4" fill="#2756A6" />
                <svg x="4.5" y="4.5" width="15" height="15" viewBox="0 0 24 24">
                  <path
                    d="M4.5 16.5 C4.5 10 10 6 14.5 8 C18.5 9.8 19 14.5 15.5 16 C13.2 17 11 15.6 11.8 13.2"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </svg>
              <span className="text-2xl sm:text-3xl font-bold">ClinicFlow</span>
            </div>
            <p className="text-[#b8d4e6] leading-relaxed max-w-md">
              מערכת ניהול חולים אופליין מתקדמת לרופאים שמעריכים פרטיות,
              אבטחה ושליטה מלאה על הנתונים הרפואיים.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xl font-semibold mb-6">קישורים</h4>
            <ul className="space-y-4">
              <li>
                <a href="/blog" className="text-[#b8d4e6] hover:text-white transition-colors">
                  בלוג
                </a>
              </li>
              <li>
                <a href="/about" className="text-[#b8d4e6] hover:text-white transition-colors">
                  אודות
                </a>
              </li>
              <li>
                <a href="/features" className="text-[#b8d4e6] hover:text-white transition-colors">
                  יכולות
                </a>
              </li>
              <li>
                <a href="/pricing" className="text-[#b8d4e6] hover:text-white transition-colors">
                  מחירים
                </a>
              </li>
              <li>
                <a href="/contact" className="text-[#b8d4e6] hover:text-white transition-colors">
                  תמיכה
                </a>
              </li>
              <li>
                <a
                  href="https://docs.clinic-flow.co.il"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#b8d4e6] hover:text-white transition-colors"
                >
                  מרכז מידע
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xl font-semibold mb-6">מדיניות</h4>
            <ul className="space-y-4">
              <li>
                <a href="/terms" className="text-[#b8d4e6] hover:text-white transition-colors">
                  תנאי שימוש
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-[#b8d4e6] hover:text-white transition-colors">
                  מדיניות פרטיות
                </a>
              </li>
              <li>
                <a href="/disclaimer" className="text-[#b8d4e6] hover:text-white transition-colors">
                  הסרת אחריות
                </a>
              </li>
              <li>
                <a href="/refund" className="text-[#b8d4e6] hover:text-white transition-colors">
                  מדיניות החזרים
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xl font-semibold mb-6">צור/י קשר</h4>
            <ul className="space-y-4">
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#b8d4e6] hover:text-white transition-colors break-all">
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a href={CONTACT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-[#b8d4e6] hover:text-white transition-colors">
                  WhatsApp
                </a>
              </li>
              <li className="text-[#b8d4e6] text-sm">
                תל אביב, ישראל
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#b8d4e6] flex items-center gap-2">
              נבנה עם
              <Heart className="w-4 h-4 text-[#00838f] fill-current" />
              לרופאים בישראל
            </p>
            <p className="text-sm text-[#b8d4e6]">
              © 2026 ClinicFlow. כל הזכויות שמורות.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
