import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { triggerToast } from "../../context/ToastContext";
import { useTheme } from "../../context/ThemeContext";
import { ratingService } from "../../services/ratingService";
import gsap from "gsap";
import {
  LayoutDashboard, Sun, Moon,
  Building2,
  Users,
  MessageSquare,
  Settings,
  Bell,
  Mail,
  Plus,
  HelpCircle,
  LogOut,
  Eye,
  Bookmark,
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
  Wrench,
  CalendarDays,
  ChevronRight,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Activity
} from "lucide-react";
import { Logo, LogoMark } from "../../components/Logo";
import { propertyService } from "../../services/propertyService";
import { applicationService } from "../../services/applicationService";
import { notificationService } from "../../services/notificationService";
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
import { profileService } from "../../services/profileService";
import { leaseService } from "../../services/leaseService";
import { rentService } from "../../services/rentService";
import { maintenanceService } from "../../services/maintenanceService";
import { reminderService } from "../../services/reminderService";
import AutomatedRemindersModal from "../../components/AutomatedRemindersModal";
import { interactionTracker } from "../../utils/interactionTracker";
import { onBroadcastAction } from "../../utils/actionBroadcaster";
import { formatCurrency, getRentPeriodSuffix, formatDateOnly, formatTimestamp, formatDisplayDate, getRentPeriodLabel } from "../../utils/formatters";
import { apiClient } from "../../lib/apiClient";
import { calculatePortfolioMetrics, getPropertyStatus } from "../../utils/landlordMetrics";
import "./LandlordDashboard.css";

const TOUR_STEPS = [
  // Sidebar tab steps (visible on any tab)
  {
    target: ".tour-nav-0",
    title: "Sidebar: Overview Dashboard",
    content: "Welcome to Lodale Landlord. This is your central control dashboard workspace.",
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
    title: "Sidebar: Real-Time Chat",
    content: "Communicate directly with your tenants in secure message threads.",
    placement: "right",
    tab: 3
  },
  {
    target: ".tour-nav-6",
    title: "Sidebar: Schedule",
    content: "Automate and manage email/SMS payment or lease reminders.",
    placement: "right",
    tab: 5
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
    title: "Dashboard Overview",
    content: "Welcome to your landlord portal overview, with quick access to actions, portfolio summaries, and reports.",
    placement: "bottom",
    tab: 0
  },
  {
    target: ".tour-add-property",
    title: "Add New Property",
    content: "Register a new property listing with unit specifications, photo uploads, pricing, and rental terms.",
    placement: "bottom",
    tab: 0
  },
  {
    target: ".tour-rating",
    title: "Account Rating",
    content: "Displays your platform reliability rating based on verified tenant reviews.",
    placement: "bottom",
    tab: 0
  },
  {
    target: ".tour-occupancy",
    title: "Occupancy Rate",
    content: "Displays your portfolio occupancy percentage (1 of 3 properties occupied = 33%) and tracks the balance between occupied and vacant properties.",
    placement: "right",
    tab: 0
  },
  {
    target: ".tour-property-list",
    title: "My Properties",
    content: "Quickly view your portfolio properties, verified statuses, and navigate directly into property details.",
    placement: "top",
    tab: 0
  },
  {
    target: ".tour-vault",
    title: "Total Collected Revenue",
    content: "Tracks lifetime collected rent revenue from tenant payments across all your lease agreements.",
    placement: "left",
    tab: 0
  },
  {
    target: ".tour-requests",
    title: "Tenant Requests",
    content: "Inspect and manage maintenance requests and repair tickets submitted by your tenants.",
    placement: "top",
    tab: 0
  },

  // Properties steps (tab: 1)
  {
    target: ".tour-property-results",
    title: "Properties Portfolio",
    content: "Filter properties by location categories, edit specifications, or check associated tenants.",
    placement: "top",
    tab: 1
  },

  // Tenants steps (tab: 2)
  {
    target: ".tour-tenants-search",
    title: "Tenants Directory Search",
    content: "Search through verified profile lists by tenant names or leased properties.",
    placement: "bottom",
    tab: 2
  },
  {
    target: ".tour-tenants-list",
    title: "Tenant Directory",
    content: "Tracks tenant profiles, contact details, payment statuses, and lease agreements.",
    placement: "top",
    tab: 2
  }
];

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
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
        const hasPaidInvoice = (invoices || []).some(i => String(i.lease_id) === String(l.id) && i.status === 'paid');
        const paymentStatus = hasUnpaidInvoice ? 'Overdue' : (hasPaidInvoice ? 'Paid' : (l.payment_status || l.paymentStatus || 'Pending'));
        return {
          id: l.id,
          name: l.tenant_name || l.tenantName || "Unknown Tenant",
          email: l.tenant_email || l.tenantEmail || "",
          rentAmount: parseFloat(l.rent_amount || l.rentAmount || 0),
          propertyTitle: l.property_title || l.propertyTitle || "Leased Unit",
          paymentStatus,
          startDate: l.start_date || l.startDate,
          endDate: l.end_date || l.endDate,
          rentPeriod: l.rent_period || l.rentPeriod || "annually"
        };
      });
  };

  const [ratingData, setRatingData] = useState({ hasReviews: false, rating: "New", count: 0, reviews: [] });

  useEffect(() => {
    let isMounted = true;
    const fetchLandlordRating = async () => {
      const currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId");
      if (currentUserId) {
        try {
          const res = await ratingService.getLandlordReviews(currentUserId);
          if (isMounted && res) setRatingData(res);
        } catch (e) {}
      }
    };
    fetchLandlordRating();
    window.addEventListener("landlordRatingUpdated", fetchLandlordRating);
    return () => {
      isMounted = false;
      window.removeEventListener("landlordRatingUpdated", fetchLandlordRating);
    };
  }, []);

  // Re-fetch fresh profile from backend on reload instead of trusting stale sessionStorage
  useEffect(() => {
    let isMounted = true;
    const syncFreshLandlordProfile = async () => {
      try {
        const [profile, roleProfile] = await Promise.all([
          userService.getProfile().catch(() => null),
          profileService.getMyProfile().catch(() => null)
        ]);
        if (isMounted && profile) {
          const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
          if (fullName) {
            setUsername(fullName);
            sessionStorage.setItem("username", fullName);
          }
          if (profile.avatar_url) {
            setLandlordAvatar(profile.avatar_url);
            sessionStorage.setItem("landlordAvatarUrl", profile.avatar_url);
          }
          const merged = { ...profile, ...(roleProfile || {}), role: "landlord", primary_role: "landlord" };
          sessionStorage.setItem("currentUserProfile", JSON.stringify(merged));
          sessionStorage.setItem("landlordCurrentProfile", JSON.stringify(merged));
        }
      } catch (err) {}
    };
    syncFreshLandlordProfile();
  }, []);

  const location = useLocation();
  // Active sidebar tab
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 0);

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

    const handleStartTour = () => setShowTourAsk(true);
    window.addEventListener("startLandlordTour", handleStartTour);

    return () => {
      window.removeEventListener("propertyInteractionsUpdated", handleStatsUpdate);
      window.removeEventListener("startLandlordTour", handleStartTour);
    };
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
    async function fetchNotifications() {
      try {
        const notifs = await notificationService.getMyNotifications();
        setNotifications(Array.isArray(notifs) ? notifs : []);
      } catch (err) {
        setNotifications([]);
      }
    }
    fetchBadgeCount();
    fetchNotifications();
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifDropdownRef = useRef(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    if (showNotifDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifDropdown]);

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

  const unreadNotifCount = notifications.filter(n => !n.read && !n.is_read).length;

  const markAllNotifsRead = async () => {
    try {
      await notificationService.markAsRead('all');
    } catch (e) {
      console.warn(e);
    }
    const updated = notifications.map(n => ({ ...n, read: true, is_read: true }));
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

  const handleTourComplete = (isSkip = false) => {
    setRunTour(false);
    const rawProf = sessionStorage.getItem("currentUserProfile") || sessionStorage.getItem("landlordCurrentProfile");
    let userProf = null;
    try {
      if (rawProf) userProf = JSON.parse(rawProf);
    } catch (e) {}
    
    const completeness = profileService.checkProfileCompleteness(userProf);
    if (!completeness.isComplete) {
      triggerToast(
        `Welcome! Please complete your profile (${completeness.missingFields.join(", ")}) to start managing properties.`,
        "warning",
        "Profile Incomplete",
        { label: "Go to Settings", onClick: () => setActiveTab(4) }
      );
      sessionStorage.setItem("isNewSignUpProfileComplete", "true");
      setActiveTab(4);
    } else if (!isSkip) {
      triggerToast("Guide completed! Welcome to your Lodale landlord portal.", "success", "Welcome");
    }
  };

  // Handle welcome overlay dismissal
  const handleDismissWelcome = () => {
    const doNext = () => {
      setShowWelcomeOverlay(false);
      setShowTourAsk(true);
    };

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
        onComplete: doNext
      });
    } else {
      doNext();
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
          const recheckEl = document.querySelector(stepData?.target);
          if (!recheckEl) {
            // Target is conditional or missing from screen; advance to next step
            if (tourStep < TOUR_STEPS.length - 1) {
              setTourStep(prev => prev + 1);
            } else {
              handleTourComplete(false);
            }
          } else {
            setRecalcTrigger((prev) => prev + 1);
          }
        }, 200);
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
    { id: "dashboard", icon: LayoutDashboard, Sun, Moon, label: "Dashboard Home", tabIndex: 0, action: () => { setActiveTab(0); setActivePill("Overview"); } },
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
    let currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId") || "";
    try {
      const uStr = sessionStorage.getItem("lodale_user") || localStorage.getItem("lodale_user");
      if (uStr) {
        const uObj = JSON.parse(uStr);
        if (uObj.id && !currentUserId) currentUserId = uObj.id;
      }
    } catch (_e) {}

    let apiProps = [];
    if (currentUserId) {
      try {
        apiProps = await propertyService.getLandlordProperties(currentUserId);
      } catch (err) {
        console.warn("Error fetching landlord properties from API:", err);
      }
    }

    const propMap = new Map();
    const addUniqueProp = (p) => {
      if (!p || !p.id) return;

      // Strict landlord ownership validation: do NOT load another landlord's property!
      const pLandlordId = String(p.landlord_id || p.landlordId || p.landlord?.id || "").trim();

      if (currentUserId && pLandlordId && pLandlordId !== String(currentUserId).trim()) {
        return;
      }

      if (propMap.has(p.id)) {
        const existing = propMap.get(p.id);
        propMap.set(p.id, { ...existing, ...p });
        return;
      }

      const locParts = [p.address_line1 || p.address, p.city, p.state].filter(Boolean);
      const computedLoc = p.location || (locParts.length > 0 ? locParts.join(', ') : (p.city || p.state || 'Abuja'));
      const propBeds = Number(p.bedrooms) || (Array.isArray(p.units) && p.units[0]?.bedrooms ? Number(p.units[0].bedrooms) : 1);
      const propBaths = Number(p.bathrooms) || (Array.isArray(p.units) && p.units[0]?.bathrooms ? Number(p.units[0].bathrooms) : 1);

      propMap.set(p.id, {
        ...p,
        price: p.price || formatCurrency(p.rent_amount || p.rent || 2500000, getRentPeriodSuffix(p.rent_period)),
        location: computedLoc,
        bedrooms: propBeds,
        bathrooms: propBaths,
        beds: propBeds,
        baths: propBaths
      });
    };

    if (Array.isArray(apiProps)) {
      apiProps.forEach(addUniqueProp);
    }

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
  // Single shared helper calculations across the entire dashboard
  const portfolioMetrics = useMemo(() => {
    return calculatePortfolioMetrics(displayProperties, leases, invoices);
  }, [displayProperties, leases, invoices]);

  // Valid properties: every non-deleted property owned by the landlord
  const validProperties = useMemo(() => {
    return displayProperties.filter(p => !p.is_deleted && p.status !== 'deleted');
  }, [displayProperties]);

  const activeDashboardProperties = validProperties;

  // Dynamic calculation for dashboard numbers & activity
  const activeTenantsList = getActiveTenantsList();
  const activeTenantsCount = portfolioMetrics.totalTenantsCount;
  
  const occupiedPropsCount = portfolioMetrics.occupiedProperties;
  const livePropsCount = portfolioMetrics.liveProperties;
  const occupancyRate = portfolioMetrics.occupancyRate;

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

  const paidTenants = activeTenantsList.filter(t => {
    const st = (t.paymentStatus || "").toLowerCase();
    return st === "paid" || !t.paymentStatus;
  });
  const overdueTenants = activeTenantsList.filter(t => {
    const st = (t.paymentStatus || "").toLowerCase();
    return st === "overdue" || st === "outstanding" || st === "unpaid";
  });

  // Metrics strictly derived from single shared helper:
  const paidInvoicesSum = portfolioMetrics.totalCollectedRevenue;
  const collectedAmount = portfolioMetrics.totalCollectedRevenue;

  const pendingAppsCount = (applications || []).filter(a => {
    const st = (a.status || "").toLowerCase();
    return st === "pending" || st === "under_review";
  }).length;

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };
  const displayName = username ? username.split(" ")[0] : "Landlord";

  // Month attribution and 6-month chart strictly derived from shared helper:
  const thisMonthRentCollected = portfolioMetrics.thisMonthRentCollected;
  const recentMonthlyIncome = portfolioMetrics.monthlyRevenueChart;
  const maxIncomeVal = Math.max(1000000, ...recentMonthlyIncome.map(m => m.amount));

  // Upcoming rent calculation for Expected Rent card
  const upcomingPayment = (() => {
    // 1. Look for next unpaid invoice
    const pendingInv = (invoices || [])
      .filter(i => {
        const st = (i.status || '').toLowerCase();
        return st === 'unpaid' || st === 'pending' || st === 'overdue' || st === 'draft';
      })
      .sort((a, b) => {
        const dateA = new Date(a.due_date || a.dueDate || a.issue_date || a.created_at || 0);
        const dateB = new Date(b.due_date || b.dueDate || b.issue_date || b.created_at || 0);
        return dateA - dateB;
      })[0];

    if (pendingInv) {
      const rawDate = pendingInv.due_date || pendingInv.dueDate || pendingInv.issue_date;
      const formattedDate = rawDate ? formatDateOnly(rawDate) : "—";
      const amt = parseFloat(pendingInv.grand_total || pendingInv.grandTotal || pendingInv.amount || pendingInv.subtotal || 0);
      return {
        tenantName: pendingInv.tenant_name || pendingInv.tenantName || "Active Tenant",
        propertyTitle: pendingInv.property_title || pendingInv.propertyTitle || "Leased Property",
        amount: amt > 0 ? `₦${amt.toLocaleString()}` : "₦0",
        dueDate: formattedDate,
        status: pendingInv.status === 'overdue' ? 'Overdue' : 'Due Soon',
        hasPayment: true
      };
    }

    // 2. Check active leases for next cycle
    const activeLease = (leases || []).find(l => {
      const st = (l.status || '').toLowerCase();
      return st === 'active' || st === 'leased';
    });

    if (activeLease) {
      const amt = parseFloat(activeLease.rent_amount || activeLease.rentAmount || activeLease.rent || 0);
      const rawDate = activeLease.next_payment_date || activeLease.nextPaymentDate || activeLease.end_date || activeLease.start_date;
      const formattedDate = rawDate ? formatDateOnly(rawDate) : "—";
      const tName = activeLease.tenant_name || activeLease.tenantName || (activeLease.tenant ? `${activeLease.tenant.first_name || ''} ${activeLease.tenant.last_name || ''}`.trim() : null) || (activeTenantsList[0]?.name) || "Active Tenant";
      return {
        tenantName: tName,
        propertyTitle: activeLease.property_title || activeLease.propertyTitle || (activeLease.property?.title) || "Leased Unit",
        amount: amt > 0 ? `₦${amt.toLocaleString()}` : "₦0",
        dueDate: formattedDate,
        status: "Upcoming",
        hasPayment: true
      };
    }

    // 3. Fallback to activeTenantsList if present
    if (activeTenantsList.length > 0) {
      const t = activeTenantsList[0];
      const rentAmt = parseTenantRent(t);
      return {
        tenantName: t.name || t.tenantName || "Active Tenant",
        propertyTitle: t.propertyTitle || "Leased Property",
        amount: `₦${rentAmt.toLocaleString()}`,
        dueDate: t.dueDate || "Next billing cycle",
        status: "Upcoming",
        hasPayment: true
      };
    }

    // Safe empty fallback
    return {
      tenantName: null,
      propertyTitle: null,
      amount: "₦0",
      dueDate: "No upcoming schedule",
      status: "None",
      hasPayment: false
    };
  })();

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

  const handleAddPropertyClick = () => {
    const rawProf = sessionStorage.getItem("currentUserProfile") || sessionStorage.getItem("landlordCurrentProfile");
    let userProf = null;
    try {
      if (rawProf) userProf = JSON.parse(rawProf);
    } catch (e) {}

    const completeness = profileService.checkProfileCompleteness(userProf);
    if (!completeness.isComplete) {
      triggerToast(`Profile Incomplete! You must complete all required profile fields (${completeness.missingFields.join(", ")}) in Settings before adding a property.`, "error", "Profile Incomplete");
      setActiveTab(4); // Navigate to Landlord Settings Tab
      return;
    }
    navigate("/dashboard/landlord/add-property");
  };

  // Tenant Maintenance/Upgrade Requests list
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [tenantRequests, setTenantRequests] = useState([]);

  const fetchAllData = async () => {
    try {
      setLoadingData(true);
      const [allLeases, invs, reqs, apps, notifs] = await Promise.all([
        leaseService.getMyLeases().catch(() => []),
        rentService.getMyInvoices().catch(() => []),
        maintenanceService.getMyRequests().catch(() => []),
        applicationService.getLandlordApplications().catch(() => []),
        notificationService.getMyNotifications().catch(() => []),
        loadProperties().catch(() => [])
      ]);

      setLeases(allLeases);
      setInvoices(invs);
      setApplications(Array.isArray(apps) ? apps : []);
      setNotifications(Array.isArray(notifs) ? notifs : []);

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

    // Regular polling for real-time notification & interaction updates (every 6 seconds)
    const interval = setInterval(async () => {
      try {
        const notifs = await notificationService.getMyNotifications();
        const freshNotifs = Array.isArray(notifs) ? notifs : (notifs?.notifications || []);
        
        setNotifications(prev => {
          const prevIds = new Set(prev.map(p => p.id));
          const newlyAdded = freshNotifs.filter(fn => !prevIds.has(fn.id) && !fn.is_read && !fn.read);
          if (newlyAdded.length > 0) {
            newlyAdded.forEach(n => {
              triggerToast(n.message || "New notification received", "info", n.title || "New Notification");
            });
            fetchAllData();
          }
          return freshNotifs;
        });
      } catch (e) {
        // Silent background poll error
      }
    }, 6000);

    const handleFocus = () => {
      fetchAllData();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    const unsubscribeBroadcast = onBroadcastAction(() => {
      fetchAllData();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      unsubscribeBroadcast();
    };
  }, []);

  const displayRequests = showAllRequests ? tenantRequests : tenantRequests.slice(0, 2);

  return (
    <div className="db-wrapper">

      {/* HEADER BAR */}
      <header className="db-header">
        <div className="db-header-left flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-xl text-ink-700 dark:text-white hover:bg-ink-50 dark:hover:bg-[#FFFFFF]/10 transition-colors cursor-pointer mr-1 shrink-0 border-none bg-transparent outline-none flex items-center justify-center"
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
                  onClick={handleAddPropertyClick}
                  className="tour-add-property w-7 h-7 rounded-full bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#d4b371] text-white dark:text-[#09090b] flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer shadow-xs border-none outline-none shrink-0"
                  title="Add New Property"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            );
          })()}

          {/* Quick Notification Tools */}
          <div className="db-icon-btn-group relative" ref={notifDropdownRef}>
            <button
              className="db-icon-btn relative cursor-pointer"
              aria-label="Notifications"
              onClick={() => {
                setShowNotifDropdown(prev => !prev);
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
              <div className="absolute right-0 top-12 z-[100] w-80 sm:w-[380px] rounded-3xl bg-[#FFFFFF]/95 dark:bg-[#192A1F]/95 border border-[#E4EAE1] dark:border-[#2C4633] shadow-2xl p-5 space-y-4 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 ease-out">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4EAE1] dark:border-[#2C4633]">
                  <h3 className="font-bold text-sm text-ink-900 dark:text-white flex items-center gap-2">
                    <Bell className="h-4.5 w-4.5 text-moss-700 dark:text-[#E5C583]" />
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#2C4633] text-white dark:bg-[#E5C583] dark:text-[#09090b] rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2.5">
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={markAllNotifsRead}
                        className="text-[11.5px] font-bold text-moss-700 dark:text-[#E5C583] hover:underline cursor-pointer transition-colors border-none bg-transparent outline-none p-0"
                        title="Mark all as read"
                      >
                        Mark All Read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={async () => {
                          try {
                            await notificationService.deleteNotification('all');
                          } catch (err) {
                            console.warn(err);
                          }
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
                      <div className="p-3 bg-ink-50 dark:bg-[#FFFFFF]/5 rounded-full text-ink-300 dark:text-cream-100/30">
                        <BellOff className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold text-[13px] text-ink-900 dark:text-white">All caught up!</h4>
                      <p className="text-[11.5px] text-ink-400 dark:text-cream-100/50 max-w-[200px] leading-normal">You have no new notifications.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isSuccess = notif.type === 'success';
                      const isWarning = notif.type === 'warning';
                      const isPayment = notif.reference_type === 'invoice' || notif.reference_type === 'payment' || notif.type === 'payment' || notif.title?.toLowerCase().includes('payment') || notif.title?.toLowerCase().includes('invoice');
                      const isApp = !isPayment && (notif.type === 'application' || notif.title?.toLowerCase().includes('application'));
                      const isUnread = !notif.is_read && !notif.read;

                      const borderClass = isPayment
                        ? "border-l-4 border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
                        : isSuccess
                          ? "border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10"
                          : isWarning
                            ? "border-l-4 border-l-rose-500 bg-rose-50/30 dark:bg-rose-950/10"
                            : isApp
                              ? "border-l-4 border-l-moss-600 bg-moss-50/30 dark:bg-moss-950/20"
                              : "border-l-4 border-l-moss-700 dark:border-l-[#E5C583] bg-cream-50/30 dark:bg-white/5";

                      const IconComponent = isPayment
                        ? CreditCard
                        : isSuccess
                          ? CheckCircle2
                          : isWarning
                            ? AlertTriangle
                            : isApp
                              ? ClipboardList
                              : Info;

                      const iconColorClass = isPayment
                        ? "text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/40"
                        : isSuccess
                          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-100/40 dark:bg-emerald-950/30"
                          : isWarning
                            ? "text-rose-600 dark:text-rose-400 bg-rose-100/40 dark:bg-rose-950/30"
                            : isApp
                              ? "text-moss-700 dark:text-[#E5C583] bg-[#E4EAE1]/60 dark:bg-white/10"
                              : "text-moss-700 dark:text-[#E5C583] bg-[#E4EAE1]/50 dark:bg-white/10";

                      return (
                        <div
                          key={notif.id}
                          onClick={async () => {
                            if (notif.id) {
                              try { await notificationService.markAsRead(notif.id); } catch {}
                            }
                            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true, read: true } : n));
                            setShowNotifDropdown(false);
                            const refType = (notif.reference_type || notif.type || '').toLowerCase();
                            const title = (notif.title || '').toLowerCase();
                            if (refType === 'chat' || title.includes('message')) {
                              if (notif.reference_id) {
                                sessionStorage.setItem("activeChatPartnerId", notif.reference_id);
                                localStorage.setItem("activeChatPartnerId", notif.reference_id);
                              }
                              setActiveTab(3);
                            } else if (refType === 'inspection' || title.includes('inspection')) {
                              setActiveTab(4);
                            } else if (refType === 'maintenance' || title.includes('maintenance') || title.includes('repair')) {
                              setActiveTab(0);
                              setActivePill("Maintenance");
                            } else if (refType === 'lease' || title.includes('lease')) {
                              setActiveTab(2);
                            } else if (refType === 'payment' || refType === 'invoice' || title.includes('payment') || title.includes('invoice') || refType === 'application' || title.includes('application')) {
                              setActiveTab(0);
                              setActivePill("Applications");
                            }
                          }}
                          className={`group relative p-3.5 rounded-2xl border border-ink-100/60 dark:border-white/5 flex items-start gap-3 transition-all duration-150 hover:bg-ink-50/40 dark:hover:bg-white/10 cursor-pointer ${borderClass}`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center ${iconColorClass}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>

                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-bold text-[12.5px] text-ink-900 dark:text-white truncate flex items-center gap-1.5">
                                {isUnread && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>}
                                {notif.title}
                              </span>
                            </div>
                            <p className="text-[11.5px] leading-relaxed text-ink-600 dark:text-cream-100/70 mt-1">{notif.message}</p>

                            {isPayment && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowNotifDropdown(false);
                                  setActiveTab(0);
                                  setActivePill("Applications");
                                }}
                                className="mt-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                              >
                                <CreditCard className="h-3.5 w-3.5" /> Verify Payment / View Application &rarr;
                              </button>
                            )}

                            {isApp && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowNotifDropdown(false);
                                  setActiveTab(0);
                                  setActivePill("Applications");
                                }}
                                className="mt-2 text-xs font-bold text-moss-800 dark:text-[#E5C583] bg-moss-100 hover:bg-moss-200 dark:bg-white/10 px-2.5 py-1 rounded-lg border border-moss-300 dark:border-white/20 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                              >
                                <ClipboardList className="h-3.5 w-3.5" /> Review Application &rarr;
                              </button>
                            )}

                            {(notif.reference_type === 'inspection' || notif.type === 'inspection' || notif.title?.toLowerCase().includes('inspection')) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowNotifDropdown(false);
                                  setActiveTab(4);
                                }}
                                className="mt-2 text-xs font-bold text-sky-800 dark:text-sky-300 bg-sky-100 hover:bg-sky-200 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-300 dark:border-sky-800 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                              >
                                <CalendarDays className="h-3.5 w-3.5" /> View Inspection Schedule &rarr;
                              </button>
                            )}

                            {(notif.reference_type === 'maintenance' || notif.type === 'maintenance' || notif.title?.toLowerCase().includes('maintenance') || notif.title?.toLowerCase().includes('repair')) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowNotifDropdown(false);
                                  setActiveTab(0);
                                  setActivePill("Maintenance");
                                }}
                                className="mt-2 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                              >
                                <Wrench className="h-3.5 w-3.5" /> View Maintenance Request &rarr;
                              </button>
                            )}

                            {(notif.reference_type === 'chat' || notif.type === 'chat' || notif.title?.toLowerCase().includes('message')) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowNotifDropdown(false);
                                  if (notif.reference_id) {
                                    sessionStorage.setItem("activeChatPartnerId", notif.reference_id);
                                    localStorage.setItem("activeChatPartnerId", notif.reference_id);
                                  }
                                  setActiveTab(3);
                                }}
                                className="mt-2 text-xs font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-300 dark:border-indigo-800 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                              >
                                <MessageSquare className="h-3.5 w-3.5" /> Open Chat Thread &rarr;
                              </button>
                            )}

                            {(notif.reference_type === 'lease' || notif.type === 'lease' || notif.title?.toLowerCase().includes('lease')) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowNotifDropdown(false);
                                  setActiveTab(2);
                                }}
                                className="mt-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                              >
                                <FileText className="h-3.5 w-3.5" /> View Lease & Tenancy &rarr;
                              </button>
                            )}

                            {(notif.title?.includes("Proof") || notif.message?.includes("proof") || notif.title?.includes("Ownership")) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowNotifDropdown(false);
                                  const target = displayProperties.find(p => notif.message?.includes(p.title) || notif.title?.includes(p.title)) || displayProperties.find(p => (p.status || "").toLowerCase().includes("info") || (p.status || "").toLowerCase().includes("proof")) || displayProperties[0];
                                  if (target) setSelectedProofProperty(target);
                                }}
                                className="mt-2 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                              >
                                <Upload className="h-3.5 w-3.5" /> Upload Document Now &rarr;
                              </button>
                            )}

                            <span className="text-[10px] font-semibold text-ink-400 dark:text-cream-100/50 block mt-1.5">
                              {notif.time || (notif.created_at ? new Date(notif.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Just now")}
                            </span>
                          </div>

                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                if (notif.id) await notificationService.markAsRead(notif.id);
                              } catch (err) {
                                console.warn(err);
                              }
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
            <div className="db-user-avatar overflow-hidden rounded-full flex items-center justify-center bg-[#3A5A40]/10 dark:bg-[#192A1F] text-[#2C4633] dark:text-[#E5C583] border border-[#2C4633]/20 dark:border-white/20">
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
                  {item.id === "applications" && pendingAppsCount > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white animate-pulse">
                      {pendingAppsCount}
                    </span>
                  )}
                  {isSidebarCollapsed && <span className="db-sidebar-tooltip">{item.label}</span>}
                </button>
              );
            })}
          </div>

          <div className="db-sidebar-bottom">
            <button
              className="db-sidebar-btn theme-toggle-btn mb-1"
              onClick={() => { toggleTheme(); setSidebarOpen(false); }}
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
              <span className="db-sidebar-label">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              {isSidebarCollapsed && <span className="db-sidebar-tooltip">Toggle Theme</span>}
            </button>
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
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] dark:text-cream-100 tracking-tight">
                        {getTimeOfDayGreeting()}, {displayName}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-cream-100/70 font-medium mt-1">
                        Here's what's happening with your properties today.
                      </p>
                    </div>

                    {loadingData && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-[#E5C583] text-[11.5px] font-extrabold animate-pulse shadow-xs shrink-0">
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
                <div className="bg-[#FFFFFF] dark:bg-[#192A1F] rounded-3xl p-6 sm:p-8 border border-ink-100 dark:border-[#2C4633] shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-ink-100 dark:border-[#2C4633]">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold font-display text-ink-900 dark:text-cream-100 flex items-center gap-3">
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
                        className="px-4 py-2 bg-ink-100 dark:bg-[#FFFFFF]/10 hover:bg-ink-200 dark:hover:bg-[#FFFFFF]/20 text-ink-800 dark:text-cream-100 font-bold text-xs rounded-xl transition-all cursor-pointer"
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
                        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block mb-1">Collected Rent (This Month)</span>
                          <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200">₦{portfolioMetrics.thisMonthRentCollected.toLocaleString()}</span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block mt-1">From active tenant payments for the current month</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40">
                          <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 block mb-1">Outstanding Balance</span>
                          <span className="text-2xl font-black text-rose-900 dark:text-rose-200">₦{portfolioMetrics.outstandingBalance.toLocaleString()}</span>
                          <span className="text-[11px] text-rose-700 dark:text-rose-400 block mt-1">{portfolioMetrics.unpaidInvoicesCount} invoice{portfolioMetrics.unpaidInvoicesCount === 1 ? '' : 's'} currently pending payment</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40">
                          <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 block mb-1">Total Collected Revenue</span>
                          <span className="text-2xl font-black text-indigo-900 dark:text-indigo-200">₦{portfolioMetrics.totalCollectedRevenue.toLocaleString()}</span>
                          <span className="text-[11px] text-indigo-700 dark:text-indigo-400 block mt-1">₦{portfolioMetrics.totalCollectedRevenue.toLocaleString()} total lifetime ledger revenue</span>
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
                  <div className="flex items-center justify-between gap-4 mb-6 border-b border-ink-100 dark:border-[#2C4633] pb-4">
                    <div className="flex items-center gap-2">
                      <button
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${paymentSubTab === "Paid"
                          ? "bg-moss-700 text-white dark:bg-[#E5C583] dark:text-ink-950 shadow-sm"
                          : "bg-ink-100 dark:bg-[#FFFFFF]/10 text-ink-600 dark:text-cream-100/70 hover:bg-ink-200"
                          }`}
                        onClick={() => setPaymentSubTab("Paid")}
                      >
                        Collected Payments ({portfolioMetrics.collectedPaymentsList.length})
                      </button>
                      <button
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${paymentSubTab === "Outstanding"
                          ? "bg-moss-700 text-white dark:bg-[#E5C583] dark:text-ink-950 shadow-sm"
                          : "bg-ink-100 dark:bg-[#FFFFFF]/10 text-ink-600 dark:text-cream-100/70 hover:bg-ink-200"
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
                      portfolioMetrics.collectedPaymentsList.length === 0 ? (
                        <div className="p-10 text-center text-ink-400 dark:text-cream-100/60 bg-ink-50 dark:bg-[#FFFFFF]/5 rounded-2xl border border-dashed border-ink-200 dark:border-[#2C4633]">
                          <CreditCard className="h-10 w-10 mx-auto text-ink-300 dark:text-white/20 mb-3" />
                          <p className="text-sm font-semibold">No collected rent payments recorded yet.</p>
                          <p className="text-xs mt-1 opacity-70">When active tenants pay their rent, full payment records will appear here.</p>
                        </div>
                      ) : (
                        portfolioMetrics.collectedPaymentsList.map((payment, idx) => {
                          return (
                            <div key={payment.id || idx} className="p-4 rounded-2xl bg-ink-50/60 dark:bg-[#FFFFFF]/5 border border-ink-100 dark:border-[#2C4633] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-500/30 transition-all">
                              <div className="flex items-center gap-3.5">
                                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                                  <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-ink-900 dark:text-white">{payment.tenantName}</h4>
                                  <p className="text-xs text-ink-500 dark:text-cream-100/70 mt-0.5">{payment.propertyTitle} • {payment.invoiceNumber}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-6">
                                <div className="text-left sm:text-right">
                                  <span className="font-black text-base text-emerald-600 dark:text-cream-100 block">+₦{payment.amount.toLocaleString()}</span>
                                  <span className="text-[11px] font-semibold text-ink-400 dark:text-cream-100/60 block">Paid • {payment.paymentDateFormatted}</span>
                                </div>
                                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] rounded-full border border-emerald-300 dark:border-emerald-800">
                                  Completed
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )
                    ) : (
                      overdueTenants.length === 0 ? (
                        <div className="p-10 text-center text-ink-400 dark:text-cream-100/60 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-800/30">
                          <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
                          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">All tenant payments are up to date!</p>
                          <p className="text-xs mt-1 text-emerald-600 dark:text-emerald-400 opacity-80">There are currently no overdue or outstanding rent balances.</p>
                        </div>
                      ) : (
                        overdueTenants.map((t, idx) => {
                          const amount = parseTenantRent(t);
                          return (
                            <div key={t.id || idx} className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5">
                                <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
                                  <AlertTriangle className="h-5 w-5" />
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
              /* DASHBOARD CONTENT GRID (REFERENCE-MATCHED LAYOUT) */
              <div className="space-y-6">

                {/* 1. GETTING STARTED CHECKLIST (FOR NEW SIGNUPS ONLY) */}
                {isNewSignUpUser && !isGettingStartedDismissed && displayProperties.length === 0 && !loadingData && (
                  <div className="relative bg-[#0B2519] dark:bg-[#192A1F] text-white p-6 sm:p-8 rounded-3xl border border-[#1B4D35] dark:border-[#2C4633] shadow-xl space-y-6 animate-in fade-in duration-300">
                    {/* Exit / Dismiss Button */}
                    <button
                      type="button"
                      onClick={handleDismissGettingStarted}
                      aria-label="Close getting started guide"
                      title="Dismiss guide"
                      className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 text-white/90 hover:text-white transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#E5C583]"
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
                        onClick={handleAddPropertyClick}
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

                {/* 2. PENDING APPLICATIONS ALERT BANNER */}
                {pendingAppsCount > 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-950 dark:text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md animate-in slide-in-from-top duration-200">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-emerald-600 text-white rounded-xl shrink-0 shadow-sm">
                        <ClipboardList className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm sm:text-base text-emerald-950 dark:text-emerald-100">
                            {pendingAppsCount} Pending Rental Application{pendingAppsCount > 1 ? "s" : ""}
                          </h4>
                          <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-600 text-white uppercase tracking-wider">
                            Action Required
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                          You have received prospective tenant application{pendingAppsCount > 1 ? "s" : ""} awaiting your review and approval.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab(0);
                        setActivePill("Applications");
                      }}
                      className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer shrink-0 transition-all flex items-center gap-2"
                    >
                      <ClipboardList className="h-4 w-4" /> Review Application{pendingAppsCount > 1 ? "s" : ""} &rarr;
                    </button>
                  </div>
                )}

                {/* 3. PROOF OF OWNERSHIP REQUIRED BANNER */}
                {(() => {
                  const needingProof = validProperties.filter(p => {
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

                {/* ROW 1: 4 TOP STAT CARDS (EXPANDED TO FULL WIDTH SPAN) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
                  {/* Card 1: Total Properties */}
                  <div
                    onClick={() => setActiveTab(1)}
                    className="bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-moss-700/30 dark:hover:border-[#E5C583]/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-11 w-11 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] border border-emerald-200/50 dark:border-emerald-800/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-moss-700 dark:group-hover:text-[#E5C583] group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#71717A] dark:text-white/60 block mb-1">
                        Total Properties
                      </span>
                      <h3 className="text-2xl font-bold font-serif text-[#1C1917] dark:text-white mb-1 tracking-tight">
                        {portfolioMetrics.totalProperties}
                      </h3>
                      <p className="text-[11px] text-[#71717A] dark:text-white/50 font-medium truncate">
                        {portfolioMetrics.propertiesSubline}
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Total Tenants */}
                  <div
                    onClick={() => setActiveTab(2)}
                    className="bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-moss-700/30 dark:hover:border-[#E5C583]/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-11 w-11 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] border border-emerald-200/50 dark:border-emerald-800/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Users className="h-5 w-5" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-moss-700 dark:group-hover:text-[#E5C583] group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#71717A] dark:text-white/60 block mb-1">
                        Total Tenants
                      </span>
                      <h3 className="text-2xl font-bold font-serif text-[#1C1917] dark:text-white mb-1 tracking-tight">
                        {activeTenantsCount}
                      </h3>
                      <p className="text-[11px] text-[#71717A] dark:text-white/50 font-medium truncate">
                        {paidTenants.length} Active | {overdueTenants.length} Pending
                      </p>
                    </div>
                  </div>

                  {/* Card 3: This Month's Rent (Received) */}
                  <div
                    onClick={() => { setActiveTab(0); setActivePill("Payments"); }}
                    className="bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-moss-700/30 dark:hover:border-[#E5C583]/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-11 w-11 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] border border-emerald-200/50 dark:border-emerald-800/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-moss-700 dark:group-hover:text-[#E5C583] group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#71717A] dark:text-white/60 block mb-1">
                        This Month's Rent (Received)
                      </span>
                      <h3 className="text-2xl font-bold font-serif text-[#1C1917] dark:text-white mb-1 tracking-tight truncate" title={`₦${thisMonthRentCollected.toLocaleString()}`}>
                        ₦{thisMonthRentCollected.toLocaleString()}
                      </h3>
                      <p className="text-[11px] text-[#71717A] dark:text-white/50 font-medium truncate">
                        {paidTenants.length} of {Math.max(activeTenantsCount, 1)} tenants paid
                      </p>
                    </div>
                  </div>

                  {/* Card 4: Total Collected Revenue */}
                  <div
                    onClick={() => { setActiveTab(0); setActivePill("Payments"); }}
                    className="tour-vault bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-moss-700/30 dark:hover:border-[#E5C583]/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-11 w-11 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] border border-emerald-200/50 dark:border-emerald-800/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-moss-700 dark:group-hover:text-[#E5C583] group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#71717A] dark:text-white/60 block mb-1">
                        Total Collected Revenue
                      </span>
                      <h3 className="text-2xl font-bold font-serif text-[#1C1917] dark:text-white mb-1 tracking-tight truncate" title={`₦${collectedAmount.toLocaleString()}`}>
                        ₦{collectedAmount.toLocaleString()}
                      </h3>
                      <p className="text-[11px] text-[#71717A] dark:text-white/50 font-medium truncate">
                        ₦{paidInvoicesSum.toLocaleString()} total ledger revenue
                      </p>
                    </div>
                  </div>
                </div>

                {/* TWO-COLUMN MAIN WORKSPACE */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                  {/* LEFT / CENTER COLUMN (8 cols): CHARTS, MY PROPERTIES, TENANT REQUESTS */}
                  <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-6">

                    {/* ROW 1: RENTAL INCOME OVERVIEW (FULL WIDTH OF LEFT COLUMN - APPLICATION STATUS CHART REMOVED) */}
                    <div className="w-full bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[300px]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4.5 w-4.5 text-moss-700 dark:text-[#E5C583]" />
                          <h3 className="text-sm sm:text-base font-bold text-[#1E293B] dark:text-cream-100">
                            Rental Income Overview
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-[11px] font-bold text-slate-600 dark:text-cream-100/70">
                          <CalendarDays className="h-3.5 w-3.5 text-moss-700 dark:text-[#E5C583]" />
                          <span>Last 6 Months</span>
                        </div>
                      </div>

                      {/* Bar Chart Area */}
                      <div className="flex items-end gap-3 pt-4 pb-1 h-52">
                        {/* Y-axis Labels */}
                        <div className="flex flex-col justify-between h-40 text-[10px] font-semibold text-slate-400 dark:text-cream-100/40 pb-5 pr-1 select-none shrink-0">
                          <span>₦{maxIncomeVal >= 1000000 ? `${(maxIncomeVal / 1000000).toFixed(1)}M` : `${Math.round(maxIncomeVal / 1000)}k`}</span>
                          <span>₦{(maxIncomeVal * 0.5) >= 1000000 ? `${((maxIncomeVal * 0.5) / 1000000).toFixed(1)}M` : `${Math.round((maxIncomeVal * 0.5) / 1000)}k`}</span>
                          <span>₦0</span>
                        </div>

                        {/* Bars Grid */}
                        <div className="flex-1 grid grid-cols-6 gap-2 sm:gap-3 items-end h-40 border-b border-slate-100 dark:border-white/10 pb-1">
                          {recentMonthlyIncome.map((m, idx) => {
                            const heightPct = Math.max(8, Math.round((m.amount / maxIncomeVal) * 100));
                            return (
                              <div key={idx} className="flex flex-col items-center h-full justify-end group cursor-pointer relative">
                                {/* Hover Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold whitespace-nowrap pointer-events-none z-10 shadow-sm">
                                  ₦{m.amount.toLocaleString()}
                                </div>
                                {/* Bar container */}
                                <div className="w-full max-w-[32px] bg-slate-100 dark:bg-white/5 rounded-t-lg overflow-hidden flex items-end h-full">
                                  <div
                                    className={`w-full rounded-t-lg transition-all duration-500 ${
                                      m.isCurrent
                                        ? "bg-moss-700 dark:bg-[#E5C583]"
                                        : "bg-moss-600/70 dark:bg-[#E5C583]/50 group-hover:bg-moss-700 dark:group-hover:bg-[#E5C583]"
                                    }`}
                                    style={{ height: `${heightPct}%` }}
                                  />
                                </div>
                                {/* Month label */}
                                <span className={`text-[11px] font-bold mt-2 ${m.isCurrent ? "text-moss-700 dark:text-[#E5C583]" : "text-slate-500 dark:text-cream-100/60"}`}>
                                  {m.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* ROW 2: MY PROPERTIES PORTFOLIO ROW */}
                    <div className="tour-property-list bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-base sm:text-lg text-[#1E293B] dark:text-cream-100 tracking-tight">
                          My Properties
                        </h3>
                        <button
                          onClick={() => setActiveTab(1)}
                          className="text-xs font-bold text-moss-700 dark:text-[#E5C583] hover:underline flex items-center gap-1 transition-all cursor-pointer"
                        >
                          View All <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {activeDashboardProperties.length === 0 ? (
                          <div className="col-span-full py-10 text-center text-slate-400 dark:text-cream-100/50 text-xs font-semibold">
                            {loadingData ? "Loading properties..." : "No active properties listed yet. Click Add New Property to create your first listing."}
                          </div>
                        ) : (
                          activeDashboardProperties.slice(0, 4).map((property) => {
                            const propStatus = getPropertyStatus(property, leases);
                            const badgeText = propStatus.label;
                            const badgeClass = propStatus.dashboardBadgeClass;

                            const propImage = property.cover_image || property.images?.[0] || "/src/assets/skyline_apartment.png";

                            return (
                              <div
                                key={property.id}
                                className="rounded-2xl border border-black/5 dark:border-[#2C4633] bg-slate-50/50 dark:bg-white/5 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group min-w-0"
                              >
                                <div className="min-w-0">
                                  {/* Photo with status badge */}
                                  <div className="relative h-32 w-full bg-slate-100 dark:bg-black/20 overflow-hidden shrink-0">
                                    <img
                                      src={propImage}
                                      alt={property.title || "Property"}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => {
                                        e.target.src = "/src/assets/skyline_apartment.png";
                                      }}
                                    />
                                    <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${badgeClass}`}>
                                      {badgeText}
                                    </span>
                                  </div>

                                  {/* Info */}
                                  <div className="p-3.5 space-y-1 min-w-0">
                                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-cream-100 truncate" title={property.title}>
                                      {property.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 dark:text-cream-100/60 truncate flex items-center gap-1 min-w-0" title={property.location}>
                                      <MapPin className="h-3 w-3 text-moss-700 dark:text-[#E5C583] shrink-0" />
                                      <span className="truncate min-w-0">{property.location}</span>
                                    </p>
                                    <div className="flex items-center gap-2 pt-1 text-[10.5px] font-semibold text-slate-400 dark:text-cream-100/50">
                                      <span>{property.bedrooms || 1} Beds</span>
                                      <span>•</span>
                                      <span>{property.bathrooms || 1} Baths</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Price and Action link */}
                                <div className="p-3.5 pt-2 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 min-w-0">
                                  <div className="min-w-0">
                                    <span className="font-extrabold text-xs text-slate-900 dark:text-white block truncate">
                                      {property.price || formatCurrency(property.rent_amount || 0, getRentPeriodSuffix(property.rent_period))}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => navigate(`/dashboard/landlord/properties/${property.id}`)}
                                    className="text-[11px] font-bold text-moss-700 dark:text-[#E5C583] hover:underline flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
                                  >
                                    View Details <ChevronRight className="h-3 w-3 shrink-0" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* ROW 3: TENANT REQUESTS BOX */}
                    <div className="tour-requests bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4.5 w-4.5 text-moss-700 dark:text-[#E5C583]" />
                            <h3 className="text-sm sm:text-base font-bold text-[#1E293B] dark:text-cream-100">
                              Tenant Requests
                            </h3>
                          </div>
                          <button
                            onClick={() => {
                              setActiveTab(6);
                              setActivePill("Maintenance");
                            }}
                            className="text-xs font-bold text-moss-700 dark:text-[#E5C583] hover:underline cursor-pointer"
                          >
                            View All →
                          </button>
                        </div>

                        {tenantRequests.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 dark:text-cream-100/50 space-y-1">
                            <Wrench className="h-8 w-8 mx-auto opacity-30" />
                            <p className="text-xs font-semibold">No maintenance requests recorded</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {displayRequests.map((req) => {
                              const st = (req.status || "Pending").toLowerCase();
                              const actualPropertyTitle = req.propertyTitle || "Leased Unit";
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
                                  className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-between gap-3 cursor-pointer group border border-transparent hover:border-slate-200/60 dark:hover:border-white/10"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-cream-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                      <Wrench className="h-4 w-4 text-slate-600 dark:text-cream-100" />
                                    </div>
                                    <div className="min-w-0">
                                      <h5 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-cream-100 group-hover:text-moss-700 dark:group-hover:text-[#E5C583] transition-colors truncate">
                                        {actualPropertyTitle}
                                      </h5>
                                      <p className="text-[11.5px] text-slate-500 dark:text-cream-100/70 truncate mt-0.5">
                                        {issueDescription}
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full shrink-0 ${statusBadge}`}>
                                    {statusLabel}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {tenantRequests.length > 2 && (
                        <button
                          onClick={() => setShowAllRequests(!showAllRequests)}
                          className="w-full py-2 text-xs font-bold text-moss-700 dark:text-[#E5C583] hover:underline text-center cursor-pointer pt-2 mt-2 border-t border-slate-100 dark:border-[#2C4633]"
                        >
                          {showAllRequests ? "Show Less" : `Show More Requests (${tenantRequests.length})`}
                        </button>
                      )}
                    </div>

                  </div>

                  {/* RIGHT COLUMN (4 cols): ADD PROPERTY, OCCUPANCY RATE, EXPECTED RENT, ACCOUNT RATING, SECURE TIP */}
                  <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-5">

                    {/* 1. ADD NEW PROPERTY CARD */}
                    <div
                      onClick={handleAddPropertyClick}
                      className="tour-add-property group p-5 rounded-3xl bg-[#1B4D35] hover:bg-[#143d2a] dark:bg-[#1E3A2B] dark:hover:bg-[#254735] text-white cursor-pointer transition-all duration-200 shadow-md flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-white/15 dark:bg-[#E5C583]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Plus className="h-6 w-6 text-white dark:text-[#E5C583]" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-base text-white tracking-tight leading-tight">
                            Add New Property
                          </h3>
                          <p className="text-xs text-[#C8E4D5] dark:text-cream-100/70 font-medium mt-0.5 truncate">
                            List a new property on LODALE
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>

                    {/* 1b. SUB-MENU ACTIONS (QUICK ACTIONS PANEL) */}
                    <div className="bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-3xl p-5 shadow-xs space-y-1">
                      <div
                        onClick={() => { setActiveTab(0); setActivePill("Applications"); }}
                        className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-cream-100 flex items-center justify-center shrink-0 group-hover:bg-moss-50 dark:group-hover:bg-[#E5C583]/10 transition-colors">
                            <ClipboardList className="h-4.5 w-4.5 text-moss-700 dark:text-[#E5C583]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              View Applications
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-cream-100/60 truncate">
                              Check and respond to tenant applications
                            </p>
                          </div>
                        </div>
                        {pendingAppsCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white shrink-0">
                            {pendingAppsCount}
                          </span>
                        )}
                      </div>

                      <div
                        onClick={() => { setActiveTab(0); setActivePill("Payments"); }}
                        className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-cream-100 flex items-center justify-center shrink-0 group-hover:bg-moss-50 dark:group-hover:bg-[#E5C583]/10 transition-colors">
                            <CreditCard className="h-4.5 w-4.5 text-moss-700 dark:text-[#E5C583]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              Send Invoice
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-cream-100/60 truncate">
                              Create and send a rent invoice
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => { setAutoOpenAddTenantModal(true); setActiveTab(2); }}
                        className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-cream-100 flex items-center justify-center shrink-0 group-hover:bg-moss-50 dark:group-hover:bg-[#E5C583]/10 transition-colors">
                            <Users className="h-4.5 w-4.5 text-moss-700 dark:text-[#E5C583]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              Manage Tenants
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-cream-100/60 truncate">
                              View and manage your tenants
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => setShowReportModal(true)}
                        className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-cream-100 flex items-center justify-center shrink-0 group-hover:bg-moss-50 dark:group-hover:bg-[#E5C583]/10 transition-colors">
                            <FileText className="h-4.5 w-4.5 text-moss-700 dark:text-[#E5C583]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              Report
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-cream-100/60 truncate">
                              View detailed portfolio reports
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. OCCUPANCY RATE CARD */}
                    <div className="tour-occupancy bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-3xl p-5 shadow-xs space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <Activity className="h-4 w-4 text-moss-700 dark:text-[#E5C583]" />
                          <span>Occupancy Rate</span>
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-moss-50 dark:bg-[#E5C583]/15 text-moss-700 dark:text-[#E5C583]">
                          {occupancyRate}%
                        </span>
                      </div>

                      <div className="space-y-2 pt-1">
                        <div className="flex items-baseline justify-between">
                          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {occupancyRate}%
                          </div>
                          <span className="text-xs font-semibold text-slate-500 dark:text-cream-100/60">
                            {occupiedPropsCount} out of {livePropsCount} {livePropsCount === 1 ? "property" : "properties"} occupied
                          </span>
                        </div>

                        {/* Horizontal Progress Bar */}
                        <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-moss-700 dark:bg-[#E5C583] h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-cream-100/50 pt-1">
                          <span>Occupied: <strong className="text-slate-700 dark:text-cream-100 font-bold">{occupiedPropsCount}</strong></span>
                          <span>Vacant: <strong className="text-slate-700 dark:text-cream-100 font-bold">{Math.max(0, livePropsCount - occupiedPropsCount)}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* 3. EXPECTED RENT CARD */}
                    <div className="bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-3xl p-5 shadow-xs space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-moss-700 dark:text-[#E5C583]" />
                          <span>Expected Rent</span>
                        </h4>
                        <button
                          onClick={() => { setActiveTab(0); setActivePill("Payments"); }}
                          className="text-[11px] font-bold text-moss-700 dark:text-[#E5C583] hover:underline cursor-pointer"
                        >
                          View Ledger →
                        </button>
                      </div>

                      <div className="space-y-3 pt-0.5">
                        {/* Rent Amount */}
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-cream-100/50 block">
                            Next Due Amount
                          </span>
                          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                            {upcomingPayment?.amount || "₦0"}
                          </div>
                        </div>

                        {/* Details grid: Tenant & Next Payment Date */}
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-cream-100/60 font-medium flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-moss-700 dark:text-[#E5C583]" />
                              Tenant
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                              {upcomingPayment?.tenantName || "No upcoming payments"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-white/5">
                            <span className="text-slate-500 dark:text-cream-100/60 font-medium flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-moss-700 dark:text-[#E5C583]" />
                              Payment Date
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {upcomingPayment?.dueDate || "No upcoming schedule"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4. ACCOUNT RATING COMPACT WIDGET (COMPACT h-auto, NO TALL HEIGHT) */}
                    <div className="tour-rating bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-3xl p-4 sm:p-5 shadow-xs space-y-2 h-auto">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span>Account Rating</span>
                        </h4>
                        <button
                          onClick={() => setShowRatingModal(true)}
                          className="text-[11px] font-bold text-moss-700 dark:text-[#E5C583] hover:underline cursor-pointer"
                        >
                          View Reviews →
                        </button>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                          {ratingData.hasReviews ? ratingData.rating : "New"}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-cream-100/60 leading-tight">
                          {ratingData.hasReviews
                            ? `Based on ${ratingData.count} verified tenant ${ratingData.count === 1 ? "review" : "reviews"}.`
                            : "Complete leases to build your platform reliability score."}
                        </p>
                      </div>
                    </div>

                    {/* 5. KEEP YOUR PROPERTIES SECURE TIP CARD */}
                    <div
                      onClick={() => setActiveTab(4)}
                      className="p-4 rounded-3xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500/40 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-xs text-slate-900 dark:text-emerald-100 truncate">
                            Keep your properties secure
                          </h5>
                          <p className="text-[11px] text-slate-600 dark:text-emerald-300/80 line-clamp-2 mt-0.5">
                            Complete verification for your listings to build trust and get better visibility.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-emerald-700 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>

                  </div>

                </div>

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
          <div className="bg-[#FFFFFF] dark:bg-[#192A1F] rounded-3xl border border-[#E4EAE1] dark:border-[#2C4633] max-w-sm w-full p-8 shadow-2xl relative text-center">
            <button
              className="absolute top-4 right-4 text-ink-400 dark:text-cream-100 hover:text-ink-900 dark:hover:text-white text-xl font-bold p-1 bg-[#FAF8F6] dark:bg-[#FFFFFF]/5 rounded-full h-8 w-8 flex items-center justify-center cursor-pointer transition-colors border-none outline-none"
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
              <div className="flex items-center justify-between p-4 rounded-2xl bg-ink-50 dark:bg-[#FFFFFF]/5 border border-ink-100 dark:border-[#2C4633]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                    <Eye className="h-5 w-5" />
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

              <div className="flex items-center justify-between p-4 rounded-2xl bg-ink-50 dark:bg-[#FFFFFF]/5 border border-ink-100 dark:border-[#2C4633]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                    <Bookmark className="h-5 w-5" />
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
          <div className="bg-[#FFFFFF] dark:bg-[#192A1F] rounded-3xl border border-[#E4EAE1] dark:border-[#2C4633] max-w-md w-full p-8 shadow-2xl relative text-center">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-ink-400 dark:text-cream-100 hover:text-ink-900 dark:hover:text-white text-xl font-bold p-1 bg-[#FAF8F6] dark:bg-[#FFFFFF]/5 rounded-full h-8 w-8 flex items-center justify-center cursor-pointer transition-colors border-none outline-none"
              onClick={() => setShowRatingModal(false)}
            >
              &times;
            </button>

            <div className="flex justify-center mb-3">
              <div className="bg-amber-100 dark:bg-amber-900/20 p-3.5 rounded-full text-amber-500">
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

            <div className="space-y-4 text-left max-h-[300px] overflow-y-auto pr-1 border-t border-[#E4EAE1] dark:border-[#2C4633] pt-4">
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
                      <span className="text-[13px] font-bold text-ink-900 dark:text-white">Verified Tenant</span>
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
          <div className="bg-[#FFFFFF] dark:bg-[#192A1F] rounded-3xl border border-[#E4EAE1] dark:border-[#2C4633] max-w-sm w-full p-8 shadow-2xl relative text-center">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-ink-400 dark:text-cream-100 hover:text-ink-900 dark:hover:text-white text-xl font-bold p-1 bg-[#FAF8F6] dark:bg-[#FFFFFF]/5 rounded-full h-8 w-8 flex items-center justify-center cursor-pointer transition-colors border-none outline-none"
              onClick={() => setShowLandlordProfileModal(false)}
            >
              &times;
            </button>

            {/* Profile Avatar */}
            <div className="relative mx-auto w-24 h-24 mb-4">
              <div className="w-full h-full flex items-center justify-center bg-moss-100 dark:bg-forest-900/60 rounded-full border-4 border-[#E4EAE1] dark:border-[#2C4633] text-moss-800 dark:text-[#E5C583] overflow-hidden">
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
            <div className="space-y-3.5 text-left border-t border-[#E4EAE1] dark:border-[#2C4633] pt-5">
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
                onClick={() => {
                  setShowTourAsk(false);
                  handleTourComplete(true);
                }}
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
                onClick={() => handleTourComplete(true)}
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
                      handleTourComplete(false);
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
          <div className="bg-[#FFFFFF] dark:bg-[#192A1F] border border-ink-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-ink-100 dark:border-[#2C4633]">
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
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-[#FFFFFF]/10 dark:hover:bg-[#FFFFFF]/20 rounded-xl cursor-pointer"
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
