import { Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

const NAV_LINKS = [
  { to: "/", label: "בית" },
  { to: "/features", label: "יכולות" },
  { to: "/pricing", label: "מחירים" },
  { to: "/about", label: "אודות" },
  { to: "/contact", label: "צור קשר" },
];

export function Navigation() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-lg shadow-sm border-b border-[#e1e6ec]" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0d47a1] to-[#00838f]"
              />
              <span className="text-xl font-bold text-[#1a2332]">Clinic Flow</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center">
              <Tabs
                value={location.pathname}
                onValueChange={(val) => navigate(val)}
                orientation="horizontal"
              >
                <TabsList className="border-b-0 gap-0 h-20">
                  {NAV_LINKS.map(({ to, label }) => (
                    <TabsTrigger
                      key={to}
                      value={to}
                      className="h-full rounded-none px-5 text-[0.9rem]"
                    >
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Desktop auth buttons */}
            <div className="hidden md:flex items-center gap-4">
              {!loading && !user ? (
                <>
                  <Link
                    to="/login"
                    className="px-6 py-2.5 text-[#0d47a1] hover:bg-[#f5f7f9] rounded-xl transition-all font-medium"
                  >
                    כניסה
                  </Link>
                  <Link
                    to="/signup"
                    className="px-6 py-2.5 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white rounded-xl hover:shadow-lg hover:shadow-[#0d47a1]/20 transition-all font-medium"
                  >
                    הרשמה
                  </Link>
                </>
              ) : (
                <Link
                  to="/dashboard"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white rounded-xl hover:shadow-lg hover:shadow-[#0d47a1]/20 transition-all font-medium"
                >
                  {user?.user_metadata?.full_name || user?.email}
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-xl hover:bg-[#f5f7f9] transition-colors"
              aria-label={mobileOpen ? "סגור תפריט" : "פתח תפריט"}
            >
              <motion.span
                animate={mobileOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.25 }}
                className="block w-5 h-0.5 bg-[#1a2332] rounded-full"
              />
              <motion.span
                animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="block w-5 h-0.5 bg-[#1a2332] rounded-full"
              />
              <motion.span
                animate={mobileOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.25 }}
                className="block w-5 h-0.5 bg-[#1a2332] rounded-full"
              />
            </button>
          </div>
        </div>

      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl md:hidden flex flex-col pt-24 pb-8 px-6"
            >
              {/* Nav links */}
              <nav className="flex flex-col gap-1 flex-1">
                {NAV_LINKS.map(({ to, label }, i) => (
                  <motion.div
                    key={to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                  >
                    <Link
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium transition-colors ${
                        isActive(to)
                          ? "bg-[#0d47a1]/10 text-[#0d47a1]"
                          : "text-[#1a2332] hover:bg-[#f5f7f9]"
                      }`}
                    >
                      {label}
                      {isActive(to) && (
                        <span className="mr-auto w-1.5 h-1.5 rounded-full bg-[#0d47a1]" />
                      )}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Auth buttons */}
              <div className="flex flex-col gap-3 border-t border-[#e1e6ec] pt-6 mt-4">
                {!loading && !user ? (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-center px-6 py-3 text-[#0d47a1] border border-[#0d47a1] rounded-xl font-medium hover:bg-[#f5f7f9] transition-colors"
                    >
                      כניסה
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-center px-6 py-3 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white rounded-xl font-medium"
                    >
                      הרשמה
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center px-6 py-3 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white rounded-xl font-medium"
                  >
                    {user?.user_metadata?.full_name || user?.email}
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
