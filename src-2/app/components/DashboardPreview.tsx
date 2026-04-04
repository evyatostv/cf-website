import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Calendar, TrendingUp, Activity } from "lucide-react";
import { ContainerScroll } from "./ui/container-scroll-animation";

const chartData = [
  { name: "ינו", value: 42 },
  { name: "פבר", value: 38 },
  { name: "מרץ", value: 45 },
  { name: "אפר", value: 52 },
  { name: "מאי", value: 48 },
  { name: "יונ", value: 55 },
];

const pieData = [
  { name: "גברים", value: 45, color: "#0d47a1" },
  { name: "נשים", value: 55, color: "#00838f" },
];

export function DashboardPreview() {
  return (
    <section className="bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <ContainerScroll
          titleComponent={
            <>
              <div className="inline-flex items-center gap-2 bg-[#e8f4f8] rounded-full px-5 py-2 mb-6">
                <Activity className="w-4 h-4 text-[#0d47a1]" />
                <span className="text-sm font-medium text-[#0d47a1]">ממשק המערכת</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-[#1a2332] mb-6 leading-tight">
                ממשק מתקדם
                <br />
                <span className="bg-gradient-to-r from-[#0d47a1] to-[#00838f] bg-clip-text text-transparent">
                  וקל לשימוש
                </span>
              </h2>
              <p className="text-xl text-[#6b7c93] max-w-2xl mx-auto leading-relaxed">
                לוח בקרה מודרני ואינטואיטיבי המאפשר לך לנהל את כל המטופלים ביעילות מקסימלית
              </p>
            </>
          }
        >
          {/* Dashboard Mockup inside the scroll card */}
          <div className="h-full overflow-auto bg-[#f5f7f9] rounded-xl">
            {/* Dashboard Header */}
            <div className="bg-white border-b border-[#e1e6ec] px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-[#1a2332]">לוח בקרה</h3>
                  <p className="text-[#6b7c93] text-sm mt-0.5">סקירה כללית</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0d47a1] to-[#00838f]" />
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { icon: Users, value: "1,248", label: "מטופלים פעילים", color: "#0d47a1" },
                  { icon: Calendar, value: "42", label: "תורים היום", color: "#00838f" },
                  { icon: TrendingUp, value: "+12%", label: "גידול החודש", color: "#0d47a1" },
                  { icon: Activity, value: "98%", label: "שביעות רצון", color: "#00838f" },
                ].map(({ icon: Icon, value, label, color }) => (
                  <div key={label} className="bg-white rounded-xl p-4 border border-[#e1e6ec] shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-[#e8f4f8] flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <p className="text-2xl font-bold text-[#1a2332]">{value}</p>
                    <p className="text-xs text-[#6b7c93] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-[#e1e6ec] shadow-sm">
                  <h4 className="text-sm font-semibold text-[#1a2332] mb-4">ביקורים חודשיים</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" tick={{ fill: "#6b7c93", fontSize: 11 }} axisLine={{ stroke: "#e1e6ec" }} />
                      <YAxis tick={{ fill: "#6b7c93", fontSize: 11 }} axisLine={{ stroke: "#e1e6ec" }} />
                      <Bar dataKey="value" fill="url(#colorGradient)" radius={[6, 6, 0, 0]} />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0d47a1" />
                          <stop offset="100%" stopColor="#00838f" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl p-4 border border-[#e1e6ec] shadow-sm">
                  <h4 className="text-sm font-semibold text-[#1a2332] mb-4">התפלגות מגדרית</h4>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    {pieData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs text-[#6b7c93]">{entry.name} ({entry.value}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ContainerScroll>
      </div>
    </section>
  );
}
