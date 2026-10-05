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
  User,
  Building2,
  Clock,
  ArrowRight,
  LogOut,
  Sun,
  Moon,
  ListChecks,
  Calendar,
  Bell,
  Menu,
  Check,
  CheckCircle2,
  Flame,
  ShieldCheck,
  Award,
  Star,
  Loader2,
  Trash2,
  BellOff,
  X,
  ChevronRight,
  Home,
  MapPin,
  Receipt,
  Leaf,
  AlertTriangle,
  Filter,
  ArrowLeft,
  Download
} from "lucide-react";
import gsap from "gsap";
import { Logo, LogoMark } from "../../components/Logo";
import Button from "../../components/Button";
import { useTheme } from "../../context/ThemeContext";
import "./TenantDashboard.css";

import TenantSearch from "./TenantSearch";
import TenantChat from "./TenantChat";
import TenantSettings from "./TenantSettings";
import TenantApplications from "./TenantApplications";
import { leaseService } from "../../services/leaseService";
import { ratingService } from "../../services/ratingService";
import { rentService } from "../../services/rentService";
import { maintenanceService } from "../../services/maintenanceService";
import { userService } from "../../services/userService";
import { profileService } from "../../services/profileService";
import { notificationService } from "../../services/notificationService";
import { applicationService } from "../../services/applicationService";
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
  {
    target: ".tour-nav-4",
    title: "Sidebar: Applications",
    content: "Track the status of your property applications and view their outcomes.",
    placement: "right",
    tab: 4
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

const SAMPLE_MAINTENANCE_REQUESTS = [
  {
    id: "maint-101",
    title: "AC Filter Inspection & Replacement",
    category: "Routine",
    urgency: "Medium",
    details: "Seasonal inspection and replacement of primary air conditioning filters in the living area.",
    desc: "Seasonal inspection and replacement of primary air conditioning filters in the living area to ensure optimal airflow and climate control.",
    status: "Completed",
    date: "12 Oct",
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000
  },
  {
    id: "maint-102",
    title: "Kitchen Sink Plumbing Check",
    category: "Plumbing",
    urgency: "Low",
    details: "Checked low water pressure and cleared aerator sediment from kitchen faucet.",
    desc: "Checked low water pressure and cleared aerator sediment from kitchen faucet. Replaced washer seal to prevent future dripping.",
    status: "In Progress",
    date: "28 Sep",
    timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000
  },
  {
    id: "maint-103",
    title: "Electrical Outlet Inspection",
    category: "Electrical",
    urgency: "Low",
    details: "Verified circuit breaker voltage and checked master bedroom outlet grounding.",
    desc: "Verified circuit breaker voltage and checked master bedroom outlet grounding. All sockets tested within safety parameters.",
    status: "Pending",
    date: "15 Sep",
    timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000
  }
];

export default function TenantDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Active navigation tab (0: Dashboard, 1: Search, 2: Chat, 3: Settings, 4: Applications)
  const [activeTab, setActiveTabState] = useState(() => {
    const navInitialTab = location?.state?.initialTab;
    if (typeof navInitialTab === "number") return navInitialTab;
    return 0;
  });

  const [scheduleView, setScheduleView] = useState('events'); // 'calendar' or 'events'

  const setActiveTab = (index) => {
    setActiveTabState(index);
  };

  // Retrieve username with fallback
  const [username, setUsername] = useState(() => {
    return sessionStorage.getItem("tenantUsername") || sessionStorage.getItem("username") || "Tunde";
  });
  const firstName = username.split(" ")[0];

  const currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId");
  const currentUserEmail = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
  const [tenantReviewsData, setTenantReviewsData] = useState({ hasReviews: false, rating: "New", count: 0, reviews: [] });
  const scoreVal = Number(tenantReviewsData.rating) || 0;

  useEffect(() => {
    let isMounted = true;
    const loadRating = async () => {
      const idOrEmail = currentUserId || currentUserEmail;
      if (idOrEmail) {
        try {
          const res = await ratingService.getTenantReviews(currentUserId, currentUserEmail);
          if (isMounted && res) setTenantReviewsData(res);
        } catch (e) {}
      }
    };
    loadRating();
    window.addEventListener("tenantRatingUpdated", loadRating);
    return () => {
      isMounted = false;
      window.removeEventListener("tenantRatingUpdated", loadRating);
    };
  }, [currentUserId, currentUserEmail]);

  // Re-fetch fresh profile from backend on reload instead of trusting stale sessionStorage
  useEffect(() => {
    let isMounted = true;
    const syncFreshProfile = async () => {
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
            setTenantAvatar(profile.avatar_url);
            sessionStorage.setItem("tenantAvatarUrl", profile.avatar_url);
          }
          const merged = { ...profile, ...(roleProfile || {}) };
          sessionStorage.setItem("currentUserProfile", JSON.stringify(merged));
          sessionStorage.setItem("tenantCurrentProfile", JSON.stringify(merged));
        }
      } catch (err) {}
    };
    syncFreshProfile();
  }, []);

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

  // Tenant avatar state
  const [tenantAvatar, setTenantAvatar] = useState(() => {
    return sessionStorage.getItem("tenantAvatarUrl") || "";
  });

  useEffect(() => {
    const handleStorageUpdate = (e) => {
      const storedName = sessionStorage.getItem("tenantUsername") || sessionStorage.getItem("username");
      if (storedName) {
        setUsername(storedName);
      }
      const updatedAvatar = sessionStorage.getItem("tenantAvatarUrl");
      if (updatedAvatar) {
        setTenantAvatar(updatedAvatar);
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
  const [notifications, setNotifications] = useState([]);

  const [activeLease, setActiveLease] = useState(null);
  const [requests, setRequests] = useState([]);

  const allMaintenanceHistory = requests && requests.length > 0
    ? (requests.length < 3
        ? [...requests, ...SAMPLE_MAINTENANCE_REQUESTS.filter(s => !requests.some(r => r.id === s.id))].slice(0, Math.max(3, requests.length))
        : requests)
    : SAMPLE_MAINTENANCE_REQUESTS;
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Nudge states and functions
  const [nudgeCooldowns, setNudgeCooldowns] = useState({});

  const handleNudgeLandlord = (ticket) => {
    triggerToast(`Follow-up reminder sent to landlord for Ticket #${ticket.id || ticket.title}!`, "success");
    setNudgeCooldowns(prev => ({ ...prev, [ticket.id]: Date.now() }));
  };

  const getTicketNudgeStatus = (ticket) => {
    if (!ticket) return { allowed: false, reason: "" };
    if (["completed", "resolved"].includes(ticket.status.toLowerCase())) return { allowed: false, reason: "Ticket is already resolved." };

    const lastNudge = nudgeCooldowns[ticket.id];
    if (lastNudge && (Date.now() - lastNudge) < 24 * 60 * 60 * 1000) {
      return { allowed: false, reason: "You recently sent a reminder. Please wait 24h." };
    }

    const hoursSince = ticket.timestamp ? (Date.now() - ticket.timestamp) / (1000 * 60 * 60) : 25; // Default allowing if old
    const isPending = ticket.status.toLowerCase() === "pending";
    const isInProgress = ticket.status.toLowerCase() === "in progress";

    if (isPending && hoursSince < 24) return { allowed: false, reason: "Please allow 24 hours for the landlord to review." };
    if (isPending && hoursSince >= 24) return { allowed: true, reason: "" };

    if (isInProgress && hoursSince < 72) return { allowed: false, reason: "Work is in progress. Allow 3 days for completion." };
    if (isInProgress && hoursSince >= 72) return { allowed: true, reason: "" };

    return { allowed: false, reason: "" };
  };

  // Reminder management
  const getUserRemindersKey = () => {
    const uid = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId") || "guest";
    return `tenant_reminders_${uid}`;
  };

  const addUserReminder = () => {
    if (!newReminderTitle.trim() || !newReminderDate) {
      triggerToast("Please enter a title and date.", "error");
      return;
    }
    const reminder = {
      id: `rem_${Date.now()}`,
      title: newReminderTitle.trim(),
      date: newReminderDate,
      type: "personal",
      createdAt: new Date().toISOString()
    };
    const updated = [...userReminders, reminder];
    setUserReminders(updated);
    try { localStorage.setItem(getUserRemindersKey(), JSON.stringify(updated)); } catch { }
    setNewReminderTitle("");
    setNewReminderDate("");
    setShowAddReminderForm(false);
    triggerToast(`Reminder set for ${new Date(newReminderDate + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`, "success", "Reminder Added");
  };

  const deleteUserReminder = (id) => {
    const updated = userReminders.filter(r => r.id !== id);
    setUserReminders(updated);
    try { localStorage.setItem(getUserRemindersKey(), JSON.stringify(updated)); } catch { }
  };

  // Rent payment state
  const [rentPaid, setRentPaid] = useState(false);
  const [rentCycle, setRentCycle] = useState("monthly"); // monthly | yearly

  // Quick Request fields
  const [reqTitle, setReqTitle] = useState("");
  const [reqCategory, setReqCategory] = useState("Plumbing");
  const [reqUrgency, setReqUrgency] = useState("Medium");
  const [reqDesc, setReqDesc] = useState("");
  const [reqSelfHandled, setReqSelfHandled] = useState(false);
  const [reqCost, setReqCost] = useState("");

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
  const [showMaintenanceHistoryModal, setShowMaintenanceHistoryModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showPaymentDetailModal, setShowPaymentDetailModal] = useState(false);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);
  const [paymentDateFilter, setPaymentDateFilter] = useState("all"); // 'all' | '30' | '90' | 'year'
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all"); // 'all' | 'paid' | 'unpaid'

  // Calendar & Reminders state
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [showAddReminderForm, setShowAddReminderForm] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderDate, setNewReminderDate] = useState("");
  const [userReminders, setUserReminders] = useState([]);

  const handleDownloadSummary = () => {
    try {
      const tenantEmail = sessionStorage.getItem("lastLoggedInEmail") || "tenant@lodale.com";
      const reportRef = `LODALE-TS-${Math.floor(100000 + Math.random() * 900000)}`;
      const issueDate = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });

      // Construct high-end printable PDF HTML template
      const pdfHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tenancy & Ledger Summary - ${username}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    @page {
      size: A4;
      margin: 15mm;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #07130D;
      margin: 0;
      padding: 24px;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 3px solid #07130D;
      margin-bottom: 24px;
    }
    
    .brand {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #07130D;
    }
    
    .brand span {
      color: #C59A45;
    }
    
    .doc-type {
      text-align: right;
    }
    
    .doc-type h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: #07130D;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .doc-type p {
      margin: 4px 0 0 0;
      font-size: 11px;
      color: #64748B;
      font-weight: 600;
    }
    
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    
    .card {
      background: #F8FAF7;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 16px;
    }
    
    .card-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #07130D;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #CBD5E1;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      margin-bottom: 8px;
    }
    
    .info-row:last-child {
      margin-bottom: 0;
    }
    
    .info-label {
      color: #64748B;
      font-weight: 500;
    }
    
    .info-val {
      font-weight: 700;
      color: #0F172A;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      background: #DCFCE7;
      color: #166534;
    }
    
    section {
      margin-bottom: 24px;
    }
    
    .section-header {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #07130D;
      margin-bottom: 10px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    
    th {
      background: #07130D;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 10px 12px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    th:first-child {
      border-top-left-radius: 8px;
    }
    th:last-child {
      border-top-right-radius: 8px;
    }
    
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #E2E8F0;
      color: #334155;
    }
    
    tr:nth-child(even) td {
      background: #F8FAFC;
    }

    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94A3B8;
    }

    .footer-stamp {
      font-weight: 700;
      color: #07130D;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Lodale<span>.</span></div>
    <div class="doc-type">
      <h2>Tenancy & Ledger Summary</h2>
      <p>Ref: ${reportRef} | Issued: ${issueDate}</p>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-title">Tenant Information</div>
      <div class="info-row"><span class="info-label">Full Name</span><span class="info-val">${username}</span></div>
      <div class="info-row"><span class="info-label">Email Address</span><span class="info-val">${tenantEmail}</span></div>
      <div class="info-row"><span class="info-label">Account Status</span><span class="info-val"><span class="badge">Verified Tenant</span></span></div>
    </div>

    <div class="card">
      <div class="card-title">Active Property & Lease</div>
      <div class="info-row"><span class="info-label">Property</span><span class="info-val">${activeLease ? (activeLease.property_title || activeLease.title || 'Leased Property') : 'No Active Lease'}</span></div>
      <div class="info-row"><span class="info-label">Lease Status</span><span class="info-val">${activeLease ? (activeLease.status || 'Active') : 'N/A'}</span></div>
      <div class="info-row"><span class="info-label">Rent Rate</span><span class="info-val">${activeLease ? formatCurrency(activeLease.rent_amount || activeLease.rent || 0, activeLease.rent_period || 'annually') : 'N/A'}</span></div>
    </div>
  </div>

  <section>
    <div class="section-header">Payment & Rent Ledger History</div>
    <table>
      <thead>
        <tr>
          <th>Invoice / Reference</th>
          <th>Billing Date</th>
          <th>Amount</th>
          <th>Payment Method</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${Array.isArray(invoices) && invoices.length > 0 ? invoices.map(inv => `
          <tr>
            <td><strong>${inv.reference_number || inv.id || "INV"}</strong></td>
            <td>${inv.due_date ? new Date(inv.due_date).toLocaleDateString() : (inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "N/A")}</td>
            <td><strong>${inv.amount ? formatCurrency(inv.amount) : "N/A"}</strong></td>
            <td>${inv.payment_method || "System Transfer"}</td>
            <td><span class="badge">${(inv.status || "Paid").toUpperCase()}</span></td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="5" style="text-align: center; color: #64748B; padding: 16px; font-weight: 500;">No payment invoice records found in system.</td>
          </tr>
        `}
      </tbody>
    </table>
  </section>

  <section>
    <div class="section-header">Maintenance & Repair Requests Summary</div>
    <table>
      <thead>
        <tr>
          <th>Ticket Title</th>
          <th>Priority</th>
          <th>Date Logged</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${Array.isArray(requests) && requests.length > 0 ? requests.map(req => `
          <tr>
            <td><strong>${req.title || 'Maintenance Request'}</strong></td>
            <td>${req.priority || "Medium"}</td>
            <td>${req.created_at ? new Date(req.created_at).toLocaleDateString() : "N/A"}</td>
            <td>${req.status || "Resolved"}</td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="4" style="text-align: center; color: #94A3B8; padding: 16px;">No maintenance requests filed to date.</td>
          </tr>
        `}
      </tbody>
    </table>
  </section>

  <div class="footer">
    <div class="footer-stamp">Verified Official Tenancy Ledger — Lodale Real Estate PMS</div>
    <div>Page 1 of 1</div>
  </div>
</body>
</html>
      `;

      // Trigger browser PDF Print window via invisible iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const docObj = iframe.contentWindow.document;
      docObj.open();
      docObj.write(pdfHTML);
      docObj.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch (e) { }
        }, 1000);
      }, 300);

      triggerToast("Opening PDF export dialog for your summary statement...", "success", "PDF Ready");
    } catch (err) {
      console.error("Failed to generate PDF tenant summary:", err);
      triggerToast("Failed to generate PDF tenancy summary.", "error", "PDF Error");
    }
  };

  // GSAP animation references
  const mainContentRef = useRef(null);

  useEffect(() => {
    const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
    const hasSeenWelcome = localStorage.getItem("hasSeenTenantWelcome_" + emailKey);
    
    if (!hasSeenWelcome && emailKey) {
      setShowWelcomeOverlay(true);
      localStorage.setItem("hasSeenTenantWelcome_" + emailKey, "true");
    } else {
      setShowWelcomeOverlay(false);
    }

    // Listen for resume quick apply to switch back to Search tab
    const handleResumeApply = () => {
      setActiveTab(1);
    };
    window.addEventListener("resumeQuickApply", handleResumeApply);

    // Listen for start tour after profile completion
    const handleStartTour = () => {
      setShowTourAsk(true);
    };
    window.addEventListener("startTenantTour", handleStartTour);

    return () => {
      window.removeEventListener("resumeQuickApply", handleResumeApply);
      window.removeEventListener("startTenantTour", handleStartTour);
    };
  }, []);

  const fetchAllData = async () => {
    try {
      setLoadingData(true);
      const [leasesRes, invsRes, reqsRes, notifsRes, appsRes] = await Promise.all([
        leaseService.getMyLeases().catch(() => []),
        rentService.getMyInvoices().catch(() => []),
        maintenanceService.getMyRequests().catch(() => []),
        notificationService.getMyNotifications().catch(() => []),
        applicationService.getMyApplications().catch(() => [])
      ]);

      const notifs = Array.isArray(notifsRes) ? notifsRes : (notifsRes?.notifications || []);
      setNotifications(notifs);

      const leases = Array.isArray(leasesRes) ? leasesRes : [];
      const active = leases.find(l => l.status === 'active' || l.tenant_signed_at || l.status === 'draft' || l.status === 'pending_tenant');
      if (active) {
        let parsedImages = [];
        if (Array.isArray(active.property_images)) {
          parsedImages = active.property_images;
        } else if (typeof active.property_images === 'string') {
          try {
            const parsed = JSON.parse(active.property_images);
            if (Array.isArray(parsed)) parsedImages = parsed;
            else if (parsed) parsedImages = [parsed];
          } catch (e) {
            if (active.property_images.startsWith('http') || active.property_images.startsWith('data:') || active.property_images.startsWith('/')) {
              parsedImages = [active.property_images];
            }
          }
        }
        if (parsedImages.length === 0 && active.cover_image) {
          parsedImages = [active.cover_image];
        }

        setActiveLease({
          ...active,
          property_images: parsedImages,
          propertyTitle: active.property_title,
          unit: active.unit || "Unit 1",
          landlord: active.landlord_name,
          price: `₦${parseFloat(active.rent_amount).toLocaleString()}`
        });
        setRentCycle(active.rent_period === "annually" || active.rent_period === "yearly" ? "yearly" : "monthly");
      } else {
        const apps = Array.isArray(appsRes) ? appsRes : (appsRes?.applications || []);
        const approvedApp = apps.find(a => (a.status || '').toLowerCase() === 'approved' || (a.status || '').toLowerCase() === 'leased');
        if (approvedApp) {
          let appImages = [];
          if (Array.isArray(approvedApp.property_images)) {
            appImages = approvedApp.property_images;
          } else if (typeof approvedApp.property_images === 'string') {
            try {
              const parsed = JSON.parse(approvedApp.property_images);
              if (Array.isArray(parsed)) appImages = parsed;
              else if (parsed) appImages = [parsed];
            } catch (e) {
              if (approvedApp.property_images.startsWith('http') || approvedApp.property_images.startsWith('data:') || approvedApp.property_images.startsWith('/')) {
                appImages = [approvedApp.property_images];
              }
            }
          }
          if (appImages.length === 0 && approvedApp.cover_image) {
            appImages = [approvedApp.cover_image];
          }

          setActiveLease({
            property_id: approvedApp.propertyId || approvedApp.property_id,
            propertyTitle: approvedApp.propertyTitle || approvedApp.property_title || "Leased Property",
            property_images: appImages,
            unit: "Unit 1",
            landlord_id: approvedApp.landlordId || approvedApp.landlord_id,
            landlord: `${approvedApp.landlordFirstName || ''} ${approvedApp.landlordLastName || ''}`.trim() || "Landlord",
            landlord_name: `${approvedApp.landlordFirstName || ''} ${approvedApp.landlordLastName || ''}`.trim() || "Landlord",
            price: "Approved Tenancy",
            status: "approved"
          });
        } else {
          setActiveLease(null);
        }
      }

      const invs = Array.isArray(invsRes) ? invsRes : [];
      setInvoices(invs);

      const unpaid = invs.find(i => i.status === 'unpaid');
      setRentPaid(!unpaid);

      const formattedPayments = invs
        .filter(i => i.status === 'paid')
        .map(i => ({
          id: i.id,
          month: new Date(i.billing_period_start || i.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          amount: `₦${parseFloat(i.amount).toLocaleString()}`,
          date: new Date(i.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          status: "Paid",
          method: "Simulated"
        }));
      setPayments(formattedPayments);

      const reqs = Array.isArray(reqsRes) ? reqsRes : [];
      const statusMap = {
        open: 'Pending',
        pending: 'Pending',
        acknowledged: 'In Progress',
        in_progress: 'In Progress',
        pending_inspection: 'In Progress',
        resolved: 'Completed',
        closed: 'Completed'
      };
      setRequests(reqs.map(r => ({
        id: r.id,
        title: r.title,
        category: r.priority === 'emergency' ? 'Emergency' : (r.category || 'Routine'),
        urgency: r.priority ? r.priority.charAt(0).toUpperCase() + r.priority.slice(1) : 'Medium',
        details: r.description && r.description !== "No description provided." ? r.description : r.title,
        desc: r.description && r.description !== "No description provided." ? r.description : r.title,
        status: statusMap[r.status?.toLowerCase()] || 'Pending',
        date: new Date(r.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' }),
        tenantName: r.tenant_name,
        timestamp: new Date(r.created_at).getTime()
      })));
    } catch (err) {
      console.error("Failed to load tenant dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Regular polling for real-time notification & interaction updates (every 6 seconds)
    const interval = setInterval(async () => {
      try {
        const notifsRes = await notificationService.getMyNotifications();
        const freshNotifs = Array.isArray(notifsRes) ? notifsRes : (notifsRes?.notifications || []);
        
        setNotifications(prev => {
          const prevIds = new Set(prev.map(p => p.id));
          const newlyAdded = freshNotifs.filter(fn => !prevIds.has(fn.id) && !fn.is_read && !fn.read);
          if (newlyAdded.length > 0) {
            newlyAdded.forEach(n => {
              triggerToast(n.message || n.text || "New notification received", "info", n.title || "New Notification");
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

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  // Load user reminders and check birthday on mount
  useEffect(() => {
    const uid = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId") || "guest";
    try {
      const raw = localStorage.getItem(`tenant_reminders_${uid}`);
      if (raw) setUserReminders(JSON.parse(raw));
    } catch { }

    try {
      const profileRaw = sessionStorage.getItem("tenantCurrentProfile") || "{}";
      const profile = JSON.parse(profileRaw);
      if (profile.date_of_birth || profile.birthday) {
        const bday = new Date(profile.date_of_birth || profile.birthday);
        const today = new Date();
        if (bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate()) {
          setTimeout(() => {
            triggerToast(`Happy Birthday, ${firstName}! Wishing you a wonderful day.`, "success", "Happy Birthday");
          }, 2000);
        }
      }
    } catch { }
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

  const handleTourComplete = (isSkip = false) => {
    setRunTour(false);
    const rawProf = sessionStorage.getItem("tenantCurrentProfile") || sessionStorage.getItem("currentUserProfile");
    let userProf = null;
    try {
      if (rawProf) userProf = JSON.parse(rawProf);
    } catch (e) {}
    
    const completeness = profileService.checkProfileCompleteness(userProf);
    if (!completeness.isComplete) {
      triggerToast(
        `Welcome! Please complete your profile (${completeness.missingFields.join(", ")}) to start applying for properties.`,
        "warning",
        "Profile Incomplete",
        { label: "Go to Settings", onClick: () => setActiveTab(3) }
      );
      sessionStorage.setItem("isNewSignUpProfileComplete", "true");
      setActiveTab(3);
    } else if (!isSkip) {
      triggerToast("Guide completed! Welcome to your Lodale tenant portal.", "success", "Welcome");
    }
  };

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
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!reqTitle.trim()) return;
    if (!activeLease) {
      triggerToast("You need an active lease to submit a maintenance request.", "error");
      return;
    }

    try {
      let finalDesc = reqDesc || reqTitle;
      if (reqSelfHandled) {
        finalDesc += `\n[Tenant Handled] Expense: ₦${reqCost || 0}`;
      }

      await maintenanceService.createRequest({
        propertyId: activeLease.property_id,
        title: reqTitle,
        description: finalDesc,
        priority: reqUrgency.toLowerCase(),
        tenant_handled: reqSelfHandled,
        cost: reqSelfHandled ? reqCost : 0,
        status: reqSelfHandled ? "resolved" : "pending"
      });

      setReqTitle("");
      setReqDesc("");
      setReqSelfHandled(false);
      setReqCost("");
      triggerToast(reqSelfHandled ? `Maintenance expense recorded successfully!` : `Maintenance request for "${reqTitle}" submitted to landlord!`, "success", "Work Order Logged");
      await fetchAllData();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to submit request", "error");
    }
  };

  // Pay rent simulation
  const handlePayRentSubmit = async () => {
    const unpaidInvoice = invoices.find(inv => inv.status === 'unpaid');
    if (!unpaidInvoice) {
      triggerToast("No unpaid invoices found.", "error");
      return;
    }

    setPayingState("processing");
    try {
      await rentService.recordPayment(unpaidInvoice.id, {
        paymentMethod: 'card',
        amount: unpaidInvoice.amount
      });

      setPayingState("success");
      setTimeout(async () => {
        await fetchAllData();
        setShowPayModal(false);
        setPayingState("idle");
      }, 1500);
    } catch (err) {
      console.error(err);
      triggerToast("Payment failed", "error");
      setPayingState("idle");
    }
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
    if (activeTab === 4) return "Applications";
    if (activeTab === 5) return "Payment History";
    return "";
  };

  // Residency streak calculations
  const rawStartDate = activeLease?.start_date || activeLease?.created_at || activeLease?.tenant_signed_at;
  let daysInHouse = 0;
  let monthsInHouse = 0;
  let remainingDays = 0;

  if (activeLease) {
    const startDate = rawStartDate ? new Date(rawStartDate) : new Date(Date.now() - 142 * 86400000);
    const diffMs = Math.max(0, Date.now() - startDate.getTime());
    daysInHouse = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    monthsInHouse = Math.floor(daysInHouse / 30);
    remainingDays = daysInHouse % 30;
  }

  return (
    <div className="tenant-wrapper">
      {/* MOBILE MENU HEADER */}
      <header className="mobile-header md:hidden">
        <Logo />
        <button
          className="mobile-menu-trigger"
          onClick={() => setShowMobileNav(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-[#07130D] dark:text-[#E5C583]" />
        </button>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {showMobileNav && (
        <div className="mobile-nav-overlay md:hidden" onClick={() => setShowMobileNav(false)}>
          <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <Logo />
              <button className="mobile-drawer-close" onClick={() => setShowMobileNav(false)}>
                &times;
              </button>
            </div>

            <nav className="mobile-drawer-nav">
              {[
                { icon: LayoutDashboard, label: "Dashboard home", idx: 0 },
                { icon: Search, label: "Search properties", idx: 1 },
                { icon: MessageSquare, label: "Chat Room", idx: 2 },
                { icon: Settings, label: "Settings & Profile", idx: 3 },
                { icon: FileText, label: "Applications", idx: 4 },
                { icon: Receipt, label: "Payment History", idx: 5 }
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
              <ListChecks className="h-6 w-6 text-[#E5C583]" />
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
              className="w-full bg-[#E5C583] hover:bg-[#D8B672] text-[#09090b] font-bold py-3.5 mt-4 transition-all duration-150 transform hover:scale-[1.01]"
            >
              Get Started
            </Button>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS MODAL */}
      {showNotificationsModal && (
        <div className="tenant-modal-backdrop" onClick={() => setShowNotificationsModal(false)}>
          <div className="bg-white dark:bg-[#07130D] border border-ink-100 dark:border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-ink-100 dark:border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-moss-700 dark:text-[#E5C583]" />
                <h3 className="text-base font-bold text-ink-900 dark:text-white">Notifications</h3>
                {notifications.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#2C4633] text-white dark:bg-[#E5C583] dark:text-[#09090b] rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {notifications.length > 0 && (
                  <button
                    onClick={async () => {
                      try { await notificationService.markAsRead('all'); } catch {}
                      setNotifications([]);
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors cursor-pointer bg-transparent border-none p-0"
                  >
                    Clear All
                  </button>
                )}
                <button 
                  className="close-btn text-ink-600 dark:text-cream-100/80 hover:text-ink-900 dark:hover:text-white text-xl font-bold cursor-pointer bg-transparent border-none p-0" 
                  onClick={() => setShowNotificationsModal(false)}
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
              {notifications.length > 0 ? notifications.map((n, i) => {
                const refType = (n.reference_type || n.type || '').toLowerCase();
                const title = (n.title || '').toLowerCase();
                const isPayment = refType === 'payment' || refType === 'invoice' || title.includes('invoice') || title.includes('payment');
                const isLease = refType === 'lease' || title.includes('lease');
                const isInspection = refType === 'inspection' || title.includes('inspection');
                const isChat = refType === 'chat' || title.includes('message');
                const isUnread = !n.is_read && !n.read;

                const IconComponent = isPayment 
                  ? CreditCard 
                  : isLease 
                    ? ShieldCheck 
                    : isInspection 
                      ? Calendar 
                      : isChat 
                        ? MessageSquare 
                        : CheckCircle2;

                const iconColor = isPayment
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/40'
                  : isLease
                    ? 'text-indigo-700 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-950/40'
                    : isInspection
                      ? 'text-sky-700 dark:text-sky-400 bg-sky-100/60 dark:bg-sky-950/40'
                      : isChat
                        ? 'text-purple-700 dark:text-purple-400 bg-purple-100/60 dark:bg-purple-950/40'
                        : 'text-moss-700 dark:text-[#E5C583] bg-moss-100/60 dark:bg-white/10';

                return (
                  <div 
                    key={n.id || i} 
                    onClick={async () => {
                      if (n.id) {
                        try { await notificationService.markAsRead(n.id); } catch {}
                      }
                      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true, read: true } : item));
                      setShowNotificationsModal(false);

                      if (isChat) {
                        if (n.reference_id) {
                          sessionStorage.setItem("activeChatPartnerId", n.reference_id);
                          localStorage.setItem("activeChatPartnerId", n.reference_id);
                        }
                        setActiveTab(2); // Chat
                      } else if (isInspection || refType === 'application' || title.includes('application')) {
                        setActiveTab(4); // Applications & Inspections
                      } else if (isPayment) {
                        if (activeLease && activeLease.status === 'active') {
                          setActiveTab(0); // Rent & Ledger for active resident
                        } else {
                          setActiveTab(4); // Pre-lease application invoice
                        }
                      } else if (isLease) {
                        setActiveTab(4); // Application & Lease signing
                      } else if (refType === 'maintenance' || title.includes('maintenance')) {
                        setActiveTab(0); // Overview / Maintenance
                      }
                    }}
                    className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 hover:shadow-xs ${isUnread ? 'bg-moss-50/50 dark:bg-[#E5C583]/10 border-moss-200 dark:border-[#E5C583]/20' : 'bg-neutral-50/60 dark:bg-white/5 border-transparent'}`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${iconColor}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="font-bold text-[12.5px] text-ink-900 dark:text-white truncate flex items-center gap-1.5">
                          {isUnread && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>}
                          {n.title || "Notification"}
                        </span>
                      </div>
                      <p className="text-[12px] text-ink-700 dark:text-cream-100/70 font-medium leading-relaxed mt-1">
                        {n.message || n.text || "Notification details"}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-bold text-moss-700 dark:text-[#E5C583]">
                          {isPayment ? "View Invoice & Pay →" : isLease ? "Review Lease →" : isChat ? "Open Chat →" : "View Details →"}
                        </span>
                        <span className="text-[9.5px] text-ink-400 dark:text-cream-100/40">
                          {n.created_at ? new Date(n.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Recently"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          if (n.id) await notificationService.markAsRead(n.id);
                        } catch {}
                        setNotifications(prev => prev.filter(item => item.id !== n.id));
                      }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-ink-400 hover:text-rose-600 dark:hover:text-rose-400 bg-transparent border-none cursor-pointer"
                      title="Dismiss notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                  <div className="p-3 bg-ink-50 dark:bg-white/5 rounded-full text-ink-300 dark:text-cream-100/30">
                    <BellOff className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-[13px] text-ink-900 dark:text-white">All caught up!</h4>
                  <p className="text-[11.5px] text-ink-400 dark:text-cream-100/50 max-w-[220px] leading-normal">
                    You have no new notifications. Any updates from your landlord will appear here.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5">
              <Button
                onClick={async () => {
                  setShowNotificationsModal(false);
                  try {
                    await notificationService.markAsRead('all');
                  } catch (_err) {}
                  setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })));
                }}
                className="w-full bg-[#202020] dark:bg-[#E5C583] text-white dark:text-[#263b33] py-3 font-bold text-[13px] rounded-xl hover:opacity-90 transition-opacity"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MAINTENANCE HISTORY MODAL */}
      {showMaintenanceHistoryModal && (
        <div className="tenant-modal-backdrop" onClick={() => setShowMaintenanceHistoryModal(false)}>
          <div className="bg-white dark:bg-[#07130D] border border-ink-100 dark:border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-ink-100 dark:border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] flex items-center justify-center shrink-0">
                  <Wrench className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink-900 dark:text-white leading-tight">Maintenance History</h3>
                  <p className="text-[11px] text-[#71717A] dark:text-white/50">Full log of repair requests, work orders, and resolution status</p>
                </div>
              </div>
              <button 
                className="close-btn text-ink-600 dark:text-cream-100/80 hover:text-ink-900 dark:hover:text-white text-2xl font-bold cursor-pointer bg-transparent border-none p-0 leading-none" 
                onClick={() => setShowMaintenanceHistoryModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
              {allMaintenanceHistory.length > 0 ? (
                allMaintenanceHistory.map((item, idx) => {
                  const statusKey = (item.status || "pending").toLowerCase();
                  const isDone = statusKey === "completed" || statusKey === "resolved";
                  const isInProg = statusKey === "in progress" || statusKey === "acknowledged";
                  
                  const statusColor = isDone
                    ? "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
                    : isInProg
                      ? "bg-blue-100/80 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/40"
                      : "bg-amber-100/80 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40";

                  const iconBg = isDone
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : isInProg
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-[#E5C583]";

                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => {
                        setSelectedTicket(item);
                        setShowTicketModal(true);
                      }}
                      className="group p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-stone-50 dark:bg-[#0B1510] hover:bg-stone-100/80 dark:hover:bg-[#121F1A] hover:border-[#E5C583]/40 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`h-9 w-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Wrench className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#1C1917] dark:text-white truncate group-hover:text-[#1E3324] dark:group-hover:text-[#E5C583] transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-[#71717A] dark:text-white/60 line-clamp-1 leading-relaxed mt-0.5">
                            {item.details || item.desc || "Maintenance request details."}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#71717A]/80 dark:text-white/40">
                            <span className="font-semibold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
                              {item.category || "General"}
                            </span>
                            <span>•</span>
                            <span>{item.date || "Recent"}</span>
                            {item.urgency && (
                              <>
                                <span>•</span>
                                <span className={`font-semibold ${
                                  item.urgency.toLowerCase() === 'high' 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : item.urgency.toLowerCase() === 'medium'
                                      ? 'text-amber-600 dark:text-[#E5C583]'
                                      : 'text-stone-500 dark:text-stone-400'
                                }`}>
                                  {item.urgency} Priority
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/5">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${statusColor}`}>
                          {item.status || "Pending"}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[#71717A] dark:text-white/40 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-[#71717A] dark:text-white/50">
                  <Wrench className="h-8 w-8 mx-auto mb-2 opacity-40 text-[#71717A] dark:text-white" />
                  <p>No maintenance requests found.</p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-ink-100 dark:border-white/10 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMaintenanceHistoryModal(false);
                  setShowDispatchModal(true);
                }}
                className="flex-1 py-2.5 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                New Request
              </Button>
              <Button
                onClick={() => setShowMaintenanceHistoryModal(false)}
                className="flex-1 bg-[#202020] dark:bg-[#E5C583] text-white dark:text-[#09090b] py-2.5 font-bold text-xs rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* RENT PAYMENT MODAL */}
      {showPayModal && (
        <div className="tenant-modal-backdrop" onClick={() => setShowPayModal(false)}>
          <div className="tenant-modal-content rounded-3xl p-6 md:p-8 max-w-lg w-full bg-white dark:bg-[#14221B] border border-[#E1EAE5] dark:border-white/10 shadow-2xl text-left" onClick={e => e.stopPropagation()}>
            {payingState === "idle" && (
              <>
                <div className="modal-header flex items-center justify-between pb-4 border-b border-[#E1EAE5] dark:border-white/10 mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-[#1C1917] dark:text-white">Secure Rent Payment System</h3>
                    <p className="text-xs text-[#71717A] dark:text-white/60">Verified Lodale Property Dues</p>
                  </div>
                  <button className="close-btn text-2xl font-bold text-ink-600 dark:text-cream-100/80 hover:text-[#1C1917] dark:hover:text-white" onClick={() => setShowPayModal(false)}>&times;</button>
                </div>

                <div className="modal-body space-y-5">
                  {/* Live Payment Breakdown */}
                  {(() => {
                    const baseRent = activeLease?.rent_amount ? parseFloat(activeLease.rent_amount) : 0;
                    const payableAmt = rentCycle === "yearly" ? baseRent * 12 : baseRent;
                    const unpaidInv = invoices.find(i => i.status === "unpaid");
                    let nextDueStr = "—";
                    if (unpaidInv?.due_date) {
                      nextDueStr = new Date(unpaidInv.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                    } else if (activeLease) {
                      const sd = new Date(activeLease.start_date || activeLease.created_at || Date.now());
                      const now = new Date();
                      let nd;
                      if (rentCycle === "yearly") {
                        nd = new Date(now.getFullYear(), sd.getMonth(), sd.getDate());
                        if (nd <= now) nd.setFullYear(nd.getFullYear() + 1);
                      } else {
                        nd = new Date(now.getFullYear(), now.getMonth(), sd.getDate());
                        if (nd <= now) nd.setMonth(nd.getMonth() + 1);
                      }
                      nextDueStr = nd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                    }
                    return (
                      <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#0C1410] border border-[#E1EAE5] dark:border-white/10 space-y-2.5 text-xs">
                        <div className="flex justify-between items-center text-[#71717A] dark:text-white/60">
                          <span>Due Date</span>
                          <span className="font-bold text-[#1C1917] dark:text-white">{nextDueStr}</span>
                        </div>
                        <div className="flex justify-between items-center text-[#71717A] dark:text-white/60">
                          <span>Rent ({rentCycle === "yearly" ? "Annual" : "Monthly"})</span>
                          <span className="font-bold text-[#1C1917] dark:text-white">
                            ₦{payableAmt > 0 ? payableAmt.toLocaleString() : "0"}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-[#E1EAE5] dark:border-white/10 flex justify-between items-center text-sm font-bold text-[#1C1917] dark:text-white">
                          <span>Total Payable</span>
                          <span className="text-[#1E3324] dark:text-[#E5C583] text-base">
                            ₦{payableAmt > 0 ? payableAmt.toLocaleString() : "0"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <Button
                    onClick={handlePayRentSubmit}
                    className="w-full py-3.5 bg-[#1E3324] hover:bg-[#0B1510] text-white dark:bg-[#E5C583] dark:hover:bg-[#D4B575] dark:text-[#09090b] font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer mt-2"
                  >
                    {(() => {
                      const base = activeLease?.rent_amount ? parseFloat(activeLease.rent_amount) : 0;
                      const amt = rentCycle === "yearly" ? base * 12 : base;
                      return `Authorize Payment${amt > 0 ? ` (₦${amt.toLocaleString()})` : ""}`;
                    })()}
                  </Button>
                </div>
              </>
            )}

            {payingState === "processing" && (
              <div className="py-12 text-center space-y-4">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#2C4633] border-t-transparent dark:border-[#E5C583]"></div>
                <h4 className="font-bold text-base text-[#1C1917] dark:text-white">Processing Rent Payment</h4>
                <p className="text-xs text-[#71717A] dark:text-white/60">Connecting to bank payment gateway. Please hold on...</p>
              </div>
            )}

            {payingState === "success" && (
              <div className="py-10 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-lg text-emerald-700 dark:text-emerald-400">Payment Successful!</h4>
                <p className="text-xs text-[#71717A] dark:text-white/70">Rent payment recorded. Verified receipt has been added to your ledger.</p>
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
              <div className="db-avatar flex items-center justify-center bg-moss-100/70 dark:bg-[#07130D] text-moss-700 dark:text-[#E5C583] overflow-hidden rounded-full border-2 border-[#07130D]/20 dark:border-[#E5C583]/30" style={{ width: "64px", height: "64px", marginBottom: "12px" }}>
                {tenantAvatar ? (
                  <img src={tenantAvatar} alt="Tenant Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-7 w-7 text-[#07130D] dark:text-[#E5C583]" />
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
                    className="bg-cream-50 dark:bg-[#07130D] border border-ink-200 dark:border-white/10 rounded px-2 py-1 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 text-right w-1/2"
                    placeholder="+234..."
                  />
                ) : (
                  <span className="text-[13px] font-bold">
                    {(() => {
                      try {
                        const raw = sessionStorage.getItem("tenantCurrentProfile") || "{}";
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
                    className="bg-cream-50 dark:bg-[#07130D] border border-ink-200 dark:border-white/10 rounded px-2 py-1 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 text-right w-1/2"
                    placeholder="e.g. Engineer"
                  />
                ) : (
                  <span className="text-[13px] font-bold">
                    {(() => {
                      try {
                        const raw = sessionStorage.getItem("tenantCurrentProfile") || "{}";
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
                    className="bg-cream-50 dark:bg-[#07130D] border border-ink-200 dark:border-white/10 rounded px-2 py-1 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 text-right w-1/2"
                    placeholder="e.g. ₦400,000"
                  />
                ) : (
                  <span className="text-[13px] font-bold">
                    {(() => {
                      try {
                        const raw = sessionStorage.getItem("tenantCurrentProfile") || "{}";
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
                    onClick={async () => {
                      try {
                        await userService.updateProfile({ phone_number: editPhone });
                        await profileService.updateMyProfile({
                          occupation: editOccupation,
                          monthly_income: editIncome
                        });

                        window.dispatchEvent(new CustomEvent("tenantProfileUpdated", {
                          detail: { phone_number: editPhone, occupation: editOccupation, monthly_income: editIncome }
                        }));
                        window.dispatchEvent(new Event("storage"));
                        setIsEditingProfile(false);
                        triggerToast("Profile updated successfully!", "success", "Profile Saved");
                      } catch (err) {
                        triggerToast("Failed to update profile", "error");
                        console.error(err);
                      }
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
                      const raw = sessionStorage.getItem("tenantCurrentProfile") || "{}";
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
        <div className="tenant-modal-backdrop" style={{ zIndex: 1100 }} onClick={() => { setShowTicketModal(false); setSelectedTicket(null); }}>
          <div className="tenant-modal-content text-left" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Repair Ticket Details</h3>
              <button className="close-btn" onClick={() => { setShowTicketModal(false); setSelectedTicket(null); }}>&times;</button>
            </div>

            <div className="modal-scroll-area">
              {/* Ticket status badge and category */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-[12px] font-bold text-[#6C6E73] dark:text-[#A3BCA7] uppercase tracking-wider bg-neutral-100 dark:bg-[#07130D] px-2.5 py-1 rounded-md">
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

              {/* Nudge Landlord Section */}
              {(() => {
                const { allowed, reason } = getTicketNudgeStatus(selectedTicket);
                if (["completed", "resolved"].includes(selectedTicket.status.toLowerCase())) return null;

                return (
                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/60 group" title={reason}>
                    <Button
                      disabled={!allowed}
                      onClick={() => handleNudgeLandlord(selectedTicket)}
                      className={`w-full py-2.5 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all ${allowed
                        ? 'bg-[#2C4633] text-white hover:bg-moss-700 dark:bg-[#E5C583] dark:text-[#09090b] dark:hover:bg-[#E5C583]/90'
                        : 'bg-neutral-100 text-neutral-400 dark:bg-white/5 dark:text-neutral-500 cursor-not-allowed opacity-80'
                        }`}
                    >
                      <Bell className="w-4 h-4" />
                      Nudge Landlord for Update
                    </Button>
                    {!allowed && reason && (
                      <p className="text-[10px] text-center text-ink-400 dark:text-cream-100/50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {reason}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            <Button
              onClick={() => { setShowTicketModal(false); setSelectedTicket(null); }}
              className="w-full mt-6 bg-[#202020] dark:bg-[#E5C583] text-white dark:text-[#09090b] py-3.5 font-bold text-[13px] rounded-xl"
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
                    {tenantReviewsData.hasReviews ? tenantReviewsData.rating : "New"}
                  </h2>
                  <div className="flex gap-1 mb-2 justify-center">
                    {tenantReviewsData.hasReviews ? (
                      [1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className={s <= Math.round(scoreVal) ? "text-amber-500 text-lg" : "text-neutral-300 dark:text-neutral-700 text-lg"}>★</span>
                      ))
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                        Verified Account
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#6C6E73] dark:text-[#A3BCA7] font-semibold">
                    {tenantReviewsData.hasReviews ? `${tenantReviewsData.count} Landlord Review(s)` : "New Tenant Standing"}
                  </p>
                </div>

                {/* Breakdown cards */}
                <div className="flex flex-col gap-3 mt-4">
                  <div className="invoice-summary" style={{ padding: "16px", gap: "10px" }}>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6C6E73] dark:text-[#A3BCA7]">Rating Score Breakdown</h4>

                    {tenantReviewsData.hasReviews ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[12.5px]">
                          <span>Landlord Reliability Rating</span>
                          <span className="font-bold text-amber-500">★ {tenantReviewsData.rating} / 5.0</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${(scoreVal / 5) * 100}%` }} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-[12px] text-[#6C6E73] dark:text-[#A3BCA7] py-2">
                        No rating history recorded yet. Reliability scores generate automatically as landlords submit reviews for your tenancy.
                      </p>
                    )}
                  </div>

                  {/* History timeline feed */}
                  <div className="mt-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6C6E73] dark:text-[#A3BCA7] mb-3">Verification History & Reviews</h4>

                    <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                      {tenantReviewsData.hasReviews && tenantReviewsData.reviews.length > 0 ? (
                        tenantReviewsData.reviews.map((rev) => (
                          <div key={rev.id} className="p-3 bg-neutral-50 dark:bg-[#07130D]/40 border border-neutral-100 dark:border-neutral-800/40 rounded-xl space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[12px] font-bold text-ink-900 dark:text-white">Verified Landlord</span>
                              <span className="text-[11px] text-amber-500 font-bold">★ {rev.rating}.0</span>
                            </div>
                            {rev.comment && (
                              <p className="text-[11.5px] text-[#6C6E73] dark:text-[#A3BCA7] italic leading-relaxed">
                                "{rev.comment}"
                              </p>
                            )}
                            <div className="flex justify-between items-center text-[10.5px] text-neutral-400 pt-1">
                              <span>Property: {rev.propertyTitle || "Leased Unit"}</span>
                              <span>Would Rent Again: {rev.wouldRentAgain ? "Yes" : "No"}</span>
                            </div>
                          </div>
                        ))
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
                className="w-full mt-6 bg-[#202020] dark:bg-[#E5C583] text-white dark:text-[#09090b] py-3.5 font-bold text-[13px] rounded-xl"
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

              {/* Self-handled toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="selfHandled"
                  checked={reqSelfHandled}
                  onChange={(e) => setReqSelfHandled(e.target.checked)}
                  className="w-4 h-4 text-[#2C4633] dark:text-[#E5C583] bg-white border-gray-300 rounded focus:ring-[#2C4633]"
                />
                <label htmlFor="selfHandled" className="text-[13px] text-ink-900 dark:text-cream-100 font-bold">
                  I handled this issue myself and want to record the expense.
                </label>
              </div>

              {reqSelfHandled && (
                <div>
                  <label className="form-lbl">Expense Amount (₦)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 15000"
                    value={reqCost}
                    onChange={(e) => setReqCost(e.target.value)}
                    required
                  />
                </div>
              )}

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
                  className="flex-1 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#09090b] py-3 font-bold text-[13px]"
                >
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT DETAIL MODAL */}
      {showPaymentDetailModal && selectedPaymentDetail && (
        <div className="tenant-modal-backdrop" onClick={() => setShowPaymentDetailModal(false)}>
          <div className="tenant-modal-content rounded-3xl p-6 md:p-8 max-w-lg w-full bg-white dark:bg-[#14221B] border border-[#E1EAE5] dark:border-white/10 shadow-2xl text-left" onClick={e => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between pb-4 border-b border-[#E1EAE5] dark:border-white/10 mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] flex items-center justify-center">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1C1917] dark:text-white">Transaction Details</h3>
                  <p className="text-[11px] text-[#71717A] dark:text-white/60">Reference #{selectedPaymentDetail.ref || selectedPaymentDetail.id?.slice(0, 8) || "INV-001"}</p>
                </div>
              </div>
              <button className="close-btn text-2xl font-bold text-ink-600 dark:text-cream-100/80 hover:text-[#1C1917] dark:hover:text-white cursor-pointer bg-transparent border-none p-0" onClick={() => setShowPaymentDetailModal(false)}>&times;</button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#0C1410] border border-[#E1EAE5] dark:border-white/10 space-y-3 text-xs">
                <div className="flex justify-between items-center text-[#71717A] dark:text-white/60">
                  <span>Description</span>
                  <span className="font-bold text-[#1C1917] dark:text-white">{selectedPaymentDetail.description || "Rent Payment"}</span>
                </div>
                <div className="flex justify-between items-center text-[#71717A] dark:text-white/60">
                  <span>Billing Period</span>
                  <span className="font-bold text-[#1C1917] dark:text-white">{selectedPaymentDetail.period || "Current Tenancy"}</span>
                </div>
                <div className="flex justify-between items-center text-[#71717A] dark:text-white/60">
                  <span>Date</span>
                  <span className="font-bold text-[#1C1917] dark:text-white">{selectedPaymentDetail.date || "—"}</span>
                </div>
                <div className="flex justify-between items-center text-[#71717A] dark:text-white/60">
                  <span>Due Date</span>
                  <span className="font-bold text-[#1C1917] dark:text-white">{selectedPaymentDetail.dueDate || "—"}</span>
                </div>
                <div className="flex justify-between items-center text-[#71717A] dark:text-white/60">
                  <span>Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedPaymentDetail.status?.toLowerCase() === 'paid'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                      : selectedPaymentDetail.status?.toLowerCase() === 'overdue'
                      ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                      : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-[#E5C583] border border-amber-200 dark:border-[#E5C583]/30'
                  }`}>
                    {selectedPaymentDetail.status || "Unpaid"}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E1EAE5] dark:border-white/10 flex justify-between items-center text-sm font-bold text-[#1C1917] dark:text-white">
                  <span>Total Amount</span>
                  <span className="text-[#1E3324] dark:text-[#E5C583] text-base font-serif">
                    {selectedPaymentDetail.amountFormatted || selectedPaymentDetail.amount || "₦0"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={handleDownloadSummary}
                  className="flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Summary</span>
                </Button>
                {selectedPaymentDetail.status?.toLowerCase() !== 'paid' ? (
                  <Button
                    onClick={() => {
                      setShowPaymentDetailModal(false);
                      setShowPayModal(true);
                    }}
                    className="flex-1 bg-[#1E3324] hover:bg-[#0B1510] text-white dark:bg-[#E5C583] dark:text-[#09090b] py-3 font-bold text-xs shadow-md cursor-pointer"
                  >
                    Pay Invoice Now
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowPaymentDetailModal(false)}
                    className="flex-1 bg-[#202020] dark:bg-[#E5C583] text-white dark:text-[#09090b] py-3 font-bold text-xs cursor-pointer"
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ON-TIME PAYMENT STREAK CENTER POPUP MODAL WITH ENHANCED FIRE ANIMATION */}
      {showStreakModal && (
        <div className="tenant-modal-backdrop" onClick={() => setShowStreakModal(false)}>
          <div className="tenant-modal-content text-left max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between pb-3 border-b border-ink-100/30 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/15 dark:bg-amber-500/25 text-amber-500">
                  <Flame className="h-5 w-5 fill-amber-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink-900 dark:text-white flex items-center gap-2">
                    Residency Streak Details
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                      <Flame className="h-3 w-3 fill-amber-500 animate-bounce" /> Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-ink-400 dark:text-cream-100/50">Lodale Verified Home Occupancy Ledger</p>
                </div>
              </div>
              <button className="close-btn text-ink-600 dark:text-cream-100/80 hover:text-ink-900 dark:hover:text-white text-xl font-bold" onClick={() => setShowStreakModal(false)}>&times;</button>
            </div>

            <div className="py-4 space-y-4">
              {/* Fiery Animated Hero Banner */}
              {(() => {
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const now = new Date();
                const monthsList = [];

                for (let i = 5; i >= 0; i--) {
                  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                  const mName = monthNames[d.getMonth()];

                  const isPaid = invoices.some(inv => {
                    const invDate = new Date(inv.billing_period_start || inv.created_at);
                    return inv.status === 'paid' && invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear();
                  });

                  const isCurrentMonth = i === 0;
                  const status = isPaid ? "paid" : (isCurrentMonth && activeLease && !rentPaid ? "current" : "upcoming");
                  monthsList.push({ month: mName, status });
                }

                // Determine Tier Level
                let tierTitle = "Bronze Flame Resident";
                let targetDays = 90;
                let prevTarget = 0;
                if (daysInHouse >= 180) {
                  tierTitle = "Diamond Flame Legend";
                  targetDays = 365;
                  prevTarget = 180;
                } else if (daysInHouse >= 90) {
                  tierTitle = "Gold Flame Master";
                  targetDays = 180;
                  prevTarget = 90;
                } else if (daysInHouse >= 30) {
                  tierTitle = "Silver Flame Resident";
                  targetDays = 90;
                  prevTarget = 30;
                }

                const progressPercent = Math.min(100, Math.max(15, Math.round(((daysInHouse - prevTarget) / Math.max(1, targetDays - prevTarget)) * 100)));

                return (
                  <>
                    <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-amber-700/10 border border-amber-500/30 shadow-md">
                      {/* Background Pulsing Fire Glow Backdrop */}
                      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/25 rounded-full blur-2xl animate-pulse pointer-events-none" />

                      <div className="flex items-center justify-between relative z-10">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Flame className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                              Residency Fire Streak
                            </span>
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-ink-900 dark:text-white tracking-tight">
                              {activeLease ? `${daysInHouse} Days` : "0 Days"}
                            </span>
                            {activeLease && (
                              <span className="text-xs font-extrabold text-amber-600 dark:text-amber-300">
                                ({monthsInHouse > 0 ? `${monthsInHouse}m ${remainingDays}d` : `${daysInHouse}d`})
                              </span>
                            )}
                          </div>

                          <p className="text-[11.5px] text-ink-600 dark:text-cream-100/70 mt-1 font-medium">
                            {activeLease
                              ? `Your occupancy flame is active at ${activeLease.propertyTitle || "your home"}.`
                              : "No active lease residency streak record found."}
                          </p>
                        </div>

                        {/* Multi-layered Animated Fire Emblem */}
                        <div className="relative p-3.5 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center shadow-inner">
                          <Flame className="h-9 w-9 fill-amber-500 animate-bounce filter drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                          <Flame className="h-4 w-4 fill-orange-400 text-orange-400 animate-pulse absolute top-1 right-1 opacity-90" />
                        </div>
                      </div>

                      {/* Tier Progress Bar */}
                      <div className="mt-4 pt-3 border-t border-amber-500/20 relative z-10">
                        <div className="flex justify-between items-center text-[11px] font-bold mb-1.5">
                          <span className="text-amber-800 dark:text-amber-300">{tierTitle}</span>
                          <span className="text-ink-500 dark:text-cream-100/60">{daysInHouse}/{targetDays} Days</span>
                        </div>
                        <div className="h-2 w-full bg-amber-500/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${activeLease ? progressPercent : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 6-Month On-Time Rent Flame Grid */}
                    <div className="p-4 rounded-2xl bg-moss-50/50 dark:bg-white/5 border border-moss-200/50 dark:border-white/10">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-bold text-ink-800 dark:text-cream-100 flex items-center gap-1.5">
                          <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> 6-Month Payment Ledger
                        </span>
                        <span className="text-[10.5px] font-semibold text-ink-400 dark:text-cream-100/50">Verified Rent Dues</span>
                      </div>
                      <div className="streak-months-grid">
                        {monthsList.map((m, idx) => (
                          <div key={idx} className={`streak-month-pill ${m.status}`}>
                            <span className="month-lbl">{m.month}</span>
                            <Flame className={`h-4 w-4 ${m.status === 'paid' ? 'text-amber-500 fill-amber-500 animate-pulse' : m.status === 'current' ? 'text-orange-400 fill-orange-400 animate-bounce' : 'text-ink-300 dark:text-white/20'}`} />
                            <span className="text-[9px] font-bold tracking-tight opacity-75">
                              {m.status === 'paid' ? 'Lit' : m.status === 'current' ? 'Due' : 'Upcoming'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Perks & Rewards */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-ink-700 dark:text-cream-100/80">Landlord Rating Boost</span>
                </div>
                <span className="font-extrabold text-amber-700 dark:text-amber-300">{activeLease ? "+150 Pts" : "0 Pts"}</span>
              </div>
            </div>

            <Button
              onClick={() => setShowStreakModal(false)}
              className="w-full mt-2 bg-[#202020] dark:bg-[#E5C583] text-white dark:text-[#09090b] py-3.5 font-bold text-[13px] rounded-xl"
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
            <div className="sidebar-logo-mark mb-5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/explore")} title="Go to Public Guest Dashboard">
              <LogoMark className="h-9 w-9" />
            </div>

            <div className="tenant-sidebar-nav">
              {[
                { icon: LayoutDashboard, label: "Dashboard home" },
                { icon: Search, label: "Search" },
                { icon: MessageSquare, label: "Chat" },
                { icon: Settings, label: "Settings" },
                { icon: FileText, label: "Applications" },
                { icon: Receipt, label: "Payment History" }
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
            <button className="tenant-sidebar-btn theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
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
          <main className="db-main-content p-0 h-full overflow-y-auto" ref={mainContentRef} style={{ padding: 0 }}>

            {/* TOP HEADER BAR */}
            <div className="tour-welcome px-4 md:px-8 pt-6 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-serif text-[#1C1917] dark:text-white flex items-center gap-3">
                  {(() => {
                    const hour = new Date().getHours();
                    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
                    return `${greeting}, ${firstName}`;
                  })()}
                  {loadingData && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-[#E5C583] text-[11px] font-bold animate-pulse shadow-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Syncing...</span>
                    </span>
                  )}
                </h1>
                <p className="text-xs md:text-sm text-[#71717A] dark:text-white/60 mt-1 font-medium">
                  Here's a quick summary of your tenancy and payments.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white dark:bg-[#192A1F] px-3.5 py-2 rounded-xl border border-black/5 dark:border-[#2C4633] shadow-xs text-xs font-semibold text-[#1C1917] dark:text-white">
                  <Calendar className="h-4 w-4 text-[#1E3324] dark:text-[#E5C583]" />
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <button
                  onClick={() => setShowNotificationsModal(true)}
                  className="relative h-9 w-9 rounded-xl bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] flex items-center justify-center hover:border-[#E5C583]/50 transition-colors shadow-xs text-[#1C1917] dark:text-white shrink-0"
                  aria-label="View notifications"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.filter(n => !n.is_read && !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
                      {notifications.filter(n => !n.is_read && !n.read).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab(2)}
                  className="h-9 w-9 rounded-xl bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] flex items-center justify-center hover:border-[#E5C583]/50 transition-colors shadow-xs text-[#1C1917] dark:text-white shrink-0"
                  title="Chat"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="h-9 w-9 rounded-xl bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] flex items-center justify-center hover:border-[#E5C583]/50 transition-colors shadow-xs text-[#1C1917] dark:text-white shrink-0"
                  title="Profile"
                >
                  <User className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* TOP ROW: 4 COMPACT STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 px-4 md:px-8 mt-5 mb-6">
              {/* Stat 1: My Properties */}
              <div className="bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] border border-emerald-200/50 dark:border-emerald-800/30 flex items-center justify-center mb-4">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#71717A] dark:text-white/60 block mb-1">My Properties</span>
                  <h3 className="text-2xl font-bold font-serif text-[#1C1917] dark:text-white mb-1 tracking-tight">
                    {activeLease ? 1 : 0}
                  </h3>
                  <p className="text-[11px] text-[#71717A] dark:text-white/50 font-medium">
                    {activeLease ? "Active tenancy" : "No active tenancy"}
                  </p>
                </div>
              </div>

              {/* Stat 2: Outstanding Balance */}
              {(() => {
                const outstandingBalance = invoices.filter(i => i.status === 'unpaid').reduce((sum, inv) => sum + (parseFloat(inv.grandTotal || inv.amount) || 0), 0);
                return (
                  <div className="tour-breakdown bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] border border-emerald-200/50 dark:border-emerald-800/30 flex items-center justify-center mb-4">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#71717A] dark:text-white/60 block mb-1">Outstanding Balance</span>
                      <h3 className="text-2xl font-bold font-serif text-[#1C1917] dark:text-white mb-1 tracking-tight">
                        ₦ {outstandingBalance.toLocaleString()}
                      </h3>
                      <p className="text-[11px] text-[#71717A] dark:text-white/50 font-medium">
                        {outstandingBalance === 0 ? "You're all caught up!" : "Rent due on ledger"}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Stat 3: Next Rent Due / Overdue */}
              {(() => {
                const unpaidInv = invoices.find(i => i.status === 'unpaid');
                let nextDueDateStr = "--";
                let isOverdue = false;
                if (unpaidInv && (unpaidInv.due_date || unpaidInv.dueDate)) {
                  const dueDateObj = new Date(unpaidInv.due_date || unpaidInv.dueDate);
                  nextDueDateStr = dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  isOverdue = dueDateObj.getTime() < Date.now();
                } else if (activeLease && activeLease.start_date) {
                  const startDate = new Date(activeLease.start_date);
                  let nextDate = new Date(startDate);
                  if (activeLease.rent_cycle === 'yearly' || activeLease.rent_period === 'annually' || activeLease.rent_period === 'yearly') {
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                  } else {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                  }
                  nextDueDateStr = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }

                const propertyLabel = activeLease?.property_title || activeLease?.propertyTitle || "GreenView Apartments";

                return (
                  <div className={`bg-white dark:bg-[#192A1F] border ${isOverdue ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10' : 'border-black/5 dark:border-[#2C4633]'} rounded-2xl p-5 shadow-xs flex flex-col justify-between`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        isOverdue 
                          ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40' 
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] border border-emerald-200/50 dark:border-emerald-800/30'
                      }`}>
                        {isOverdue ? <AlertTriangle className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                      </div>
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                          Overdue
                        </span>
                      )}
                    </div>
                    <div>
                      <span className={`text-xs font-semibold block mb-1 ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-[#71717A] dark:text-white/60'}`}>
                        {isOverdue ? "Rent Overdue" : "Next Rent Due"}
                      </span>
                      <h3 className={`text-2xl font-bold font-serif mb-1 tracking-tight ${isOverdue ? 'text-rose-700 dark:text-rose-300' : 'text-[#1C1917] dark:text-white'}`}>
                        {nextDueDateStr}
                      </h3>
                      <p className="text-[11px] text-[#71717A] dark:text-white/50 font-medium truncate">
                        {activeLease ? (isOverdue ? `Overdue for ${propertyLabel}` : `Rent for ${propertyLabel}`) : "No active tenancy"}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Stat 4: Recent Payments */}
              {(() => {
                const paidInvoices = invoices.filter(i => i.status === 'paid');
                const latestPaid = payments[0] || (paidInvoices.length > 0 ? paidInvoices[0] : null);
                const lastAmt = latestPaid
                  ? (typeof latestPaid.amount === 'string' && latestPaid.amount.startsWith('₦')
                      ? latestPaid.amount
                      : `₦ ${parseFloat(latestPaid.amount || latestPaid.grandTotal || 0).toLocaleString()}`)
                  : (activeLease?.rent_amount ? `₦ ${parseFloat(activeLease.rent_amount).toLocaleString()}` : "₦ 0");

                const lastDate = latestPaid?.date || (latestPaid?.updated_at
                  ? new Date(latestPaid.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : "None");

                return (
                  <div className="bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] border border-emerald-200/50 dark:border-emerald-800/30 flex items-center justify-center mb-4">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#71717A] dark:text-white/60 block mb-1">Recent Payments</span>
                      <h3 className="text-2xl font-bold font-serif text-[#1C1917] dark:text-white mb-1 tracking-tight">
                        {lastAmt}
                      </h3>
                      <p className="text-[11px] text-[#71717A] dark:text-white/50 font-medium truncate">
                        Last payment: {lastDate}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* TWO-COLUMN MAIN SECTION */}
            <div className="px-4 md:px-8 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* LEFT (WIDER) COLUMN */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                  {/* 1. My Property Card */}
                  <div className="tour-property bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-3xl p-6 shadow-xs flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-bold text-lg text-[#1C1917] dark:text-white tracking-tight">My Property</h2>
                      <button
                        onClick={() => setActiveTab(4)}
                        className="text-xs font-bold text-[#1E3324] dark:text-[#E5C583] hover:underline flex items-center gap-1 transition-all cursor-pointer"
                      >
                        View All <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      {/* Property Image */}
                      <div className="w-full sm:w-52 h-44 rounded-2xl bg-stone-100 dark:bg-[#0B1510] border border-black/5 dark:border-white/5 overflow-hidden shrink-0 relative">
                        {activeLease?.property_images && activeLease.property_images.length > 0 && typeof activeLease.property_images[0] === 'string' && (activeLease.property_images[0].startsWith('http') || activeLease.property_images[0].startsWith('data:') || activeLease.property_images[0].startsWith('/')) ? (
                          <img
                            src={activeLease.property_images[0]}
                            alt={activeLease.propertyTitle || "Property"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-[#0B1510] dark:to-[#121F1A]">
                            <Building2 className="h-12 w-12 text-[#1E3324]/30 dark:text-[#E5C583]/30 mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Lodale Living</span>
                          </div>
                        )}
                      </div>

                      {/* Property Information */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-full w-full">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="text-lg md:text-xl font-bold text-[#1C1917] dark:text-white tracking-tight truncate">
                              {activeLease?.property_title || activeLease?.propertyTitle || activeLease?.title || "GreenView Apartments"}
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                              <Check className="h-3 w-3" />
                              {activeLease ? "Active" : "Vacant"}
                            </span>
                          </div>

                          <p className="text-xs text-[#71717A] dark:text-white/60 flex items-center gap-1.5 mb-5 font-medium truncate">
                            <MapPin className="h-3.5 w-3.5 text-[#1E3324] dark:text-[#E5C583] shrink-0" />
                            <span>{activeLease?.address || activeLease?.property_address || activeLease?.location || "12 Lekki Road, Victoria Island, Lagos"}</span>
                          </p>
                        </div>

                        {/* 4 Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-black/5 dark:border-white/5">
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#71717A] dark:text-white/50 mb-1">
                              <Home className="h-3.5 w-3.5" />
                              <span>Unit</span>
                            </div>
                            <p className="text-xs font-bold text-[#1C1917] dark:text-white truncate">
                              {activeLease?.unit || "A3"}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#71717A] dark:text-white/50 mb-1">
                              <Building2 className="h-3.5 w-3.5" />
                              <span>Type</span>
                            </div>
                            <p className="text-xs font-bold text-[#1C1917] dark:text-white truncate">
                              {activeLease?.property_type || activeLease?.type || "2 Bedroom Flat"}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#71717A] dark:text-white/50 mb-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Lease Start</span>
                            </div>
                            <p className="text-xs font-bold text-[#1C1917] dark:text-white truncate">
                              {activeLease?.start_date ? new Date(activeLease.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Jan 1, 2025"}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#71717A] dark:text-white/50 mb-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Lease End</span>
                            </div>
                            <p className="text-xs font-bold text-[#1C1917] dark:text-white truncate">
                              {activeLease?.end_date ? new Date(activeLease.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Dec 31, 2025"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Maintenance History Card */}
                  <div className="bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-3xl p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] flex items-center justify-center shrink-0">
                          <Wrench className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-[#1C1917] dark:text-white tracking-tight">Maintenance History</h3>
                          <p className="text-[11px] text-[#71717A] dark:text-white/50">Track repairs, work orders, and resolution status.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowMaintenanceHistoryModal(true)}
                        className="text-xs font-bold text-[#1E3324] dark:text-[#E5C583] hover:underline flex items-center gap-1 transition-all cursor-pointer"
                      >
                        View All <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {allMaintenanceHistory.slice(0, 3).map((item, idx) => {
                        const statusKey = (item.status || "pending").toLowerCase();
                        const isDone = statusKey === "completed" || statusKey === "resolved";
                        const isInProg = statusKey === "in progress" || statusKey === "acknowledged";

                        const statusBadge = isDone
                          ? "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : isInProg
                            ? "bg-blue-100/80 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            : "bg-amber-100/80 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";

                        const iconBg = isDone
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : isInProg
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-[#E5C583]";

                        return (
                          <div
                            key={item.id || idx}
                            onClick={() => {
                              setSelectedTicket(item);
                              setShowTicketModal(true);
                            }}
                            className="flex flex-col justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-[#0B1510] border border-black/5 dark:border-white/5 hover:border-[#E5C583]/40 cursor-pointer transition-all shadow-xs group"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className={`h-8 w-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                                <Wrench className="h-4 w-4" />
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusBadge}`}>
                                {item.status || "Pending"}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-[#1C1917] dark:text-white truncate mb-1 group-hover:text-[#1E3324] dark:group-hover:text-[#E5C583] transition-colors">
                                {item.title || "Maintenance Request"}
                              </h4>
                              <p className="text-[11px] text-[#71717A] dark:text-white/60 line-clamp-2 leading-relaxed">
                                {item.details || item.desc || "Maintenance check and service."}
                              </p>
                              <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-[#71717A]/80 dark:text-white/40">
                                <span>{item.category || "General"}</span>
                                <span>{item.date || "Recent"}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Schedule & Upcoming Events Card */}
                  <div className="bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-3xl p-5 shadow-xs text-[#1C1917] dark:text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-bold text-base tracking-tight">Schedule & Upcoming Events</h3>
                        <p className="text-[11px] text-[#71717A] dark:text-white/60 font-medium">
                          Track rent due dates, inspection schedules, and personal reminders.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {/* View Toggle Pill */}
                        <div className="flex p-0.5 bg-stone-100 dark:bg-[#0B1510] rounded-xl border border-black/5 dark:border-white/5 shadow-inner">
                          <button
                            onClick={() => setScheduleView('events')}
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                              scheduleView === 'events'
                                ? 'bg-[#1E3324] text-white dark:bg-[#E5C583] dark:text-[#09090b] shadow-xs'
                                : 'text-[#71717A] dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                          >
                            Events
                          </button>
                          <button
                            onClick={() => setScheduleView('calendar')}
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                              scheduleView === 'calendar'
                                ? 'bg-[#1E3324] text-white dark:bg-[#E5C583] dark:text-[#09090b] shadow-xs'
                                : 'text-[#71717A] dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                          >
                            Calendar
                          </button>
                        </div>

                        <button
                          onClick={() => setShowAddReminderForm(!showAddReminderForm)}
                          className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-[#E5C583]/15 text-[#1E3324] dark:text-[#E5C583] hover:bg-emerald-100 dark:hover:bg-[#E5C583]/25 transition-all border border-emerald-200/60 dark:border-[#E5C583]/30 shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                          title={showAddReminderForm ? "Close Form" : "Add Reminder"}
                        >
                          {showAddReminderForm ? (
                            <X className="h-4 w-4 text-[#1E3324] dark:text-[#E5C583]" />
                          ) : (
                            <Plus className="h-4 w-4 text-[#1E3324] dark:text-[#E5C583]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {showAddReminderForm && (
                      <div className="p-3.5 bg-stone-50 dark:bg-[#0B1510] rounded-2xl border border-[#E1EAE5] dark:border-white/5 mb-4 space-y-2.5 shadow-inner">
                        <input
                          type="text"
                          placeholder="Reminder title..."
                          value={newReminderTitle}
                          onChange={e => setNewReminderTitle(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-[#E1EAE5] dark:border-white/10 bg-white dark:bg-[#121F1A] text-[#1C1917] dark:text-white outline-none focus:border-emerald-700 dark:focus:border-[#E5C583] font-medium"
                        />
                        <div className="flex gap-2.5">
                          <input
                            type="date"
                            value={newReminderDate}
                            onChange={e => setNewReminderDate(e.target.value)}
                            className="flex-1 text-xs p-2.5 rounded-xl border border-[#E1EAE5] dark:border-white/10 bg-white dark:bg-[#121F1A] text-[#1C1917] dark:text-white outline-none focus:border-emerald-700 dark:focus:border-[#E5C583] font-medium"
                          />
                          <button
                            onClick={addUserReminder}
                            className="px-4 py-2 bg-[#1E3324] dark:bg-[#E5C583] text-white dark:text-[#09090b] text-xs font-bold rounded-xl hover:bg-[#0B1510] dark:hover:bg-white transition-colors cursor-pointer shadow-xs"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}

                    {scheduleView === 'calendar' ? (
                      /* Mini Calendar View */
                      <div className="grid grid-cols-7 gap-1 text-center px-1 max-w-sm mx-auto">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                          <div key={d} className="text-[9px] font-bold text-[#71717A] dark:text-white/50 uppercase tracking-wider py-1">{d}</div>
                        ))}
                        {(() => {
                          const today = new Date();
                          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
                          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                          const days = [];
                          for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="p-0.5"></div>);
                          for (let i = 1; i <= daysInMonth; i++) {
                            const isToday = i === today.getDate();
                            days.push(
                              <div
                                key={i}
                                className={`p-1.5 flex items-center justify-center text-xs font-bold rounded-lg transition-colors cursor-default ${
                                  isToday
                                    ? 'bg-[#1E3324] text-white dark:bg-[#E5C583] dark:text-[#09090b] shadow-xs'
                                    : 'text-[#1C1917] dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10'
                                }`}
                              >
                                {i}
                              </div>
                            );
                          }
                          return days;
                        })()}
                      </div>
                    ) : (
                      /* Events View */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(() => {
                          const events = [];
                          const unpaidInv = invoices.find(i => i.status === 'unpaid');
                          if (unpaidInv && unpaidInv.due_date) {
                            const d = new Date(unpaidInv.due_date);
                            events.push({ id: 'sys_rent', date: d, title: "Rent Due", subtitle: `₦${parseFloat(unpaidInv.amount).toLocaleString()}`, sys: true });
                          } else if (activeLease && activeLease.start_date) {
                            const startDate = new Date(activeLease.start_date);
                            const nextRentDate = new Date(startDate);
                            if (activeLease.rent_cycle === 'yearly' || activeLease.rent_period === 'annually' || activeLease.rent_period === 'yearly') {
                              nextRentDate.setFullYear(nextRentDate.getFullYear() + 1);
                            } else {
                              nextRentDate.setMonth(nextRentDate.getMonth() + 1);
                            }
                            events.push({ id: 'sys_rent_next', date: nextRentDate, title: "Next Rent Due", subtitle: `₦${parseFloat(activeLease.rent_amount || 0).toLocaleString()}`, sys: true });
                          }
                          userReminders.forEach(r => {
                            events.push({ id: r.id, date: new Date(r.date + "T12:00:00"), title: r.title, subtitle: "Personal Reminder", sys: false });
                          });
                          events.sort((a, b) => a.date - b.date);

                          if (events.length > 0) {
                            return events.map(ev => (
                              <div key={ev.id} className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-[#0B1510] border border-black/5 dark:border-white/5 group relative overflow-hidden transition-colors hover:border-[#E5C583]/40 shadow-xs">
                                <div className={`shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center border shadow-xs ${
                                  ev.sys
                                    ? 'bg-amber-50 dark:bg-[#E5C583]/10 border-amber-200 dark:border-[#E5C583]/20 text-amber-700 dark:text-[#E5C583]'
                                    : 'bg-white dark:bg-[#192A1F] border-black/5 dark:border-white/10 text-[#1C1917] dark:text-white'
                                }`}>
                                  <span className="text-[8px] font-bold uppercase tracking-wider leading-none mb-0.5 opacity-80">{ev.date.toLocaleDateString('en-GB', { month: 'short' })}</span>
                                  <span className="text-sm font-bold leading-none">{ev.date.getDate()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate text-[#1C1917] dark:text-white">{ev.title}</p>
                                  <p className="text-[10px] text-[#71717A] dark:text-white/50 truncate uppercase tracking-wider font-semibold mt-0.5">{ev.subtitle}</p>
                                </div>
                                {!ev.sys && (
                                  <button
                                    onClick={() => deleteUserReminder(ev.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-all shrink-0 cursor-pointer"
                                    title="Delete reminder"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ));
                          }
                          return (
                            <div className="col-span-full text-center py-5 opacity-60">
                              <Calendar className="h-6 w-6 mx-auto mb-1 text-[#71717A] dark:text-white/40" />
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] dark:text-white/60">No Upcoming Events</p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* 4. Motivational Banner */}
                  <div className="bg-[#F4F8F5] dark:bg-[#121F1A] border border-[#2C4633]/15 dark:border-[#2C4633] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-white dark:bg-[#192A1F] border border-black/5 dark:border-white/5 flex items-center justify-center shrink-0 text-[#1E3324] dark:text-[#E5C583] shadow-xs">
                        <Leaf className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1C1917] dark:text-white">A comfortable home, a better you</h4>
                        <span className="text-[10px] font-semibold text-[#1E3324] dark:text-[#E5C583]">Lodale Resident Program</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#71717A] dark:text-white/60 leading-relaxed sm:text-right">
                      Thank you for being a valued tenant. We're here to make your stay easier.
                    </p>
                  </div>

                </div>

                {/* RIGHT (NARROWER) COLUMN */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                  {/* 1. Need to make a payment? CTA Card */}
                  <div className="tour-visa bg-[#F4F8F5] dark:bg-[#121F1A] border border-[#2C4633]/20 dark:border-[#2C4633] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                    <div className="flex items-start gap-3.5 mb-5">
                      <div className="h-11 w-11 rounded-xl bg-white dark:bg-[#192A1F] border border-black/5 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs text-[#1E3324] dark:text-[#E5C583]">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#1C1917] dark:text-white mb-1">Need to make a payment?</h3>
                        <p className="text-xs text-[#71717A] dark:text-white/60 leading-relaxed">Pay your rent and other dues securely in just a few clicks.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPayModal(true)}
                      className="w-full py-3.5 px-4 bg-[#1E3324] hover:bg-[#0B1510] text-white dark:bg-[#E5C583] dark:hover:bg-[#D4B575] dark:text-[#09090b] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Make Payment</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* 2. Quick Actions */}
                  <div className="bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-3xl p-6 shadow-xs">
                    <h3 className="font-bold text-base text-[#1C1917] dark:text-white mb-4 tracking-tight">Quick Actions</h3>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => setActiveTab(5)}
                        className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors text-left group cursor-pointer"
                        title="View Full Payment History & Ledger"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-center shrink-0 text-[#1C1917] dark:text-white group-hover:text-[#E5C583] transition-colors">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-semibold text-[#1C1917] dark:text-white">View Payment History</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#71717A] dark:text-white/40 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      <button
                        onClick={() => setShowDispatchModal(true)}
                        className="tour-dispatch w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-center shrink-0 text-[#1C1917] dark:text-white group-hover:text-[#E5C583] transition-colors">
                            <Wrench className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-semibold text-[#1C1917] dark:text-white">Raise a Maintenance Request</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#71717A] dark:text-white/40 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      <button
                        onClick={() => setShowProfileModal(true)}
                        className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-center shrink-0 text-[#1C1917] dark:text-white group-hover:text-[#E5C583] transition-colors">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-semibold text-[#1C1917] dark:text-white">Update Profile</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#71717A] dark:text-white/40 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      <button
                        onClick={() => {
                          if (activeLease) {
                            sessionStorage.setItem("activeChatPartnerId", activeLease.landlord_id);
                            sessionStorage.setItem("activeChatLandlordName", activeLease.landlord_name);
                          }
                          setActiveTab(2);
                        }}
                        className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-center shrink-0 text-[#1C1917] dark:text-white group-hover:text-[#E5C583] transition-colors">
                            <MessageSquare className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-semibold text-[#1C1917] dark:text-white">Contact Landlord</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#71717A] dark:text-white/40 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* 3. Compact Status Widgets: Residency Streak & Reliability Rating */}
                  <div className="grid grid-cols-2 gap-3.5 pro-card">
                    <div
                      onClick={() => setShowStreakModal(true)}
                      className="bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:border-[#E5C583]/50 transition-all shadow-xs group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-8 w-8 rounded-full bg-[#E5C583]/15 flex items-center justify-center shrink-0">
                          <Flame className="h-4 w-4 text-[#E5C583]" />
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-[#71717A] dark:text-white/40 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] dark:text-white/50 block mb-0.5">Residency Streak</span>
                        <span className="text-base font-bold text-[#1C1917] dark:text-white">{activeLease ? daysInHouse : 0} Days</span>
                      </div>
                    </div>

                    <div
                      onClick={() => setShowRatingModal(true)}
                      className="bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:border-[#E5C583]/50 transition-all shadow-xs group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-8 w-8 rounded-full bg-[#E5C583]/15 flex items-center justify-center shrink-0">
                          <Award className="h-4 w-4 text-amber-600 dark:text-[#E5C583]" />
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-[#71717A] dark:text-white/40 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] dark:text-white/50 block mb-0.5">Reliability Rating</span>
                        <span className="text-base font-bold text-[#1C1917] dark:text-white flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-[#E5C583] text-[#E5C583] shrink-0" />
                          <span>{tenantReviewsData.hasReviews ? (Math.round((Number(tenantReviewsData.averageScore) || Number(tenantReviewsData.rating) || 5) * 10) / 10).toFixed(1) : "5.0"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </main>
        ) : activeTab === 1 ? (
          <TenantSearch
            setActiveTab={setActiveTab}
            setShowProfileModal={setShowProfileModal}
            tenantAvatar={tenantAvatar}
            onStartChat={(landlordName) => {
              sessionStorage.setItem("activeChatLandlordName", landlordName);
              setActiveTab(2);
            }}
          />
        ) : activeTab === 2 ? (
          <main className="db-main-content chat-tab-active">
            <TenantChat setActiveTab={setActiveTab} />
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
        ) : activeTab === 4 ? (
          <main className="db-main-content">
            <TenantApplications setActiveTab={setActiveTab} />
          </main>
        ) : activeTab === 5 ? (
          <main className="db-main-content p-0 h-full overflow-y-auto" style={{ padding: 0 }}>
            <div className="px-4 md:px-8 pt-6 pb-12">
              {/* Top Navigation & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5">
                  <button
                    onClick={() => setActiveTab(0)}
                    className="h-10 w-10 rounded-xl bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] flex items-center justify-center hover:border-[#E5C583]/50 transition-colors shadow-xs text-[#1C1917] dark:text-white cursor-pointer"
                    title="Back to Dashboard"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-serif text-[#1C1917] dark:text-white tracking-tight">
                      Payment History
                    </h1>
                    <p className="text-xs md:text-sm text-[#71717A] dark:text-white/60 mt-0.5 font-medium">
                      Complete transaction ledger for {activeLease?.property_title || activeLease?.propertyTitle || "your property"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleDownloadSummary}
                    variant="secondary"
                    className="flex items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-[#E5C583]" />
                    <span>Download Summary</span>
                  </Button>
                  {invoices.some(i => i.status === 'unpaid') && (
                    <Button
                      onClick={() => setShowPayModal(true)}
                      className="bg-[#1E3324] hover:bg-[#0B1510] text-white dark:bg-[#E5C583] dark:text-[#09090b] py-2.5 px-4 text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                    >
                      Make Payment
                    </Button>
                  )}
                </div>
              </div>

              {/* 3 Metric Summary Cards */}
              {(() => {
                const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (parseFloat(inv.grandTotal || inv.amount) || 0), 0);
                const totalUnpaid = invoices.filter(i => i.status === 'unpaid').reduce((sum, inv) => sum + (parseFloat(inv.grandTotal || inv.amount) || 0), 0);
                const totalInvoices = invoices.length;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-2xl p-5 shadow-xs">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] border border-emerald-200/50 dark:border-emerald-800/30 flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-[#71717A] dark:text-white/60 block mb-1">Total Rent Paid</span>
                      <h3 className="text-2xl font-bold font-serif text-[#1C1917] dark:text-white tracking-tight">
                        ₦ {totalPaid.toLocaleString()}
                      </h3>
                      <p className="text-[11px] text-[#71717A] dark:text-white/50 font-medium mt-1">
                        Settled rent transactions
                      </p>
                    </div>

                    <div className={`bg-white dark:bg-[#192A1F] border ${totalUnpaid > 0 ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10' : 'border-black/5 dark:border-[#2C4633]'} rounded-2xl p-5 shadow-xs`}>
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${totalUnpaid > 0 ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] border border-emerald-200/50 dark:border-emerald-800/30'}`}>
                        {totalUnpaid > 0 ? <AlertTriangle className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                      </div>
                      <span className={`text-xs font-semibold block mb-1 ${totalUnpaid > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#71717A] dark:text-white/60'}`}>
                        Outstanding Dues
                      </span>
                      <h3 className={`text-2xl font-bold font-serif tracking-tight ${totalUnpaid > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-[#1C1917] dark:text-white'}`}>
                        ₦ {totalUnpaid.toLocaleString()}
                      </h3>
                      <p className="text-[11px] text-[#71717A] dark:text-white/50 font-medium mt-1">
                        {totalUnpaid === 0 ? "Ledger is fully balanced" : "Immediate payment required"}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-2xl p-5 shadow-xs">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] border border-emerald-200/50 dark:border-emerald-800/30 flex items-center justify-center mb-3">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-[#71717A] dark:text-white/60 block mb-1">Total Invoices</span>
                      <h3 className="text-2xl font-bold font-serif text-[#1C1917] dark:text-white tracking-tight">
                        {totalInvoices}
                      </h3>
                      <p className="text-[11px] text-[#71717A] dark:text-white/50 font-medium mt-1">
                        Historical billing records
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Filter Toolbar & Ledger Table Card */}
              <div className="bg-white dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-3xl p-6 shadow-xs flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  {/* Status Pills */}
                  <div className="flex p-1 bg-stone-100 dark:bg-[#0B1510] rounded-xl border border-black/5 dark:border-white/5">
                    {[
                      { id: 'all', label: 'All Records' },
                      { id: 'paid', label: 'Paid' },
                      { id: 'unpaid', label: 'Unpaid / Overdue' }
                    ].map(st => (
                      <button
                        key={st.id}
                        onClick={() => setPaymentStatusFilter(st.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          paymentStatusFilter === st.id
                            ? 'bg-[#1E3324] text-white dark:bg-[#E5C583] dark:text-[#09090b] shadow-xs'
                            : 'text-[#71717A] dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Date Range Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-[#71717A] dark:text-white/40" />
                    <span className="text-xs font-semibold text-[#71717A] dark:text-white/60">Range:</span>
                    <select
                      value={paymentDateFilter}
                      onChange={e => setPaymentDateFilter(e.target.value)}
                      className="text-xs font-semibold py-1.5 px-3 rounded-xl border border-black/5 dark:border-white/10 bg-stone-50 dark:bg-[#0B1510] text-[#1C1917] dark:text-white outline-none cursor-pointer"
                    >
                      <option value="all">All Time</option>
                      <option value="30">Last 30 Days</option>
                      <option value="90">Last 90 Days</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>
                </div>

                {/* Ledger Table */}
                {(() => {
                  let ledgerItems = [];
                  if (invoices.length > 0) {
                    ledgerItems = invoices.map((inv, idx) => {
                      const d = inv.billing_period_start || inv.due_date || inv.created_at || inv.updated_at || Date.now();
                      const dateObj = new Date(d);
                      const dueObj = (inv.due_date || inv.dueDate) ? new Date(inv.due_date || inv.dueDate) : null;
                      const isOverdue = inv.status === 'unpaid' && dueObj && dueObj.getTime() < Date.now();
                      const amt = parseFloat(inv.grandTotal || inv.amount || 0);
                      const monthStr = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                      return {
                        id: inv.id || `inv_${idx}`,
                        ref: (inv.id || "").slice(0, 8).toUpperCase(),
                        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        rawDate: dateObj,
                        dueDate: dueObj ? dueObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "—",
                        description: inv.description || inv.title || `Rent Payment (${monthStr})`,
                        period: monthStr,
                        amount: amt,
                        amountFormatted: `₦ ${amt.toLocaleString()}`,
                        status: isOverdue ? 'Overdue' : (inv.status === 'paid' ? 'Paid' : 'Unpaid'),
                        rawStatus: inv.status
                      };
                    });
                  } else if (payments.length > 0) {
                    ledgerItems = payments.map((pmt, idx) => {
                      const amt = typeof pmt.amount === 'string' && pmt.amount.startsWith('₦') ? pmt.amount : `₦ ${parseFloat(pmt.amount || 0).toLocaleString()}`;
                      return {
                        id: pmt.id || `pmt_${idx}`,
                        ref: (pmt.id || `PMT-${idx}`).slice(0, 8).toUpperCase(),
                        date: pmt.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        rawDate: new Date(),
                        dueDate: "—",
                        description: `Rent (${pmt.month || 'Current'})`,
                        period: pmt.month || 'Current',
                        amount: pmt.amount,
                        amountFormatted: amt,
                        status: pmt.status || 'Paid',
                        rawStatus: 'paid'
                      };
                    });
                  }

                  const displayedLedger = ledgerItems.filter(item => {
                    if (paymentStatusFilter === 'paid' && item.rawStatus !== 'paid') return false;
                    if (paymentStatusFilter === 'unpaid' && item.rawStatus !== 'unpaid') return false;

                    if (paymentDateFilter === '30') {
                      const diff = (Date.now() - item.rawDate.getTime()) / (1000 * 3600 * 24);
                      if (diff > 30) return false;
                    } else if (paymentDateFilter === '90') {
                      const diff = (Date.now() - item.rawDate.getTime()) / (1000 * 3600 * 24);
                      if (diff > 90) return false;
                    } else if (paymentDateFilter === 'year') {
                      if (item.rawDate.getFullYear() !== new Date().getFullYear()) return false;
                    }
                    return true;
                  });

                  if (displayedLedger.length === 0) {
                    return (
                      <div className="py-16 text-center">
                        <Receipt className="h-10 w-10 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-[#1C1917] dark:text-white mb-1">No payment records found</h4>
                        <p className="text-xs text-[#71717A] dark:text-white/60 max-w-xs mx-auto">
                          There are no invoices or payments matching your current filter criteria.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-black/5 dark:border-white/5 text-[11px] font-bold text-[#71717A] dark:text-white/50 uppercase tracking-wider">
                            <th className="pb-3 px-3">Date</th>
                            <th className="pb-3 px-3">Reference</th>
                            <th className="pb-3 px-3">Description</th>
                            <th className="pb-3 px-3">Due Date</th>
                            <th className="pb-3 px-3">Amount</th>
                            <th className="pb-3 px-3">Status</th>
                            <th className="pb-3 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                          {displayedLedger.map((row) => (
                            <tr
                              key={row.id}
                              onClick={() => {
                                setSelectedPaymentDetail(row);
                                setShowPaymentDetailModal(true);
                              }}
                              className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                            >
                              <td className="py-3.5 px-3 font-semibold text-[#1C1917] dark:text-white whitespace-nowrap">{row.date}</td>
                              <td className="py-3.5 px-3 font-mono text-[11px] text-[#71717A] dark:text-white/60 whitespace-nowrap">#{row.ref}</td>
                              <td className="py-3.5 px-3 text-[#1C1917] dark:text-white font-medium whitespace-nowrap">{row.description}</td>
                              <td className="py-3.5 px-3 text-[#71717A] dark:text-white/60 whitespace-nowrap">{row.dueDate}</td>
                              <td className="py-3.5 px-3 font-bold text-[#1C1917] dark:text-white whitespace-nowrap">{row.amountFormatted}</td>
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  row.status.toLowerCase() === 'paid'
                                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                                    : row.status.toLowerCase() === 'overdue'
                                    ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-[#E5C583] border border-amber-200 dark:border-[#E5C583]/30'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                <span className="text-xs font-bold text-[#1E3324] dark:text-[#E5C583] group-hover:underline flex items-center justify-end gap-1">
                                  <span>Details</span>
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          </main>
        ) : (
          /* TAB 6+: UNDER DEVELOPMENT VIEWS */
          <div className="under-development-wrapper flex-1 flex items-center justify-center">
            <div className="under-dev-card text-center">
              <div className="sparkle-icon flex justify-center"><ListChecks className="h-6 w-6 text-moss-600 dark:text-[#E5C583]" /></div>
              <span className="tag mb-2 inline-block">Under Development</span>
              <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white mb-2">
                {getTabName()} Section
              </h2>
              <p className="text-[13px] text-muted max-w-sm mb-6 leading-relaxed">
                This page is currently under construction. We will notify you once these tenant features are pushed to production.
              </p>
              <Button onClick={() => setActiveTab(0)} className="dev-home-btn bg-[#202020] dark:bg-[#E5C583] text-white dark:text-[#09090b] font-bold px-6 py-2.5 rounded-xl text-[12.5px]">
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
                  <ListChecks className="h-6 w-6" />
                </div>
                <h3 className="tour-ask-title">Dashboard Onboarding</h3>
                <p className="tour-ask-desc">
                  Welcome to Lodale! Would you like Ayla to take you on a quick interactive guide around your new dashboard?
                </p>
                <div className="tour-ask-buttons">
                  <Button
                    onClick={() => {
                      setShowTourAsk(false);
                      handleTourComplete(true);
                    }}
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
                  <ListChecks className="h-3 w-3 text-white" />
                </div>

                <div className="tour-tooltip-actions">
                  <button
                    type="button"
                    className="tour-btn-skip"
                    onClick={() => handleTourComplete(true)}
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
                          handleTourComplete(false);
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

