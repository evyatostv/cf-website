import { motion } from "motion/react";
import { Shield, Users, Heart, Target } from "lucide-react";

export function AboutPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-[#1a2332] mb-6">
            המשימה שלנו
            <br />
            <span className="bg-gradient-to-r from-[#0d47a1] to-[#00838f] bg-clip-text text-transparent">
              פרטיות מוחלטת
            </span>
          </h1>
          <p className="text-xl text-[#6b7c93] max-w-3xl mx-auto leading-relaxed">
            ב-Clinic Flow אנחנו מאמינים שמידע רפואי צריך להישאר פרטי לחלוטין.
            בעידן שבו הכל מחובר לענן, אנחנו מציעים פתרון שונה - אבטחה מוחלטת
            באמצעות אחסון מקומי בלבד.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0d47a1]/10 to-[#00838f]/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-[#0d47a1]" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-[#1a2332] mb-2">אבטחה ראשונה</h3>
                <p className="text-[#6b7c93] leading-relaxed">
                  פיתחנו את המערכת מתוך הבנה עמוקה של חשיבות פרטיות המידע הרפואי.
                  אין פשרות בנושא אבטחה - הנתונים נשארים אצלכם בלבד.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0d47a1]/10 to-[#00838f]/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-[#0d47a1]" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-[#1a2332] mb-2">מבין רופאים</h3>
                <p className="text-[#6b7c93] leading-relaxed">
                  הצוות שלנו כולל רופאים ואנשי מקצוע רפואיים שמבינים את הצרכים
                  האמיתיים של עבודה קלינית יומיומית.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0d47a1]/10 to-[#00838f]/10 flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-[#0d47a1]" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-[#1a2332] mb-2">תמיכה אמיתית</h3>
                <p className="text-[#6b7c93] leading-relaxed">
                  אנחנו כאן כדי לעזור. הצוות שלנו זמין לכל שאלה ובעיה,
                  עם תמיכה טכנית מקצועית ואכפתית.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0d47a1]/10 to-[#00838f]/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-[#0d47a1]" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-[#1a2332] mb-2">שיפור מתמיד</h3>
                <p className="text-[#6b7c93] leading-relaxed">
                  אנחנו מקשיבים למשוב מהרופאים ומשפרים את המערכת באופן קבוע.
                  כל עדכון מביא יכולות חדשות ושיפורים.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-gradient-to-br from-[#0d47a1] to-[#00838f] rounded-3xl p-12 text-center text-white"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">הצטרפו למהפכת הפרטיות הרפואית</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            מאות רופאים כבר בחרו באבטחה ובפרטיות. הצטרפו אליהם היום.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="px-10 py-4 bg-white text-[#0d47a1] rounded-xl font-semibold hover:shadow-xl transition-all"
            >
              צור קשר
            </a>
            <a
              href="/pricing"
              className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all font-medium"
            >
              ראה מחירים
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
