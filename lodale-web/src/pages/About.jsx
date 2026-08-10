import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  UserCheck,
  FileCheck2,
  Building2,
  Users,
  Award,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  X,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Share2,
  Link2,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function About() {
  const navigate = useNavigate();

  // Try using ThemeContext, fallback to local state if missing
  let themeState;
  try {
    themeState = useTheme();
  } catch {
    const [theme, setTheme] = useState("dark");
    themeState = {
      theme,
      isDark: theme === "dark",
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    };
  }

  const { isDark, toggleTheme } = themeState;
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

  // Theme tokens matching LandingPage design system
  const C = isDark
    ? {
        bg: "#07130D",
        bgMid: "#0D1F17",
        bgCard: "rgba(255,255,255,0.03)",
        border: "rgba(255,255,255,0.08)",
        gold: "#C9963E",
        goldLight: "#E5C583",
        goldFaint: "rgba(201,150,62,0.14)",
        green: "#4A7C59",
        greenFaint: "rgba(74,124,89,0.14)",
        blue: "#5A8FAF",
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
        goldFaint: "rgba(52,78,65,0.12)",
        green: "#344E41",
        greenFaint: "rgba(52,78,65,0.08)",
        blue: "#1D4E6D",
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

  const pillars = [
    {
      Icon: UserCheck,
      title: "NIN Identity Verification",
      desc: "Every tenant and landlord verifies their identity with national database cross-checks before making or accepting offers.",
    },
    {
      Icon: ShieldCheck,
      title: "Mutual Track Record",
      desc: "Verified rental histories and mutual reviews visible to both sides before anyone signs or pays.",
    },
    {
      Icon: FileCheck2,
      title: "Escrow Deposit Protection",
      desc: "Security deposits held safely in regulated escrow accounts, eliminating deposit loss anxiety.",
    },
    {
      Icon: Building2,
      title: "Direct Landlord Connection",
      desc: "No middlemen markup fees, transparent lease agreements, and 100% digital paperwork.",
    },
  ];

  const stats = [
    { label: "Verified Leases Signed", value: "4,800+" },
    { label: "Escrow Protection Rate", value: "100%" },
    { label: "Average Time to Lease", value: "48 Hrs" },
    { label: "Landlord Time Saved", value: "20+ Hrs/mo" },
  ];

  const handleAuthRedirect = (path) => {
    const isAuth =
      localStorage.getItem("isAuthenticated") === "true" ||
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
            className="flex items-center gap-2.5 outline-none cursor-pointer"
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

          {/* Right Desktop CTAs (Log in, Sign Up) */}
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
              style={{ background: C.btnBg, color: C.btnText }}
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
                  className="text-sm font-medium text-left py-1 hover:opacity-100 transition-colors"
                  style={{
                    color: l.path === "/about" ? C.gold : C.textMuted,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {l.label}
                </button>
              ))}
              <div
                className="flex flex-col gap-3 pt-3 border-t"
                style={{ borderColor: C.border }}
              >
                <button
                  onClick={() => {
                    navigate("/login");
                    setMobileOpen(false);
                  }}
                  className="text-sm font-semibold py-2.5 px-4 text-center cursor-pointer transition-colors"
                  style={{
                    border: `1px solid ${C.border}`,
                    borderRadius: "5px",
                    color: C.textPrimary,
                    background: "none",
                  }}
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    navigate("/signup");
                    setMobileOpen(false);
                  }}
                  className="text-sm font-bold py-3 rounded-xl text-center cursor-pointer transition-all"
                  style={{ background: C.btnBg, color: C.btnText }}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ──────────────────────────────────────────────────── */}
      <section className="pt-40 pb-20 relative overflow-hidden" style={{ background: C.bgMid }}>
        <div
          className="absolute top-0 right-0 pointer-events-none opacity-30"
          style={{
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle, rgba(201,150,62,0.15) 0%, transparent 70%)",
            transform: "translate(20%,-20%)",
          }}
        />
        <div className="max-w-4xl mx-auto px-5 lg:px-8 text-center relative z-10">
          <h1
            className="lodale-h2 text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight"
            style={{ color: C.textPrimary }}
          >
            Renting Rewired. <br />
            <span style={{ color: C.gold }}>Complete Clarity.</span>
          </h1>

          <p
            className="text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto"
            style={{ color: C.textMuted }}
          >
            Nigeria's first property leasing platform engineered for trust, verified identity, and zero-risk deposit escrow.
          </p>
        </div>
      </section>

      {/* ── STORY & MISSION SECTION ───────────────────────────────────────── */}
      <section className="py-20" style={{ background: C.bg }}>
        <div className="max-w-4xl mx-auto px-5 lg:px-8 space-y-8">
          <div
            className="p-8 sm:p-12 rounded-3xl border transition-all"
            style={{
              background: isDark ? C.bgCard : "#FFFFFF",
              borderColor: C.border,
              boxShadow: isDark ? "none" : "0 10px 40px rgba(0,0,0,0.03)",
            }}
          >
            <h2
              className="text-2xl sm:text-3xl font-bold mb-6 tracking-tight"
              style={{
                fontFamily: "'Playfair Display',Georgia,serif",
                color: C.textPrimary,
              }}
            >
              The Problem We Solved
            </h2>
            <p
              className="text-base sm:text-lg leading-relaxed mb-6"
              style={{ color: C.textMuted }}
            >
              Renting in Nigeria runs on guesswork. Landlords have no real way to check a tenant before handing over keys. Tenants have no way to know if a landlord fixes things or returns deposits fairly, until it's too late to change their mind.
            </p>
            <p
              className="text-base sm:text-lg leading-relaxed mb-6"
              style={{ color: C.textMuted }}
            >
              Lodale does everything the property apps you already know do — rent tracking, maintenance requests, digital leases — plus the one thing they don't: a mutual, verified track record, visible to both sides before anyone commits.
            </p>
            <p
              className="text-base sm:text-lg leading-relaxed"
              style={{ color: C.textMuted }}
            >
              Every user verifies their identity with their NIN. Every completed lease produces a rating. No agency required to list a property, and no guessing required to trust the person on the other side of the lease.
            </p>
          </div>
        </div>
      </section>

      {/* ── CORE PILLARS GRID ─────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: C.bgMid }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="lodale-h2 text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: C.textPrimary }}
            >
              Why Thousands Choose <span style={{ color: C.gold }}>Lodale</span>
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: C.textMuted }}>
              Four non-negotiable standards built into every lease contract.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="p-8 rounded-2xl border transition-all hover:-translate-y-1"
                style={{
                  background: isDark ? C.bgCard : "#FFFFFF",
                  borderColor: C.border,
                  boxShadow: isDark ? "none" : "0 4px 20px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: C.goldFaint, color: C.gold }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3
                  className="text-lg font-bold mb-3"
                  style={{ color: C.textPrimary }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS SECTION ─────────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: C.bg }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 p-10 rounded-3xl border text-center"
            style={{
              background: isDark ? C.bgCard : "#FFFFFF",
              borderColor: C.border,
            }}
          >
            {stats.map(({ label, value }) => (
              <div key={label}>
                <div
                  className="text-3xl sm:text-4xl font-black mb-2"
                  style={{
                    fontFamily: "'Playfair Display',Georgia,serif",
                    color: C.gold,
                  }}
                >
                  {value}
                </div>
                <div className="text-xs sm:text-sm font-medium" style={{ color: C.textMuted }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: C.bgMid }}>
        <div className="max-w-4xl mx-auto px-5 lg:px-8 text-center">
          <h2
            className="lodale-h2 text-3xl sm:text-4xl font-bold mb-6"
            style={{ color: C.textPrimary }}
          >
            Ready to Experience <span style={{ color: C.gold }}>Modern Leasing?</span>
          </h2>
          <p className="text-base mb-8 max-w-xl mx-auto" style={{ color: C.textMuted }}>
            Join thousands of verified tenants and landlords using Lodale across Nigeria today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleAuthRedirect("/explore")}
              className="px-8 py-4 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-[0.97] cursor-pointer"
              style={{ background: C.btnBg, color: C.btnText }}
            >
              Browse Listings
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-4 rounded-xl font-bold text-sm transition-all cursor-pointer border"
              style={{
                borderColor: C.border,
                color: C.textPrimary,
                background: "none",
              }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer
        className="pt-16 pb-8 text-white mt-auto"
        style={{
          background: isDark ? "#000000" : "#0A1710",
          borderTop: `1px solid ${isDark ? C.border : "rgba(255,255,255,0.1)"}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            <div className="lg:col-span-2">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2.5 mb-5 outline-none cursor-pointer"
              >
                <img
                  src="/logowhite.png"
                  alt="Lodale Logo"
                  className="h-8 w-auto object-contain"
                />
                <span
                  className="text-[24px] font-normal tracking-tight"
                  style={{
                    fontFamily: "'Playball', cursive",
                    color: "#FFFFFF",
                  }}
                >
                  Lodale
                </span>
              </button>
              <p
                className="text-sm leading-relaxed mb-6 max-w-xs"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Nigeria's most trusted property leasing platform. Connecting verified landlords with quality tenants.
              </p>
              {[
                { Icon: MapPin, t: "Plot 14B, Admiralty Way, Lekki Phase 1, Lagos" },
                { Icon: Mail, t: "hello@lodale.ng" },
                { Icon: Phone, t: "+234 (0) 812 345 6789" },
              ].map(({ Icon, t }) => (
                <div
                  key={t}
                  className="flex items-start gap-2.5 text-sm mb-2.5"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  <Icon
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: isDark ? C.gold : "#ebedec" }}
                  />
                  {t}
                </div>
              ))}
            </div>

            <div>
              <h4
                className="text-[11px] font-bold uppercase tracking-[0.12em] mb-4"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                Platform
              </h4>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => handleAuthRedirect("/explore")}
                    className="text-sm transition-colors text-white/50 hover:text-white cursor-pointer bg-none border-none"
                  >
                    Browse Listings
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/#services")}
                    className="text-sm transition-colors text-white/50 hover:text-white cursor-pointer bg-none border-none"
                  >
                    Services
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4
                className="text-[11px] font-bold uppercase tracking-[0.12em] mb-4"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                Company
              </h4>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => navigate("/about")}
                    className="text-sm transition-colors text-white hover:text-white cursor-pointer bg-none border-none"
                  >
                    About Lodale
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/#listings")}
                    className="text-sm transition-colors text-white/50 hover:text-white cursor-pointer bg-none border-none"
                  >
                    How It Works
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4
                className="text-[11px] font-bold uppercase tracking-[0.12em] mb-4"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                Legal
              </h4>
              <ul className="space-y-3 text-sm text-white/50">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Fair Housing Notice</li>
              </ul>
            </div>
          </div>

          <div
            className="flex flex-col sm:flex-row items-center justify-between pt-7 gap-3"
            style={{ borderTop: `1px solid ${C.border}` }}
          >
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
              © 2026 Lodale Technologies Ltd. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
              🇳🇬 Proudly built in Nigeria, for Nigeria.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Theme Toggle (Bottom Right Corner with 50% opacity until hover) */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full border shadow-2xl backdrop-blur-md opacity-50 hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-110"
        style={{
          background: isDark ? "rgba(13, 31, 23, 0.85)" : "rgba(255, 255, 255, 0.85)",
          borderColor: isDark ? "rgba(201, 150, 62, 0.4)" : "rgba(52, 78, 65, 0.3)",
          color: C.textPrimary,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-emerald-800" />
        )}
      </button>
    </div>
  );
}
