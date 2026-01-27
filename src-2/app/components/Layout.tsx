import { Outlet } from "react-router";
import { Navigation } from "@/app/components/Navigation";
import { Footer } from "@/app/components/Footer";
import { useEffect } from "react";

export function Layout() {
  useEffect(() => {
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = "smooth";

    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <div className="min-h-screen bg-white" dir="rtl" style={{ fontFamily: "Heebo, sans-serif" }}>
      <Navigation />
      <Outlet />
      <Footer />
    </div>
  );
}
