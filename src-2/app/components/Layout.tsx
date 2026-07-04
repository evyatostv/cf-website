import { Outlet, useLocation } from "react-router";
import { Navigation } from "@/app/components/Navigation";
import { Footer } from "@/app/components/Footer";
import { CookieBanner } from "@/app/components/CookieBanner";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

export function Layout() {
  const location = useLocation();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <div className="min-h-screen bg-white" dir="rtl" style={{ fontFamily: "Heebo, sans-serif" }}>
      <Navigation />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeInOut" }}
          onAnimationStart={() => {
            // Honour an anchor/hash link (e.g. /features#pricing) instead of
            // always jumping to the top and fighting the anchor scroll (WEB-019).
            if (location.hash) {
              const el = document.querySelector(location.hash);
              if (el) {
                el.scrollIntoView();
                return;
              }
            }
            window.scrollTo(0, 0);
          }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <Footer />
      <CookieBanner />
    </div>
  );
}
