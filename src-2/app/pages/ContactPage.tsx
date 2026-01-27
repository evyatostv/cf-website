import { motion } from "motion/react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
    alert("תודה על פנייתך! ניצור איתך קשר בקרוב.");
  };

  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-[#1a2332] mb-6">
            בוא נדבר
            <br />
            <span className="bg-gradient-to-r from-[#0d47a1] to-[#00838f] bg-clip-text text-transparent">
              איך נוכל לעזור?
            </span>
          </h1>
          <p className="text-xl text-[#6b7c93] max-w-2xl mx-auto">
            יש לך שאלות? רוצה לקבוע דמו? אנחנו כאן בשבילך
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-3xl p-8 border border-[#e1e6ec] mb-8">
              <h2 className="text-2xl font-bold text-[#1a2332] mb-6">צור קשר</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0d47a1]/10 to-[#00838f]/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-[#0d47a1]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1a2332] mb-1">אימייל</h3>
                    <p className="text-[#6b7c93]">info@clinicflow.co.il</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0d47a1]/10 to-[#00838f]/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-[#0d47a1]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1a2332] mb-1">טלפון</h3>
                    <p className="text-[#6b7c93]">03-1234567</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0d47a1]/10 to-[#00838f]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-[#0d47a1]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1a2332] mb-1">כתובת</h3>
                    <p className="text-[#6b7c93]">רחוב רוטשילד 1, תל אביב</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0d47a1] to-[#00838f] rounded-3xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">שעות פעילות</h3>
              <div className="space-y-2 text-white/90">
                <p>ראשון - חמישי: 9:00 - 18:00</p>
                <p>יום שישי: 9:00 - 13:00</p>
                <p>שבת: סגור</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-3xl p-8 border border-[#e1e6ec]"
          >
            <h2 className="text-2xl font-bold text-[#1a2332] mb-6">שלח הודעה</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[#1a2332] mb-2">שם מלא</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#f5f7f9] border border-[#e1e6ec] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition-all"
                  placeholder="הכנס את שמך"
                />
              </div>

              <div>
                <label className="block text-[#1a2332] mb-2">אימייל</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-[#f5f7f9] border border-[#e1e6ec] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-[#1a2332] mb-2">טלפון</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-[#f5f7f9] border border-[#e1e6ec] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition-all"
                  placeholder="050-1234567"
                />
              </div>

              <div>
                <label className="block text-[#1a2332] mb-2">הודעה</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 bg-[#f5f7f9] border border-[#e1e6ec] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition-all resize-none"
                  placeholder="ספר לנו איך נוכל לעזור..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#0d47a1]/30 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                שלח הודעה
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
