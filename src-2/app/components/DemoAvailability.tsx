const DEMO_HOURS = [
  { days: "ראשון", start: "16:40" },
  { days: "שני ושלישי", start: "13:35" },
  { days: "רביעי", start: "12:55" },
  { days: "חמישי", start: "14:35" },
] as const;

export function DemoAvailability() {
  return (
    <section
      aria-label="שעות להדגמה"
      className="mb-6 rounded-xl border border-[#e1e6ec] bg-[#f5f7f9] p-4"
    >
      <p className="mb-1 font-semibold text-[#1a2332]">שעות להדגמה</p>
      <p className="mb-3 text-sm text-[#6b7c93]">שעון ישראל. אפשר להציע שעה בהודעה ונחזור אליכם לאישור.</p>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
        {DEMO_HOURS.map(({ days, start }) => (
          <div className="contents" key={days}>
            <dt className="text-[#1a2332]">{days}</dt>
            <dd dir="ltr" className="text-[#6b7c93]">{start}–21:00</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
