import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { triggerToast } from "../../context/ToastContext";
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
  TrendingUp,
  HelpCircle,
  LogOut,
  ArrowUpRight,
  Star,
  Sparkles,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Trash2,
  BellOff,
  ClipboardList
} from "lucide-react";
import { Logo } from "../../components/Logo";
import Button from "../../components/Button";
import { propertyService } from "../../services/propertyService";
import { applicationService } from "../../services/applicationService";
import LandlordProperties from "./LandlordProperties";
import UserInfo from "./components/UserInfo";
import RequestInfo from "./components/RequestInfo";
import LandlordChat from "./components/Landllordchat";
import LandlordApplications from "./components/LandlordApplications";
import SettingsTab from "./Settings";
import Tenants from "./Tenants";
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
    title: "Sidebar: Real-Time Chat",
    content: "Communicate directly with your tenants in secure message threads.",
    placement: "right",
    tab: 3
  },
  {
    target: ".tour-nav-4",
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

  // Retrieve username with per-tab sessionStorage priority & localStorage fallback
  const [username, setUsername] = useState(() => {
    const sessName = sessionStorage.getItem("username");
    if (sessName) return sessName;
    const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || sessionStorage.getItem("lastLoggedInEmail"))?.toLowerCase();
    const storedName = emailKey ? sessionStorage.getItem("username_" + emailKey) : null;
    return storedName || sessionStorage.getItem("username") || "Ada";
  });

  const getActiveTenantsList = () => {
    try {
      const saved = localStorage.getItem("propertyTenants");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Object.values(parsed).flat().filter(t => t && t.status !== "past" && t.status !== "inactive");
    } catch (e) {
      return [];
    }
  };

  const getActiveTenantsCount = () => {
    return getActiveTenantsList().length;
  };

  const getLandlordRatingData = () => {
    try {
      const saved = localStorage.getItem("landlordReviews");
      if (!saved) return { hasReviews: false, rating: "New", count: 0, reviews: [] };
      const list = JSON.parse(saved);
      if (!Array.isArray(list) || list.length === 0) {
        return { hasReviews: false, rating: "New", count: 0, reviews: [] };
      }
      const sum = list.reduce((acc, r) => acc + Number(r.rating || 5), 0);
      const avg = (sum / list.length).toFixed(1);
      return { hasReviews: true, rating: avg, count: list.length, reviews: list };
    } catch (e) {
      return { hasReviews: false, rating: "New", count: 0, reviews: [] };
    }
  };

  const ratingData = getLandlordRatingData();

  // Keep track of active sidebar tab (persisted on page reload)
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      const saved = localStorage.getItem("landlordActiveTab");
      return saved !== null ? Number(saved) : 0;
    } catch (e) {
      return 0;
    }
  });

  const setActiveTab = (index) => {
    setActiveTabState(index);
    try {
      localStorage.setItem("landlordActiveTab", index.toString());
    } catch (e) { }
  };

  // Active top navigation pill
  const [activePill, setActivePill] = useState("Overview");

  // Selected sub-tab in payments popup
  const [paymentSubTab, setPaymentSubTab] = useState("Paid");

  const [selectedTenantForDetails, setSelectedTenantForDetails] = useState(null);
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState(null);
  const [showLandlordProfileModal, setShowLandlordProfileModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

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

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("landlordNotifications");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      {
        id: "n-1",
        title: "Welcome to Lodale",
        message: "Your landlord account is active. Submit properties for instant Admin verification.",
        time: "1 hour ago",
        type: "info",
        read: false
      }
    ];
  });
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Sync username & notifications if changed in storage
  useEffect(() => {
    const handleStorageChange = () => {
      const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || sessionStorage.getItem("lastLoggedInEmail"))?.toLowerCase();
      const storedName = emailKey ? sessionStorage.getItem("username_" + emailKey) : null;
      setUsername(sessionStorage.getItem("username") || storedName || sessionStorage.getItem("username") || "Landlord User");
      const savedNotifs = localStorage.getItem("landlordNotifications");
      if (savedNotifs) {
        try {
          setNotifications(JSON.parse(savedNotifs));
        } catch (e) { }
      }
    };
    handleStorageChange();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const markAllNotifsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("landlordNotifications", JSON.stringify(updated));
  };

  // Trigger onboarding welcome overlay if new signup or first time entering
  useEffect(() => {
    const isNew = localStorage.getItem("isNewSignUp") === "true";
    const hasSeen = localStorage.getItem("hasSeenLandlordTour") === "true";

    if (isNew || !hasSeen) {
      setShowWelcomeOverlay(true);
      localStorage.setItem("isNewSignUp", "false");
      localStorage.setItem("hasSeenLandlordTour", "true");
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

  const handleApproveApplication = (app) => {
    // 1. Add to property tenants mapping
    const saved = localStorage.getItem("propertyTenants");
    const tenantsMap = saved ? JSON.parse(saved) : {};

    const newTenant = {
      id: app.id,
      name: app.tenantName,
      tenantName: app.tenantName,
      avatar: app.avatar,
      email: app.email,
      phone: app.phone,
      reliabilityScore: app.reliabilityScore,
      occupation: app.occupation,
      income: app.income,
      notes: app.notes,
      leaseStatus: `Active Tenant (${app.propertyTitle.includes("Block 4") ? "Unit 4B" : app.propertyTitle.includes("Unit 12B") ? "Unit 12B" : "Plot 14"})`,
      status: "active"
    };

    if (!tenantsMap[app.propertyId]) {
      tenantsMap[app.propertyId] = [];
    }

    // Avoid duplicate approvals
    if (!tenantsMap[app.propertyId].find(t => t.id === newTenant.id)) {
      tenantsMap[app.propertyId].push(newTenant);
    }

    localStorage.setItem("propertyTenants", JSON.stringify(tenantsMap));

    // 1.5. Add a maintenance request for this newly accepted tenant so requests update
    const newRequest = {
      id: Date.now(),
      name: app.tenantName,
      tenantName: app.tenantName,
      avatar: app.avatar,
      type: app.tenantName.includes("Fatima") ? "Upgrade" : "Repair",
      details: app.tenantName.includes("Chidi")
        ? "Fix bedroom AC unit blowing warm air"
        : app.tenantName.includes("Fatima")
          ? "Upgrade kitchen plumbing & sink setup"
          : "Fix master bedroom window lock",
      status: "Pending",
      date: "Just now",
      email: app.email,
      phone: app.phone,
      reliabilityScore: app.reliabilityScore,
      occupation: app.occupation,
      income: app.income,
      notes: app.notes,
      leaseStatus: newTenant.leaseStatus
    };

    const savedRequests = localStorage.getItem("tenantRequests");
    let requestsList = [];
    if (savedRequests) {
      try {
        requestsList = JSON.parse(savedRequests);
      } catch (e) {
        requestsList = [];
      }
    }
    requestsList.push(newRequest);
    localStorage.setItem("tenantRequests", JSON.stringify(requestsList));

    // 2. Add to chat threads mapping
    const savedChats = localStorage.getItem("landlordChats");
    const chatsList = savedChats ? JSON.parse(savedChats) : [];

    const exists = chatsList.some((c) => c.name === app.tenantName);
    if (!exists) {
      const newChat = {
        id: app.tenantName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
        name: app.tenantName,
        avatar: app.avatar,
        email: app.email,
        phone: app.phone,
        reliabilityScore: app.reliabilityScore,
        occupation: app.occupation,
        income: app.income,
        notes: app.notes,
        leaseStatus: newTenant.leaseStatus,
        lastMessage: "No messages yet",
        time: "Just now",
        type: "tenant",
        messages: []
      };
      chatsList.push(newChat);
      localStorage.setItem("landlordChats", JSON.stringify(chatsList));
    }

    triggerToast(`Approved ${app.tenantName}'s application for ${app.propertyTitle}!`, "success", "Application Approved");
    setApplications((prev) => prev.filter((a) => a.id !== app.id));

    // Update the requests state immediately in the current tab
    setTimeout(() => {
      loadRequests();
    }, 50);

    // Dispatch storage event to alert other modules
    window.dispatchEvent(new Event("storage"));
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
    { id: "chat", icon: MessageSquare, label: "Chat", tabIndex: 3, action: () => setActiveTab(3) },
    { id: "settings", icon: Settings, label: "Settings", tabIndex: 4, action: () => setActiveTab(4) },
  ];

  // Filter listings where landlord name matches the username, or fallback to general listings list
  const [displayProperties, setDisplayProperties] = useState([]);
  const [selectedFeedbackProperty, setSelectedFeedbackProperty] = useState(null);

  useEffect(() => {
    async function loadProperties() {
      const currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("db_user_id") || "11111111-1111-1111-1111-111111111111";
      let apiProps = [];
      try {
        apiProps = await propertyService.getLandlordProperties(currentUserId);
      } catch (err) {
        console.warn("Error fetching landlord properties from API:", err);
      }

      let localProps = [];
      try {
        const savedLandlordProps = localStorage.getItem("landlordProperties");
        if (savedLandlordProps) {
          const parsed = JSON.parse(savedLandlordProps);
          if (Array.isArray(parsed)) localProps.push(...parsed);
        }
        const savedGeneralProps = localStorage.getItem("properties");
        if (savedGeneralProps) {
          const parsedG = JSON.parse(savedGeneralProps);
          if (Array.isArray(parsedG)) {
            localProps.push(...parsedG);
          }
        }
      } catch (err) {
        console.warn("Error reading local landlord properties:", err);
      }

      const propMap = new Map();
      if (Array.isArray(apiProps)) {
        apiProps.forEach((p) => {
          if (p && p.id) propMap.set(p.id, p);
        });
      }

      localProps.forEach((p) => {
        if (!p || !p.id) return;
        const currentName = (username || "Tunde Bakare").toLowerCase();
        const pLandlordName = (p.landlord?.name || p.landlord || "").toLowerCase();
        const isMatch = !p.landlord || pLandlordName.includes(currentName) || currentName.includes(pLandlordName) || p.landlordId === currentUserId;

        if (isMatch || !propMap.has(p.id)) {
          // Sync status from general properties if approved in admin
          const generalPropsStr = localStorage.getItem("properties");
          if (generalPropsStr) {
            try {
              const genProps = JSON.parse(generalPropsStr);
              const matchedGen = genProps.find((gp) => gp.id === p.id);
              if (matchedGen && matchedGen.status) {
                p.status = matchedGen.status;
                if (matchedGen.status === "active_vacant" || matchedGen.status === "live" || matchedGen.status === "approved") {
                  p.isPending = false;
                }
              }
            } catch (_e) { }
          }

          propMap.set(p.id, {
            ...p,
            price: p.price || formatCurrency(p.rent_amount || p.rent || 2500000, "/yr"),
            location: p.location || `${p.city || "Abuja"}, ${p.state || "FCT"}`
          });
        }
      });

      setDisplayProperties(Array.from(propMap.values()));
    }

    loadProperties();

    window.addEventListener("storage", loadProperties);
    window.addEventListener("focus", loadProperties);
    return () => {
      window.removeEventListener("storage", loadProperties);
      window.removeEventListener("focus", loadProperties);
    };
  }, [username]);

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
  const overdueTenants = activeTenantsList.filter(t => t.paymentStatus === "Overdue" || t.paymentStatus === "Outstanding");

  const collectedAmount = paidTenants.reduce((sum, t) => sum + parseTenantRent(t), 0);
  const outstandingAmount = overdueTenants.reduce((sum, t) => sum + parseTenantRent(t), 0);
  const availablePayoutBalance = activeTenantsCount === 0 ? 0 : collectedAmount;

  const handleUpdateRequestStatus = (requestId, newStatus) => {
    setTenantRequests((prevRequests) => {
      const updated = prevRequests.map((req) =>
        req.id === requestId ? { ...req, status: newStatus } : req
      );

      // Persist requests to localStorage
      localStorage.setItem("tenantRequests", JSON.stringify(updated));

      const req = prevRequests.find((r) => r.id === requestId);
      if (req && (newStatus === "In Progress" || newStatus === "Completed")) {
        const saved = localStorage.getItem("landlordChats");
        const chatsList = saved ? JSON.parse(saved) : [];

        const exists = chatsList.some((c) => c.name === req.tenantName);
        if (!exists) {
          const newChat = {
            id: req.tenantName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
            name: req.tenantName,
            avatar: req.avatar,
            email: req.email || `${req.tenantName.toLowerCase().replace(/\s+/g, ".")}@domain.com`,
            phone: req.phone || "+234 800 000 0000",
            reliabilityScore: req.reliabilityScore || "4.7",
            occupation: req.occupation || "Tenant",
            income: req.income || "₦500,000/mo",
            notes: req.notes || "No notes available.",
            leaseStatus: req.leaseStatus || "Active Tenant",
            lastMessage: `Maintenance request set to ${newStatus}: ${req.details}`,
            time: req.date || "Just now",
            type: "tenant",
            messages: [
              {
                id: 1,
                sender: "tenant",
                text: `Hello, I submitted a maintenance request: ${req.details}`,
                time: req.date || "Just now"
              },
              {
                id: 2,
                sender: "landlord",
                text: `I've approved your request and updated its status to ${newStatus}. We are on it!`,
                time: "Just now"
              }
            ]
          };
          chatsList.push(newChat);
          localStorage.setItem("landlordChats", JSON.stringify(chatsList));
          window.dispatchEvent(new Event("storage"));
        }
      }
      return updated;
    });
  };

  // Tenant Maintenance/Upgrade Requests list
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [tenantRequests, setTenantRequests] = useState([]);

  const loadRequests = () => {
    if (getActiveTenantsCount() === 0) {
      setTenantRequests([]);
      return;
    }
    const saved = localStorage.getItem("tenantRequests");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out default seeds if they exist
        const filtered = parsed.filter(
          (req) =>
            req.tenantName !== "Emeka Obi" &&
            req.tenantName !== "Maren Maureen" &&
            req.tenantName !== "Ryan Herwinds" &&
            req.name !== "Emeka Obi" &&
            req.name !== "Maren Maureen" &&
            req.name !== "Ryan Herwinds"
        );
        setTenantRequests(filtered);
      } catch (e) {
        setTenantRequests([]);
      }
    } else {
      setTenantRequests([]);
    }
  };

  useEffect(() => {
    loadRequests();
    window.addEventListener("storage", loadRequests);
    return () => window.removeEventListener("storage", loadRequests);
  }, []);

  const displayRequests = showAllRequests ? tenantRequests : tenantRequests.slice(0, 2);

  return (
    <div className="db-wrapper">

      {/* HEADER BAR */}
      <header className="db-header">
        <div className="db-header-left">
          <div className="cursor-pointer hover:opacity-85 transition-opacity" onClick={() => navigate("/explore")} title="Go to Public Guest Dashboard">
            <Logo variant="moss" />
          </div>

          {/* Top category nav pills */}
          <div className="relative">
            <nav className="db-nav-pills tour-pills">
              {["Overview", "Payments", "Applications"].map((pill) => (
                <button
                  key={pill}
                  onClick={() => {
                    setActivePill(pill);
                  }}
                  className={`db-nav-pill ${activePill === pill ? "active" : ""} flex items-center gap-1.5`}
                >
                  {pill}
                  {pill === "Applications" && applications.length > 0 && (
                    <span className="db-pill-badge">{applications.length}</span>
                  )}
                </button>
              ))}
            </nav>

            {activePill === "Applications" && null /* Rendered as a separate page now */}

            {activePill === "Payments" && (
              <div className="db-applications-popup db-payments-popup">
                <div className="db-popup-header">
                  <h3>Rent Payments History</h3>
                  <button
                    className="db-popup-close-btn"
                    onClick={() => {
                      setActivePill("Overview");
                    }}
                  >
                    &times;
                  </button>
                </div>
                <div className="db-popup-body">
                  <div className="db-popup-stats-summary">
                    <div style={{ flex: 1 }}>
                      <span className="db-popup-stats-lbl">Collected (Month)</span>
                      <span className="db-popup-stats-val">₦{collectedAmount.toLocaleString()}</span>
                    </div>
                    <div style={{ flex: 1, borderLeft: "1.5px solid var(--border-light)", paddingLeft: "16px" }}>
                      <span className="db-popup-stats-lbl">Outstanding</span>
                      <span className="db-popup-stats-val overdue">₦{outstandingAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Paid/Outstanding Toggle Subtabs */}
                  <div className="payment-subtab-container">
                    <button
                      className={`payment-subtab-btn ${paymentSubTab === "Paid" ? "active" : ""}`}
                      onClick={() => setPaymentSubTab("Paid")}
                    >
                      Paid ({paidTenants.length})
                    </button>
                    <button
                      className={`payment-subtab-btn ${paymentSubTab === "Outstanding" ? "active" : ""}`}
                      onClick={() => setPaymentSubTab("Outstanding")}
                    >
                      Outstanding ({overdueTenants.length})
                    </button>
                  </div>

                  <div className="db-popup-list">
                    {paymentSubTab === "Paid" ? (
                      paidTenants.length === 0 ? (
                        <div className="p-6 text-center text-ink-400 dark:text-cream-100/60">
                          <p className="text-xs font-semibold">No collected rent payments recorded.</p>
                          <p className="text-[11px] mt-1 opacity-70">Payments will appear here when active tenants pay rent.</p>
                        </div>
                      ) : (
                        paidTenants.map((t, idx) => {
                          const amount = parseTenantRent(t);
                          return (
                            <div key={t.id || idx} className="db-popup-item">
                              <div className="db-popup-info">
                                <div className="db-popup-name-row">
                                  <span className="db-popup-name">{t.name || t.tenantName}</span>
                                  <span className="db-popup-status-text paid">+₦{amount.toLocaleString()}</span>
                                </div>
                                <p className="db-popup-property">{t.propertyTitle || t.leaseStatus || "Leased Property"}</p>
                                <span className="db-popup-date">Paid • {t.dueDate || "Monthly Rent"}</span>
                              </div>
                            </div>
                          );
                        })
                      )
                    ) : (
                      overdueTenants.length === 0 ? (
                        <div className="p-6 text-center text-ink-400 dark:text-cream-100/60">
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">All tenant payments are up to date! 🎉</p>
                          <p className="text-[11px] mt-1 opacity-70">No outstanding rent balances currently.</p>
                        </div>
                      ) : (
                        overdueTenants.map((t, idx) => {
                          const amount = parseTenantRent(t);
                          return (
                            <div key={t.id || idx} className="db-popup-item">
                              <div className="db-popup-info">
                                <div className="db-popup-name-row">
                                  <span className="db-popup-name">{t.name || t.tenantName}</span>
                                  <span className="db-popup-status-text overdue">₦{amount.toLocaleString()}</span>
                                </div>
                                <p className="db-popup-property">{t.propertyTitle || t.leaseStatus || "Leased Property"}</p>
                                <span className="db-popup-date overdue">Rent Outstanding</span>
                              </div>
                            </div>
                          );
                        })
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="db-header-right">
          {/* Active Tenants Avatar Stack */}
          {(() => {
            const activeTenants = getActiveTenantsList();
            const displayTenants = activeTenants.slice(0, 2);

            return (
              <div
                className="db-avatar-group cursor-pointer flex items-center -space-x-2"
                onClick={() => setActiveTab(2)}
                title="View Tenants List"
              >
                {displayTenants.length > 0 ? (
                  displayTenants.map((t, idx) =>
                    t.avatar ? (
                      <img
                        key={t.id || idx}
                        src={t.avatar}
                        alt={t.name || "Tenant"}
                        className="w-7 h-7 rounded-full object-cover border-2 border-white dark:border-[#0B1512]"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        key={t.id || idx}
                        className={`w-7 h-7 rounded-full ${idx % 2 === 0 ? "bg-moss-700" : "bg-amber-600"} text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-[#0B1512]`}
                      >
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )
                  )
                ) : (
                  <>
                    <div className="w-7 h-7 rounded-full bg-moss-700 text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-[#0B1512]">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-[#0B1512]">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          <Button
            onClick={() => navigate("/dashboard/landlord/add-property")}
            className="flex items-center gap-1.5 bg-moss-700 hover:bg-forest-600 px-4 py-2 text-[12.5px] transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] cursor-pointer tour-add-property"
          >
            <Plus className="h-3.5 w-3.5" /> Add Property
          </Button>

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
              <div className="absolute right-0 top-12 z-[100] w-80 sm:w-[380px] rounded-3xl bg-white/95 dark:bg-[#12221C]/95 border border-[#E4EAE1] dark:border-white/10 shadow-2xl p-5 space-y-4 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 ease-out">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4EAE1] dark:border-white/10">
                  <h3 className="font-bold text-sm text-ink-900 dark:text-white flex items-center gap-2">
                    <Bell className="h-4.5 w-4.5 text-moss-700 dark:text-[#E5C583]" />
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#2C4633] text-white dark:bg-[#E5C583] dark:text-[#0B1512] rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3">
                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          setNotifications([]);
                          localStorage.setItem("landlordNotifications", JSON.stringify([]));
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
                        ? "border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10"
                        : isWarning
                          ? "border-l-4 border-l-rose-500 bg-rose-50/30 dark:bg-rose-950/10"
                          : "border-l-4 border-l-moss-700 dark:border-l-[#E5C583] bg-cream-50/30 dark:bg-white/5";

                      const IconComponent = isSuccess
                        ? CheckCircle2
                        : isWarning
                          ? AlertTriangle
                          : Info;

                      const iconColorClass = isSuccess
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-100/40 dark:bg-emerald-950/30"
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
                            <span className="text-[10px] font-semibold text-ink-400 dark:text-cream-100/50 block mt-1.5">{notif.time || "Just now"}</span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotifications(prev => {
                                const updated = prev.filter(n => n.id !== notif.id);
                                localStorage.setItem("landlordNotifications", JSON.stringify(updated));
                                return updated;
                              });
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
            <div className="db-user-avatar overflow-hidden rounded-full flex items-center justify-center bg-[#3A5A40]/10 dark:bg-[#1E382A] text-[#2C4633] dark:text-[#E5C583] border border-[#2C4633]/20 dark:border-white/20">
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

      {/* DASHBOARD CONTAINER */}
      <div className="db-container">

        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="db-sidebar">
          <div className="db-sidebar-nav">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = item.id === "dashboard" ? activeTab === 0 && activePill !== "Applications" 
                             : item.id === "applications" ? activeTab === 0 && activePill === "Applications"
                             : activeTab === item.tabIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`db-sidebar-btn ${isActive ? "active" : ""} tour-nav-${index}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="db-sidebar-tooltip">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="db-sidebar-bottom">
            <button
              onClick={() => {
                setTourStep(0);
                setRunTour(true);
              }}
              className="db-sidebar-btn"
              title="Start Interactive Tour"
            >
              <HelpCircle className="h-5 w-5" />
              <span className="db-sidebar-tooltip">Take a Tour</span>
            </button>
            <button
              onClick={handleSignOut}
              className="db-sidebar-btn logout-btn"
            >
              <LogOut className="h-5 w-5" />
              <span className="db-sidebar-tooltip">Log Out</span>
            </button>
          </div>
        </aside>

        {/* MAIN BODY AREA */}
        <main className={`db-main-content ${activeTab === 3 ? "chat-tab-active" : ""}`}>

          {/* Main Area Sub-Header */}
          {activeTab !== 3 && (
            <div className="db-sub-header-row">
              <div className="db-page-header tour-welcome">
                {/* Breadcrumb */}
                <div className="db-breadcrumb">
                  <span
                    className="cursor-pointer hover:underline hover:opacity-80 transition-all text-moss-700 dark:text-[#E5C583]"
                    onClick={() => navigate("/explore")}
                    title="Go to Public Guest Dashboard"
                  >
                    Home Page
                  </span>
                  <span>→</span>
                  <span className="db-breadcrumb-active">
                    {activeTab === 0 ? "Dashboard" : activeTab === 1 ? "Properties" : activeTab === 2 ? "Tenants" : activeTab === 4 ? "Settings" : "Section"}
                  </span>
                </div>

                {/* Heading: Welcome or Section Title */}
                <h1 className="db-title">
                  {activeTab === 0 ? `Welcome, ${username}!` : activeTab === 1 ? "My Properties" : activeTab === 2 ? "Tenants Directory" : activeTab === 4 ? "Settings" : "Section"}
                </h1>
              </div>

              {activeTab === 0 && (
                /* Filter, search and stats widgets */
                <div className="db-controls-group">
                  {/* Current Date Display */}
                  <div className="db-date-selector">
                    <Calendar className="h-3.5 w-3.5 text-moss-600" />
                    <span>{currentDateStr}</span>
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => triggerToast("Generating property portfolio financial report...", "info", "Report Generator")}
                    className="px-4 py-2 bg-white text-[12.5px]"
                  >
                    Create Report
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 0 ? (
            activePill === "Applications" ? (
              <div className="mt-2">
                <LandlordApplications setActiveTab={setActiveTab} />
              </div>
            ) : (
              /* DASHBOARD CONTENT GRID */
              <div className="space-y-6">
                {/* TOP ROW GRID */}
                <div className="db-grid">

                  {/* COLUMN 1: PORTFOLIO SUMMARY CARD */}
                  <div className="db-col">
                    {/* Landlord Rating Card */}
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
                  </div>

                  {/* COLUMN 2: ACTIVITY AND REVENUE STATS */}
                  <div className="db-col">
                    {/* Activity / Occupancy rate bar chart */}
                    <section className="db-card activity-card tour-occupancy">
                      <div className="activity-header">
                        <div>
                          <h3 className="activity-title">Weekly Activity</h3>
                          <p className="text-[11.5px] text-ink-400 dark:text-cream-100/60 font-medium mt-0.5">
                            Daily tenant interactions & unit occupancy
                          </p>
                        </div>
                        <span className="activity-badge">Weekly logs</span>
                      </div>

                      <div className="activity-metric">
                        <span className="activity-val">
                          {displayProperties.length === 0 ? "0%" : `${occupancyRate}%`}
                        </span>
                        <span className="activity-sub">Occupancy Rate</span>
                      </div>

                      {/* Bar Graph - Dynamically scaled based on Occupancy Rate */}
                      <div className="activity-chart-grid">
                        {[
                          { day: "Mon", base: 45, highlight: false },
                          { day: "Tue", base: 60, highlight: false },
                          { day: "Wed", base: 35, highlight: false },
                          { day: "Thu", base: 75, highlight: false },
                          { day: "Fri", base: 95, highlight: true }, // Highlighted bar
                          { day: "Sat", base: 50, highlight: false },
                          { day: "Sun", base: 40, highlight: false },
                        ].map((bar, index) => {
                          const barHeight = occupancyRate === 0
                            ? "0%"
                            : `${Math.max(12, Math.round(bar.base * (occupancyRate / 100)))}%`;

                          return (
                            <div key={index} className="activity-bar-col">
                              <div className="activity-bar-container">
                                <div
                                  className={`activity-bar-fill ${bar.highlight && occupancyRate > 0 ? "highlight" : ""}`}
                                  style={{ height: barHeight }}
                                />
                              </div>
                              <span className="activity-bar-label">{bar.day}</span>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>

                  {/* COLUMN 3: PAYOUT ACCOUNT */}
                  <div className="db-col">
                    {/* Payout Account Visa Mock Card */}
                    <div className="visa-card-mock tour-vault">
                      <div className="visa-card-highlight" />

                      <div className="visa-card-header">
                        <div>
                          <p className="visa-card-brand">Available Payouts</p>
                          <p className="visa-card-holder">{username}</p>
                        </div>
                        <span className="visa-card-logo">L.</span>
                      </div>

                      <div className="visa-card-body">
                        <p className="visa-card-lbl">Available Balance</p>
                        <p className="visa-card-amount">₦{availablePayoutBalance.toLocaleString()}</p>
                      </div>

                      <div className="visa-card-footer">
                        <span>•••• 8802</span>
                        <span>EXP 09/29</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* BOTTOM ROW GRID (Properties and Tenant Requests half & half) */}
                <div className="db-bottom-row">
                  {/* Vertical properties log list */}
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

                    <div className="properties-vertical-scroll">
                      {(() => {
                        const activeTenantsMap = (() => {
                          try {
                            const saved = localStorage.getItem("propertyTenants");
                            return saved ? JSON.parse(saved) : {};
                          } catch (e) {
                            return {};
                          }
                        })();

                        const liveAndOccupiedProps = displayProperties.filter((p) => {
                          const status = (p.status || "").toLowerCase();
                          const isLiveOrApproved = status === "active_vacant" || status === "approved" || status === "live" || status === "active";
                          const isOccupied = status === "occupied" || status === "active_occupied" || (activeTenantsMap[p.id] && activeTenantsMap[p.id].length > 0);
                          return isLiveOrApproved || isOccupied;
                        });

                        if (liveAndOccupiedProps.length === 0) {
                          return (
                            <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)", fontSize: "13px", fontWeight: "600" }}>
                              No live or occupied properties available.
                            </div>
                          );
                        }

                        return liveAndOccupiedProps.map((property) => {
                          const hasTenants = (activeTenantsMap[property.id] && activeTenantsMap[property.id].length > 0) || property.status === "occupied" || property.status === "active_occupied";
                          return (
                            <div key={property.id} className="property-mini-item flex items-center justify-between p-3 rounded-xl border border-ink-100 dark:border-white/10 mb-2">
                              <div className="flex items-center gap-3">
                                <div className="property-mini-img p-2 bg-[#3A5A40]/10 rounded-lg">
                                  <Building2 className="h-5 w-5 text-moss-700 dark:text-[#E5C583]" />
                                </div>
                                <div className="property-mini-details">
                                  <p className="property-mini-title font-bold text-xs text-ink-900 dark:text-white">{property.title}</p>
                                  <p className="property-mini-subtitle text-[11px] text-ink-500 dark:text-cream-100/70">{property.location}</p>
                                  <p className="property-mini-price text-xs font-bold text-moss-700 dark:text-[#E5C583] mt-0.5">{property.price}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {hasTenants ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-300">
                                    <Users className="h-3 w-3" /> Occupied
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300">
                                    <CheckCircle2 className="h-3 w-3" /> Live
                                  </span>
                                )}
                                <button
                                  onClick={() => navigate(`/dashboard/landlord/properties/${property.id}`)}
                                  className="property-mini-btn p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-white/10 transition-colors"
                                  title="View details"
                                >
                                  <ArrowUpRight className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </section>

                  {/* Tenant Requests list */}
                  <section className="db-card requests-card tour-requests">
                    <div className="activity-header" style={{ marginBottom: "16px" }}>
                      <h3 className="activity-title">
                        {getActiveTenantsCount() === 0 ? "No tenants request" : "Tenant Requests"}
                      </h3>
                      <span className="activity-badge">{tenantRequests.length} total</span>
                    </div>

                    <div className="requests-list">
                      {tenantRequests.length === 0 ? (
                        <div className="requests-empty-state">
                          <div className="requests-empty-icon">📋</div>
                          <h4 className="requests-empty-title">No tenants request</h4>
                          <p className="requests-empty-desc">
                            {getActiveTenantsCount() === 0
                              ? "Approve tenant applications to receive tenancy and maintenance requests."
                              : "Maintenance requests will appear here once active tenants submit them."}
                          </p>
                        </div>
                      ) : (
                        displayRequests.map((req) => {
                          const unitName = req.leaseStatus
                            ? req.leaseStatus.replace("Active Tenant (", "").replace(")", "")
                            : "Unit General";
                          const isUpgrade = (req.type || "").toLowerCase() === "upgrade";
                          const typeBadgeClass = isUpgrade
                            ? "request-type-badge upgrade"
                            : "request-type-badge repair";

                          return (
                            <div key={req.id} className="request-item">
                              <img
                                src={req.avatar}
                                alt={req.tenantName}
                                className="request-tenant-avatar cursor-pointer"
                                onClick={() => setSelectedTenantForDetails(req)}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <div className="request-content">
                                <div className="request-header-row">
                                  <span
                                    className="request-tenant-name cursor-pointer hover:underline"
                                    onClick={() => setSelectedTenantForDetails(req)}
                                  >
                                    {req.tenantName}
                                  </span>
                                  {req.reliabilityScore && (
                                    <span className="request-score" title="Reliability Score">
                                      ★ {req.reliabilityScore}
                                    </span>
                                  )}
                                  <span className="request-date">• {req.date}</span>
                                </div>

                                <div className="request-meta-tags">
                                  <span className="request-unit-badge">
                                    {unitName}
                                  </span>
                                  {req.type && (
                                    <span className={typeBadgeClass}>
                                      {req.type}
                                    </span>
                                  )}
                                </div>

                                <p className="request-details">{req.details}</p>
                              </div>
                              <div className="request-actions-col">
                                <span className={`request-status-badge ${req.status.toLowerCase().replace(" ", "-")}`}>
                                  {req.status}
                                </span>
                                <button
                                  className="db-view-request-btn"
                                  onClick={() => setSelectedRequestForDetails(req)}
                                >
                                  Inspect
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {tenantRequests.length > 0 && (
                      <button
                        onClick={() => setShowAllRequests(!showAllRequests)}
                        className="requests-show-more-btn"
                      >
                        {showAllRequests ? "Show Less" : "Show More"}
                      </button>
                    )}
                  </section>
                </div>

              </div>
            )
          ) : activeTab === 1 ? (
            <LandlordProperties />
          ) : activeTab === 2 ? (
            <Tenants setSelectedTenantForDetails={setSelectedTenantForDetails} setActiveTab={setActiveTab} />
          ) : activeTab === 3 ? (
            <LandlordChat />
          ) : activeTab === 4 ? (
            <SettingsTab />
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
        <UserInfo
          tenant={selectedTenantForDetails}
          onClose={() => setSelectedTenantForDetails(null)}
        />
      )}

      {selectedRequestForDetails && (
        <RequestInfo
          request={selectedRequestForDetails}
          onClose={() => setSelectedRequestForDetails(null)}
          onUpdateStatus={handleUpdateRequestStatus}
        />
      )}

      {showRatingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#12221C] rounded-3xl border border-[#E4EAE1] dark:border-white/10 max-w-md w-full p-8 shadow-2xl relative text-center">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-ink-400 dark:text-cream-100 hover:text-ink-900 dark:hover:text-white text-xl font-bold p-1 bg-[#FAF8F6] dark:bg-white/5 rounded-full h-8 w-8 flex items-center justify-center cursor-pointer transition-colors border-none outline-none"
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
              className="mt-6 w-full py-3 bg-[#2C4633] dark:bg-[#E5C583] hover:bg-[#1C3021] dark:hover:bg-[#d4b574] text-white dark:text-[#0B1512] font-bold text-[13.5px] rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98] border-none outline-none"
            >
              Close Reviews
            </button>
          </div>
        </div>
      )}

      {showLandlordProfileModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#12221C] rounded-3xl border border-[#E4EAE1] dark:border-white/10 max-w-sm w-full p-8 shadow-2xl relative text-center">
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
              <span className="absolute bottom-0 right-0 bg-green-500 h-5 w-5 rounded-full border-2 border-white dark:border-[#12221C] shadow-sm z-10" />
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
                    let score = "5.0";
                    let count = 1;
                    try {
                      const savedReviews = localStorage.getItem("landlordReviews");
                      if (savedReviews) {
                        const rList = JSON.parse(savedReviews);
                        if (Array.isArray(rList) && rList.length > 0) {
                          score = (rList.reduce((sum, r) => sum + Number(r.rating || 5), 0) / rList.length).toFixed(1);
                          count = rList.length;
                        }
                      }
                    } catch (e) { }
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
                    try {
                      const email = sessionStorage.getItem("lastLoggedInEmail");
                      if (email) {
                        const reg = localStorage.getItem("registeredUser_" + email);
                        if (reg) {
                          const uObj = JSON.parse(reg);
                          if (uObj.createdAt || uObj.joinedDate) {
                            const d = new Date(uObj.createdAt || uObj.joinedDate);
                            return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                          }
                        }
                      }
                    } catch (e) { }
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
              className="mt-6 w-full py-3 bg-[#2C4633] dark:bg-[#E5C583] hover:bg-[#1C3021] dark:hover:bg-[#d4b574] text-white dark:text-[#0B1512] font-bold text-[13.5px] rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98] shadow-md shadow-[#2C4633]/10 border-none outline-none"
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
              <Sparkles className="h-8 w-8 text-[#E5C583] animate-pulse" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#16241F] border border-ink-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl">
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
                  setSelectedFeedbackProperty(null);
                  navigate("/dashboard/landlord/add-property");
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#3A5A40] hover:bg-[#344E41] rounded-xl cursor-pointer"
              >
                Re-submit Property with Papers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
