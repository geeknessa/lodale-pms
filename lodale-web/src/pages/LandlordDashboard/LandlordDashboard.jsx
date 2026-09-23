import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { triggerToast } from "../../context/ToastContext";
import { ratingService } from "../../services/ratingService";
import gsap from "gsap";
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  Settings,
  Bell,
  Mail,
  Plus,
  Search,
  SlidersHorizontal,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  HelpCircle,
  LogOut,
  ArrowUpRight,
  Star,
  ListChecks,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Trash2,
  BellOff,
  ClipboardList,
  Menu,
  FileText,
  Upload,
  CreditCard,
  Loader2,
  PlusCircle,
  UserPlus,
  Wrench,
  Briefcase,
  MoreVertical,
  CalendarDays
} from "lucide-react";
import { Logo, LogoMark } from "../../components/Logo";
import Button from "../../components/Button";
import { propertyService } from "../../services/propertyService";
import { applicationService } from "../../services/applicationService";
import LandlordProperties from "./LandlordProperties";
import UserInfo from "./components/UserInfo";
import TenantDetails from "./components/TenantDetails";
import RequestInfo from "./components/RequestInfo";
import LandlordChat from "./components/Landllordchat";
import LandlordApplications from "./components/LandlordApplications";
import LandlordReportModal from "./components/LandlordReportModal";
import UploadProofModal from "./components/UploadProofModal";
import LandlordMaintenance from "./components/LandlordMaintenance";
import LandlordCalendar from "./components/LandlordCalendar";
import SettingsTab from "./Settings";
import Tenants from "./Tenants";
import { leaseService } from "../../services/leaseService";
import { rentService } from "../../services/rentService";
import { maintenanceService } from "../../services/maintenanceService";
import { reminderService } from "../../services/reminderService";
import AutomatedRemindersModal from "../../components/AutomatedRemindersModal";
import { interactionTracker } from "../../utils/interactionTracker";
import "./LandlordDashboard.css";

const TOUR_STEPS = [
  // Sidebar tab steps (visible on any tab)
  {
    target: ".tour-nav-0",
    title: "Sidebar: Overview Dashboard",
    content: "Welcome to Lodale Landlord! This is your central control dashboard workspace.",
    placement: "right",
    tab: 0
  },
  {
    target: ".tour-nav-1",
    title: "Sidebar: Properties Portfolio",
    content: "Manage your registered properties, add units, edit listings, and view tenant assignments.",
    placement: "right",
    tab: 1
  },
  {
    target: ".tour-nav-2",
    title: "Sidebar: Tenant Registry",
    content: "Browse active occupant credentials, view reliability metrics, adjust terms, or delete records.",
    placement: "right",
    tab: 2
  },
  {
    target: ".tour-nav-3",
    title: "Sidebar: Applications",
    content: "Review, approve, or reject new lease applications directly from prospective tenants.",
    placement: "right",
    tab: 0
  },
  {
    target: ".tour-nav-4",
    title: "Sidebar: Maintenance",
    content: "Track and resolve maintenance requests submitted by your tenants.",
    placement: "right",
    tab: 6
  },
  {
    target: ".tour-nav-5",
    title: "Sidebar: Reminders",
    content: "Automate and manage email/SMS payment or lease reminders.",
    placement: "right",
    tab: 5
  },
  {
    target: ".tour-nav-6",
    title: "Sidebar: Real-Time Chat",
    content: "Communicate directly with your tenants in secure message threads.",
    placement: "right",
    tab: 3
  },
  {
    target: ".tour-nav-7",
    title: "Sidebar: Profile Settings",
    content: "Adjust your public business name, contact credentials, and login passwords.",
    placement: "right",
    tab: 4
  },

  // Homepage steps (tab: 0)
  {
    target: ".tour-welcome",
    title: "Onboarding: Overview Header",
    content: "Greets your active landlord session and presents report templates.",
    placement: "bottom",
    tab: 0
  },
  {
    target: ".tour-pills",
    title: "Overview Categories",
    content: "Filter the dashboard panels between raw performance metrics, ledger collections, or pending applications.",
    placement: "bottom",
    tab: 0
  },
  {
    target: ".tour-add-property",
    title: "Add Property Unit",
    content: "Click here to register a new property listing with description details, photo references, and monthly rents.",
    placement: "bottom",
    tab: 0
  },
  {
    target: ".pro-advantages-panel",
    title: "Landlord Rating Star Index",
    content: "Shows your landlord reliability rating based on tenant reviews. New accounts display 'New Account' until tenant reviews are recorded.",
    placement: "bottom",
    tab: 0
  },
  {
    target: ".tour-occupancy",
    title: "Weekly Activity & Occupancy",
    content: "Displays your portfolio's active Occupancy Rate alongside daily tenant interactions (maintenance requests, messages, and inquiry logs) for each day of the week (Mon–Sun). When occupancy is 0%, daily activity stays at 0%.",
    placement: "right",
    tab: 0
  },
  {
    target: ".tour-property-list",
    title: "My Properties Registry",
    content: "Quick-scroll through your listings. Click the action icon to view units specs directly.",
    placement: "top",
    tab: 0
  },
  {
    target: ".tour-vault",
    title: "Payout Account Wallet",
    content: "Tracks accumulated rent ledger balances, security deposits, and settlement status indicators.",
    placement: "left",
    tab: 0
  },
  {
    target: ".tour-requests",
    title: "Tenants Request Box",
    content: "Inspect active ticket submissions from tenants, ranging from plumbing repairs to structural upgrades.",
    placement: "top",
    tab: 0
  },

  // Properties steps (tab: 1)
  {
    target: ".tour-property-results",
    title: "Explore Listings",
    content: "Filter properties by location categories, edit specifications, or check associated tenants.",
    placement: "top",
    tab: 1
  },

  // Tenants steps (tab: 2)
  {
    target: ".tour-tenants-search",
    title: "Tenants Directory Search",
    content: "Search through verified profile lists by names or leased properties.",
    placement: "bottom",
    tab: 2
  },
  {
    target: ".tour-tenants-list",
    title: "Tenant Profile Stack",
    content: "Tracks payment timelines, NIN details, contact cards, and lease termination actions.",
    placement: "top",
    tab: 2
  }
];

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Retrieve username with per-tab sessionStorage priority & localStorage fallback
  const [username, setUsername] = useState(() => {
    const sessName = sessionStorage.getItem("username");
    if (sessName) return sessName;
    const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || sessionStorage.getItem("lastLoggedInEmail"))?.toLowerCase();
    const storedName = emailKey ? sessionStorage.getItem("username_" + emailKey) : null;
    return storedName || sessionStorage.getItem("username") || "Ada";
  });

  const [leases, setLeases] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [autoOpenAddTenantModal, setAutoOpenAddTenantModal] = useState(false);

  const getActiveTenantsList = () => {
    return (leases || [])
      .filter(l => l && (l.status === 'active' || l.status === 'leased'))
      .map(l => {
        const hasUnpaidInvoice = (invoices || []).some(i => String(i.lease_id) === String(l.id) && (i.status === 'unpaid' || i.status === 'overdue'));
        return {
          id: l.id,
          name: l.tenant_name || l.tenantName || "Unknown Tenant",
          email: l.tenant_email || l.tenantEmail || "",
          rentAmount: parseFloat(l.rent_amount || l.rentAmount || 0),
          propertyTitle: l.property_title || l.propertyTitle || "Leased Unit",
          paymentStatus: hasUnpaidInvoice ? 'Overdue' : (l.payment_status || l.paymentStatus || 'Paid'),
          startDate: l.start_date || l.startDate,
          endDate: l.end_date || l.endDate,
          rentPeriod: l.rent_period || l.rentPeriod || "annually"
        };
      });
  };

  const getActiveTenantsCount = () => {
    return getActiveTenantsList().length;
  };

  const getLandlordRatingData = () => {
    const currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId") || "landlord";
    return ratingService.getLandlordReviews(currentUserId);
  };

  const ratingData = getLandlordRatingData();

  // Active sidebar tab
  const [activeTab, setActiveTab] = useState(0);

  // Active top navigation pill
  const [activePill, setActivePill] = useState("Overview");

  // Selected sub-tab in payments popup
  const [paymentSubTab, setPaymentSubTab] = useState("Paid");

  const [selectedTenantForDetails, setSelectedTenantForDetails] = useState(null);
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState(null);
  const [showLandlordProfileModal, setShowLandlordProfileModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivityDay, setSelectedActivityDay] = useState(null);

  const [weeklyStats, setWeeklyStats] = useState(() => {
    const userId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId");
    return interactionTracker.getWeeklyStatsForLandlord(userId);
  });

  useEffect(() => {
    const handleStatsUpdate = () => {
      const userId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId");
      setWeeklyStats(interactionTracker.getWeeklyStatsForLandlord(userId));
    };
    window.addEventListener("propertyInteractionsUpdated", handleStatsUpdate);
    return () => window.removeEventListener("propertyInteractionsUpdated", handleStatsUpdate);
  }, []);

  // Onboarding welcome overlay states
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const [showTourAsk, setShowTourAsk] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [recalcTrigger, setRecalcTrigger] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [spotlightStyle, setSpotlightStyle] = useState({});

  const currentDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  // Landlord profile avatar state (persisted across uploads)
  const [landlordAvatar, setLandlordAvatar] = useState(() => {
    const emailKey = sessionStorage.getItem("lastLoggedInEmail") || sessionStorage.getItem("lastLoggedInEmail");
    if (emailKey) {
      const savedUserAvatar = localStorage.getItem("landlordAvatar_" + emailKey.toLowerCase());
      if (savedUserAvatar && !savedUserAvatar.includes("unsplash.com")) return savedUserAvatar;
    }
    const globalSaved = sessionStorage.getItem("landlordAvatarUrl") || localStorage.getItem("landlordAvatarUrl");
    if (globalSaved && !globalSaved.includes("unsplash.com")) return globalSaved;
    try {
      const raw = sessionStorage.getItem("currentUserProfile") || sessionStorage.getItem("currentUserProfile");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.avatar && !parsed.avatar.includes("unsplash.com")) return parsed.avatar;
      }
    } catch (e) { }
    return "";
  });

  useEffect(() => {
    const handleAvatarUpdate = () => {
      const emailKey = sessionStorage.getItem("lastLoggedInEmail");
      let updated = null;
      if (emailKey) {
        updated = localStorage.getItem("landlordAvatar_" + emailKey.toLowerCase());
      }
      if (!updated) {
        updated = localStorage.getItem("landlordAvatarUrl");
      }
      if (!updated) {
        try {
          const raw = sessionStorage.getItem("currentUserProfile");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.avatar) updated = parsed.avatar;
          }
        } catch (e) { }
      }
      if (updated && !updated.includes("unsplash.com")) {
        setLandlordAvatar(updated);
      }
    };
    handleAvatarUpdate();
    window.addEventListener("storage", handleAvatarUpdate);
    return () => window.removeEventListener("storage", handleAvatarUpdate);
  }, []);

  // Getting Started banner visibility & dismissal state
  const [isGettingStartedDismissed, setIsGettingStartedDismissed] = useState(() => {
    const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
    if (sessionStorage.getItem("gettingStartedDismissed") === "true") return true;
    if (emailKey && localStorage.getItem("gettingStartedDismissed_" + emailKey) === "true") return true;
    return false;
  });

  const isNewSignUpUser = (() => {
    const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
    if (sessionStorage.getItem("isNewSignUp") === "true") return true;
    if (emailKey && localStorage.getItem("isNewUserSignUp_" + emailKey) === "true") return true;
    return false;
  })();

  const handleDismissGettingStarted = () => {
    setIsGettingStartedDismissed(true);
    sessionStorage.setItem("gettingStartedDismissed", "true");
    sessionStorage.removeItem("isNewSignUp");
    const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
    if (emailKey) {
      localStorage.setItem("gettingStartedDismissed_" + emailKey, "true");
      localStorage.removeItem("isNewUserSignUp_" + emailKey);
    }
  };
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    async function fetchBadgeCount() {
      try {
        localStorage.removeItem("propertyApplications");
        const apps = await applicationService.getLandlordApplications();
        setApplications(Array.isArray(apps) ? apps : []);
      } catch (err) {
        setApplications([]);
      }
    }
    fetchBadgeCount();
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  // Sync username & notifications if changed in storage
  useEffect(() => {
    const handleStorageChange = () => {
      const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || sessionStorage.getItem("lastLoggedInEmail"))?.toLowerCase();
      const storedName = emailKey ? sessionStorage.getItem("username_" + emailKey) : null;
      setUsername(sessionStorage.getItem("username") || storedName || "Landlord User");
    };
    handleStorageChange();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const markAllNotifsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
  };

  // Trigger onboarding welcome overlay for new users
  useEffect(() => {
    const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
    const hasSeenWelcome = localStorage.getItem("hasSeenLandlordWelcome_" + emailKey);
    
    if (!hasSeenWelcome && emailKey) {
      setShowWelcomeOverlay(true);
      localStorage.setItem("hasSeenLandlordWelcome_" + emailKey, "true");
    } else {
      setShowWelcomeOverlay(false);
    }
  }, []);

  // Animate welcome screen elements
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

  // Handle welcome overlay dismissal
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

  // Tour positioning calculation function
  const updateTourPosition = () => {
    if (!runTour) return;
    const stepData = TOUR_STEPS[tourStep];
    if (!stepData) return;

    const targetEl = document.querySelector(stepData.target);
    if (!targetEl) return;

    const rect = targetEl.getBoundingClientRect();

    setSpotlightStyle({
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      borderRadius: getComputedStyle(targetEl).borderRadius || "8px",
    });

    let tTop = 0;
    let tLeft = 0;
    const gap = 16;
    const tooltipWidth = 340;
    const tooltipHeight = 270;

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
      tTop = rect.top - tooltipHeight - gap;
      tLeft = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    }

    if (tLeft < 16) tLeft = 16;
    if (tLeft + tooltipWidth > window.innerWidth - 16) {
      tLeft = window.innerWidth - tooltipWidth - 16;
    }
    if (tTop < 16) tTop = 16;
    if (tTop + tooltipHeight > window.innerHeight - 16) {
      tTop = window.innerHeight - tooltipHeight - 16;
    }

    setTooltipStyle({
      top: `${tTop}px`,
      left: `${tLeft}px`,
    });
  };

  // Tour positioning and scrolling effect with instant execution & rAF frame tracking
  useEffect(() => {
    if (runTour) {
      const stepData = TOUR_STEPS[tourStep];
      const targetEl = document.querySelector(stepData?.target);

      if (!targetEl) {
        const retryTimer = setTimeout(() => {
          setRecalcTrigger((prev) => prev + 1);
        }, 100);
        return () => clearTimeout(retryTimer);
      }

      // Calculate position IMMEDIATELY with zero delay
      updateTourPosition();

      // Scroll main content container if target is inside it
      const container = document.querySelector(".db-main-content");
      if (container && container.contains(targetEl)) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const targetScrollTop = container.scrollTop + (targetRect.top - containerRect.top) - (container.clientHeight / 2) + (targetRect.height / 2);

        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: "smooth"
        });
      }

      // Smoothly update position on every frame while scrolling
      let animId;
      let startTime = performance.now();
      const tick = (now) => {
        updateTourPosition();
        if (now - startTime < 350) {
          animId = requestAnimationFrame(tick);
        }
      };
      animId = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(animId);
      };
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

  // Interactive click-to-jump step listener during tour
  useEffect(() => {
    if (!runTour) return;

    const handleTourClick = (e) => {
      // Don't intercept clicks inside the tour tooltip card or ask card
      if (e.target.closest(".tour-tooltip-card") || e.target.closest(".tour-ask-card")) {
        return;
      }

      // Check if clicked element or any ancestor matches any TOUR_STEPS target
      for (let i = 0; i < TOUR_STEPS.length; i++) {
        const step = TOUR_STEPS[i];
        const targetEl = document.querySelector(step.target);
        if (targetEl && (targetEl.contains(e.target) || e.target.closest(step.target))) {
          e.preventDefault();
          e.stopPropagation();

          // Jump immediately to this step!
          setTourStep(i);
          setRecalcTrigger((prev) => prev + 1);
          break;
        }
      }
    };

    // Attach click listener in capture phase so it catches clicks on cards/nav items instantly
    document.addEventListener("click", handleTourClick, true);
    return () => {
      document.removeEventListener("click", handleTourClick, true);
    };
  }, [runTour]);

  const handleApproveApplication = async (app) => {
    try {
      await apiClient(`/applications/${app.id}/status`, {
        method: 'PATCH',
        body: { status: 'approved' }
      });
      triggerToast(`Approved ${app.tenantName}'s application for ${app.propertyTitle}!`, "success", "Application Approved");
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error(err);
      triggerToast("Failed to approve application", "error", "Error");
    }
  };


  function handleSignOut() {
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
  }

  // Sidebar navigation items
  const sidebarItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard Home", tabIndex: 0, action: () => { setActiveTab(0); setActivePill("Overview"); } },
    { id: "properties", icon: Building2, label: "Properties", tabIndex: 1, action: () => setActiveTab(1) },
    { id: "tenants", icon: Users, label: "Tenants", tabIndex: 2, action: () => setActiveTab(2) },
    { id: "applications", icon: ClipboardList, label: "Applications", tabIndex: 0, action: () => { setActiveTab(0); setActivePill("Applications"); } },
    { id: "maintenance", icon: Wrench, label: "Maintenance", tabIndex: 6, action: () => setActiveTab(6) },
    { id: "chat", icon: MessageSquare, label: "Chat", tabIndex: 3, action: () => setActiveTab(3) },
    { id: "schedule", icon: CalendarDays, label: "Schedule", tabIndex: 5, action: () => setActiveTab(5) },
    { id: "settings", icon: Settings, label: "Settings", tabIndex: 4, action: () => setActiveTab(4) },
  ];

  // Filter listings where landlord name matches the username, or fallback to general listings list
  const [displayProperties, setDisplayProperties] = useState([]);
  const [selectedFeedbackProperty, setSelectedFeedbackProperty] = useState(null);
  const [selectedProofProperty, setSelectedProofProperty] = useState(null);

  const loadProperties = useCallback(async () => {
    const currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId");
    const currentName = (username || "").toLowerCase();
    const userEmail = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();

    let apiProps = [];
    if (currentUserId) {
      try {
        apiProps = await propertyService.getLandlordProperties(currentUserId);
      } catch (err) {
        console.warn("Error fetching landlord properties from API:", err);
      }
    }

    // Per-user session storage cache for active landlord ONLY
    let localProps = [];
    try {
      const userKey = "landlord_properties_" + (currentUserId || userEmail);
      const savedSessionProps = sessionStorage.getItem(userKey);
      if (savedSessionProps) {
        const parsed = JSON.parse(savedSessionProps);
        if (Array.isArray(parsed) && parsed.length > 0) localProps.push(...parsed);
      }
    } catch (err) {
      console.warn("Error reading local landlord properties:", err);
    }

    const propMap = new Map();
    const seenSignatures = new Set();

    const addUniqueProp = (p) => {
      if (!p || !p.id) return;

      // Strict landlord ownership validation: do NOT load another landlord's property!
      const pLandlordId = String(p.landlord_id || p.landlordId || p.landlord?.id || "").trim();
      const pLandlordName = String(p.landlord?.name || p.landlordName || p.landlord || "").trim().toLowerCase();

      if (currentUserId && pLandlordId && pLandlordId !== String(currentUserId).trim()) {
        return;
      }
      if (currentName && pLandlordName && !pLandlordName.includes(currentName) && !currentName.includes(pLandlordName)) {
        return;
      }

      const sig = `${(p.title || "").trim().toLowerCase()}|${(p.address_line1 || p.address || p.location || "").trim().toLowerCase()}`;
      if (propMap.has(p.id)) {
        const existing = propMap.get(p.id);
        propMap.set(p.id, { ...existing, ...p });
        return;
      }

      if (sig.length > 1 && seenSignatures.has(sig)) {
        return;
      }

      propMap.set(p.id, {
        ...p,
        price: p.price || formatCurrency(p.rent_amount || p.rent || 2500000, "/yr"),
        location: p.location || `${p.city || "Lagos"}, ${p.state || "Lagos"}`
      });
      if (sig.length > 1) seenSignatures.add(sig);
    };

    if (Array.isArray(apiProps)) {
      apiProps.forEach(addUniqueProp);
    }

    localProps.forEach(addUniqueProp);

    const finalProperties = Array.from(propMap.values());
    setDisplayProperties(finalProperties);
    return finalProperties;
  }, [username]);

  useEffect(() => {
    loadProperties();

    const handleSilentRefresh = () => loadProperties();
    window.addEventListener("storage", handleSilentRefresh);
    window.addEventListener("focus", handleSilentRefresh);
    return () => {
      window.removeEventListener("storage", handleSilentRefresh);
      window.removeEventListener("focus", handleSilentRefresh);
    };
  }, [loadProperties]);

  // Dynamic calculation for dashboard numbers & activity
  const activeTenantsList = getActiveTenantsList();
  const activeTenantsCount = activeTenantsList.length;
  const totalPropertiesCount = displayProperties.length;
  const occupancyRate = totalPropertiesCount === 0 ? 0 : Math.min(100, Math.round((activeTenantsCount / Math.max(1, totalPropertiesCount)) * 100));

  const parseTenantRent = (t) => {
    if (t.rentAmount && !isNaN(Number(t.rentAmount))) return Number(t.rentAmount);
    if (t.income) {
      const match = t.income.match(/[\d,]+/);
      if (match) {
        const val = Number(match[0].replace(/,/g, ""));
        if (!isNaN(val) && val > 0) return Math.min(val, 500000);
      }
    }
    return 250000;
  };

  const paidTenants = activeTenantsList.filter(t => t.paymentStatus === "Paid" || !t.paymentStatus || t.paymentStatus?.toLowerCase() === "paid");
  const overdueTenants = activeTenantsList.filter(t => t.paymentStatus === "Overdue" || t.paymentStatus === "Outstanding" || t.paymentStatus === "Unpaid");

  useEffect(() => {
    if (activeTenantsList && activeTenantsList.length > 0) {
      try {
        reminderService.checkAndDispatchReminders(activeTenantsList);
      } catch (e) {
        console.error("Error evaluating automated reminders:", e);
      }
    }
  }, [activeTenantsList.length]);

  const collectedAmount = paidTenants.reduce((sum, t) => sum + parseTenantRent(t), 0);
  const unpaidInvoicesSum = (invoices || [])
    .filter(i => i.status === 'unpaid' || i.status === 'overdue')
    .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  const overdueTenantsSum = overdueTenants.reduce((sum, t) => sum + parseTenantRent(t), 0);
  const rawOutstanding = unpaidInvoicesSum > 0 ? unpaidInvoicesSum : overdueTenantsSum;
  const outstandingAmount = (typeof rawOutstanding === 'number' && !isNaN(rawOutstanding)) ? Math.max(0, rawOutstanding) : 0;
  const availablePayoutBalance = activeTenantsCount === 0 ? 0 : collectedAmount;
  const pendingAppsCount = (applications || []).filter(a => {
    const st = (a.status || "").toLowerCase();
    return st === "pending" || st === "under_review";
  }).length;

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      await maintenanceService.updateRequestStatus(requestId, { status: newStatus.toLowerCase().replace(" ", "_") });
      triggerToast(`Request status updated to ${newStatus}`, "success");
      await fetchAllData();
    } catch (e) {
      console.error(e);
      triggerToast("Failed to update status", "error");
    }
  };

  // Tenant Maintenance/Upgrade Requests list
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [tenantRequests, setTenantRequests] = useState([]);

  const fetchAllData = async () => {
    try {
      setLoadingData(true);
      const [allLeases, invs, reqs, apps] = await Promise.all([
        leaseService.getMyLeases().catch(() => []),
        rentService.getMyInvoices().catch(() => []),
        maintenanceService.getMyRequests().catch(() => []),
        applicationService.getLandlordApplications().catch(() => []),
        loadProperties().catch(() => [])
      ]);

      setLeases(allLeases);
      setInvoices(invs);
      setApplications(Array.isArray(apps) ? apps : []);

      const statusMap = {
        open: 'Pending',
        pending: 'Pending',
        acknowledged: 'In Progress',
        in_progress: 'In Progress',
        pending_inspection: 'In Progress',
        resolved: 'Completed',
        closed: 'Completed'
      };
      setTenantRequests(reqs.map(r => ({
        id: r.id,
        title: r.title,
        propertyTitle: r.property_title || r.propertyTitle || r.property_name || r.propertyName || (r.property ? r.property.title : null) || "Property Unit",
        category: r.priority === 'emergency' ? 'Emergency' : 'Routine',
        urgency: r.priority ? r.priority.charAt(0).toUpperCase() + r.priority.slice(1) : 'Medium',
        details: r.description && r.description !== "No description provided." ? r.description : r.title,
        status: statusMap[r.status?.toLowerCase()] || 'Pending',
        date: new Date(r.created_at || Date.now()).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' }),
        tenantName: r.tenant_name || r.tenantName,
      })));
    } catch (e) {
      console.warn("Failed to load landlord data:", e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const displayRequests = showAllRequests ? tenantRequests : tenantRequests.slice(0, 2);

  return (
    <div className="db-wrapper">

      {/* HEADER BAR */}
      <header className="db-header">
        <div className="db-header-left flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-xl text-ink-700 dark:text-white hover:bg-ink-50 dark:hover:bg-white/10 transition-colors cursor-pointer mr-1 shrink-0 border-none bg-transparent outline-none flex items-center justify-center"
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            title="Toggle sidebar menu"
          >
            <Menu className="h-5 w-5 text-moss-700 dark:text-[#E5C583]" />
          </button>

          <div className="cursor-pointer hover:opacity-85 transition-opacity flex items-center" onClick={() => navigate("/explore")} title="Go to Public Guest Dashboard">
            <div className="hidden sm:block">
              <Logo variant="moss" />
            </div>
            <div className="block sm:hidden flex items-center">
              <LogoMark size={28} variant="moss" />
            </div>
          </div>


        </div>

        <div className="db-header-right flex items-center gap-3">
          {/* Active Tenants Avatar Stack & Plus Property Icon */}
          {(() => {
            const activeTenants = getActiveTenantsList();
            const displayTenants = activeTenants.slice(0, 2);

            return (
              <div className="flex items-center gap-2">
                <div
                  className="db-avatar-group cursor-pointer flex items-center -space-x-2"
                  onClick={() => setActiveTab(2)}
                  title="View Tenants List"
                >
                  {displayTenants.length > 0 ? (
                    displayTenants.map((t, idx) =>
                      t.avatar ? (
                        <img
                          key={t.id ? `nav-av-${t.id}-${idx}` : `nav-av-${idx}`}
                          src={t.avatar}
                          alt={t.name || "Tenant"}
                          className="w-7 h-7 rounded-full object-cover border-2 border-white dark:border-[#09090b]"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div
                          key={t.id ? `nav-av-${t.id}-${idx}` : `nav-av-${idx}`}
                          className={`w-7 h-7 rounded-full ${idx % 2 === 0 ? "bg-moss-700" : "bg-amber-600"} text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-[#09090b]`}
                        >
                          <User className="h-3.5 w-3.5" />
                        </div>
                      )
                    )
                  ) : (
                    <>
                      <div className="w-7 h-7 rounded-full bg-moss-700 text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-[#09090b]">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-[#09090b]">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    </>
                  )}
                </div>

                {/* Plus Icon Button beside Tenant Icon */}
                <button
                  onClick={() => navigate("/dashboard/landlord/add-property")}
                  className="w-7 h-7 rounded-full bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#d4b371] text-white dark:text-[#09090b] flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer shadow-xs border-none outline-none shrink-0"
                  title="Add New Property"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            );
          })()}

          {/* Quick Notification Tools */}
          <div className="db-icon-btn-group relative">
            <button
              className="db-icon-btn relative cursor-pointer"
              aria-label="Notifications"
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                if (!showNotifDropdown && unreadNotifCount > 0) {
                  markAllNotifsRead();
                }
              }}
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[9.5px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 top-12 z-[100] w-80 sm:w-[380px] rounded-3xl bg-white/95 dark:bg-[#07130D]/95 border border-[#E4EAE1] dark:border-white/10 shadow-2xl p-5 space-y-4 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 ease-out">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4EAE1] dark:border-white/10">
                  <h3 className="font-bold text-sm text-ink-900 dark:text-white flex items-center gap-2">
                    <Bell className="h-4.5 w-4.5 text-moss-700 dark:text-[#E5C583]" />
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#2C4633] text-white dark:bg-[#E5C583] dark:text-[#09090b] rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3">
                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          setNotifications([]);
                        }}
                        className="text-[11.5px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 cursor-pointer transition-colors border-none bg-transparent outline-none p-0"
                        title="Clear all notifications"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-xs font-bold text-ink-400 hover:text-ink-900 dark:hover:text-white cursor-pointer transition-colors border-none bg-transparent outline-none p-0"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-moss-700/20">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                      <div className="p-3 bg-ink-50 dark:bg-white/5 rounded-full text-ink-300 dark:text-cream-100/30">
                        <BellOff className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold text-[13px] text-ink-900 dark:text-white">All caught up!</h4>
                      <p className="text-[11.5px] text-ink-400 dark:text-cream-100/50 max-w-[200px] leading-normal">You have no new notifications.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isSuccess = notif.type === 'success';
                      const isWarning = notif.type === 'warning';
                      const borderClass = isSuccess
                        ? "border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-[#07130D]merald-950/10"
                        : isWarning
                          ? "border-l-4 border-l-rose-500 bg-rose-50/30 dark:bg-rose-950/10"
                          : "border-l-4 border-l-moss-700 dark:border-l-[#E5C583] bg-cream-50/30 dark:bg-white/5";

                      const IconComponent = isSuccess
                        ? CheckCircle2
                        : isWarning
                          ? AlertTriangle
                          : Info;

                      const iconColorClass = isSuccess
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-100/40 dark:bg-[#07130D]merald-950/30"
                        : isWarning
                          ? "text-rose-600 dark:text-rose-400 bg-rose-100/40 dark:bg-rose-950/30"
                          : "text-moss-700 dark:text-[#E5C583] bg-[#E4EAE1]/50 dark:bg-white/10";

                      return (
                        <div
                          key={notif.id}
                          className={`group relative p-3.5 rounded-2xl border border-ink-100/60 dark:border-white/5 flex items-start gap-3 transition-all duration-150 hover:bg-ink-50/30 dark:hover:bg-white/10 ${borderClass}`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center ${iconColorClass}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>

                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-bold text-[12.5px] text-ink-900 dark:text-white truncate">{notif.title}</span>
                            </div>
                            <p className="text-[11.5px] leading-relaxed text-ink-600 dark:text-cream-100/70 mt-1">{notif.message}</p>

                            {(notif.title?.includes("Proof") || notif.message?.includes("proof") || notif.title?.includes("Ownership")) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowNotifications(false);
                                  const target = displayProperties.find(p => notif.message?.includes(p.title) || notif.title?.includes(p.title)) || displayProperties.find(p => (p.status || "").toLowerCase().includes("info") || (p.status || "").toLowerCase().includes("proof")) || displayProperties[0];
                                  if (target) setSelectedProofProperty(target);
                                }}
                                className="mt-2 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-[#07130D]mber-950/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                              >
                                <Upload className="h-3.5 w-3.5" /> Upload Document Now &rarr;
                              </button>
                            )}

                            <span className="text-[10px] font-semibold text-ink-400 dark:text-cream-100/50 block mt-1.5">{notif.time || "Just now"}</span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotifications(prev => prev.filter(n => n.id !== notif.id));
                            }}
                            className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 focus:opacity-100 text-ink-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-150 p-1 cursor-pointer border-none bg-transparent outline-none"
                            title="Delete notification"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            <button
              className="db-icon-btn"
              aria-label="Messages"
              onClick={() => setActiveTab(3)}
            >
              <Mail className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Logged in landlord user info */}
          <div
            className="db-user-profile cursor-pointer hover:opacity-85 transition-all duration-150"
            onClick={() => setShowLandlordProfileModal(true)}
            title="View landlord details"
          >
            <div className="db-user-avatar overflow-hidden rounded-full flex items-center justify-center bg-[#3A5A40]/10 dark:bg-[#07130D] text-[#2C4633] dark:text-[#E5C583] border border-[#2C4633]/20 dark:border-white/20">
              {landlordAvatar ? (
                <img src={landlordAvatar} alt="Landlord profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4.5 w-4.5 text-[#2C4633] dark:text-[#E5C583]" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="db-user-name">{username}</p>
              <p className="db-user-role">Verified Landlord</p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* DASHBOARD CONTAINER */}
      <div className="db-container relative">

        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className={`db-sidebar ${isSidebarCollapsed ? "collapsed" : "expanded"} ${sidebarOpen ? "mobile-open" : ""}`}>
          <div className="db-sidebar-nav">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = item.id === "dashboard" ? activeTab === 0 && activePill !== "Applications"
                : item.id === "applications" ? activeTab === 0 && activePill === "Applications"
                  : activeTab === item.tabIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    setSidebarOpen(false);
                  }}
                  className={`db-sidebar-btn ${isActive ? "active" : ""} tour-nav-${index}`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="db-sidebar-label">{item.label}</span>
                  {isSidebarCollapsed && <span className="db-sidebar-tooltip">{item.label}</span>}
                </button>
              );
            })}
          </div>

          <div className="db-sidebar-bottom">
            <button
              onClick={() => {
                setTourStep(0);
                setRunTour(true);
                setSidebarOpen(false);
              }}
              className="db-sidebar-btn"
              title="Start Interactive Tour"
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span className="db-sidebar-label">Take a Tour</span>
              {isSidebarCollapsed && <span className="db-sidebar-tooltip">Take a Tour</span>}
            </button>
            <button
              onClick={() => {
                setSidebarOpen(false);
                handleSignOut();
              }}
              className="db-sidebar-btn logout-btn"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="db-sidebar-label">Log Out</span>
              {isSidebarCollapsed && <span className="db-sidebar-tooltip">Log Out</span>}
            </button>
          </div>
        </aside>

        {/* MAIN BODY AREA */}
        <main className={`db-main-content ${activeTab === 3 ? "chat-tab-active" : ""}`}>

          {/* Welcome Header (Only shown on Overview tab) */}
          {activeTab === 0 && activePill === "Overview" && (
            <div className="mb-6">
              <div className="db-sub-header-row">
                <div className="db-page-header tour-welcome">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-ink-900 dark:text-cream-100 flex items-center gap-2">
                        Welcome, {username || "Landlord"}
                      </h1>
                      <p className="text-xs sm:text-sm text-ink-500 dark:text-cream-100/70 mt-0.5">
                        Here is what is happening across your rental properties today.
                      </p>
                    </div>

                    {loadingData && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-[#07130D]merald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-[#E5C583] text-[11.5px] font-extrabold animate-pulse shadow-xs shrink-0">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 dark:text-[#E5C583]" />
                        <span>Loading portfolio data...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 0 ? (
            activePill === "Applications" ? (
              <div className="mt-2">
                <LandlordApplications setActiveTab={setActiveTab} />
              </div>
            ) : activePill === "Maintenance" ? (
              <div className="mt-2">
                <LandlordMaintenance />
              </div>
            ) : activePill === "Payments" ? (
              <div className="mt-4 space-y-6 animate-in fade-in duration-300">
                {/* RENT PAYMENTS & REVENUE HISTORY FULL SECTION */}
                <div className="bg-white dark:bg-[#07130D] rounded-3xl p-6 sm:p-8 border border-ink-100 dark:border-white/10 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-ink-100 dark:border-white/10">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-ink-900 dark:text-cream-100 flex items-center gap-3">
                        <CreditCard className="h-7 w-7 text-moss-600 dark:text-[#E5C583]" />
                        Rent Payments & Revenue History
                      </h2>
                      <p className="text-xs sm:text-sm text-ink-500 dark:text-cream-100/70 mt-1">
                        Track rent collections, pending payouts, and tenant payment statuses in real-time.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActivePill("Overview")}
                        className="px-4 py-2 bg-ink-100 dark:bg-white/10 hover:bg-ink-200 dark:hover:bg-white/20 text-ink-800 dark:text-cream-100 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Back to Overview
                      </button>
                    </div>
                  </div>

                  {/* STAT CARDS */}
                  {(() => {
                    const settings = reminderService.getSettings();
                    const nudgeDays = settings?.autoNudgeDays || 60;
                    
                    const expiringLeases = (leases || []).filter(l => {
                      if (!l.end_date && !l.endDate) return false;
                      const end = new Date(l.end_date || l.endDate);
                      const now = new Date();
                      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                      return diffDays >= 0 && diffDays <= nudgeDays;
                    });

                    return (
                      <div className={`grid grid-cols-1 sm:grid-cols-2 ${expiringLeases.length > 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 mb-8`}>
                        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-[#07130D]merald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block mb-1">Collected Rent (This Month)</span>
                          <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200">₦{collectedAmount.toLocaleString()}</span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block mt-1">From {paidTenants.length} paid lease contract{paidTenants.length === 1 ? '' : 's'}</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40">
                          <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 block mb-1">Outstanding Balance</span>
                          <span className="text-2xl font-black text-rose-900 dark:text-rose-200">₦{outstandingAmount.toLocaleString()}</span>
                          <span className="text-[11px] text-rose-700 dark:text-rose-400 block mt-1">{overdueTenants.length} tenant{overdueTenants.length === 1 ? '' : 's'} currently pending payment</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40">
                          <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 block mb-1">Available Payout Balance</span>
                          <span className="text-2xl font-black text-indigo-900 dark:text-indigo-200">₦{availablePayoutBalance.toLocaleString()}</span>
                          <button
                            onClick={() => setShowWithdrawModal(true)}
                            className="mt-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            Request Payout &rarr;
                          </button>
                        </div>

                        {expiringLeases.length > 0 && (
                          <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 relative overflow-hidden group cursor-pointer" onClick={() => setActiveTab(2)}>
                            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                              <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 block mb-1">Leases Expiring Soon</span>
                            <span className="text-2xl font-black text-purple-900 dark:text-purple-200">{expiringLeases.length}</span>
                            <span className="text-[11px] text-purple-700 dark:text-purple-400 font-bold block mt-1 underline">Action required &rarr;</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* FILTER TABS */}
                  <div className="flex items-center justify-between gap-4 mb-6 border-b border-ink-100 dark:border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <button
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${paymentSubTab === "Paid"
                          ? "bg-moss-700 text-white dark:bg-[#E5C583] dark:text-ink-950 shadow-sm"
                          : "bg-ink-100 dark:bg-white/10 text-ink-600 dark:text-cream-100/70 hover:bg-ink-200"
                          }`}
                        onClick={() => setPaymentSubTab("Paid")}
                      >
                        Collected Payments ({paidTenants.length})
                      </button>
                      <button
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${paymentSubTab === "Outstanding"
                          ? "bg-moss-700 text-white dark:bg-[#E5C583] dark:text-ink-950 shadow-sm"
                          : "bg-ink-100 dark:bg-white/10 text-ink-600 dark:text-cream-100/70 hover:bg-ink-200"
                          }`}
                        onClick={() => setPaymentSubTab("Outstanding")}
                      >
                        Outstanding ({overdueTenants.length})
                      </button>
                    </div>
                  </div>

                  {/* PAYMENT RECORDS LIST */}
                  <div className="space-y-3">
                    {paymentSubTab === "Paid" ? (
                      paidTenants.length === 0 ? (
                        <div className="p-10 text-center text-ink-400 dark:text-cream-100/60 bg-ink-50 dark:bg-white/5 rounded-2xl border border-dashed border-ink-200 dark:border-white/10">
                          <CreditCard className="h-10 w-10 mx-auto text-ink-300 dark:text-white/20 mb-3" />
                          <p className="text-sm font-semibold">No collected rent payments recorded yet.</p>
                          <p className="text-xs mt-1 opacity-70">When active tenants pay their rent, full payment records will appear here.</p>
                        </div>
                      ) : (
                        paidTenants.map((t, idx) => {
                          const amount = parseTenantRent(t);
                          return (
                            <div key={t.id || idx} className="p-4 rounded-2xl bg-ink-50/60 dark:bg-white/5 border border-ink-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-500/30 transition-all">
                              <div className="flex items-center gap-3.5">
                                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-black text-sm">
                                  ✓
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-ink-900 dark:text-white">{t.name || t.tenantName}</h4>
                                  <p className="text-xs text-ink-500 dark:text-cream-100/70 mt-0.5">{t.propertyTitle || t.leaseStatus || "Leased Property"}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-6">
                                <div className="text-left sm:text-right">
                                  <span className="font-black text-base text-emerald-600 dark:text-emerald-400 block">+₦{amount.toLocaleString()}</span>
                                  <span className="text-[11px] font-semibold text-ink-400 dark:text-cream-100/60 block">Paid • {t.dueDate || "Monthly Rent"}</span>
                                </div>
                                <span className="px-3 py-1 bg-emerald-100 dark:bg-[#07130D]merald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] rounded-full border border-emerald-300 dark:border-emerald-800">
                                  Completed
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )
                    ) : (
                      overdueTenants.length === 0 ? (
                        <div className="p-10 text-center text-ink-400 dark:text-cream-100/60 bg-emerald-50/50 dark:bg-[#07130D]merald-950/20 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-800/30">
                          <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
                          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">All tenant payments are up to date! 🎉</p>
                          <p className="text-xs mt-1 text-emerald-600 dark:text-emerald-400 opacity-80">There are currently no overdue or outstanding rent balances.</p>
                        </div>
                      ) : (
                        overdueTenants.map((t, idx) => {
                          const amount = parseTenantRent(t);
                          return (
                            <div key={t.id || idx} className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5">
                                <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl font-black text-sm">
                                  !
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-ink-900 dark:text-white">{t.name || t.tenantName}</h4>
                                  <p className="text-xs text-ink-500 dark:text-cream-100/70 mt-0.5">{t.propertyTitle || t.leaseStatus || "Leased Property"}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-6">
                                <div className="text-left sm:text-right">
                                  <span className="font-black text-base text-rose-600 dark:text-rose-400 block">₦{amount.toLocaleString()}</span>
                                  <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 block">Rent Outstanding</span>
                                </div>
                                <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-[11px] rounded-full border border-rose-300 dark:border-rose-800">
                                  Overdue
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* DASHBOARD CONTENT GRID (URGENCY-FIRST LAYOUT) */
              <div className="space-y-6">

                {/* GETTING STARTED CHECKLIST (ONLY FOR NEW LANDLORDS ON SIGN UP) */}
                {isNewSignUpUser && !isGettingStartedDismissed && displayProperties.length === 0 && !loadingData && (
                  <div className="relative bg-[#0B2519] dark:bg-[#071911] text-white p-6 sm:p-8 rounded-3xl border border-[#1B4D35] dark:border-[#133A27] shadow-xl space-y-6 animate-in fade-in duration-300">
                    {/* Exit / Dismiss Button */}
                    <button
                      type="button"
                      onClick={handleDismissGettingStarted}
                      aria-label="Close getting started guide"
                      title="Dismiss guide"
                      className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#E5C583]"
                    >
                      <X className="h-5 w-5" />
                    </button>

                    {/* Header */}
                    <div className="space-y-2 pr-10">
                      <span className="inline-block px-3.5 py-1 bg-[#E5C583]/20 text-[#F5D899] border border-[#E5C583]/40 text-[11px] font-black rounded-full uppercase tracking-wider shadow-sm">
                        Getting Started
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                        Welcome to Lodale! Let's get your rental portfolio set up
                      </h3>
                      <p className="text-xs sm:text-sm text-[#C8E4D5] font-medium leading-relaxed max-w-2xl">
                        Complete these quick steps to get your rental management active and start receiving applications.
                      </p>
                    </div>

                    {/* Step Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div
                        onClick={() => navigate("/dashboard/landlord/add-property")}
                        className="p-4 sm:p-5 rounded-2xl bg-[#133A27] hover:bg-[#1B4D35] border border-[#235F42] hover:border-[#E5C583]/60 cursor-pointer transition-all duration-200 space-y-3 group shadow-md"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#E5C583] text-[#0B2519] font-black text-sm flex items-center justify-center shadow-sm">
                          1
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm sm:text-base text-white group-hover:text-[#F5D899] transition-colors">
                            Add your first property
                          </h4>
                          <p className="text-xs text-[#B8DCC9] leading-relaxed">
                            Upload property photos, address, and rental prices.
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => { setAutoOpenAddTenantModal(true); setActiveTab(2); }}
                        className="p-4 sm:p-5 rounded-2xl bg-[#133A27] hover:bg-[#1B4D35] border border-[#235F42] hover:border-[#E5C583]/60 cursor-pointer transition-all duration-200 space-y-3 group shadow-md"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#E5C583] text-[#0B2519] font-black text-sm flex items-center justify-center shadow-sm">
                          2
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm sm:text-base text-white group-hover:text-[#F5D899] transition-colors">
                            Add or invite tenants
                          </h4>
                          <p className="text-xs text-[#B8DCC9] leading-relaxed">
                            Connect your active tenants to manage leases & rent.
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab(4)}
                        className="p-4 sm:p-5 rounded-2xl bg-[#133A27] hover:bg-[#1B4D35] border border-[#235F42] hover:border-[#E5C583]/60 cursor-pointer transition-all duration-200 space-y-3 group shadow-md"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#E5C583] text-[#0B2519] font-black text-sm flex items-center justify-center shadow-sm">
                          3
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm sm:text-base text-white group-hover:text-[#F5D899] transition-colors">
                            Set up payout account
                          </h4>
                          <p className="text-xs text-[#B8DCC9] leading-relaxed">
                            Receive direct rent settlements to your local account.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}



                {/* PROOF OF OWNERSHIP REQUIRED BANNER */}
                {(() => {
                  const needingProof = displayProperties.filter(p => {
                    const st = (p.status || "").toLowerCase();
                    return st.includes("info") || st.includes("proof");
                  });

                  if (needingProof.length === 0) return null;

                  return (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in slide-in-from-top duration-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0">
                          <AlertTriangle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-200">
                            Proof of Ownership Required for "{needingProof[0].title}"
                          </h4>
                          <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                            {needingProof[0].admin_notes || "Admin requested additional title documents (Certificate of Occupancy, Deed of Assignment, or Land Receipt) to verify property ownership before listing approval."}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedProofProperty(needingProof[0])}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer shrink-0 transition-all flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" /> Upload Proof Document Now
                      </button>
                    </div>
                  );
                })()}

                {/* ROW 1: 2 METRIC BOXES (ACCOUNT RATING + WEEKLY ACTIVITY) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* BOX 1: Account Rating Card */}
                  <div className="pro-advantages-panel">
                    <div className="pro-advantages-header">
                      <h4 className="pro-advantages-title">Account Rating</h4>
                      <span
                        className="pro-advantages-badge cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
                        onClick={() => setShowRatingModal(true)}
                        title="View rating reviews"
                      >
                        {ratingData.hasReviews ? `★ ${ratingData.rating}` : "New Account"}
                      </span>
                    </div>
                    <p
                      className="pro-advantages-desc cursor-pointer hover:text-[#E4EAE1] transition-colors"
                      onClick={() => setShowRatingModal(true)}
                      title="Click to view tenant reviews"
                    >
                      {ratingData.hasReviews
                        ? `Based on ${ratingData.count} verified tenant ${ratingData.count === 1 ? "review" : "reviews"} and on-time payouts.`
                        : "No tenant reviews yet. Complete active leases to build your platform reliability score."}
                    </p>

                    <div className="pro-advantages-chart-row">
                      <button
                        onClick={() => setShowRatingModal(true)}
                        className="pro-advantages-btn"
                        title="View reviews list"
                        style={{ marginLeft: "auto" }}
                      >
                        <ArrowUpRight className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <p className="pro-advantages-footer-text">
                      {ratingData.hasReviews ? "Join the top-rated landlords on Lodale." : "Build your landlord reputation on Lodale."}
                    </p>
                  </div>

                  {/* BOX 2: Weekly Activity Bar Chart Card */}
                  <section className="db-card activity-card tour-occupancy">
                    {(() => {
                      const todayDayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
                      const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                      
                      const maxInteractions = Math.max(1, ...weekDays.map(d => (weeklyStats[d]?.views || 0) + (weeklyStats[d]?.saves || 0)));
                      const totalWeeklyInteractions = weekDays.reduce((sum, d) => sum + (weeklyStats[d]?.views || 0) + (weeklyStats[d]?.saves || 0), 0);

                      return (
                        <>
                          <div className="activity-header">
                            <div>
                              <h3 className="activity-title">Weekly Activity</h3>
                              <p className="text-[11.5px] text-ink-400 dark:text-cream-100/60 font-medium mt-0.5">
                                Daily tenant interactions & unit occupancy
                              </p>
                            </div>
                            <span className="activity-badge">{totalWeeklyInteractions} Interactions</span>
                          </div>

                          <div className="activity-metric">
                            <span className="activity-val">
                              {displayProperties.length === 0 ? "0%" : `${occupancyRate}%`}
                            </span>
                            <span className="activity-sub">Occupancy Rate</span>
                          </div>

                          {/* Bar Graph */}
                          <div className="activity-chart-grid">
                            {weekDays.map((day) => {
                              const isToday = day === todayDayName;
                              const dayStats = weeklyStats[day] || { views: 0, saves: 0 };
                              const totalInteractions = dayStats.views + dayStats.saves;
                              const fillPercent = (totalInteractions / maxInteractions) * 100;
                              
                              const barHeight = totalInteractions > 0 ? `${fillPercent}%` : "8%";

                              return (
                                <div key={day} className="activity-bar-col" onClick={() => { setSelectedActivityDay(day); setShowActivityModal(true); }} style={{ cursor: "pointer" }}>
                                  <div className="activity-bar-container">
                                    <div
                                      className={`activity-bar-fill ${isToday ? "highlight" : ""}`}
                                      style={{ height: barHeight }}
                                    />
                                  </div>
                                  <span className="activity-bar-label">{day}</span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </section>

                </div>

                {/* ROW 2: TENANT REQUESTS (HALF WIDTH) + OCCUPANCY DONUT CHART (HALF WIDTH) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* LEFT: TENANT REQUESTS CARD */}
                  <div className="bg-white dark:bg-[#07130D] rounded-3xl p-5 sm:p-6 border border-ink-100 dark:border-white/10 shadow-sm space-y-4 tour-requests flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-[#1E293B] dark:text-cream-100">
                          Tenant requests
                        </h3>

                        <button
                          onClick={() => {
                            setActiveTab(6);
                            setActivePill("Maintenance");
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-cream-100 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          title="View All Maintenance Requests"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>

                      {tenantRequests.length === 0 ? (
                        loadingData ? (
                          <div className="py-8 text-center text-ink-400 dark:text-cream-100/60 space-y-2">
                            <Loader2 className="h-6 w-6 mx-auto animate-spin text-moss-600 dark:text-[#E5C583]" />
                            <p className="text-xs font-bold">Loading requests...</p>
                          </div>
                        ) : (
                          <div className="py-10 text-center text-slate-400 dark:text-cream-100/50 space-y-2">
                            <Briefcase className="h-9 w-9 mx-auto opacity-30" />
                            <p className="text-xs font-semibold">No tenant requests recorded</p>
                          </div>
                        )
                      ) : (
                        <div className="space-y-4">
                          {(() => {
                            const groups = {};
                            displayRequests.forEach(req => {
                              let dateKey = req.date || "RECENT";
                              try {
                                if (req.created_at || req.createdAt) {
                                  const d = new Date(req.created_at || req.createdAt);
                                  dateKey = d.toLocaleDateString("en-GB", { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                                }
                              } catch (e) { }
                              if (!groups[dateKey]) groups[dateKey] = [];
                              groups[dateKey].push(req);
                            });

                            return Object.entries(groups).map(([dateLabel, reqList]) => (
                              <div key={dateLabel} className="space-y-2">
                                <h4 className="text-[11px] font-bold text-slate-400 dark:text-cream-100/50 uppercase tracking-wider">
                                  {dateLabel}
                                </h4>

                                <div className="space-y-1">
                                  {reqList.map(req => {
                                    const st = (req.status || "Pending").toLowerCase();
                                    const actualPropertyTitle = req.propertyTitle || req.leaseStatus?.replace("Active Tenant (", "")?.replace(")", "") || "Leased Unit";
                                    const issueDescription = req.details || req.title || "Maintenance issue";

                                    const statusBadge =
                                      st === "in progress" || st === "in_progress" || st === "acknowledged"
                                        ? "bg-[#F59E0B] text-white"
                                        : st === "overdue" || st === "pending" || st === "open"
                                          ? "bg-[#EF4444] text-white"
                                          : "bg-[#10B981] text-white";

                                    const statusLabel =
                                      st === "in progress" || st === "in_progress" || st === "acknowledged"
                                        ? "IN PROGRESS"
                                        : st === "overdue"
                                          ? "OVERDUE"
                                          : st === "resolved" || st === "completed"
                                            ? "RESOLVED"
                                            : "PENDING";

                                    return (
                                      <div
                                        key={req.id}
                                        onClick={() => setSelectedRequestForDetails(req)}
                                        className="p-2.5 sm:p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-between gap-3 cursor-pointer group border border-transparent hover:border-slate-200/60 dark:hover:border-white/10"
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-cream-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <Briefcase className="h-4 sm:h-4.5 w-4 sm:w-4.5 text-slate-600 dark:text-cream-100" />
                                          </div>

                                          <div className="min-w-0">
                                            <h5 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-cream-100 group-hover:text-moss-700 dark:group-hover:text-[#E5C583] transition-colors truncate">
                                              {actualPropertyTitle}
                                            </h5>
                                            <p className="text-[11.5px] sm:text-xs text-slate-500 dark:text-cream-100/70 truncate mt-0.5">
                                              {issueDescription}
                                            </p>
                                          </div>
                                        </div>

                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full shadow-2xs shrink-0 ${statusBadge}`}>
                                          {statusLabel}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>

                    {tenantRequests.length > 2 && (
                      <button
                        onClick={() => setShowAllRequests(!showAllRequests)}
                        className="w-full py-2 text-xs font-bold text-moss-700 dark:text-[#E5C583] hover:underline text-center cursor-pointer pt-2 mt-2 border-t border-slate-100 dark:border-white/10"
                      >
                        {showAllRequests ? "Show Less" : "Show More Requests (" + tenantRequests.length + ")"}
                      </button>
                    )}
                  </div>

                  {/* RIGHT: PORTFOLIO OCCUPANCY DONUT CHART CARD */}
                  <div className="bg-white dark:bg-[#07130D] rounded-3xl p-5 sm:p-6 border border-ink-100 dark:border-white/10 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-bold text-[#1E293B] dark:text-cream-100 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-moss-700 dark:text-[#E5C583]" />
                        Occupancy Status
                      </h3>
                      <button
                        onClick={() => setActiveTab(1)}
                        className="text-xs font-bold text-moss-700 dark:text-[#E5C583] hover:underline cursor-pointer"
                      >
                        Manage Portfolio →
                      </button>
                    </div>

                    {(() => {
                      const totalProperties = displayProperties.length;
                      const occupiedCount = displayProperties.filter(p => {
                        const st = (p.status || "").toLowerCase();
                        return st === "occupied" || st === "active_occupied";
                      }).length;

                      const vacantCount = Math.max(0, totalProperties - occupiedCount);
                      const occRate = totalProperties > 0 ? Math.round((occupiedCount / totalProperties) * 100) : 0;

                      const radius = 38;
                      const circumference = 2 * Math.PI * radius;
                      const occupiedDash = totalProperties > 0 ? (occRate / 100) * circumference : 0;

                      return (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2 my-auto">
                          {/* SVG Donut Ring */}
                          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              {/* Vacant track (Theme Gold #E5C583) */}
                              <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                stroke="#E5C583"
                                strokeWidth="11"
                                fill="transparent"
                                className="opacity-80"
                              />
                              {/* Occupied track (Emerald Green #10B981) */}
                              <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                stroke="#10B981"
                                strokeWidth="11"
                                fill="transparent"
                                strokeDasharray={`${occupiedDash} ${circumference}`}
                                strokeLinecap="round"
                                className="transition-all duration-700 ease-out"
                              />
                            </svg>
                            {/* Inner Center Label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
                              <span className="text-xl font-black text-ink-900 dark:text-white">
                                {occRate}%
                              </span>
                              <span className="text-[10px] font-extrabold text-ink-400 dark:text-cream-100/60 uppercase tracking-tight mt-1">
                                Occupied
                              </span>
                            </div>
                          </div>

                          {/* Legend Breakdown */}
                          <div className="flex-1 space-y-3 w-full">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="w-3 h-3 rounded-full bg-[#10B981] shrink-0" />
                                <span className="text-xs font-bold text-slate-800 dark:text-emerald-300">Occupied Units</span>
                              </div>
                              <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">{occupiedCount}</span>
                            </div>

                            <div className="p-3 rounded-2xl bg-[#E5C583]/15 border border-[#E5C583]/30 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="w-3 h-3 rounded-full bg-[#E5C583] shrink-0" />
                                <span className="text-xs font-bold text-slate-800 dark:text-amber-300">Vacant Units</span>
                              </div>
                              <span className="text-sm font-black text-amber-700 dark:text-[#E5C583]">{vacantCount}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* ROW 3: RENT PAYMENTS HISTORY + QUICK ACTIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* LEFT: RENT PAYMENTS HISTORY */}
                  <div className="db-card p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#07130D] border border-ink-100 dark:border-white/10 shadow-sm box-border tour-vault overflow-hidden flex flex-col justify-between min-h-[220px]">
                    <div>
                      {/* Header with top Full History link */}
                      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-ink-100 dark:border-white/10">
                        <h3 className="text-xs font-extrabold text-ink-900 dark:text-cream-100 flex items-center gap-1.5 truncate">
                          <CreditCard className="h-4 w-4 text-moss-700 dark:text-[#E5C583] shrink-0" />
                          Rent Payments
                        </h3>
                        <button
                          onClick={() => setActivePill("Payments")}
                          className="text-[11px] font-extrabold text-moss-700 dark:text-[#E5C583] hover:underline cursor-pointer shrink-0"
                        >
                          Full History →
                        </button>
                      </div>

                      {/* Top Financial Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
                          <span className="text-[9.5px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">Collected</span>
                          <span className="text-sm font-black text-emerald-900 dark:text-emerald-300 block truncate mt-0.5">
                            ₦{collectedAmount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400/80 block mt-0.5">
                            {paidTenants.length} paid
                          </span>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col justify-between">
                          <span className="text-[9.5px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">Outstanding</span>
                          <span className="text-sm font-black text-rose-900 dark:text-rose-300 block truncate mt-0.5">
                            ₦{outstandingAmount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-rose-700 dark:text-rose-400/80 block mt-0.5">
                            {overdueTenants.length} pending
                          </span>
                        </div>
                      </div>

                      {/* Subtab Toggle Buttons */}
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl w-fit">
                        <button
                          className={`px-2.5 py-0.5 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer ${
                            paymentSubTab === "Paid"
                              ? "bg-white dark:bg-[#07130D] text-moss-800 dark:text-[#E5C583] shadow-xs"
                              : "text-slate-500 dark:text-cream-100/60 hover:text-slate-800 dark:hover:text-white"
                          }`}
                          onClick={() => setPaymentSubTab("Paid")}
                        >
                          Paid ({paidTenants.length})
                        </button>
                        <button
                          className={`px-2.5 py-0.5 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer ${
                            paymentSubTab === "Outstanding"
                              ? "bg-white dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 shadow-xs"
                              : "text-slate-500 dark:text-cream-100/60 hover:text-slate-800 dark:hover:text-white"
                          }`}
                          onClick={() => setPaymentSubTab("Outstanding")}
                        >
                          Outstanding ({overdueTenants.length})
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: QUICK ACTIONS */}
                  <div className="bg-white dark:bg-[#07130D] rounded-3xl p-5 sm:p-6 border border-ink-100 dark:border-white/10 shadow-sm space-y-3 flex flex-col justify-between min-h-[220px]">
                    <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-2">
                      <h3 className="text-base font-extrabold text-ink-900 dark:text-cream-100 flex items-center gap-2">
                        <SlidersHorizontal className="h-4.5 w-4.5 text-moss-700 dark:text-[#E5C583]" />
                        Quick Actions
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        onClick={() => navigate("/dashboard/landlord/add-property")}
                        className="w-full flex items-center justify-between p-3 px-3.5 rounded-2xl border border-ink-100 dark:border-white/10 bg-neutral-50 dark:bg-white/5 hover:bg-moss-700 hover:text-white dark:hover:bg-[#E5C583] dark:hover:text-ink-950 text-ink-900 dark:text-cream-100 font-bold text-xs transition-all duration-200 cursor-pointer shadow-2xs group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Building2 className="h-4 w-4 text-moss-700 dark:text-[#E5C583] group-hover:text-current transition-colors shrink-0" />
                          <span className="truncate">Add Property</span>
                        </div>
                        <Plus className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>

                      <button
                        onClick={() => { setActiveTab(0); setActivePill("Applications"); }}
                        className="w-full flex items-center justify-between p-3 px-3.5 rounded-2xl border border-ink-100 dark:border-white/10 bg-neutral-50 dark:bg-white/5 hover:bg-moss-700 hover:text-white dark:hover:bg-[#E5C583] dark:hover:text-ink-950 text-ink-900 dark:text-cream-100 font-bold text-xs transition-all duration-200 cursor-pointer shadow-2xs group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <ClipboardList className="h-4 w-4 text-moss-700 dark:text-[#E5C583] group-hover:text-current transition-colors shrink-0" />
                          <span className="truncate">Applications</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {pendingAppsCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white animate-pulse">
                              {pendingAppsCount}
                            </span>
                          )}
                          <Plus className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>

                      <button
                        onClick={() => { setActiveTab(0); setActivePill("Payments"); }}
                        className="w-full flex items-center justify-between p-3 px-3.5 rounded-2xl border border-ink-100 dark:border-white/10 bg-neutral-50 dark:bg-white/5 hover:bg-moss-700 hover:text-white dark:hover:bg-[#E5C583] dark:hover:text-ink-950 text-ink-900 dark:text-cream-100 font-bold text-xs transition-all duration-200 cursor-pointer shadow-2xs group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CreditCard className="h-4 w-4 text-moss-700 dark:text-[#E5C583] group-hover:text-current transition-colors shrink-0" />
                          <span className="truncate">Record Payment</span>
                        </div>
                        <Plus className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>

                      <button
                        onClick={() => {
                          setAutoOpenAddTenantModal(true);
                          setActiveTab(2);
                        }}
                        className="w-full flex items-center justify-between p-3 px-3.5 rounded-2xl border border-ink-100 dark:border-white/10 bg-neutral-50 dark:bg-white/5 hover:bg-moss-700 hover:text-white dark:hover:bg-[#E5C583] dark:hover:text-ink-950 text-ink-900 dark:text-cream-100 font-bold text-xs transition-all duration-200 cursor-pointer shadow-2xs group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <UserPlus className="h-4 w-4 text-moss-700 dark:text-[#E5C583] group-hover:text-current transition-colors shrink-0" />
                          <span className="truncate">Add Tenant</span>
                        </div>
                        <Plus className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    </div>
                  </div>

                </div>



                {/* 4. MY PROPERTIES PORTFOLIO CARD */}
                <section className="db-card properties-list-card tour-property-list">
                  <div className="activity-header">
                    <h3 className="activity-title" style={{ cursor: "pointer" }} onClick={() => setActiveTab(1)}>My Properties</h3>
                    <button
                      onClick={() => setActiveTab(1)}
                      className="activity-badge"
                      style={{ background: "rgba(38, 38, 38, 0.06)", border: "none", cursor: "pointer", transition: "all 0.2s ease" }}
                    >
                      View All
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[480px] overflow-y-auto pr-1">
                    {(() => {
                      const liveAndOccupiedProps = displayProperties.filter((p) => {
                        const status = (p.status || "").toLowerCase();
                        const isLiveOrApproved = status === "active_vacant" || status === "approved" || status === "live" || status === "active";
                        const isOccupied = status === "occupied" || status === "active_occupied";
                        return isLiveOrApproved || isOccupied;
                      });

                      if (liveAndOccupiedProps.length === 0) {
                        if (loadingData) {
                          return (
                            <div className="col-span-full py-10 text-center text-ink-400 dark:text-cream-100/60 space-y-2">
                              <Loader2 className="h-6 w-6 mx-auto animate-spin text-emerald-600 dark:text-[#E5C583]" />
                              <p className="text-xs font-bold text-ink-600 dark:text-cream-100/80">Fetching property records...</p>
                            </div>
                          );
                        }
                        return (
                          <div className="col-span-full text-center py-10 text-slate-400 dark:text-cream-100/50 text-xs font-semibold">
                            No live or occupied properties available.
                          </div>
                        );
                      }

                      return liveAndOccupiedProps.map((property) => {
                        const hasTenants = leases.some(l => String(l.property_id || l.propertyId) === String(property.id) && (l.status === 'active' || l.status === 'leased')) || property.status === "occupied" || property.status === "active_occupied";
                        return (
                          <div key={property.id} className="p-4 rounded-2xl border border-ink-100 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all flex flex-col justify-between gap-3.5 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded-xl bg-moss-700/10 dark:bg-[#E5C583]/15 text-moss-700 dark:text-[#E5C583] flex items-center justify-center shrink-0">
                                  <Building2 className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <h5 className="font-bold text-sm text-ink-900 dark:text-cream-100 truncate" title={property.title}>
                                    {property.title}
                                  </h5>
                                  <p className="text-xs text-ink-500 dark:text-cream-100/70 truncate" title={property.location}>
                                    {property.location}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => navigate(`/dashboard/landlord/properties/${property.id}`)}
                                className="p-1.5 rounded-xl bg-white dark:bg-white/10 text-ink-700 dark:text-cream-100 hover:bg-moss-700 hover:text-white dark:hover:bg-[#E5C583] dark:hover:text-ink-950 transition-all cursor-pointer border border-ink-100 dark:border-white/10 shadow-xs shrink-0"
                                title="View property details"
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between pt-2.5 border-t border-ink-100/60 dark:border-white/10">
                              <span className="text-xs font-black text-moss-700 dark:text-[#E5C583]">
                                {property.price}
                              </span>
                              {hasTenants ? (
                                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-black uppercase bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/20 shrink-0">
                                  <Users className="h-3.5 w-3.5" /> Occupied
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-black uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Live
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </section>

              </div>
            )
          ) : activeTab === 1 ? (
            <LandlordProperties />
          ) : activeTab === 2 ? (
            <Tenants setSelectedTenantForDetails={setSelectedTenantForDetails} setActiveTab={setActiveTab} initialShowAddModal={autoOpenAddTenantModal} onResetInitialAddModal={() => setAutoOpenAddTenantModal(false)} />
          ) : activeTab === 3 ? (
            <LandlordChat />
          ) : activeTab === 4 ? (
            <SettingsTab onShowReportModal={() => setShowReportModal(true)} />
          ) : activeTab === 5 ? (
            <LandlordCalendar activeTenants={paidTenants.concat(overdueTenants)} />
          ) : activeTab === 6 ? (
            <LandlordMaintenance />
          ) : (
            <div className="db-card" style={{ padding: "40px", textAlign: "center", borderRadius: "24px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-primary)" }}>Tab Coming Soon</h3>
              <p style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "14px" }}>
                The sidebar panel for this section is under active construction.
              </p>
            </div>
          )}

        </main>

      </div>

      {selectedTenantForDetails && (
        selectedTenantForDetails.isApplicant || selectedTenantForDetails.status === "pending" || selectedTenantForDetails.status === "application_received" ? (
          <UserInfo
            tenant={selectedTenantForDetails}
            onClose={() => setSelectedTenantForDetails(null)}
          />
        ) : (
          <TenantDetails
            tenant={selectedTenantForDetails}
            onClose={() => setSelectedTenantForDetails(null)}
            onChatClick={(tenant) => {
              setActiveTab(3); // Switch to Chat tab
            }}
          />
        )
      )}

      {selectedRequestForDetails && (
        <RequestInfo
          request={selectedRequestForDetails}
          onClose={() => setSelectedRequestForDetails(null)}
          onUpdateStatus={handleUpdateRequestStatus}
        />
      )}

      {showActivityModal && selectedActivityDay && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#07130D] rounded-3xl border border-[#E4EAE1] dark:border-white/10 max-w-sm w-full p-8 shadow-2xl relative text-center">
            <button
              className="absolute top-4 right-4 text-ink-400 dark:text-cream-100 hover:text-ink-900 dark:hover:text-white text-xl font-bold p-1 bg-[#FAF8F6] dark:bg-white/5 rounded-full h-8 w-8 flex items-center justify-center cursor-pointer transition-colors border-none outline-none"
              onClick={() => setShowActivityModal(false)}
            >
              &times;
            </button>
            <div className="mb-4">
              <span className="inline-block bg-moss-100 text-moss-700 dark:bg-[#E5C583]/20 dark:text-[#E5C583] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                {selectedActivityDay} Activity
              </span>
              <h2 className="text-4xl font-black text-ink-900 dark:text-white mb-2">
                {(weeklyStats[selectedActivityDay]?.views || 0) + (weeklyStats[selectedActivityDay]?.saves || 0)}
              </h2>
              <p className="text-xs text-ink-500 dark:text-cream-100/70 font-semibold uppercase tracking-wide">
                Total Interactions
              </p>
            </div>
            
            <div className="space-y-3 mt-6 text-left">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                    <span className="text-lg">👁️</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-ink-900 dark:text-white">Property Views</h4>
                    <p className="text-[11px] text-ink-500 dark:text-cream-100/60">Taps on listings</p>
                  </div>
                </div>
                <span className="text-lg font-black text-ink-900 dark:text-white">
                  {weeklyStats[selectedActivityDay]?.views || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                    <span className="text-lg">❤️</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-ink-900 dark:text-white">Property Saves</h4>
                    <p className="text-[11px] text-ink-500 dark:text-cream-100/60">User bookmarks</p>
                  </div>
                </div>
                <span className="text-lg font-black text-ink-900 dark:text-white">
                  {weeklyStats[selectedActivityDay]?.saves || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#07130D] rounded-3xl border border-[#E4EAE1] dark:border-white/10 max-w-md w-full p-8 shadow-2xl relative text-center">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-ink-400 dark:text-cream-100 hover:text-ink-900 dark:hover:text-white text-xl font-bold p-1 bg-[#FAF8F6] dark:bg-white/5 rounded-full h-8 w-8 flex items-center justify-center cursor-pointer transition-colors border-none outline-none"
              onClick={() => setShowRatingModal(false)}
            >
              &times;
            </button>

            <div className="flex justify-center mb-3">
              <div className="bg-amber-100 dark:bg-[#07130D]mber-900/20 p-3.5 rounded-full text-amber-500">
                <Star className="h-8 w-8 fill-current" />
              </div>
            </div>

            <h3 className="font-display text-xl font-bold text-ink-900 dark:text-white mb-1">Landlord Reviews & Ratings</h3>
            {ratingData.hasReviews ? (
              <p className="text-[12.5px] text-ink-400 dark:text-cream-100/70 mb-5 flex items-center justify-center gap-1">
                Overall score: <strong className="text-ink-900 dark:text-white font-bold flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0 inline" /> {ratingData.rating} / 5.0</strong> based on {ratingData.count} verified tenant {ratingData.count === 1 ? "review" : "reviews"}.
              </p>
            ) : (
              <p className="text-[12.5px] text-ink-400 dark:text-cream-100/70 mb-5">
                Your account is currently rated <strong className="text-moss-700 dark:text-[#E5C583]">New</strong> with no tenant reviews yet.
              </p>
            )}

            <div className="space-y-4 text-left max-h-[300px] overflow-y-auto pr-1 border-t border-[#E4EAE1] dark:border-white/10 pt-4">
              {!ratingData.hasReviews ? (
                <div className="text-center py-8 text-ink-400 dark:text-cream-100/60 space-y-2">
                  <Star className="h-8 w-8 mx-auto text-amber-400/40" />
                  <p className="text-xs font-semibold text-ink-800 dark:text-white">No tenant reviews yet</p>
                  <p className="text-[11.5px] max-w-[260px] mx-auto opacity-70">
                    When tenants submit reviews upon check-out or lease renewal, ratings will appear here.
                  </p>
                </div>
              ) : (
                ratingData.reviews.map((rev, i) => (
                  <div key={i} className="border-b border-[#E4EAE1]/60 dark:border-white/5 pb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[13px] font-bold text-ink-900 dark:text-white">{rev.tenantName || rev.author || "Anonymous Tenant"}</span>
                      <span className="text-[11px] text-[#D69E2E] font-bold flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0 inline" /> {rev.rating || "5.0"}
                      </span>
                    </div>
                    <p className="text-[12px] text-ink-600 dark:text-cream-100/80 leading-relaxed">
                      "{rev.comment || rev.text || "Great landlord experience."}"
                    </p>
                    <span className="text-[10px] text-ink-400 dark:text-cream-100/50">{rev.date || "Recent review"}</span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowRatingModal(false)}
              className="mt-6 w-full py-3 bg-[#2C4633] dark:bg-[#E5C583] hover:bg-[#1C3021] dark:hover:bg-[#d4b574] text-white dark:text-[#09090b] font-bold text-[13.5px] rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98] border-none outline-none"
            >
              Close Reviews
            </button>
          </div>
        </div>
      )}

      {showLandlordProfileModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#07130D] rounded-3xl border border-[#E4EAE1] dark:border-white/10 max-w-sm w-full p-8 shadow-2xl relative text-center">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-ink-400 dark:text-cream-100 hover:text-ink-900 dark:hover:text-white text-xl font-bold p-1 bg-[#FAF8F6] dark:bg-white/5 rounded-full h-8 w-8 flex items-center justify-center cursor-pointer transition-colors border-none outline-none"
              onClick={() => setShowLandlordProfileModal(false)}
            >
              &times;
            </button>

            {/* Profile Avatar */}
            <div className="relative mx-auto w-24 h-24 mb-4">
              <div className="w-full h-full flex items-center justify-center bg-moss-100 dark:bg-forest-900/60 rounded-full border-4 border-[#E4EAE1] dark:border-white/10 text-moss-800 dark:text-[#E5C583] overflow-hidden">
                {landlordAvatar ? (
                  <img src={landlordAvatar} alt="Landlord profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12" />
                )}
              </div>
              <span className="absolute bottom-0 right-0 bg-green-500 h-5 w-5 rounded-full border-2 border-white dark:border-[#07130D] shadow-sm z-10" />
            </div>

            {/* Name & Role */}
            <h3 className="font-display text-xl font-bold text-ink-900 dark:text-white mb-1">{username}</h3>
            <span className="inline-block bg-[#2C4633]/10 dark:bg-[#E5C583]/10 text-[#2C4633] dark:text-[#E5C583] text-[11px] font-bold px-3 py-1 rounded-full mb-6">
              Verified Landlord
            </span>

            {/* Details List */}
            <div className="space-y-3.5 text-left border-t border-[#E4EAE1] dark:border-white/10 pt-5">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-ink-400 dark:text-cream-100/70 font-medium">Email Address</span>
                <span className="text-ink-900 dark:text-white font-semibold">
                  {sessionStorage.getItem("lastLoggedInEmail") || "ada.k@lodale.com"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-ink-400 dark:text-cream-100/70 font-medium">Phone Number</span>
                <span className="text-ink-900 dark:text-white font-semibold">
                  {(() => {
                    try {
                      const p = JSON.parse(sessionStorage.getItem("currentUserProfile") || "{}");
                      return p.phone || "Not provided";
                    } catch (e) {
                      return "Not provided";
                    }
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-ink-400 dark:text-cream-100/70 font-medium">Account Rating</span>
                <span className="text-ink-900 dark:text-white font-semibold flex items-center gap-1">
                  {(() => {
                    let score = "New";
                    let count = 0;

                    if (count === 0) {
                      return (
                        <span className="text-ink-500 dark:text-cream-100/60 font-normal text-xs">
                          New (No reviews yet)
                        </span>
                      );
                    }

                    return (
                      <>
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0 inline" /> {score}{" "}
                        <span className="text-[11px] text-ink-400 dark:text-cream-100/50 font-normal">({count} {count === 1 ? "review" : "reviews"})</span>
                      </>
                    );
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-ink-400 dark:text-cream-100/70 font-medium">Member Since</span>
                <span className="text-ink-900 dark:text-white font-semibold">
                  {(() => {
                    return "Aug 2026";
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-ink-400 dark:text-cream-100/70 font-medium">Total Properties</span>
                <span className="text-ink-900 dark:text-white font-semibold">
                  {(() => {
                    try {
                      const count = displayProperties.length;
                      return `${count} ${count === 1 ? "Unit" : "Units"}`;
                    } catch (e) {
                      return "0 Units";
                    }
                  })()}
                </span>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => setShowLandlordProfileModal(false)}
              className="mt-6 w-full py-3 bg-[#2C4633] dark:bg-[#E5C583] hover:bg-[#1C3021] dark:hover:bg-[#d4b574] text-white dark:text-[#09090b] font-bold text-[13.5px] rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98] shadow-md shadow-[#2C4633]/10 border-none outline-none"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

      {/* 1. New Sign-Up Welcome Screen Modal overlay */}
      {showWelcomeOverlay && (
        <div className="welcome-modal-overlay" ref={overlayRef}>
          <div className="welcome-modal-card" ref={contentRef}>
            <div className="welcome-modal-icon-wrapper">
              <ListChecks className="h-8 w-8 text-[#E5C583] animate-pulse" />
            </div>
            <h2 className="welcome-modal-title">Welcome to Lodale, {username.split(" ")[0]}!</h2>
            <p className="welcome-modal-desc">
              Your landlord dashboard workspace is ready. Access rental listings, review pending tenant applications, manage monthly ledgers, and check active maintenance tickets.
            </p>
            <button className="welcome-modal-btn" onClick={handleDismissWelcome}>
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* 2. Interactive Tour Request Dialogue Pop-up */}
      {showTourAsk && (
        <div className="tour-ask-overlay">
          <div className="tour-ask-card">
            <h3 className="tour-ask-title">Would you like a quick tour?</h3>
            <p className="tour-ask-desc">
              Let us guide you around your landlord panel to show you how to register properties, approve applications, and inspect maintenance requests!
            </p>
            <div className="tour-ask-actions">
              <button
                className="tour-btn-no"
                onClick={() => setShowTourAsk(false)}
              >
                No, thanks
              </button>
              <button
                className="tour-btn-yes"
                onClick={() => {
                  setShowTourAsk(false);
                  setRunTour(true);
                  setTourStep(0);
                }}
              >
                Yes, start tour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Floating Portal Spotlight Mask Overlay */}
      {runTour && (
        <div className="tour-portal-backdrop">
          <div className="tour-spotlight-mask" style={spotlightStyle} />

          <div className="tour-tooltip-card" style={tooltipStyle}>
            <div className="tour-pointer-arrow" />
            <div className="tour-tooltip-header">
              <span className="tour-mascot-badge">Ayla (Lodale Guide)</span>
              <span className="tour-step-indicator">
                {tourStep + 1} / {TOUR_STEPS.length}
              </span>
            </div>

            <h4 className="tour-tooltip-title">
              {TOUR_STEPS[tourStep]?.title}
            </h4>
            <p className="tour-tooltip-content">
              {TOUR_STEPS[tourStep]?.content}
            </p>

            <div className="tour-tooltip-actions">
              <button
                className="tour-btn-skip"
                onClick={() => setRunTour(false)}
              >
                Skip Tour
              </button>

              <div className="tour-nav-buttons">
                {tourStep > 0 && (
                  <button
                    className="tour-btn-back"
                    onClick={() => setTourStep(prev => prev - 1)}
                  >
                    Back
                  </button>
                )}

                <button
                  className="tour-btn-next"
                  onClick={() => {
                    if (tourStep < TOUR_STEPS.length - 1) {
                      setTourStep(prev => prev + 1);
                    } else {
                      setRunTour(false);
                    }
                  }}
                >
                  {tourStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN REJECTION & FEEDBACK MODAL */}
      {selectedFeedbackProperty && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#07130D] border border-ink-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-ink-100 dark:border-white/10">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-bold text-base text-ink-900 dark:text-white">Admin Review Feedback</h3>
              </div>
              <button
                onClick={() => setSelectedFeedbackProperty(null)}
                className="p-1 rounded-lg text-ink-400 hover:text-ink-900 dark:hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-400 dark:text-cream-100/50">Property Listing</span>
                <p className="font-bold text-sm text-ink-900 dark:text-white">{selectedFeedbackProperty.title}</p>
                <p className="text-xs text-ink-600 dark:text-cream-100/70">{selectedFeedbackProperty.location}</p>
              </div>

              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-1">Reason / Notes from Admin:</span>
                <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
                  {selectedFeedbackProperty.admin_notes || selectedFeedbackProperty.adminNotes || "Ownership verification could not be confirmed with the provided title documents. Please upload a clearer copy of your Deed of Assignment or Certificate of Occupancy."}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  const target = selectedFeedbackProperty;
                  setSelectedFeedbackProperty(null);
                  setSelectedProofProperty(target);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Upload className="h-3.5 w-3.5" /> Upload Proof of Ownership
              </button>
              <button
                onClick={() => {
                  setSelectedFeedbackProperty(null);
                  navigate("/dashboard/landlord/add-property");
                }}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-xl cursor-pointer"
              >
                Full Re-submission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Proof of Ownership Modal */}
      <UploadProofModal
        isOpen={!!selectedProofProperty}
        onClose={() => setSelectedProofProperty(null)}
        property={selectedProofProperty}
        onSuccess={(updated) => {
          setDisplayProperties(prev => prev.map(p => String(p.id) === String(updated.id) ? { ...p, ...updated } : p));
        }}
      />

      {/* Landlord Portfolio Executive Statement Report Modal */}
      <LandlordReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        username={username}
        properties={displayProperties}
        leases={leases}
        invoices={invoices}
      />

      {/* Landlord Automated Reminders Modal */}
      <AutomatedRemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        activeTenants={paidTenants.concat(overdueTenants)}
        onShowToast={(msg) => triggerToast(msg, "info")}
      />
    </div>
  );
}
