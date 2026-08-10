/**
 * LandingPage.jsx — Lodale Property Leasing Platform
 * Inspired by findrealestate.com — dual Light & Dark mode support
 * Design system: Forest Green + Gold/Amber accents
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search, MapPin, Home, ChevronDown, Star, ChevronLeft, ChevronRight,
  ArrowRight, Building2, Users, Calendar, FileText, Shield, Zap,
  TrendingUp, Mail, Phone, Globe, Share2, Link2,
  Menu, X, BadgeCheck, Key, Clock, BarChart3, BookOpen, CheckCircle2,
  MessageSquare, DollarSign, Sun, Moon
} from "lucide-react";
import heroBg from "../assets/lodale_hero.png";
import { useTheme } from "../context/ThemeContext";

/* ─── Static Data ────────────────────────────────────────────────────────── */
const PROPERTY_TYPES = ["Apartment", "Studio", "Duplex", "Bungalow", "Commercial"];
const PRICE_RANGES  = ["Under ₦500k/yr","₦500k – ₦1M/yr","₦1M – ₦2M/yr","₦2M – ₦5M/yr","₦5M+/yr"];
const POPULAR = ["Apartments in Lekki","Duplex in Abuja","Studio in Yaba","House in Port Harcourt"];

const TESTIMONIALS = [
  { id:1, name:"Amara Okafor",    role:"Tenant",           location:"Lekki, Lagos",         rating:5, initials:"AO", color:"#2D6A4F", text:"Lodale completely changed how I found my apartment. The digital lease signing took 10 minutes, and the escrow system meant I never worried about losing my deposit." },
  { id:2, name:"Chidi Eze",       role:"Landlord",         location:"Victoria Island, Lagos",rating:5, initials:"CE", color:"#C9963E", text:"As a landlord with 6 properties, Lodale's automated rent collection and tenant screening have saved me 20+ hours a month. It genuinely pays for itself." },
  { id:3, name:"Ngozi Adichie",   role:"Tenant",           location:"Ikeja, Lagos",          rating:5, initials:"NA", color:"#2B5F7E", text:"Zero hidden fees. What you see is exactly what you pay. After years of landlord surprises, Lodale's total transparency is genuinely refreshing." },
  { id:4, name:"Emeka Williams",  role:"Property Manager", location:"Wuse II, Abuja",        rating:5, initials:"EW", color:"#8B5A9F", text:"Managing 12 units across Abuja used to be a nightmare. Now leases, maintenance, and payments all live in one dashboard. This is the future." },
];

const BLOG = [
  { id:1, tag:"Market Report", tagColor:"#C9963E", gA:"#1A2E20", gB:"#2D4A32", date:"Aug 5, 2026",  read:"6 min", title:"Rental Market Trends 2026: What Tenants and Landlords Need to Know", excerpt:"Lagos rental prices have risen 18% in prime districts this year. Here's how to navigate the market whether you're searching or listing." },
  { id:2, tag:"Legal Guide",   tagColor:"#2D6A4F", gA:"#1A1A2E", gB:"#2A2A4A", date:"Jul 28, 2026", read:"9 min", title:"Landlord Rights & Tenant Checklist: Nigeria 2026 Edition",            excerpt:"A comprehensive breakdown of tenant rights under the Tenancy Law of Lagos State, deposit regulations, and legal eviction procedures." },
  { id:3, tag:"Spotlight",     tagColor:"#2B5F7E", gA:"#1A2A2E", gB:"#2A3A4A", date:"Jul 15, 2026", read:"5 min", title:"What ₦4,000,000/Year Rent Gets You Across Lagos",                      excerpt:"From Ajah to Ikoyi — we break down exactly what the same budget gets you in 6 different parts of Nigeria's commercial capital." },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function Pill({ color, borderColor, children }) {
  return (
    <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.12em]"
      style={{ background:`${color}18`, border:`1px solid ${borderColor || `${color}35`}`, color }}>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════════════════════════════════ */
function Navbar({ C, isDark, toggleTheme }) {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (location.pathname === "/about") {
      setActiveSection("about");
      return;
    }

    const handleScroll = () => {
      const sections = ["listings", "services", "blog"];
      const scrollPos = window.scrollY + 250;
      for (const sec of sections) {
        const el = document.getElementById(sec);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sec);
            return;
          }
        }
      }
      if (window.scrollY < 400) {
        setActiveSection("listings");
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const scrollTo = (id) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const navLinks = [
    { label:"Listings", id:"listings" },
    { label:"Services", id:"services" },
    { label:"About",    path:"/about" },
    { label:"Blog",     id:"blog"     },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? C.navBg : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "none",
        boxShadow: scrolled ? (isDark ? "0 4px 32px rgba(0,0,0,0.35)" : "0 4px 20px rgba(0,0,0,0.06)") : "none"
      }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 flex items-center justify-between py-4">

        {/* Logo */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 outline-none cursor-pointer">
          <img src={isDark ? "/logowhite.png" : "/favicon.svg"} alt="Lodale Logo" className="h-8 w-auto object-contain" />
          <span className="text-[24px] font-normal tracking-tight"
            style={{ fontFamily: "'Playball', cursive", color: isDark ? "#FFFFFF" : "#2C4633" }}>Lodale</span>
        </button>

        {/* Centered Desktop Nav Menu */}
        <nav className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
          {navLinks.map(l => {
            const isActive = l.path ? location.pathname === l.path : activeSection === l.id;
            return (
              <button key={l.label}
                onClick={() => l.path ? navigate(l.path) : scrollTo(l.id)}
                className="text-[15.5px] font-semibold transition-all hover:opacity-100 cursor-pointer py-1.5 border-b-2"
                style={{
                  color: isActive ? (isDark ? C.goldLight : C.gold) : C.textMuted,
                  background: "none",
                  borderColor: isActive ? (isDark ? C.goldLight : C.gold) : "transparent",
                }}>
                {l.label}
              </button>
            );
          })}
        </nav>

        {/* Right-aligned Desktop CTAs (Log in, Sign Up) */}
        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => navigate("/login")}
            className="text-[13.5px] font-semibold px-4 py-2 transition-colors hover:opacity-100 cursor-pointer"
            style={{ color:C.textPrimary, background:"none", border:`1px solid ${C.border}`, borderRadius:"5px" }}>
            Log in
          </button>
          <button onClick={() => navigate("/signup")}
            className="text-[13.5px] font-bold px-5 py-2.5 rounded-xl transition-all hover:brightness-110 active:scale-[0.97] cursor-pointer"
            style={{ background:C.btnBg, color:C.btnText }}>
            Sign Up
          </button>
        </div>

        {/* Hamburger Mobile Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg border cursor-pointer"
            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(7,19,13,0.05)", borderColor: C.border, color: C.textPrimary }}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="md:hidden border-t"
          style={{ background: C.navBg, backdropFilter:"blur(20px)", borderColor:C.border }}>
          <div className="px-5 py-6 flex flex-col gap-4">
            {navLinks.map(l => (
              <button key={l.label}
                onClick={() => l.path ? (navigate(l.path), setMobileOpen(false)) : scrollTo(l.id)}
                className="text-sm font-medium text-left py-1 hover:opacity-100 transition-colors"
                style={{ color:C.textMuted, background:"none", border:"none", cursor:"pointer" }}>
                {l.label}
              </button>
            ))}
            <div className="flex flex-col gap-3 pt-3 border-t" style={{ borderColor:C.border }}>
              <button onClick={() => { navigate("/login"); setMobileOpen(false); }}
                className="text-sm font-semibold py-2.5 px-4 text-center cursor-pointer transition-colors"
                style={{ borderColor:C.border, border:`1px solid ${C.border}`, borderRadius:"5px", color:C.textPrimary, background:"none" }}>
                Log in
              </button>
              <button onClick={() => { navigate("/signup"); setMobileOpen(false); }}
                className="text-sm font-bold py-3 rounded-xl text-center cursor-pointer transition-all"
                style={{ background:C.btnBg, color:C.btnText }}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════════════════════ */
function HeroSection({ C, isDark }) {
  const [loc, setLoc]   = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");
  const navigate = useNavigate();

  const onSearch = (e) => {
    e.preventDefault();
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true" || !!localStorage.getItem("authToken");
    if (!isAuthenticated) {
      navigate("/signup");
      return;
    }
    const p = new URLSearchParams();
    if (loc)   p.set("q",     loc);
    if (type)  p.set("type",  type);
    if (price) p.set("price", price);
    navigate(`/explore?${p.toString()}`);
  };

  const fieldBorder = { borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(7,19,13,0.12)" };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" id="hero">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage:`url(${heroBg})` }} />
      <div className="absolute inset-0 transition-colors duration-300" style={{ background: C.heroOverlay }} />
      <div className="absolute top-0 right-0 pointer-events-none"
        style={{
          width:700, height:700,
          background: isDark
            ? "radial-gradient(circle,rgba(201,150,62,0.11) 0%,transparent 70%)"
            : "radial-gradient(circle,rgba(184,130,40,0.14) 0%,transparent 70%)",
          transform:"translate(22%,-30%)"
        }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: isDark
            ? `linear-gradient(rgba(255,255,255,0.024) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.024) 1px,transparent 1px)`
            : `linear-gradient(rgba(7,19,13,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(7,19,13,0.03) 1px,transparent 1px)`,
          backgroundSize:"72px 72px"
        }} />

      <div className="relative z-10 max-w-6xl mx-auto px-5 lg:px-8 pt-36 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-8 uppercase tracking-[0.12em]"
          style={{ background:C.goldFaint, border:`1px solid ${C.gold}45`, color: isDark ? C.goldLight : C.gold }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:C.gold }} />
          Nigeria's Most Trusted Leasing Platform
        </div>

        <h1 className="font-bold leading-[1.06] tracking-tight mb-6"
          style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:"clamp(2.8rem,7vw,5.5rem)", color: C.textPrimary }}>
          Find Your Next Lease
          <br />
          <span style={{ color:C.gold }}>with Complete</span>
          <br />
          Clarity.
        </h1>

        <p className="max-w-2xl mx-auto mb-12 leading-relaxed"
          style={{ color: C.textMuted, fontSize:"clamp(1rem,2vw,1.2rem)" }}>
          Seamless property leasing, verified listings, and transparent management for landlords and tenants across Nigeria.
        </p>

        <form onSubmit={onSearch} className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-2xl transition-all duration-300"
            style={{
              background: C.fieldBg,
              border: `1px solid ${C.fieldBorder}`,
              backdropFilter: "blur(20px)"
            }}>

            <div className="flex items-center gap-3 flex-1 px-5 py-4 md:border-r" style={fieldBorder}>
              <MapPin className="w-5 h-5 shrink-0" style={{ color:C.gold }} />
              <input type="text" placeholder="City, State or Neighbourhood" value={loc}
                onChange={e => setLoc(e.target.value)}
                className="bg-transparent text-sm font-medium w-full outline-none"
                style={{ color: C.textPrimary }} />
            </div>

            <div className="flex items-center gap-3 px-5 py-4 md:border-r md:w-52" style={fieldBorder}>
              <Home className="w-5 h-5 shrink-0" style={{ color:C.gold }} />
              <select value={type} onChange={e => setType(e.target.value)}
                className="bg-transparent text-sm font-medium w-full outline-none appearance-none cursor-pointer"
                style={{ color: type ? C.textPrimary : C.textFaint }}>
                <option value="" disabled style={{ background: C.selectOptionBg, color: C.textPrimary }}>Property Type</option>
                {PROPERTY_TYPES.map(t => (
                  <option key={t} value={t} style={{ background: C.selectOptionBg, color: C.textPrimary }}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 px-5 py-4 md:border-r md:w-56" style={fieldBorder}>
              <span className="w-5 h-5 shrink-0 flex items-center justify-center font-bold text-lg leading-none select-none" style={{ color:C.gold }}>₦</span>
              <select value={price} onChange={e => setPrice(e.target.value)}
                className="bg-transparent text-sm font-medium w-full outline-none appearance-none cursor-pointer"
                style={{ color: price ? C.textPrimary : C.textFaint }}>
                <option value="" disabled style={{ background: C.selectOptionBg, color: C.textPrimary }}>Price Range</option>
                {PRICE_RANGES.map(p => (
                  <option key={p} value={p} style={{ background: C.selectOptionBg, color: C.textPrimary }}>{p}</option>
                ))}
              </select>
            </div>

            <button type="submit"
              className="flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-bold transition-all hover:brightness-110 active:scale-[0.98] shrink-0"
              style={{ background:C.btnBg, color:C.btnText, cursor:"pointer" }}>
              <Search className="w-4 h-4" />
              Search Listings
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <span className="text-xs" style={{ color: C.textFaint }}>Popular:</span>
          {POPULAR.map(t => (
            <button key={t} onClick={() => navigate(`/explore?q=${encodeURIComponent(t)}`)}
              className="text-xs px-3.5 py-1.5 rounded-full transition-all"
              style={{
                background: isDark ? "rgba(255,255,255,0.055)" : "rgba(7,19,13,0.05)",
                border: `1px solid ${C.border}`,
                color: C.textMuted,
                cursor:"pointer"
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce">
        <div className="w-px h-10 bg-gradient-to-b from-transparent to-current opacity-30" style={{ color: C.textPrimary }} />
        <ChevronDown className="w-4 h-4 opacity-40" style={{ color: C.textPrimary }} />
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   HOW IT WORKS
══════════════════════════════════════════════════════════════════════════════ */
function HowItWorksSection({ C, isDark }) {
  const steps = [
    { num:"01", Icon:Search,   title:"Search & Filter",   desc:"Browse thousands of verified rental listings tailored to your exact budget, location, and lifestyle preferences.",    bullets:["AI-powered matching","Real-time availability","Verified listings only"] },
    { num:"02", Icon:Calendar, title:"Schedule & View",    desc:"Connect directly with property managers and book instant virtual or in-person viewings at your convenience.",          bullets:["Same-day bookings","Video walkthroughs","Secure in-app messaging"] },
    { num:"03", Icon:FileText, title:"Sign & Move In",     desc:"Seamless digital paperwork, secure deposit escrow, and instant lease signing — all from your device.",               bullets:["Digital lease signing","Escrow deposit protection","Move-in within 48 hours"] },
  ];

  return (
    <section id="listings" className="py-24 lg:py-36 transition-colors duration-300"
      style={{ background: "linear-gradient(135deg, rgb(26, 58, 37) 0%, rgb(15, 42, 28) 100%)" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center mb-16 lg:mb-24">
          <Pill color="#FFFFFF" borderColor="#FFFFFF">How It Works</Pill>
          <h2 className="lodale-h2 mt-4 mb-4" style={{ color: "#dda544" }}>
            Leasing Rewired.
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "#FFFFFF" }}>
            Three simple steps separating you from your next home. No middlemen, no surprises.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7">
          {steps.map(s => <StepCard key={s.num} {...s} C={C} isDark={isDark} />)}
        </div>
      </div>
    </section>
  );
}

function StepCard({ num, Icon, title, desc, bullets, C, isDark }) {
  const [h, setH] = useState(false);
  return (
    <div className="relative p-8 rounded-2xl flex flex-col gap-5 transition-all duration-300"
      style={{
        background: isDark ? (h ? "rgba(255,255,255,0.05)" : C.bgCard) : "#FFFFFF",
        border: `1px solid ${h ? `${C.gold}55` : C.border}`,
        transform: h ? "translateY(-4px)" : "none",
        boxShadow: isDark ? "none" : (h ? "0 14px 36px rgba(0,0,0,0.07)" : "0 2px 10px rgba(0,0,0,0.03)")
      }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      <span className="absolute top-5 right-6 text-7xl font-black leading-none select-none pointer-events-none"
        style={{ color: isDark ? "#ebedec" : "#344e41", fontFamily:"'Playfair Display',Georgia,serif" }}>{num}</span>
      <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center" style={{ background: isDark ? C.goldFaint : "#e9ecea", color: isDark ? C.gold : "#344E41" }}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-bold mb-2" style={{ color: C.textPrimary }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color:C.textMuted }}>{desc}</p>
      </div>
      <ul className="space-y-2 mt-auto">
        {bullets.map(b => (
          <li key={b} className="flex items-center gap-2 text-xs" style={{ color: C.textMuted }}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color:C.green }} />{b}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SERVICES
══════════════════════════════════════════════════════════════════════════════ */
function ServicesSection({ C, isDark }) {
  const navigate = useNavigate();

  const handleAuthExplore = () => {
    const isAuth = localStorage.getItem("isAuthenticated") === "true" || !!localStorage.getItem("authToken");
    navigate(isAuth ? "/explore" : "/signup");
  };

  const services = [
    { id:"tenants",  Icon:Key,       tagLabel:"For Tenants",    accent:C.green, title:"Rent Smarter.\nLive Better.",         desc:"Access curated, verified properties with zero hidden fees, instant application processing, and deposit escrow protection built into every lease.",         features:[{Icon:BadgeCheck,t:"Instant lease applications"},{Icon:Shield,t:"Deposit escrow protection"},{Icon:Zap,t:"Zero hidden fees — ever"},{Icon:Clock,t:"Move-in within 48 hours"}],    cta:"Browse Listings",      onClick:handleAuthExplore },
    { id:"landlords",Icon:Building2, tagLabel:"For Landlords",  accent:C.gold,  title:"Manage Properties.\nNot Headaches.", desc:"Automate rent collection, screen tenants with AI-powered verification, and manage your entire portfolio from a single, powerful dashboard.",               features:[{Icon:TrendingUp,t:"Automated rent collection"},{Icon:Users,t:"AI-powered tenant screening"},{Icon:BarChart3,t:"Real-time portfolio analytics"},{Icon:MessageSquare,t:"Maintenance tracking"}], cta:"Sign Up",            onClick:() => navigate("/signup") },
    { id:"flexible", Icon:Calendar,  tagLabel:"Flexible Terms", accent:C.blue,  title:"Short-Term.\nLong-Term. Your Term.", desc:"Whether you need a place for 3 months or 3 years, Lodale offers lease structures tailored to your lifestyle and business needs.",                         features:[{Icon:CheckCircle2,t:"Monthly rolling leases"},{Icon:CheckCircle2,t:"Annual lease discounts"},{Icon:CheckCircle2,t:"Corporate let packages"},{Icon:CheckCircle2,t:"Furnished & unfurnished"}],    cta:"Explore Options",      onClick:handleAuthExplore },
  ];

  return (
    <section id="services" className="py-24 lg:py-36 transition-colors duration-300" style={{ background:C.bg }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center mb-16" id="landlords">
          <Pill color={C.green}>Services</Pill>
          <h2 className="lodale-h2 mt-4 mb-4" style={{ color: C.textPrimary }}>
            Everything Leasing.<br /><span style={{ color:C.gold }}>One Platform.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7">
          {services.map(s => <ServiceCard key={s.id} {...s} C={C} isDark={isDark} />)}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ Icon, tagLabel, accent, title, desc, features, cta, onClick, C, isDark }) {
  const [h, setH] = useState(false);
  return (
    <div className="flex flex-col p-8 rounded-2xl transition-all duration-300"
      style={{
        background: isDark ? (h ? "rgba(255,255,255,0.05)" : C.bgCard) : "#FFFFFF",
        border: `1px solid ${h ? `${accent}55` : C.border}`,
        transform: h ? "translateY(-3px)" : "none",
        boxShadow: isDark ? "none" : (h ? "0 14px 36px rgba(0,0,0,0.07)" : "0 2px 10px rgba(0,0,0,0.03)")
      }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      <div className="self-start px-3 py-1 rounded-full text-xs font-bold mb-6 uppercase tracking-wider"
        style={{ background:`${accent}18`, color:accent, border:`1px solid ${accent}30` }}>{tagLabel}</div>
      <div className="mb-5" style={{ color:accent }}><Icon className="w-9 h-9" /></div>
      <h3 className="text-xl font-bold mb-3 whitespace-pre-line" style={{ color: C.textPrimary }}>{title}</h3>
      <p className="text-sm leading-relaxed mb-7" style={{ color:C.textMuted }}>{desc}</p>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map(({ Icon:FI, t }) => (
          <li key={t} className="flex items-center gap-2.5 text-sm" style={{ color: C.textMuted }}>
            <span style={{ color:accent }}><FI className="w-4 h-4 shrink-0" /></span>{t}
          </li>
        ))}
      </ul>
      <button onClick={onClick}
        className="flex items-center gap-2 text-sm font-bold mt-auto group transition-colors"
        style={{ color:accent, background:"none", border:"none", cursor:"pointer" }}>
        {cta}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════════════════════════════════════════ */
function TestimonialsSection({ C, isDark }) {
  const [active, setActive] = useState(0);
  const timer = useRef(null);

  const go = useCallback((next) => {
    clearInterval(timer.current);
    setActive(next);
    timer.current = setInterval(() => setActive(p => (p+1) % TESTIMONIALS.length), 4800);
  }, []);

  useEffect(() => {
    timer.current = setInterval(() => setActive(p => (p+1) % TESTIMONIALS.length), 4800);
    return () => clearInterval(timer.current);
  }, []);

  const t = TESTIMONIALS[active];

  return (
    <section className="py-24 lg:py-36 overflow-hidden transition-colors duration-300" style={{ background:C.bgMid }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center mb-16">
          <Pill color={C.gold}>What People Are Saying</Pill>
          <h2 className="lodale-h2 mt-4" style={{ color: C.textPrimary }}>
            Trusted by <span style={{ color:C.gold }}>Thousands</span><br />Across Nigeria.
          </h2>
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div key={active} className="p-10 rounded-2xl relative overflow-hidden transition-all"
            style={{
              background: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
              border: isDark ? `1px solid ${C.border}` : `1.6px solid ${C.border}`,
              animation: "fadeSlide 0.4s ease",
              boxShadow: isDark ? "none" : "0 10px 30px rgba(0,0,0,0.04)"
            }}>
            <span className="absolute top-4 right-7 text-9xl font-black leading-none select-none pointer-events-none"
              style={{ color: isDark ? "rgba(201,150,62,0.06)" : "rgba(184,130,40,0.08)", fontFamily:"'Playfair Display',Georgia,serif" }}>"</span>
            <div className="flex gap-1 mb-6">
              {Array.from({length:t.rating}).map((_,i) => <Star key={i} className="w-4 h-4 fill-current" style={{ color:C.gold }} />)}
            </div>
            <p className="text-lg sm:text-xl leading-relaxed mb-8 font-medium" style={{ color: C.textPrimary }}>"{t.text}"</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background:t.color, color:"white" }}>{t.initials}</div>
              <div>
                <div className="font-bold" style={{ color: C.textPrimary }}>{t.name}</div>
                <div className="text-sm" style={{ color:C.textFaint }}>{t.role} · {t.location}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-7">
            <div className="flex gap-2">
              {TESTIMONIALS.map((_,i) => (
                <button key={i} onClick={() => go(i)} className="rounded-full transition-all duration-300"
                  style={{ width:i===active?"28px":"8px", height:"8px", background:i===active?C.gold : (isDark ? "rgba(255,255,255,0.18)" : "rgba(7,19,13,0.18)"), cursor:"pointer" }} />
              ))}
            </div>
            <div className="flex gap-2">
              {[
                { fn:() => go((active-1+TESTIMONIALS.length)%TESTIMONIALS.length), icon:<ChevronLeft className="w-4 h-4" />, primary:false },
                { fn:() => go((active+1)%TESTIMONIALS.length),                       icon:<ChevronRight className="w-4 h-4"/>, primary:true  },
              ].map(({ fn, icon, primary }, i) => (
                <button key={i} onClick={fn}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: primary ? C.goldFaint : (isDark ? "rgba(255,255,255,0.06)" : "rgba(7,19,13,0.05)"),
                    border: `1px solid ${primary ? `${C.gold}45` : C.border}`,
                    color: primary ? C.gold : C.textPrimary,
                    cursor: "pointer"
                  }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   BLOG
══════════════════════════════════════════════════════════════════════════════ */
function BlogSection({ C, isDark }) {
  return (
    <section id="blog" className="py-24 lg:py-36 transition-colors duration-300" style={{ background:C.bg }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <Pill color={C.green}><BookOpen className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Leasing Resources</Pill>
            <h2 className="lodale-h2 mt-4" style={{ color: C.textPrimary }}>
              Market Reports &amp;<br /><span style={{ color:C.gold }}>Expert Insights.</span>
            </h2>
          </div>
          <a href="#" className="flex items-center gap-1.5 text-sm font-bold shrink-0 mb-1 group transition-colors hover:brightness-125"
            style={{ color:C.gold }}>
            View All Articles <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7">
          {BLOG.map(p => <BlogCard key={p.id} {...p} C={C} isDark={isDark} />)}
        </div>
      </div>
    </section>
  );
}

function BlogCard({ tag, tagColor, gA, gB, date, read, title, excerpt, C, isDark }) {
  const [h, setH] = useState(false);
  return (
    <article className="flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
      style={{
        background: isDark ? (h ? "rgba(255,255,255,0.05)" : C.bgCard) : "#FFFFFF",
        border: `1px solid ${h ? `${C.gold}45` : C.border}`,
        transform: h ? "translateY(-4px)" : "none",
        boxShadow: isDark ? "none" : (h ? "0 14px 36px rgba(0,0,0,0.07)" : "0 2px 10px rgba(0,0,0,0.03)")
      }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      <div className="h-44 relative flex items-end p-5" style={{ background:`linear-gradient(135deg,${gA},${gB})` }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage:`linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)`, backgroundSize:"32px 32px" }} />
        <span className="relative z-10 px-2.5 py-1 rounded-md text-xs font-bold" style={{ background:tagColor, color:"white" }}>{tag}</span>
      </div>
      <div className="flex flex-col flex-1 p-6">
        <div className="flex items-center gap-2.5 mb-4 text-xs" style={{ color:C.textFaint }}>
          <span>{date}</span><span>·</span><span>{read} read</span>
        </div>
        <h3 className="text-[15px] font-bold mb-3 leading-snug transition-colors duration-200"
          style={{ color: h ? C.gold : C.textPrimary }}>{title}</h3>
        <p className="text-xs leading-relaxed flex-1 mb-5" style={{ color:C.textMuted }}>{excerpt}</p>
        <div className="flex items-center gap-2 text-xs font-bold group" style={{ color:C.gold }}>
          Read More <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </article>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CTA + NEWSLETTER
══════════════════════════════════════════════════════════════════════════════ */
function CTASection({ C, isDark }) {
  const [email, setEmail]       = useState("");
  const [subbed, setSubbed]     = useState(false);
  const navigate = useNavigate();

  const onSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) { setSubbed(true); setEmail(""); }
  };

  return (
    <section className="py-24 lg:py-36 transition-colors duration-300"
      style={{ background: isDark ? `linear-gradient(180deg,${C.bg} 0%,${C.bgMid} 100%)` : `linear-gradient(180deg,#F4F6F4 0%,#FFFFFF 100%)` }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 space-y-12">

        <div className="relative overflow-hidden rounded-3xl px-8 py-16 sm:px-16 sm:py-20 text-center"
          style={{ background:"linear-gradient(135deg,#1A3A25 0%,#0F2A1C 100%)", border:"1px solid rgba(201,150,62,0.25)" }}>
          <div className="absolute top-0 right-0 pointer-events-none" style={{ width:500,height:500, background:"radial-gradient(circle,rgba(201,150,62,0.15) 0%,transparent 70%)", transform:"translate(25%,-40%)" }} />
          <div className="absolute bottom-0 left-0 pointer-events-none" style={{ width:400,height:400, background:"radial-gradient(circle,rgba(74,124,89,0.12) 0%,transparent 70%)", transform:"translate(-30%,40%)" }} />
          <div className="relative z-10">
            <h2 className="lodale-h2 text-white mb-5">
              Ready to Find Your<br /><span style={{ color: "#dda544" }}>Next Home?</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto mb-10" style={{ color:"rgba(255,255,255,0.7)" }}>
              Experience transparent property leasing and management built for Nigeria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => {
                const isAuth = localStorage.getItem("isAuthenticated") === "true" || !!localStorage.getItem("authToken");
                navigate(isAuth ? "/explore" : "/signup");
              }}
                className="px-8 py-4 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-[0.97]"
                style={{ background: isDark ? "#C9963E" : "#344E41", color: isDark ? "#07130D" : "#FFFFFF", cursor:"pointer" }}>
                Browse Listings
              </button>
              <button onClick={() => navigate("/signup")}
                className="px-8 py-4 rounded-xl font-bold text-sm transition-all"
                style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", color:"white", cursor:"pointer" }}>
                Sign Up
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto text-center p-8 sm:p-10 rounded-2xl"
          style={{
            background: isDark ? C.bgCard : "#FFFFFF",
            border: isDark ? `1px solid ${C.border}` : `1.6px solid ${C.border}`,
            boxShadow: isDark ? "none" : "0 4px 20px rgba(0,0,0,0.03)"
          }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
            style={{ background:C.goldFaint, color:C.gold }}>
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: C.textPrimary }}>Get Personalised Rental Alerts</h3>
          <p className="text-sm mb-7" style={{ color:C.textMuted }}>Be first to know when new listings match your criteria. No spam, ever.</p>

          {subbed ? (
            <div className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold"
              style={{ background:C.greenFaint, color:C.green }}>
              <CheckCircle2 className="w-4 h-4" />Subscribed! We'll send you tailored alerts.
            </div>
          ) : (
            <form onSubmit={onSubscribe} className="flex gap-3">
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required
                className="flex-1 px-4 py-3.5 rounded-xl text-sm placeholder:opacity-50 outline-none transition-colors"
                style={{
                  background: isDark ? "rgba(255,255,255,0.07)" : "rgba(7,19,13,0.04)",
                  border: `1px solid ${C.border}`,
                  color: C.textPrimary
                }} />
              <button type="submit"
                className="px-6 py-3.5 rounded-xl text-sm font-bold shrink-0 transition-all hover:brightness-110"
                style={{ background: C.btnBg, color: C.btnText, cursor:"pointer" }}>
                Get Alerts
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════════════════════════ */
function Footer({ C, isDark }) {
  const navigate = useNavigate();
  const cols = {
    Platform: [{ label:"Browse Listings",href:"/explore" },{ label:"For Tenants",href:"#tenants" },{ label:"For Landlords",href:"#landlords" },{ label:"Pricing",href:"#" },{ label:"Blog & Resources",href:"#blog" }],
    Company:  [{ label:"About Lodale",href:"/about" },{ label:"How It Works",href:"#listings" },{ label:"Careers",href:"#" },{ label:"Press",href:"#" },{ label:"Contact Us",href:"#" }],
    Legal:    [{ label:"Privacy Policy",href:"#" },{ label:"Terms of Service",href:"#" },{ label:"Fair Housing Notice",href:"#" },{ label:"Cookie Policy",href:"#" }],
  };
  const socials = [
    { Icon:X,        label:"Twitter/X"  },
    { Icon:Globe,    label:"Instagram"  },
    { Icon:Share2,   label:"Facebook"   },
    { Icon:Link2,    label:"LinkedIn"   },
  ];

  const footerBg = isDark ? "#040C07" : "#0A1710";

  return (
    <footer className="pt-16 pb-8 text-white" style={{ background: footerBg, borderTop:`1px solid ${isDark ? C.border : "rgba(255,255,255,0.1)"}` }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <button onClick={() => navigate("/")} className="flex items-center gap-2.5 mb-5 outline-none cursor-pointer">
              <img src="/logowhite.png" alt="Lodale Logo" className="h-8 w-auto object-contain" />
              <span className="text-[24px] font-normal tracking-tight"
                style={{ fontFamily: "'Playball', cursive", color: "#FFFFFF" }}>Lodale</span>
            </button>
            <p className="text-sm leading-relaxed mb-6 max-w-xs" style={{ color:"rgba(255,255,255,0.5)" }}>
              Nigeria's most trusted property leasing platform. Connecting verified landlords with quality tenants.
            </p>
            {[
              { Icon:MapPin, t:"Plot 14B, Admiralty Way, Lekki Phase 1, Lagos" },
              { Icon:Mail,   t:"hello@lodale.ng" },
              { Icon:Phone,  t:"+234 (0) 812 345 6789" },
            ].map(({ Icon, t }) => (
              <div key={t} className="flex items-start gap-2.5 text-sm mb-2.5" style={{ color:"rgba(255,255,255,0.55)" }}>
                <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: isDark ? C.gold : "#ebedec" }} />{t}
              </div>
            ))}
            <div className="flex gap-2.5 mt-6">
              {socials.map(({ Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.6)" }}
                  onMouseEnter={e => { e.currentTarget.style.color=C.gold; e.currentTarget.style.borderColor="rgba(201,150,62,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color="rgba(255,255,255,0.6)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"; }}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(cols).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] mb-4" style={{ color:"rgba(255,255,255,0.28)" }}>{title}</h4>
              <ul className="space-y-3">
                {links.map(l => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm transition-colors" style={{ color:"rgba(255,255,255,0.45)" }}
                      onMouseEnter={e => (e.target.style.color="rgba(255,255,255,0.85)")}
                      onMouseLeave={e => (e.target.style.color="rgba(255,255,255,0.45)")}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-7 gap-3" style={{ borderTop:`1px solid ${C.border}` }}>
          <p className="text-xs" style={{ color:"rgba(255,255,255,0.22)" }}>© 2026 Lodale Technologies Ltd. All rights reserved. RC: 1234567</p>
          <p className="text-xs" style={{ color:"rgba(255,255,255,0.18)" }}>🇳🇬 Proudly built in Nigeria, for Nigeria.</p>
        </div>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ROOT EXPORT
══════════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  // Try using ThemeContext, fallback to local state if missing
  let themeState;
  try {
    themeState = useTheme();
  } catch {
    const [theme, setTheme] = useState("dark");
    themeState = {
      theme,
      isDark: theme === "dark",
      toggleTheme: () => setTheme(t => t === "dark" ? "light" : "dark")
    };
  }

  const { isDark, toggleTheme } = themeState;

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playball&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  // Theme design tokens
  const C = isDark ? {
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
    textMuted: "rgba(255,255,255,0.62)",
    textFaint: "rgba(255,255,255,0.38)",
    heroOverlay: "linear-gradient(155deg,rgba(7,19,13,0.9) 0%,rgba(13,31,23,0.83) 50%,rgba(7,19,13,0.94) 100%)",
    navBg: "rgba(7,19,13,0.96)",
    fieldBg: "rgba(255,255,255,0.07)",
    fieldBorder: "rgba(255,255,255,0.13)",
    selectOptionBg: "#0D1F17",
    btnBg: "#C9963E",
    btnText: "#07130D",
  } : {
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
    heroOverlay: "linear-gradient(155deg,rgba(246,248,246,0.92) 0%,rgba(232,238,234,0.88) 50%,rgba(246,248,246,0.95) 100%)",
    navBg: "rgba(246,248,246,0.96)",
    fieldBg: "#FFFFFF",
    fieldBorder: "rgba(7,19,13,0.12)",
    selectOptionBg: "#FFFFFF",
    btnBg: "#344E41",
    btnText: "#FFFFFF",
  };

  return (
    <div className="min-h-screen antialiased transition-colors duration-300"
      style={{ background:C.bg, fontFamily:"'Inter',system-ui,sans-serif", color: C.textPrimary }}>
      <style>{`.lodale-h2{font-family:'Playfair Display',Georgia,serif;font-size:clamp(2.2rem,5vw,3.6rem);font-weight:700;line-height:1.1;letter-spacing:-0.01em;}`}</style>
      <Navbar C={C} isDark={isDark} toggleTheme={toggleTheme} />
      <HeroSection C={C} isDark={isDark} />
      <HowItWorksSection C={C} isDark={isDark} />
      <ServicesSection C={C} isDark={isDark} />
      <TestimonialsSection C={C} isDark={isDark} />
      <BlogSection C={C} isDark={isDark} />
      <CTASection C={C} isDark={isDark} />
      <Footer C={C} isDark={isDark} />

      {/* Floating Theme Toggle (Bottom Right Corner with 50% opacity until hover) */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full border shadow-2xl backdrop-blur-md opacity-50 hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-110"
        style={{
          background: isDark ? "rgba(13, 31, 23, 0.85)" : "rgba(255, 255, 255, 0.85)",
          borderColor: isDark ? "rgba(201, 150, 62, 0.4)" : "rgba(52, 78, 65, 0.3)",
          color: C.textPrimary,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
        }}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-emerald-800" />}
      </button>
    </div>
  );
}


