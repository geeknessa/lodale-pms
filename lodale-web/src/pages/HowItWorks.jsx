import { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  FileText,
  LineChart,
  Wrench,
  Star,
  UserCheck,
  Key,
  ChevronRight,
  Check,
} from "lucide-react";
import gsap from "gsap";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import Footer from "../components/Footer";

const TENANT_STEPS = [
  {
    title: "1. Create & Verify Profile",
    desc: "Verify your identity instantly using your National Identification Number (NIN). Lodale authenticates your credentials to award you a green Verified Badge. This proves to landlords you are a real, creditworthy tenant before they even request references.",
    icon: UserCheck,
    mockType: "profile",
  },
  {
    title: "2. Sign a Smart Digital Lease",
    desc: "Never handle messy paper contracts. When your application is approved, the system generates a standard tenancy agreement matching local rental laws. Review the terms and sign digitally directly from your mobile phone.",
    icon: FileText,
    mockType: "lease",
  },
  {
    title: "3. Track Payments & Balances",
    desc: "Pay rent secure in the knowledge that your receipts are tracked. Payments are securely routed through Lodale, updating your digital ledger instantly and issuing automated, legally-compliant receipts.",
    icon: LineChart,
    mockType: "ledger",
  },
  {
    title: "4. Direct Maintenance Portal",
    desc: "If something breaks, snap a picture and open a repair ticket in seconds. No more begging for repairs over telephone calls. Watch live status updates as your landlord schedules repairs and logs resolutions.",
    icon: Wrench,
    mockType: "maintenance",
  },
  {
    title: "5. Earn Your Tenancy Score",
    desc: "At move-out, you and your landlord rate the experience. Safe property upkeep and timely payments compile into a permanent, portable Reliability Score that guarantees you fast-tracked approvals for your next rental.",
    icon: Star,
    mockType: "rating",
  },
];

const LANDLORD_STEPS = [
  {
    title: "1. Verify Identity & Portfolio",
    desc: "Complete quick verification using your identity credentials. Verify your property ownership status to obtain a Verified Owner stamp. Attract high-quality tenants looking for verified, reputable rentals.",
    icon: UserCheck,
    mockType: "profile",
  },
  {
    title: "2. Smart Tenant Screening",
    desc: "Receive digital applications pre-packaged with verified IDs, income check fields, and tenant reliability histories. Inspect their past tenancy feedback so you make informed, secure leasing decisions.",
    icon: Key,
    mockType: "profile",
  },
  {
    title: "3. Draft and Bind Leases",
    desc: "Generate customized, legally robust tenancy agreements. Define rent schedules, caution deposits, and rules. Both parties sign digitally, sealing a secure contract accessible anytime in your database.",
    icon: FileText,
    mockType: "lease",
  },
  {
    title: "4. Hands-Off Invoicing & Rent",
    desc: "Rent is sent directly to your bank account. Lodale automatically issues rent invoices, records ledger inputs, tracks payment status, and schedules collection reminders so you never have to chase payments.",
    icon: LineChart,
    mockType: "ledger",
  },
  {
    title: "5. Automate Maintenance Tickets",
    desc: "Keep track of all property repairs without endless WhatsApp messages. Tenants lodge tickets with photos. Log contractor assignments, update work statuses, and catalog repair costs for automated tax deductions.",
    icon: Wrench,
    mockType: "maintenance",
  },
  {
    title: "6. Review and Relist",
    desc: "Conduct move-out inspections, settle security deposits fairly, and rate the tenancy. Positive reviews help great tenants find their next flat, and bad logs protect other landlords.",
    icon: Star,
    mockType: "rating",
  },
];

export default function HowItWorks() {
  const [role, setRole] = useState("tenant");
  const [activeStep, setActiveStep] = useState(0);
  const mockContainerRef = useRef(null);
  const marqueeRef = useRef(null);

  // GSAP Infinite scrolling marquee animation
  useEffect(() => {
    if (marqueeRef.current) {
      const parts = marqueeRef.current.querySelectorAll(".marquee-part");
      gsap.to(parts, {
        xPercent: -100,
        repeat: -100,
        duration: 12,
        ease: "none"
      });
    }
  }, []);

  const steps = role === "tenant" ? TENANT_STEPS : LANDLORD_STEPS;

  // Safeguard step boundary in case of switching roles with different steps lengths
  const activeStepClamped = activeStep >= steps.length ? 0 : activeStep;
  const activeMockType = steps[activeStepClamped]?.mockType || "profile";

  // GSAP animation for active mock card change
  useEffect(() => {
    if (mockContainerRef.current) {
      const card = mockContainerRef.current.firstElementChild;
      if (card) {
        gsap.killTweensOf(card);
        gsap.fromTo(
          card,
          { opacity: 0, scale: 0.96, y: 8 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.4,
            ease: "power2.out"
          }
        );
      }
    }
  }, [activeMockType, role]);

  function handleRoleSwitch(newRole) {
    setRole(newRole);
    setActiveStep(0);
  }

  // Renders the dynamic CSS-mock cards shown to users
  function renderMockUi(type) {
    switch (type) {
      case "profile":
        return (
          <div className="w-full max-w-sm rounded-2xl border border-theme-border bg-theme-card-bg p-6 shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-14 w-14 rounded-full bg-moss-100 dark:bg-moss-700/20 flex items-center justify-center font-display text-xl font-bold text-moss-700 dark:text-moss-100">
                  {role === "tenant" ? "EO" : "AB"}
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-moss-600 border-2 border-theme-bg text-white">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display text-lg font-bold text-theme-text">
                    {role === "tenant" ? "Emeka Obi" : "Ada Benson"}
                  </h4>
                </div>
                <p className="text-[12px] text-theme-text-offset/80">
                  {role === "tenant"
                    ? "Verified Tenant Profile"
                    : "Verified Owner Profile"}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-[13px] border-b border-theme-border pb-2">
                <span className="text-theme-text-offset">ID Verification</span>
                <span className="font-semibold text-moss-600 dark:text-moss-500 bg-moss-100 dark:bg-moss-700/30 px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1">
                  NIN Verified <Check className="h-3.5 w-3.5 shrink-0" />
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px] border-b border-theme-border pb-2">
                <span className="text-theme-text-offset">Reliability Score</span>
                <div className="text-right">
                  <span className="font-bold text-moss-600 dark:text-moss-500 text-[14px]">
                    {role === "tenant" ? "4.9 / 5.0" : "4.8 / 5.0"}
                  </span>
                  <div className="text-[10px] text-theme-text-offset/70">
                    based on{" "}
                    {role === "tenant"
                      ? "3 past tenancies"
                      : "12 verified listings"}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-theme-text-offset">Account Standing</span>
                <span className="text-moss-600 dark:text-moss-500 font-semibold text-[12px]">
                  Excellent
                </span>
              </div>
            </div>
          </div>
        );
      case "lease":
        return (
          <div className="w-full max-w-sm rounded-2xl border border-theme-border bg-theme-card-bg p-6 shadow-xl">
            <div className="border-b border-theme-border pb-3 mb-4 text-center">
              <h4 className="font-display text-sm font-bold text-theme-text">
                RESIDENTIAL LEASE AGREEMENT
              </h4>
              <p className="text-[9px] text-moss-600 dark:text-moss-500 font-bold tracking-wide flex items-center gap-0.5 justify-center mt-1">
                <Check className="h-3 w-3 shrink-0" /> COMPLIANT WITH NIGERIAN TENANCY ACT
              </p>
            </div>
            <div className="space-y-3 text-[11px] text-theme-text-offset leading-relaxed max-h-32 overflow-y-auto pr-1">
              <p>
                <strong>Section 1. Premises:</strong> Flat 4, 102 Herbert
                Macaulay, Yaba, Lagos State.
              </p>
              <p>
                <strong>Section 2. Duration:</strong> 1 Year commencing August
                1, 2026 to July 31, 2027.
              </p>
              <p>
                <strong>Section 3. Rent & Escrow:</strong> Rent of ₦1,800,000.
                Caution deposit of ₦200,000 held securely in Lodale Escrow.
              </p>
            </div>
            <div className="mt-5 border-t border-theme-border pt-4 grid grid-cols-2 gap-4">
              <div className="text-left border-r border-theme-border pr-2">
                <p className="text-[9px] text-theme-text-offset/70">LANDLORD SIGNATURE</p>
                <div className="font-display italic text-moss-700 dark:text-[#E5C583] py-1 text-[13px] font-semibold">
                  Ada Benson
                </div>
                <p className="text-[8px] text-theme-text-offset/70">Signed via NIN Key</p>
              </div>
              <div className="text-left pl-2">
                <p className="text-[9px] text-theme-text-offset/70">TENANT SIGNATURE</p>
                <div className="font-display italic text-moss-700 dark:text-[#E5C583] py-1 text-[13px] font-semibold">
                  Emeka Obi
                </div>
                <p className="text-[8px] text-theme-text-offset/70">Signed via NIN Key</p>
              </div>
            </div>
          </div>
        );
      case "ledger":
        return (
          <div className="w-full max-w-sm rounded-2xl border border-theme-border bg-theme-card-bg p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-theme-border pb-3 mb-4">
              <div>
                <h4 className="font-display text-sm font-bold text-theme-text">
                  Rent Receipt Log
                </h4>
                <p className="text-[10px] text-theme-text-offset/70">INV-2026-0089</p>
              </div>
              <div className="rounded bg-moss-100 dark:bg-moss-700/30 text-moss-700 dark:text-moss-100 px-2 py-0.5 text-[10px] font-bold">
                VERIFIED PAYMENT
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-theme-text-offset/70">Property</span>
                <span className="text-theme-text font-medium">Flat 4, Yaba</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-theme-text-offset/70">Paid To</span>
                <span className="text-theme-text font-medium">Ada Benson</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-theme-text-offset/70">Rent Amount</span>
                <span className="text-theme-text font-medium">₦1,800,000.00</span>
              </div>
              <hr className="border-theme-border" />
              <div className="flex justify-between text-[12px] font-bold">
                <span className="text-theme-text">Total Cleared</span>
                <span className="text-moss-600 dark:text-[#E5C583]">₦1,800,000.00</span>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-moss-100/50 dark:bg-moss-700/20 p-2.5 text-[10px] text-moss-700 dark:text-moss-100 border border-moss-600/10">
              <p className="font-semibold flex items-center gap-1">
                <Check className="h-3.5 w-3.5 shrink-0" /> Funds Settled Instantly
              </p>
              <p className="mt-0.5 text-theme-text-offset">
                Bank Transfer confirmation ID: TXN_880192801_MOSS
              </p>
            </div>
          </div>
        );
      case "maintenance":
        return (
          <div className="w-full max-w-sm rounded-2xl border border-theme-border bg-theme-card-bg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-theme-border pb-2">
              <span className="rounded bg-amber-100 dark:bg-amber-700/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                ACTIVE TICKET
              </span>
              <span className="text-[11px] text-theme-text-offset/70">#MN-104</span>
            </div>
            <h4 className="font-display text-sm font-bold text-theme-text">
              Bedroom AC Unit Repair
            </h4>
            <p className="mt-1 text-[12px] text-theme-text-offset">
              Air conditioner is blowing warm air. Condenser fan is making a
              clicking sound.
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-[11px]">
                <div className="h-4 w-4 rounded-full bg-moss-600 text-white flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 shrink-0" />
                </div>
                <div>
                  <div className="font-medium text-theme-text">
                    Reported with photo logs
                  </div>
                  <div className="text-[9px] text-theme-text-offset/70">
                    July 18, 2026 • 09:30 AM
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <div className="h-4 w-4 rounded-full bg-moss-600 text-white flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 shrink-0" />
                </div>
                <div>
                  <div className="font-medium text-theme-text">
                    Contractor Assigned (Adesina Electricals)
                  </div>
                  <div className="text-[9px] text-theme-text-offset/70">
                    July 18, 2026 • 11:15 AM
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <div className="h-4 w-4 rounded-full border-2 border-moss-600/30 animate-pulse flex items-center justify-center text-[8px]"></div>
                <div>
                  <div className="font-medium text-moss-700 dark:text-[#E5C583]">
                    Technician dispatched
                  </div>
                  <div className="text-[9px] text-moss-600 dark:text-moss-500">
                    Pending appointment today, 03:00 PM
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "rating":
        return (
          <div className="w-full max-w-sm rounded-2xl border border-theme-border bg-theme-card-bg p-6 shadow-xl">
            <div className="border-b border-theme-border pb-2 mb-3 text-center">
              <h4 className="font-display text-sm font-bold text-theme-text">
                Mutual Tenancy Feedback
              </h4>
              <p className="text-[9px] text-theme-text-offset/70">
                AUTOMATIC LEASE COMPLETION SIGN-OFF
              </p>
            </div>
            <div className="space-y-3 text-[11px]">
              <div className="rounded-lg bg-theme-bg-offset p-3">
                <div className="flex items-center justify-between font-bold text-theme-text">
                  <span>Landlord Review (Ada)</span>
                  <span className="text-moss-600 dark:text-[#E5C583]">★★★★★ 5.0</span>
                </div>
                <p className="mt-1 italic text-theme-text-offset">
                  "Emeka took excellent care of the property and paid every
                  invoice early. Left the keys clean."
                </p>
              </div>
              <div className="rounded-lg bg-theme-bg-offset p-3">
                <div className="flex items-center justify-between font-bold text-theme-text">
                  <span>Tenant Review (Emeka)</span>
                  <span className="text-moss-600 dark:text-[#E5C583]">★★★★☆ 4.8</span>
                </div>
                <p className="mt-1 italic text-theme-text-offset">
                  "Ada was quick to solve plumbing fixes and caution deposit
                  refund was returned in 24 hours."
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text transition-colors duration-250">
      <NavBar />

      {/* Hero Section with Transparent Marquee */}
      <div className="relative w-full overflow-hidden bg-theme-bg-offset/50 dark:bg-moss-700/20 py-12 border-b border-theme-border text-center flex flex-col items-center justify-center">
        <div ref={marqueeRef} className="absolute inset-0 flex items-center whitespace-nowrap overflow-hidden pointer-events-none select-none opacity-[0.08] dark:opacity-[0.02]">
          <div className="marquee-part flex items-center gap-12 pr-12 text-[9vw] font-display font-bold uppercase tracking-widest text-theme-text">
            <span>Lodale</span>
            <span>•</span>
            <span>Trust</span>
            <span>•</span>
            <span>Transparency</span>
            <span>•</span>
          </div>
          <div className="marquee-part flex items-center gap-12 pr-12 text-[9vw] font-display font-bold uppercase tracking-widest text-theme-text">
            <span>Lodale</span>
            <span>•</span>
            <span>Trust</span>
            <span>•</span>
            <span>Transparency</span>
            <span>•</span>
          </div>
        </div>

        <div className="relative z-10 max-w-3xl px-4">
          <span className="text-[11px] font-bold tracking-widest text-moss-700 dark:text-[#E5C583] uppercase block mb-3">
            Our Process
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-normal text-theme-text leading-tight">
            How Lodale Works
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[14px] md:text-[15px] leading-relaxed text-theme-text-offset">
            Lodale is a digital platform that automates the entire renting journey. Instead of managing rent, leases, and repairs across separate tools, Lodale houses everything in one auditable workspace.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Role Toggle Switch */}
        <div className="mt-4 flex justify-center">
          <div className="inline-flex rounded-lg bg-theme-bg-offset p-1 border border-theme-border">
            <button
              onClick={() => handleRoleSwitch("tenant")}
              className={`rounded-md px-3 sm:px-6 py-2.5 text-[14px] font-semibold transition-all cursor-pointer ${role === "tenant"
                ? "bg-moss-700 text-white shadow-xs"
                : "text-theme-text-offset hover:text-theme-text"
                }`}
            >
              I am a Tenant
            </button>
            <button
              onClick={() => handleRoleSwitch("landlord")}
              className={`rounded-md px-3 sm:px-6 py-2.5 text-[14px] font-semibold transition-all cursor-pointer ${role === "landlord"
                ? "bg-moss-700 text-white shadow-xs"
                : "text-theme-text-offset hover:text-theme-text"
                }`}
            >
              I am a Landlord
            </button>
          </div>
        </div>

        {/* Split Column Visual Guide */}
        <div className="mt-14 grid gap-10 md:grid-cols-12 items-start">
          {/* Steps Timeline Left */}
          <div className="space-y-6 md:col-span-7">
            <h2 className="font-display text-xl font-bold text-theme-text mb-6">
              Your Rental Lifecycle on Lodale
            </h2>

            <div className="space-y-4">
              {steps.map(({ icon: Icon, title, desc }, index) => {
                const isActive = index === activeStepClamped;
                return (
                  <div
                    key={title}
                    onMouseEnter={() => setActiveStep(index)}
                    onClick={() => setActiveStep(index)}
                    className={`group cursor-pointer rounded-xl border p-5 text-left transition-all duration-300 ease-out hover:scale-[1.01] ${isActive
                      ? "border-moss-600/35 bg-moss-100/35 dark:bg-moss-700/10 shadow-none"
                      : "border-theme-border bg-theme-bg hover:border-moss-500/40 hover:bg-moss-100/5 dark:hover:bg-moss-700/5"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isActive
                            ? "bg-moss-700 text-white"
                            : "bg-theme-bg-offset text-moss-700 dark:text-moss-100"
                            }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="font-display text-md font-bold text-theme-text">
                          {title}
                        </h3>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 text-theme-text-offset/60 transition-transform duration-300 ${isActive
                          ? "translate-x-1.5 text-moss-700 dark:text-[#E5C583]"
                          : "group-hover:translate-x-1"
                          }`}
                      />
                    </div>
                    <p
                      className={`mt-3 text-[13px] leading-relaxed text-theme-text-offset transition-all ${isActive
                        ? "opacity-100"
                        : "opacity-80 group-hover:opacity-100"
                        }`}
                    >
                      {desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Interactive Visual Panel Right */}
          <div className="md:col-span-5 flex flex-col items-center justify-center md:sticky md:top-28 py-12 md:py-0">
            <span className="text-[10px] font-bold text-moss-600 dark:text-moss-500 tracking-wider uppercase mb-3">
              LIVE LODALE PREVIEW
            </span>
            <div ref={mockContainerRef} className="w-full flex justify-center items-center min-h-[300px] border border-dashed border-moss-700/25 rounded-2xl bg-theme-bg-offset/30 p-8 shadow-xs">
              {renderMockUi(activeMockType)}
            </div>
            <p className="mt-4 text-center text-[11px] text-theme-text-offset/70">
              Interactive preview. Hover or tap the steps on the left to see
              each Lodale feature.
            </p>
          </div>
        </div>

        {/* Bottom Call to Action */}
        <div className="mt-20 border-t border-theme-border pt-16 text-center">
          <h3 className="font-display text-xl font-bold text-theme-text">
            Ready to experience frictionless rental management?
          </h3>
          <p className="mt-2 text-[14px] text-theme-text-offset max-w-md mx-auto">
            Create your verified identity on Lodale today. Experience secure
            escrow caution deposits, direct ticket resolution, and seamless
            payments.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => navigate("/signup")} className="px-8">
              Sign Up Now
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
