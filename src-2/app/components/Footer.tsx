import { Heart } from "lucide-react";
import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-[#1a2332] text-white py-12 relative overflow-hidden">
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0d47a1] to-[#00838f]" />
              <span className="text-2xl font-bold">Clinic Flow</span>
            </div>
            <p className="text-[#b8d4e6] leading-relaxed max-w-md">
              מערכת ניהול חולים אופליין מתקדמת לרופאים שמעריכים פרטיות,
              אבטחה ושליטה מלאה על הנתונים הרפואיים.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">קישורים</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-[#b8d4e6] hover:text-white transition-colors">
                  אודות
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-[#b8d4e6] hover:text-white transition-colors">
                  יכולות
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-[#b8d4e6] hover:text-white transition-colors">
                  מחירים
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#b8d4e6] hover:text-white transition-colors">
                  תמיכה
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">צור קשר</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:info@clinicflow.co.il" className="text-[#b8d4e6] hover:text-white transition-colors">
                  info@clinicflow.co.il
                </a>
              </li>
              <li>
                <a href="tel:+972501234567" className="text-[#b8d4e6] hover:text-white transition-colors">
                  050-123-4567
                </a>
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
              © 2026 Clinic Flow. כל הזכויות שמורות.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
