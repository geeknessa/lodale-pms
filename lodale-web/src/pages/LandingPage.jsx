import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search, MapPin, ChevronDown, Star,
  ArrowRight, Building2, Users, Calendar, FileText, Shield, Zap,
  Mail, Phone, Globe, Share2, Link2,
  Menu, X, BadgeCheck, Key, Clock, BookOpen, CheckCircle2,
  Sun, Moon, LineChart, ShieldCheck, Inbox, Wallet, Wrench
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import heroBg from "../assets/lodale_hero.png";
import { useTheme } from "../context/ThemeContext";
import ListingCard from "../components/ListingCard";
import { LISTINGS } from "../data/listings";
import { propertyService } from "../services/propertyService";

gsap.registerPlugin(ScrollTrigger);

const TENANT_FEATURES = [
  {
    icon: Search,
    title: "Browse Verified Listings Only",
    desc: "Every home listed on Lodale undergoes ownership verification. Rest easy knowing you are dealing with real landlords, shielding you from fake agents and double-rent scams.",
  },
  {
    icon: FileText,
    title: "Digital Direct Applications",
    desc: "Send your verified profile and ID verification directly to landlords in one tap. Remove expensive agent/agency search fees and speed up approvals.",
  },
  {
    icon: LineChart,
    title: "Automated Rent & Ledger",
    desc: "Pay rent securely online. Every payment is logged instantly on a digital ledger, issuing official, legally-binding receipts automatically. No more paper receipts to lose.",
  },
  {
    icon: ShieldCheck,
    title: "Landlord Reliability Scores",
    desc: "Review ratings from past tenants before signing. Know in advance how quickly a landlord responds to repairs and how fairly they handle security deposits.",
  },
];

const LANDLORD_FEATURES = [
  {
    icon: Building2,
    title: "Direct Listings, No Agency Cut",
    desc: "List your property for free in under five minutes. Connect directly with thousands of prospective tenants, cutting out middleman agent fees and communication delays.",
  },
  {
    icon: Inbox,
    title: "Instant Digital Screening",
    desc: "Evaluate tenant applications containing verified ID credentials, job statuses, and rent history. Choose premium tenants with high trust scores with absolute confidence.",
  },
  {
    icon: Wallet,
    title: "Automated Billing & Reminders",
    desc: "The system automatically issues rent invoices, tracks payment statuses, and sends gentle automated reminders, ensuring cash flow is collected directly to your bank account.",
  },
  {
    icon: Wrench,
    title: "Smart Maintenance Workflows",
    desc: "Receive repair tickets complete with photos and status logs. Coordinate contractors and track resolutions in-app, building a verifiable history of property care.",
  },
];

const BLOG = [
  { id: 1, tag: "Market Report", tagColor: "#C9963E", gA: "#1A2E20", gB: "#2D4A32", date: "Aug 5, 2026", read: "6 min", title: "Rental Market Trends 2026: What Tenants and Landlords Need to Know", excerpt: "Lagos rental prices have risen 18% in prime districts this year. Here's how to navigate the market whether you're searching or listing." },
  { id: 2, tag: "Legal Guide", tagColor: "#2D6A4F", gA: "#1A1A2E", gB: "#2A2A4A", date: "Jul 28, 2026", read: "9 min", title: "Landlord Rights & Tenant Checklist: Nigeria 2026 Edition", excerpt: "A comprehensive breakdown of tenant rights under the Tenancy Law of Lagos State, deposit regulations, and legal eviction procedures." },
  { id: 3, tag: "Spotlight", tagColor: "#2B5F7E", gA: "#1A2A2E", gB: "#2A3A4A", date: "Jul 15, 2026", read: "5 min", title: "What ₦4,000,000/Year Rent Gets You Across Lagos", excerpt: "From Ajah to Ikoyi — we break down exactly what the same budget gets you in 6 different parts of Nigeria's commercial capital." },
];

function Pill({ color, borderColor, children }) {
  return (
    <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.12em]"
      style={{ background: `${color}18`, border: `1px solid ${borderColor || `${color}35`}`, color }}>
      {children}
    </div>
  );
}

function Navbar({ C, isDark, toggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const navLinks = [
    { label: "Listings", id: "listings" },
    { label: "For Tenants", id: "for-tenants" },
    { label: "For Landlords", id: "for-landlords" },
    { label: "Blog", id: "blog" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? C.navBg : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
        boxShadow: scrolled ? (isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.04)") : "none"
      }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-20 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 outline-none cursor-pointer">
          <img src={isDark ? "/logowhite.png" : "/favicon.svg"} alt="Lodale Logo" className="h-8 w-auto object-contain" />
          <span className="text-[24px] font-normal tracking-tight"
            style={{ fontFamily: "'Playball', cursive", color: C.textPrimary }}>Lodale</span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            <button key={l.label} onClick={() => scrollTo(l.id)}
              className="text-sm font-semibold transition-colors hover:opacity-100 cursor-pointer"
              style={{ color: C.textMuted }}>
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => navigate("/login")}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            style={{ color: C.textPrimary, border: `1px solid ${C.border}` }}>
            Log In
          </button>
          <button onClick={() => navigate("/signup")}
            className="text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:brightness-110 active:scale-[0.97] cursor-pointer"
            style={{ background: C.btnBg, color: C.btnText }}>
            Sign Up
          </button>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg" style={{ color: C.textPrimary }}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden px-5 py-6 space-y-4 border-b animate-fade-in"
          style={{ background: C.navBg, borderColor: C.border }}>
          {navLinks.map(l => (
            <button key={l.label} onClick={() => scrollTo(l.id)}
              className="block w-full text-left py-2 text-base font-medium"
              style={{ color: C.textPrimary }}>
              {l.label}
            </button>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            <button onClick={() => { setMobileOpen(false); navigate("/login"); }}
              className="w-full py-3 rounded-xl text-center font-semibold text-sm"
              style={{ color: C.textPrimary, border: `1px solid ${C.border}` }}>
              Log In
            </button>
            <button onClick={() => { navigate("/signup"); setMobileOpen(false); }}
              className="text-sm font-bold py-3 rounded-xl text-center cursor-pointer transition-all"
              style={{ background: C.btnBg, color: C.btnText }}>
              Sign Up
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function HeroSection({ C, isDark }) {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(titleRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.15 })
        .fromTo(descRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, "-=0.6")
        .fromTo(btnRef.current, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.8)" }, "-=0.5");
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" id="hero">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="absolute inset-0 transition-colors duration-300" style={{ background: C.heroOverlay }} />
      <div className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: 700, height: 700,
          background: isDark
            ? "radial-gradient(circle,rgba(201,150,62,0.11) 0%,transparent 70%)"
            : "radial-gradient(circle,rgba(184,130,40,0.14) 0%,transparent 70%)",
          transform: "translate(22%,-30%)"
        }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: isDark
            ? `linear-gradient(rgba(255,255,255,0.024) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.024) 1px,transparent 1px)`
            : `linear-gradient(rgba(7,19,13,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(7,19,13,0.03) 1px,transparent 1px)`,
          backgroundSize: "72px 72px"
        }} />

      <div className="relative z-10 max-w-5xl mx-auto px-5 lg:px-8 pt-24 pb-16 text-center">
        <h1 ref={titleRef} className="font-bold leading-[1.08] tracking-tight mb-5"
          style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "clamp(2.2rem,5.5vw,4.2rem)", color: C.textPrimary }}>
          Find Your Next Lease
          <br />
          <span style={{ color: C.gold }}>with Complete</span>
          <br />
          Clarity.
        </h1>

        <p ref={descRef} className="max-w-xl mx-auto mb-8 leading-relaxed text-sm sm:text-base"
          style={{ color: C.textMuted }}>
          Seamless property leasing, verified listings, and transparent management for landlords and tenants across Nigeria.
        </p>

        <div ref={btnRef} className="flex justify-center items-center">
          <button
            onClick={() => scrollToSection("listings")}
            className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-105 hover:brightness-110 active:scale-95 shadow-xl cursor-pointer"
            style={{ background: C.btnBg, color: C.btnText }}
          >
            <Search className="w-4 h-4" />
            Browse Listings
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function ListingsSection({ C, isDark, searchQuery, setSearchQuery, filteredListings, listingsGridRef }) {
  return (
    <section id="listings" className="min-h-screen flex flex-col justify-center py-12 lg:py-16 transition-colors duration-300" style={{ background: isDark ? "#07130d" : C.bg }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 w-full">
        <div className="text-center mb-8 lg:mb-10">
          <Pill color={C.gold}>Verified Properties</Pill>
          <h2 className="lodale-h2 mt-3 mb-2" style={{ color: C.textPrimary }}>
            Explore Available <span style={{ color: C.gold }}>Listings.</span>
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: C.textMuted }}>
            Verified homes currently accepting rental applications directly through the system.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-10 flex gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: C.gold }} />
            <input
              type="text"
              placeholder="Search by address, area, or landlord name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium outline-none transition-all"
              style={{
                background: C.fieldBg,
                border: `1px solid ${C.fieldBorder}`,
                color: C.textPrimary,
              }}
            />
          </div>
        </div>

        {filteredListings.length > 0 ? (
          <div ref={listingsGridRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-8 text-center p-10 border rounded-2xl flex flex-col items-center max-w-md mx-auto"
            style={{ background: C.bgCard, borderColor: C.border }}>
            <div className="h-12 w-12 rounded-full flex items-center justify-center mb-4" style={{ background: C.goldFaint, color: C.gold }}>
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold" style={{ color: C.textPrimary }}>
              No listings found
            </h3>
            <p className="text-xs mt-1" style={{ color: C.textMuted }}>
              We couldn't find any properties matching "{searchQuery}". Try adjusting your keywords.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              style={{ background: C.btnBg, color: C.btnText }}
            >
              Reset Search
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ForTenantsSection({ C, isDark, signUpAs }) {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, ease: "power3.out", scrollTrigger: { trigger: sectionRef.current, start: "top 75%" } });
      if (cardsRef.current) {
        gsap.fromTo(cardsRef.current.children, { y: 45, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.75, stagger: 0.14, ease: "power3.out", scrollTrigger: { trigger: cardsRef.current, start: "top 80%" } });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="for-tenants" className="min-h-screen flex flex-col justify-center py-12 lg:py-16 transition-colors duration-300"
      style={{ background: isDark ? "#07130d" : C.bgMid }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 w-full">
        <div ref={headerRef} className="text-center mb-8 lg:mb-10">
          <Pill color={C.green}>For Tenants</Pill>
          <h2 className="lodale-h2 mt-3 mb-2" style={{ color: C.textPrimary }}>
            Find a Place, Pay Securely, <br /><span style={{ color: C.gold }}>and Build Your Profile.</span>
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: C.textMuted }}>
            Take control of your tenancy. Apply with verification, track payments automatically, and grow a reliability rating that makes finding your next home effortless.
          </p>
        </div>

        {/* Feature Banner */}
        <div className="max-w-4xl mx-auto mb-8 p-6 rounded-2xl transition-all duration-300"
          style={{
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(52,78,65,0.05)",
            border: `1px solid ${isDark ? "rgba(201,150,62,0.3)" : C.border}`
          }}>
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase mb-2"
              style={{ background: C.greenFaint, color: isDark ? C.goldLight : C.green, border: `1px solid ${C.border}` }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: C.gold }} />
              New Feature
            </span>
            <h3 className="text-lg font-bold" style={{ color: C.textPrimary }}>
              Maintenance requests now sync to your ledger
            </h3>
            <p className="mt-1 text-xs" style={{ color: C.textMuted }}>
              Every repair is timestamped and filed against the property automatically.
            </p>
          </div>
        </div>

        <div ref={cardsRef} className="grid gap-5 sm:grid-cols-2 max-w-5xl mx-auto">
          {TENANT_FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl flex flex-col gap-3 transition-all duration-300"
              style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                boxShadow: isDark ? "none" : "0 2px 10px rgba(0,0,0,0.03)"
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: C.goldFaint, color: C.gold }}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold" style={{ color: C.textPrimary }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <button onClick={() => signUpAs("tenant")}
            className="px-7 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
            style={{ background: C.btnBg, color: C.btnText }}>
            Sign Up as Tenant
          </button>
        </div>
      </div>
    </section>
  );
}

function ForLandlordsSection({ C, isDark, signUpAs }) {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, ease: "power3.out", scrollTrigger: { trigger: sectionRef.current, start: "top 75%" } });
      if (cardsRef.current) {
        gsap.fromTo(cardsRef.current.children, { y: 45, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.75, stagger: 0.14, ease: "power3.out", scrollTrigger: { trigger: cardsRef.current, start: "top 80%" } });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="for-landlords" className="min-h-screen flex flex-col justify-center py-12 lg:py-16 transition-colors duration-300" style={{ background: isDark ? "#07130d" : C.bg }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 w-full">
        <div ref={headerRef} className="text-center mb-8 lg:mb-10">
          <Pill color={C.gold}>For Landlords</Pill>
          <h2 className="lodale-h2 mt-3 mb-2" style={{ color: C.textPrimary }}>
            Professionalize Your Properties.<br /><span style={{ color: C.gold }}>Zero Agency Fees.</span>
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: C.textMuted }}>
            Automate tenant checks, generate contracts, log rent collections, and respond to issues digitally. Keep your investments secure and organized.
          </p>
        </div>

        {/* Rent Reminder Banner */}
        <div className="max-w-4xl mx-auto mb-8 p-6 rounded-2xl transition-all duration-300"
          style={{
            background: "linear-gradient(135deg,#1A3A25 0%,#0F2A1C 100%)",
            border: "1px solid rgba(201,150,62,0.3)",
            color: "#FFFFFF"
          }}>
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase mb-2"
              style={{ background: "rgba(255,255,255,0.12)", color: "#E5C583", border: "1px solid rgba(229,197,131,0.3)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Rent Reminder
            </span>
            <h3 className="text-lg font-bold text-white">
              March rent is due in 3 days
            </h3>
            <p className="mt-1 text-xs text-cream-50/80">
              12 units are pending payment. Send a reminder to keep every record current.
            </p>
          </div>
        </div>

        <div ref={cardsRef} className="grid gap-5 sm:grid-cols-2 max-w-5xl mx-auto">
          {LANDLORD_FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl flex flex-col gap-3 transition-all duration-300"
              style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                boxShadow: isDark ? "none" : "0 2px 10px rgba(0,0,0,0.03)"
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: C.goldFaint, color: C.gold }}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold" style={{ color: C.textPrimary }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <button onClick={() => signUpAs("landlord")}
            className="px-7 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
            style={{ background: C.btnBg, color: C.btnText }}>
            Sign Up as Landlord
          </button>
        </div>
      </div>
    </section>
  );
}

function BlogSection({ C, isDark }) {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, ease: "power3.out", scrollTrigger: { trigger: sectionRef.current, start: "top 75%" } });
      if (cardsRef.current) {
        gsap.fromTo(cardsRef.current.children, { y: 55, opacity: 0, scale: 0.93 }, { y: 0, opacity: 1, scale: 1, duration: 0.75, stagger: 0.16, ease: "power3.out", scrollTrigger: { trigger: cardsRef.current, start: "top 80%" } });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="blog" className="min-h-screen flex flex-col justify-center py-12 lg:py-16 transition-colors duration-300" style={{ background: isDark ? "#07130d" : C.bgMid }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 w-full">
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 lg:mb-10">
          <div>
            <Pill color={C.green}><BookOpen className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Leasing Resources</Pill>
            <h2 className="lodale-h2 mt-3" style={{ color: C.textPrimary }}>
              Market Reports &amp;<br /><span style={{ color: C.gold }}>Expert Insights.</span>
            </h2>
          </div>
          <a href="#" className="flex items-center gap-1.5 text-xs sm:text-sm font-bold shrink-0 mb-1 group transition-colors hover:brightness-125"
            style={{ color: C.gold }}>
            View All Articles <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
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
      <div className="h-36 relative flex items-end p-4" style={{ background: `linear-gradient(135deg,${gA},${gB})` }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)`, backgroundSize: "32px 32px" }} />
        <span className="relative z-10 px-2 py-0.5 rounded text-[11px] font-bold" style={{ background: tagColor, color: "white" }}>{tag}</span>
      </div>
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 mb-3 text-[11px]" style={{ color: C.textFaint }}>
          <span>{date}</span><span>·</span><span>{read} read</span>
        </div>
        <h3 className="text-sm font-bold mb-2 leading-snug transition-colors duration-200"
          style={{ color: h ? C.gold : C.textPrimary }}>{title}</h3>
        <p className="text-xs leading-relaxed flex-1 mb-4" style={{ color: C.textMuted }}>{excerpt}</p>
        <div className="flex items-center gap-2 text-xs font-bold group" style={{ color: C.gold }}>
          Read More <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </article>
  );
}

function Footer({ C, isDark }) {
  const navigate = useNavigate();
  const cols = {
    Platform: [{ label: "Browse Listings", href: "#listings" }, { label: "For Tenants", href: "#for-tenants" }, { label: "For Landlords", href: "#for-landlords" }, { label: "Blog & Resources", href: "#blog" }],
    Company: [{ label: "About Lodale", href: "/about" }, { label: "Careers", href: "#" }, { label: "Press", href: "#" }, { label: "Contact Us", href: "#" }],
    Legal: [{ label: "Privacy Policy", href: "#" }, { label: "Terms of Service", href: "#" }, { label: "Fair Housing Notice", href: "#" }, { label: "Cookie Policy", href: "#" }],
  };
  const socials = [
    { Icon: X, label: "Twitter/X" },
    { Icon: Globe, label: "Instagram" },
    { Icon: Share2, label: "Facebook" },
    { Icon: Link2, label: "LinkedIn" },
  ];

  const footerBg = isDark ? "#000000" : "#0A1710";

  return (
    <footer className="min-h-screen flex flex-col justify-between pt-14 pb-8 text-white" style={{ background: footerBg, borderTop: `1px solid ${isDark ? C.border : "rgba(255,255,255,0.1)"}` }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 w-full my-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 mb-10">
          <div className="lg:col-span-2">
            <button onClick={() => navigate("/")} className="flex items-center gap-2.5 mb-4 outline-none cursor-pointer">
              <img src="/logowhite.png" alt="Lodale Logo" className="h-8 w-auto object-contain" />
              <span className="text-[24px] font-normal tracking-tight"
                style={{ fontFamily: "'Playball', cursive", color: "#FFFFFF" }}>Lodale</span>
            </button>
            <p className="text-xs sm:text-sm leading-relaxed mb-5 max-w-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              Nigeria's most trusted property leasing platform. Connecting verified landlords with quality tenants.
            </p>
            {[
              { Icon: MapPin, t: "Plot 14B, Admiralty Way, Lekki Phase 1, Lagos" },
              { Icon: Mail, t: "hello@lodale.ng" },
              { Icon: Phone, t: "+234 (0) 812 345 6789" },
            ].map(({ Icon, t }) => (
              <div key={t} className="flex items-start gap-2.5 text-xs sm:text-sm mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
                <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: isDark ? C.gold : "#ebedec" }} />{t}
              </div>
            ))}
            <div className="flex gap-2.5 mt-5">
              {socials.map(({ Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.gold; e.currentTarget.style.borderColor = "rgba(201,150,62,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}>
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(cols).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] mb-3.5" style={{ color: "rgba(255,255,255,0.28)" }}>{title}</h4>
              <ul className="space-y-2.5">
                {links.map(l => (
                  <li key={l.label}>
                    <a href={l.href} className="text-xs sm:text-sm transition-colors" style={{ color: "rgba(255,255,255,0.45)" }}
                      onMouseEnter={e => (e.target.style.color = "rgba(255,255,255,0.85)")}
                      onMouseLeave={e => (e.target.style.color = "rgba(255,255,255,0.45)")}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>© 2026 Lodale Technologies Ltd. All rights reserved. RC: 1234567</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>🇳🇬 Proudly built in Nigeria, for Nigeria.</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const listingsGridRef = useRef(null);

  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playball&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  const [allListings, setAllListings] = useState(() => {
    try {
      const saved = localStorage.getItem("properties");
      if (saved) {
        const parsed = JSON.parse(saved);
        const approvedOnly = parsed.filter(
          (p) => p && (p.status === "active_vacant" || p.status === "Approved" || p.status === "Live" || p.status === "active" || (!p.status && !p.isPending))
        );
        if (approvedOnly.length > 0) return approvedOnly;
      }
    } catch (e) {}
    return LISTINGS;
  });

  useEffect(() => {
    async function fetchPublicListings() {
      try {
        let apiProps = [];
        try {
          const apiRes = await propertyService.getProperties();
          if (Array.isArray(apiRes)) {
            apiProps = apiRes;
          } else if (apiRes && Array.isArray(apiRes.properties)) {
            apiProps = apiRes.properties;
          }
        } catch (e) {}

        const saved = localStorage.getItem("properties");
        const localProps = saved ? JSON.parse(saved) : [];

        const mergedMap = new Map();
        [...LISTINGS, ...localProps, ...apiProps].forEach((item) => {
          if (item && (item.id || item.title)) {
            const key = String(item.id || item.title);
            mergedMap.set(key, item);
          }
        });

        const combined = Array.from(mergedMap.values());

        const approvedOnly = combined.filter((p) => {
          if (!p) return false;
          const status = (p.status || "").toLowerCase();
          if (status === "pending_review" || status === "pending approval" || status === "pending" || status === "rejected") {
            return false;
          }
          return status === "active_vacant" || status === "approved" || status === "live" || status === "active" || (!p.status && !p.isPending);
        });

        setAllListings(approvedOnly.length > 0 ? approvedOnly : LISTINGS);
      } catch (err) {
        console.warn("Failed to load public listings:", err);
      }
    }

    fetchPublicListings();
    window.addEventListener("storage", fetchPublicListings);
    return () => window.removeEventListener("storage", fetchPublicListings);
  }, []);

  const filteredListings = allListings.filter((listing) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = listing.title?.toLowerCase().includes(query);
    const locMatch = listing.location?.toLowerCase().includes(query);
    const landlordMatch = listing.landlord?.name?.toLowerCase().includes(query);
    return titleMatch || locMatch || landlordMatch;
  });

  function signUpAs(role) {
    navigate("/signup", { state: { presetRole: role } });
  }

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
      style={{ background: C.bg, fontFamily: "'Inter',system-ui,sans-serif", color: C.textPrimary }}>
      <style>{`.lodale-h2{font-family:'Playfair Display',Georgia,serif;font-size:clamp(1.75rem,3.5vw,2.6rem);font-weight:700;line-height:1.15;letter-spacing:-0.01em;}`}</style>
      <Navbar C={C} isDark={isDark} toggleTheme={toggleTheme} />
      <HeroSection C={C} isDark={isDark} />
      <ListingsSection C={C} isDark={isDark} searchQuery={searchQuery} setSearchQuery={setSearchQuery} filteredListings={filteredListings} listingsGridRef={listingsGridRef} />
      <ForTenantsSection C={C} isDark={isDark} signUpAs={signUpAs} />
      <ForLandlordsSection C={C} isDark={isDark} signUpAs={signUpAs} />
      <BlogSection C={C} isDark={isDark} />
      <Footer C={C} isDark={isDark} />

      {/* Floating Theme Toggle */}
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
