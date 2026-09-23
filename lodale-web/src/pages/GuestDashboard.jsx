import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
  AlertTriangle,
  ChevronDown,
  UserCheck,
  Key,
  Star,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import ListingCard from "../components/ListingCard";
import ListingCardSkeleton from "../components/ListingCardSkeleton";
import Footer from "../components/Footer";
import { propertyService } from "../services/propertyService";
import heroBgLight from "../assets/lodale_hero_light.png";
import heroBg from "../assets/lodale_hero.png";
import { useTheme } from "../context/ThemeContext";

function HeroSection({ C, isDark }) {
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" id="hero">
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
        <h1 className="font-bold leading-[1.08] tracking-tight mb-5"
          style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "clamp(2.2rem,5.5vw,4.2rem)", color: C.textPrimary }}>
          Rent &amp; Manage Properties
          <br />
          <em className="not-italic" style={{ color: isDark ? C.goldLight : C.gold }}>with Complete</em>
          <br />
          Peace of Mind.
        </h1>

        <p className="max-w-xl mx-auto mb-8 leading-relaxed text-sm sm:text-base"
          style={{ color: C.textMuted }}>
          Direct landlord connections, zero agent search fees, verified property listings, and digital rent receipts across Nigeria.
        </p>

        <div className="flex justify-center items-center">
          <button
            onClick={() => scrollToSection("listings")}
            className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-105 hover:brightness-110 active:scale-95 shadow-xl cursor-pointer"
            style={{ background: C.btnBg, color: C.btnText }}
          >
            <Search className="w-4 h-4" />
            Explore Available Properties
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection({ C, isDark }) {
  const [activeRole, setActiveRole] = useState("tenant");
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const renderStepPreviewUi = (role, stepIdx) => {
    if (role === "tenant") {
      switch (stepIdx) {
        case 0:
          return (
            <div className="w-full rounded-2xl border p-5 shadow-inner transition-all duration-300 select-none bg-white/60 dark:bg-white/5 border-ink-200/60 dark:border-white/10">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-moss-700/20 dark:bg-[#E5C583]/20 flex items-center justify-center font-bold text-base text-moss-700 dark:text-[#E5C583]">
                    EO
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#07130d] text-[10px] font-bold">
                    <ShieldCheck className="h-3 w-3" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink-900 dark:text-white">Emeka Obi</h4>
                  <p className="text-[11px] text-ink-500 dark:text-cream-100/60">Verified Tenant</p>
                </div>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b pb-2 border-ink-100 dark:border-white/10">
                  <span className="text-ink-600 dark:text-cream-100/70">NIN Status</span>
                  <span className="font-semibold text-moss-700 dark:text-[#E5C583] flex items-center gap-1">
                    Verified ID <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  </span>
                </div>
                <div className="flex items-center justify-between border-b pb-2 border-ink-100 dark:border-white/10">
                  <span className="text-ink-600 dark:text-cream-100/70">Reliability Rating</span>
                  <span className="font-bold text-moss-700 dark:text-[#E5C583]">4.9 / 5.0 (3 Tenancies)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-600 dark:text-cream-100/70">Account Standing</span>
                  <span className="font-bold text-moss-700 dark:text-[#E5C583]">Excellent</span>
                </div>
              </div>
            </div>
          );
        case 1:
          return (
            <div className="w-full rounded-2xl border p-4 shadow-inner transition-all duration-300 select-none bg-white/60 dark:bg-white/5 border-ink-200/60 dark:border-white/10">
              <div className="flex items-center justify-between mb-2 border-b pb-2 border-ink-100 dark:border-white/10">
                <span className="text-xs font-bold text-ink-900 dark:text-white">Sunrise Apartments</span>
                <span className="text-xs font-bold text-moss-700 dark:text-[#E5C583]">₦1,800,000/yr</span>
              </div>
              <p className="text-[11px] text-ink-500 dark:text-cream-100/60 mb-3">Herbert Macaulay, Yaba • 2 Bedroom Flat</p>
              <div className="p-2.5 rounded-xl bg-moss-700/5 dark:bg-white/5 border border-moss-700/10 dark:border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-ink-700 dark:text-cream-100/80">House Owner: <strong>Ada Benson</strong></span>
                <span className="text-[11px] font-bold text-moss-700 dark:text-[#E5C583] flex items-center gap-1">
                  Direct Application Sent <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        case 2:
          return (
            <div className="w-full rounded-2xl border p-4 shadow-inner transition-all duration-300 select-none bg-white/60 dark:bg-white/5 border-ink-200/60 dark:border-white/10">
              <div className="border-b pb-2 mb-3 text-center border-ink-100 dark:border-white/10">
                <h5 className="font-bold text-xs uppercase tracking-wider text-ink-900 dark:text-white">Tenancy Agreement Contract</h5>
                <span className="text-[10px] text-ink-500 dark:text-cream-100/60 block mt-0.5">
                  Standard Legal Contract
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] text-ink-700 dark:text-cream-100/80 mb-3">
                <p><strong>Premises:</strong> Flat 4, 102 Herbert Macaulay, Yaba</p>
                <p><strong>Term:</strong> 1 Year (Aug 1, 2026 – Jul 31, 2027)</p>
                <p><strong>Rent:</strong> ₦1,800,000 + ₦200,000 Caution Deposit</p>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t pt-2 border-ink-100 dark:border-white/10 text-[10px]">
                <div className="border-r pr-1 border-ink-100 dark:border-white/10">
                  <p className="text-ink-400 dark:text-white/40">LANDLORD SIGNATURE</p>
                  <p className="font-bold italic text-moss-700 dark:text-[#E5C583]">Ada Benson ✓</p>
                </div>
                <div className="pl-1">
                  <p className="text-ink-400 dark:text-white/40">TENANT SIGNATURE</p>
                  <p className="font-bold italic text-moss-700 dark:text-[#E5C583]">Emeka Obi ✓</p>
                </div>
              </div>
            </div>
          );
        case 3:
          return (
            <div className="w-full rounded-2xl border p-4 shadow-inner transition-all duration-300 select-none bg-white/60 dark:bg-white/5 border-ink-200/60 dark:border-white/10">
              <div className="flex items-center justify-between border-b pb-2 mb-3 border-ink-100 dark:border-white/10">
                <div>
                  <h5 className="font-bold text-xs text-ink-900 dark:text-white">Rent Payment Receipt</h5>
                  <p className="text-[10px] text-ink-400 dark:text-white/40">INV-2026-0089</p>
                </div>
                <span className="text-moss-700 dark:text-[#E5C583] text-[11px] font-bold">
                  Paid &amp; Settled
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] mb-3">
                <div className="flex justify-between"><span className="text-ink-500 dark:text-cream-100/60">Amount Paid</span><span className="font-bold text-ink-900 dark:text-white">₦1,800,000.00</span></div>
                <div className="flex justify-between"><span className="text-ink-500 dark:text-cream-100/60">Bank Transfer Ref</span><span className="font-mono text-[10px] text-ink-700 dark:text-cream-100/80">TXN_880192801_MOSS</span></div>
              </div>
              <div className="p-2 rounded bg-moss-700/10 dark:bg-[#E5C583]/10 text-[10px] text-moss-700 dark:text-[#E5C583] font-semibold flex items-center justify-between">
                <span>Official Digital Receipt Issued</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        case 4:
        default:
          return (
            <div className="w-full rounded-2xl border p-4 shadow-inner transition-all duration-300 select-none bg-white/60 dark:bg-white/5 border-ink-200/60 dark:border-white/10">
              <div className="flex items-center justify-between mb-2 border-b pb-1.5 border-ink-100 dark:border-white/10">
                <span className="text-xs font-bold text-ink-900 dark:text-white">AC Unit Repair Ticket</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">Technician Assigned</span>
              </div>
              <p className="text-[10.5px] text-ink-600 dark:text-cream-100/70 mb-3">Contractor assigned • On-site repair scheduled</p>
              <div className="p-2 rounded bg-moss-700/10 dark:bg-[#E5C583]/10 flex items-center justify-between text-[11px] font-bold text-moss-700 dark:text-[#E5C583]">
                <span>Tenant &amp; Landlord Rating</span>
                <span>5.0 ★★★★★</span>
              </div>
            </div>
          );
      }
    } else {
      switch (stepIdx) {
        case 0:
          return (
            <div className="w-full rounded-2xl border p-4 shadow-inner transition-all duration-300 select-none bg-white/60 dark:bg-white/5 border-ink-200/60 dark:border-white/10">
              <div className="flex items-center gap-3 mb-3 border-b pb-2 border-ink-100 dark:border-white/10">
                <div className="h-10 w-10 rounded-full bg-moss-700/20 dark:bg-[#E5C583]/20 flex items-center justify-center font-bold text-sm text-moss-700 dark:text-[#E5C583]">
                  AB
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink-900 dark:text-white">Ada Benson</h4>
                  <p className="text-[11px] text-moss-700 dark:text-[#E5C583] font-semibold flex items-center gap-1">
                    Verified House Owner <CheckCircle2 className="w-3 h-3" />
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-ink-100/50 dark:bg-white/5">
                  <span className="block text-[10px] text-ink-500 dark:text-cream-100/60">Properties</span>
                  <span className="font-bold text-ink-900 dark:text-white">3 Verified</span>
                </div>
                <div className="p-2 rounded bg-ink-100/50 dark:bg-white/5">
                  <span className="block text-[10px] text-ink-500 dark:text-cream-100/60">Occupancy</span>
                  <span className="font-bold text-moss-700 dark:text-[#E5C583]">100% Occupied</span>
                </div>
              </div>
            </div>
          );
        case 1:
          return (
            <div className="w-full rounded-2xl border p-4 shadow-inner transition-all duration-300 select-none bg-white/60 dark:bg-white/5 border-ink-200/60 dark:border-white/10">
              <div className="flex items-center justify-between mb-3 border-b pb-2 border-ink-100 dark:border-white/10">
                <h5 className="font-bold text-xs text-ink-900 dark:text-white">Tenant Application Check</h5>
                <span className="text-[10px] font-bold text-moss-700 dark:text-[#E5C583]">NIN VERIFIED</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-ink-700 dark:text-cream-100/80 mb-3">
                <div className="flex justify-between"><span>Applicant</span><span className="font-bold text-ink-900 dark:text-white">Emeka Obi</span></div>
                <div className="flex justify-between"><span>Monthly Income</span><span className="font-semibold text-moss-700 dark:text-[#E5C583]">₦850,000 (Verified)</span></div>
                <div className="flex justify-between"><span>Reliability Score</span><span className="font-bold text-ink-900 dark:text-white">4.9 / 5.0</span></div>
              </div>
              <button className="w-full py-1.5 rounded bg-moss-700 text-white dark:bg-[#E5C583] dark:text-[#07130d] font-bold text-xs flex items-center justify-center gap-1">
                Approve Application <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        case 2:
          return (
            <div className="w-full rounded-2xl border p-4 shadow-inner transition-all duration-300 select-none bg-white/60 dark:bg-white/5 border-ink-200/60 dark:border-white/10">
              <h5 className="font-bold text-xs text-ink-900 dark:text-white mb-2">Tenancy Contract Terms</h5>
              <div className="space-y-1.5 text-[11px] text-ink-700 dark:text-cream-100/80 mb-3">
                <p>• Rent: ₦1,800,000 / annum</p>
                <p>• Caution Deposit: ₦200,000</p>
                <p>• Lease Period: 12 Months</p>
              </div>
              <div className="p-2 rounded bg-moss-700/10 dark:bg-[#E5C583]/15 text-[10.5px] font-bold text-moss-700 dark:text-[#E5C583] flex items-center justify-between">
                <span>Landlord Signed ✓</span>
                <span>Pending Tenant Signature</span>
              </div>
            </div>
          );
        case 3:
          return (
            <div className="w-full rounded-2xl border p-4 shadow-inner transition-all duration-300 select-none bg-white/60 dark:bg-white/5 border-ink-200/60 dark:border-white/10">
              <div className="text-center pb-2 mb-2 border-b border-ink-100 dark:border-white/10">
                <span className="text-[10px] text-ink-500 dark:text-cream-100/60 uppercase tracking-widest font-bold">Total Collections</span>
                <h4 className="font-bold text-lg text-ink-900 dark:text-white">₦5,400,000.00</h4>
              </div>
              <div className="space-y-1.5 text-[11px] mb-2">
                <div className="flex justify-between text-ink-700 dark:text-cream-100/80"><span>Flat 4, Yaba</span><span className="font-semibold text-moss-700 dark:text-[#E5C583]">Paid &amp; Settled</span></div>
                <div className="flex justify-between text-ink-700 dark:text-cream-100/80"><span>Payout Account</span><span className="font-medium text-ink-900 dark:text-white">GTBank (****4019)</span></div>
              </div>
            </div>
          );
        case 4:
        default:
          return (
            <div className="w-full rounded-2xl border p-4 shadow-inner transition-all duration-300 select-none bg-white/60 dark:bg-white/5 border-ink-200/60 dark:border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-ink-900 dark:text-white">Repair Request #MN-104</span>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">Technician Assigned</span>
              </div>
              <p className="text-[11px] text-ink-600 dark:text-cream-100/70 mb-2">Contractor: Adesina Plumbing Services</p>
              <div className="p-2 rounded bg-ink-100/60 dark:bg-white/5 text-[10.5px] flex items-center justify-between text-ink-800 dark:text-white">
                <span>Logged Repair Cost</span>
                <span className="font-bold text-moss-700 dark:text-[#E5C583]">₦35,000.00</span>
              </div>
            </div>
          );
      }
    }
  };

  const tenantSteps = [
    {
      step: "01",
      title: "Verify Your Identity Once",
      desc: "Confirm your identity with your NIN to get verified. House owners see you are legitimate right away, giving you fast-track responses.",
      icon: UserCheck,
      previewTitle: "NIN Identity Confirmation"
    },
    {
      step: "02",
      title: "Find Houses & Deal Direct",
      desc: "Browse verified houses in Lagos, Abuja, and major cities. Contact house owners directly without paying agent search fees or commission.",
      icon: Search,
      previewTitle: "Direct House Application"
    },
    {
      step: "03",
      title: "Sign Tenancy Agreement on Your Phone",
      desc: "Read and sign standard legal tenancy contracts directly from your mobile phone. Fast, legal, and stress-free.",
      icon: FileText,
      previewTitle: "Tenancy Agreement Contract"
    },
    {
      step: "04",
      title: "Automatic Rent Receipts",
      desc: "Pay your rent securely online. Get instant, timestamped legal receipts sent straight to your email and account ledger.",
      icon: Wallet,
      previewTitle: "Rent Payment Ledger"
    },
    {
      step: "05",
      title: "Easy Repairs & Rating Record",
      desc: "Snap a photo to report repairs to your landlord in seconds, and build a good renting record for your next home.",
      icon: Star,
      previewTitle: "Repair Requests & Tenancy History"
    }
  ];

  const landlordSteps = [
    {
      step: "01",
      title: "Verify Property Ownership",
      desc: "Confirm your property documents in minutes to get verified and win the trust of serious, high-quality tenants.",
      icon: Building2,
      previewTitle: "Property Ownership Verification"
    },
    {
      step: "02",
      title: "Screen Applicants Easily",
      desc: "Review tenant applications with verified NIN identity, job information, and rental history before giving out keys.",
      icon: UserCheck,
      previewTitle: "Tenant Application Screening"
    },
    {
      step: "03",
      title: "Send Tenancy Contracts Digitally",
      desc: "Set rent terms, caution deposits, and house rules into a legal contract signed digitally by both parties.",
      icon: FileText,
      previewTitle: "Digital Lease Contract"
    },
    {
      step: "04",
      title: "Automated Rent Collection",
      desc: "Receive rent directly into your bank account with clear automated payment tracking and instant digital receipts.",
      icon: LineChart,
      previewTitle: "Rent Collection & Bank Payouts"
    },
    {
      step: "05",
      title: "Manage Repairs Without Stress",
      desc: "Receive repair requests with photo updates, assign technicians, and keep track of repair expenses in one place.",
      icon: Wrench,
      previewTitle: "Property Repair Tracker"
    }
  ];

  const steps = activeRole === "tenant" ? tenantSteps : landlordSteps;
  const currentStep = steps[activeStepIndex] || steps[0];
  const StepIcon = currentStep.icon;

  return (
    <section id="how-it-works" className="min-h-screen flex flex-col justify-center py-24 transition-colors duration-300 relative overflow-hidden" style={{ background: isDark ? "#07130d" : C.bgMid }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Playfair Display',Georgia,serif", color: C.textPrimary }}>
            How Lodale Works for <em className="not-italic" style={{ color: isDark ? C.goldLight : C.gold }}>Tenants &amp; Landlords.</em>
          </h2>
          <p className="text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-8" style={{ color: C.textMuted }}>
            From NIN checks to tenancy agreements and rent receipts, everything is handled easily in one place.
          </p>

          <div className="inline-flex p-1.5 rounded-full border shadow-sm transition-all" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(7,19,13,0.05)", borderColor: C.border }}>
            <button
              onClick={() => { setActiveRole("tenant"); setActiveStepIndex(0); }}
              className={`px-7 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${activeRole === "tenant" ? "bg-moss-700 text-white dark:bg-[#E5C583] dark:text-[#07130d] shadow-md" : "text-ink-600 dark:text-cream-100/60 hover:text-ink-900 dark:hover:text-white"}`}
            >
              For Tenants
            </button>
            <button
              onClick={() => { setActiveRole("landlord"); setActiveStepIndex(0); }}
              className={`px-7 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${activeRole === "landlord" ? "bg-moss-700 text-white dark:bg-[#E5C583] dark:text-[#07130d] shadow-md" : "text-ink-600 dark:text-cream-100/60 hover:text-ink-900 dark:hover:text-white"}`}
            >
              For House Owners
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            {steps.map((item, idx) => {
              const isActive = activeStepIndex === idx;
              return (
                <div
                  key={item.step}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex gap-5 items-start ${isActive ? "shadow-lg" : "hover:border-moss-700/40 dark:hover:border-[#E5C583]/40"}`}
                  style={{
                    background: isDark ? (isActive ? "rgba(255,255,255,0.07)" : C.bgCard) : (isActive ? "#FFFFFF" : C.bgCard),
                    borderColor: isActive ? (isDark ? C.goldLight : C.gold) : C.border,
                  }}
                >
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${isActive ? "bg-moss-700 text-white dark:bg-[#E5C583] dark:text-[#07130d]" : "bg-ink-100 dark:bg-white/10 text-ink-600 dark:text-white/60"}`}>
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base mb-1" style={{ color: isActive ? (isDark ? C.goldLight : C.gold) : C.textPrimary }}>
                      {item.title}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-5 sticky top-28">
            <div className="p-8 rounded-3xl border shadow-xl flex flex-col justify-between min-h-[380px] relative overflow-hidden" style={{ background: isDark ? "#0D1F17" : "#FFFFFF", borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(7,19,13,0.12)" }}>
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <StepIcon className="w-40 h-40" style={{ color: C.gold }} />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-moss-700/15 dark:bg-[#E5C583]/15 text-moss-700 dark:text-[#E5C583]">
                    <StepIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-ink-900 dark:text-white">{currentStep.previewTitle}</h4>
                  </div>
                </div>

                <div className="mb-6">
                  {renderStepPreviewUi(activeRole, activeStepIndex)}
                </div>
              </div>

              <div className="pt-4 border-t border-ink-100 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-500 dark:text-white/60">
                  Step {activeStepIndex + 1} of {steps.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection({ C, isDark }) {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: "How does Lodale protect me from agent scams and fake house listings?",
      a: "Lodale connects you directly with verified house owners. We check property documents before any house goes live, so you never pay agent search fees or fall for double-rent agent scams."
    },
    {
      q: "Is it safe to verify my identity with my NIN on Lodale?",
      a: "Yes, 100% safe. Your NIN is encrypted and validated securely through official government verification services. We never store or show your raw NIN publicly; we only display a Verified ID mark so house owners know you are genuine."
    },
    {
      q: "How do digital tenancy agreements work?",
      a: "When a house owner approves your application, Lodale automatically generates a standard legal tenancy agreement. Both you and the house owner sign directly on your phones, creating a legally binding contract you can access anytime."
    },
    {
      q: "How do I pay rent and get my receipts?",
      a: "You pay your rent through secure online bank transfer or debit card. Your payment reflects immediately on your account ledger, and you receive an official digital receipt sent to your email."
    },
    {
      q: "How do I report house repairs when something breaks?",
      a: "Simply open a repair request on your dashboard, attach photos of the broken item, and submit. Your landlord gets notified immediately to assign a repair technician."
    },
    {
      q: "What is the Tenant Reliability Score?",
      a: "Paying rent on time and taking good care of your house builds your Reliability Score. When moving to your next home, your high score helps you get approved fast by new house owners."
    }
  ];

  return (
    <section id="faq" className="min-h-screen flex flex-col justify-center py-24 transition-colors duration-300" style={{ background: isDark ? "#07130d" : C.bgMid }}>
      <div className="max-w-4xl mx-auto px-5 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display',Georgia,serif", color: C.textPrimary }}>
            Frequently Asked <em className="not-italic" style={{ color: isDark ? C.goldLight : C.gold }}>Questions.</em>
          </h2>
          <p className="text-sm md:text-base leading-relaxed" style={{ color: C.textMuted }}>
            Clear answers about NIN verification, direct rent payments, tenancy agreements, and safety on Lodale.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border transition-all duration-300 overflow-hidden"
                style={{
                  background: isDark ? (isOpen ? "rgba(255,255,255,0.06)" : C.bgCard) : (isOpen ? "#FFFFFF" : C.bgCard),
                  borderColor: isOpen ? (isDark ? C.goldLight : C.gold) : C.border,
                  boxShadow: isOpen ? (isDark ? "none" : "0 10px 30px rgba(0,0,0,0.04)") : "none"
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full text-left p-6 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-bold text-base md:text-lg" style={{ color: isOpen ? (isDark ? C.goldLight : C.gold) : C.textPrimary }}>
                    {faq.q}
                  </span>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 bg-moss-700/20 text-moss-700 dark:bg-[#E5C583]/20 dark:text-[#E5C583]" : "bg-ink-100 dark:bg-white/10 text-ink-500 dark:text-cream-100/50"}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-0 border-t border-dashed border-ink-100 dark:border-white/10 mt-1">
                    <p className="text-xs md:text-sm leading-relaxed text-ink-600 dark:text-white/70 pt-4">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const TENANT_FEATURES = [
  {
    icon: Search,
    title: "Verified House Listings Only",
    desc: "Every home listed on Lodale undergoes ownership check. Rest easy knowing you are dealing with real house owners, shielding you from fake agents and double-rent scams.",
  },
  {
    icon: FileText,
    title: "Direct House Applications",
    desc: "Send your verified profile and ID check directly to house owners in one tap. Skip expensive agent search fees and speed up approvals.",
  },
  {
    icon: LineChart,
    title: "Automatic Rent & Receipts",
    desc: "Pay rent securely online. Every payment is logged instantly on your ledger with official digital receipts issued automatically.",
  },
  {
    icon: ShieldCheck,
    title: "House Owner Ratings",
    desc: "Review ratings from previous tenants before signing. Know in advance how quickly a house owner fixes repairs and handles caution deposits.",
  },
];

const LANDLORD_FEATURES = [
  {
    icon: Building2,
    title: "List Free, No Agency Cut",
    desc: "Post your property for free in under five minutes. Connect directly with verified prospective tenants, cutting out middleman agent fees and delays.",
  },
  {
    icon: Inbox,
    title: "Instant Tenant NIN Screening",
    desc: "Review tenant applications with verified NIN identity, job information, and rental history before giving out your keys.",
  },
  {
    icon: Wallet,
    title: "Automated Rent & Payouts",
    desc: "The system automatically issues rent invoices, tracks payment status, and sends automated receipts directly to your bank account.",
  },
  {
    icon: Wrench,
    title: "Easy Repair Management",
    desc: "Receive repair tickets with photos and status logs. Coordinate contractors and track resolutions online without endless phone calls.",
  },
];

export default function GuestDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(9);

  const [allListings, setAllListings] = useState([]);
  const [listingsError, setListingsError] = useState(null);

  const { isDark } = useTheme();

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

  const fetchPublicListings = async () => {
    setIsLoading(true);
    setListingsError(null);
    try {
      let apiProps = [];
      const apiRes = await propertyService.getProperties();
      if (Array.isArray(apiRes)) {
        apiProps = apiRes;
      } else if (apiRes && Array.isArray(apiRes.properties)) {
        apiProps = apiRes.properties;
      }

      const formatted = apiProps.map((item) => {
        if (!item) return null;
        const key = String(item.id || item.title);

        let landlordObj;
        if (item.landlord && typeof item.landlord === "object" && (item.landlord.first_name || item.landlord.name)) {
          const l = item.landlord;
          landlordObj = {
            id: l.id || null,
            name: l.name || `${l.first_name || ""} ${l.last_name || ""}`.trim() || "Verified House Owner",
            score: l.score ?? "New",
            reviews: l.reviews ?? 0,
            phone_number: l.phone_number || null
          };
        } else {
          landlordObj = { id: null, name: typeof item.landlord === "string" ? item.landlord : "Verified House Owner", score: "New", reviews: 0, phone_number: null };
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
      setListingsError(err.message || "We could not load properties right now.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicListings();
  }, []);

  const filteredListings = allListings.filter((listing) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = listing.title?.toLowerCase().includes(query);
    const locMatch = listing.location?.toLowerCase().includes(query);
    const landlordMatch = listing.landlord?.name?.toLowerCase().includes(query);
    return titleMatch || locMatch || landlordMatch;
  });

  const signUpAs = (role) => {
    navigate("/signup", { state: { presetRole: role } });
  };

  return (
    <div
      className="w-full text-ink-900 dark:text-white transition-colors duration-300 font-sans selection:bg-moss-700 selection:text-white dark:selection:bg-[#E5C583] dark:selection:text-[#07130d]"
      style={{ background: C.bg }}
    >
      <NavBar transparentMode={true} />

      <HeroSection C={C} isDark={isDark} />

      {/* Browse Listings Section */}
      <section id="listings" className="py-24 max-w-7xl mx-auto px-5 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: "'Playfair Display',Georgia,serif", color: C.textPrimary }}>
              Explore Available Houses
            </h2>
            <p className="text-xs md:text-sm max-w-md" style={{ color: C.textMuted }}>
              Transparent rent pricing, direct house owner contact, and verified property listings across Nigeria.
            </p>
          </div>

          <div className="w-full md:w-72">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-white/40" />
              <input
                type="text"
                placeholder="Search location, property, or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-moss-700 dark:focus:ring-[#E5C583] transition-all"
                style={{
                  background: isDark ? "rgba(255,255,255,0.06)" : "#FFFFFF",
                  borderColor: C.border,
                  color: C.textPrimary,
                }}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <ListingCardSkeleton key={n} />
            ))}
          </div>
        ) : listingsError ? (
          <div className="mt-12 text-center p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="h-14 w-14 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-4 text-rose-500 dark:text-rose-400">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-lg text-rose-900 dark:text-rose-200 mb-1">
              Listings unavailable
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300/80 max-w-xs leading-relaxed mb-5">
              We could not load properties right now. Please check your network connection or server status.
            </p>
            <button
              type="button"
              onClick={fetchPublicListings}
              className="px-6 py-2.5 rounded-xl bg-rose-700 dark:bg-rose-600 hover:bg-rose-800 text-white font-bold text-xs cursor-pointer transition-all shadow-md"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredListings.length > 0 ? (
          <>
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {filteredListings.slice(0, displayLimit).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {filteredListings.length > displayLimit && (
              <div className="flex flex-col items-center justify-center pt-12 pb-4">
                <button
                  onClick={() => setDisplayLimit((prev) => prev + 9)}
                  className="px-8 py-3 rounded-xl bg-moss-700 hover:bg-moss-800 dark:bg-[#E5C583] dark:hover:bg-[#d8b46e] text-white dark:text-[#07130D] font-bold text-xs tracking-wider uppercase shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  Load More Listings ({filteredListings.length - displayLimit} remaining)
                </button>
                <span className="text-[12px] text-ink-500 dark:text-cream-100/60 mt-3 font-medium">
                  Showing {Math.min(displayLimit, filteredListings.length)} of {filteredListings.length} listings
                </span>
              </div>
            )}
          </>
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

      {/* Interactive How It Works One-Pager Section */}
      <HowItWorksSection C={C} isDark={isDark} />

      {/* For Tenants Experience */}
      <section
        id="for-tenants"
        className="min-h-screen flex flex-col justify-center bg-[#0D1F17] px-8 py-32 overflow-hidden relative"
      >
        <div className="mx-auto max-w-[1400px] w-full flex flex-col lg:flex-row gap-16 lg:gap-24 relative z-10">
          <div className="lg:w-1/3 flex flex-col justify-center">
            <h3 className="text-xs font-bold tracking-widest text-[#E5C583] uppercase mb-4 block">
              Tenant Experience
            </h3>
            <h2 className="text-4xl md:text-5xl font-normal text-white leading-[1.1] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Secure,<br />Seamless,<br /><i className="text-[#E5C583]">Direct.</i>
            </h2>
            <p className="text-[14px] md:text-[15px] leading-relaxed text-white/70 max-w-sm">
              Take control of your tenancy. Apply with NIN verification, get instant rent receipts, and build a good renting score that makes finding your next home effortless.
            </p>
            <div className="mt-12">
              <button onClick={() => signUpAs("tenant")} className="px-8 py-3.5 rounded-full border border-white/20 text-white hover:bg-white hover:text-[#0D1F17] transition-colors text-[11px] font-bold tracking-widest uppercase outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer">
                Sign Up as Tenant
              </button>
            </div>

            <div className="mt-16 pt-8 border-t border-white/10">
              <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-3 font-semibold">Key Feature</span>
              <p className="text-white/90 font-medium italic text-[16px] md:text-[18px] leading-relaxed" style={{ fontFamily: "'Playfair Display', serif" }}>
                "Report repair issues with pictures and track resolutions directly on your app."
              </p>
            </div>
          </div>

          <div className="lg:w-2/3 grid gap-x-12 gap-y-16 sm:grid-cols-2 place-content-center">
            {TENANT_FEATURES.map(({ title, desc }, idx) => (
              <div
                key={title}
                className="group flex flex-col pt-6 border-t border-white/10 hover:border-[#E5C583]/40 transition-colors duration-300"
              >
                <div className="text-[3.5rem] leading-[0.8] font-normal text-white/15 mb-6 transition-colors duration-300 group-hover:text-[#E5C583]/40" style={{ fontFamily: "'Playfair Display', serif" }}>
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

      {/* For House Owners Experience */}
      <section
        id="for-landlords"
        className="min-h-screen flex flex-col justify-center py-32 px-8 overflow-hidden relative transition-colors duration-300"
        style={{ background: isDark ? C.bg : "#F4F6F6" }}
      >
        <div className="mx-auto max-w-[1400px] w-full flex flex-col lg:flex-row gap-16 lg:gap-24 relative z-10">
          <div className="lg:w-1/3 flex flex-col justify-center">
            <h3 className="text-xs font-bold tracking-widest text-moss-700 dark:text-[#E5C583] uppercase mb-4 block">
              House Owner Experience
            </h3>
            <h2 className="text-4xl md:text-5xl font-normal text-ink-900 dark:text-white leading-[1.1] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Professional.<br />Profitable.<br /><i className="text-moss-700 dark:text-[#E5C583]">Direct.</i>
            </h2>
            <p className="text-[14px] md:text-[15px] leading-relaxed text-ink-600 dark:text-white/70 max-w-sm">
              Check tenant NIN identity, send digital tenancy agreements, collect rent directly to your bank account, and manage repair requests without middleman stress.
            </p>
            <div className="mt-12">
              <button onClick={() => signUpAs("landlord")} className="px-8 py-3.5 rounded-full border border-ink-200 dark:border-white/20 text-[#262626] dark:text-white hover:bg-ink-900 hover:text-white dark:hover:bg-white dark:hover:text-[#07130d] transition-colors text-[11px] font-bold tracking-widest uppercase outline-none focus-visible:ring-2 focus-visible:ring-ink-900 dark:focus-visible:ring-white cursor-pointer">
                Sign Up as House Owner
              </button>
            </div>

            <div className="mt-16 pt-8 border-t border-ink-100 dark:border-white/10">
              <span className="text-[10px] text-ink-400 dark:text-white/40 uppercase tracking-widest block mb-3 font-semibold">Direct Payouts</span>
              <p className="text-ink-900 dark:text-white/90 font-medium italic text-[16px] md:text-[18px] leading-relaxed" style={{ fontFamily: "'Playfair Display',serif" }}>
                "Rent collections and digital payment receipts run automatically to your bank account."
              </p>
            </div>
          </div>

          <div className="lg:w-2/3 grid gap-x-12 gap-y-16 sm:grid-cols-2 place-content-center">
            {LANDLORD_FEATURES.map(({ title, desc }, idx) => (
              <div
                key={title}
                className="group flex flex-col pt-6 border-t border-ink-100 dark:border-white/5 hover:border-moss-700/30 dark:hover:border-[#E5C583]/30 transition-colors duration-300"
              >
                <div className="text-[3.5rem] leading-[0.8] font-normal text-ink-200/50 dark:text-white/10 mb-6 transition-colors duration-300 group-hover:text-moss-700/40 dark:group-hover:text-[#E5C583]/40" style={{ fontFamily: "'Playfair Display', serif" }}>
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

      {/* Frequently Asked Questions Section */}
      <FaqSection C={C} isDark={isDark} />

      <Footer />
    </div>
  );
}
