import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  UserCheck,
  FileCheck2,
  Building2,
  CheckCircle2,
  Mail,
  Globe,
  Sun,
  Moon,
  Menu,
  X
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function About() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Playball&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  const C = isDark
    ? {
        bg: "#07130D",
        bgMid: "#0D1F17",
        bgCard: "rgba(255,255,255,0.03)",
        border: "rgba(255,255,255,0.08)",
        gold: "#C9963E",
        goldLight: "#E5C583",
        textPrimary: "#FFFFFF",
        textMuted: "rgba(255,255,255,0.68)",
        textFaint: "rgba(255,255,255,0.38)",
        navBg: "rgba(7,19,13,0.96)",
        btnBg: "#C9963E",
        btnText: "#07130D",
      }
    : {
        bg: "#F6F8F6",
        bgMid: "#FFFFFF",
        bgCard: "#FFFFFF",
        border: "rgba(7,19,13,0.08)",
        gold: "#344E41",
        goldLight: "#263B33",
        textPrimary: "#07130D",
        textMuted: "#405448",
        textFaint: "#73887D",
        navBg: "rgba(246,248,246,0.96)",
        btnBg: "#344E41",
        btnText: "#FFFFFF",
      };

  const navLinks = [
    { label: "Listings", path: "/#listings" },
    { label: "Services", path: "/#services" },
    { label: "About", path: "/about" },
    { label: "Blog", path: "/#blog" },
  ];

  const stats = [
    { label: "Verified Leases Signed", value: "4,800+" },
    { label: "Escrow Protection Rate", value: "100%" },
    { label: "Average Time to Lease", value: "48 Hrs" },
    { label: "Landlord Time Saved", value: "20+ Hrs/mo" },
  ];

  const handleAuthRedirect = (path) => {
    const isAuth =
      sessionStorage.getItem("isAuthenticated") === "true" ||
      !!localStorage.getItem("authToken");
    navigate(isAuth ? path : "/signup");
  };

  return (
    <div
      className="min-h-screen antialiased transition-colors duration-300 flex flex-col"
      style={{
        background: C.bg,
        fontFamily: "'Inter',system-ui,sans-serif",
        color: C.textPrimary,
      }}
    >
      <style>{`.lodale-h2{font-family:'Playfair Display',Georgia,serif;font-size:clamp(2.2rem,5vw,3.6rem);font-weight:700;line-height:1.1;letter-spacing:-0.01em;}`}</style>

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? C.navBg : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? `1px solid ${C.border}` : "none",
          boxShadow: scrolled
            ? isDark
              ? "0 4px 32px rgba(0,0,0,0.35)"
              : "0 4px 20px rgba(0,0,0,0.06)"
            : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8 flex items-center justify-between py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 outline-none cursor-pointer border-none bg-transparent"
          >
            <img
              src={isDark ? "/logowhite.png" : "/favicon.svg"}
              alt="Lodale Logo"
              className="h-8 w-auto object-contain"
            />
            <span
              className="text-[24px] font-normal tracking-tight"
              style={{
                fontFamily: "'Playball', cursive",
                color: isDark ? "#FFFFFF" : "#2C4633",
              }}
            >
              Lodale
            </span>
          </button>

          {/* Centered Desktop Nav Menu */}
          <nav className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((l) => {
              const isActive = l.path === "/about";
              return (
                <button
                  key={l.label}
                  onClick={() => navigate(l.path)}
                  className="text-[15.5px] font-semibold transition-all hover:opacity-100 cursor-pointer py-1.5 border-b-2"
                  style={{
                    color: isActive ? (isDark ? C.goldLight : C.gold) : C.textMuted,
                    background: "none",
                    borderColor: isActive ? (isDark ? C.goldLight : C.gold) : "transparent",
                  }}
                >
                  {l.label}
                </button>
              );
            })}
          </nav>

          {/* Right Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-[13.5px] font-semibold px-4 py-2 transition-colors hover:opacity-100 cursor-pointer"
              style={{
                color: C.textPrimary,
                background: "none",
                border: `1px solid ${C.border}`,
                borderRadius: "5px",
              }}
            >
              Log in
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="text-[13.5px] font-bold px-5 py-2.5 rounded-xl transition-all hover:brightness-110 active:scale-[0.97] cursor-pointer"
              style={{ background: C.btnBg, color: C.btnText, border: "none" }}
            >
              Sign Up
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg border cursor-pointer"
              style={{
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(7,19,13,0.05)",
                borderColor: C.border,
                color: C.textPrimary,
              }}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div
            className="md:hidden border-t"
            style={{
              background: C.navBg,
              backdropFilter: "blur(20px)",
              borderColor: C.border,
            }}
          >
            <div className="px-5 py-6 flex flex-col gap-4">
              {navLinks.map((l) => (
                <button
                  key={l.label}
                  onClick={() => {
                    navigate(l.path);
                    setMobileOpen(false);
                  }}
                  className="text-left text-lg font-medium py-2 border-none bg-transparent"
                  style={{ color: l.path === "/about" ? C.gold : C.textMuted }}
                >
                  {l.label}
                </button>
              ))}
              <div className="w-full h-px my-2" style={{ background: C.border }} />
              <button
                onClick={() => handleAuthRedirect("/login")}
                className="text-left text-lg font-medium py-2 border-none bg-transparent"
                style={{ color: C.textPrimary }}
              >
                Log in
              </button>
              <button
                onClick={() => handleAuthRedirect("/signup")}
                className="mt-2 py-3.5 rounded-xl text-center font-bold border-none"
                style={{ background: C.btnBg, color: C.btnText }}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── ABOUT CONTENT ─────────────────────────────────────────────────── */}
      <main className="flex-1 pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-5 lg:px-8 text-center space-y-8">
          <h1 className="lodale-h2">About Lodale</h1>
          <p className="text-lg md:text-xl font-medium leading-relaxed" style={{ color: C.textMuted }}>
            Lodale was founded to bring trust, transparency, and simplicity back into the real estate market. 
            We eliminate the middlemen, so landlords and tenants can connect directly with confidence.
          </p>

          <div className="text-left mt-12 space-y-6" style={{ color: C.textMuted }}>
            <p className="leading-relaxed">
              For too long, renting an apartment meant navigating a maze of hidden fees, unverified listings, and unreliable parties. 
              We built Lodale as a secure digital ecosystem where every user is verified via NIN, 
              payments are protected in escrow, and digital leases are legally binding.
            </p>
            <p className="leading-relaxed">
              Whether you are a landlord managing a multi-unit property or a tenant looking for your next home, 
              our suite of tools—from automated rent reminders to digital maintenance requests—ensures your experience is seamless.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {stats.map((s, i) => (
              <div key={i} className="p-6 rounded-2xl" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
                <div className="text-3xl font-black mb-2" style={{ color: isDark ? C.goldLight : C.gold }}>
                  {s.value}
                </div>
                <div className="text-[13px] font-semibold tracking-wider uppercase" style={{ color: C.textMuted }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="py-12 border-t" style={{ borderColor: C.border, background: C.bgMid }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src={isDark ? "/logowhite.png" : "/favicon.svg"} alt="Lodale Logo" className="h-6 w-auto object-contain" />
            <span className="text-lg" style={{ fontFamily: "'Playball', cursive", color: isDark ? "#FFF" : "#2C4633" }}>Lodale</span>
          </div>
          <p className="text-sm" style={{ color: C.textFaint }}>
            &copy; {new Date().getFullYear()} Lodale Technologies. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full cursor-pointer border-none bg-transparent" style={{ color: C.textMuted }}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
