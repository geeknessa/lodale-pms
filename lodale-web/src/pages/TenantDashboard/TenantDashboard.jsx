import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { triggerToast } from "../../context/ToastContext";
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  Settings,
  Plus,
  Wrench,
  CreditCard,
  FileText,
  PieChart,
  User,
  Building2,
  Clock,
  ArrowRight,
  Download,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  Calendar,
  HelpCircle,
  Bell,
  Menu,
  Check,
  Flame,
  ShieldCheck,
  Award,
} from "lucide-react";
import gsap from "gsap";
import { Logo, LogoMark } from "../../components/Logo";
import Button from "../../components/Button";
import { useTheme } from "../../context/ThemeContext";
import "./TenantDashboard.css";

import TenantSearch from "./TenantSearch";
import TenantChat from "./TenantChat";
import TenantSettings from "./TenantSettings";

const TOUR_STEPS = [
  // Sidebar tab steps (visible on any tab)
  {
    target: ".tour-nav-0",
    title: "Sidebar: Home Dashboard",
    content: "This button navigates you back to your primary home workspace.",
    placement: "right",
    tab: 0
  },
  {
    target: ".tour-nav-1",
    title: "Sidebar: Browse Units",
    content: "Jump to the properties directory to browse rental listings.",
    placement: "right",
    tab: 1
  },
  {
    target: ".tour-nav-2",
    title: "Sidebar: Secure Chats",
    content: "Open real-time logs with verified landlords.",
    placement: "right",
    tab: 2
  },
  {
    target: ".tour-nav-3",
    title: "Sidebar: Profile Settings",
    content: "Edit location credentials, verified badges, and security parameters.",
    placement: "right",
    tab: 3
  },

  // Homepage steps (tab: 0)
  {
    target: ".tour-welcome",
    title: "Greeting & Breadcrumb Header",
    content: "Welcome to Lodale! This header greets you with your verified first-name profile session.",
    placement: "bottom",
    tab: 0
  },
  {
    target: ".pro-card",
    title: "Active Lease & Star Score",
    content: "Tracks active lease dates, terms, and rating variables compiled from automated rent ledgers.",
    placement: "bottom",
    tab: 0
  },
  {
    target: ".tour-dispatch",
    title: "Quick Repair Dispatch Form",
    content: "Submit work dispatches directly to landlords. Urgent tickets trigger real-time notifications.",
    placement: "top",
    tab: 0
  },
  {
    target: ".tour-property",
    title: "Current Property Overview",
    content: "Displays Skyline Residency unit numbers, landlord contact details, and monthly costs.",
    placement: "bottom",
    tab: 0
  },
  {
    target: ".tour-tracker",
    title: "Repair Ticket Tracker Feed",
    content: "Follow status updates (Pending, In Progress, Completed) on filed maintenance tickets.",
    placement: "top",
    tab: 0
  },
  {
    target: ".tour-visa",
    title: "Rent Wallet & Visa Debit Card",
    content: "Submit monthly rent dues instantly and view ledger payment ratios.",
    placement: "left",
    tab: 0
  },
  {
    target: ".tour-breakdown",
    title: "Monthly Budget Breakdown",
    content: "Visualizes ratios apportioned to baseline rents, utility splits, and service charges.",
    placement: "top",
    tab: 0
  },

  // Search page steps (tab: 1)
  {
    target: ".tour-search-header",
    title: "Directory Breadcrumbs",
    content: "Welcome to the rentals directory! Let's explore listing filter widgets.",
    placement: "bottom",
    tab: 1
  },
  {
    target: ".tour-search-bar",
    title: "Search Bar Input",
    content: "Query by property names, landmarks, or specific landlord names.",
    placement: "bottom",
    tab: 1
  },
  {
    target: ".tour-search-scope",
    title: "Search Scope Toggles",
    content: "Filter matches between listings (Property Details) or profiles (Landlords).",
    placement: "bottom",
    tab: 1
  },
  {
    target: ".tour-search-filter",
    title: "Advanced Filters Trigger",
    content: "Narrow parameters by bed counts, monthly budgets, or rental styles.",
    placement: "left",
    tab: 1
  },
  {
    target: ".tour-search-results",
    title: "Explore Listings Directory",
    content: "Browse recommendations based on proximity, high ratings, or popular listings.",
    placement: "top",
    tab: 1
  }
];

export default function TenantDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Active navigation tab (persisted on page reload, or from navigation state)
  // 0: Dashboard, 1: Search, 2: Chat, 3: Settings
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      // If navigated from ListingDetail with a specific tab request, honour it
      const navInitialTab = location?.state?.initialTab;
      if (typeof navInitialTab === "number") return navInitialTab;
      const saved = localStorage.getItem("tenantActiveTab");
      return saved !== null ? Number(saved) : 0;
    } catch (e) {
      return 0;
    }
  });

  const setActiveTab = (index) => {
    setActiveTabState(index);
    try {
      localStorage.setItem("tenantActiveTab", index.toString());
    } catch (e) { }
  };

  // Retrieve username with fallback — reads tenant-scoped keys first
  const [username, setUsername] = useState(() => {
    const sessName = sessionStorage.getItem("tenantUsername") || sessionStorage.getItem("username");
    if (sessName) return sessName;
    const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || sessionStorage.getItem("lastLoggedInEmail"))?.toLowerCase();
    const storedName = emailKey ? (localStorage.getItem("tenantUsername_" + emailKey) || sessionStorage.getItem("username_" + emailKey)) : null;
    return storedName || localStorage.getItem("tenantUsername") || sessionStorage.getItem("username") || "Tunde";
  });
  const firstName = username.split(" ")[0];

  // Dynamic real-time date formatting
  const currentDateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  const currentMonthYearStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Tenant avatar state — reads tenant-scoped keys so it never picks up a landlord avatar
  const [tenantAvatar, setTenantAvatar] = useState(() => {
    const emailKey = sessionStorage.getItem("lastLoggedInEmail") || sessionStorage.getItem("lastLoggedInEmail");
    if (emailKey) {
      const savedUserAvatar = localStorage.getItem("tenantAvatar_" + emailKey.toLowerCase());
      if (savedUserAvatar && !savedUserAvatar.includes("unsplash.com")) return savedUserAvatar;
    }
    // Fallback: session-level quick sync key set by TenantSettings on upload
    const sessionAvatar = sessionStorage.getItem("tenantAvatarUrl");
    if (sessionAvatar && !sessionAvatar.includes("unsplash.com")) return sessionAvatar;
    return "";
  });

  useEffect(() => {
    const handleStorageUpdate = (e) => {
      const sessEmail = sessionStorage.getItem("lastLoggedInEmail")?.toLowerCase();
      // If this tab is locked to a specific logged-in email, ignore storage changes for other emails
      if (sessEmail && e?.key === "lastLoggedInEmail" && e?.newValue?.toLowerCase() !== sessEmail) {
        return;
      }
      const emailKey = sessEmail || sessionStorage.getItem("lastLoggedInEmail")?.toLowerCase();
      // Read tenant-scoped username first to prevent landlord name overwriting tenant display
      const storedName =
        sessionStorage.getItem("tenantUsername") ||
        (emailKey ? localStorage.getItem("tenantUsername_" + emailKey) : null) ||
        sessionStorage.getItem("username") ||
        (emailKey ? sessionStorage.getItem("username_" + emailKey) : null);
      if (storedName) {
        setUsername(storedName);
      }

      // Read tenant-scoped avatar only
      let updated = null;
      if (emailKey) {
        updated = localStorage.getItem("tenantAvatar_" + emailKey.toLowerCase());
      }
      if (!updated) {
        updated = sessionStorage.getItem("tenantAvatarUrl");
      }
      if (updated) {
        setTenantAvatar(updated);
      }
    };
    window.addEventListener("storage", handleStorageUpdate);
    return () => window.removeEventListener("storage", handleStorageUpdate);
  }, []);

  // Listen to tenantProfileUpdated custom event (fired by TenantSettings)
  useEffect(() => {
    const handleTenantProfileUpdated = (e) => {
      const { name, avatar } = e.detail || {};
      if (name) setUsername(name);
      if (avatar) setTenantAvatar(avatar);
    };
    window.addEventListener("tenantProfileUpdated", handleTenantProfileUpdated);
    return () => window.removeEventListener("tenantProfileUpdated", handleTenantProfileUpdated);
  }, []);

  // Welcome Overlay states for new signup animation
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  // Tour States
  const [showTourAsk, setShowTourAsk] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [recalcTrigger, setRecalcTrigger] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [spotlightStyle, setSpotlightStyle] = useState({});

  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("tenantNotifications");
    return saved ? JSON.parse(saved) : [
      { id: 1, text: "Your rent payment was successful.", read: false },
      { id: 2, text: "Maintenance request #42 updated.", read: false }
    ];
  });

  const [activeLease, setActiveLease] = useState(() => {
    const saved = localStorage.getItem("tenantLease");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    const apps = localStorage.getItem("propertyApplications");
    if (apps) {
      try {
        const parsed = JSON.parse(apps);
        const approved = parsed.find(a => a.status === "Approved" || a.status === "Leased");
        if (approved) return approved;
      } catch (e) { }
    }
    return null;
  });

  // Quick Requests State (initialized with requests loaded from localStorage and filtered by active tenant)
  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem("tenantRequests");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const currentName = (sessionStorage.getItem("username") || "Tunde").toLowerCase();
        return parsed.filter(r => {
          if (!r) return false;
          const reqUser = (r.tenantName || r.name || "").toLowerCase();
          return reqUser.includes(currentName) || currentName.includes(reqUser);
        });
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Payments Ledger
  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem("tenantPayments");
    if (saved) return JSON.parse(saved);
    return [];
  });

  // Rent payment state
  const [rentPaid, setRentPaid] = useState(false);

  // Quick Request fields
  const [reqTitle, setReqTitle] = useState("");
  const [reqCategory, setReqCategory] = useState("Plumbing");
  const [reqUrgency, setReqUrgency] = useState("Medium");
  const [reqDesc, setReqDesc] = useState("");

  // Payment Modal simulation
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingState, setPayingState] = useState("idle"); // idle | processing | success
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editOccupation, setEditOccupation] = useState("");
  const [editIncome, setEditIncome] = useState("");

  // Ticket detail & modal states
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);

  // GSAP animation references
  const mainContentRef = useRef(null);

  useEffect(() => {
    // Check if the user is newly signed up
    const isNew = localStorage.getItem("isNewSignUp") === "true";
    if (isNew) {
      setShowWelcomeOverlay(true);
      localStorage.setItem("tenantChats", JSON.stringify([]));
      localStorage.removeItem("isNewSignUp");
    }

    // Listen for resume quick apply to switch back to Search tab
    const handleResumeApply = () => {
      setActiveTab(1);
    };
    window.addEventListener("resumeQuickApply", handleResumeApply);
    
    return () => {
      window.removeEventListener("resumeQuickApply", handleResumeApply);
    };
  }, []);

  // Load tenant specific requests
  const loadRequests = () => {
    const saved = localStorage.getItem("tenantRequests");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const currentName = (sessionStorage.getItem("username") || "Tunde").toLowerCase();
        const filtered = parsed.filter(r => {
          if (!r) return false;
          const reqUser = (r.tenantName || r.name || "").toLowerCase();
          return reqUser.includes(currentName) || currentName.includes(reqUser);
        });
        setRequests(filtered);
      } catch (e) {
        setRequests([]);
      }
    } else {
      setRequests([]);
    }
  };

  useEffect(() => {
    loadRequests();
    window.addEventListener("storage", loadRequests);
    return () => window.removeEventListener("storage", loadRequests);
  }, []);

  // Animate welcome screen
  useEffect(() => {
    if (showWelcomeOverlay && overlayRef.current && contentRef.current) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: "power2.out" }
      );
      gsap.fromTo(contentRef.current,
        { scale: 0.85, y: 30, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.7, delay: 0.15, ease: "back.out(1.6)" }
      );
    }
  }, [showWelcomeOverlay]);

  // Animate grid columns when landing on tab 0
  useEffect(() => {
    if (activeTab === 0 && mainContentRef.current) {
      const cards = mainContentRef.current.querySelectorAll(".db-card");
      gsap.fromTo(cards,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }
      );
    }
  }, [activeTab]);

  const handleDismissWelcome = () => {
    if (overlayRef.current && contentRef.current) {
      gsap.to(contentRef.current, {
        scale: 0.85,
        y: -30,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
      });
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.5,
        delay: 0.05,
        ease: "power2.inOut",
        onComplete: () => {
          setShowWelcomeOverlay(false);
          setShowTourAsk(true);
        }
      });
    } else {
      setShowWelcomeOverlay(false);
      setShowTourAsk(true);
    }
  };

  // Auto tab switching based on active tour step metadata
  useEffect(() => {
    if (runTour) {
      const stepData = TOUR_STEPS[tourStep];
      if (stepData && typeof stepData.tab === "number" && activeTab !== stepData.tab) {
        setActiveTab(stepData.tab);
        // Force coordinates recalculation after tab switches
        setRecalcTrigger(prev => prev + 1);
      }
    }
  }, [runTour, tourStep, activeTab]);

  // Tour positioning and resizing effect
  useEffect(() => {
    if (runTour) {
      const stepData = TOUR_STEPS[tourStep];
      const targetEl = document.querySelector(stepData.target);

      if (!targetEl) {
        // If element is not rendered yet (e.g. tab transition lag), wait and retry
        const retryTimer = setTimeout(() => {
          setRecalcTrigger((prev) => prev + 1);
        }, 150);
        return () => clearTimeout(retryTimer);
      }

      // Scroll the main content container if element is inside it
      const container = document.querySelector(".db-main-content");
      if (container && container.contains(targetEl)) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        // Calculate target scroll position to center the element
        const targetScrollTop = container.scrollTop + (targetRect.top - containerRect.top) - (container.clientHeight / 2) + (targetRect.height / 2);

        container.scrollTo({
          top: targetScrollTop,
          behavior: "smooth"
        });
      }

      // Wait a brief moment for scroll to complete, then compute coordinates
      const timer = setTimeout(() => {
        const rect = targetEl.getBoundingClientRect();

        // Spotlight style highlights the target element relative to viewport
        setSpotlightStyle({
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          borderRadius: getComputedStyle(targetEl).borderRadius || "8px",
        });

        // Position tooltip relative to targeted element (viewport fixed bounds)
        let tTop = 0;
        let tLeft = 0;
        const gap = 16;
        const tooltipWidth = 340;
        const tooltipHeight = 280; // Safe height estimate to prevent next button cut-off

        // 1. Dynamic collision detection / switching placement if bounds overflow
        let placement = stepData.placement;
        if (placement === "bottom" && rect.bottom + tooltipHeight + gap > window.innerHeight) {
          placement = "top";
        } else if (placement === "top" && rect.top - tooltipHeight - gap < 0) {
          placement = "bottom";
        } else if (placement === "right" && rect.right + tooltipWidth + gap > window.innerWidth) {
          placement = "left";
        } else if (placement === "left" && rect.left - tooltipWidth - gap < 0) {
          placement = "right";
        }

        // 2. Base positioning calculation
        if (placement === "right") {
          tTop = rect.top + (rect.height / 2) - (tooltipHeight / 2);
          tLeft = rect.left + rect.width + gap;
        } else if (placement === "left") {
          tTop = rect.top + (rect.height / 2) - (tooltipHeight / 2);
          tLeft = rect.left - tooltipWidth - gap;
        } else if (placement === "bottom") {
          tTop = rect.top + rect.height + gap;
          tLeft = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        } else {
          // top
          tTop = rect.top - tooltipHeight - gap;
          tLeft = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        }

        // 3. Strict Viewport Bounds Containment (keeps card 100% visible)
        if (tLeft < 20) tLeft = 20;
        if (tLeft + tooltipWidth > window.innerWidth - 20) {
          tLeft = window.innerWidth - tooltipWidth - 20;
        }
        if (tTop < 20) tTop = 20;
        if (tTop + tooltipHeight > window.innerHeight - 20) {
          tTop = window.innerHeight - tooltipHeight - 20;
        }

        setTooltipStyle({
          top: `${tTop}px`,
          left: `${tLeft}px`,
        });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [runTour, tourStep, recalcTrigger, activeTab]);

  useEffect(() => {
    const handleResize = () => {
      setRecalcTrigger((prev) => prev + 1);
    };
    window.addEventListener("resize", handleResize);
    // Listen to inner container scrolls to update bounding rects instantly!
    const container = document.querySelector(".db-main-content");
    if (container) {
      container.addEventListener("scroll", handleResize);
    }
    return () => {
      window.removeEventListener("resize", handleResize);
      if (container) {
        container.removeEventListener("scroll", handleResize);
      }
    };
  }, [runTour, activeTab]);

  // Submit quick request
  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!reqTitle.trim()) return;

    const newRequest = {
      id: "req-" + Date.now(),
      title: reqTitle,
      details: reqTitle,
      category: reqCategory,
      type: reqCategory,
      urgency: reqUrgency,
      status: "Pending",
      date: "Just now",
      desc: reqDesc || "No description provided.",
      description: reqDesc || "No description provided.",
      tenantName: username,
      name: username,
      avatar: "",
    };

    // Load full list to preserve other requests
    const saved = localStorage.getItem("tenantRequests");
    let allRequests = [];
    if (saved) {
      try {
        allRequests = JSON.parse(saved);
      } catch (e) {
        allRequests = [];
      }
    }
    const updatedRequests = [newRequest, ...allRequests];
    localStorage.setItem("tenantRequests", JSON.stringify(updatedRequests));

    // Update local state
    const currentName = username.toLowerCase();
    const filtered = updatedRequests.filter(r => {
      if (!r) return false;
      const reqUser = (r.tenantName || r.name || "").toLowerCase();
      return reqUser.includes(currentName) || currentName.includes(reqUser);
    });
    setRequests(filtered);

    // Reset fields
    setReqTitle("");
    setReqDesc("");

    triggerToast(`Maintenance request for "${newRequest.title}" submitted to landlord!`, "success", "Work Order Logged");
    window.dispatchEvent(new Event("storage"));
  };

  // Pay rent simulation
  const handlePayRentSubmit = () => {
    setPayingState("processing");
    setTimeout(() => {
      setPayingState("success");
      setTimeout(() => {
        const newPayment = {
          id: "pay-" + Date.now(),
          month: currentMonthYearStr,
          amount: "₦150,000",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          status: "Paid",
          method: "Card"
        };
        setPayments((prev) => [newPayment, ...prev]);
        setRentPaid(true);
        setShowPayModal(false);
        setPayingState("idle");
      }, 1500);
    }, 2000);
  };

  const handleSignOut = () => {
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("sessionExpiresAt");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("db_user_id");
    sessionStorage.removeItem("currentUserProfile");
    sessionStorage.removeItem("lodale_token");
    sessionStorage.removeItem("lodale_user");
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("sessionExpiresAt");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("userRole");
    navigate("/login", { replace: true });
  };

  const [showMobileNav, setShowMobileNav] = useState(false);

  const getTabName = () => {
    if (activeTab === 1) return "Search";
    if (activeTab === 2) return "Chat";
    if (activeTab === 3) return "Settings";
    return "";
  };

  return (
    <div className="tenant-wrapper">
      {/* MOBILE MENU HEADER */}
      <header className="mobile-header md:hidden">
        <span className="mobile-logo-text">Lodale</span>
        <button
          className="mobile-menu-trigger"
          onClick={() => setShowMobileNav(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-[#1E382A] dark:text-[#E5C583]" />
        </button>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {showMobileNav && (
        <div className="mobile-nav-overlay md:hidden" onClick={() => setShowMobileNav(false)}>
          <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="flex items-center gap-2">
                <LogoMark className="h-7 w-7" />
                <span className="mobile-logo-text">Lodale</span>
              </div>
              <button className="mobile-drawer-close" onClick={() => setShowMobileNav(false)}>
                &times;
              </button>
            </div>

            <nav className="mobile-drawer-nav">
              {[
                { icon: LayoutDashboard, label: "Dashboard home", idx: 0 },
                { icon: Search, label: "Search properties", idx: 1 },
                { icon: MessageSquare, label: "Chat Room", idx: 2 },
                { icon: Settings, label: "Settings & Profile", idx: 3 }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.idx;
                return (
                  <button
                    key={item.idx}
                    onClick={() => {
                      setActiveTab(item.idx);
                      setShowMobileNav(false);
                    }}
                    className={`mobile-drawer-btn ${isActive ? "active" : ""}`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mobile-drawer-footer">
              <button className="mobile-drawer-action-btn theme-toggle-btn" onClick={() => { toggleTheme(); setShowMobileNav(false); }}>
                {theme === "dark" ? <Sun className="h-5 w-5 mr-3" /> : <Moon className="h-5 w-5 mr-3" />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>
              <button className="mobile-drawer-action-btn logout-btn" onClick={() => { handleSignOut(); setShowMobileNav(false); }}>
                <LogOut className="h-5 w-5 mr-3" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GSAP NEW SIGNUP WELCOME ANIMATION OVERLAY */}
      {showWelcomeOverlay && (
        <div className="tenant-welcome-overlay" ref={overlayRef}>
          <div className="tenant-welcome-card" ref={contentRef}>
            <div className="welcome-sparkle-icon">
              <Sparkles className="h-6 w-6 text-[#E5C583]" />
            </div>
            <h2 className="welcome-title font-display">Welcome to Lodale, {firstName}!</h2>
            <p className="welcome-subtitle">Your tenant portal is completely setup. Here is what we have customized for you:</p>

            <ul className="welcome-checklist text-left">
              <li>
                <div className="chk-icon flex items-center justify-center"><Check className="h-3.5 w-3.5" /></div>
                <div>
                  <strong>Direct Landlord Sync</strong>
                  <span>Direct secure line for messaging and requests.</span>
                </div>
              </li>
              <li>
                <div className="chk-icon flex items-center justify-center"><Check className="h-3.5 w-3.5" /></div>
                <div>
                  <strong>NIN ID Verification Profile</strong>
                  <span>Encrypted digital credentials stored locally for application checkouts.</span>
                </div>
              </li>
              <li>
                <div className="chk-icon flex items-center justify-center"><Check className="h-3.5 w-3.5" /></div>
                <div>
                  <strong>Automated Rent Ledger</strong>
                  <span>Instant rent payments, invoices, and compliant stamp receipts.</span>
                </div>
              </li>
            </ul>

            <Button
              onClick={handleDismissWelcome}
              className="w-full bg-[#E5C583] hover:bg-[#D8B672] text-[#0B1512] font-bold py-3.5 mt-4 transition-all duration-150 transform hover:scale-[1.01]"
            >
              Get Started
            </Button>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS MODAL */}
      {showNotificationsModal && (
        <div className="tenant-modal-backdrop" onClick={() => setShowNotificationsModal(false)}>
          <div className="bg-white dark:bg-[#13221C] border border-ink-100 dark:border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-ink-900 dark:text-white">Notifications</h3>
              <button className="text-ink-400 hover:text-ink-900 dark:hover:text-white text-xl font-bold" onClick={() => setShowNotificationsModal(false)}>&times;</button>
            </div>
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {notifications.length > 0 ? notifications.map((n, i) => (
                <div key={i} className={`p-3 rounded-xl border ${n.read ? 'bg-neutral-50 dark:bg-white/5 border-transparent' : 'bg-moss-50 dark:bg-[#E5C583]/10 border-moss-200 dark:border-[#E5C583]/20'}`}>
                  <p className="text-[13px] text-ink-900 dark:text-white font-medium leading-relaxed">{n.message || n.text || "Notification"}</p>
                </div>
              )) : (
                <p className="text-sm text-ink-400 dark:text-cream-100/50 py-4 text-center">No new notifications.</p>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              {notifications.length > 0 && (
                <Button
                  onClick={() => {
                    setNotifications([]);
                    localStorage.setItem("tenantNotifications", JSON.stringify([]));
                  }}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1D2D26] dark:hover:bg-[#253930] text-ink-900 dark:text-white py-3.5 font-bold text-[13px] rounded-xl transition-colors"
                >
                  Clear All
                </Button>
              )}
              <Button
                onClick={() => {
                  setShowNotificationsModal(false);
                  const updated = notifications.map(n => ({ ...n, read: true }));
                  setNotifications(updated);
                  localStorage.setItem("tenantNotifications", JSON.stringify(updated));
                }}
                className={`${notifications.length > 0 ? 'flex-[2]' : 'w-full'} bg-[#202020] dark:bg-[#E5C583] text-white dark:text-[#263b33] py-3.5 font-bold text-[13px] rounded-xl`}
              >
                Close Notifications
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* RENT PAYMENT MODAL */}
      {showPayModal && (
        <div className="tenant-modal-backdrop">
          <div className="tenant-modal-content">
            {payingState === "idle" && (
              <>
                <div className="modal-header">
                  <h3>Secure Rent Payment</h3>
                  <button className="close-btn" onClick={() => setShowPayModal(false)}>&times;</button>
                </div>
                <div className="modal-body text-left">
                  <div className="invoice-summary">
                    <span className="summary-lbl">Due Period</span>
                    <span className="summary-val">{currentMonthYearStr}</span>
                    <span className="summary-lbl mt-3">Total Rent Amount</span>
                    <span className="summary-val amount text-moss-700 dark:text-[#E5C583]">₦150,000</span>
                    <span className="summary-lbl mt-3">Recipient Landlord</span>
                    <span className="summary-val">Ada K. (Skyline Apartments)</span>
                  </div>

                  <div className="payment-card-input-group mt-5">
                    <label>Card Number</label>
                    <input type="text" className="card-input" defaultValue="4000 8291 9302 1888" disabled />
                    <div className="flex gap-4 mt-3">
                      <div className="flex-1">
                        <label>Expiry Date</label>
                        <input type="text" className="card-input" defaultValue="12/29" disabled />
                      </div>
                      <div className="flex-grow-0 w-24">
                        <label>CVV</label>
                        <input type="password" className="card-input" defaultValue="123" disabled />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handlePayRentSubmit}
                    className="w-full mt-6 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] py-3.5 font-bold text-[13px]"
                  >
                    Authorize Payment (₦150,000)
                  </Button>
                </div>
              </>
            )}

            {payingState === "processing" && (
              <div className="modal-body-centered py-12">
                <div className="payment-loader-ring"></div>
                <h4 className="mt-4 font-bold text-[15px]">Processing Transaction</h4>
                <p className="text-[12px] text-ink-400 dark:text-cream-100/60 mt-1">Connecting to secure gateway. Please don't close this modal.</p>
              </div>
            )}

            {payingState === "success" && (
              <div className="modal-body-centered py-10">
                <div className="payment-success-badge flex items-center justify-center"><Check className="h-6 w-6" /></div>
                <h4 className="mt-4 font-bold text-[16px] text-emerald-600 dark:text-emerald-400">Payment Successful!</h4>
                <p className="text-[12.5px] text-ink-700 dark:text-cream-100/70 mt-1">Rent invoice paid successfully. Receipt added to your ledger.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TENANT PROFILE DETAILS POPUP */}
      {showProfileModal && (
        <div className="tenant-modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div className="tenant-modal-content text-left" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tenant Profile Details</h3>
              <button className="close-btn" onClick={() => setShowProfileModal(false)}>&times;</button>
            </div>

            <div className="modal-body-centered py-4">
              <div className="db-avatar flex items-center justify-center bg-moss-100/70 dark:bg-[#1E382A] text-moss-700 dark:text-[#E5C583] overflow-hidden rounded-full border-2 border-[#1E382A]/20 dark:border-[#E5C583]/30" style={{ width: "64px", height: "64px", marginBottom: "12px" }}>
                {tenantAvatar ? (
                  <img src={tenantAvatar} alt="Tenant Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-7 w-7 text-[#1E382A] dark:text-[#E5C583]" />
                )}
              </div>
              <h4 className="font-bold text-[18px] text-ink-900 dark:text-white">{username}</h4>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold mt-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                Verified Tenant
              </span>
            </div>

            <div className="flex flex-col gap-3 mt-2 border-t border-neutral-100 dark:border-neutral-800/60 pt-4">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800/60 last:border-b-0 last:pb-0">
                <span className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7]">Email Address</span>
                <span className="text-[13px] font-bold">{sessionStorage.getItem("lastLoggedInEmail") || "Not provided"}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800/60 last:border-b-0 last:pb-0">
                <span className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7]">Phone Number</span>
                {isEditingProfile ? (
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="bg-cream-50 dark:bg-[#12221C] border border-ink-200 dark:border-white/10 rounded px-2 py-1 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 text-right w-1/2"
                    placeholder="+234..."
                  />
                ) : (
                  <span className="text-[13px] font-bold">
                    {(() => {
                      try {
                        const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
                        const raw = sessionStorage.getItem("tenantCurrentProfile") || (emailKey ? localStorage.getItem("tenantProfile_" + emailKey) : null) || "{}";
                        return JSON.parse(raw).phone || "Not provided";
                      } catch (e) { return "Not provided"; }
                    })()}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800/60 last:border-b-0 last:pb-0">
                <span className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7]">Occupation</span>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={editOccupation}
                    onChange={(e) => setEditOccupation(e.target.value)}
                    className="bg-cream-50 dark:bg-[#12221C] border border-ink-200 dark:border-white/10 rounded px-2 py-1 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 text-right w-1/2"
                    placeholder="e.g. Engineer"
                  />
                ) : (
                  <span className="text-[13px] font-bold">
                    {(() => {
                      try {
                        const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
                        const raw = sessionStorage.getItem("tenantCurrentProfile") || (emailKey ? localStorage.getItem("tenantProfile_" + emailKey) : null) || "{}";
                        return JSON.parse(raw).occupation || "Not provided";
                      } catch (e) { return "Not provided"; }
                    })()}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800/60 last:border-b-0 last:pb-0">
                <span className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7]">Monthly Income</span>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={editIncome}
                    onChange={(e) => setEditIncome(e.target.value)}
                    className="bg-cream-50 dark:bg-[#12221C] border border-ink-200 dark:border-white/10 rounded px-2 py-1 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 text-right w-1/2"
                    placeholder="e.g. ₦400,000"
                  />
                ) : (
                  <span className="text-[13px] font-bold">
                    {(() => {
                      try {
                        const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
                        const raw = sessionStorage.getItem("tenantCurrentProfile") || (emailKey ? localStorage.getItem("tenantProfile_" + emailKey) : null) || "{}";
                        return JSON.parse(raw).income || "Not provided";
                      } catch (e) { return "Not provided"; }
                    })()}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800/60 last:border-b-0 last:pb-0">
                <span className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7]">Active Unit</span>
                <span className="text-[13px] font-bold">No active unit</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800/60 last:border-b-0 last:pb-0">
                <span className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7]">Reliability Score</span>
                <span className="text-[13px] font-bold text-amber-500">★ New Tenant</span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              {isEditingProfile ? (
                <>
                  <Button
                    onClick={() => setIsEditingProfile(false)}
                    variant="secondary"
                    className="flex-1 bg-neutral-200 dark:bg-neutral-800 text-ink-900 dark:text-white py-3.5 font-bold text-[13px] rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
                      const raw = sessionStorage.getItem("tenantCurrentProfile") || (emailKey ? localStorage.getItem("tenantProfile_" + emailKey) : null) || "{}";
                      const prof = JSON.parse(raw);
                      prof.phone = editPhone;
                      prof.occupation = editOccupation;
                      prof.income = editIncome;
                      sessionStorage.setItem("tenantCurrentProfile", JSON.stringify(prof));
                      if (emailKey) localStorage.setItem("tenantProfile_" + emailKey, JSON.stringify(prof));
                      window.dispatchEvent(new Event("storage"));
                      setIsEditingProfile(false);
                      triggerToast("Profile updated successfully!", "success", "Profile Saved");
                    }}
                    className="flex-1 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] py-3.5 font-bold text-[13px] rounded-xl"
                  >
                    Save Profile
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setShowProfileModal(false)}
                    variant="secondary"
                    className="flex-1 bg-neutral-200 dark:bg-neutral-800 text-ink-900 dark:text-white py-3.5 font-bold text-[13px] rounded-xl"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
                      const raw = sessionStorage.getItem("tenantCurrentProfile") || (emailKey ? localStorage.getItem("tenantProfile_" + emailKey) : null) || "{}";
                      const prof = JSON.parse(raw);
                      setEditPhone(prof.phone || "");
                      setEditOccupation(prof.occupation || "");
                      setEditIncome(prof.income || "");
                      setIsEditingProfile(true);
                    }}
                    className="flex-1 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] py-3.5 font-bold text-[13px] rounded-xl"
                  >
                    Edit Profile
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TICKET DETAILS POPUP */}
      {showTicketModal && selectedTicket && (
        <div className="tenant-modal-backdrop" onClick={() => { setShowTicketModal(false); setSelectedTicket(null); }}>
          <div className="tenant-modal-content text-left" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Repair Ticket Details</h3>
              <button className="close-btn" onClick={() => { setShowTicketModal(false); setSelectedTicket(null); }}>&times;</button>
            </div>

            <div className="modal-scroll-area">
              {/* Ticket status badge and category */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-[12px] font-bold text-[#6C6E73] dark:text-[#A3BCA7] uppercase tracking-wider bg-neutral-100 dark:bg-[#1D2D26] px-2.5 py-1 rounded-md">
                  {selectedTicket.category || selectedTicket.type || "General"}
                </span>
                <span className={`ticket-feed-status ${selectedTicket.status.toLowerCase().replace(" ", "-")}`}>
                  {selectedTicket.status}
                </span>
              </div>

              {/* Title & Date */}
              <h4 className="font-bold text-[18px] text-ink-900 dark:text-white leading-snug mb-1">
                {selectedTicket.title || selectedTicket.details || "Repair Request"}
              </h4>
              <p className="text-[11.5px] text-[#6C6E73] dark:text-[#A3BCA7] mb-6">
                Submitted {selectedTicket.date || "Just now"}
              </p>

              {/* Progress Tracker Stepper */}
              <div className="ticket-progress-stepper mb-6">
                <div className="stepper-line">
                  <div
                    className="stepper-line-fill"
                    style={{
                      width: selectedTicket.status.toLowerCase() === "pending"
                        ? "0%"
                        : selectedTicket.status.toLowerCase() === "in progress"
                          ? "50%"
                          : "100%"
                    }}
                  />
                </div>

                <div className="stepper-steps">
                  <div className={`stepper-step ${["pending", "in progress", "completed", "resolved"].includes(selectedTicket.status.toLowerCase()) ? "active" : ""}`}>
                    <div className="step-circle">1</div>
                    <span className="step-label">Pending</span>
                  </div>
                  <div className={`stepper-step ${["in progress", "completed", "resolved"].includes(selectedTicket.status.toLowerCase()) ? "active" : ""}`}>
                    <div className="step-circle">2</div>
                    <span className="step-label">In Progress</span>
                  </div>
                  <div className={`stepper-step ${["completed", "resolved"].includes(selectedTicket.status.toLowerCase()) ? "active" : ""}`}>
                    <div className="step-circle">3</div>
                    <span className="step-label">Completed</span>
                  </div>
                </div>
              </div>

              {/* Description card */}
              <div className="invoice-summary mb-5" style={{ gap: "6px" }}>
                <span className="summary-lbl">Issue Details</span>
                <span className="summary-val font-normal text-[13px] leading-relaxed">
                  {selectedTicket.desc || selectedTicket.description || selectedTicket.details || "No description provided."}
                </span>
              </div>

              {/* Urgency and info grid */}
              <div className="flex flex-col gap-3 border-t border-neutral-100 dark:border-neutral-800/60 pt-4 mb-2">
                <div className="flex justify-between items-center">
                  <span className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7]">Priority Urgency</span>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${(selectedTicket.urgency || "Medium").toLowerCase() === "high"
                    ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                    : (selectedTicket.urgency || "Medium").toLowerCase() === "medium"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                      : "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                    }`}>
                    {selectedTicket.urgency || "Medium"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7]">Assigned Vendor</span>
                  <span className="text-[13px] font-bold">
                    {selectedTicket.status.toLowerCase() === "pending" ? "Awaiting dispatch" : "Lodale Maintenance Team"}
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => { setShowTicketModal(false); setSelectedTicket(null); }}
              className="w-full mt-6 bg-[#202020] dark:bg-[#E5C583] text-white dark:text-[#0B1512] py-3.5 font-bold text-[13px] rounded-xl"
            >
              Close Ticket
            </Button>
          </div>
        </div>
      )}

      {/* RELIABILITY RATINGS DETAILS POPUP */}
      {showRatingModal && (
        <div className="tenant-modal-backdrop" onClick={() => setShowRatingModal(false)}>
          <div className="tenant-modal-content text-left" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reliability Rating Details</h3>
              <button className="close-btn" onClick={() => setShowRatingModal(false)}>&times;</button>
            </div>

            <div className="modal-scroll-area">
              {/* Rating Big Number display */}
              <div className="modal-body-centered py-2">
                <h2 className="text-4xl font-extrabold text-[#2C4633] dark:text-[#E5C583] mb-1" style={{ fontSize: "36px" }}>
                  {activeLease ? "4.8" : "New"}
                </h2>
                <div className="flex gap-1 mb-2">
                  {activeLease ? (
                    <>
                      <span className="text-amber-500 text-lg">★</span>
                      <span className="text-amber-500 text-lg">★</span>
                      <span className="text-amber-500 text-lg">★</span>
                      <span className="text-amber-500 text-lg">★</span>
                      <span className="text-neutral-300 dark:text-neutral-700 text-lg">★</span>
                    </>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                      Verified Account
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[#6C6E73] dark:text-[#A3BCA7] font-semibold">
                  {activeLease ? "Excellent Tenant Standing" : "New Tenant Standing"}
                </p>
              </div>

              {/* Breakdown cards */}
              <div className="flex flex-col gap-3 mt-4">
                <div className="invoice-summary" style={{ padding: "16px", gap: "10px" }}>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6C6E73] dark:text-[#A3BCA7]">Rating Breakdown</h4>

                  {activeLease ? (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[12.5px]">
                          <span>Rent Payment Punctuality</span>
                          <span className="font-bold">5.0 / 5.0</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: "100%" }} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex justify-between items-center text-[12.5px]">
                          <span>Ledger Punctuality</span>
                          <span className="font-bold">4.7 / 5.0</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#E5C583]" style={{ width: "94%" }} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-[12px] text-[#6C6E73] dark:text-[#A3BCA7] py-2">
                      No rating history recorded yet. Reliability scores generate automatically as you make rental payments.
                    </p>
                  )}
                </div>

                {/* History timeline feed */}
                <div className="mt-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6C6E73] dark:text-[#A3BCA7] mb-3">Verification History</h4>

                  <div className="flex flex-col gap-3 max-h-[180px] overflow-y-auto pr-1">
                    {activeLease ? (
                      <div className="p-3 bg-neutral-50 dark:bg-[#1D2D26]/40 border border-neutral-100 dark:border-neutral-800/40 rounded-xl">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[12px] font-bold">Landlord Review</span>
                          <span className="text-[11px] text-amber-500 font-bold">★ 5.0</span>
                        </div>
                        <p className="text-[11.5px] text-[#6C6E73] dark:text-[#A3BCA7] italic leading-relaxed">
                          "Pays rent on time. Verified behavior."
                        </p>
                      </div>
                    ) : (
                      <p className="text-[12px] text-[#6C6E73] dark:text-[#A3BCA7] py-2 text-center">
                        No reviews or tenancy checkouts recorded yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowRatingModal(false)}
              className="w-full mt-6 bg-[#202020] dark:bg-[#E5C583] text-white dark:text-[#0B1512] py-3.5 font-bold text-[13px] rounded-xl"
            >
              Close Details
            </Button>
          </div>
        </div>
      )}

      {/* QUICK REPAIR DISPATCH POPUP MODAL */}
      {showDispatchModal && (
        <div className="tenant-modal-backdrop" onClick={() => setShowDispatchModal(false)}>
          <div className="tenant-modal-content text-left" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quick Repair Dispatch</h3>
              <button className="close-btn" onClick={() => setShowDispatchModal(false)}>&times;</button>
            </div>

            <form
              onSubmit={(e) => {
                handleSubmitRequest(e);
                setShowDispatchModal(false);
              }}
              className="form-input-container space-y-4 mt-4"
            >
              <div>
                <label className="form-lbl">Issue Summary</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Broken faucet, toilet clog..."
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="form-lbl">Category</label>
                  <select className="form-input" value={reqCategory} onChange={(e) => setReqCategory(e.target.value)}>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Appliance">Appliance</option>
                    <option value="Structural">Structural</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex-grow w-24">
                  <label className="form-lbl">Urgency</label>
                  <select className="form-input" value={reqUrgency} onChange={(e) => setReqUrgency(e.target.value)}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-lbl">Issue Details</label>
                <textarea
                  rows={3}
                  className="form-input"
                  placeholder="Provide details about the issue..."
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowDispatchModal(false)}
                  className="flex-1 py-3 text-[13px] font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] py-3 font-bold text-[13px]"
                >
                  Send Dispatch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ON-TIME PAYMENT STREAK CENTER POPUP MODAL */}
      {showStreakModal && (
        <div className="tenant-modal-backdrop" onClick={() => setShowStreakModal(false)}>
          <div className="tenant-modal-content text-left max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between pb-3 border-b border-ink-100/30 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/15 dark:bg-amber-500/25 text-amber-500">
                  <Flame className="h-5 w-5 fill-amber-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink-900 dark:text-white">Payment Streak Details</h3>
                  <p className="text-[11px] text-ink-400 dark:text-cream-100/50">Lodale Verified Punctuality Ledger</p>
                </div>
              </div>
              <button className="close-btn text-ink-400 hover:text-ink-900 dark:hover:text-white text-xl font-bold" onClick={() => setShowStreakModal(false)}>&times;</button>
            </div>

            <div className="py-4 space-y-4">
              {/* Main Metric Counter */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">Active Streak</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-ink-900 dark:text-white tracking-tight">
                      {activeLease ? "184 Days" : "0 Days"}
                    </span>
                    <span className="text-xs font-extrabold text-amber-600 dark:text-[#E5C583]">
                      ({activeLease ? "6 Months" : "0 Months"})
                    </span>
                  </div>
                  <p className="text-[11.5px] text-ink-600 dark:text-cream-100/70 mt-1">
                    {activeLease ? "No late payments recorded in 2026" : "Complete your next rent payment on time to build your streak."}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500">
                  <Flame className="h-8 w-8 fill-amber-500 animate-bounce" />
                </div>
              </div>

              {/* 6-Month Cowrywise Grid */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-400 dark:text-cream-100/60 mb-2">
                  Monthly Punctuality History
                </h4>
                <div className="streak-months-grid">
                  {[
                    { month: "Mar", status: "paid" },
                    { month: "Apr", status: "paid" },
                    { month: "May", status: "paid" },
                    { month: "Jun", status: "paid" },
                    { month: "Jul", status: "paid" },
                    { month: "Aug", status: activeLease ? "current" : "upcoming" }
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`streak-month-pill ${
                        item.status === "paid"
                          ? "paid"
                          : item.status === "current"
                          ? "current"
                          : "upcoming"
                      }`}
                    >
                      <span className="month-lbl">{item.month}</span>
                      <div className="status-dot">
                        {item.status === "paid" ? (
                          <Check className="h-3 w-3 text-emerald-700 dark:text-emerald-300 stroke-[3]" />
                        ) : item.status === "current" ? (
                          <Flame className="h-3 w-3 text-amber-500 fill-amber-500 animate-bounce" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-ink-200 dark:bg-white/20" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Perks & Rewards */}
              <div className="p-3.5 rounded-2xl bg-moss-50/50 dark:bg-white/5 border border-moss-200/50 dark:border-white/10 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-ink-700 dark:text-cream-100/80">Next Reward: Tier 1 Verified Badge</span>
                </div>
                <span className="font-extrabold text-moss-700 dark:text-[#E5C583]">{activeLease ? "+150 Pts" : "0 Pts"}</span>
              </div>
            </div>

            <Button
              onClick={() => setShowStreakModal(false)}
              className="w-full mt-2 bg-[#202020] dark:bg-[#E5C583] text-white dark:text-[#0B1512] py-3.5 font-bold text-[13px] rounded-xl"
            >
              Close Details
            </Button>
          </div>
        </div>
      )}



      {/* CORE CONTAINER */}
      <div className="tenant-container">

        {/* COLUMN 1: LEFT NAVIGATION SIDEBAR */}
        <aside className="tenant-sidebar">
          <div className="sidebar-top-group">
            <div className="sidebar-logo-mark mb-6 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/explore")} title="Go to Public Guest Dashboard">
              <LogoMark className="h-9 w-9" />
            </div>

            <div className="tenant-sidebar-nav">
              {[
                { icon: LayoutDashboard, label: "Dashboard home" },
                { icon: Search, label: "Search" },
                { icon: MessageSquare, label: "Chat" },
                { icon: Settings, label: "Settings" }
              ].map((item, index) => {
                const Icon = item.icon;
                const isActive = activeTab === index;
                return (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    className={`tenant-sidebar-btn ${isActive ? "active" : ""} tour-nav-${index}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="tenant-sidebar-tooltip">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tenant-sidebar-bottom">
            <button className="tenant-sidebar-btn theme-toggle-btn mb-3" onClick={toggleTheme} title="Toggle Theme">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="tenant-sidebar-tooltip">Toggle Theme</span>
            </button>
            <button className="tenant-sidebar-btn logout-btn" onClick={handleSignOut} title="Log Out">
              <LogOut className="h-5 w-5" />
              <span className="tenant-sidebar-tooltip">Log Out</span>
            </button>
          </div>
        </aside>

        {/* INTERACTIVE PAGE DISPLAY */}
        {activeTab === 0 ? (
          <main className="db-main-content" ref={mainContentRef}>

            {/* Main Area Sub-Header */}
            <div className="db-sub-header-row">
              <div className="db-page-header tour-welcome">
                <div className="db-breadcrumb">
                  <span
                    className="cursor-pointer hover:underline hover:opacity-80 transition-all text-moss-700 dark:text-[#E5C583]"
                    onClick={() => navigate("/explore")}
                    title="Go to Public Guest Dashboard"
                  >
                    Home Page
                  </span>
                  <span>→</span>
                  <span className="db-breadcrumb-active">Dashboard</span>
                </div>
                <h1 className="db-title">Welcome, {firstName}!</h1>
              </div>

              <div className="db-controls-group">
                <div className="db-date-selector">
                  <Calendar className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" />
                  <span>{currentDateStr}</span>
                </div>

                <div className="db-search-trigger" onClick={() => setActiveTab(1)} title="Search">
                  <Search className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
                </div>

                <div className="db-icon-btn-wrapper" onClick={() => setShowNotificationsModal(true)} title="Notifications">
                  <Bell className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
                  {notifications.filter(n => !n.read).length > 0 && <span className="db-badge-dot" />}
                </div>

                <div className="db-icon-btn-wrapper" onClick={() => setActiveTab(2)} title="Messages">
                  <MessageSquare className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
                  <span className="db-badge-dot" />
                </div>

                <div className="db-profile-avatar-wrapper" onClick={() => setShowProfileModal(true)} title="Profile settings">
                  <div className="db-avatar flex items-center justify-center bg-moss-100/70 dark:bg-[#1E382A] text-moss-700 dark:text-[#E5C583] overflow-hidden rounded-full border border-[#1E382A]/20 dark:border-[#E5C583]/30">
                    {tenantAvatar ? (
                      <img src={tenantAvatar} alt="Tenant Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4.5 w-4.5 text-[#1E382A] dark:text-[#E5C583]" />
                    )}
                  </div>
                  <span className="db-online-indicator" />
                </div>

                <Button
                  onClick={() => setShowDispatchModal(true)}
                  className="flex items-center gap-1.5 bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#d8b672] text-white dark:text-[#0B1512] px-3.5 py-2 text-[12.5px] font-bold transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] cursor-pointer tour-dispatch"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span>Quick Dispatch</span>
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => triggerToast("Creating tenant ledger summary PDF export...", "info", "Ledger Export")}
                  className="px-4 py-2 bg-white dark:bg-[#12221C] text-[12.5px] ml-1"
                >
                  Download Summary
                </Button>
              </div>
            </div>

            {/* DASHBOARD GRID CONTENT */}
            <div className="db-grid">

              {/* COLUMN 1: ACTIVE LEASE & REPAIR DISPATCH */}
              <div className="db-col">

                {/* Redesigned Glassmorphic Card */}
                <section className="db-card pro-card">
                  <div className="pro-card-header">
                    <span className="pro-card-tag">{activeLease ? "Active Lease" : "No Active Lease"}</span>
                  </div>

                  <div className="pro-card-visual">
                    <div className="pro-card-glow" />
                    <svg width="110" height="110" viewBox="0 0 120 120" className="pro-card-prism">
                      <defs>
                        <radialGradient id="prism-glow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#d4f216" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#2c4633" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="prism-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                          <stop offset="50%" stopColor="#e4eae1" stopOpacity="0.65" />
                          <stop offset="100%" stopColor="#E5C583" stopOpacity="0.95" />
                        </linearGradient>
                      </defs>
                      <circle cx="60" cy="85" r="30" fill="url(#prism-glow)" />
                      <ellipse cx="60" cy="90" rx="35" ry="12" fill="#2c4633" opacity="0.3" />
                      <ellipse cx="60" cy="85" rx="35" ry="12" fill="#1D3329" opacity="0.8" stroke="var(--tenant-charcoal)" strokeWidth="1.5" />
                      <path d="M 25 85 L 25 100 A 35 12 0 0 0 95 100 L 95 85 Z" fill="#2c4633" stroke="var(--tenant-charcoal)" strokeWidth="1.5" />
                      <polygon points="60,18 85,55 60,72 35,55" fill="url(#prism-grad)" stroke="var(--active-pill-bg)" strokeWidth="1.5" />
                      <polygon points="60,18 60,72 85,55" fill="rgba(255, 255, 255, 0.35)" stroke="var(--active-pill-bg)" strokeWidth="1" />
                    </svg>
                  </div>

                  <div className="pro-advantages-panel">
                    <div className="pro-advantages-header">
                      <h4 className="pro-advantages-title">{activeLease ? "Reliability Rating" : "Tenant Rating"}</h4>
                      <span className="pro-advantages-badge">{activeLease ? "★ 4.8" : "New Tenant"}</span>
                    </div>
                    <p className="pro-advantages-desc">
                      {activeLease
                        ? "Based on automated rent checks, ledger punctuality, and landlord checkouts."
                        : "Your Tenant Reliability Score will build automatically as you complete rental payments and lease terms."}
                    </p>

                    {activeLease && (
                      <div style={{ marginTop: "8px", width: "100%", height: "36px" }}>
                        <svg viewBox="0 0 200 45" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                          <defs>
                            <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M 0 35 Q 30 20 60 32 T 120 18 T 180 8" fill="none" stroke="#ffffff" strokeWidth="2.5" />
                          <path d="M 0 35 Q 30 20 60 32 T 120 18 T 180 8 L 180 45 L 0 45 Z" fill="url(#spark-grad)" />
                          <circle cx="180" cy="8" r="4.5" fill="#E5C583" />
                        </svg>
                      </div>
                    )}

                    <div className="pro-view-agreement-row mt-3">
                      <span className="text-[12px] font-bold text-white/90">
                        {activeLease ? "View Rating Details" : "Explore Property Listings"}
                      </span>
                      <div
                        className="pro-arrow-circle cursor-pointer"
                        onClick={() => activeLease ? setShowRatingModal(true) : setActiveTab(1)}
                        title={activeLease ? "View Rating Details" : "Search Listings"}
                      >
                        <ArrowRight className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Small Rectangular Payment Streak Card (Triggers Center Popup) */}
                <div
                  className="db-card streak-widget-card tour-streak cursor-pointer hover:scale-[1.01] transition-all"
                  onClick={() => setShowStreakModal(true)}
                  title="Click to view payment streak details"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-amber-500/15 dark:bg-amber-500/25 text-amber-500">
                        <Flame className="h-5 w-5 fill-amber-500 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-ink-900 dark:text-white tracking-tight">
                            {activeLease ? "184 Days" : "0 Days"}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-[#E5C583] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            🔥 Streak
                          </span>
                        </div>
                        <p className="text-[11.5px] text-ink-400 dark:text-cream-100/60 font-medium mt-0.5">
                          {activeLease ? "On-Time Rent Payment Record" : "Start your on-time payment streak"}
                        </p>
                      </div>
                    </div>
                    <div className="pro-arrow-circle">
                      <ArrowRight className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                </div>

              </div>

              {/* COLUMN 2: UTILITY ACTIVITY & TOTAL SPENT LEDGER */}
              <div className="db-col">

                {/* Redesigned Current Property Card */}
                <section className="db-card property-info-card tour-property">
                  <div className="db-card-header">
                    <h3 className="db-card-title">Current Property</h3>
                    <Building2 className="h-4.5 w-4.5 text-moss-600 dark:text-[#E5C583]" />
                  </div>

                  {activeLease ? (
                    <>
                      <div className="property-visual-banner mt-2">
                        <div className="property-banner-overlay" />
                        <svg viewBox="0 0 300 100" className="property-banner-svg">
                          <defs>
                            <linearGradient id="building-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                              <stop offset="0%" stopColor="#2c4633" stopOpacity="0.85" />
                              <stop offset="100%" stopColor="#a3bca7" stopOpacity="0.2" />
                            </linearGradient>
                          </defs>
                          <path d="M 0 80 Q 150 70 300 80 L 300 100 L 0 100 Z" fill="#2c4633" opacity="0.15" />
                          <rect x="30" y="30" width="40" height="70" rx="3" fill="url(#building-grad)" stroke="#2c4633" strokeWidth="1" />
                          <rect x="80" y="15" width="50" height="85" rx="4" fill="url(#building-grad)" stroke="#2c4633" strokeWidth="1.2" />
                          <rect x="140" y="40" width="35" height="60" rx="3" fill="url(#building-grad)" stroke="#2c4633" strokeWidth="1" />
                          <rect x="185" y="25" width="45" height="75" rx="3" fill="url(#building-grad)" stroke="#2c4633" strokeWidth="1" />
                        </svg>
                      </div>

                      <div className="property-details-body mt-4 text-left">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="property-name-title">{activeLease.propertyTitle || "Leased Unit"}</h4>
                            <p className="property-unit-subtitle">{activeLease.unit || "Active Tenancy"}</p>
                          </div>
                          <span className="property-status-badge">Leased</span>
                        </div>

                        <div className="property-meta-grid mt-4">
                          <div className="property-meta-item">
                            <span className="meta-lbl">Landlord</span>
                            <span className="meta-val">{activeLease.landlord || "Verified Landlord"}</span>
                          </div>
                          <div className="property-meta-item">
                            <span className="meta-lbl">Monthly Rent</span>
                            <span className="meta-val highlight-gold">{activeLease.price || "₦150,000"}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center px-4">
                      <p className="text-[13px] font-bold text-ink-900 dark:text-white">No Active Property Lease</p>
                      <p className="text-[12px] text-[#6C6E73] dark:text-[#A3BCA7] mt-1">
                        You have not been assigned to a leased unit yet. Browse the directory to apply for a property.
                      </p>
                      <Button
                        onClick={() => setActiveTab(1)}
                        className="mt-4 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] text-[12px] px-4 py-2"
                      >
                        Search Properties
                      </Button>
                    </div>
                  )}
                </section>

                {/* Sleek scrollable maintenance tickets timeline feed */}
                <section className="db-card tour-tracker">
                  <div className="db-card-header">
                    <h3 className="db-card-title">Maintenance</h3>
                    <span className="text-[12px] text-ink-400 dark:text-cream-100/50 font-bold">{requests.length} Active</span>
                  </div>

                  <div className="ticket-feed-list">
                    {requests.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 flex-1 text-center">
                        <p className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7]">No active maintenance requests filed.</p>
                      </div>
                    ) : (
                      requests.map((r) => (
                        <div key={r.id} className="ticket-feed-item">
                          <div>
                            <p
                              className="ticket-feed-title clickable"
                              onClick={() => {
                                setSelectedTicket(r);
                                setShowTicketModal(true);
                              }}
                            >
                              {r.title || r.details || "Maintenance Request"}
                            </p>
                            <p className="ticket-feed-meta">{r.category || r.type || "General"} • {r.date}</p>
                          </div>
                          <span className={`ticket-feed-status ${r.status.toLowerCase().replace(" ", "-")}`}>
                            {r.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              {/* COLUMN 3: VIRTUAL CARD & RENT BREAKDOWN */}
              <div className="db-col">

                {/* Standalone Visa Debit Card Widget with Embedded Progress Bar */}
                <section className="visa-card-widget tour-visa">
                  <div className="visa-header">
                    <div className="flex items-center gap-2">
                      <span className="visa-brand">Visa Debit</span>
                      <CreditCard className="h-4 w-4 opacity-80" />
                    </div>
                    <button
                      className="visa-pay-btn"
                      disabled={!activeLease || rentPaid}
                      onClick={() => {
                        if (!activeLease) {
                          triggerToast("No active lease or rent due.", "warning", "Rent Status");
                        } else if (rentPaid) {
                          triggerToast("Rent for this period is already paid!", "info", "Rent Paid");
                        } else {
                          setShowPayModal(true);
                        }
                      }}
                    >
                      {!activeLease ? "No Rent Due" : rentPaid ? "Settled" : "Pay Rent"}
                    </button>
                  </div>

                  <div className="visa-balance-group">
                    <span className="visa-balance-sub">Ledger Balance</span>
                    <div className="visa-balance">
                      {!activeLease || rentPaid ? "₦0.00" : "₦150,000"}
                    </div>
                  </div>

                  <div className="visa-progress-group">
                    <div className="visa-progress-lbl">
                      <span>Rent Paid</span>
                      <span>{activeLease ? (rentPaid ? "100%" : "0%") : "0%"}</span>
                    </div>
                    <div className="visa-progress-track">
                      <div
                        className="visa-progress-fill"
                        style={{ width: activeLease ? (rentPaid ? "100%" : "0%") : "0%" }}
                      />
                    </div>
                  </div>

                  <div className="visa-footer">
                    <span>•••• 6802</span>
                    <span>09/28</span>
                  </div>
                </section>

                {/* Redesigned Doughnut Rent Breakdown */}
                <section className="db-card breakdown-card tour-breakdown">
                  <div className="db-card-header">
                    <h3 className="db-card-title">Monthly Rent Breakdown</h3>
                    <span className="text-[12px] text-ink-400 dark:text-cream-100/50 font-bold">{activeLease ? "Split" : "0 Active"}</span>
                  </div>

                  {activeLease ? (
                    <>
                      <div className="doughnut-chart-wrapper">
                        <svg className="doughnut-chart-svg" viewBox="0 0 36 36">
                          {/* Segment 1: Base Rent (86% = stroke-dasharray 86 14) */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2C4633" strokeWidth="3" strokeDasharray="86 14" strokeDashoffset="25" />
                          {/* Segment 2: Utilities (10% = stroke-dasharray 10 90) */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E5C583" strokeWidth="3" strokeDasharray="10 90" strokeDashoffset="39" />
                          {/* Segment 3: Service Charge (4% = stroke-dasharray 4 96) */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8c8c86" strokeWidth="3" strokeDasharray="4 96" strokeDashoffset="49" />
                        </svg>
                        <div className="doughnut-center-text">
                          <span className="doughnut-center-val">86%</span>
                          <span className="doughnut-center-lbl">Rent Base</span>
                        </div>
                      </div>

                      <div className="doughnut-legend">
                        <div className="doughnut-legend-item">
                          <span className="legend-color-dot" style={{ backgroundColor: "#2C4633" }} />
                          <span>Rent (86%)</span>
                        </div>
                        <div className="doughnut-legend-item">
                          <span className="legend-color-dot" style={{ backgroundColor: "#E5C583" }} />
                          <span>Utilities (10%)</span>
                        </div>
                        <div className="doughnut-legend-item">
                          <span className="legend-color-dot" style={{ backgroundColor: "#8c8c86" }} />
                          <span>Service (4%)</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 py-10 px-4 text-center my-auto">
                      <div className="p-3 bg-moss-50 dark:bg-white/5 rounded-full text-moss-700 dark:text-[#E5C583] mb-2">
                        <PieChart className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold text-[13px] text-ink-900 dark:text-white mb-1">No Active Rent Breakdown</h4>
                      <p className="text-[11.5px] text-ink-400 dark:text-cream-100/50 max-w-[220px] leading-relaxed">
                        Monthly budget splits for rent and utilities will appear once you have an active lease.
                      </p>
                    </div>
                  )}
                </section>
              </div>

            </div>
          </main>
        ) : activeTab === 1 ? (
          <TenantSearch
            setActiveTab={setActiveTab}
            setShowProfileModal={setShowProfileModal}
            tenantAvatar={tenantAvatar}
            onStartChat={(landlordName) => {
              localStorage.setItem("activeChatLandlordName", landlordName);
              setActiveTab(2);
            }}
          />
        ) : activeTab === 2 ? (
          <main className="db-main-content chat-tab-active">
            <TenantChat />
          </main>
        ) : activeTab === 3 ? (
          <main className="db-main-content">
            <TenantSettings
              onSignOut={handleSignOut}
              currentAvatar={tenantAvatar}
              onAvatarChange={setTenantAvatar}
              onProfileUpdate={(name, avatar) => {
                if (name) setUsername(name);
                if (avatar) setTenantAvatar(avatar);
              }}
            />
          </main>
        ) : (
          /* TAB 4+: UNDER DEVELOPMENT VIEWS */
          <div className="under-development-wrapper flex-1 flex items-center justify-center">
            <div className="under-dev-card text-center">
              <div className="sparkle-icon flex justify-center"><Sparkles className="h-6 w-6 text-moss-600 dark:text-[#E5C583]" /></div>
              <span className="tag mb-2 inline-block">Under Development</span>
              <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white mb-2">
                {getTabName()} Section
              </h2>
              <p className="text-[13px] text-muted max-w-sm mb-6 leading-relaxed">
                This page is currently under construction. We will notify you once these tenant features are pushed to production.
              </p>
              <Button onClick={() => setActiveTab(0)} className="dev-home-btn bg-[#202020] dark:bg-[#E5C583] text-white dark:text-[#0B1512] font-bold px-6 py-2.5 rounded-xl text-[12.5px]">
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* PRODUCT TOUR PORTAL CONTAINER */}
      {(showTourAsk || runTour) && (
        <div className="tour-portal-container">
          {/* Ask Modal dialog */}
          {showTourAsk && (
            <div className="tour-ask-backdrop">
              <div className="tour-ask-card">
                <div className="tour-ask-icon">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="tour-ask-title">Dashboard Onboarding</h3>
                <p className="tour-ask-desc">
                  Welcome to Lodale! Would you like Ayla to take you on a quick interactive guide around your new dashboard?
                </p>
                <div className="tour-ask-buttons">
                  <Button
                    onClick={() => setShowTourAsk(false)}
                    className="tour-ask-btn-no py-3"
                  >
                    No, Skip
                  </Button>
                  <Button
                    onClick={() => {
                      setShowTourAsk(false);
                      setRunTour(true);
                      setTourStep(0);
                    }}
                    className="tour-ask-btn-yes py-3"
                  >
                    Yes, Start
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Active spotlight mask and floating tutorial step box */}
          {runTour && (
            <>
              {/* Target Spotlight Mask */}
              <div className="tour-spotlight" style={spotlightStyle} />

              {/* Floating Tooltip Card */}
              <div className="tour-tooltip-card" style={tooltipStyle}>
                <div className="tour-guide-badge">
                  <div className="tour-guide-avatar">A</div>
                  <span className="tour-guide-name">Ayla (Lodale Guide)</span>
                </div>
                <div className="tour-tooltip-header">
                  <h4 className="tour-tooltip-title">{TOUR_STEPS[tourStep].title}</h4>
                  <span className="tour-tooltip-step">
                    {tourStep + 1} / {TOUR_STEPS.length}
                  </span>
                </div>
                <p className="tour-tooltip-content">{TOUR_STEPS[tourStep].content}</p>

                {/* Floating hand/pointer direction arrows */}
                <div className={`tour-pointer-arrow tour-pointer-${TOUR_STEPS[tourStep].placement}`}>
                  <Sparkles className="h-3 w-3 text-white" />
                </div>

                <div className="tour-tooltip-actions">
                  <button
                    type="button"
                    className="tour-btn-skip"
                    onClick={() => setRunTour(false)}
                  >
                    Skip
                  </button>

                  <div className="flex gap-2">
                    {tourStep > 0 && (
                      <button
                        type="button"
                        className="tour-btn-prev"
                        onClick={() => setTourStep(tourStep - 1)}
                      >
                        Back
                      </button>
                    )}
                    <Button
                      onClick={() => {
                        if (tourStep < TOUR_STEPS.length - 1) {
                          setTourStep(tourStep + 1);
                        } else {
                          setRunTour(false);
                          triggerToast("Guide completed! Welcome to your Lodale tenant portal.", "success", "Welcome");
                        }
                      }}
                      className="tour-btn-next"
                    >
                      {tourStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
