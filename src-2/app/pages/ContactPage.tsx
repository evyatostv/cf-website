import { motion } from "motion/react";
import { Mail, MessageCircle, Send, CheckCircle } from "lucide-react";
import { useState } from "react";
import { submitLead } from "@/lib/leads";
import { CONTACT_EMAIL, CONTACT_WHATSAPP_URL } from "@/app/config/site";

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await submitLead({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      message: formData.message,
      source: "contact-page",
    });

    setLoading(false);

    if (!res.ok) {
      setError(res.error || "שגיאה בשליחה. נסה שוב מאוחר יותר.");
      return;
    }

    setSuccess(true);
    setFormData({ name: "", email: "", phone: "", message: "" });
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
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#1a2332] mb-6">
            בוא נדבר
            <br />
            <span className="text-[#0d47a1]">
              איך נוכל לעזור?
            </span>
          </h1>
          <p className="text-xl text-[#6b7c93] max-w-2xl mx-auto">
            שאלה על האפליקציה, על ההתקנה, או רוצים לראות אותה עובדת? כתבו ונחזור אליכם.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-[#e1e6ec] mb-8">
              <h2 className="text-2xl font-bold text-[#1a2332] mb-6">צור קשר</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#e8f4f8] flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-[#0d47a1]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1a2332] mb-1">אימייל</h3>
                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#6b7c93] hover:text-[#0d47a1] transition-colors">{CONTACT_EMAIL}</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#e8f4f8] flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-[#0d47a1]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1a2332] mb-1">WhatsApp</h3>
                    <a href={CONTACT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-[#6b7c93] hover:text-[#0d47a1] transition-colors">שלחו לנו הודעה בוואטסאפ</a>
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0d47a1] to-[#00838f] rounded-3xl p-5 sm:p-8 text-white">
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
            className="bg-white rounded-3xl p-5 sm:p-8 border border-[#e1e6ec]"
          >
            <h2 className="text-2xl font-bold text-[#1a2332] mb-6">שלח הודעה</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="contact-name" className="block text-[#1a2332] mb-2">שם מלא</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 text-base bg-[#f5f7f9] border border-[#e1e6ec] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition-all"
                  placeholder="הכנס את שמך"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-[#1a2332] mb-2">אימייל</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 text-base bg-[#f5f7f9] border border-[#e1e6ec] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="contact-phone" className="block text-[#1a2332] mb-2">טלפון</label>
                <input
                  id="contact-phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 text-base bg-[#f5f7f9] border border-[#e1e6ec] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition-all"
                  placeholder="050-1234567"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-[#1a2332] mb-2">הודעה</label>
                <textarea
                  id="contact-message"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 text-base bg-[#f5f7f9] border border-[#e1e6ec] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d47a1] transition-all resize-y min-h-[120px] sm:min-h-[150px]"
                  placeholder="ספר לנו איך נוכל לעזור..."
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#0d47a1]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                {loading ? "שולח..." : "שלח הודעה"}
              </button>
            </form>

            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-700 font-medium">תודה על פנייתך! ניצור איתך קשר בקרוב.</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
