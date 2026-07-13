import { motion } from "motion/react";
import { Shield, Users, Heart, Target } from "lucide-react";
import { Seo, SITE_NAME, SITE_ORIGIN } from "@/app/components/Seo";

export function AboutPage() {
  return (
    <div className="pt-32 pb-20">
      <Seo
        title="אודות ClinicFlow – תוכנה ישראלית לניהול קליניקה אופליין"
        description="הסיפור מאחורי ClinicFlow: תוכנה ישראלית לניהול קליניקה שרצה אופליין על המחשב שלכם, בתשלום חד־פעמי וללא מנוי — כל נתוני המטופלים נשארים אצלכם בלבד."
        canonicalPath="/about"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "אודות ClinicFlow",
            url: `${SITE_ORIGIN}/about`,
            inLanguage: "he-IL",
            mainEntity: {
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_ORIGIN,
              logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/og-image.png` },
              description:
                "ClinicFlow — תוכנה לניהול קליניקה שעובדת אופליין על המחשב שלך, בתשלום חד־פעמי וללא מנוי. הנתונים נשארים אצלך, בהתאם לתיקון 13.",
            },
          },
        ]}
      />
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#1a2332] mb-6">
            למה בנינו
            <br />
            <span className="text-[#0d47a1]">
              מרפאה בלי ענן
            </span>
          </h1>
          <p className="text-xl text-[#6b7c93] max-w-3xl mx-auto leading-relaxed">
            כל מערכת מתחרה שומרת את תיקי המטופלים שלכם על שרת שלה. אנחנו עשינו
            ההפך: האפליקציה רצה על המחשב שלכם, והמידע לא עוזב אותו.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#e8f4f8] flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-[#0d47a1]" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-[#1a2332] mb-2">אבטחה ראשונה</h3>
                <p className="text-[#6b7c93] leading-relaxed">
                  בנינו את האפליקציה בלי שרת מרכזי בכוונה. אין מקום אחד שאפשר
                  לפרוץ ולשאוב ממנו תיקים — כל מרפאה מחזיקה את המידע שלה בעצמה.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#e8f4f8] flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-[#0d47a1]" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-[#1a2332] mb-2">בנוי לעבודה קלינית</h3>
                <p className="text-[#6b7c93] leading-relaxed">
                  כל שדה בכרטיס המטופל ובתיעוד ה-SOAP תוכנן סביב מה שקורה בפועל
                  בביקור — לא טופס גנרי.
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
              <div className="w-12 h-12 rounded-xl bg-[#e8f4f8] flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-[#0d47a1]" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-[#1a2332] mb-2">תמיכה אמיתית</h3>
                <p className="text-[#6b7c93] leading-relaxed">
                  שאלה על התקנה, גיבוי או מסמך שלא יוצא כמו שצריך? עונים בעברית, ישירות.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#e8f4f8] flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-[#0d47a1]" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-[#1a2332] mb-2">שיפור מתמיד</h3>
                <p className="text-[#6b7c93] leading-relaxed">
                  הרבה מהפיצ'רים נולדו מבקשה של משתמש. מבקשים תבנית מסמך חדשה או
                  שדה שחסר — לרוב זה נכנס בעדכון הבא.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-gradient-to-br from-[#0d47a1] to-[#00838f] rounded-3xl p-6 sm:p-12 text-center text-white"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">המידע של המטופלים שלכם — לא צריך לצאת מהמחשב</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            אתם לא צריכים ענן כדי לנהל מרפאה. כל מה שצריך רץ על המחשב שלכם — נסו, יש 30 יום להחזר כספי.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="px-10 py-4 bg-white text-[#0d47a1] rounded-xl font-semibold hover:shadow-xl transition-all"
            >
              צור/י קשר
            </a>
            <a
              href="/pricing"
              className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all font-medium"
            >
              ראה/י מחירים
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
