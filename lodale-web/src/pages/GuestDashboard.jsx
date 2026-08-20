import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  FileText,
  LineChart,
  ShieldCheck,
  Building2,
  Inbox,
  Wallet,
  Wrench,
  ArrowRight,
  BookOpen
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import ListingCard from "../components/ListingCard";
import ListingCardSkeleton from "../components/ListingCardSkeleton";
import Footer from "../components/Footer";
import { propertyService } from "../services/propertyService";
import heroBgDark from "../assets/dark_modern_villa.png";
import heroBgLight from "../assets/lodale_hero_light.png";
import heroBg from "../assets/lodale_hero.png";
import { useTheme } from "../context/ThemeContext";

gsap.registerPlugin(ScrollTrigger);

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
      <div className="absolute inset-0 bg-cover bg-center transition-all duration-500" style={{ backgroundImage: `url(${isDark ? heroBg : heroBgLight})` }} />
      <div className="absolute inset-0 transition-colors duration-300" style={{ background: C.heroOverlay }} />
      <div className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: 700, height: 700,
          background: isDark
            ? "radial-gradient(circle,rgba(201,150,62,0.11) 0%,transparent 70%)"
            : "radial-gradient(circle,rgba(184,130,40,0.14) 0%,transparent 70%)",
          transform: "translate(22%,-30%)"
        }} />


      <div className="relative z-10 max-w-5xl mx-auto px-5 lg:px-8 pt-48 pb-16 text-center">
        <h1 ref={titleRef} className="font-bold leading-[1.08] tracking-tight mb-5"
          style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "clamp(2.2rem,5.5vw,4.2rem)", color: C.textPrimary }}>
          Find Your Next Lease
          <br />
          <em className="not-italic" style={{ color: isDark ? C.goldLight : C.gold }}>with Complete</em>
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
            <h2 className="text-3xl md:text-4xl font-bold mt-3" style={{ color: C.textPrimary, fontFamily: "'Playfair Display',Georgia,serif" }}>
              Market Reports &amp;<br /><em className="not-italic" style={{ color: C.gold }}>Expert Insights.</em>
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
        background: isDark ? (h ? "rgba(255,255,255,0.05)" : C.bgCard) : C.bgCard,
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

export default function GuestDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const listingsGridRef = useRef(null);

  const [allListings, setAllListings] = useState([]);

  const [fallbackTheme, setFallbackTheme] = useState("dark");
  
  let themeState;
  try {
    themeState = useTheme();
  } catch {
    themeState = {
      theme: fallbackTheme,
      isDark: fallbackTheme === "dark",
      toggleTheme: () => setFallbackTheme(t => t === "dark" ? "light" : "dark")
    };
  }

  const { isDark } = themeState;

  const darkC = {
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
  };

  const lightC = {
    bg: "#F4F6F6",
    bgMid: "#F4F6F6",
    bgCard: "#F4F6F6",
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
    heroOverlay: "linear-gradient(to bottom, transparent 0%, transparent 90px, rgba(244,246,246,0.75) 250px, #F4F6F6 100%)",
    navBg: "rgba(246,248,246,0.96)",
    fieldBg: "#F4F6F6",
    fieldBorder: "rgba(7,19,13,0.12)",
    selectOptionBg: "#F4F6F6",
    btnBg: "#344E41",
    btnText: "#FFFFFF",
  };

  const C = isDark ? darkC : lightC;

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
        } catch (e) { }

        const formatted = apiProps.map((item) => {
          if (!item) return null;
          const key = String(item.id || item.title);
          
          let landlordObj;
          if (item.landlord && typeof item.landlord === "object" && (item.landlord.first_name || item.landlord.name)) {
            const l = item.landlord;
            landlordObj = {
              id: l.id || null,
              name: l.name || `${l.first_name || ""} ${l.last_name || ""}`.trim() || "Verified Landlord",
              score: l.score ?? 5.0,
              reviews: l.reviews ?? 1,
              phone_number: l.phone_number || null
            };
          } else {
            landlordObj = { id: null, name: typeof item.landlord === "string" ? item.landlord : "Verified Landlord", score: 5.0, reviews: 1, phone_number: null };
          }
          
          return {
            id: item.id || key,
            title: item.title || item.address_line1 || "Property",
            location: item.location || item.city || "Lagos, Nigeria",
            price: item.price || (item.rent_amount ? `₦${Number(item.rent_amount).toLocaleString()}/yr` : "₦0/yr"),
            beds: item.beds || item.bedrooms || 1,
            baths: item.baths || item.bathrooms || 1,
            type: item.type || item.property_type || "apartment",
            image: item.image || item.cover_image || item.cover_photo || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&h=250&q=80",
            amenities: item.amenities || [],
            landlord: landlordObj,
            status: item.status,
            isPending: item.isPending
          };
        }).filter(Boolean);

        // STRICT FILTER: Exclude unapproved / pending / rejected listings from guest view
        const approvedOnly = formatted.filter((p) => {
          if (!p) return false;
          const status = (p.status || "").toLowerCase();
          if (status === "pending_review" || status === "pending approval" || status === "pending" || status === "rejected" || status === "info_requested" || status === "info requested") {
            return false;
          }
          return status === "active_vacant" || status === "approved" || status === "live" || status === "active" || (!p.status && !p.isPending);
        });

        setAllListings(approvedOnly);
      } catch (err) {
        console.warn("Failed to load public listings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPublicListings();
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

  // Listings Grid Stagger Animation when listings change
  useEffect(() => {
    if (listingsGridRef.current) {
      const cards = listingsGridRef.current.children;
      if (cards.length > 0) {
        gsap.killTweensOf(cards);
        gsap.fromTo(
          cards,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: "power2.out",
          }
        );
      }
    }
  }, [filteredListings.length]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          // Adjust scroll offset to account for the sticky navbar height (approx 80px)
          const offset = 80;
          const elementPosition =
            element.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: elementPosition - offset,
            behavior: "smooth",
          });
        }, 100);
      }
    }
  }, [location]);

  useEffect(() => {
    // ScrollTrigger general section animations
    const sections = [
      { id: "#listings", cardSelector: null },
      { id: "#for-tenants", cardSelector: ".tenant-feature-card" },
      { id: "#for-landlords", cardSelector: ".landlord-feature-card" }
    ];

    sections.forEach(({ id, cardSelector }) => {
      const sectionEl = document.querySelector(id);
      if (sectionEl) {
        if (cardSelector) {
          const cards = sectionEl.querySelectorAll(cardSelector);
          if (cards.length > 0) {
            gsap.fromTo(
              cards,
              { opacity: 0, y: 35 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.12,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: sectionEl,
                  start: "top 75%",
                  toggleActions: "play none none none",
                }
              }
            );
          }
        } else {
          gsap.fromTo(
            sectionEl,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.75,
              ease: "power2.out",
              scrollTrigger: {
                trigger: sectionEl,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text">
      <NavBar transparentMode={true} />

      <HeroSection C={C} isDark={isDark} />

      {/* listings */}
      <section
        id="listings"
        className="min-h-[100vh] flex flex-col relative z-16 mx-auto max-w-[1400px] px-8 pt-24 pb-32"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 border-b border-ink-100 dark:border-white/10 pb-8">
          <div>
            <h2 className="text-3xl md:text-5xl font-normal text-ink-900 dark:text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Browse Listings
            </h2>
            <p className="text-[14px] md:text-[15px] text-ink-600 dark:text-cream-100/70 mt-4 max-w-md leading-relaxed">
              Verified homes currently accepting rental applications directly through the Lodale system.
            </p>
          </div>

          <div className="w-full md:w-auto flex-1 max-w-md relative">
            <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              placeholder="Search by address, area, or landlord..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-b border-ink-200 hover:border-ink-400 dark:border-white/20 dark:hover:border-white/40 py-2.5 pl-8 pr-4 text-[13px] md:text-[14px] outline-none focus:border-moss-700 dark:focus:border-[#E5C583] transition-colors text-ink-900 dark:text-white placeholder:text-ink-400 dark:placeholder:text-white/40 rounded-none shadow-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <ListingCardSkeleton key={n} />
            ))}
          </div>
        ) : filteredListings.length > 0 ? (
          <div ref={listingsGridRef} className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center p-8 bg-transparent border-0 flex flex-col items-center justify-center max-w-sm mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-transparent border border-ink-200/40 dark:border-white/10 flex items-center justify-center mb-4 text-ink-400 dark:text-cream-100/40">
              <Search className="h-7 w-7" />
            </div>
            {searchQuery.trim() !== "" ? (
              <>
                <h3 className="font-bold text-lg text-ink-900 dark:text-white mb-1">
                  No matching listings found
                </h3>
                <p className="text-xs text-ink-500 dark:text-cream-100/60 max-w-xs leading-relaxed mb-4">
                  We couldn't find any properties matching "{searchQuery}". Try adjusting your keywords.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 rounded-xl bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs cursor-pointer border-none outline-none"
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <h3 className="font-bold text-lg text-ink-900 dark:text-white mb-1">
                  No listings yet
                </h3>
                <p className="text-xs text-ink-500 dark:text-cream-100/60 max-w-xs leading-relaxed">
                  Be the first to list a property on Lodale!
                </p>
              </>
            )}
          </div>
        )}
      </section>

      {/* for tenants */}
      <section
        id="for-tenants"
        className="min-h-screen flex flex-col justify-center bg-[#0D1F17] px-8 py-32 overflow-hidden relative"
      >
        <div className="mx-auto max-w-[1400px] w-full flex flex-col lg:flex-row gap-16 lg:gap-24 relative z-10">

          <div className="lg:w-1/3 flex flex-col justify-center">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#E5C583] uppercase mb-4 block">
              Tenant Experience
            </span>
            <h2 className="text-4xl md:text-5xl font-normal text-white leading-[1.1] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Secure,<br />Seamless,<br /><i className="text-[#E5C583]">Verified.</i>
            </h2>
            <p className="text-[14px] md:text-[15px] leading-relaxed text-white/70 max-w-sm">
              Take control of your tenancy. Apply with verification, track payments automatically, and grow a reliability rating that makes finding your next home effortless.
            </p>
            <div className="mt-12">
              <button onClick={() => signUpAs("tenant")} className="px-8 py-3.5 rounded-full border border-white/20 text-white hover:bg-white hover:text-[#0D1F17] transition-colors text-[11px] font-bold tracking-widest uppercase outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer">
                Sign Up as Tenant
              </button>
            </div>

            {/* Minimal Editorial Pull-Quote / Banner */}
            <div className="mt-16 pt-8 border-t border-white/10">
              <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] block mb-3 font-semibold">Platform Update</span>
              <p className="text-white/90 font-medium italic text-[16px] md:text-[18px] leading-relaxed" style={{ fontFamily: "'Playfair Display', serif" }}>
                "Maintenance requests now sync to your ledger seamlessly. Every repair is timestamped and filed automatically."
              </p>
            </div>
          </div>

          <div className="lg:w-2/3 grid gap-x-12 gap-y-16 sm:grid-cols-2 place-content-center">
            {TENANT_FEATURES.map(({ title, desc }, idx) => (
              <div
                key={title}
                className="tenant-feature-card group flex flex-col pt-6 border-t border-white/5 hover:border-[#E5C583]/30 transition-colors duration-500"
              >
                <div className="text-[3.5rem] leading-[0.8] font-normal text-white/10 mb-6 transition-colors duration-500 group-hover:text-[#E5C583]/40" style={{ fontFamily: "'Playfair Display', serif" }}>
                  0{idx + 1}
                </div>
                <h3 className="text-[18px] md:text-[20px] font-normal text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h3>
                <p className="text-[13px] md:text-[14px] leading-relaxed text-white/60">
                  {desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* for landlords */}
      <section
        id="for-landlords"
        className="min-h-screen flex flex-col justify-center bg-[#F4F6F6] dark:bg-[#07130d] px-8 py-32 overflow-hidden relative"
      >
        <div className="mx-auto max-w-[1400px] w-full flex flex-col lg:flex-row-reverse gap-16 lg:gap-24 relative z-10">

          <div className="lg:w-1/3 flex flex-col justify-center">
            <span className="text-[10px] font-bold tracking-[0.2em] text-moss-700 dark:text-[#E5C583] uppercase mb-4 block">
              Landlord Experience
            </span>
            <h2 className="text-4xl md:text-5xl font-normal text-ink-900 dark:text-white leading-[1.1] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Professional.<br />Profitable.<br /><i className="text-moss-700 dark:text-[#E5C583]">Direct.</i>
            </h2>
            <p className="text-[14px] md:text-[15px] leading-relaxed text-ink-600 dark:text-white/70 max-w-sm">
              Automate tenant checks, generate contracts, log rent collections, and respond to issues digitally. Keep your investments secure and organized without the middleman.
            </p>
            <div className="mt-12">
              <button onClick={() => signUpAs("landlord")} className="px-8 py-3.5 rounded-full border border-ink-200 dark:border-white/20 text-[#262626] dark:text-white hover:bg-ink-900 hover:text-white dark:hover:bg-white dark:hover:text-[#07130d] transition-colors text-[11px] font-bold tracking-widest uppercase outline-none focus-visible:ring-2 focus-visible:ring-ink-900 dark:focus-visible:ring-white cursor-pointer">
                Sign Up as Landlord
              </button>
            </div>

            {/* Minimal Editorial Pull-Quote / Banner */}
            <div className="mt-16 pt-8 border-t border-ink-100 dark:border-white/10">
              <span className="text-[10px] text-ink-400 dark:text-white/40 uppercase tracking-[0.2em] block mb-3 font-semibold">Automated Alert</span>
              <p className="text-ink-900 dark:text-white/90 font-medium italic text-[16px] md:text-[18px] leading-relaxed" style={{ fontFamily: "'Playfair Display', serif" }}>
                "March rent is due in 3 days. 12 units are pending payment. Send a reminder to keep every record current."
              </p>
            </div>
          </div>

          <div className="lg:w-2/3 grid gap-x-12 gap-y-16 sm:grid-cols-2 place-content-center">
            {LANDLORD_FEATURES.map(({ title, desc }, idx) => (
              <div
                key={title}
                className="landlord-feature-card group flex flex-col pt-6 border-t border-ink-100 dark:border-white/5 hover:border-moss-700/30 dark:hover:border-[#E5C583]/30 transition-colors duration-500"
              >
                <div className="text-[3.5rem] leading-[0.8] font-normal text-ink-200/50 dark:text-white/10 mb-6 transition-colors duration-500 group-hover:text-moss-700/40 dark:group-hover:text-[#E5C583]/40" style={{ fontFamily: "'Playfair Display', serif" }}>
                  0{idx + 1}
                </div>
                <h3 className="text-[18px] md:text-[20px] font-normal text-ink-900 dark:text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h3>
                <p className="text-[13px] md:text-[14px] leading-relaxed text-ink-600 dark:text-white/60">
                  {desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      <BlogSection C={darkC} isDark={true} />
      <Footer />
    </div>
  );
}
