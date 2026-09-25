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
  HelpCircle,
  Home,
  CreditCard,
  ArrowLeft,
  Users
} from "lucide-react";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import ListingCard from "../components/ListingCard";
import ListingCardSkeleton from "../components/ListingCardSkeleton";
import Footer from "../components/Footer";
import { propertyService } from "../services/propertyService";
import heroBg from "../assets/lodale_hero.png";
import heroBuildingImg from "../assets/lodale_hero_building.png";
import { useTheme } from "../context/ThemeContext";

function HeroSection({ C, isDark }) {
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const heroBg_light = "#EDE8DF";
  const heroBg_dark = "#07130D";
  const bg = isDark ? heroBg_dark : heroBg_light;

  return (
    <section
      id="hero"
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: "620px",
        maxHeight: "1020px",
        overflow: "hidden",
        background: bg,
      }}
    >
      {/* Right photo - covers right 58% on desktop, full width on mobile */}
      <div
        className="absolute top-0 right-0 bottom-0 w-full md:w-[58%] z-[1] pointer-events-none"
      >
        <img
          src={isDark ? heroBg : heroBuildingImg}
          alt="Modern luxury residential building"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            display: "block",
          }}
        />
        {/* Desktop Gradient */}
        <div
          className="absolute inset-0 hidden md:block"
          style={{
            background: isDark
              ? "linear-gradient(90deg,#07130D 0%,rgba(7,19,13,0.92) 12%,rgba(7,19,13,0.62) 36%,rgba(7,19,13,0.18) 62%,transparent 84%)"
              : "linear-gradient(90deg,#EDE8DF 0%,rgba(237,232,223,0.92) 12%,rgba(237,232,223,0.62) 36%,rgba(237,232,223,0.18) 62%,transparent 84%)",
          }}
        />
        {/* Mobile Gradient (stronger to make text readable) */}
        <div
          className="absolute inset-0 md:hidden"
          style={{
            background: isDark
              ? "linear-gradient(90deg,#07130D 0%,rgba(7,19,13,0.95) 40%,rgba(7,19,13,0.7) 70%,transparent 100%)"
              : "linear-gradient(90deg,#EDE8DF 0%,rgba(237,232,223,0.95) 40%,rgba(237,232,223,0.7) 70%,transparent 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0, right: 0, bottom: 0,
            height: "20%",
            background: isDark
              ? "linear-gradient(to top,#07130D 0%,transparent 100%)"
              : "linear-gradient(to top,#EDE8DF 0%,transparent 100%)",
          }}
        />
      </div>

      {/* Inscription top-right */}
      <div
        className="hidden md:block"
        style={{
          position: "absolute",
          top: "17%",
          right: "3.5%",
          zIndex: 8,
          textAlign: "right",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(0.6rem,0.85vw,0.78rem)",
            lineHeight: 1.65,
            color: isDark ? "rgba(229,197,131,0.45)" : "rgba(28,25,23,0.28)",
            letterSpacing: "0.01em",
          }}
        >
          Quality homes.<br />Stress-free<br />management.
        </p>
        <div
          style={{
            marginTop: "7px",
            height: "1px",
            width: "38px",
            marginLeft: "auto",
            background: isDark ? "rgba(229,197,131,0.22)" : "rgba(28,25,23,0.14)",
          }}
        />
      </div>

      {/* Left content column - responsive width */}
      <div
        className="relative z-[5] h-full flex flex-col justify-center box-border w-[90%] md:w-[50%] lg:w-[40%]"
        style={{
          paddingLeft: "clamp(20px,6.5vw,94px)",
          paddingRight: "clamp(12px,2vw,32px)",
          paddingTop: "80px",
          paddingBottom: "48px",
        }}
      >
        <p
          style={{
            margin: "0 0 20px 0",
            fontFamily: "'Inter', sans-serif",
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: isDark ? "rgba(229,197,131,0.5)" : "rgba(28,25,23,0.35)",
          }}
        >
          Property Management System
        </p>

        <h1
          style={{
            margin: "0 0 22px 0",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2.8rem,5.4vw,5.2rem)",
            fontWeight: 400,
            lineHeight: 1.06,
            letterSpacing: "-0.025em",
            color: isDark ? "#EDE8DF" : "#1C1917",
          }}
        >
          Better Living<br />
          Starts with<br />
          Better{" "}
          <em style={{ fontStyle: "italic", color: isDark ? "#E5C583" : "#2C4633" }}>
            Management
          </em>
        </h1>

        <p
          style={{
            margin: "0 0 38px 0",
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(0.8rem,1.1vw,0.9rem)",
            lineHeight: 1.76,
            fontWeight: 400,
            color: isDark ? "rgba(237,232,223,0.52)" : "rgba(28,25,23,0.5)",
            maxWidth: "330px",
          }}
        >
          Lodale is a modern property management platform that makes it easy to find, rent, and manage properties for tenants and landlords.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "22px", flexWrap: "wrap" }}>
          <button
            id="hero-explore-btn"
            onClick={() => scrollToSection("listings")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              padding: "11px 22px",
              background: isDark ? "#EDE8DF" : "#1C1917",
              color: isDark ? "#1C1917" : "#EDE8DF",
              border: "none",
              borderRadius: "5px",
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.03em",
              cursor: "pointer",
              outline: "none",
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            Explore Properties
            <ArrowRight style={{ width: "13px", height: "13px" }} />
          </button>

          <button
            id="hero-howitworks-btn"
            onClick={() => scrollToSection("features")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              padding: "0",
              background: "transparent",
              border: "none",
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              fontWeight: 500,
              color: isDark ? "rgba(237,232,223,0.55)" : "rgba(28,25,23,0.5)",
              cursor: "pointer",
              outline: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = isDark ? "#EDE8DF" : "#1C1917"; }}
            onMouseLeave={e => { e.currentTarget.style.color = isDark ? "rgba(237,232,223,0.55)" : "rgba(28,25,23,0.5)"; }}
          >
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                border: isDark ? "1.5px solid rgba(237,232,223,0.2)" : "1.5px solid rgba(28,25,23,0.18)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="8" height="9" viewBox="0 0 8 9" fill="none">
                <path d="M2 1.5L7 4.5L2 7.5V1.5Z" fill={isDark ? "rgba(237,232,223,0.65)" : "rgba(28,25,23,0.6)"} />
              </svg>
            </span>
            How it works
          </button>
        </div>
      </div>
    </section>
  );
}


function HowItWorksSection({ C, isDark }) {
  const [activeStep, setActiveStep] = useState(0);

  const renderPhoneScreen = () => {
    switch (activeStep) {
      case 0:
        // Property Listings
        return (
          <div style={{ flex: 1, padding: "20px 20px 0 20px", display: "flex", flexDirection: "column", gap: "16px", background: "#FAFAFA", fontFamily: "'Inter', sans-serif", zIndex: 10, animation: "fadeIn 0.3s ease-out", overflowY: "hidden" }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }`}</style>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <div>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "2px" }}>Good morning,</div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#1C1917", letterSpacing: "-0.5px" }}>User</div>
              </div>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", background: "#E5E5E5" }}>
                <img src="https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80" alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#1C1917" }}>Your Properties</div>
              <div style={{ fontSize: "12px", color: "#666", fontWeight: "500" }}>View all</div>
            </div>

            {/* Main Property Card */}
            <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "12px", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)", flexShrink: 0 }}>
              <div style={{ width: "100%", height: "130px", borderRadius: "12px", background: "#E5E5E5", marginBottom: "12px", overflow: "hidden" }}>
                <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Living room" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: "0 4px" }}>
                <div style={{ fontSize: "11px", color: "#888", fontWeight: "500", marginBottom: "6px" }}>Lekki Phase 1, Lagos</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#1C1917" }}>2 Bedroom Apartment</div>
                  <div style={{ background: "#E8F5E9", color: "#2E7D32", fontSize: "10px", fontWeight: "600", padding: "4px 10px", borderRadius: "12px" }}>Occupied</div>
                </div>
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><span style={{ fontSize: "14px", fontWeight: "700", color: "#1C1917" }}>₦ 1,800,000</span> <span style={{ fontSize: "12px", color: "#888" }}>/ year</span></div>
                  <ArrowRight style={{ width: "14px", height: "14px", color: "#1C1917" }} />
                </div>
              </div>
            </div>

            {/* Second Property Card (Partially Visible) */}
            <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "12px", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)", flexShrink: 0, opacity: 0.9 }}>
              <div style={{ width: "100%", height: "90px", borderRadius: "12px", background: "#E5E5E5", marginBottom: "10px", overflow: "hidden" }}>
                <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="House" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: "0 4px" }}>
                <div style={{ fontSize: "11px", color: "#888", fontWeight: "500", marginBottom: "4px" }}>Victoria Island</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#1C1917" }}>4 Bed Duplex</div>
                  <div style={{ background: "#F5F5F5", color: "#666", fontSize: "10px", fontWeight: "600", padding: "4px 10px", borderRadius: "12px" }}>Vacant</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        // Automated Application Tracking (Dense UI)
        return (
          <div style={{ flex: 1, padding: "20px 20px 0 20px", display: "flex", flexDirection: "column", gap: "16px", background: "#0C1410", fontFamily: "'Inter', sans-serif", zIndex: 10, animation: "fadeIn 0.3s ease-out", overflowY: "hidden" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ArrowLeft style={{ width: "16px", height: "16px", color: "#FFFFFF" }} />
                <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#FFF" }}>Emeka Obi</h3>
              </div>
              <span style={{ fontSize: "10px", background: "rgba(229,197,131,0.2)", color: "#E5C583", padding: "4px 8px", borderRadius: "12px", fontWeight: "bold" }}>Pending</span>
            </div>

            {/* Top Cards */}
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1, background: "#11261B", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>Income (Verified)</p>
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#FFF" }}>₦850,000/mo</p>
              </div>
              <div style={{ flex: 1, background: "#11261B", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>Move-in Date</p>
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#FFF" }}>Oct 1, 2026</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-[#11261B] p-5 rounded-[20px] border border-white/5 relative shadow-xl">
              <h4 className="text-[9px] uppercase tracking-[0.2em] text-[#E5C583] font-bold mb-4 ml-5">Application Journey</h4>
              <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                <div className="relative flex items-start gap-3">
                  <div className="absolute -left-5 top-0 h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#E5C583] text-[#0C1410]">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div>
                    <h5 className="text-[12px] font-bold text-white">Application Submitted</h5>
                    <p className="text-[10px] text-stone-400 mt-0.5">Profile & Income Verified</p>
                  </div>
                </div>
                <div className="relative flex items-start gap-3">
                  <div className="absolute -left-5 top-0 h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#E5C583] text-[#0C1410]">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div>
                    <h5 className="text-[12px] font-bold text-white">Identity Check Passed</h5>
                    <p className="text-[10px] text-stone-400 mt-0.5">NIMC Official NIN Match</p>
                  </div>
                </div>
                <div className="relative flex items-start gap-3">
                  <div className="absolute -left-5 top-0 h-4 w-4 rounded-full flex items-center justify-center border-2 border-[#E5C583] bg-[#11261B]">
                    <div className="w-1 h-1 rounded-full bg-[#E5C583]" />
                  </div>
                  <div className="w-full">
                    <h5 className="text-[12px] font-bold text-white">Pending Approval</h5>
                    <p className="text-[10px] text-stone-400 mt-0.5 mb-3">Awaiting your final review.</p>
                    <button className="w-full py-2 bg-[#E5C583] text-[#0C1410] font-bold text-[10px] rounded-lg shadow-sm">
                      Approve Applicant
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: "12px", fontWeight: "bold", color: "#FFF", marginTop: "4px", paddingLeft: "4px" }}>Other Applicants</h4>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#11261B", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#FFF" }}>Sarah Johnson</p>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>Declined • Insufficient Income</p>
              </div>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.2)", display: "flex", alignItems: "center", justifyItems: "center" }}>
                <span style={{ margin: "auto", fontSize: "12px", color: "#EF4444" }}>×</span>
              </div>
            </div>
          </div>
        );

      case 2:
        // Digital Tenancy Contracts (Dense UI)
        return (
          <div style={{ flex: 1, padding: "20px 20px 0 20px", display: "flex", flexDirection: "column", gap: "16px", background: "#FAFAFA", fontFamily: "'Inter', sans-serif", zIndex: 10, animation: "fadeIn 0.3s ease-out", overflowY: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#1C1917", letterSpacing: "-0.5px" }}>Contracts</h3>
              <span style={{ fontSize: "10px", background: "rgba(0,0,0,0.05)", padding: "4px 8px", borderRadius: "12px", fontWeight: "bold" }}>2 Action Required</span>
            </div>

            <div className="bg-white p-5 rounded-[20px] border border-stone-200 shadow-lg">
              <div className="text-center border-b border-stone-100 pb-4 mb-4">
                <FileText className="w-6 h-6 text-[#2C4633] mx-auto mb-2" />
                <h4 className="text-[12px] font-bold text-[#1C1917] uppercase tracking-wider">Tenancy Agreement</h4>
                <p className="text-[10px] text-stone-500 mt-1">1 Year Lease (Aug 2026 – Jul 2027)</p>
              </div>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-stone-500">Annual Rent</span>
                  <span className="font-bold text-[#1C1917]">₦1,800,000</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-stone-500">Caution Deposit</span>
                  <span className="font-bold text-[#1C1917]">₦200,000</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-[#F4F7F5] rounded-xl border border-[#E2EBE5] text-center">
                  <p className="text-[8px] uppercase tracking-widest text-stone-500 font-bold mb-1.5">Landlord</p>
                  <p className="text-[10px] font-bold text-[#2C4633] italic">Ada Benson ✓</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-dashed border-stone-300 text-center flex flex-col justify-center cursor-pointer hover:bg-stone-50 shadow-sm">
                  <p className="text-[8px] uppercase tracking-widest text-stone-500 font-bold mb-1.5">Tenant</p>
                  <p className="text-[10px] font-semibold text-[#1C1917]">Tap to Sign</p>
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: "13px", fontWeight: "bold", color: "#1C1917", marginTop: "4px", paddingLeft: "4px" }}>Signed Contracts</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFFFF", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText style={{ width: "14px", height: "14px", color: "#2E7D32" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: "bold", color: "#1C1917" }}>Flat 2 Lease.pdf</p>
                    <p style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>Signed Aug 15, 2026</p>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFFFF", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText style={{ width: "14px", height: "14px", color: "#2E7D32" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: "bold", color: "#1C1917" }}>Flat 5 Lease.pdf</p>
                    <p style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>Signed Mar 10, 2026</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        // Maintenance & Insights (Dense UI)
        return (
          <div style={{ flex: 1, padding: "20px 20px 0 20px", display: "flex", flexDirection: "column", gap: "16px", background: "#0C1410", fontFamily: "'Inter', sans-serif", zIndex: 10, animation: "fadeIn 0.3s ease-out", overflowY: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#FFF", letterSpacing: "-0.5px" }}>Maintenance</h3>
              <span style={{ fontSize: "10px", background: "rgba(239, 68, 68, 0.2)", color: "#EF4444", padding: "4px 8px", borderRadius: "12px", fontWeight: "bold" }}>1 Urgent</span>
            </div>

            {/* Quick Stats */}
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1, background: "#11261B", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>MTD Expenses</p>
                <p style={{ fontSize: "14px", fontWeight: "bold", color: "#FFF" }}>₦145,000</p>
              </div>
              <div style={{ flex: 1, background: "#11261B", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>Open Tickets</p>
                <p style={{ fontSize: "14px", fontWeight: "bold", color: "#FFF" }}>3 Active</p>
              </div>
            </div>

            {/* Active Urgent Ticket */}
            <div className="bg-[#11261B] p-4 rounded-[20px] border border-white/5 shadow-xl">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-[12px] font-bold text-white">Repair #MN-104</h4>
                  <p className="text-[9px] text-stone-400 mt-1">AC Unit Malfunction</p>
                </div>
                <span className="px-2 py-1 rounded-full bg-red-950 text-red-400 text-[8px] font-bold uppercase tracking-wider">
                  Urgent
                </span>
              </div>

              <div className="flex gap-3 mb-4">
                <div className="w-[50px] h-[50px] rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                  <img src="https://images.unsplash.com/photo-1599619351208-3e6c839d6828?auto=format&fit=crop&w=200&q=80" alt="AC Unit" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 p-2 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-[8px] uppercase tracking-widest text-stone-400 font-bold mb-1">Contractor</p>
                  <p className="text-[10px] font-bold text-white">Adesina AC Repair</p>
                  <p className="text-[9px] font-semibold text-[#E5C583] mt-1">ETA: 2:00 PM</p>
                </div>
              </div>

              <button className="w-full py-2 bg-[#E5C583] text-[#0C1410] font-bold text-[11px] rounded-lg flex justify-center items-center gap-2 shadow-sm">
                <Wrench className="w-3 h-3" /> Approve ₦35k Quote
              </button>
            </div>

            {/* Past Ticket */}
            <h4 style={{ fontSize: "12px", fontWeight: "bold", color: "#FFF", marginTop: "2px", paddingLeft: "4px" }}>Recent History</h4>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#11261B", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#FFF" }}>Leaking Faucet (#MN-103)</p>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>Fixed • ₦12,000 paid</p>
              </div>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(34, 197, 94, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 style={{ width: "12px", height: "12px", color: "#22c55e" }} />
              </div>
            </div>

          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section id="features" style={{
      backgroundColor: isDark ? "#07130D" : "#F7F5EF",
      backgroundImage: isDark ? `linear-gradient(90deg, #07130D 0%, #07130D 50%, rgba(7,19,13,0.8) 75%, rgba(7,19,13,0.4) 100%), url('https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')` : "none",
      backgroundSize: "cover",
      backgroundPosition: "center right",
      backgroundRepeat: "no-repeat",
      color: isDark ? "#EDE8DF" : "#1C1917",
      padding: "clamp(80px, 12vw, 160px) clamp(20px, 6vw, 92px) 40px clamp(20px, 6vw, 92px)", // reduced bottom padding
      overflow: "hidden",
      position: "relative"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: "40px",
        alignItems: "center",
        position: "relative",
        zIndex: 2
      }}>

        {/* Left Column: Text & CTA */}
        <div className="flex-[1_1_300px] min-w-[300px] pr-0 lg:pr-10">
          <span style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            fontWeight: 600,
            color: isDark ? "rgba(229,197,131,0.5)" : "rgba(28,25,23,0.5)",
            display: "block",
            marginBottom: "16px"
          }}>
            FEATURES
          </span>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2.4rem, 3.8vw, 3.8rem)",
            fontWeight: 400,
            lineHeight: 1.1,
            marginBottom: "24px",
            color: isDark ? "#EDE8DF" : "#1C1917"
          }}>
            Everything You Need<br />in One Place
          </h2>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "15px",
            lineHeight: 1.6,
            color: isDark ? "rgba(237,232,223,0.7)" : "rgba(28,25,23,0.7)",
            maxWidth: "340px"
          }}>
            Whether you're a tenant or landlord, Lodale gives you the tools to stay in control — anytime, anywhere.
          </p>
        </div>

        {/* Middle Column: Interactive Features List */}
        <div style={{ flex: "1 1 300px", minWidth: "300px", display: "flex", flexDirection: "column", gap: "20px", paddingTop: "20px" }}>

          {[
            {
              icon: Home,
              title: "Property Listings",
              desc: "Discover verified properties with ease."
            },
            {
              icon: CreditCard,
              title: "Automated Application Tracking",
              desc: "Review tenant NINs and income verification instantly in real-time."
            },
            {
              icon: FileText,
              title: "Digital Tenancy Contracts",
              desc: "Review lease terms and sign legally binding contracts online."
            },
            {
              icon: LineChart,
              title: "Real-Time Insights",
              desc: "Log repairs, track expenses, and monitor financial performance."
            }
          ].map((feature, idx) => {
            const IconComponent = feature.icon;
            const isActive = activeStep === idx;
            return (
              <div
                key={idx}
                onClick={() => setActiveStep(idx)}
                style={{
                  display: "flex",
                  gap: "20px",
                  alignItems: "flex-start",
                  cursor: "pointer",
                  padding: "16px",
                  borderRadius: "16px",
                  backgroundColor: isActive ? (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)") : "transparent",
                  border: isActive ? (isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)") : "1px solid transparent",
                  transition: "all 0.3s ease",
                  opacity: isActive ? 1 : 0.5
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.opacity = 0.8; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.opacity = 0.5; }}
              >
                <IconComponent style={{ width: "24px", height: "24px", color: isActive ? (isDark ? "#E5C583" : "#2C4633") : (isDark ? "#EDE8DF" : "#1C1917"), flexShrink: 0, marginTop: "2px", strokeWidth: 1.5 }} />
                <div>
                  <h4 style={{ fontFamily: "'Inter', sans-serif", fontSize: "15px", fontWeight: 600, marginBottom: "6px", color: isActive ? (isDark ? "#E5C583" : "#2C4633") : (isDark ? "#EDE8DF" : "#1C1917") }}>
                    {feature.title}
                  </h4>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: isDark ? "rgba(237,232,223,0.7)" : "rgba(28,25,23,0.6)", margin: 0, maxWidth: "220px", lineHeight: 1.5 }}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Exact Tilted iPhone Mockup (Interactive inner screen) */}
        <div className="flex-[1_1_300px] min-w-[300px] relative h-[540px] flex justify-center lg:justify-end mt-10 lg:mt-0">

          <div className="absolute top-[20px] right-[-20px] sm:right-[auto] lg:right-[-50px] w-[340px] h-[760px]" style={{
            backgroundColor: (activeStep === 1 || activeStep === 3) ? "#0C1410" : "#FAFAFA", // Adapts to inner screen dark/light mode
            color: (activeStep === 1 || activeStep === 3) ? "#FFFFFF" : "#1C1917", // Fix text color bleeding in global dark mode
            borderRadius: "50px",
            border: "12px solid #202020",
            boxShadow: "20px 40px 80px rgba(0,0,0,0.8), inset 0 0 0 2px #333",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transform: "rotate(9deg)", // more tilt
            transformOrigin: "center center",
            zIndex: 10,
            transition: "background-color 0.3s ease"
          }}>
            {/* The Notch */}
            <div style={{
              position: "absolute",
              top: "-2px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "140px",
              height: "28px",
              backgroundColor: "#202020",
              borderBottomLeftRadius: "20px",
              borderBottomRightRadius: "20px",
              zIndex: 30
            }} />

            {/* Top Status Bar */}
            <div style={{
              padding: "16px 24px 8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              height: "48px",
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: (activeStep === 1 || activeStep === 3) ? "#FFFFFF" : "#1C1917", // Dynamic status bar color
              zIndex: 20
            }}>
              <span style={{ letterSpacing: "-0.5px" }}>9:41</span>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <div style={{ width: "16px", height: "10px", backgroundColor: (activeStep === 1 || activeStep === 3) ? "#FFFFFF" : "#1C1917", borderRadius: "2px" }} />
                <div style={{ width: "16px", height: "10px", backgroundColor: (activeStep === 1 || activeStep === 3) ? "#FFFFFF" : "#1C1917", borderRadius: "2px" }} />
              </div>
            </div>

            {/* INTERACTIVE UI SCREEN */}
            {renderPhoneScreen()}

            {/* Bottom Tab Bar (Visible on all screens) */}
            <div style={{ height: "80px", borderTop: "1px solid rgba(0,0,0,0.05)", background: (activeStep === 1 || activeStep === 3) ? "#11261B" : "#FFFFFF", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "0 16px 20px", zIndex: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: (activeStep === 1 || activeStep === 3) ? "#E5C583" : "#1C1917" }}><Home style={{ width: "22px", height: "22px", margin: "0 auto" }} /><span style={{ fontSize: "10px", fontWeight: "600", textAlign: "center" }}>Home</span></div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: (activeStep === 1 || activeStep === 3) ? "rgba(255,255,255,0.4)" : "#A0A0A0" }}><Building2 style={{ width: "22px", height: "22px", margin: "0 auto" }} /><span style={{ fontSize: "10px", fontWeight: "500", textAlign: "center" }}>Properties</span></div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: (activeStep === 1 || activeStep === 3) ? "rgba(255,255,255,0.4)" : "#A0A0A0" }}><CreditCard style={{ width: "22px", height: "22px", margin: "0 auto" }} /><span style={{ fontSize: "10px", fontWeight: "500", textAlign: "center" }}>Payments</span></div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: (activeStep === 1 || activeStep === 3) ? "rgba(255,255,255,0.4)" : "#A0A0A0" }}><Users style={{ width: "22px", height: "22px", margin: "0 auto" }} /><span style={{ fontSize: "10px", fontWeight: "500", textAlign: "center" }}>Profile</span></div>
            </div>

            <div style={{ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", width: "120px", height: "5px", borderRadius: "3px", backgroundColor: (activeStep === 1 || activeStep === 3) ? "rgba(255,255,255,0.2)" : "#E5E5E5", zIndex: 30 }} />
          </div>
        </div>

      </div>
    </section>
  );
}






function AboutLodaleSection({ C, isDark }) {
  return (
    <section id="about" style={{
      position: "relative",
      padding: "clamp(80px, 12vw, 160px) clamp(20px, 6vw, 92px)",
      minHeight: "750px",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      backgroundColor: "#07130D",
      overflow: "hidden"
    }}>
      {/* Full bleed background image */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <img 
          src="/nigerian_couple_keys.png" 
          alt="Happy Nigerian couple holding keys to their new apartment" 
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "100% center", display: "block" }} 
        />
        {/* Gradient overlay to make text pop on the left side */}
        <div style={{ 
          position: "absolute", 
          inset: 0, 
          background: "linear-gradient(90deg, #07130D 0%, rgba(7,19,13,0.95) 55%, rgba(7,19,13,0) 100%)" 
        }} />
      </div>

      {/* Content over the image */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: "600px" }}>
        <span style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          fontWeight: 600,
          color: "rgba(229,197,131,0.8)",
          display: "block",
          marginBottom: "20px"
        }}>
          ABOUT LODALE
        </span>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
          fontWeight: 400,
          lineHeight: 1.15,
          color: "#EDE8DF",
          marginBottom: "36px"
        }}>
          Renting made safe,<br />simple, and transparent.
        </h2>
        
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px"
        }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "16px",
            lineHeight: 1.7,
            color: "rgba(237,232,223,0.8)",
          }}>
            Lodale removes the uncertainty from renting by building trust directly into the platform. We verify every user's identity through NIN before they can even use the system, so you always know exactly who you are dealing with.
          </p>
          <div style={{ width: "40px", height: "1px", backgroundColor: "rgba(229,197,131,0.3)" }}></div>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "16px",
            lineHeight: 1.7,
            color: "rgba(237,232,223,0.8)"
          }}>
            <strong style={{ color: "#E5C583", fontWeight: 600 }}>For tenants</strong>, this means you can move in with confidence. You get access to real, verified reviews of properties and landlords left by previous tenants before you make a decision.
          </p>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "16px",
            lineHeight: 1.7,
            color: "rgba(237,232,223,0.8)"
          }}>
            <strong style={{ color: "#E5C583", fontWeight: 600 }}>For landlords</strong>, you get the full picture. Review a tenant's trust profile and rental history, complete with ratings from past landlords, so you only accept reliable people into your property.
          </p>
        </div>
      </div>
    </section>
  );
}


function FinalCtaSection({ C, isDark }) {
  const navigate = useNavigate();
  return (
    <section className="min-h-[50vh] lg:min-h-[60vh] flex flex-col justify-end" style={{ position: "relative", padding: "clamp(60px, 10vw, 100px) clamp(20px, 6vw, 92px)", overflow: "hidden" }}>
      {/* Background Image */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80" alt="Beautiful Architecture" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(7,19,13,0.95) 0%, rgba(7,19,13,0.9) 40%, rgba(7,19,13,0.7) 100%)" }} />
      </div>

      {/* Content */}
      <div className="relative z-[2] w-full mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-12">
        {/* Left Side */}
        <div className="max-w-[600px]">
          <span style={{
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            fontWeight: 500,
            color: "rgba(229,197,131,0.6)",
            display: "block",
            marginBottom: "16px"
          }}>
            READY TO GET STARTED?
          </span>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 400, color: "#EDE8DF", margin: 0, lineHeight: 1.1 }}>
            Property Management,<br />
            <em style={{ fontStyle: "italic", color: "#E5C583" }}>Simplified.</em>
          </h2>
        </div>

        {/* Right Side */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 lg:gap-12">
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <button onClick={() => navigate("/signup")} style={{ background: "#EDE8DF", color: "#1C1917", border: "none", padding: "14px 28px", fontSize: "12px", fontWeight: 600, fontFamily: "'Inter', sans-serif", letterSpacing: "0.03em", borderRadius: "2px", cursor: "pointer", outline: "none", transition: "opacity 0.2s", display: "inline-flex", alignItems: "center", gap: "10px" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.9"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              Get Started <ArrowRight style={{ width: "14px", height: "14px" }} />
            </button>
          </div>

          {/* Divider on desktop */}
          <div className="hidden lg:block w-[1px] h-[40px] bg-[rgba(255,255,255,0.1)]"></div>

          {/* Logo element on far right as seen in reference */}
          <div className="hidden lg:flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-[20px] h-[20px] bg-[#EDE8DF] rounded-sm flex items-center justify-center">
                <Building2 style={{ width: "13px", height: "13px", color: "#1C1917" }} />
              </div>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "22px", color: "#EDE8DF", letterSpacing: "0.02em" }}>Lodale</span>
            </div>
            <span style={{ fontSize: "9px", color: "rgba(237,232,223,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Property Management, Simplified.</span>
          </div>
        </div>
      </div>
    </section>
  );
}


export default function GuestDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(6);

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

      {/* Featured Properties Section */}
      <section
        id="listings"
        style={{
          padding: "clamp(64px, 9vw, 112px) clamp(20px, 6vw, 92px)",
          background: isDark ? "#07130D" : "#F7F5EF",
        }}
      >
        {/* Stack layout: Horizontal header, grid underneath */}
        <div className="flex flex-col gap-10">
          {/* Horizontal Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-stone-200 dark:border-white/10 pb-8">
            <div className="max-w-[540px]">
              <p
                style={{
                  margin: "0 0 14px 0",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: isDark ? "rgba(229,197,131,0.5)" : "rgba(28,25,23,0.35)",
                }}
              >
                Featured Properties
              </p>
              <h2
                style={{
                  margin: "0 0 18px 0",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "clamp(1.9rem, 3.2vw, 3rem)",
                  fontWeight: 400,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  color: isDark ? "#EDE8DF" : "#1C1917",
                }}
              >
                Find Your<br />Next Home
              </h2>
              <p
                style={{
                  margin: "0",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "clamp(0.78rem, 1vw, 0.86rem)",
                  lineHeight: 1.74,
                  fontWeight: 400,
                  color: isDark ? "rgba(237,232,223,0.48)" : "rgba(28,25,23,0.46)",
                }}
              >
                Verified properties with transparent pricing and direct landlord contact across Nigeria.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6 w-full lg:w-auto">
              {/* Search */}
              <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
                <Search
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "13px",
                    height: "13px",
                    color: isDark ? "rgba(237,232,223,0.3)" : "rgba(28,25,23,0.28)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="listings-search"
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    paddingLeft: "36px",
                    paddingRight: "14px",
                    paddingTop: "10px",
                    paddingBottom: "10px",
                    background: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
                    border: "1px solid " + (isDark ? "rgba(237,232,223,0.1)" : "rgba(28,25,23,0.1)"),
                    borderRadius: "4px",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "12px",
                    fontWeight: 400,
                    color: isDark ? "#EDE8DF" : "#1C1917",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s ease",
                  }}
                  onFocus={e => { e.target.style.borderColor = isDark ? "rgba(237,232,223,0.28)" : "rgba(28,25,23,0.26)"; }}
                  onBlur={e => { e.target.style.borderColor = isDark ? "rgba(237,232,223,0.1)" : "rgba(28,25,23,0.1)"; }}
                />
              </div>

              <button
                onClick={() => navigate("/signup")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "transparent",
                  border: "none",
                  padding: "0",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: isDark ? "rgba(237,232,223,0.5)" : "rgba(28,25,23,0.48)",
                  cursor: "pointer",
                  outline: "none",
                  letterSpacing: "0.02em",
                  transition: "color 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = isDark ? "#EDE8DF" : "#1C1917"; }}
                onMouseLeave={e => { e.currentTarget.style.color = isDark ? "rgba(237,232,223,0.5)" : "rgba(28,25,23,0.48)"; }}
              >
                View All Properties
                <ArrowRight style={{ width: "13px", height: "13px" }} />
              </button>
            </div>
          </div>

          {/* Property grid underneath */}
          <div>
            {isLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: "clamp(24px, 3.5vw, 40px) clamp(14px, 2vw, 24px)" }}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <ListingCardSkeleton key={n} />
                ))}
              </div>
            ) : listingsError ? (
              <div
                style={{
                  padding: "48px 24px",
                  border: "1px solid " + (isDark ? "rgba(237,232,223,0.08)" : "rgba(28,25,23,0.08)"),
                  borderRadius: "4px",
                  textAlign: "center",
                  maxWidth: "360px",
                }}
              >
                <AlertTriangle style={{ width: "22px", height: "22px", margin: "0 auto 16px", color: isDark ? "rgba(237,232,223,0.35)" : "rgba(28,25,23,0.28)" }} />
                <h3
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "17px",
                    fontWeight: 400,
                    color: isDark ? "#EDE8DF" : "#1C1917",
                    margin: "0 0 8px 0",
                  }}
                >
                  Listings unavailable
                </h3>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "12px",
                    color: isDark ? "rgba(237,232,223,0.42)" : "rgba(28,25,23,0.42)",
                    lineHeight: 1.65,
                    margin: "0 0 24px 0",
                  }}
                >
                  We could not load properties right now.
                </p>
                <button
                  type="button"
                  onClick={fetchPublicListings}
                  style={{
                    padding: "10px 22px",
                    background: isDark ? "#EDE8DF" : "#1C1917",
                    color: isDark ? "#1C1917" : "#EDE8DF",
                    border: "none",
                    borderRadius: "4px",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  Retry
                </button>
              </div>
            ) : filteredListings.length > 0 ? (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))",
                    gap: "clamp(28px, 4.5vw, 48px) clamp(14px, 2vw, 24px)",
                  }}
                >
                  {filteredListings.slice(0, displayLimit).map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: "64px 0" }}>
                {searchQuery.trim() !== "" ? (
                  <>
                    <p
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: "20px",
                        fontWeight: 400,
                        color: isDark ? "#EDE8DF" : "#1C1917",
                        marginBottom: "8px",
                      }}
                    >
                      No results for "{searchQuery}"
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      style={{
                        marginTop: "16px",
                        padding: "10px 22px",
                        background: "transparent",
                        border: "1px solid " + (isDark ? "rgba(237,232,223,0.18)" : "rgba(28,25,23,0.16)"),
                        borderRadius: "4px",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "12px",
                        color: isDark ? "rgba(237,232,223,0.6)" : "rgba(28,25,23,0.58)",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <p
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "20px",
                      fontWeight: 400,
                      color: isDark ? "#EDE8DF" : "#1C1917",
                    }}
                  >
                    No listings yet
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Lodale */}
      <AboutLodaleSection C={C} isDark={isDark} />

      {/* Interactive How It Works One-Pager Section */}
      <HowItWorksSection C={C} isDark={isDark} />





      {/* Final CTA */}
      <FinalCtaSection C={C} isDark={isDark} />

      <Footer />
    </div>
  );
}
