import { useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Heart,
  FileText,
  LineChart,
  Building2,
  Inbox,
  Wallet,
  Wrench,
} from "lucide-react";
import gsap from "gsap";
import { Logo, LogoMark } from "../components/Logo";
import Button from "../components/Button";

const CONTENT = {
  tenant: {
    name: "Emeka",
    subtitle:
      "Your identity has been successfully verified. You're ready to start finding verified rental properties.",
    features: [
      {
        icon: Search,
        label: "Browse Verified Properties",
        desc: "Rent verified units with title checks to stay safe from double-letting scams.",
      },
      {
        icon: Heart,
        label: "Save Favourite Listings",
        desc: "Save and compare rents, amenities, and ratings side-by-side.",
      },
      {
        icon: FileText,
        label: "Apply for Rentals",
        desc: "Submit your pre-verified NIN profile directly to landlords to bypass agency fees.",
      },
      {
        icon: LineChart,
        label: "Track Applications & Payments",
        desc: "Log rent, view invoices, sign leases, and generate compliance receipts instantly.",
      },
    ],
    infoBox: null,
    footer: "You can complete your profile later from Settings.",
    cta: "/dashboard/tenant",
    ctaLabel: "Continue to Dashboard",
  },
  landlord: {
    name: "Ada",
    subtitle:
      "Your identity has been successfully verified. Let's help you list your first property.",
    features: [
      {
        icon: Building2,
        label: "List Your Properties",
        desc: "Post listings directly to tenants for free, marked with ownership stamps.",
      },
      {
        icon: Inbox,
        label: "Receive Tenant Applications",
        desc: "Screen pre-verified applicant logs containing NIN and rental histories.",
      },
      {
        icon: Wallet,
        label: "Manage Rent Payments",
        desc: "Auto-invoice tenants and receive direct rent payments to your bank ledger.",
      },
      {
        icon: Wrench,
        label: "Track Maintenance Requests",
        desc: "Receive repair tickets, log contractor progress, and track resolution timelines.",
      },
    ],
    infoBox:
      "Property ownership will be verified when you publish your first property.",
    footer: "You can edit your profile anytime from Settings.",
    cta: "/add-property",
    ctaLabel: "+ List Your Property",
  },
};

export default function Welcome() {
  const { role } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const data = CONTENT[role] ?? CONTENT.tenant;
  const username = location.state?.username || data.name;

  const cardsContainerRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    // Animate Header
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
      );
    }

    // Animate Feature Cards in Staggered Flow
    if (cardsContainerRef.current) {
      const cards = cardsContainerRef.current.querySelectorAll(".feature-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.15,
        },
      );
    }
  }, [role]);

  return (
    <div className="min-h-screen bg-theme-bg-offset px-6 py-14 transition-colors">
      <div className="mx-auto max-w-3xl text-center">
        <Logo className="mb-14 justify-center" />

        <div className="mx-auto mb-10 flex h-44 w-full max-w-md items-center justify-center rounded-2xl bg-moss-700">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/10">
            <LogoMark size={40} variant="white" />
          </div>
        </div>

        <div ref={headerRef} className="space-y-2">
          <h1 className="font-display text-3xl font-semibold text-ink-900 dark:text-white">
            Welcome, {username}!
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-ink-700 dark:text-cream-50/90">
            {data.subtitle}
          </p>
        </div>

        <div
          ref={cardsContainerRef}
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl mx-auto"
        >
          {data.features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="feature-card group rounded-xl border border-theme-border bg-theme-card-bg p-5 text-left hover:border-moss-500/40 hover:bg-moss-100/10 hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer focus-visible:ring-2 focus-visible:ring-moss-600 outline-none"
              tabIndex={0}
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-moss-100 text-moss-700 group-hover:bg-moss-700 group-hover:text-white transition-all duration-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[13px] font-bold text-ink-900 dark:text-white block group-hover:text-moss-700 transition-colors duration-300">
                    {label}
                  </span>
                  <span className="text-[12px] leading-relaxed text-ink-700 dark:text-cream-100 block mt-0.5">
                    {desc}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 max-w-md mx-auto space-y-4">
          <Button
            className="w-full focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 outline-none"
            onClick={() => navigate(data.cta)}
          >
            {data.ctaLabel}
          </Button>
          <p className="text-[12px] text-ink-400 dark:text-cream-100/70">
            {data.footer}
          </p>
        </div>
      </div>
    </div>
  );
}
