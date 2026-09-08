import React, { useState, useEffect } from "react";
import { applicationService } from "../../../services/applicationService";
import { chatService } from "../../../services/chatService";
import { leaseService } from "../../../services/leaseService";
import { invoiceService } from "../../../services/invoiceService";
import { inspectionService } from "../../../services/inspectionService";
import InspectionCalendarModal from "../../../components/InspectionCalendarModal";
import MoveInSetupModal from "../../../components/MoveInSetupModal";
import Avatar from "../../../components/Avatar";
import LeaseBuilderModal from "../../../components/LeaseBuilderModal";
import InvoiceBuilderModal from "../../../components/InvoiceBuilderModal";
import { 
  CheckCircle2, XCircle, FileText, 
  Wallet, ShieldCheck, Mail, Phone, Calendar, 
  MessageSquare, AlertTriangle, Star, Trash2, X, Search, ArrowLeft, ChevronRight, Key, Loader2
} from "lucide-react";
import { triggerToast } from "../../../context/ToastContext";
import { doesIncomeMeetRequirement } from "../../../utils/incomeRanges";

// Helper to resolve and parse tenant details from backend application or storage
const getTenantProfile = (app) => {
  if (!app) return {};
  const t = app.tenant || {};
  const emailKey = (t.email || app.email || '').toLowerCase();
  
  const saved = emailKey ? (sessionStorage.getItem("userProfile_" + emailKey) || localStorage.getItem("userProfile_" + emailKey)) : null;
  const fallback = saved ? JSON.parse(saved) : {};

  const rawIncome = t.incomeRange || t.monthlyIncome || t.monthly_income || app.income || fallback.income || fallback.monthlyIncome || fallback.monthly_income || "Not Provided";
  
  const fName = t.firstName || t.first_name || app.tenant_first_name || fallback.firstName || fallback.first_name || 'Applicant';
  const lName = t.lastName || t.last_name || app.tenant_last_name || fallback.lastName || fallback.last_name || '';

  const occupantsVal = app.occupants ?? app.dependants ?? t.dependants ?? t.number_of_dependants ?? fallback.dependants ?? fallback.number_of_dependants ?? null;
  const petsVal = app.pets ?? app.has_pets ?? t.pets ?? t.has_pets ?? fallback.pets ?? null;
  const carsVal = app.vehicles ?? app.cars ?? app.number_of_cars ?? t.vehicles ?? t.cars ?? fallback.cars ?? null;

  return {
    firstName: fName,
    lastName: lName,
    fullName: `${fName} ${lName}`.trim() || 'Applicant',
    email: t.email || app.email || fallback.email || 'Not Provided',
    phone: t.phone || app.phone || fallback.phone || 'Not Provided',
    avatar: t.avatar || t.avatar_url || fallback.avatar || '',
    incomeRange: typeof rawIncome === 'string' ? rawIncome : (parseFloat(rawIncome) > 0 ? `₦${parseFloat(rawIncome).toLocaleString()} / yr` : 'Not Provided'),
    monthlyIncome: typeof rawIncome === 'number' ? rawIncome : (parseFloat(rawIncome) || 0),
    employmentStatus: t.employmentStatus || t.employment_status || fallback.employmentStatus || fallback.employment_status || 'Not Provided',
    employerName: t.employerName || t.employer_name || fallback.employerName || fallback.employer_name || 'Not Provided',
    occupation: t.occupation || fallback.occupation || 'Not Provided',
    maritalStatus: t.maritalStatus || t.marital_status || fallback.maritalStatus || fallback.marital_status || 'Not Provided',
    dependants: occupantsVal !== null && occupantsVal !== undefined ? String(occupantsVal) : 'Not Provided',
    pets: petsVal !== null && petsVal !== undefined ? (petsVal === true || petsVal === "yes" ? "Yes" : (petsVal === false || petsVal === "no" ? "None" : String(petsVal))) : 'Not Provided',
    cars: carsVal !== null && carsVal !== undefined ? String(carsVal) : 'Not Provided',
    emergencyContact: t.emergencyContact || t.emergency_contact || t.guarantorPhone || app.emergencyContact || fallback.emergencyContact || 'Not Provided',
    currentAddress: t.currentAddress || t.address || app.address || app.propertyTitle || fallback.currentAddress || fallback.address || 'Not Provided',
    guarantorName: t.guarantorName || t.guarantor_name || fallback.guarantorName || fallback.guarantor_name || '',
    guarantorPhone: t.guarantorPhone || t.guarantor_phone || fallback.guarantorPhone || fallback.guarantor_phone || '',
    guarantorRelationship: t.guarantorRelationship || t.guarantor_relationship || fallback.guarantorRelationship || fallback.guarantorRelationship || '',
    guarantorEmail: t.guarantorEmail || t.guarantor_email || fallback.guarantorEmail || fallback.guarantorEmail || '',
    reliabilityScore: parseFloat(t.reliabilityScore || app.reliabilityScore || fallback.reliabilityScore || 0),
    nin_verified: Boolean(t.nin_verified || t.ninVerified || app.nin_verified || app.ninVerified || fallback.nin_verified || fallback.ninVerified),
    moveInDate: app.moveInDate || app.desiredMoveInDate || app.move_in_date || fallback.moveInDate || "Not Provided",
    leaseTerm: app.leaseTerm || app.desiredLeaseTerm || app.lease_duration || fallback.leaseTerm || "Not Provided",
    notes: app.notes || app.message || fallback.notes || "",
    rentalHistory: Array.isArray(app.rentalHistory || t.rentalHistory) ? (app.rentalHistory || t.rentalHistory) : (app.propertyTitle ? [{
      title: app.propertyTitle,
      period: app.leasePeriod || "Applied Property",
      status: app.status || "Pending",
      amount: app.propertyRentAmount ? `₦${parseFloat(app.propertyRentAmount).toLocaleString()}/mo` : null
    }] : []),
    documents: Array.isArray(app.documents || t.documents) ? (app.documents || t.documents) : [
      ...((t.nin_verified || t.ninVerified || app.nin_verified || app.ninVerified) ? [{ name: "National Identity Number (NIN)", status: "Verified Match ✓", type: "NIN" }] : []),
      ...((t.guarantorName || app.guarantorName) ? [{ name: `Guarantor Verification (${t.guarantorName || app.guarantorName})`, status: "Submitted ✓", type: "Guarantor" }] : [])
    ]
  };
};

export default function LandlordApplications({ setActiveTab }) {
  const [applications, setApplications] = useState([]);
  const [viewMode, setViewMode] = useState("list"); // "list" or "detail"
  const [activeApplicantId, setActiveApplicantId] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState("application"); // "application", "evaluation", "history", "documents", "notes"
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const [showReliabilityDetails, setShowReliabilityDetails] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Modal states for actions
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showMoveInModal, setShowMoveInModal] = useState(false);

  // Active stage state cache
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [activeLease, setActiveLease] = useState(null);
  const [activeMoveInRules, setActiveMoveInRules] = useState(null);

  // Request Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [customRequestText, setCustomRequestText] = useState("");

  // Inspection Scheduling Modal State
  const [showScheduleInspectionModal, setShowScheduleInspectionModal] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "10:00 AM",
    location: "",
    notes: ""
  });

  // Lease Setup Modal State
  const [showLeaseSetupModal, setShowLeaseSetupModal] = useState(false);
  const [leaseForm, setLeaseForm] = useState({
    startDate: "",
    duration: "1_year",
    rentAmount: "",
    rentPeriod: "annually",
    securityDeposit: "",
    customClauses: "",
    includePets: false,
    includeSmoking: false,
    includeLateFee: true
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const activeApp = applications.find(a => a.id === activeApplicantId);

  useEffect(() => {
    if (activeApp) {
      loadStageData(activeApp.id);
    }
  }, [activeApplicantId, applications]);

  const loadStageData = async (appId) => {
    try {
      // 1. Load Invoice
      let inv = await invoiceService.getInvoiceByApplicationId(appId);
      if (!inv) {
        const localInv = localStorage.getItem(`appInvoice_${appId}`);
        if (localInv) inv = JSON.parse(localInv);
      }
      setActiveInvoice(inv);

      // 2. Load Lease
      let lse = await leaseService.getLeaseByApplicationId(appId);
      if (!lse) {
        const localLeases = JSON.parse(localStorage.getItem("tenantLeases") || "[]");
        lse = localLeases.find(l => String(l.applicationId || l.application_id) === String(appId)) || null;
      }
      setActiveLease(lse);

      // 3. Load Move-in Rules
      const localRules = localStorage.getItem(`moveInRules_${appId}`);
      setActiveMoveInRules(localRules ? JSON.parse(localRules) : null);

    } catch (err) {
      console.error("Error loading stage data:", err);
    }
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const apps = await applicationService.getLandlordApplications();
      const deletedIds = JSON.parse(localStorage.getItem("deletedLandlordAppIds") || "[]");
      const validApps = (apps || []).filter(app => !deletedIds.includes(String(app.id)));
      setApplications(validApps);
      if (validApps.length > 0 && !activeApplicantId) {
        setActiveApplicantId(validApps[0].id);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to load applications", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (status, reason = null) => {
    if (!activeApplicantId) return;
    setIsSubmitting(true);
    try {
      await applicationService.updateStatus(activeApplicantId, status, reason);
      triggerToast(`Application ${status}`, "success");
      setShowDeclineModal(false);
      setDeclineReason("");
      fetchApplications();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update application", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!activeApp || !activeInvoice) return;
    setIsSubmitting(true);
    try {
      await invoiceService.markInvoiceAsPaid(activeInvoice.id);
      triggerToast("Tenant payment verified and confirmed!", "success", "Payment Verified");
      
      const recipientId = activeApp.tenantId || activeApp.tenant_id || activeApp.tenant?.id;
      if (recipientId) {
        await chatService.sendMessage(recipientId, `[RENT PAYMENT VERIFIED & CONFIRMED]\nInvoice #${activeInvoice.invoiceNumber} has been verified by the landlord. Next step: Drafting & signing your lease agreement.`, activeApp.propertyId);
      }

      fetchApplications();
      if (activeApp.id) loadStageData(activeApp.id);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to verify payment", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (!window.confirm("Are you sure you want to delete this declined application? This action cannot be undone.")) {
      return;
    }
    setIsSubmitting(true);
    try {
      await applicationService.deleteLandlordApplication(appId);
      
      const deletedIds = JSON.parse(localStorage.getItem("deletedLandlordAppIds") || "[]");
      if (!deletedIds.includes(String(appId))) {
        deletedIds.push(String(appId));
        localStorage.setItem("deletedLandlordAppIds", JSON.stringify(deletedIds));
      }

      triggerToast("Application deleted successfully.", "info", "Application Deleted");
      const updated = applications.filter(a => String(a.id) !== String(appId));
      setApplications(updated);
      setViewMode("list");
      if (updated.length > 0) {
        setActiveApplicantId(updated[0].id);
      } else {
        setActiveApplicantId(null);
      }
    } catch (err) {
      console.error("Failed to delete application:", err);
      triggerToast(err.message || "Failed to delete application.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateChat = async (app, initialMessage = null) => {
    try {
      const recipientId = app.tenantId || app.tenant_id || app.tenant?.id;
      if (!recipientId) {
        triggerToast("Unable to resolve applicant recipient ID.", "error");
        return;
      }
      const tProf = getTenantProfile(app);
      const msg = initialMessage || `Hello ${tProf.firstName}, I am reviewing your application for ${app.propertyTitle}.`;
      await chatService.sendMessage(recipientId, msg, app.propertyId, {
        partner_name: tProf.fullName,
        partner_avatar: tProf.avatar || ""
      });
      sessionStorage.setItem("activeChatPartnerId", recipientId);
      localStorage.setItem("activeChatPartnerId", recipientId);
      localStorage.setItem("activeChatTenantName", tProf.fullName);
      triggerToast("Chat initiated with applicant!", "success");
      if (setActiveTab) setActiveTab(3);
    } catch (err) {
      console.error("Initiate chat error:", err);
      triggerToast("Failed to initiate chat", "error");
    }
  };

  const handleSendRequest = async (requestTitle, requestDetails = "") => {
    if (!activeApp) return;
    const recipientId = activeApp.tenantId || activeApp.tenant_id || activeApp.tenant?.id;
    if (!recipientId) {
      triggerToast("Unable to resolve applicant recipient ID.", "error");
      return;
    }
    const tProf = getTenantProfile(activeApp);
    const message = `[LANDLORD REQUEST FOR ${activeApp.propertyTitle}]\nRequesting: ${requestTitle}${requestDetails ? `\nDetails: ${requestDetails}` : ''}\n\nPlease reply or upload the requested documents here.`;
    try {
      await chatService.sendMessage(recipientId, message, activeApp.propertyId, {
        partner_name: tProf.fullName,
        partner_avatar: tProf.avatar || ""
      });
      sessionStorage.setItem("activeChatPartnerId", recipientId);
      localStorage.setItem("activeChatPartnerId", recipientId);
      localStorage.setItem("activeChatTenantName", tProf.fullName);
      triggerToast(`Request sent to ${tProf.firstName}!`, "success");
      setShowRequestModal(false);
      setCustomRequestText("");
      if (setActiveTab) setActiveTab(3);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to send request message", "error");
    }
  };

  const handleScheduleInspection = async (e) => {
    if (e) e.preventDefault();
    if (!activeApp) return;
    setIsSubmitting(true);
    try {
      const tProf = getTenantProfile(activeApp);
      inspectionService.saveInspection(activeApp.id, {
        propertyId: activeApp.propertyId,
        propertyTitle: activeApp.propertyTitle,
        landlordId: activeApp.landlordId || "landlord",
        landlordName: "Landlord",
        tenantId: activeApp.tenantId || activeApp.tenant_id,
        tenantName: tProf.fullName,
        date: inspectionForm.date,
        time: inspectionForm.time,
        location: inspectionForm.location || activeApp.propertyAddress || activeApp.propertyTitle,
        notes: inspectionForm.notes,
        status: "Scheduled",
        createdBy: "landlord"
      });

      const recipientId = activeApp.tenantId || activeApp.tenant_id || activeApp.tenant?.id;
      if (recipientId) {
        const msg = `[INSPECTION SCHEDULED FOR ${activeApp.propertyTitle}]\nDate: ${inspectionForm.date}\nTime: ${inspectionForm.time}\nLocation: ${inspectionForm.location || activeApp.propertyAddress || activeApp.propertyTitle}${inspectionForm.notes ? `\nNotes: ${inspectionForm.notes}` : ''}\n\nPlease review and confirm this inspection appointment in your dashboard.`;
        await chatService.sendMessage(recipientId, msg, activeApp.propertyId, {
          partner_name: tProf.fullName,
          partner_avatar: tProf.avatar || ""
        });
      }

      triggerToast(`Inspection scheduled for ${inspectionForm.date} at ${inspectionForm.time}!`, "success");
      setShowScheduleInspectionModal(false);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to schedule inspection", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLeaseSetup = () => {
    if (!activeApp) return;
    setShowLeaseSetupModal(true);
  };

  const tProf = getTenantProfile(activeApp);
  const propertyRent = parseFloat(activeApp?.propertyRentAmount || activeApp?.property_rent_amount) || 0;
  const requiredIncomeRange = activeApp?.propertyRequirements?.minimumIncome || activeApp?.property_minimum_income || "No Minimum Income";
  const meetsIncome = doesIncomeMeetRequirement(tProf.incomeRange, requiredIncomeRange);
  const hasGuarantor = Boolean(tProf.guarantorName && tProf.guarantorName.trim().length > 0);
  const appDateFormatted = activeApp ? (activeApp.applicationDate || activeApp.date || (activeApp.createdAt ? new Date(activeApp.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "Not Provided")) : "Not Provided";

  // Determine current lifecycle stage
  const isInvoicePaid = activeInvoice?.status === "paid";
  const isPaymentProofUploaded = Boolean(activeInvoice && (activeInvoice.paymentReference || activeInvoice.paymentProofUrl) && !isInvoicePaid);
  const isLeaseSigned = activeLease?.signedByTenant || activeLease?.status === "signed";
  const isMoveInSet = Boolean(activeMoveInRules);

  const filteredApplications = applications.filter(app => {
    const prof = getTenantProfile(app);
    const matchesSearch = 
      prof.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.propertyTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || app.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-ink-500 font-semibold">
        Loading applications...
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-ink-500">
        <FileText className="h-12 w-12 mb-2 text-ink-300 dark:text-cream-100/40" />
        <h3 className="font-bold text-ink-800 dark:text-white">No Applications</h3>
        <p className="text-sm">You do not have any pending applications.</p>
      </div>
    );
  }

  // Dynamic Action Bar with Lifecycle Progressive Primary Button
  const renderActionBar = () => (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#13221C] rounded-2xl border border-ink-200/80 dark:border-[#23372B]/60 shadow-xs">
      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
        <button 
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm rounded-xl border border-indigo-200 dark:border-indigo-800/40 transition-all cursor-pointer shadow-xs"
          onClick={() => initiateChat(activeApp)}
        >
          <MessageSquare className="h-4 w-4" /> Message Applicant
        </button>

        <button
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs sm:text-sm rounded-xl border border-amber-200 dark:border-amber-800/40 transition-all cursor-pointer shadow-xs"
          onClick={() => setShowRequestModal(true)}
        >
          <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Request Documents
        </button>

        <button
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-moss-50 hover:bg-moss-100 dark:bg-moss-950/50 dark:hover:bg-moss-900/60 text-moss-800 dark:text-[#E5C583] font-bold text-xs sm:text-sm rounded-xl border border-moss-200 dark:border-moss-800/40 transition-all cursor-pointer shadow-xs"
          onClick={() => {
            setInspectionForm({
              date: new Date().toISOString().split("T")[0],
              time: "10:00 AM",
              location: activeApp?.propertyAddress || activeApp?.propertyTitle || "",
              notes: ""
            });
            setShowScheduleInspectionModal(true);
          }}
        >
          <Calendar className="h-4 w-4 text-moss-700 dark:text-[#E5C583]" /> Schedule Inspection
        </button>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
        {(activeApp.status === 'declined' || activeApp.status === 'Rejected') ? (
          <button 
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
            onClick={() => handleDeleteApplication(activeApp.id)}
            disabled={isSubmitting}
          >
            <Trash2 className="h-4 w-4" /> Delete Application
          </button>
        ) : (
          <button 
            className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold text-xs sm:text-sm rounded-xl border border-rose-200 dark:border-rose-800/40 transition-all cursor-pointer disabled:opacity-50"
            onClick={() => setShowDeclineModal(true)}
            disabled={isSubmitting}
          >
            Decline
          </button>
        )}
        
        {/* DYNAMIC PROGRESSIVE PRIMARY ACTION BUTTON */}
        {!activeInvoice ? (
          <button 
            className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 dark:bg-[#E5C583] dark:hover:bg-[#D8B672] text-white dark:text-[#263b33] font-extrabold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            onClick={() => setShowInvoiceModal(true)}
            disabled={activeApp.status === 'declined' || isSubmitting}
          >
            <FileText className="h-4 w-4" /> Issue Digital Rent Invoice &rarr;
          </button>
        ) : isPaymentProofUploaded ? (
          <button 
            className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            onClick={handleVerifyPayment}
            disabled={isSubmitting}
          >
            <CheckCircle2 className="h-4 w-4" /> Verify Payment Receipt & Confirm &rarr;
          </button>
        ) : !isInvoicePaid ? (
          <button 
            className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold text-xs sm:text-sm rounded-xl border border-amber-400/40 cursor-pointer flex items-center gap-2"
            onClick={() => setShowInvoiceModal(true)}
          >
            <FileText className="h-4 w-4 text-amber-600" /> View Issued Invoice (Awaiting Payment ⏳)
          </button>
        ) : !activeLease ? (
          <button 
            className="flex-1 sm:flex-none px-5 py-2.5 bg-moss-700 hover:bg-forest-600 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            onClick={openLeaseSetup}
            disabled={isSubmitting}
          >
            <FileText className="h-4 w-4" /> Draft & Send Lease Agreement &rarr;
          </button>
        ) : !isLeaseSigned ? (
          <button 
            className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold text-xs sm:text-sm rounded-xl border border-indigo-200 cursor-pointer flex items-center gap-2"
            onClick={openLeaseSetup}
          >
            <FileText className="h-4 w-4 text-indigo-600" /> View Issued Lease (Awaiting Signature ⏳)
          </button>
        ) : !isMoveInSet ? (
          <button 
            className="flex-1 sm:flex-none px-5 py-2.5 bg-moss-800 hover:bg-moss-900 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            onClick={() => setShowMoveInModal(true)}
            disabled={isSubmitting}
          >
            <Key className="h-4 w-4 text-[#E5C583]" /> Send Move-in Rules & Key Pickup &rarr;
          </button>
        ) : (
          <span className="px-4 py-2.5 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs sm:text-sm rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" /> Tenant Fully Onboarded & Leased ✓
          </span>
        )}
      </div>
    </div>
  );

  // VIEW 1: CLEAN APPLICATIONS LIST/GRID PAGE
  if (viewMode === "list") {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 text-left">
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#101F1A] p-6 rounded-3xl border border-ink-200/80 dark:border-[#23372B]/60 shadow-xs">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-ink-900 dark:text-white tracking-tight">Rental Applications</h1>
              <span className="text-xs font-extrabold bg-moss-700/10 text-moss-700 dark:text-[#E5C583] dark:bg-[#E5C583]/15 px-3 py-1 rounded-full">
                {applications.length} Received
              </span>
            </div>
            <p className="text-xs text-ink-600 dark:text-cream-100/70 mt-1">
              Select an applicant to review their profile, inspect details, schedule walkthroughs, and issue leases.
            </p>
          </div>

          <button
            onClick={() => setShowCalendarModal(true)}
            className="px-4 py-2.5 bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#D8B672] text-white dark:text-[#263b33] font-extrabold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-2 shrink-0 w-fit"
          >
            <Calendar className="h-4 w-4" /> Schedule Calendar
          </button>
        </div>

        {/* CONTROLS: SEARCH & STATUS FILTER */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 dark:text-cream-100/50" />
            <input
              type="text"
              placeholder="Search by applicant name, email, or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ink-200 dark:border-white/10 bg-white dark:bg-[#101F1A] text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 shadow-xs"
            />
          </div>

          {/* STATUS PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["all", "pending", "approved", "declined"].map(statusKey => (
              <button
                key={statusKey}
                onClick={() => setStatusFilter(statusKey)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === statusKey
                    ? "bg-moss-700 text-white dark:bg-[#E5C583] dark:text-[#263b33] shadow-xs"
                    : "bg-white dark:bg-[#101F1A] text-ink-600 dark:text-cream-100/70 border border-ink-200/80 dark:border-white/10 hover:bg-neutral-50"
                }`}
              >
                {statusKey}
              </button>
            ))}
          </div>
        </div>

        {/* APPLICANT CARDS GRID */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 text-center space-y-3 bg-white dark:bg-[#101F1A] rounded-3xl border border-ink-200/80 dark:border-white/10">
            <Loader2 className="h-8 w-8 animate-spin text-moss-700 dark:text-[#E5C583]" />
            <span className="text-xs font-extrabold text-ink-900 dark:text-white">Syncing applicant profiles & documents...</span>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-ink-200 dark:border-white/10 bg-white dark:bg-[#101F1A]">
            <FileText className="h-10 w-10 text-ink-300 dark:text-cream-100/40 mx-auto mb-2" />
            <h3 className="font-extrabold text-sm text-ink-900 dark:text-white">No Matching Applications Found</h3>
            <p className="text-xs text-ink-500 dark:text-cream-100/60 mt-1">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredApplications.map(app => {
              const prof = getTenantProfile(app);
              const insp = inspectionService.getInspection(app.id);

              return (
                <div 
                  key={app.id} 
                  onClick={() => {
                    setActiveApplicantId(app.id);
                    setViewMode("detail");
                  }}
                  className="bg-white dark:bg-[#101F1A] p-5 rounded-3xl border border-ink-200/80 dark:border-[#23372B]/60 shadow-sm hover:shadow-md hover:border-moss-500/50 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* TOP ROW: AVATAR, NAME, STATUS */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={prof.avatar} name={prof.fullName} className="h-12 w-12 rounded-full border border-moss-700/20 object-cover shadow-xs" />
                        <div>
                          <h3 className="font-extrabold text-sm text-ink-900 dark:text-white group-hover:text-moss-700 dark:group-hover:text-[#E5C583] transition-colors">
                            {prof.fullName}
                          </h3>
                          <p className="text-xs text-ink-500 dark:text-cream-100/60 truncate max-w-[170px]">{prof.email}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-extrabold tracking-wider ${
                        app.status === 'pending' ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30' :
                        app.status === 'approved' ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30' :
                        app.status === 'declined' ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30' :
                        'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* PROPERTY DETAILS */}
                    <div className="p-3 bg-cream-50/70 dark:bg-white/5 rounded-2xl border border-ink-100 dark:border-white/5 space-y-1">
                      <span className="text-[10px] text-ink-400 dark:text-cream-100/50 uppercase font-extrabold tracking-wider block">Property Listing</span>
                      <p className="font-bold text-xs text-ink-900 dark:text-white line-clamp-1">{app.propertyTitle}</p>
                      {prof.monthlyIncome > 0 && (
                        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 pt-0.5">
                          Income: ₦{prof.monthlyIncome.toLocaleString()} / yr
                        </p>
                      )}
                    </div>

                    {/* INSPECTION BADGE IF SCHEDULED */}
                    {insp && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 text-[11px] text-amber-900 dark:text-amber-200 flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-amber-600" /> {insp.status}: {insp.date}
                        </span>
                        <span className="font-semibold">{insp.time}</span>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ROW: DATE & ACTION LINK */}
                  <div className="pt-4 mt-4 border-t border-ink-100 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-ink-400 dark:text-cream-100/50 font-medium text-[11px]">
                      Applied: {app.date || (app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent')}
                    </span>
                    <span className="font-extrabold text-moss-700 dark:text-[#E5C583] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Details & Manage <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SCHEDULE CALENDAR MODAL */}
        <InspectionCalendarModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          userRole="landlord"
          setActiveTab={setActiveTab}
        />
      </div>
    );
  }

  // VIEW 2: FULL APPLICANT DETAIL PAGE WITH LIVE PROGRESS TRACKER
  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      
      {/* TOP DETAIL BREADCRUMB & BACK NAVIGATION */}
      <div className="flex items-center justify-between bg-white dark:bg-[#101F1A] p-4 sm:p-5 rounded-3xl border border-ink-200/80 dark:border-[#23372B]/60 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode("list")}
            className="px-4 py-2 bg-cream-100 dark:bg-white/10 hover:bg-cream-200 dark:hover:bg-white/20 text-ink-900 dark:text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-ink-200/60 dark:border-white/10"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Applications
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-ink-400 dark:text-cream-100/60">
            <span>Applications</span>
            <span>/</span>
            <span className="font-extrabold text-moss-700 dark:text-[#E5C583]">{tProf.fullName}</span>
          </div>
        </div>

        <button
          onClick={() => setShowCalendarModal(true)}
          className="px-3.5 py-2 bg-moss-700/10 dark:bg-[#E5C583]/15 text-moss-700 dark:text-[#E5C583] hover:bg-moss-700/20 font-extrabold text-xs rounded-xl border border-moss-700/20 dark:border-[#E5C583]/30 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Calendar className="h-3.5 w-3.5" /> Schedule Calendar
        </button>
      </div>

      {/* STAGE PROGRESS TRACKER BAR */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#101F1A] border border-ink-200/80 dark:border-[#23372B]/60 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-ink-400 dark:text-cream-100/60 uppercase tracking-wider">
            Application Onboarding Progress Tracker
          </h3>
          <span className="text-xs font-extrabold text-moss-700 dark:text-[#E5C583]">
            {isMoveInSet ? "Completed ✓" : isLeaseSigned ? "Step 4 of 4: Move-in Rules" : isInvoicePaid ? "Step 3 of 4: Lease Agreement" : activeInvoice ? "Step 2 of 4: Invoice Payment" : "Step 1 of 4: Initial Review"}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {/* Step 1 */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            activeInvoice ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold" : "bg-moss-50 dark:bg-white/5 border-moss-300 dark:border-white/10 text-moss-800 font-bold"
          }`}>
            <span className="text-[10px] block uppercase font-extrabold opacity-70">1. Invoice</span>
            <span className="truncate block mt-0.5">{activeInvoice ? (isInvoicePaid ? "Paid ✓" : "Issued ⏳") : "Review"}</span>
          </div>

          {/* Step 2 */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            isInvoicePaid ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold" : isPaymentProofUploaded ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-900 font-bold" : "bg-neutral-50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-ink-400 opacity-60"
          }`}>
            <span className="text-[10px] block uppercase font-extrabold opacity-70">2. Payment</span>
            <span className="truncate block mt-0.5">{isInvoicePaid ? "Verified ✓" : isPaymentProofUploaded ? "Receipt Uploaded!" : "Pending"}</span>
          </div>

          {/* Step 3 */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            isLeaseSigned ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold" : activeLease ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 text-indigo-900 font-bold" : "bg-neutral-50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-ink-400 opacity-60"
          }`}>
            <span className="text-[10px] block uppercase font-extrabold opacity-70">3. Lease</span>
            <span className="truncate block mt-0.5">{isLeaseSigned ? "Signed ✓" : activeLease ? "Awaiting Signature" : "Pending"}</span>
          </div>

          {/* Step 4 */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            isMoveInSet ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold" : "bg-neutral-50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-ink-400 opacity-60"
          }`}>
            <span className="text-[10px] block uppercase font-extrabold opacity-70">4. Move-in</span>
            <span className="truncate block mt-0.5">{isMoveInSet ? "Rules Issued ✓" : "Pending"}</span>
          </div>
        </div>
      </div>

      {/* HEADER: APPLICANT & PROPERTY BANNER */}
      <div className="bg-white dark:bg-[#101F1A] p-6 rounded-3xl border border-ink-200/80 dark:border-[#23372B]/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar src={tProf.avatar} name={tProf.fullName} className="h-16 w-16 sm:h-20 sm:w-20 rounded-full text-2xl font-bold border-2 border-moss-700/20 dark:border-[#E5C583]/30 object-cover shadow-sm" />
            {tProf.nin_verified && (
              <span className="absolute bottom-0 right-0 p-1 bg-emerald-500 text-white rounded-full shadow-sm" title="NIN Verified Identity">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-ink-900 dark:text-white tracking-tight">
                {tProf.fullName}
              </h2>
              <span className={`text-[10.5px] px-3 py-0.5 rounded-full uppercase font-extrabold tracking-wider ${
                activeApp.status === 'pending' ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30' :
                activeApp.status === 'approved' ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30' :
                activeApp.status === 'declined' ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30' :
                'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30'
              }`}>
                {activeApp.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-600 dark:text-cream-100/70 font-semibold mt-1.5 flex-wrap">
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-moss-700 dark:text-[#E5C583]" /> {tProf.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-moss-700 dark:text-[#E5C583]" /> {tProf.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-ink-100 dark:border-white/10">
          <button 
            onClick={() => setShowReliabilityDetails(true)}
            className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer w-fit"
            title="Click to view detailed reliability history"
          >
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span>★ {tProf.reliabilityScore > 0 ? tProf.reliabilityScore : "New"} Score</span>
          </button>
          <div className="md:text-right">
            <span className="text-[10px] text-ink-400 dark:text-cream-100/50 uppercase font-extrabold tracking-wider block">Applying For Property</span>
            <p className="font-extrabold text-moss-700 dark:text-[#E5C583] text-sm sm:text-base">{activeApp.propertyTitle}</p>
            {propertyRent > 0 && (
              <p className="text-xs font-semibold text-ink-700 dark:text-cream-100/80">
                ₦{propertyRent.toLocaleString()} / {activeApp.propertyRentPeriod || 'annually'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* DYNAMIC STAGE BANNER */}
      {isPaymentProofUploaded ? (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-sm">Tenant Submitted Payment Proof!</span>
              <p className="mt-0.5">Reference: <strong>{activeInvoice.paymentReference || 'Bank Transfer Upload'}</strong>. Click verify to confirm receipt & unlock lease builder.</p>
            </div>
          </div>
          <button
            onClick={handleVerifyPayment}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs shrink-0"
          >
            Verify & Confirm Rent Received ✓
          </button>
        </div>
      ) : isInvoicePaid && !activeLease ? (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-sm">Rent Payment Received & Verified ✓</span>
              <p className="mt-0.5">Unlocked Step 3: Draft & issue the official residential lease agreement to tenant.</p>
            </div>
          </div>
          <button
            onClick={openLeaseSetup}
            className="px-4 py-2 bg-moss-700 hover:bg-forest-600 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs shrink-0"
          >
            Draft Lease Agreement &rarr;
          </button>
        </div>
      ) : isLeaseSigned && !isMoveInSet ? (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-sm">Lease Agreement Digitally Signed by Tenant ✓</span>
              <p className="mt-0.5">Signed by <strong>{activeLease.tenantSignature || tProf.fullName}</strong>. Unlocked Step 4: Issue key pickup & move-in rules.</p>
            </div>
          </div>
          <button
            onClick={() => setShowMoveInModal(true)}
            className="px-4 py-2 bg-moss-800 hover:bg-moss-900 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs shrink-0"
          >
            Send Move-in Rules & Key Pickup &rarr;
          </button>
        </div>
      ) : null}

      {/* UPCOMING INSPECTION BANNER */}
      {(() => {
        const currentInspection = activeApp ? inspectionService.getInspection(activeApp.id) : null;
        if (!currentInspection) return null;
        return (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 flex items-start justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">Property Inspection Appointment ({currentInspection.status})</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 text-[10.5px] font-bold uppercase">
                    {currentInspection.date} at {currentInspection.time}
                  </span>
                </div>
                <p className="leading-relaxed">
                  Location: <strong>{currentInspection.location}</strong>
                  {currentInspection.notes && <span> • Instructions: {currentInspection.notes}</span>}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCalendarModal(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer shadow-xs"
            >
              View Schedule Calendar
            </button>
          </div>
        );
      })()}

      {/* TWO COLUMN CONTENT AREA - ALWAYS VISIBLE APPLICANT DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: PERSONAL DETAILS CARD */}
        <div className="lg:col-span-4 bg-white dark:bg-[#101F1A] border border-ink-200/80 dark:border-[#23372B]/60 rounded-3xl p-6 flex flex-col shadow-xs">
          <div className="flex flex-col items-center text-center pb-5 border-b border-ink-100 dark:border-white/10">
            <Avatar src={tProf.avatar} name={tProf.fullName} className="w-20 h-20 rounded-full border-4 border-cream-50 dark:border-[#1C3328] shadow-md object-cover mb-3" />
            <h3 className="text-base font-extrabold text-ink-900 dark:text-white">{tProf.fullName}</h3>
            <span className="text-xs font-bold px-3 py-0.5 bg-moss-700/10 text-moss-700 dark:bg-[#E5C583]/20 dark:text-[#E5C583] rounded-full mt-1 capitalize">
              {activeApp.status.replace('_', ' ')}
            </span>
          </div>

          <div className="w-full text-left space-y-4 pt-5">
            <h4 className="text-xs font-black text-ink-400 dark:text-cream-100/50 uppercase tracking-wider">Personal Details</h4>

            <div>
              <span className="text-xs text-ink-400 dark:text-cream-100/60 font-semibold block mb-0.5">Contact No. :</span>
              <span className="text-xs sm:text-sm font-bold text-ink-900 dark:text-white">{tProf.phone}</span>
            </div>

            <div>
              <span className="text-xs text-ink-400 dark:text-cream-100/60 font-semibold block mb-0.5">Email Id :</span>
              <span className="text-xs sm:text-sm font-bold text-ink-900 dark:text-white break-all">{tProf.email}</span>
            </div>

            <div>
              <span className="text-xs text-ink-400 dark:text-cream-100/60 font-semibold block mb-0.5">Occupation :</span>
              <span className="text-xs sm:text-sm font-bold text-ink-900 dark:text-white">{tProf.occupation}</span>
            </div>

            <div>
              <span className="text-xs text-ink-400 dark:text-cream-100/60 font-semibold block mb-0.5">Emergency Contact No. :</span>
              <span className="text-xs sm:text-sm font-bold text-ink-900 dark:text-white">{tProf.emergencyContact}</span>
            </div>

            <div>
              <span className="text-xs text-ink-400 dark:text-cream-100/60 font-semibold block mb-0.5">Current Address :</span>
              <span className="text-xs sm:text-sm font-bold text-ink-900 dark:text-white">{tProf.currentAddress}</span>
            </div>

            <div>
              <span className="text-xs text-ink-400 dark:text-cream-100/60 font-semibold block mb-0.5">Annual Income Range :</span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{tProf.incomeRange}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TABBED INFORMATION CONTAINER */}
        <div className="lg:col-span-8 bg-white dark:bg-[#101F1A] border border-ink-200/80 dark:border-[#23372B]/60 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
          <div>
            {/* TAB NAVIGATION HEADER */}
            <div className="flex items-center gap-5 border-b border-ink-100 dark:border-white/10 pb-3 mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveDetailTab("application")}
                className={`pb-3 font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer relative ${
                  activeDetailTab === "application"
                    ? "text-moss-700 dark:text-[#E5C583]"
                    : "text-ink-400 dark:text-cream-100/60 hover:text-ink-800"
                }`}
              >
                Application Details
                {activeDetailTab === "application" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-moss-700 dark:bg-[#E5C583] rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveDetailTab("evaluation")}
                className={`pb-3 font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer relative ${
                  activeDetailTab === "evaluation"
                    ? "text-moss-700 dark:text-[#E5C583]"
                    : "text-ink-400 dark:text-cream-100/60 hover:text-ink-800"
                }`}
              >
                Financials & Evaluation
                {activeDetailTab === "evaluation" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-moss-700 dark:bg-[#E5C583] rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveDetailTab("history")}
                className={`pb-3 font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer relative flex items-center gap-1.5 ${
                  activeDetailTab === "history"
                    ? "text-moss-700 dark:text-[#E5C583]"
                    : "text-ink-400 dark:text-cream-100/60 hover:text-ink-800"
                }`}
              >
                Rental History
                <span className="px-1.5 py-0.2 bg-ink-100 dark:bg-white/10 text-ink-700 dark:text-cream-100 text-[10px] font-extrabold rounded-full">
                  {String(tProf.rentalHistory.length).padStart(2, '0')}
                </span>
                {activeDetailTab === "history" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-moss-700 dark:bg-[#E5C583] rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveDetailTab("documents")}
                className={`pb-3 font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer relative flex items-center gap-1.5 ${
                  activeDetailTab === "documents"
                    ? "text-moss-700 dark:text-[#E5C583]"
                    : "text-ink-400 dark:text-cream-100/60 hover:text-ink-800"
                }`}
              >
                Documents
                <span className="px-1.5 py-0.2 bg-ink-100 dark:bg-white/10 text-ink-700 dark:text-cream-100 text-[10px] font-extrabold rounded-full">
                  {String(tProf.documents.length).padStart(2, '0')}
                </span>
                {activeDetailTab === "documents" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-moss-700 dark:bg-[#E5C583] rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveDetailTab("notes")}
                className={`pb-3 font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer relative ${
                  activeDetailTab === "notes"
                    ? "text-moss-700 dark:text-[#E5C583]"
                    : "text-ink-400 dark:text-cream-100/60 hover:text-ink-800"
                }`}
              >
                Notes & Comments
                {activeDetailTab === "notes" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-moss-700 dark:bg-[#E5C583] rounded-full" />
                )}
              </button>
            </div>

            {/* TAB 1: APPLICATION DETAILS */}
            {activeDetailTab === "application" && (
              <div className="p-5 sm:p-6 rounded-2xl bg-cream-50/60 dark:bg-white/5 border border-ink-100 dark:border-white/10 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 text-xs sm:text-sm">
                  <div>
                    <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">Application Date :</span>
                    <span className="font-extrabold text-ink-900 dark:text-white">{appDateFormatted}</span>
                  </div>

                  <div>
                    <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">No. of Occupants :</span>
                    <span className="font-extrabold text-ink-900 dark:text-white">{tProf.dependants}</span>
                  </div>

                  <div>
                    <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">Desired Move-in Date :</span>
                    <span className="font-extrabold text-ink-900 dark:text-white">{tProf.moveInDate}</span>
                  </div>

                  <div>
                    <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">Pet(s) :</span>
                    <span className="font-extrabold text-ink-900 dark:text-white">{tProf.pets}</span>
                  </div>

                  <div>
                    <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">Desired Lease Term :</span>
                    <span className="font-extrabold text-ink-900 dark:text-white">{tProf.leaseTerm}</span>
                  </div>

                  <div>
                    <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">Car(s) :</span>
                    <span className="font-extrabold text-ink-900 dark:text-white">{tProf.cars}</span>
                  </div>

                  <div>
                    <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">Marital Status :</span>
                    <span className="font-extrabold text-ink-900 dark:text-white">{tProf.maritalStatus}</span>
                  </div>

                  <div>
                    <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">Annual Income Range :</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{tProf.incomeRange}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FINANCIALS & REQUIREMENTS EVALUATION */}
            {activeDetailTab === "evaluation" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* Financial Evaluation Box */}
                <div className="bg-cream-50/60 dark:bg-white/5 p-5 rounded-2xl border border-ink-100 dark:border-white/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-[#A3BCA7] flex items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-moss-700 dark:text-[#E5C583]" /> Financials & Income
                    </h3>
                    {meetsIncome ? (
                      <span className="text-[10.5px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Meets Requirement
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-bold bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" /> Does Not Meet Requirement
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-[11px] font-semibold text-ink-400 dark:text-cream-100/50 uppercase tracking-wider">Annual Income Range</p>
                    <p className="font-extrabold text-ink-900 dark:text-white text-base sm:text-lg mt-0.5">
                      {tProf.incomeRange}
                    </p>
                    <p className="text-[11px] text-ink-600 dark:text-cream-100/70 mt-1">
                      Property minimum required income: <strong>{requiredIncomeRange}</strong>
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-ink-100 dark:border-white/5 text-xs">
                    <div>
                      <span className="text-ink-400 dark:text-cream-100/50 font-semibold block mb-0.5">Employment</span>
                      <p className="font-bold text-ink-900 dark:text-white">{tProf.employmentStatus}</p>
                    </div>
                    <div>
                      <span className="text-ink-400 dark:text-cream-100/50 font-semibold block mb-0.5">Employer</span>
                      <p className="font-bold text-ink-900 dark:text-white truncate">{tProf.employerName}</p>
                    </div>
                    <div>
                      <span className="text-ink-400 dark:text-cream-100/50 font-semibold block mb-0.5">Occupation</span>
                      <p className="font-bold text-ink-900 dark:text-white truncate">{tProf.occupation}</p>
                    </div>
                    <div>
                      <span className="text-ink-400 dark:text-cream-100/50 font-semibold block mb-0.5">Marital Status</span>
                      <p className="font-bold text-ink-900 dark:text-white">{tProf.maritalStatus}</p>
                    </div>
                  </div>
                </div>

                {/* Guarantor Requirement Box */}
                <div className="bg-cream-50/60 dark:bg-white/5 p-5 rounded-2xl border border-ink-100 dark:border-white/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-[#A3BCA7] flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-moss-700 dark:text-[#E5C583]" /> Guarantor Information
                    </h3>
                    {hasGuarantor ? (
                      <span className="text-[10.5px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Meets Requirement
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-bold bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" /> Does Not Meet Requirement
                      </span>
                    )}
                  </div>
                  
                  {hasGuarantor ? (
                    <div className="space-y-2 pt-1 text-xs">
                      <div>
                        <span className="text-ink-400 dark:text-cream-100/50 font-semibold block mb-0.5">Guarantor Name</span>
                        <p className="font-bold text-ink-900 dark:text-white text-sm">{tProf.guarantorName}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-ink-100 dark:border-white/5">
                        <div>
                          <span className="text-ink-400 dark:text-cream-100/50 font-semibold block mb-0.5">Relationship</span>
                          <p className="font-semibold text-ink-900 dark:text-white">{tProf.guarantorRelationship || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-ink-400 dark:text-cream-100/50 font-semibold block mb-0.5">Phone Number</span>
                          <p className="font-semibold text-ink-900 dark:text-white">{tProf.guarantorPhone || 'N/A'}</p>
                        </div>
                      </div>
                      {tProf.guarantorEmail && (
                        <p className="text-ink-600 dark:text-cream-100/70 pt-1">Email: <span className="font-medium">{tProf.guarantorEmail}</span></p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1 text-xs">
                      <p className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 shrink-0" /> Missing Guarantor Details
                      </p>
                      <p className="text-ink-700 dark:text-cream-100/80 leading-relaxed">
                        Applicant did not provide mandatory guarantor details for this property application.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 3: RENTAL HISTORY */}
            {activeDetailTab === "history" && (
              <div className="p-5 sm:p-6 rounded-2xl bg-cream-50/60 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-4 animate-in fade-in duration-200">
                {tProf.rentalHistory.length === 0 ? (
                  <div className="text-center py-8 text-ink-400 dark:text-cream-100/60">
                    <p className="text-xs font-semibold">No prior rental history recorded for this tenant.</p>
                  </div>
                ) : (
                  tProf.rentalHistory.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white dark:bg-[#13221C] border border-ink-100 dark:border-white/10 flex items-center justify-between gap-4 shadow-xs">
                      <div>
                        <h4 className="font-bold text-sm text-ink-900 dark:text-white">{item.title}</h4>
                        <p className="text-xs text-ink-500 dark:text-cream-100/70 mt-0.5">Lease Term: {item.period}</p>
                        <span className="inline-block mt-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full capitalize">
                          {item.status}
                        </span>
                      </div>
                      {item.amount && <span className="font-black text-sm text-moss-700 dark:text-[#E5C583]">{item.amount}</span>}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: DOCUMENTS */}
            {activeDetailTab === "documents" && (
              <div className="p-5 sm:p-6 rounded-2xl bg-cream-50/60 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-3 animate-in fade-in duration-200">
                {tProf.documents.length === 0 ? (
                  <div className="text-center py-8 text-ink-400 dark:text-cream-100/60">
                    <p className="text-xs font-semibold">No verification documents attached to this application.</p>
                  </div>
                ) : (
                  tProf.documents.map((doc, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white dark:bg-[#13221C] border border-ink-100 dark:border-white/10 flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-ink-900 dark:text-white">{doc.name}</h4>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{doc.status}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-ink-400 uppercase">{doc.type || "Doc"}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 5: NOTES & COMMENTS */}
            {activeDetailTab === "notes" && (
              <div className="p-5 sm:p-6 rounded-2xl bg-cream-50/60 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-white dark:bg-[#13221C] border border-ink-100 dark:border-white/10 shadow-xs">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-ink-400 dark:text-cream-100/60 mb-2 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-moss-700 dark:text-[#E5C583]" /> Note from Applicant
                  </h4>
                  <p className="text-xs sm:text-sm text-ink-800 dark:text-cream-100 leading-relaxed italic bg-[#FAF8F5] dark:bg-white/5 p-3.5 rounded-xl border border-ink-100 dark:border-white/5">
                    "{tProf.notes || "No custom note provided by applicant."}"
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/50">
                  <div>
                    <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">Reliability Evaluation</h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">Calculated from verified platform rental activity</p>
                  </div>
                  <button
                    onClick={() => setShowReliabilityDetails(true)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    View Breakdown
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* BOTTOM ACTION BUTTONS BAR */}
      <div className="pt-2">
        {renderActionBar()}
      </div>

      {/* MOVE IN SETUP MODAL */}
      <MoveInSetupModal
        isOpen={showMoveInModal}
        onClose={() => setShowMoveInModal(false)}
        application={activeApp}
        onSuccess={() => {
          fetchApplications();
          if (activeApp.id) loadStageData(activeApp.id);
        }}
      />

      {/* RELIABILITY BREAKDOWN SUB-MODAL */}
      {showReliabilityDetails && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowReliabilityDetails(false)}>
          <div className="w-full max-w-md bg-white dark:bg-[#16241F] rounded-3xl p-6 shadow-2xl border border-ink-100 dark:border-white/10 max-h-[85vh] overflow-y-auto relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-ink-100 dark:border-white/10 mb-4">
              <h3 className="font-extrabold text-base text-ink-900 dark:text-white">Reliability Breakdown</h3>
              <button 
                className="p-1 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10 cursor-pointer" 
                onClick={() => setShowReliabilityDetails(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/50 flex items-center gap-4 mb-4">
              <Star className="h-8 w-8 fill-amber-500 text-amber-500 shrink-0" />
              <div>
                <span className="text-2xl font-black text-amber-950 dark:text-amber-200">
                  {tProf.reliabilityScore > 0 ? tProf.reliabilityScore.toFixed(1) : "New"} 
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">{tProf.reliabilityScore > 0 ? "/ 5.0" : ""}</span>
                </span>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">Verified landlord rating computed from rental history and timely payments.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-cream-50 dark:bg-white/5 border border-ink-100 dark:border-white/10">
                <span className="font-bold text-ink-900 dark:text-white block mb-1">Platform Rating</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {tProf.reliabilityScore > 0 ? `${tProf.reliabilityScore.toFixed(1)} Rating Score` : "New Platform Account"}
                </span>
              </div>
            </div>

            <button 
              className="w-full mt-5 py-2.5 bg-ink-900 text-white dark:bg-white dark:text-ink-950 font-bold text-xs rounded-xl cursor-pointer" 
              onClick={() => setShowReliabilityDetails(false)}
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}

      {/* SCHEDULE INSPECTION MODAL */}
      {showScheduleInspectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16241F] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-ink-100 dark:border-white/10 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-base text-ink-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-moss-700 dark:text-[#E5C583]" /> Schedule Property Inspection
              </h3>
              <button onClick={() => setShowScheduleInspectionModal(false)} className="text-ink-400 hover:text-ink-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <p className="text-xs text-ink-600 dark:text-cream-100/70">
              Propose an inspection slot for <strong>{tProf.fullName}</strong> for property <strong>{activeApp?.propertyTitle}</strong>:
            </p>

            <form onSubmit={handleScheduleInspection} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Inspection Date</label>
                  <input
                    type="date"
                    required
                    value={inspectionForm.date}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-xl border border-ink-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-cream-50 dark:bg-white/5 outline-none focus:border-moss-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Inspection Time</label>
                  <select
                    value={inspectionForm.time}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full rounded-xl border border-ink-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-cream-50 dark:bg-white/5 outline-none focus:border-moss-600"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Meeting Location / Address</label>
                <input
                  type="text"
                  placeholder="e.g. Property Front Entrance, Flat 4..."
                  value={inspectionForm.location}
                  onChange={(e) => setInspectionForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full rounded-xl border border-ink-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-cream-50 dark:bg-white/5 outline-none focus:border-moss-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Instructions / Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please bring original government ID or NIN card..."
                  value={inspectionForm.notes}
                  onChange={(e) => setInspectionForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-xl border border-ink-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-cream-50 dark:bg-white/5 outline-none focus:border-moss-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-ink-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowScheduleInspectionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-cream-100 hover:bg-ink-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#263b33] rounded-xl disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  Confirm & Send Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE CALENDAR MODAL */}
      <InspectionCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        userRole="landlord"
        setActiveTab={setActiveTab}
      />

      {/* REQUEST DOCUMENTS MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16241F] rounded-2xl max-w-md w-full p-6 shadow-xl border border-ink-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-base text-ink-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-moss-700 dark:text-[#E5C583]" /> Request Information from Tenant
              </h3>
              <button onClick={() => setShowRequestModal(false)} className="text-ink-400 hover:text-ink-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <p className="text-xs text-ink-600 dark:text-cream-100/70 leading-relaxed">
              Select a preset request or write a custom document request for <strong>{tProf.firstName}</strong>:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => handleSendRequest("Proof of Employment / Recent 3 Months Payslips")}
                className="p-3 text-left text-xs font-semibold bg-cream-50 dark:bg-white/5 hover:bg-moss-50 dark:hover:bg-moss-900/30 rounded-xl border border-ink-100 dark:border-white/10 text-ink-800 dark:text-cream-100 flex items-center justify-between cursor-pointer"
              >
                <span>📄 Request Proof of Employment / Payslips</span>
                <span className="text-moss-700 dark:text-[#E5C583] font-bold">Send →</span>
              </button>

              <button
                onClick={() => handleSendRequest("Bank Statement / Financial Proof")}
                className="p-3 text-left text-xs font-semibold bg-cream-50 dark:bg-white/5 hover:bg-moss-50 dark:hover:bg-moss-900/30 rounded-xl border border-ink-100 dark:border-white/10 text-ink-800 dark:text-cream-100 flex items-center justify-between cursor-pointer"
              >
                <span>💼 Request Bank Statement (6 Months)</span>
                <span className="text-moss-700 dark:text-[#E5C583] font-bold">Send →</span>
              </button>
            </div>

            <div className="pt-3 border-t border-ink-100 dark:border-white/10 space-y-2">
              <label className="block text-xs font-bold text-ink-700 dark:text-cream-100">Custom Request Message</label>
              <textarea
                rows={2}
                placeholder="Type specific details or additional documents you require..."
                value={customRequestText}
                onChange={(e) => setCustomRequestText(e.target.value)}
                className="w-full rounded-xl border border-ink-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-cream-50 dark:bg-white/5 outline-none focus:border-moss-600"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-ink-600 dark:text-cream-100 hover:bg-ink-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendRequest("Custom Document / Information Request", customRequestText)}
                  disabled={!customRequestText.trim()}
                  className="px-4 py-1.5 text-xs font-bold bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#263b33] rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DECLINE MODAL */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16241F] rounded-2xl max-w-md w-full p-6 shadow-xl border border-ink-100 dark:border-white/10 space-y-4">
            <h3 className="font-bold text-lg text-ink-900 dark:text-white">Decline Application</h3>
            <p className="text-xs text-ink-600 dark:text-cream-100/70">
              Are you sure you want to decline <strong>{tProf.fullName}</strong>'s application for <strong>{activeApp.propertyTitle}</strong>?
            </p>
            <div>
              <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Reason (Optional)</label>
              <textarea 
                rows={3} 
                value={declineReason} 
                onChange={(e) => setDeclineReason(e.target.value)} 
                placeholder="e.g. Income below requirement, property already leased..."
                className="w-full rounded-xl border border-ink-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-cream-50 dark:bg-white/5 outline-none focus:border-moss-600"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                className="px-4 py-2 text-xs font-bold text-ink-600 hover:bg-ink-100 rounded-lg cursor-pointer"
                onClick={() => setShowDeclineModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer disabled:opacity-50"
                onClick={() => handleStatusUpdate('declined', declineReason)}
                disabled={isSubmitting}
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIGITAL RENT INVOICE GENERATOR MODAL */}
      <InvoiceBuilderModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        application={activeApp}
        property={{
          id: activeApp?.property_id,
          title: activeApp?.propertyTitle,
          address: activeApp?.propertyAddress || activeApp?.propertyTitle,
          rent_amount: activeApp?.propertyRentAmount || activeApp?.rent_amount || 0
        }}
        tenant={{
          full_name: activeApp ? tProf.fullName : 'Tenant Candidate',
          email: activeApp ? tProf.email : '',
          phone: activeApp ? tProf.phone : ''
        }}
        onSuccess={() => {
          fetchApplications();
          if (activeApp.id) loadStageData(activeApp.id);
        }}
      />

      {/* LEASE BUILDER SETUP MODAL */}
      <LeaseBuilderModal
        isOpen={showLeaseSetupModal}
        onClose={() => setShowLeaseSetupModal(false)}
        application={activeApp}
        property={{
          id: activeApp?.propertyId || activeApp?.property_id,
          title: activeApp?.propertyTitle,
          rent_amount: activeApp?.propertyRentAmount || activeApp?.rent_amount || 0,
          rent_period: activeApp?.propertyRentPeriod || "annually"
        }}
        tenant={{
          full_name: activeApp ? tProf.fullName : 'Tenant Candidate',
          email: activeApp ? tProf.email : '',
          phone: activeApp ? tProf.phone : ''
        }}
        onSuccess={() => {
          fetchApplications();
          if (activeApp?.id) loadStageData(activeApp.id);
        }}
      />

    </div>
  );
}
