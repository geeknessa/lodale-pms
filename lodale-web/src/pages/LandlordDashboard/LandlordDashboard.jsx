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
  ChevronDown,
  ChevronLeft,
  MapPin,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Activity,
  BarChart3,
  Receipt,
  FileCheck,
  Wallet,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw
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
import PropertyCarouselCard from "./components/PropertyCarouselCard";
import RentalIncomeChart from "./components/RentalIncomeChart";
import PerformanceOverview from "./components/PerformanceOverview";
import LandlordReceipts from "./components/LandlordReceipts";
import LandlordLeases from "./components/LandlordLeases";
import PerformanceOverviewPlaceholder from "./components/PerformanceOverviewPlaceholder";
import NotificationDropdown from "./components/NotificationDropdown";
import { profileService } from "../../services/profileService";
import { leaseService } from "../../services/leaseService";
import { rentService } from "../../services/rentService";
import { maintenanceService } from "../../services/maintenanceService";
import { reminderService } from "../../services/reminderService";
import AutomatedRemindersModal from "../../components/AutomatedRemindersModal";
import { interactionTracker } from "../../utils/interactionTracker";
import { onBroadcastAction } from "../../utils/actionBroadcaster";
import { formatCurrency, getRentPeriodSuffix, formatDateOnly, formatTimestamp, formatDisplayDate, getRentPeriodLabel, getNextRentDue } from "../../utils/formatters";
import { apiClient } from "../../lib/apiClient";
import { calculatePortfolioMetrics, getPropertyStatus, parsePaymentDateYearMonth, parseRentAmount } from "../../utils/landlordMetrics";
import "./LandlordDashboard.css";
import { safeSetItem, safeGetItem, safeSetJSON, cacheAvatarUrl } from "../../utils/safeStorage";
import { resolveAvatarUrl } from "../../utils/avatarUtils";

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

  const [landlordProfile, setLandlordProfile] = useState(() => {
    try {
      const raw = sessionStorage.getItem("currentUserProfile") || sessionStorage.getItem("landlordCurrentProfile") || localStorage.getItem("currentUserProfile");
      return raw ? JSON.parse(raw) : null;
    } catch {
      // Safe fallback: malformed cached profile in storage is safely ignored and falls back to null
      return null;
    }
  });

  const [leases, setLeases] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [displayProperties, setDisplayProperties] = useState([]);
  const displayPropertiesRef = useRef([]);
  const isFetchingPropertiesRef = useRef(false);
  const [loadingData, setLoadingData] = useState(true);
  const [dataErrors, setDataErrors] = useState({
    properties: null,
    leases: null,
    invoices: null,
    requests: null,
    applications: null,
    notifications: null,
  });
  const [errorBannerDismissed, setErrorBannerDismissed] = useState(false);
  const [isRetryingSources, setIsRetryingSources] = useState(false);
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
          rentAmount: parseRentAmount(l.rent_amount ?? l.rentAmount ?? l.rent),
          propertyTitle: l.property_title || l.propertyTitle || "Leased Unit",
          paymentStatus,
          startDate: l.start_date || l.startDate,
          endDate: l.end_date || l.endDate,
          rentPeriod: l.rent_period || l.rentPeriod || "annually"
        };
      });
  };

  const [ratingData, setRatingData] = useState({ hasReviews: false, rating: "New", count: 0, reviews: [] });

  const fetchLandlordRating = useCallback(async (explicitId = null) => {
    let currentUserId = explicitId || safeGetItem("session", "db_user_id") || safeGetItem("local", "db_user_id") || sessionStorage.getItem("db_user_id") || localStorage.getItem("db_user_id") || sessionStorage.getItem("userId") || localStorage.getItem("userId");

    if (!currentUserId || currentUserId === "me") {
      try {
        const uStr = safeGetItem("session", "lodale_user") || safeGetItem("local", "lodale_user") || sessionStorage.getItem("lodale_user") || localStorage.getItem("lodale_user");
        if (uStr) {
          const uObj = typeof uStr === "string" ? JSON.parse(uStr) : uStr;
          if (uObj?.id) currentUserId = uObj.id;
          else if (uObj?.email) currentUserId = uObj.email;
        }
      } catch {
        // Safe fallback: malformed user JSON in storage is safely ignored
      }
    }

    if (!currentUserId || currentUserId === "me") {
      try {
        const profStr = safeGetItem("session", "currentUserProfile") || safeGetItem("local", "currentUserProfile") || sessionStorage.getItem("currentUserProfile");
        if (profStr) {
          const profObj = typeof profStr === "string" ? JSON.parse(profStr) : profStr;
          if (profObj?.id) currentUserId = profObj.id;
          else if (profObj?.email) currentUserId = profObj.email;
        }
      } catch {
        // Safe fallback: malformed profile JSON in storage is safely ignored
      }
    }

    if (!currentUserId || currentUserId === "me") {
      const propLandlordId = displayPropertiesRef.current.find(p => p.landlord_id || p.landlord?.id)?.landlord_id || displayPropertiesRef.current.find(p => p.landlord_id || p.landlord?.id)?.landlord?.id;
      if (propLandlordId) currentUserId = propLandlordId;
    }

    if (!currentUserId || currentUserId === "me") {
      const email = safeGetItem("session", "lastLoggedInEmail") || safeGetItem("local", "lastLoggedInEmail") || sessionStorage.getItem("lastLoggedInEmail") || localStorage.getItem("lastLoggedInEmail");
      if (email && email !== "ada.k@lodale.com") currentUserId = email;
    }

    try {
      const res = await ratingService.getLandlordReviews(currentUserId || 'me', true);
      if (res) {
        setRatingData(res);
      }
    } catch (e) {
      console.error("Error fetching landlord rating reviews:", e);
    }
  }, []);

  useEffect(() => {
    fetchLandlordRating();
    const handleRefresh = () => fetchLandlordRating();
    window.addEventListener("landlordRatingUpdated", handleRefresh);
    window.addEventListener("ratingsUpdated", handleRefresh);
    return () => {
      window.removeEventListener("landlordRatingUpdated", handleRefresh);
      window.removeEventListener("ratingsUpdated", handleRefresh);
    };
  }, [fetchLandlordRating]);

  useEffect(() => {
    const propLandlord = displayProperties.find(p => p.landlord_id || p.landlord?.id);
    const propLandlordId = propLandlord?.landlord_id || propLandlord?.landlord?.id;
    if (propLandlordId) {
      const curDbId = safeGetItem("session", "db_user_id");
      if (curDbId !== propLandlordId) {
        safeSetItem("session", "db_user_id", propLandlordId);
        safeSetItem("local", "db_user_id", propLandlordId);
        fetchLandlordRating(propLandlordId);
      }
    }
    if (propLandlord?.landlord?.score && Number(propLandlord.landlord.score) > 0) {
      setRatingData(prev => prev.hasReviews ? prev : {
        hasReviews: true,
        rating: String(propLandlord.landlord.score),
        averageScore: Number(propLandlord.landlord.score),
        count: Number(propLandlord.landlord.reviews) || 1,
        reviews: prev.reviews || []
      });
    }
  }, [displayProperties, fetchLandlordRating]);

  // Re-fetch fresh profile from backend on reload instead of trusting stale sessionStorage
  useEffect(() => {
    let isMounted = true;
    const syncFreshLandlordProfile = async () => {
      try {
        const [profile, roleProfile] = await Promise.all([
          userService.getProfile().catch(err => {
            console.error("Error fetching user profile:", err);
            return null;
          }),
          profileService.getMyProfile().catch(err => {
            console.error("Error fetching landlord role profile:", err);
            return null;
          })
        ]);
        if (isMounted && profile) {
          if (profile.id) {
            safeSetItem("session", "db_user_id", profile.id);
            safeSetItem("local", "db_user_id", profile.id);
          }
          const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
          if (fullName) {
            setUsername(fullName);
            safeSetItem("session", "username", fullName);
          }
          if (profile.avatar_url) {
            // Full value (even base64) lives in React state; only file URLs are cached.
            setLandlordAvatar(profile.avatar_url);
            cacheAvatarUrl("session", "landlordAvatarUrl", profile.avatar_url);
          }
          const merged = { ...profile, ...(roleProfile || {}), role: "landlord", primary_role: "landlord" };
          setLandlordProfile(merged);
          safeSetJSON("session", "currentUserProfile", merged);
          safeSetJSON("session", "landlordCurrentProfile", merged);

          // Proactively load fresh ratings with the confirmed profile ID
          if (profile.id) {
            try {
              const res = await ratingService.getLandlordReviews(profile.id, true);
              if (isMounted && res) setRatingData(res);
            } catch (rErr) {
              console.error("Error fetching ratings for landlord profile:", rErr);
            }
          }
        }
      } catch (err) {
        console.error("Error syncing fresh landlord profile:", err);
      }
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
    } catch {
      // Safe fallback: malformed cached profile avatar is safely ignored and defaults to empty string
    }
    return "";
  });

  useEffect(() => {
    const handleAvatarUpdate = (e) => {
      if (e?.detail?.avatar) {
        setLandlordAvatar(e.detail.avatar);
        return;
      }
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
        } catch {
          // Safe fallback: malformed cached profile avatar update is safely ignored
        }
      }
      if (updated && !updated.includes("unsplash.com")) {
        setLandlordAvatar(updated);
      }
    };
    handleAvatarUpdate();
    window.addEventListener("storage", handleAvatarUpdate);
    window.addEventListener("landlordProfileUpdated", handleAvatarUpdate);
    return () => {
      window.removeEventListener("storage", handleAvatarUpdate);
      window.removeEventListener("landlordProfileUpdated", handleAvatarUpdate);
    };
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

  const [isScheduleOpen, setIsScheduleOpen] = useState(() => {
    return activeTab === 5 || activeTab === "performance_overview" || activeTab === "receipts" || activeTab === "leases";
  });

  useEffect(() => {
    if (activeTab === 5 || activeTab === "performance_overview" || activeTab === "receipts" || activeTab === "leases") {
      setIsScheduleOpen(true);
    }
  }, [activeTab]);

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
      console.warn("Failed to mark all notifications as read on backend:", e);
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
    } catch {
      // Safe fallback: malformed cached profile safely defaults userProf to null
    }

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
  const updateTourPosition = useCallback(() => {
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
  }, [runTour, tourStep]);

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
  }, [runTour, tourStep, recalcTrigger, activeTab, updateTourPosition]);

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
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard Home", tabIndex: 0, tourClass: "tour-nav-0", action: () => { setActiveTab(0); setActivePill("Overview"); } },
    { id: "properties", icon: Building2, label: "Properties", tabIndex: 1, tourClass: "tour-nav-1", action: () => setActiveTab(1) },
    { id: "tenants", icon: Users, label: "Tenants", tabIndex: 2, tourClass: "tour-nav-2", action: () => setActiveTab(2) },
    { id: "applications", icon: ClipboardList, label: "Applications", tabIndex: 0, tourClass: "tour-nav-7", action: () => { setActiveTab(0); setActivePill("Applications"); } },
    { id: "maintenance", icon: Wrench, label: "Maintenance", tabIndex: 6, tourClass: "tour-nav-6", action: () => setActiveTab(6) },
    {
      id: "schedule_menu",
      icon: CalendarDays,
      label: "Schedule",
      isSubmenu: true,
      tourClass: "tour-nav-5",
      children: [
        { id: "schedule", icon: CalendarDays, label: "Schedule", tabIndex: 5, action: () => setActiveTab(5) },
        { id: "performance_overview", icon: BarChart3, label: "Performance Overview", tabIndex: "performance_overview", action: () => setActiveTab("performance_overview") },
        { id: "receipts", icon: Receipt, label: "Receipts", tabIndex: "receipts", action: () => setActiveTab("receipts") },
        { id: "leases", icon: FileCheck, label: "Leases", tabIndex: "leases", action: () => setActiveTab("leases") },
      ]
    },
    { id: "chat", icon: MessageSquare, label: "Chat", tabIndex: 3, tourClass: "tour-nav-3", action: () => setActiveTab(3) },
    { id: "settings", icon: Settings, label: "Settings", tabIndex: 4, tourClass: "tour-nav-4", action: () => setActiveTab(4) },
  ];

  // Filter listings where landlord name matches the username, or fallback to general listings list
  const [selectedFeedbackProperty, setSelectedFeedbackProperty] = useState(null);
  const [selectedProofProperty, setSelectedProofProperty] = useState(null);

  const loadProperties = useCallback(async () => {
    if (isFetchingPropertiesRef.current) return displayPropertiesRef.current;
    isFetchingPropertiesRef.current = true;
    try {
      let currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId") || "";
      try {
        const uStr = sessionStorage.getItem("lodale_user") || localStorage.getItem("lodale_user");
        if (uStr) {
          const uObj = JSON.parse(uStr);
          if (uObj.id && !currentUserId) currentUserId = uObj.id;
        }
      } catch {
        // Safe fallback: malformed user JSON in storage is safely ignored
      }

      let apiProps = [];
      if (currentUserId) {
        try {
          apiProps = await propertyService.getLandlordProperties(currentUserId);
        } catch (err) {
          console.error("Error fetching landlord properties from API:", err);
          throw err;
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

        const parsedRent = parseRentAmount(p.rent_amount ?? p.rent);
        const formattedPrice = parsedRent !== null
          ? formatCurrency(parsedRent, getRentPeriodSuffix(p.rent_period))
          : "—";

        propMap.set(p.id, {
          ...p,
          price: p.price || formattedPrice,
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
      displayPropertiesRef.current = finalProperties;
      setDisplayProperties(prev => {
        if (prev.length === finalProperties.length && prev.every((p, idx) => p.id === finalProperties[idx].id && p.status === finalProperties[idx].status)) {
          return prev;
        }
        return finalProperties;
      });

      const resolvedLandlordId = finalProperties.find(p => p.landlord_id || p.landlord?.id)?.landlord_id || finalProperties.find(p => p.landlord_id || p.landlord?.id)?.landlord?.id;
      if (resolvedLandlordId) {
        const curDbId = safeGetItem("session", "db_user_id");
        if (curDbId !== resolvedLandlordId) {
          safeSetItem("session", "db_user_id", resolvedLandlordId);
          safeSetItem("local", "db_user_id", resolvedLandlordId);
          fetchLandlordRating(resolvedLandlordId);
        }
      }
      return finalProperties;
    } finally {
      isFetchingPropertiesRef.current = false;
    }
  }, [fetchLandlordRating]);

  useEffect(() => {
    loadProperties().catch(err => {
      console.error("Initial loadProperties error:", err);
    });

    const handlePropertyUpdated = () => {
      loadProperties().catch(err => {
        console.error("Error reloading properties on update:", err);
      });
    };
    window.addEventListener("propertyUpdated", handlePropertyUpdated);
    return () => {
      window.removeEventListener("propertyUpdated", handlePropertyUpdated);
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
    if (!t) return null;
    const directRent = parseRentAmount(t.rentAmount ?? t.rent_amount ?? t.rent);
    if (directRent !== null) return directRent;
    if (t.income) {
      const parsedIncome = parseRentAmount(t.income);
      if (parsedIncome !== null) return parsedIncome;
    }
    return null;
  };

  const paidTenants = activeTenantsList.filter(t => {
    const st = (t.paymentStatus || "").toLowerCase().trim();
    return st === "paid";
  });
  const overdueTenants = activeTenantsList.filter(t => {
    const st = (t.paymentStatus || "").toLowerCase().trim();
    return st === "overdue" || st === "outstanding" || st === "unpaid";
  });
  const unknownTenants = activeTenantsList.filter(t => {
    const st = (t.paymentStatus || "").toLowerCase().trim();
    return !st || (st !== "paid" && st !== "overdue" && st !== "outstanding" && st !== "unpaid");
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
  const landlordFirstName = useMemo(() => {
    if (!username) return "Landlord";
    return username.trim().split(" ")[0];
  }, [username]);

  const portfolioSummaryLine = useMemo(() => {
    if (loadingData) return "Loading portfolio overview...";
    const propCount = portfolioMetrics.totalProperties;
    const tenantCount = activeTenantsCount;
    const occRate = portfolioMetrics.occupancyRate;
    return `Portfolio Overview · ${propCount} ${propCount === 1 ? 'Property' : 'Properties'} · ${tenantCount} active ${tenantCount === 1 ? 'tenant' : 'tenants'} · ${occRate}% Occupied`;
  }, [loadingData, portfolioMetrics.totalProperties, portfolioMetrics.occupancyRate, activeTenantsCount]);

  // Month-over-month calculation for This Month's Rent Received (BUG 4)
  const thisMonthMoM = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const prevMonthDate = new Date(curYear, curMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();

    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    const paid = safeInvoices.filter(i => {
      const st = (i.status || '').toLowerCase().trim();
      return st === 'paid' || st === 'completed';
    });

    const curAmount = paid.filter(i => {
      const raw = i.paid_at || i.paidAt || i.payment_date || i.paymentDate;
      if (!raw) return false;
      const ym = parsePaymentDateYearMonth(raw);
      return ym && ym.year === curYear && ym.month === curMonth;
    }).reduce((sum, i) => {
      const amt = parseRentAmount(i.grandTotal ?? i.grand_total ?? i.amount);
      return sum + (amt !== null ? amt : 0);
    }, 0);

    const prevAmount = paid.filter(i => {
      const raw = i.paid_at || i.paidAt || i.payment_date || i.paymentDate;
      if (!raw) return false;
      const ym = parsePaymentDateYearMonth(raw);
      return ym && ym.year === prevYear && ym.month === prevMonth;
    }).reduce((sum, i) => {
      const amt = parseRentAmount(i.grandTotal ?? i.grand_total ?? i.amount);
      return sum + (amt !== null ? amt : 0);
    }, 0);

    if (prevAmount > 0) {
      const pct = Math.round(((curAmount - prevAmount) / prevAmount) * 100);
      const isZero = pct === 0;
      const isPositive = pct > 0;
      return {
        hasPrevious: true,
        pct,
        isPositive,
        isZero,
        direction: isZero ? 'neutral' : (isPositive ? 'up' : 'down'),
        label: `${Math.abs(pct)}% from last month`
      };
    }

    return {
      hasPrevious: false,
      direction: 'neutral',
      label: "No previous data"
    };
  }, [invoices]);

  // Month-over-month calculation for Total Revenue (BUG 4)
  const totalRevMoM = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const prevMonthDate = new Date(curYear, curMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();

    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    const paid = safeInvoices.filter(i => {
      const st = (i.status || '').toLowerCase().trim();
      return st === 'paid' || st === 'completed';
    });

    const prevMonthPayments = paid.filter(i => {
      const raw = i.paid_at || i.paidAt || i.payment_date || i.paymentDate;
      if (!raw) return false;
      const ym = parsePaymentDateYearMonth(raw);
      return ym && ym.year === prevYear && ym.month === prevMonth;
    }).reduce((sum, i) => {
      const amt = parseRentAmount(i.grandTotal ?? i.grand_total ?? i.amount);
      return sum + (amt !== null ? amt : 0);
    }, 0);

    if (prevMonthPayments > 0) {
      const curMonthPayments = paid.filter(i => {
        const raw = i.paid_at || i.paidAt || i.payment_date || i.paymentDate;
        if (!raw) return false;
        const ym = parsePaymentDateYearMonth(raw);
        return ym && ym.year === curYear && ym.month === curMonth;
      }).reduce((sum, i) => {
        const amt = parseRentAmount(i.grandTotal ?? i.grand_total ?? i.amount);
        return sum + (amt !== null ? amt : 0);
      }, 0);

      const pct = Math.round(((curMonthPayments - prevMonthPayments) / prevMonthPayments) * 100);
      const isZero = pct === 0;
      const isPositive = pct > 0;
      return {
        hasPrevious: true,
        pct,
        isPositive,
        isZero,
        direction: isZero ? 'neutral' : (isPositive ? 'up' : 'down'),
        label: `${Math.abs(pct)}% from last month`
      };
    }

    return {
      hasPrevious: false,
      direction: 'neutral',
      label: "No previous data"
    };
  }, [invoices]);

  // Month-over-month calculation for Properties (BUG 5)
  const propMoM = useMemo(() => {
    if (!validProperties || validProperties.length === 0) {
      return { hasPrevious: false, direction: 'neutral', label: "No previous data" };
    }

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const startOfCurMonth = new Date(curYear, curMonth, 1);

    const propertiesWithDates = validProperties.filter(p => p.created_at || p.createdAt);
    if (propertiesWithDates.length === 0) {
      return { hasPrevious: false, direction: 'neutral', label: "No previous data" };
    }

    const prevProperties = propertiesWithDates.filter(p => {
      const d = new Date(p.created_at || p.createdAt);
      return !isNaN(d.getTime()) && d < startOfCurMonth;
    });

    if (prevProperties.length === 0) {
      return { hasPrevious: false, direction: 'neutral', label: "No previous data" };
    }

    const prevCount = prevProperties.length;
    const curCount = propertiesWithDates.length;
    const delta = curCount - prevCount;

    if (delta > 0) {
      return {
        hasPrevious: true,
        delta,
        direction: 'up',
        label: `+${delta} from last month`
      };
    } else if (delta < 0) {
      return {
        hasPrevious: true,
        delta,
        direction: 'down',
        label: `${delta} from last month`
      };
    } else {
      return {
        hasPrevious: true,
        delta: 0,
        direction: 'neutral',
        label: `0 from last month`
      };
    }
  }, [validProperties]);

  // Month-over-month calculation for Tenants (BUG 5)
  const tenantMoM = useMemo(() => {
    if (!leases || leases.length === 0) {
      return { hasPrevious: false, direction: 'neutral', label: "No previous data" };
    }

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const startOfCurMonth = new Date(curYear, curMonth, 1);

    const leasesWithDates = leases.filter(l => l.start_date || l.startDate || l.created_at || l.createdAt);
    if (leasesWithDates.length === 0) {
      return { hasPrevious: false, direction: 'neutral', label: "No previous data" };
    }

    const curActiveLeases = leases.filter(l => {
      const s = (l.status || '').toLowerCase().trim();
      return s === 'active' || s === 'leased';
    });

    const prevActiveLeases = leases.filter(l => {
      const rawStart = l.start_date || l.startDate || l.created_at || l.createdAt;
      if (!rawStart) return false;
      const startDate = new Date(rawStart);
      if (isNaN(startDate.getTime()) || startDate >= startOfCurMonth) return false;

      const rawEnd = l.end_date || l.endDate;
      if (rawEnd) {
        const endDate = new Date(rawEnd);
        if (!isNaN(endDate.getTime()) && endDate < startOfCurMonth) {
          return false;
        }
      }
      const s = (l.status || '').toLowerCase().trim();
      return s === 'active' || s === 'leased' || s === 'expired' || s === 'completed';
    });

    if (prevActiveLeases.length === 0) {
      return { hasPrevious: false, direction: 'neutral', label: "No previous data" };
    }

    const curCount = curActiveLeases.length;
    const prevCount = prevActiveLeases.length;
    const delta = curCount - prevCount;

    if (delta > 0) {
      return {
        hasPrevious: true,
        delta,
        direction: 'up',
        label: `+${delta} from last month`
      };
    } else if (delta < 0) {
      return {
        hasPrevious: true,
        delta,
        direction: 'down',
        label: `${delta} from last month`
      };
    } else {
      return {
        hasPrevious: true,
        delta: 0,
        direction: 'neutral',
        label: `0 from last month`
      };
    }
  }, [leases]);

  const renderTrendBadge = (trend) => {
    if (!trend || !trend.hasPrevious) {
      return (
        <div className="text-xs font-semibold text-slate-500 dark:text-cream-100/60 flex items-center gap-1">
          <span>{trend?.label || "No previous data"}</span>
        </div>
      );
    }

    if (trend.direction === 'up') {
      return (
        <div className="text-xs font-semibold text-[#00875A] dark:text-[#E5C583] flex items-center gap-1">
          <ArrowUp className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>{trend.label}</span>
        </div>
      );
    }

    if (trend.direction === 'down') {
      return (
        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <ArrowDown className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>{trend.label}</span>
        </div>
      );
    }

    return (
      <div className="text-xs font-semibold text-slate-500 dark:text-cream-100/60 flex items-center gap-1">
        <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
        <span>{trend.label}</span>
      </div>
    );
  };

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
      const amt = parseRentAmount(pendingInv.grand_total ?? pendingInv.grandTotal ?? pendingInv.amount ?? pendingInv.subtotal);
      return {
        tenantName: pendingInv.tenant_name || pendingInv.tenantName || "Active Tenant",
        propertyTitle: pendingInv.property_title || pendingInv.propertyTitle || "Leased Property",
        amount: amt !== null ? `₦${amt.toLocaleString()}` : "—",
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
      const nextRentInfo = getNextRentDue(activeLease, null, invoices);
      const amt = parseRentAmount(activeLease.rent_amount ?? activeLease.rentAmount ?? activeLease.rent);
      const formattedDate = nextRentInfo.formattedDate || "—";
      const tName = activeLease.tenant_name || activeLease.tenantName || (activeLease.tenant ? `${activeLease.tenant.first_name || ''} ${activeLease.tenant.last_name || ''}`.trim() : null) || (activeTenantsList[0]?.name) || "Active Tenant";
      return {
        tenantName: tName,
        propertyTitle: activeLease.property_title || activeLease.propertyTitle || (activeLease.property?.title) || "Leased Unit",
        amount: amt !== null ? `₦${amt.toLocaleString()}` : "—",
        dueDate: formattedDate,
        status: nextRentInfo.isOverdue ? "Overdue" : "Upcoming",
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
        amount: rentAmt !== null ? `₦${rentAmt.toLocaleString()}` : "—",
        dueDate: t.dueDate || "Next billing cycle",
        status: "Upcoming",
        hasPayment: true
      };
    }

    // Safe empty fallback
    return {
      tenantName: null,
      propertyTitle: null,
      amount: "—",
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
    } catch {
      // Safe fallback: malformed cached profile safely defaults userProf to null
    }

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

  const isFetchingDataRef = useRef(false);
  const fetchAllData = useCallback(async (sourcesToFetch = null) => {
    if (isFetchingDataRef.current) return;
    isFetchingDataRef.current = true;
    try {
      setLoadingData(true);

      const shouldFetch = (sourceKey) => !sourcesToFetch || sourcesToFetch.includes(sourceKey);

      const tasks = [];

      if (shouldFetch('leases')) {
        tasks.push(
          leaseService.getMyLeases()
            .then(data => ({ source: 'leases', ok: true, data: Array.isArray(data) ? data : [] }))
            .catch(err => {
              console.error("Error loading leases/tenants:", err);
              return { source: 'leases', ok: false, error: err };
            })
        );
      }

      if (shouldFetch('invoices')) {
        tasks.push(
          rentService.getMyInvoices()
            .then(data => ({ source: 'invoices', ok: true, data: Array.isArray(data) ? data : [] }))
            .catch(err => {
              console.error("Error loading invoices:", err);
              return { source: 'invoices', ok: false, error: err };
            })
        );
      }

      if (shouldFetch('requests')) {
        tasks.push(
          maintenanceService.getMyRequests()
            .then(data => ({ source: 'requests', ok: true, data: Array.isArray(data) ? data : [] }))
            .catch(err => {
              console.error("Error loading maintenance requests:", err);
              return { source: 'requests', ok: false, error: err };
            })
        );
      }

      if (shouldFetch('applications')) {
        tasks.push(
          applicationService.getLandlordApplications()
            .then(data => ({ source: 'applications', ok: true, data: Array.isArray(data) ? data : [] }))
            .catch(err => {
              console.error("Error loading landlord applications:", err);
              return { source: 'applications', ok: false, error: err };
            })
        );
      }

      if (shouldFetch('notifications')) {
        tasks.push(
          notificationService.getMyNotifications()
            .then(data => ({ source: 'notifications', ok: true, data: Array.isArray(data) ? data : (data?.notifications || []) }))
            .catch(err => {
              console.error("Error loading notifications:", err);
              return { source: 'notifications', ok: false, error: err };
            })
        );
      }

      if (shouldFetch('properties')) {
        tasks.push(
          loadProperties()
            .then(data => ({ source: 'properties', ok: true, data }))
            .catch(err => {
              console.error("Error loading properties:", err);
              return { source: 'properties', ok: false, error: err };
            })
        );
      }

      const results = await Promise.allSettled(tasks);

      const statusMap = {
        open: 'Pending',
        pending: 'Pending',
        acknowledged: 'In Progress',
        in_progress: 'In Progress',
        pending_inspection: 'In Progress',
        resolved: 'Completed',
        closed: 'Completed'
      };

      setDataErrors(prev => {
        const next = { ...prev };
        results.forEach(res => {
          if (res.status === 'fulfilled') {
            const item = res.value;
            if (item.ok) {
              next[item.source] = null;
              if (item.source === 'leases') setLeases(item.data);
              else if (item.source === 'invoices') setInvoices(item.data);
              else if (item.source === 'applications') setApplications(item.data);
              else if (item.source === 'notifications') setNotifications(item.data);
              else if (item.source === 'requests') {
                setTenantRequests(item.data.map(r => ({
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
              }
            } else {
              next[item.source] = item.error?.message || `Failed to load ${item.source}`;
            }
          }
        });
        return next;
      });

      setErrorBannerDismissed(false);
    } catch (e) {
      console.error("Unexpected error in fetchAllData:", e);
    } finally {
      setLoadingData(false);
      isFetchingDataRef.current = false;
    }
  }, [loadProperties]);

  useEffect(() => {
    fetchAllData();

    // Background polling for real-time notification updates (every 30 seconds when tab is active)
    const interval = setInterval(async () => {
      if (document.hidden) return;
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
        // Safe fallback: background poll failure will retry next interval
        console.warn("Background notification poll failed:", e?.message || e);
      }
    }, 30000);

    let lastFocusFetch = 0;
    const handleFocus = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastFocusFetch < 15000) return; // Limit to once every 15s
      lastFocusFetch = now;
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
  }, [fetchAllData]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAF8] dark:bg-[#0B150F] text-slate-800 dark:text-slate-100 font-sans">

      {/* Mobile Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 1. LEFT SIDEBAR (DARK GREEN #13231B) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#13231B] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          } shrink-0 border-r border-[#1D3427] select-none`}
      >
        {/* Logo Lodale */}
        {/* Logo Lodale */}
        <div className="p-5 pb-4 flex items-center justify-between border-b border-[#1D3427]/80 shrink-0">
          <div
            className="cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2.5"
            onClick={() => navigate("/explore")}
            title="Go to Public Explore"
          >
            <Logo variant="white" />
          </div>
          <button
            type="button"
            className="md:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav: Dashboard Home (active), Properties, Tenants, Applications, Maintenance, Schedule (submenu), Chat, Settings */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 pb-8 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
          {sidebarItems.map((item) => {
            if (item.isSubmenu) {
              const isAnyChildActive = item.children.some(c => activeTab === c.tabIndex);
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsScheduleOpen(prev => !prev)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isAnyChildActive
                        ? "bg-white/10 text-white shadow-2xs"
                        : "text-white/80 hover:text-white hover:bg-white/5"
                      } ${item.tourClass || ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isScheduleOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isScheduleOpen && (
                    <div className="pl-3 pr-1 py-1 space-y-1 border-l-2 border-[#244533] ml-4 my-1">
                      {item.children.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeTab === sub.tabIndex;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              sub.action();
                              setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${isSubActive
                                ? "bg-[#00875A] text-white font-bold shadow-xs"
                                : "text-white/75 hover:text-white hover:bg-white/5 font-medium"
                              }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSubActive ? 'bg-white' : 'bg-[#00875A]'}`} />
                            <SubIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = item.id === "dashboard"
              ? activeTab === 0 && activePill !== "Applications"
              : item.id === "applications"
                ? activeTab === 0 && activePill === "Applications"
                : activeTab === item.tabIndex;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.action();
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                    ? "bg-[#00875A] text-white font-bold shadow-xs"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                  } ${item.tourClass || ""}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.id === "applications" && pendingAppsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white animate-pulse">
                    {pendingAppsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: Profile row (avatar, name) — click opens Profile, Logout */}
        <div className="p-3.5 space-y-2.5 border-t border-[#1D3427] bg-[#0E1A14]/90 shrink-0">
          {/* Profile row: avatar, name, rating badge — click opens Profile (profile + rating) */}
          <div
            onClick={() => {
              fetchLandlordRating();
              setShowLandlordProfileModal(true);
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group border border-white/5"
            title="Open Profile & Ratings"
          >
            <div className="h-9 w-9 rounded-full overflow-hidden bg-[#244533] border border-white/20 flex items-center justify-center shrink-0">
              {landlordAvatar ? (
                <img
                  src={resolveAvatarUrl(landlordAvatar)}
                  alt="Landlord"
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <User className="h-4.5 w-4.5 text-[#E5C583]" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold text-white truncate group-hover:text-[#E5C583] transition-colors">
                {username || "Landlord"}
              </p>
              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-white/60">
                <Star className="h-3 w-3 text-[#E5C583] fill-[#E5C583] shrink-0" />
                <span>{ratingData.hasReviews ? `${ratingData.rating} Rating` : "Verified Landlord"}</span>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              handleSignOut();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-950/40 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#F8FAF8] dark:bg-[#0B150F]">

        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#13231B] text-white border-b border-[#1D3427] shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-white hover:bg-white/10 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div onClick={() => navigate("/explore")} className="cursor-pointer">
              <LogoMark size={28} variant="light" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab(3)}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              title="Messages"
            >
              <MessageSquare className="h-4.5 w-4.5" />
            </button>
            <div
              onClick={() => {
                fetchLandlordRating();
                setShowLandlordProfileModal(true);
              }}
              className="h-8 w-8 rounded-full overflow-hidden bg-[#244533] border border-white/20 flex items-center justify-center cursor-pointer"
            >
              {landlordAvatar ? (
                <img src={resolveAvatarUrl(landlordAvatar)} alt="Landlord" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-[#E5C583]" />
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Main Area */}
        <main className={`db-main-content flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 ${activeTab === 3 ? "chat-tab-active" : ""}`}>

          {/* TOP CONTENT HEADER (On Overview tab, matching mock visual structure) */}
          {activeTab === 0 && activePill === "Overview" && (
            <div className="tour-welcome flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-[#2C4633]">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                  <span>{getTimeOfDayGreeting()}, {landlordFirstName}</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-cream-100/70 mt-1 font-medium">
                  {portfolioSummaryLine}
                </p>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                {/* Take a Tour */}
                <button
                  type="button"
                  onClick={() => {
                    setTourStep(0);
                    setRunTour(true);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-cream-100 bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer shadow-xs"
                  title="Take an interactive tour of your dashboard"
                >
                  <HelpCircle className="h-4 w-4 text-moss-700 dark:text-[#E5C583]" />
                  <span>Take a Tour</span>
                </button>

                {/* Notification Bell */}
                <div className="relative" ref={notifDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowNotifDropdown(prev => !prev)}
                    className="relative p-2.5 rounded-xl text-slate-700 dark:text-cream-100 bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer shadow-xs flex items-center justify-center"
                    aria-label="Notifications"
                    title="View notifications"
                  >
                    <Bell className="h-4.5 w-4.5" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#00875A] text-white text-[9.5px] font-black flex items-center justify-center shadow-xs">
                        {unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {showNotifDropdown && (
                    <NotificationDropdown
                      isOpen={showNotifDropdown}
                      onClose={() => setShowNotifDropdown(false)}
                      notifications={notifications}
                      unreadCount={unreadNotifCount}
                      onMarkAllRead={markAllNotifsRead}
                      onOpenReceipt={(refId) => {
                        setShowNotifDropdown(false);
                        if (refId) sessionStorage.setItem('highlight_receipt_id', refId);
                        setActiveTab("receipts");
                      }}
                      onClearAll={async () => {
                        try {
                          await notificationService.deleteNotification('all');
                        } catch (err) {
                          console.error("Failed to delete all notifications:", err);
                        }
                        setNotifications([]);
                      }}
                      onNotificationClick={async (notif) => {
                        if (notif.id) {
                          try { await notificationService.markAsRead(notif.id); } catch (err) { console.error("Failed to mark notification as read:", err); }
                        }
                        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true, read: true } : n));
                        setShowNotifDropdown(false);
                        const refType = (notif.reference_type || notif.type || '').toLowerCase();
                        const title = (notif.title || '').toLowerCase();
                        if (refType === 'receipt' || refType === 'payment' || refType === 'rent_payment' || title.includes('receipt') || title.includes('payment')) {
                          if (notif.reference_id) sessionStorage.setItem('highlight_receipt_id', notif.reference_id);
                          setActiveTab("receipts");
                        } else if (refType === 'chat' || title.includes('message')) {
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
                        } else if (refType === 'application' || title.includes('application')) {
                          setActiveTab(0);
                          setActivePill("Applications");
                        } else if (refType === 'lease' || title.includes('lease')) {
                          setActiveTab(2);
                        } else if (title.includes("proof") || notif.message?.toLowerCase().includes("proof")) {
                          const target = displayProperties.find(p => notif.message?.includes(p.title) || notif.title?.includes(p.title)) || displayProperties[0];
                          if (target) setSelectedProofProperty(target);
                        }
                      }}
                      onDeleteNotification={async (notifId) => {
                        try {
                          if (notifId) await notificationService.markAsRead(notifId);
                        } catch (err) {
                          console.error("Failed to delete notification:", err);
                        }
                        setNotifications(prev => prev.filter(n => n.id !== notifId));
                      }}
                    />
                  )}
                </div>

                {/* Chat Icon Button */}
                <button
                  type="button"
                  onClick={() => setActiveTab(3)}
                  className="p-2.5 rounded-xl text-slate-700 dark:text-cream-100 bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer shadow-xs flex items-center justify-center"
                  aria-label="Messages"
                  title="Open Messages & Chat"
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                </button>

                {/* Primary Button: + Add New Property */}
                <button
                  type="button"
                  onClick={handleAddPropertyClick}
                  className="tour-add-property inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#00875A] hover:bg-[#007048] shadow-sm hover:shadow transition-all duration-150 cursor-pointer active:scale-98"
                  title="Add a new property listing"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add New Property</span>
                </button>
              </div>
            </div>
          )}

          {/* DATA SOURCE ERROR BANNER */}
          {(() => {
            const sourceLabels = {
              properties: "properties",
              leases: "tenants & leases",
              invoices: "invoices & revenue",
              requests: "maintenance requests",
              applications: "applications",
              notifications: "notifications"
            };
            const failedKeys = Object.keys(dataErrors).filter(k => Boolean(dataErrors[k]));
            if (failedKeys.length === 0 || errorBannerDismissed) return null;

            const failedNames = failedKeys.map(k => sourceLabels[k] || k).join(", ");

            return (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                      Unable to load {failedNames}
                    </p>
                    <p className="text-rose-700 dark:text-rose-300/80 mt-0.5">
                      Some dashboard metrics may be incomplete. Click retry to reload the failed data.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsRetryingSources(true);
                      try {
                        await fetchAllData(failedKeys);
                      } finally {
                        setIsRetryingSources(false);
                      }
                    }}
                    disabled={isRetryingSources || loadingData}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRetryingSources ? 'animate-spin' : ''}`} />
                    <span>Retry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setErrorBannerDismissed(true)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                    aria-label="Dismiss error banner"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })()}

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
                          <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
                            {dataErrors.invoices ? "—" : `₦${portfolioMetrics.thisMonthRentCollected.toLocaleString()}`}
                          </span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block mt-1">From active tenant payments for the current month</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40">
                          <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 block mb-1">Outstanding Balance</span>
                          <span className="text-2xl font-black text-rose-900 dark:text-rose-200">
                            {dataErrors.invoices ? "—" : `₦${portfolioMetrics.outstandingBalance.toLocaleString()}`}
                          </span>
                          <span className="text-[11px] text-rose-700 dark:text-rose-400 block mt-1">{portfolioMetrics.unpaidInvoicesCount} invoice{portfolioMetrics.unpaidInvoicesCount === 1 ? '' : 's'} currently pending payment</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40">
                          <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 block mb-1">Total Collected Revenue</span>
                          <span className="text-2xl font-black text-indigo-900 dark:text-indigo-200">
                            {dataErrors.invoices ? "—" : `₦${portfolioMetrics.totalCollectedRevenue.toLocaleString()}`}
                          </span>
                          <span className="text-[11px] text-indigo-700 dark:text-indigo-400 block mt-1">
                            {dataErrors.invoices ? "Ledger revenue unavailable" : `₦${portfolioMetrics.totalCollectedRevenue.toLocaleString()} total lifetime ledger revenue`}
                          </span>
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

                {/* ROW 1: CAROUSEL CARD (5 cols) + 4 KPI CARDS IN 2X2 (7 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* A. My Properties Carousel Card */}
                  <div className="lg:col-span-5 flex flex-col">
                    <PropertyCarouselCard
                      properties={activeDashboardProperties}
                      leases={leases}
                      loading={loadingData}
                      hasError={Boolean(dataErrors.properties)}
                      onRetry={() => fetchAllData(['properties'])}
                      onAddProperty={handleAddPropertyClick}
                      onViewProperty={(property) => navigate(`/dashboard/landlord/properties/${property.id}`)}
                      onViewAll={() => setActiveTab(1)}
                    />
                  </div>

                  {/* B. Four KPI Cards in 2x2 Grid (Matching Mockup Image 1 & 2) */}
                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* KPI 1: Total Properties */}
                    <div
                      onClick={() => setActiveTab(1)}
                      className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-[#00875A]/40 dark:hover:border-[#E5C583]/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 dark:text-cream-100/60">
                          Total Properties
                        </span>
                        <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00875A] dark:text-[#E5C583] border border-emerald-100/60 dark:border-emerald-800/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Building2 className="h-5 w-5" />
                        </div>
                      </div>
                      <div>
                        {loadingData && !dataErrors.properties ? (
                          <div className="h-8 w-16 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse mb-2" />
                        ) : dataErrors.properties ? (
                          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 mb-1.5">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span className="text-sm font-semibold">Error loading</span>
                          </div>
                        ) : (
                          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5">
                            {portfolioMetrics.totalProperties}
                          </h3>
                        )}
                        {dataErrors.properties ? (
                          <span className="text-[11px] text-slate-400 dark:text-cream-100/40">Data unavailable</span>
                        ) : (
                          renderTrendBadge(propMoM)
                        )}
                      </div>
                    </div>

                    {/* KPI 2: Total Tenants */}
                    <div
                      onClick={() => setActiveTab(2)}
                      className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-[#00875A]/40 dark:hover:border-[#E5C583]/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 dark:text-cream-100/60">
                          Total Tenants
                        </span>
                        <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00875A] dark:text-[#E5C583] border border-emerald-100/60 dark:border-emerald-800/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Users className="h-5 w-5" />
                        </div>
                      </div>
                      <div>
                        {loadingData && !dataErrors.leases ? (
                          <div className="h-8 w-16 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse mb-2" />
                        ) : (dataErrors.leases || dataErrors.properties) ? (
                          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 mb-1.5">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span className="text-sm font-semibold">Error loading</span>
                          </div>
                        ) : (
                          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5">
                            {activeTenantsCount}
                          </h3>
                        )}
                        {(dataErrors.leases || dataErrors.properties) ? (
                          <span className="text-[11px] text-slate-400 dark:text-cream-100/40">Data unavailable</span>
                        ) : (
                          renderTrendBadge(tenantMoM)
                        )}
                      </div>
                    </div>

                    {/* KPI 3: This Month's Rent Received */}
                    <div
                      onClick={() => { setActiveTab(0); setActivePill("Payments"); }}
                      className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-[#00875A]/40 dark:hover:border-[#E5C583]/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 dark:text-cream-100/60">
                          This Month's Rent Received
                        </span>
                        <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00875A] dark:text-[#E5C583] border border-emerald-100/60 dark:border-emerald-800/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Wallet className="h-5 w-5" />
                        </div>
                      </div>
                      <div>
                        {loadingData && !dataErrors.invoices ? (
                          <div className="h-8 w-28 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse mb-2" />
                        ) : dataErrors.invoices ? (
                          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 mb-1.5">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span className="text-sm font-semibold">Error loading</span>
                          </div>
                        ) : (
                          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5 truncate" title={`₦ ${thisMonthRentCollected.toLocaleString()}`}>
                            ₦ {thisMonthRentCollected.toLocaleString()}
                          </h3>
                        )}
                        {dataErrors.invoices ? (
                          <span className="text-[11px] text-slate-400 dark:text-cream-100/40">Data unavailable</span>
                        ) : (
                          renderTrendBadge(thisMonthMoM)
                        )}
                      </div>
                    </div>

                    {/* KPI 4: Total Collected Revenue */}
                    <div
                      onClick={() => { setActiveTab(0); setActivePill("Payments"); }}
                      className="tour-vault bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-[#00875A]/40 dark:hover:border-[#E5C583]/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 dark:text-cream-100/60">
                          Total Collected Revenue
                        </span>
                        <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00875A] dark:text-[#E5C583] border border-emerald-100/60 dark:border-emerald-800/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                      </div>
                      <div>
                        {loadingData && !dataErrors.invoices ? (
                          <div className="h-8 w-28 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse mb-2" />
                        ) : dataErrors.invoices ? (
                          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 mb-1.5">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span className="text-sm font-semibold">Error loading</span>
                          </div>
                        ) : (
                          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5 truncate" title={`₦ ${collectedAmount.toLocaleString()}`}>
                            ₦ {collectedAmount.toLocaleString()}
                          </h3>
                        )}
                        {dataErrors.invoices ? (
                          <span className="text-[11px] text-slate-400 dark:text-cream-100/40">Data unavailable</span>
                        ) : (
                          renderTrendBadge(totalRevMoM)
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROW 2: RENTAL INCOME OVERVIEW LINE CHART (FULL WIDTH) */}
                <div className="w-full">
                  <RentalIncomeChart
                    invoices={invoices}
                    leases={leases}
                    loading={loadingData}
                  />
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
            <LandlordCalendar activeTenants={activeTenantsList} />
          ) : activeTab === 6 ? (
            <LandlordMaintenance />
          ) : activeTab === "performance_overview" ? (
            <PerformanceOverview
              properties={displayProperties}
              leases={leases}
              invoices={invoices}
              applications={applications}
              loading={loadingData}
              onRefresh={fetchAllData}
              onBackToHome={() => { setActiveTab(0); setActivePill("Overview"); }}
              onNavigateTab={(tab, pill) => {
                setActiveTab(tab);
                if (pill) setActivePill(pill);
              }}
              onAddProperty={handleAddPropertyClick}
              onSelectTenant={(tenant) => setSelectedTenantForDetails(tenant)}
            />
          ) : activeTab === "receipts" ? (
            <LandlordReceipts
              landlordProfile={landlordProfile}
              triggerToast={triggerToast}
              onBackToHome={() => { setActiveTab(0); setActivePill("Overview"); }}
            />
          ) : activeTab === "leases" ? (
            <LandlordLeases
              landlordProfile={landlordProfile}
              triggerToast={triggerToast}
              onBackToHome={() => { setActiveTab(0); setActivePill("Overview"); }}
              onNavigateTab={(tab, pill) => {
                setActiveTab(tab);
                if (pill) setActivePill(pill);
              }}
            />
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
            onChatClick={() => {
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
                  <div key={rev.id || i} className="border-b border-[#E4EAE1]/60 dark:border-white/5 pb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[13px] font-bold text-ink-900 dark:text-white">{rev.raterName || "Verified Tenant"}</span>
                      <span className="text-[11px] text-[#D69E2E] font-bold flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0 inline" /> {rev.rating ? Number(rev.rating).toFixed(1) : "5.0"}
                      </span>
                    </div>
                    <p className="text-[12px] text-ink-600 dark:text-cream-100/80 leading-relaxed">
                      "{rev.comment || rev.text || "Great landlord experience."}"
                    </p>
                    <span className="text-[10px] text-ink-400 dark:text-cream-100/50">
                      {rev.date || (rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "Recent review")}
                    </span>
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
                  <img
                    src={resolveAvatarUrl(landlordAvatar)}
                    alt="Landlord profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
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
                    } catch {
                      // Safe fallback: malformed cached profile defaults phone to "Not provided"
                      return "Not provided";
                    }
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-ink-400 dark:text-cream-100/70 font-medium">Account Rating</span>
                <span className="text-ink-900 dark:text-white font-semibold flex items-center gap-1">
                  {(() => {
                    const score = ratingData.hasReviews ? ratingData.rating : "New";
                    const count = ratingData.count || 0;

                    if (!ratingData.hasReviews || count === 0) {
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
                      const count = Array.isArray(displayProperties) ? displayProperties.length : 0;
                      return `${count} ${count === 1 ? "Unit" : "Units"}`;
                    } catch {
                      // Safe fallback: defaults to "0 Units"
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
        activeTenants={activeTenantsList}
        onShowToast={(msg) => triggerToast(msg, "info")}
      />
    </div>
  );
}
