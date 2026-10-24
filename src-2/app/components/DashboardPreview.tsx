import { Activity, ShieldCheck, Laptop } from "lucide-react";

export function DashboardPreview() {
  return (
    <section id="dashboard" className="py-20 sm:py-28 bg-[#f8fafc] border-b border-[#e2e8f0]">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-[#e0f2fe] text-[#0369a1] text-xs sm:text-sm font-semibold rounded-full px-4 py-1.5 mb-4">
            <Activity className="w-4 h-4 text-[#0284c7]" />
            <span>ממשק עבודה קליני</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-[#0f172a] leading-tight mb-4">
            כל המרפאה —
            <span className="text-[#0d47a1]"> במסך אחד ברור</span>
          </h2>
          <p className="text-base sm:text-xl text-[#64748b] leading-relaxed">
            רואים את כל היום במבט אחד: יומן פגישות, תיקי מטופלים, סיכומים רפואיים ומסמכים — בלי לפתוח אקסל ובלי לעבור בין חלונות.
          </p>
        </div>

        {/* Realistic Desktop App Window */}
        <div className="bg-white rounded-2xl border border-[#cbd5e1] shadow-2xl overflow-hidden">
          {/* Native-style Application Header Bar */}
          <div className="bg-[#f1f5f9] px-4 py-3 border-b border-[#cbd5e1] flex items-center justify-between">
            {/* Window controls */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ef4444] border border-[#dc2626]/40 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#f59e0b] border border-[#d97706]/40 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#10b981] border border-[#059669]/40 inline-block" />
            </div>

            {/* App title */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#475569] select-none">
              <Laptop className="w-4 h-4 text-[#0d47a1]" />
              <span>ClinicFlow Desktop — מרפאה ראשית</span>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-medium">100% מקומי מוצפן</span>
            </div>
          </div>

          {/* Real application screenshot */}
          <div className="relative bg-[#f8fafc]">
            <img
              src="/preview/app-home-v2.png"
              alt="לוח הבקרה וממשק המערכת של ClinicFlow"
              width={1459}
              height={988}
              className="w-full h-auto block select-none"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
