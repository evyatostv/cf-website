import { Link, useLocation } from "react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

export function Navigation() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-lg shadow-sm" : "bg-white/80 backdrop-blur-lg"
      } border-b border-[#e1e6ec]`}
    >
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0d47a1] to-[#00838f]"
            />
            <span className="text-xl font-bold text-[#1a2332]">Clinic Flow</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`text-[#1a2332] hover:text-[#0d47a1] transition-colors font-medium relative ${
                isActive("/") ? "text-[#0d47a1]" : ""
              }`}
            >
              בית
              {isActive("/") && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-[-8px] left-0 right-0 h-0.5 bg-[#0d47a1]"
                />
              )}
            </Link>
            <Link
              to="/features"
              className={`text-[#1a2332] hover:text-[#0d47a1] transition-colors font-medium relative ${
                isActive("/features") ? "text-[#0d47a1]" : ""
              }`}
            >
              יכולות
              {isActive("/features") && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-[-8px] left-0 right-0 h-0.5 bg-[#0d47a1]"
                />
              )}
            </Link>
            <Link
              to="/pricing"
              className={`text-[#1a2332] hover:text-[#0d47a1] transition-colors font-medium relative ${
                isActive("/pricing") ? "text-[#0d47a1]" : ""
              }`}
            >
              מחירים
              {isActive("/pricing") && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-[-8px] left-0 right-0 h-0.5 bg-[#0d47a1]"
                />
              )}
            </Link>
            <Link
              to="/about"
              className={`text-[#1a2332] hover:text-[#0d47a1] transition-colors font-medium relative ${
                isActive("/about") ? "text-[#0d47a1]" : ""
              }`}
            >
              אודות
              {isActive("/about") && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-[-8px] left-0 right-0 h-0.5 bg-[#0d47a1]"
                />
              )}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/contact"
              className="px-6 py-2.5 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white rounded-xl hover:shadow-lg hover:shadow-[#0d47a1]/20 transition-all font-medium"
            >
              צור קשר
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
