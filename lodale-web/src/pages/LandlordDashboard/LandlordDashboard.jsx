import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { Logo } from "../../components/Logo";
import Button from "../../components/Button";
import { LISTINGS } from "../../data/listings";
import LandlordProperties from "./LandlordProperties";
import UserInfo from "./components/UserInfo";
import RequestInfo from "./components/RequestInfo";
import LandlordChat from "./components/Landllordchat";
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
    target: ".pro-card",
    title: "Landlord Rating Star Index",
    content: "Based on anonymous check-out feedback and tenant satisfaction indices. Maintain a stellar rating to attract premium applicants!",
    placement: "bottom",
    tab: 0
  },
  {
    target: ".tour-occupancy",
    title: "Monthly Occupancy Log",
    content: "Analyzes occupancy percentages and active tenancy ratios over time.",
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

  // Retrieve username from localStorage with fallback
  const [username, setUsername] = useState(() => {
    return localStorage.getItem("username") || "Ada";
  });

  const getActiveTenantsCount = () => {
    try {
      const saved = localStorage.getItem("propertyTenants");
      if (!saved) return 0;
      const parsed = JSON.parse(saved);
      return Object.values(parsed).flat().length;
    } catch (e) {
      return 0;
    }
  };

  // Keep track of active sidebar tab (default: 0 for Dashboard)
  const [activeTab, setActiveTab] = useState(0);

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
  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem("propertyApplications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Sync username & applications if changed in storage
  useEffect(() => {
    const handleStorageChange = () => {
      setUsername(localStorage.getItem("username") || "Landlord User");
      const savedApps = localStorage.getItem("propertyApplications");
      if (savedApps) {
        try {
          setApplications(JSON.parse(savedApps));
        } catch (e) {}
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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

    alert(`Approved ${app.tenantName}'s application for ${app.propertyTitle}`);
    setApplications((prev) => prev.filter((a) => a.id !== app.id));
    
    // Update the requests state immediately in the current tab
    setTimeout(() => {
      loadRequests();
    }, 50);

    // Dispatch storage event to alert other modules
    window.dispatchEvent(new Event("storage"));
  };

  function handleSignOut() {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("sessionExpiresAt");
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");
    navigate("/login");
  }

  // Sidebar navigation items
  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard Home" },
    { icon: Building2, label: "Properties" },
    { icon: Users, label: "Tenants" },
    { icon: MessageSquare, label: "Chat" },
    { icon: Settings, label: "Settings" },
  ];

  // Filter listings where landlord name matches the username, or fallback to general listings list
  const [displayProperties, setDisplayProperties] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("properties");
    if (saved) {
      try {
        const allList = JSON.parse(saved);
        const userFirstName = username.toLowerCase().split(" ")[0];
        const filtered = allList.filter(l =>
          !l.landlord?.name || l.landlord?.name?.toLowerCase().includes(userFirstName) || userFirstName.includes(l.landlord?.name?.toLowerCase().split(" ")[0] || "")
        );
        setDisplayProperties(filtered);
      } catch (e) {
        setDisplayProperties([]);
      }
    } else {
      setDisplayProperties([]);
    }
  }, [username]);

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
          <Logo variant="moss" />

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

            {activePill === "Applications" && (
              <div className="db-applications-popup">
                <div className="db-popup-header">
                  <h3>New Rental Applications</h3>
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
                  {applications.length === 0 ? (
                    <div className="db-popup-empty">
                      <p>No pending applications</p>
                    </div>
                  ) : (
                    <div className="db-popup-list">
                      {applications.map((app) => (
                        <div key={app.id} className="db-popup-item">
                          <img 
                            src={app.avatar} 
                            alt={app.tenantName} 
                            className="db-popup-avatar cursor-pointer" 
                            onClick={() => {
                              setSelectedTenantForDetails(app);
                              setActivePill("Overview");
                            }}
                          />
                          <div className="db-popup-info">
                            <div className="db-popup-name-row">
                              <span 
                                className="db-popup-name cursor-pointer hover:underline"
                                onClick={() => {
                                  setSelectedTenantForDetails(app);
                                  setActivePill("Overview");
                                }}
                              >
                                {app.tenantName}
                              </span>
                              <span className="db-popup-score">⭐ {app.reliabilityScore}</span>
                            </div>
                            <p className="db-popup-property">{app.propertyTitle}</p>
                            <span className="db-popup-date">{app.date}</span>
                          </div>
                          <div className="db-popup-actions">
                            <button 
                              className="db-action-btn approve"
                              onClick={() => handleApproveApplication(app)}
                            >
                              Approve
                            </button>
                            <button 
                              className="db-action-btn decline"
                              onClick={() => {
                                alert(`Declined ${app.tenantName}'s application`);
                                setApplications((prev) => prev.filter((a) => a.id !== app.id));
                              }}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                      <span className="db-popup-stats-val">₦525,000</span>
                    </div>
                    <div style={{ flex: 1, borderLeft: "1.5px solid var(--border-light)", paddingLeft: "16px" }}>
                      <span className="db-popup-stats-lbl">Outstanding</span>
                      <span className="db-popup-stats-val overdue">₦200,000</span>
                    </div>
                  </div>
                  
                  {/* Paid/Outstanding Toggle Subtabs */}
                  <div className="payment-subtab-container">
                    <button 
                      className={`payment-subtab-btn ${paymentSubTab === "Paid" ? "active" : ""}`}
                      onClick={() => setPaymentSubTab("Paid")}
                    >
                      Paid
                    </button>
                    <button 
                      className={`payment-subtab-btn ${paymentSubTab === "Outstanding" ? "active" : ""}`}
                      onClick={() => setPaymentSubTab("Outstanding")}
                    >
                      Outstanding
                    </button>
                  </div>
                  
                  <div className="db-popup-list">
                    {paymentSubTab === "Paid" ? (
                      <>
                        <div className="db-popup-item">
                          <div className="db-popup-info">
                            <div className="db-popup-name-row">
                              <span className="db-popup-name">Emeka Obi</span>
                              <span className="db-popup-status-text paid">+₦375,000</span>
                            </div>
                            <p className="db-popup-property">Skyline Apartments, Block 4 (Unit 4B)</p>
                            <span className="db-popup-date">Paid via Bank Transfer • Today, 09:30 AM</span>
                          </div>
                        </div>
                        
                        <div className="db-popup-item">
                          <div className="db-popup-info">
                            <div className="db-popup-name-row">
                              <span className="db-popup-name">Maren Maureen</span>
                              <span className="db-popup-status-text paid">+₦150,000</span>
                            </div>
                            <p className="db-popup-property">Oakwood Residency, Unit 12B</p>
                            <span className="db-popup-date">Paid via Card • 3 days ago</span>
                          </div>
                        </div>
                        
                        <div className="db-popup-item">
                          <div className="db-popup-info">
                            <div className="db-popup-name-row">
                              <span className="db-popup-name">Past Tenant (Adebayo)</span>
                              <span className="db-popup-status-text refunded">-₦200,000</span>
                            </div>
                            <p className="db-popup-property">Lekki Gardens, Plot 14</p>
                            <span className="db-popup-date">Refunded Security Deposit • Jan 5, 2026</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="db-popup-item">
                          <div className="db-popup-info">
                            <div className="db-popup-name-row">
                              <span className="db-popup-name">Ryan Herwinds</span>
                              <span className="db-popup-status-text overdue">₦200,000</span>
                            </div>
                            <p className="db-popup-property">Lekki Gardens, Plot 14</p>
                            <span className="db-popup-date overdue">Rent Overdue since July 15, 2026</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="db-header-right">
          {/* Manager / Admin Avatar Stack */}
          <div 
            className="db-avatar-group" 
            onClick={() => setActiveTab(2)}
            title="View Tenants List"
          >
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64&q=80"
              alt="Manager 1"
              className="db-avatar-item"
            />
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64&q=80"
              alt="Manager 2"
              className="db-avatar-item"
            />
            <div className="db-avatar-plus">+3</div>
          </div>

          <Button
            onClick={() => navigate("/dashboard/landlord/add-property")}
            className="flex items-center gap-1.5 bg-moss-700 hover:bg-forest-600 px-4 py-2 text-[12.5px] transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] cursor-pointer tour-add-property"
          >
            <Plus className="h-3.5 w-3.5" /> Add Property
          </Button>

          {/* Quick Notification Tools */}
          <div className="db-icon-btn-group">
            <button className="db-icon-btn" aria-label="Notifications">
              <Bell className="h-4.5 w-4.5" />
              <span className="db-badge-dot" />
            </button>
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
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=64&h=64&q=80"
              alt="User profile"
              className="db-user-avatar"
            />
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
              const isActive = index === activeTab;
              return (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
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
                  <span>Home Page</span>
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
                    onClick={() => alert("Creating report parameters...")}
                    className="px-4 py-2 bg-white text-[12.5px]"
                  >
                    Create Report
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 0 ? (
            /* DASHBOARD CONTENT GRID */
            <div className="db-grid">

              {/* COLUMN 1: PORTFOLIO SUMMARY CARD */}
              <div className="db-col">
                <section className="db-card pro-card">
                  {/* Header */}
                  <div className="pro-card-header">
                    <span className="pro-card-tag">Landlord Rating</span>
                    <button className="pro-card-close" aria-label="Dismiss">✕</button>
                  </div>

                  {/* Visual Area */}
                  <div className="pro-card-visual">
                    <div className="pro-card-glow" />
                    <svg width="90" height="90" viewBox="0 0 100 100" className="pro-card-prism">
                      <polygon points="50,15 80,45 80,85 20,85 20,45" fill="none" stroke="#2C4633" strokeWidth="2.5" />
                      <polygon points="50,15 50,85" stroke="#3A5A40" strokeWidth="1.5" strokeDasharray="3 3" />
                      <polygon points="50,15 80,45 50,55 20,45" fill="#E4EAE1" stroke="#2C4633" strokeWidth="1.5" />
                      <line x1="35" y1="85" x2="35" y2="60" stroke="#3A5A40" strokeWidth="2" />
                      <line x1="65" y1="85" x2="65" y2="60" stroke="#3A5A40" strokeWidth="2" />
                      <circle cx="50" cy="35" r="4" fill="#E5C583" />
                    </svg>
                  </div>

                  {/* Dark Advantages Overlay Panel */}
                  <div className="pro-advantages-panel">
                    <div className="pro-advantages-header">
                      <h4 className="pro-advantages-title">Account Rating</h4>
                      <span 
                        className="pro-advantages-badge cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
                        onClick={() => setShowRatingModal(true)}
                        title="View rating reviews"
                      >
                        ★ 4.8
                      </span>
                    </div>
                    <p 
                      className="pro-advantages-desc cursor-pointer hover:text-[#E4EAE1] transition-colors"
                      onClick={() => setShowRatingModal(true)}
                      title="Click to view tenant reviews"
                    >
                      Based on verified tenant reviews and on-time payouts.
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
                      Join the top-rated landlords on Lodale.
                    </p>
                  </div>
                </section>
              </div>

              {/* COLUMN 2: ACTIVITY AND REVENUE STATS */}
              <div className="db-col">
                {/* Activity / Occupancy rate bar chart */}
                <section className="db-card activity-card tour-occupancy">
                  <div className="activity-header">
                    <h3 className="activity-title">Monthly Activity</h3>
                    <span className="activity-badge">Monthly logs</span>
                  </div>

                  <div className="activity-metric">
                    <span className="activity-val">
                      {displayProperties.length === 0 ? "0%" : `${Math.min(100, Math.round((getActiveTenantsCount() / Math.max(1, displayProperties.length)) * 100))}%`}
                    </span>
                    <span className="activity-sub">Occupancy Rate</span>
                  </div>

                  {/* Bar Graph */}
                  <div className="activity-chart-grid">
                    {[
                      { day: "Mon", height: "45%", highlight: false },
                      { day: "Tue", height: "60%", highlight: false },
                      { day: "Wed", height: "35%", highlight: false },
                      { day: "Thu", height: "75%", highlight: false },
                      { day: "Fri", height: "95%", highlight: true }, // Highlighted bar in yellow/green
                      { day: "Sat", height: "50%", highlight: false },
                      { day: "Sun", height: "40%", highlight: false },
                    ].map((bar, index) => (
                      <div key={index} className="activity-bar-col">
                        <div className="activity-bar-container">
                          <div
                            className={`activity-bar-fill ${bar.highlight ? "highlight" : ""}`}
                            style={{ height: bar.height }}
                          />
                        </div>
                        <span className="activity-bar-label">{bar.day}</span>
                      </div>
                    ))}
                  </div>
                </section>

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
                    {displayProperties.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)", fontSize: "13px", fontWeight: "600" }}>
                        No properties registered yet.
                      </div>
                    ) : (
                      displayProperties.map((property) => (
                        <div key={property.id} className="property-mini-item">
                          <div className="property-mini-img">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="property-mini-details">
                            <p className="property-mini-title">{property.title}</p>
                            <p className="property-mini-subtitle">{property.location}</p>
                            <p className="property-mini-price">{property.price}</p>
                          </div>
                          <button
                            onClick={() => navigate(`/dashboard/landlord/properties/${property.id}`)}
                            className="property-mini-btn"
                            title="View details"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              {/* COLUMN 3: VIRTUAL CARD AND DONUT CHART */}
              <div className="db-col">
                {/* Payout Account Visa Mock Card */}
                <section className="db-card vault-card tour-vault">
                  <h3 className="activity-title" style={{ marginBottom: "16px" }}>Payout Account</h3>

                  {/* Visa credit card card elements */}
                  <div className="visa-card-mock">
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
                      <p className="visa-card-amount">₦3,400,000</p>
                    </div>

                    <div className="visa-card-footer">
                      <span>•••• 8802</span>
                      <span>EXP 09/29</span>
                    </div>
                  </div>

                  <div className="leases-legend-row" style={{ fontSize: "12px", borderBottom: "1px solid var(--border-light)", paddingBottom: "8px" }}>
                    <span>Deposits Held</span>
                    <span className="leases-legend-val">₦1,200,000</span>
                  </div>
                  <div className="leases-legend-row" style={{ fontSize: "12px", paddingTop: "8px" }}>
                    <span>Payout Speed</span>
                    <span className="leases-legend-val" style={{ color: "var(--active-pill-bg)" }}>Settled (24h)</span>
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
                      displayRequests.map((req) => (
                        <div key={req.id} className="request-item">
                          <img
                            src={req.avatar}
                            alt={req.tenantName}
                            className="request-tenant-avatar cursor-pointer"
                            onClick={() => setSelectedTenantForDetails(req)}
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&h=64&q=80";
                            }}
                          />
                          <div className="request-content">
                            <div className="request-tenant-info">
                              <span 
                                className="request-tenant-name cursor-pointer hover:underline"
                                onClick={() => setSelectedTenantForDetails(req)}
                              >
                                {req.tenantName}
                              </span>
                              <span className="request-date">{req.date}</span>
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
                      ))
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
            <p className="text-[12.5px] text-ink-400 dark:text-cream-100/70 mb-5">
              Overall score: <strong className="text-ink-900 dark:text-white font-bold">⭐ 4.8 / 5.0</strong> based on 12 verified tenant reviews.
            </p>

            <div className="space-y-4 text-left max-h-[300px] overflow-y-auto pr-1 border-t border-[#E4EAE1] dark:border-white/10 pt-4">
              <div className="border-b border-[#E4EAE1]/60 dark:border-white/5 pb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[13px] font-bold text-ink-900 dark:text-white">Maren Maureen</span>
                  <span className="text-[11px] text-[#D69E2E] font-bold">⭐ 5.0</span>
                </div>
                <p className="text-[12px] text-ink-600 dark:text-cream-100/80 leading-relaxed">
                  "Ada K. is an outstanding landlord. Every maintenance request I submitted was sorted out in less than a day. Super professional and pleasant to deal with."
                </p>
                <span className="text-[10px] text-ink-400 dark:text-cream-100/50">Tenant since Jan 2026 • 2 weeks ago</span>
              </div>

              <div className="border-b border-[#E4EAE1]/60 dark:border-white/5 pb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[13px] font-bold text-ink-900 dark:text-white">Emeka Obi</span>
                  <span className="text-[11px] text-[#D69E2E] font-bold">⭐ 4.0</span>
                </div>
                <p className="text-[12px] text-ink-600 dark:text-cream-100/80 leading-relaxed">
                  "Great landlord, very responsive with repairs. The property and amenities are exactly as advertised. Minor delays in unit key handover at start but overall excellent."
                </p>
                <span className="text-[10px] text-ink-400 dark:text-cream-100/50">Tenant since Jan 2025 • 1 month ago</span>
              </div>

              <div className="pb-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[13px] font-bold text-ink-900 dark:text-white">Ryan Herwinds</span>
                  <span className="text-[11px] text-[#D69E2E] font-bold">⭐ 5.0</span>
                </div>
                <p className="text-[12px] text-ink-600 dark:text-cream-100/80 leading-relaxed">
                  "Very simple onboarding and smooth lease renewal. Ada respects privacy and responds quickly to emergency lock checks."
                </p>
                <span className="text-[10px] text-ink-400 dark:text-cream-100/50">Tenant since 2024 • 3 months ago</span>
              </div>
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
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Landlord profile"
                className="w-full h-full rounded-full border-4 border-[#E4EAE1] dark:border-white/10 object-cover"
              />
              <span className="absolute bottom-0 right-1 bg-green-500 h-4.5 w-4.5 rounded-full border-2 border-white dark:border-[#12221C]" />
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
                <span className="text-ink-900 dark:text-white font-semibold">ada.k@lodale.com</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-ink-400 dark:text-cream-100/70 font-medium">Phone Number</span>
                <span className="text-ink-900 dark:text-white font-semibold">+234 803 456 7890</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-ink-400 dark:text-cream-100/70 font-medium">Account Rating</span>
                <span className="text-ink-900 dark:text-white font-semibold flex items-center gap-1">⭐ 4.9 <span className="text-[11px] text-ink-400 dark:text-cream-100/50 font-normal">(18 reviews)</span></span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-ink-400 dark:text-cream-100/70 font-medium">Member Since</span>
                <span className="text-ink-900 dark:text-white font-semibold">Jan 2026</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-ink-400 dark:text-cream-100/70 font-medium">Total Properties</span>
                <span className="text-ink-900 dark:text-white font-semibold">
                  {(() => {
                    const saved = localStorage.getItem("properties");
                    const allList = saved ? JSON.parse(saved) : LISTINGS;
                    const count = allList.filter(l =>
                      l.landlord?.name?.toLowerCase().includes(username.toLowerCase().split(" ")[0])
                    ).length;
                    return `${count} Units`;
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

    </div>
  );
}
