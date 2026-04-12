import { FullScreenCalendar, type CalendarData } from "@/app/components/ui/fullscreen-calendar"

const emptyData: CalendarData[] = []

export function CalendarPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <FullScreenCalendar
        data={emptyData}
        onNewEvent={() => console.log("New appointment")}
      />
    </div>
  )
}
