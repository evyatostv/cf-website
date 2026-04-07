import { FullScreenCalendar, type CalendarData } from "@/app/components/ui/fullscreen-calendar"

// Sample appointment data — replace with real data from your backend
const sampleData: CalendarData[] = [
  {
    day: new Date(),
    events: [
      { id: 1, name: "ישיבת צוות", time: "10:00", datetime: new Date().toISOString() },
      { id: 2, name: "מטופל: יוסי כהן", time: "14:00", datetime: new Date().toISOString() },
    ],
  },
]

export function CalendarPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <FullScreenCalendar
        data={sampleData}
        onNewEvent={() => console.log("New appointment")}
      />
    </div>
  )
}
