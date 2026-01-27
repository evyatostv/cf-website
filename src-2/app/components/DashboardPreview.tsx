import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Calendar, TrendingUp, Activity } from "lucide-react";

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
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
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
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          {/* Device Frame */}
          <div className="relative bg-gradient-to-br from-[#1a2332] to-[#2a3442] rounded-3xl p-3 shadow-2xl">
            <div className="bg-[#f5f7f9] rounded-2xl overflow-hidden">
              {/* Dashboard Header */}
              <div className="bg-white border-b border-[#e1e6ec] px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-[#1a2332]">לוח בקרה</h3>
                    <p className="text-[#6b7c93] mt-1">סקירה כללית</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0d47a1] to-[#00838f]" />
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-6 border border-[#e1e6ec] shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#e8f4f8] flex items-center justify-center">
                        <Users className="w-6 h-6 text-[#0d47a1]" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-[#1a2332] mb-1">1,248</p>
                    <p className="text-sm text-[#6b7c93]">מטופלים פעילים</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl p-6 border border-[#e1e6ec] shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#e8f4f8] flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-[#00838f]" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-[#1a2332] mb-1">42</p>
                    <p className="text-sm text-[#6b7c93]">תורים היום</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl p-6 border border-[#e1e6ec] shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#e8f4f8] flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-[#0d47a1]" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-[#1a2332] mb-1">+12%</p>
                    <p className="text-sm text-[#6b7c93]">גידול החודש</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-2xl p-6 border border-[#e1e6ec] shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#e8f4f8] flex items-center justify-center">
                        <Activity className="w-6 h-6 text-[#00838f]" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-[#1a2332] mb-1">98%</p>
                    <p className="text-sm text-[#6b7c93]">שביעות רצון</p>
                  </motion.div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white rounded-2xl p-6 border border-[#e1e6ec] shadow-sm"
                  >
                    <h4 className="text-lg font-semibold text-[#1a2332] mb-6">ביקורים חודשיים</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData}>
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#6b7c93", fontSize: 12 }}
                          axisLine={{ stroke: "#e1e6ec" }}
                        />
                        <YAxis
                          tick={{ fill: "#6b7c93", fontSize: 12 }}
                          axisLine={{ stroke: "#e1e6ec" }}
                        />
                        <Bar dataKey="value" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0d47a1" />
                            <stop offset="100%" stopColor="#00838f" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white rounded-2xl p-6 border border-[#e1e6ec] shadow-sm"
                  >
                    <h4 className="text-lg font-semibold text-[#1a2332] mb-6">התפלגות מגדרית</h4>
                    <div className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-4">
                      {pieData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-sm text-[#6b7c93]">
                            {entry.name} ({entry.value}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
