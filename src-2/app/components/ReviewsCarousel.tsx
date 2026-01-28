import Slider from "react-slick";
import { Star } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

const reviews = [
  {
    name: "ד״ר דוד כהן",
    specialty: "רופא משפחה",
    image: "https://images.unsplash.com/photo-1615177393114-bd2917a4f74a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYWxlJTIwZG9jdG9yJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY5NTM2MDAzfDA&ixlib=rb-4.1.0&q=80&w=400",
    text: "המערכת שינתה לי לחלוטין את אופן ניהול הקליניקה. אין לי צורך לדאוג לחיבור אינטרנט והנתונים שלי מאובטחים לחלוטין. חובה לכל רופא!",
    rating: 5,
  },
  {
    name: "ד״ר שרה לוי",
    specialty: "רופאת ילדים",
    image: "https://images.unsplash.com/photo-1759350075177-eeb89d507990?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBmZW1hbGUlMjBkb2N0b3IlMjBwb3J0cmFpdHxlbnwxfHx8fDE3Njk1MzYwMDN8MA&ixlib=rb-4.1.0&q=80&w=400",
    text: "אני עובדת בכמה קליניקות שונות ובכולן אין חיבור אינטרנט יציב. Clinic Flow פתרה לי את הבעיה - אני יכולה לעבוד מכל מקום בלי להסתמך על חיבור.",
    rating: 5,
  },
  {
    name: "ד״ר מיכאל אברהם",
    specialty: "רופא עור",
    image: "https://images.unsplash.com/photo-1632054224659-280be3239aff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBkb2N0b3IlMjBoZWFkc2hvdCUyMG1hbGV8ZW58MXx8fHwxNzY5NTM2MDAzfDA&ixlib=rb-4.1.0&q=80&w=400",
    text: "הממשק נקי וקל לתפעול. הכי חשוב - אני יודע שהנתונים הרפואיים של המטופלים שלי לא נמצאים בענן אצל מישהו אחר. פרטיות מוחלטת.",
    rating: 5,
  },
  {
    name: "ד״ר רחל גולדשטיין",
    specialty: "רופאת נשים",
    image: "https://images.unsplash.com/photo-1652549210870-bf3a6955f9d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBkb2N0b3IlMjBoZWFkc2hvdCUyMGZlbWFsZXxlbnwxfHx8fDE3Njk1MzYwMDR8MA&ixlib=rb-4.1.0&q=80&w=400",
    text: "פשוט מושלם. אני מרגישה הרבה יותר בטוחה עם הנתונים הרגישים של המטופלות שלי. השירות מעולה והמערכת אמינה.",
    rating: 5,
  },
  {
    name: "ד״ר יוסי בן דוד",
    specialty: "רופא שיניים",
    image: "https://images.unsplash.com/photo-1612636320854-776180f479d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtZWRpY2FsJTIwcHJvZmVzc2lvbmFsJTIwcG9ydHJhaXQlMjBtYWxlfGVufDF8fHx8MTc2OTUxNzA3OXww&ixlib=rb-4.1.0&q=80&w=400",
    text: "המעבר מהמערכת הקודמת היה חלק. עכשיו אני עובד מהר יותר ובטוח יותר. לא צריך לחכות לטעינות והכל זמין באופן מיידי.",
    rating: 5,
  },
  {
    name: "ד״ר נועה פרידמן",
    specialty: "רופאה פנימית",
    image: "https://images.unsplash.com/photo-1659353888906-adb3e0041693?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtZWRpY2FsJTIwcHJvZmVzc2lvbmFsJTIwcG9ydHJhaXQlMjBmZW1hbGV8ZW58MXx8fHwxNzY5NTM2MDA0fDA&ixlib=rb-4.1.0&q=80&w=400",
    text: "אחרי שנים של דאגות לגבי אבטחת המידע, סוף סוף מצאתי פתרון שמרגיע אותי. המערכת מהירה, יציבה ופרטית לחלוטין.",
    rating: 5,
  },
];

export function ReviewsCarousel() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const settings = {
    infinite: true,
    speed: 8000,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: "linear",
    pauseOnHover: true,
    rtl: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <section className="py-32 bg-gradient-to-b from-white to-[#f8fafb] overflow-x-hidden" ref={ref}>
      <div className="container mx-auto px-6 max-w-7xl mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-[#e8f4f8] rounded-full px-5 py-2 mb-6">
            <Star className="w-4 h-4 text-[#0d47a1] fill-current" />
            <span className="text-sm font-medium text-[#0d47a1]">המלצות</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-[#1a2332] mb-6 leading-tight">
            מה רופאים
            <br />
            <span className="bg-gradient-to-r from-[#0d47a1] to-[#00838f] bg-clip-text text-transparent">
              אומרים עלינו
            </span>
          </h2>
          <p className="text-xl text-[#6b7c93] max-w-2xl mx-auto leading-relaxed">
            מאות רופאים סומכים עלינו מדי יום לניהול המידע הרפואי שלהם
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="reviews-carousel-wrapper"
      >
        <Slider {...settings}>
          {reviews.map((review, index) => (
            <div key={index} className="px-3">
              <div className="bg-white rounded-3xl p-8 border border-[#e1e6ec] shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={review.image}
                    alt={review.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#e1e6ec]"
                  />
                  <div>
                    <h4 className="text-lg font-semibold text-[#1a2332]">{review.name}</h4>
                    <p className="text-sm text-[#6b7c93]">{review.specialty}</p>
                  </div>
                </div>

                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#0d47a1] fill-current" />
                  ))}
                </div>

                <p className="text-[#6b7c93] leading-relaxed">{review.text}</p>
              </div>
            </div>
          ))}
        </Slider>
      </motion.div>
    </section>
  );
}
