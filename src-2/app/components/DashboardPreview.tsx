import { Activity } from "lucide-react";
import { ContainerScroll } from "./ui/container-scroll-animation";

export function DashboardPreview() {
  return (
    <section id="dashboard" className="bg-gradient-to-b from-[#f5f7f9] to-white relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <ContainerScroll
          titleComponent={
            <>
              <div className="inline-flex items-center gap-2 bg-[#e8f4f8] rounded-full px-5 py-2 mb-6">
                <Activity className="w-4 h-4 text-[#0d47a1]" />
                <span className="text-sm font-medium text-[#0d47a1]">ממשק המערכת</span>
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#1a2332] mb-6 leading-tight">
                כל המרפאה
                <br />
                <span className="text-[#0d47a1]">
                  במסך אחד
                </span>
              </h2>
              <p className="text-xl text-[#6b7c93] max-w-2xl mx-auto leading-relaxed">
                רואים מה קרה היום: כמה תורים, כמה ביקורים, אילו מסמכים יצאו — בלי לפתוח אקסל.
              </p>
            </>
          }
        >
          {/* Real product screenshot inside the scroll card */}
          <div className="h-full overflow-auto bg-[#f5f7f9] rounded-xl">
            <img
              src="/preview/app-home-v2.png"
              alt="לוח הבקרה של ClinicFlow"
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>
        </ContainerScroll>
      </div>
    </section>
  );
}
