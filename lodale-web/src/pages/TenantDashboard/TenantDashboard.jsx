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
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Calendar,
  HelpCircle,
  Bell,
  Menu,
  Check,
  CheckCircle2,
  Flame,
  ShieldCheck,
  Award,
  Loader2,
  X
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
import { chatService } from "../../services/chatService";
import { userService } from "../../services/userService";
import { profileService } from "../../services/profileService";
import { reminderService } from "../../services/reminderService";
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
  const tenantReviewsData = ratingService.getTenantReviews(currentUserId, currentUserEmail);
  const scoreVal = Number(tenantReviewsData.rating) || 0;

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
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);

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
      const [leasesRes, invsRes, reqsRes] = await Promise.all([
        leaseService.getMyLeases().catch(() => []),
        rentService.getMyInvoices().catch(() => []),
        maintenanceService.getMyRequests().catch(() => [])
      ]);

      const leases = Array.isArray(leasesRes) ? leasesRes : [];
      const active = leases.find(l => l.status === 'active' || l.tenant_signed_at || l.status === 'draft' || l.status === 'pending_tenant');
      if (active) {
        setActiveLease({
          ...active,
          propertyTitle: active.property_title,
          unit: "Unit 1",
          landlord: active.landlord_name,
          price: `₦${parseFloat(active.rent_amount).toLocaleString()}`
        });
        setRentCycle(active.rent_period === "annually" || active.rent_period === "yearly" ? "yearly" : "monthly");
      } else {
        setActiveLease(null);
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
        category: r.priority === 'emergency' ? 'Emergency' : 'Routine',
        urgency: r.priority ? r.priority.charAt(0).toUpperCase() + r.priority.slice(1) : 'Medium',
        details: r.description && r.description !== "No description provided." ? r.description : r.title,
        status: statusMap[r.status?.toLowerCase()] || 'Pending',
        date: new Date(r.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' }),
        tenantName: r.tenant_name,
      })));
    } catch (err) {
      console.error("Failed to load tenant dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAllData();
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
    return "";
  };

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
                { icon: FileText, label: "Applications", idx: 4 }
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
          <div className="bg-white dark:bg-[#07130D] border border-ink-100 dark:border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
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
                  }}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-[#07130D] dark:hover:bg-[#253930] text-ink-900 dark:text-white py-3.5 font-bold text-[13px] rounded-xl transition-colors"
                >
                  Clear All
                </Button>
              )}
              <Button
                onClick={() => {
                  setShowNotificationsModal(false);
                  const updated = notifications.map(n => ({ ...n, read: true }));
                  setNotifications(updated);
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
        <div className="tenant-modal-backdrop" onClick={() => setShowPayModal(false)}>
          <div className="tenant-modal-content rounded-3xl p-6 md:p-8 max-w-lg w-full bg-white dark:bg-[#14221B] border border-[#E1EAE5] dark:border-white/10 shadow-2xl text-left" onClick={e => e.stopPropagation()}>
            {payingState === "idle" && (
              <>
                <div className="modal-header flex items-center justify-between pb-4 border-b border-[#E1EAE5] dark:border-white/10 mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-[#1C1917] dark:text-white">Secure Rent Payment System</h3>
                    <p className="text-xs text-[#71717A] dark:text-white/60">Verified Lodale Property Dues</p>
                  </div>
                  <button className="close-btn text-2xl font-bold text-[#71717A] hover:text-[#1C1917] dark:hover:text-white" onClick={() => setShowPayModal(false)}>&times;</button>
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
                    className="w-full py-3.5 bg-[#1E3324] hover:bg-[#0B1510] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer mt-2"
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
        <div className="tenant-modal-backdrop" onClick={() => { setShowTicketModal(false); setSelectedTicket(null); }}>
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
              <button className="close-btn text-ink-400 hover:text-ink-900 dark:hover:text-white text-xl font-bold" onClick={() => setShowStreakModal(false)}>&times;</button>
            </div>

            <div className="py-4 space-y-4">
              {/* Fiery Animated Hero Banner */}
              {(() => {
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
            <div className="sidebar-logo-mark mb-6 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/explore")} title="Go to Public Guest Dashboard">
              <LogoMark className="h-9 w-9" />
            </div>

            <div className="tenant-sidebar-nav">
              {[
                { icon: LayoutDashboard, label: "Dashboard home" },
                { icon: Search, label: "Search" },
                { icon: MessageSquare, label: "Chat" },
                { icon: Settings, label: "Settings" },
                { icon: FileText, label: "Applications" }
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
          <main className="db-main-content p-0 h-full overflow-y-auto" ref={mainContentRef} style={{ padding: 0 }}>

            {/* TOP HEADER BAR (Green Block) */}
            <div className="tour-welcome bg-[#1E3324] text-white px-6 md:px-8 pt-8 pb-10 rounded-[40px] m-4 md:m-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shadow-sm relative z-10">
              <div>
                <div className="text-[10px] font-bold text-[#E5C583] uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                  <span>Home Page</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                  <span>Dashboard</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold font-serif">
                  Welcome, {firstName}!
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-white/10 dark:bg-[#14221B] px-4 py-2.5 rounded-2xl border border-white/20 dark:border-white/5 shadow-inner">
                  <Calendar className="h-4 w-4 text-[#E5C583]" />
                  <span className="text-xs font-bold">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                </div>
                <button className="h-10 w-10 rounded-full bg-white/10 dark:bg-[#14221B] flex items-center justify-center hover:bg-[#E5C583] hover:text-[#09090b] transition-colors border border-white/20 dark:border-white/5 shadow-inner shrink-0">
                  <Bell className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setActiveTab(2)}
                  className="h-10 w-10 rounded-full bg-white/10 dark:bg-[#14221B] flex items-center justify-center hover:bg-[#E5C583] hover:text-[#09090b] transition-colors border border-white/20 dark:border-white/5 shadow-inner shrink-0"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="h-10 w-10 rounded-full bg-white/10 dark:bg-[#14221B] flex items-center justify-center hover:bg-[#E5C583] hover:text-[#09090b] transition-colors border border-white/20 dark:border-white/5 shadow-inner shrink-0"
                >
                  <User className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* MAIN 3-COLUMN MASONRY GRID */}
            <div className="px-4 md:px-6 lg:px-8 pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">

                {/* COLUMN 1 */}
                <div className="flex flex-col gap-6">

                  {/* Current Property */}
                  <div className="tour-property bg-[#F8FAF9] dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-[40px] p-6 md:p-8 text-[#1C1917] dark:text-white flex flex-col shadow-sm relative overflow-hidden transition-colors">
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <h3 className="font-bold text-lg md:text-xl tracking-tight">Current Property</h3>
                      <Building2 className="h-6 w-6 text-[#1C1917]/30 dark:text-white/60" />
                    </div>

                    <div className="bg-gradient-to-t from-stone-200 to-stone-100 dark:from-[#0B1510] dark:to-[#121F1A] rounded-3xl h-40 w-full mb-8 flex items-center justify-center relative overflow-hidden border border-black/5 dark:border-white/5 shadow-inner">
                      {activeLease?.property_images && activeLease.property_images.length > 0 ? (
                        <img 
                          src={activeLease.property_images[0]} 
                          alt={activeLease.propertyTitle || "Property"} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-end justify-center px-4 gap-3 w-full h-full relative z-10">
                          <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
                          <div className="w-10 bg-white/10 h-16 rounded-t-sm relative z-10"></div>
                          <div className="w-10 bg-white/20 h-28 rounded-t-sm relative z-10"></div>
                          <div className="w-10 bg-white/10 h-14 rounded-t-sm relative z-10"></div>
                          <div className="w-10 bg-white/20 h-24 rounded-t-sm relative z-10"></div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold mb-1 tracking-tight">{activeLease?.property_title || activeLease?.propertyTitle || activeLease?.title || "No Active Lease"}</h2>
                        <p className="text-sm text-[#71717A] dark:text-white/60 font-medium">{activeLease?.unit || "Unit -"}</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#1C1917] dark:text-white bg-white dark:bg-[#0B1510] px-3.5 py-2 rounded-full uppercase tracking-widest border border-black/5 dark:border-white/10 shadow-sm">
                        {activeLease ? "Leased" : "Vacant"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8 pt-6 border-t border-black/5 dark:border-white/5 relative z-10">
                      <div>
                        <p className="text-[10px] text-[#71717A] dark:text-white/50 uppercase font-bold tracking-widest mb-1.5">Landlord</p>
                        <p className="text-sm font-bold uppercase">{activeLease?.landlord_name || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#71717A] dark:text-white/50 uppercase font-bold tracking-widest mb-1.5">Monthly Rent</p>
                        <p className="text-sm font-bold">₦{activeLease?.rent_amount ? parseFloat(activeLease.rent_amount).toLocaleString() : "0"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#71717A] dark:text-white/50 uppercase font-bold tracking-widest mb-1.5">Lease Start</p>
                        <p className="text-sm font-bold">{activeLease?.start_date ? new Date(activeLease.start_date).toLocaleDateString('en-GB') : "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#71717A] dark:text-white/50 uppercase font-bold tracking-widest mb-1.5">Lease End</p>
                        <p className="text-sm font-bold">{activeLease?.end_date ? new Date(activeLease.end_date).toLocaleDateString('en-GB') : "-"}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (activeLease) {
                          sessionStorage.setItem("activeChatPartnerId", activeLease.landlord_id);
                          sessionStorage.setItem("activeChatLandlordName", activeLease.landlord_name);
                          setActiveTab(2);
                        }
                      }}
                      className="w-full py-4 bg-[#1E3324] hover:bg-[#0B1510] text-white dark:bg-[#E5C583] dark:hover:bg-[#D4B575] dark:text-[#09090b] font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm relative z-10"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Chat with Landlord
                    </button>
                  </div>

                  {/* Residency Streak */}
                  <div className="pro-card bg-[#F8FAF9] dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-[40px] p-6 text-[#1C1917] dark:text-white flex items-center justify-between cursor-pointer hover:border-[#E5C583]/50 transition-colors shadow-sm" onClick={() => setShowStreakModal(true)}>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-[#E5C583]/10 flex items-center justify-center shrink-0">
                        <Flame className="h-6 w-6 text-[#E5C583]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl font-bold tracking-tight">{activeLease ? daysInHouse : 0} Days</span>
                          <span className="text-[10px] font-bold text-[#E5C583] uppercase tracking-widest flex items-center gap-1">Streak</span>
                        </div>
                        <p className="text-[11px] text-[#71717A] dark:text-white/60 font-medium">Days living in property</p>
                      </div>
                    </div>
                    <button className="h-10 w-10 rounded-full bg-white dark:bg-[#0B1510] flex items-center justify-center hover:bg-[#E5C583] hover:text-[#09090b] transition-colors border border-black/5 dark:border-white/5 shrink-0 shadow-sm">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                </div>

                {/* COLUMN 2 */}
                <div className="flex flex-col gap-6">

                  {/* Maintenance */}
                  <div className="bg-[#F8FAF9] dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-[40px] p-6 md:p-8 text-[#1C1917] dark:text-white flex flex-col shadow-sm transition-colors relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <h3 className="font-bold text-lg md:text-xl tracking-tight">Maintenance</h3>
                      <span className="text-[10px] font-bold text-[#71717A] dark:text-white/60 uppercase tracking-widest">{requests.filter(r => r.status !== 'Completed').length} Active</span>
                    </div>

                    <div className="tour-tracker flex-1 space-y-6 mb-8 relative z-10">
                      {requests.length > 0 ? (
                        requests.slice(0, 2).map((r, i) => (
                          <div key={i} className="pb-6 border-b border-black/5 dark:border-white/5 last:border-0 last:pb-0 group cursor-default">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <h4 className="text-[13px] md:text-sm font-bold text-[#1C1917] dark:text-white uppercase leading-snug tracking-tight group-hover:text-emerald-700 dark:group-hover:text-[#E5C583] transition-colors pr-4">{r.title || r.details}</h4>
                              <span className={`px-3 py-1.5 text-[9px] font-bold rounded-xl uppercase tracking-widest shrink-0 border ${r.status === 'Completed'
                                ? 'bg-white dark:bg-[#0B1510] text-[#1C1917] dark:text-white border-black/5 dark:border-white/10 shadow-sm'
                                : 'bg-[#E5C583]/10 text-amber-700 dark:text-[#E5C583] border-[#E5C583]/20 shadow-sm'
                                }`}>
                                {r.status || "Pending"}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#71717A] dark:text-white/50 font-medium">{r.type || "Routine"} • {new Date(r.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 opacity-60">
                          <Wrench className="h-8 w-8 mx-auto mb-3" />
                          <p className="text-[13px] font-bold uppercase tracking-wider">No Requests</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setShowDispatchModal(true)}
                      className="tour-dispatch w-full py-4 mt-auto bg-[#1E3324] hover:bg-[#0B1510] text-white dark:bg-[#E5C583] dark:hover:bg-[#D4B575] dark:text-[#09090b] font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm relative z-10"
                    >
                      <Plus className="h-4 w-4" /> Add Maintenance Request
                    </button>
                  </div>

                  {/* NEW: Days Remaining Stat Card */}
                  <div className="bg-[#F8FAF9] dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-[40px] p-6 text-[#1C1917] dark:text-white flex items-center justify-between shadow-sm transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold tracking-tight">
                          {activeLease && activeLease.end_date
                            ? Math.max(0, Math.ceil((new Date(activeLease.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                            : activeLease ? "365" : "0"}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-[#71717A] dark:text-white/60 uppercase tracking-widest">Days Remaining</p>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-white dark:bg-[#0B1510] border border-black/5 dark:border-white/5 flex items-center justify-center shadow-sm">
                      <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>

                  {/* Reliability Rating */}
                  <div className="bg-[#F8FAF9] dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-[40px] p-6 text-[#1C1917] dark:text-white flex flex-col justify-between cursor-pointer group shadow-sm transition-colors" onClick={() => setShowRatingModal(true)}>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#E5C583]/10 flex items-center justify-center shrink-0">
                          <Award className="h-5 w-5 text-amber-600 dark:text-[#E5C583]" />
                        </div>
                        <h3 className="font-bold text-sm tracking-tight">Reliability Rating</h3>
                      </div>
                      <div className="flex items-center gap-1 text-[#1C1917] dark:text-white font-bold text-sm">
                        ★ {tenantReviewsData.hasReviews ? (Math.round(tenantReviewsData.averageScore * 10) / 10).toFixed(1) : "0.0"}
                      </div>
                    </div>
                    <p className="text-[11px] text-[#71717A] dark:text-white/60 mb-6 font-medium leading-relaxed pr-2">
                      Based on verified landlord checkouts & rental payment punctuality.
                    </p>
                    <div className="w-full py-3.5 bg-white dark:bg-[#0B1510] border border-black/5 dark:border-white/5 rounded-2xl flex items-center justify-between px-5 group-hover:bg-[#E5C583] group-hover:text-[#09090b] transition-colors shadow-sm">
                      <span className="font-bold text-[10px] uppercase tracking-widest">View Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>

                </div>

                {/* COLUMN 3 */}
                <div className="flex flex-col gap-6">

                  {/* Rent Payment (Visa Debit Style) */}
                  {(() => {
                    const baseRent = activeLease?.rent_amount ? parseFloat(activeLease.rent_amount) : 0;
                    const payableAmt = rentCycle === "yearly" ? baseRent * 12 : baseRent;
                    const unpaidInv = invoices.find(i => i.status === 'unpaid');

                    let dueDateStr = "-";
                    let isDue = !!unpaidInv;
                    let displayAmt = unpaidInv ? parseFloat(unpaidInv.amount) : baseRent;

                    if (unpaidInv && unpaidInv.due_date) {
                      dueDateStr = new Date(unpaidInv.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
                    } else if (activeLease && activeLease.start_date) {
                      const startDate = new Date(activeLease.start_date);
                      const now = new Date();
                      let nextDate = new Date(startDate);

                      if (activeLease.rent_cycle === 'yearly') {
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                      } else {
                        nextDate.setMonth(nextDate.getMonth() + 1);
                      }
                      dueDateStr = nextDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
                    }

                    return (
                      <div className="tour-visa bg-gradient-to-br from-[#192A1F] via-[#1E3324] to-[#2C2719] border border-[#2C4633]/50 rounded-[40px] p-6 md:p-8 text-white flex flex-col relative overflow-hidden shadow-md">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#E5C583]/5 to-[#E5C583]/15 pointer-events-none"></div>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#E5C583]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#E5C583]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

                        <div className="flex items-center justify-between mb-8 relative z-10">
                          <div className="flex items-center gap-2 font-bold text-[10px] tracking-widest uppercase">
                            VISA DEBIT <CreditCard className="h-4 w-4" />
                          </div>
                          <span className={`text-[9px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-widest ${isDue ? 'bg-red-500 text-white' : 'bg-[#E5C583] text-[#09090b] shadow-sm'}`}>
                            {isDue ? "Due" : "Settled"}
                          </span>
                        </div>

                        <div className="mb-10 relative z-10">
                          <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-1.5">Ledger Balance</p>
                          <h2 className="text-3xl md:text-4xl font-black tracking-tight">₦{displayAmt.toLocaleString()}</h2>
                        </div>

                        <div className="w-full mb-8 relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Rent Paid</span>
                            <span className="text-[10px] font-bold text-[#E5C583]">{(!activeLease || isDue) ? "0%" : "100%"}</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#0B1510]/50 rounded-full overflow-hidden border border-white/10 shadow-inner">
                            <div className={`h-full rounded-full transition-all duration-1000 ${(!activeLease || isDue) ? 'w-0' : 'w-full bg-gradient-to-r from-[#D4B575] to-[#E5C583]'}`}></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-2 opacity-60">
                            <span className="h-1.5 w-1.5 rounded-full bg-white block"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-white block"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-white block"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-white block"></span>
                            <span className="text-xs font-mono tracking-widest ml-1">6802</span>
                          </div>
                          <button
                            onClick={() => setShowPayModal(true)}
                            className="text-[10px] font-bold uppercase tracking-widest hover:bg-[#E5C583] hover:text-[#09090b] transition-colors bg-[#0B1510] px-4 py-2.5 rounded-xl border border-[#E5C583]/20 cursor-pointer shadow-sm text-[#E5C583]"
                          >
                            {isDue ? "Pay Now" : dueDateStr}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* NEW: Account Balance Stat Card */}
                  <div className="tour-breakdown bg-[#F8FAF9] dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-[40px] p-6 text-[#1C1917] dark:text-white flex items-center justify-between shadow-sm transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl md:text-2xl font-bold tracking-tight">
                          {invoices.length > 0
                            ? `₦${invoices.filter(i => i.status === 'unpaid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0).toLocaleString()}`
                            : "₦0.00"}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-[#71717A] dark:text-white/60 uppercase tracking-widest">Unpaid Balance</p>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-white dark:bg-[#0B1510] border border-black/5 dark:border-white/5 flex items-center justify-center shadow-sm">
                      <CreditCard className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>

                  {/* Calendar & Reminders */}
                  <div className="bg-[#F8FAF9] dark:bg-[#192A1F] border border-black/5 dark:border-[#2C4633] rounded-[40px] p-6 md:p-8 text-[#1C1917] dark:text-white flex flex-col h-full shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-bold text-lg md:text-xl tracking-tight">Schedule</h3>
                      <button
                        onClick={() => setShowAddReminderForm(!showAddReminderForm)}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#0B1510] text-[#1E3324] dark:text-[#E5C583] hover:bg-emerald-50 dark:hover:bg-[#E5C583] dark:hover:text-[#09090b] transition-colors border border-black/5 dark:border-white/5 shadow-sm"
                        title="Add Reminder"
                      >
                        {showAddReminderForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* View Toggle Pill */}
                    <div className="flex p-1 bg-white dark:bg-[#0B1510] rounded-xl border border-black/5 dark:border-white/5 mb-6 relative z-10 shadow-inner">
                      <button
                        onClick={() => setScheduleView('events')}
                        className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-colors ${scheduleView === 'events' ? 'bg-[#1E3324] text-white dark:bg-[#E5C583] dark:text-[#09090b] shadow-sm' : 'text-[#71717A] dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5'}`}
                      >
                        Events
                      </button>
                      <button
                        onClick={() => setScheduleView('calendar')}
                        className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-colors ${scheduleView === 'calendar' ? 'bg-[#1E3324] text-white dark:bg-[#E5C583] dark:text-[#09090b] shadow-sm' : 'text-[#71717A] dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5'}`}
                      >
                        Calendar
                      </button>
                    </div>

                    {showAddReminderForm && (
                      <div className="p-4 bg-white dark:bg-[#0B1510] rounded-2xl border border-[#E1EAE5] dark:border-white/5 mb-5 space-y-3 shadow-inner relative z-10">
                        <input
                          type="text" placeholder="Title..." value={newReminderTitle} onChange={e => setNewReminderTitle(e.target.value)}
                          className="w-full text-[13px] p-3 rounded-xl border border-[#E1EAE5] dark:border-white/10 bg-[#F9FBFA] dark:bg-[#121F1A] text-[#1C1917] dark:text-white outline-none focus:border-emerald-700 dark:focus:border-[#E5C583] font-medium"
                        />
                        <div className="flex gap-3">
                          <input
                            type="date" value={newReminderDate} onChange={e => setNewReminderDate(e.target.value)}
                            className="flex-1 text-[13px] p-3 rounded-xl border border-[#E1EAE5] dark:border-white/10 bg-[#F9FBFA] dark:bg-[#121F1A] text-[#1C1917] dark:text-white outline-none focus:border-emerald-700 dark:focus:border-[#E5C583] font-medium"
                          />
                          <button onClick={addUserReminder} className="px-5 py-3 bg-[#1E3324] dark:bg-[#E5C583] text-white dark:text-[#09090b] text-[13px] font-bold rounded-xl hover:bg-[#0B1510] dark:hover:bg-white transition-colors">
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    {scheduleView === 'calendar' ? (
                      /* Mini Calendar View */
                      <div className="grid grid-cols-7 gap-1 text-center relative z-10 px-1">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                          <div key={d} className="text-[9px] font-bold text-[#71717A] dark:text-white/50 uppercase tracking-widest py-1.5">{d}</div>
                        ))}
                        {(() => {
                          const today = new Date();
                          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
                          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                          const days = [];
                          for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="p-1"></div>);
                          for (let i = 1; i <= daysInMonth; i++) {
                            const isToday = i === today.getDate();
                            days.push(
                              <div key={i} className={`p-1.5 flex items-center justify-center text-[11px] font-bold rounded-xl transition-colors cursor-default ${isToday ? 'bg-[#1E3324] text-white dark:bg-[#E5C583] dark:text-[#09090b] shadow-md' : 'text-[#1C1917] dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10'}`}>
                                {i}
                              </div>
                            );
                          }
                          return days;
                        })()}
                      </div>
                    ) : (
                      /* Events View */
                      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 max-h-[160px] relative z-10">
                        {(() => {
                          const events = [];
                          const unpaidInv = invoices.find(i => i.status === 'unpaid');
                          if (unpaidInv && unpaidInv.due_date) {
                            const d = new Date(unpaidInv.due_date);
                            events.push({ id: 'sys_rent', date: d, title: "Rent Due", subtitle: `₦${parseFloat(unpaidInv.amount).toLocaleString()}`, sys: true });
                          }
                          userReminders.forEach(r => {
                            events.push({ id: r.id, date: new Date(r.date + "T12:00:00"), title: r.title, subtitle: "Reminder", sys: false });
                          });
                          events.sort((a, b) => a.date - b.date);

                          if (events.length > 0) {
                            return events.slice(0, 2).map(ev => (
                              <div key={ev.id} className="flex items-center gap-4 p-3.5 rounded-2xl bg-white dark:bg-[#0B1510] border border-black/5 dark:border-white/5 group relative overflow-hidden transition-colors hover:border-emerald-700/30 dark:hover:border-[#E5C583]/30 shadow-sm">
                                <div className={`shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center border shadow-sm ${ev.sys ? 'bg-amber-50 dark:bg-[#E5C583]/10 border-amber-200 dark:border-[#E5C583]/20 text-amber-700 dark:text-[#E5C583]' : 'bg-[#F2F7F4] dark:bg-[#192A1F] border-[#E1EAE5] dark:border-white/10 text-[#1C1917] dark:text-white'}`}>
                                  <span className="text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5 opacity-80">{ev.date.toLocaleDateString('en-GB', { month: 'short' })}</span>
                                  <span className="text-base font-black leading-none">{ev.date.getDate()}</span>
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                  <p className="text-[13px] font-bold truncate text-[#1C1917] dark:text-white mb-0.5">{ev.title}</p>
                                  <p className="text-[10px] text-[#71717A] dark:text-white/50 truncate uppercase tracking-wider font-bold">{ev.subtitle}</p>
                                </div>
                                {!ev.sys && (
                                  <button onClick={() => deleteUserReminder(ev.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-xl transition-all shrink-0">
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ));
                          }
                          return (
                            <div className="text-center py-6 opacity-50">
                              <Calendar className="h-8 w-8 mx-auto mb-3" />
                              <p className="text-[11px] font-bold uppercase tracking-wider">No Upcoming Events</p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
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
        ) : (
          /* TAB 5+: UNDER DEVELOPMENT VIEWS */
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

