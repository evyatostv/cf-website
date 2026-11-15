import { ArrowLeft, CalendarDays, FileText, Laptop, Users, WifiOff } from "lucide-react";
import { Link } from "react-router";
import { Seo } from "@/app/components/Seo";

const CONTACT_PATH = "/contact?intent=partnership";
const FOCUS_STYLE = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d47a1]";

const capabilities = [
  {
    icon: Users,
    title: "תיקי מטופלים ותיעוד",
    description: "גישה להיסטוריית המטופל ותיעוד הביקור בכרטיס אחד.",
  },
  {
    icon: CalendarDays,
    title: "יומן תורים",
    description: "קביעה ומעקב אחר תורים ביומן של המרפאה הפרטית.",
  },
  {
    icon: FileText,
    title: "מסמכים וניהול כספי",
    description: "שמירת מסמכים בתיק המטופל ומעקב אחר הכנסות מהפעילות הפרטית.",
  },
];

export function PartnersPage() {
  return (
    <main className="text-[#1a2332]">
      <Seo
        title="שיתופי פעולה עם חברות להשכרת חדרי קליניקה | ClinicFlow"
        description="היכרות עם ClinicFlow, תוכנה מקומית לניהול מרפאה פרטית, לחברות שמשכירות חדרי קליניקה לרופאים לפי שעה. דברו איתנו לבדיקת שיתוף פעולה."
        canonicalPath="/partners"
      />

      <section className="bg-gradient-to-b from-white to-[#f5f7f9] pt-28 pb-12 sm:pt-36 sm:pb-20">
        <div className="mx-auto grid max-w-6xl items-center gap-9 px-6 sm:gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="mb-4 text-sm font-semibold text-[#006b74] sm:text-base">
              לחברות שמשכירות חדרי קליניקה לפי שעה
            </p>
            <h1 className="text-3xl leading-[1.17] font-bold tracking-tight text-balance sm:text-5xl">
              תוכנה לרופאים שעובדים<br className="hidden sm:block" />{" "}
              <span className="text-[#0d47a1]">בחדר קליניקה שכור</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#4a5e74] sm:text-lg">
              <bdi>ClinicFlow</bdi> היא תוכנה לניהול מרפאה פרטית בעברית. היא מרכזת את תיקי המטופלים, יומן התורים, תיעוד הביקורים, המסמכים והניהול הכספי במקום אחד.
            </p>
            <Link
              to={CONTACT_PATH}
              className={`mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0d47a1] to-[#007481] px-6 py-3.5 font-semibold text-white shadow-lg shadow-[#0d47a1]/15 transition-shadow hover:shadow-xl sm:w-auto ${FOCUS_STYLE}`}
            >
              בואו נקבע שיחת היכרות
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
          </div>

          <img
            src="/partners/consultation-room.webp"
            alt="חדר קליניקה להמחשה, עם שולחן עבודה, מחשב נייד וכיסאות למטופלים"
            width={1200}
            height={900}
            className="aspect-[4/3] w-full rounded-3xl border border-[#e1e6ec] object-cover shadow-xl shadow-[#0d47a1]/10"
          />
        </div>
      </section>

      <section aria-labelledby="partner-fit" className="mx-auto max-w-6xl px-6 pt-12 sm:pt-16">
        <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-center md:gap-12">
          <div>
            <h2 id="partner-fit" className="text-2xl leading-tight font-bold sm:text-3xl">למי זה מתאים?</h2>
            <p className="mt-3 max-w-lg leading-relaxed text-[#4a5e74] sm:text-lg">
              לרופאות ולרופאים שמנהלים פעילות פרטית עצמאית ועובדים מעמדה אחת, גם אם הם מקבלים מטופלים בקליניקה שכורה לצד עבודה בבית חולים או בקופה.
            </p>
          </div>
          <ul className="space-y-3 rounded-2xl border border-[#dfeaf1] bg-[#f3f8fb] p-5 text-[#233b53] sm:p-6">
            <li className="flex items-start gap-3">
              <Laptop className="mt-0.5 size-5 shrink-0 text-[#0d47a1]" aria-hidden="true" />
              <span>התוכנה מותקנת על המחשב של הרופא והרשומות נשמרות בו מקומית.</span>
            </li>
            <li className="flex items-start gap-3">
              <WifiOff className="mt-0.5 size-5 shrink-0 text-[#0d47a1]" aria-hidden="true" />
              <span>השימוש השוטף בתוכנה אפשרי גם ללא אינטרנט.</span>
            </li>
          </ul>
        </div>

        <ul aria-label="יכולות ClinicFlow" className="mt-7 grid gap-4 sm:mt-8 md:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, description }) => (
            <li key={title} className="rounded-2xl border border-[#e1e6ec] bg-white p-5 sm:p-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#e8f4f8] text-[#0d47a1]">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 leading-relaxed text-[#4a5e74]">{description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="partner-call" className="mx-auto max-w-6xl px-6 pt-9 pb-12 sm:pt-12 sm:pb-16">
        <div className="flex flex-col gap-6 rounded-3xl bg-gradient-to-br from-[#0d47a1] to-[#006b77] px-6 py-8 text-white sm:px-9 sm:py-9 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 id="partner-call" className="text-2xl leading-tight font-bold sm:text-3xl">נבדוק יחד אם יש מקום לשיתוף פעולה</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-white/95">
              בשיחת היכרות קצרה נשמע איך הרופאים אצלכם עובדים, ונבדוק אם כדאי להציג להם את <bdi>ClinicFlow</bdi> כחלק מהמידע שהם מקבלים בתחילת השכירות.
            </p>
          </div>
          <Link
            to={CONTACT_PATH}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-semibold text-[#0d47a1] transition-colors hover:bg-[#e8f4f8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:self-start lg:self-auto"
          >
            צרו קשר
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
