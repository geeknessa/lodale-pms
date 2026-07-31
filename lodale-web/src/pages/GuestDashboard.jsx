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
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import ListingCard from "../components/ListingCard";
import Footer from "../components/Footer";
import { LISTINGS } from "../data/listings";
import heroBg from "../assets/modern_villa.png";

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

export default function GuestDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const listingsGridRef = useRef(null);
  const heroContentRef = useRef(null);

  const filteredListings = LISTINGS.filter((listing) => {
    const query = searchQuery.toLowerCase();
    return (
      listing.title.toLowerCase().includes(query) ||
      listing.location.toLowerCase().includes(query) ||
      listing.landlord.name.toLowerCase().includes(query)
    );
  });

  function signUpAs(role) {
    navigate("/signup", { state: { presetRole: role } });
  }

  // Hero Entry Animation on Load
  useEffect(() => {
    if (heroContentRef.current) {
      const children = heroContentRef.current.children;
      gsap.fromTo(
        children,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.12,
          ease: "power3.out",
        }
      );
    }
  }, []);

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
      <NavBar />

      {/* Hero Section */}
      <section
        className="relative w-full h-[55vh] min-h-[480px] flex items-center bg-cover bg-center border-b border-ink-200 px-6 py-10 md:py-16 text-left overflow-hidden animate-fade-in"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(26, 39, 34, 0.92), rgba(26, 39, 34, 0.3)), url(${heroBg})`,
        }}
      >
        <div className="mx-auto max-w-6xl w-full relative z-10">
          <div ref={heroContentRef} className="max-w-xl text-left">
            <span className="text-[11px] font-bold tracking-widest text-[#F5C242] uppercase block mb-3">
              Direct & Verified
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
              See their track record <br />
              before <span className="text-[#F5C242]">you commit.</span>
            </h1>
            <p className="mt-4 max-w-lg text-[14px] md:text-[15px] leading-relaxed text-cream-50/90">
              Lodale is built to replace rental
              guesswork with verified history. Secure digital leases, automated
              payments, and mutual accountability.
            </p>
          </div>
        </div>
      </section>

      {/* listings */}
      <section
        id="listings"
        className="min-h-[100vh] flex flex-col justify-center relative z-16 mx-auto max-w-6xl px-6 pt-0 pb-16"
      >
        <h2 className="font-display text-2xl font-bold text-ink-900 mb-2">
          Explore Available Properties
        </h2>
        <p className="text-[14px] text-ink-700 mb-6">
          Verified homes currently accepting rental applications directly
          through the system.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              placeholder="Search by address, area, or landlord name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-theme-border bg-theme-card-bg py-3 pl-11 pr-4 text-[14px] outline-none focus:border-moss-600 focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 dark:focus-visible:ring-white transition-colors"
            />
          </div>
          <Button className="sm:w-auto focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none">
            Search
          </Button>
        </div>

        {filteredListings.length > 0 ? (
          <div ref={listingsGridRef} className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center p-10 border border-dashed border-theme-border rounded-2xl bg-theme-bg-offset/40 flex flex-col items-center max-w-md mx-auto">
            <div className="h-14 w-14 rounded-full bg-cream-100 dark:bg-moss-700 text-moss-700 dark:text-moss-100 flex items-center justify-center mb-4">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-md font-bold text-theme-text">
              No listings found
            </h3>
            <p className="text-[13px] text-theme-text-offset mt-1">
              We couldn't find any properties matching "{searchQuery}". Try
              adjusting your keywords or clearing the search.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-2 bg-moss-700 hover:bg-forest-600 text-white rounded-lg text-[13px] font-semibold transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2"
            >
              Reset Search
            </button>
          </div>
        )}
      </section>

      {/* for tenants */}
      <section
        id="for-tenants"
        className="min-h-screen flex flex-col justify-center bg-cream-50 px-6 py-16 border-t border-b border-ink-200"
      >
        <div className="mx-auto max-w-6xl w-full">
          <span className="text-[11px] font-semibold tracking-wide text-moss-700 uppercase">
            FOR TENANTS
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
            Find a place, pay securely, and build your profile.
          </h2>
          <p className="mt-2 text-[14px] text-ink-700 max-w-xl">
            Take control of your tenancy. Apply with verification, track
            payments automatically, and grow a reliability rating that makes
            finding your next home effortless.
          </p>

          {/* New Feature Banner (Moodboard Banner 2) */}
          <div className="group/banner mt-8 p-6 md:p-8 flex flex-col text-left rounded-[20px] bg-cream-100 border border-ink-200 hover:border-moss-500/30 dark:bg-[#101F1A]/70 dark:border-[#23372B]/60 dark:hover:border-[#E5C583]/30 transition-all duration-300 shadow-none">
            <div className="flex flex-col items-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-100 dark:bg-[#1C3328] text-moss-700 dark:text-[#E5C583] border border-moss-200/60 dark:border-[#2E4D3F]/60 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase mb-3 select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-moss-600 dark:bg-[#E5C583] animate-pulse" />
                New Feature
              </span>
              <h3 className="font-display text-xl md:text-2xl font-bold text-ink-900 dark:text-white mt-1 group-hover/banner:text-moss-700 dark:group-hover/banner:text-[#E5C583] transition-colors duration-300">
                Maintenance requests now sync to your ledger
              </h3>
              <p className="mt-1 text-[13px] text-ink-700 dark:text-cream-50/90 max-w-xl">
                Every repair is timestamped and filed against the property
                automatically.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {TENANT_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="tenant-feature-card group rounded-xl border border-ink-200 bg-white p-6 shadow-none hover:border-moss-500/40 hover:scale-[1.01] hover:bg-moss-100/10 transition-all duration-300 cursor-pointer"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-moss-100 text-moss-700 group-hover:bg-moss-700 group-hover:text-white transition-all duration-300 group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-[15px] font-bold text-ink-900 group-hover:text-moss-700 transition-colors duration-300">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
                  {desc}
                </p>
              </div>
            ))}
          </div>
          <Button className="mt-8" onClick={() => signUpAs("tenant")}>
            Sign Up as Tenant
          </Button>
        </div>
      </section>

      {/* for landlords */}
      <section
        id="for-landlords"
        className="min-h-screen flex flex-col justify-center px-6 py-16"
      >
        <div className="mx-auto max-w-6xl w-full">
          <span className="text-[11px] font-semibold tracking-wide text-moss-700 uppercase">
            FOR LANDLORDS
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
            Professionalize your properties. Zero agency fees.
          </h2>
          <p className="mt-2 text-[14px] text-ink-700 max-w-xl">
            Automate tenant checks, generate contracts, log rent collections,
            and respond to issues digitally. Keep your investments secure and
            organized.
          </p>

          {/* Rent Reminder Banner (Moodboard Banner 1) */}
          <div className="group/reminder mt-8 p-6 md:p-8 flex flex-col text-left rounded-[20px] bg-forest-700 text-white border border-transparent dark:bg-[#1C3328] dark:border-moss-600/50 hover:bg-forest-600 dark:hover:bg-[#223F31] transition-all duration-300 shadow-none">
            <div className="flex flex-col items-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 dark:bg-[#E5C583]/10 text-white dark:text-[#E5C583] border border-white/20 dark:border-[#E5C583]/20 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase mb-3 select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-[#E5C583] animate-pulse" />
                Rent Reminder
              </span>
              <h3 className="font-display text-xl md:text-2xl font-bold text-white mt-1 group-hover/reminder:translate-x-1 transition-transform duration-350">
                March rent is due in 3 days
              </h3>
              <p className="mt-1 text-[13px] text-cream-50/90 max-w-xl">
                12 units are pending payment. Send a reminder to keep every
                record current.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {LANDLORD_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="landlord-feature-card group rounded-xl border border-ink-200 bg-white p-6 shadow-none hover:border-moss-500/40 hover:scale-[1.01] hover:bg-moss-100/10 transition-all duration-300 cursor-pointer"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-moss-100 text-moss-700 group-hover:bg-moss-700 group-hover:text-white transition-all duration-300 group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-[15px] font-bold text-ink-900 group-hover:text-moss-700 transition-colors duration-300">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
                  {desc}
                </p>
              </div>
            ))}
          </div>
          <Button className="mt-8" onClick={() => signUpAs("landlord")}>
            Sign Up as Landlord
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
