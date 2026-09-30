import { useState, useEffect } from "react";
import { Search as SearchIcon, FileText, Clock, Loader2, MessageSquare, Trash2, AlertTriangle, Calendar, Lock, ShieldCheck, CheckCircle2, Key, Info, Star, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";
import { applicationService } from "../../services/applicationService";
import { chatService } from "../../services/chatService";
import { invoiceService } from "../../services/invoiceService";
import { inspectionService } from "../../services/inspectionService";
import InspectionCalendarModal from "../../components/InspectionCalendarModal";
import TenantInvoiceModal from "../../components/TenantInvoiceModal";
import TenantLeaseModal from "../../components/TenantLeaseModal";
import RateLandlordModal from "../../components/RateLandlordModal";
import { triggerToast } from "../../context/ToastContext";
import "./TenantSearch.css";

const PRESET_WITHDRAWAL_REASONS = [
  "Found another property",
  "Rent price out of budget",
  "Location preference changed",
  "Application process taking too long",
  "Other / Personal reasons"
];

export default function TenantApplications({ setActiveTab }) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rate Landlord Modal State
  const [showRateLandlordModal, setShowRateLandlordModal] = useState(false);
  const [selectedAppToRate, setSelectedAppToRate] = useState(null);

  // Digital Rent Invoice Modal State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedAppId, setSelectedAppId] = useState(null);

  // Digital Lease Modal State
  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [selectedLeaseApp, setSelectedLeaseApp] = useState(null);

  // Move-in Rules Viewer Modal State
  const [showMoveInModal, setShowMoveInModal] = useState(false);
  const [selectedMoveInRules, setSelectedMoveInRules] = useState(null);

  // Inspection Modal & Calendar States
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedAppForInspection, setSelectedAppForInspection] = useState(null);
  const [inspectionForm, setInspectionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "10:00 AM",
    notes: ""
  });
  const [inspectionSubmitting, setInspectionSubmitting] = useState(false);

  const [dismissedMessages, setDismissedMessages] = useState(() => JSON.parse(localStorage.getItem("dismissedLandlordMessages") || "[]"));
  const [expandedAppIds, setExpandedAppIds] = useState([]);

  const handleDismissMessage = (appId) => {
    const newDismissed = [...dismissedMessages, String(appId)];
    setDismissedMessages(newDismissed);
    localStorage.setItem("dismissedLandlordMessages", JSON.stringify(newDismissed));
  };

  const handleOpenInvoiceModal = async (app) => {
    const inv = await invoiceService.getInvoiceByApplicationId(app.id);
    if (inv) {
      setSelectedInvoice(inv);
      setSelectedAppId(app.id);
      setShowInvoiceModal(true);
    } else {
      triggerToast('No digital rent invoice has been generated for this application yet.', 'info', 'Invoice Pending');
    }
  };

  const handleOpenMoveInModal = (app) => {
    const rawRules = localStorage.getItem(`moveInRules_${app.id}`);
    if (rawRules) {
      try {
        const parsed = JSON.parse(rawRules);
        setSelectedMoveInRules(parsed);
        setShowMoveInModal(true);
      } catch (err) {
        console.error(err);
        triggerToast("Could not parse move-in guidelines.", "error");
      }
    } else {
      triggerToast("Move-in guidelines have not been issued yet by the landlord.", "info");
    }
  };

  // Document Upload Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAppForUpload, setSelectedAppForUpload] = useState(null);
  const [documentType, setDocumentType] = useState("Proof of Employment");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  // Application Withdrawal Modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedAppForWithdraw, setSelectedAppForWithdraw] = useState(null);
  const [withdrawalReason, setWithdrawalReason] = useState("Found another property");
  const [customReasonText, setCustomReasonText] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const apps = await applicationService.getMyApplications();
      const withdrawnIds = JSON.parse(localStorage.getItem("withdrawnTenantAppIds") || "[]");
      const validApps = (apps || []).filter(app => !withdrawnIds.includes(String(app.id)));
      setApplications(validApps);
    } catch (e) {
      console.error("Failed to load applications:", e);
      setError("Could not load applications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const [inspections, setInspections] = useState([]);
  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    async function loadInspections() {
      if (typeof inspectionService.getAllInspections === 'function') {
        const data = await inspectionService.getAllInspections();
        setInspections(data || []);
      }
    }
    loadInspections();
  }, [applications]);

  const handleOpenWithdrawModal = (app) => {
    setSelectedAppForWithdraw(app);
    setWithdrawalReason("Found another property");
    setCustomReasonText("");
    setShowWithdrawModal(true);
  };

  const handleConfirmWithdraw = async (e) => {
    if (e) e.preventDefault();
    if (!selectedAppForWithdraw) return;

    setWithdrawing(true);
    
    const finalReason = withdrawalReason === "Other / Personal reasons"
      ? (customReasonText.trim() || "Other / Personal reasons")
      : (withdrawalReason || customReasonText.trim() || "No specific reason provided.");

    try {
      const landlordId = selectedAppForWithdraw.landlordId || selectedAppForWithdraw.landlord_id || 
        (selectedAppForWithdraw.landlordFirstName ? `landlord-${selectedAppForWithdraw.landlordFirstName.toLowerCase().replace(/\s+/g, '-')}` : null);

      if (landlordId) {
        try {
          const userEmail = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
          const rawProf = sessionStorage.getItem("tenantCurrentProfile") || sessionStorage.getItem("currentUserProfile") || (userEmail ? localStorage.getItem("tenantProfile_" + userEmail) : null);
          const prof = rawProf ? JSON.parse(rawProf) : {};
          const tenantName = `${prof.firstName || ''} ${prof.lastName || ''}`.trim() || 'Tenant';

          const messageText = `[APPLICATION WITHDRAWN]\nProperty: ${selectedAppForWithdraw.propertyTitle || 'Property Listing'}\nTenant: ${tenantName}\nReason for Withdrawal: ${finalReason}`;
          await chatService.sendMessage(landlordId, messageText, selectedAppForWithdraw.propertyId, {
            partner_name: selectedAppForWithdraw.landlordFirstName ? `${selectedAppForWithdraw.landlordFirstName} ${selectedAppForWithdraw.landlordLastName || ''}` : "Landlord"
          });
        } catch (chatErr) {
          console.warn("Failed to send withdrawal chat message to landlord:", chatErr);
        }
      }

      await applicationService.withdrawApplication(selectedAppForWithdraw.id, finalReason);

      triggerToast("Application withdrawn and reason sent to landlord.", "info", "Application Withdrawn");
      setApplications(prev => prev.filter(a => String(a.id) !== String(selectedAppForWithdraw.id)));
      setShowWithdrawModal(false);
      setSelectedAppForWithdraw(null);
    } catch (err) {
      console.error("Failed to withdraw application:", err);
      triggerToast(err.message || "Failed to withdraw application.", "error", "Error");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        triggerToast("File size must be under 5MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadFile(event.target.result);
        setUploadFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!uploadFile || !selectedAppForUpload) return;

    setUploading(true);
    try {
      const landlordId = selectedAppForUpload.landlordId || selectedAppForUpload.landlord_id || (selectedAppForUpload.landlordFirstName ? `landlord-${selectedAppForUpload.landlordFirstName.toLowerCase()}` : null);
      
      if (!landlordId) {
        triggerToast("Could not resolve landlord contact for this application.", "error");
        setUploading(false);
        return;
      }

      const messageText = `[DOCUMENT UPLOADED]\nDocument Type: ${documentType}\nFile Name: ${uploadFileName}\nData: ${uploadFile}`;
      await chatService.sendMessage(landlordId, messageText);
      
      triggerToast(`"${uploadFileName}" sent to landlord successfully!`, "success", "Document Uploaded");
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadFileName("");
      
      if (setActiveTab) {
        sessionStorage.setItem("activeChatPartnerId", landlordId);
        setActiveTab(2);
      }
    } catch (err) {
      console.error("Upload document error:", err);
      triggerToast(err?.response?.data?.message || "Failed to send document to landlord.", "error");
    } finally {
      setUploading(false);
    }
  };

  // Handle tenant confirm or request inspection
  const handleTenantInspectionSubmit = async (e, actionType) => {
    if (e) e.preventDefault();
    if (!selectedAppForInspection) return;

    setInspectionSubmitting(true);
    try {
      const existing = inspections.find(i => String(i.applicationId || i.application_id) === String(selectedAppForInspection.id)) || {};
      const landlordId = selectedAppForInspection.landlordId || selectedAppForInspection.landlord_id || (selectedAppForInspection.landlordFirstName ? `landlord-${selectedAppForInspection.landlordFirstName.toLowerCase()}` : "landlord");

      const userEmail = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
      const rawProf = sessionStorage.getItem("tenantCurrentProfile") || sessionStorage.getItem("currentUserProfile") || (userEmail ? localStorage.getItem("tenantProfile_" + userEmail) : null);
      const prof = rawProf ? JSON.parse(rawProf) : {};
      const tenantName = `${prof.firstName || ''} ${prof.lastName || ''}`.trim() || 'Tenant';

      let newStatus = "Confirmed";
      let msgHeader = "[INSPECTION CONFIRMED BY TENANT]";
      
      if (actionType === "request") {
        newStatus = "Requested";
        msgHeader = "[INSPECTION REQUESTED BY TENANT]";
      } else if (actionType === "reschedule") {
        newStatus = "Reschedule Requested";
        msgHeader = "[TENANT REQUESTED INSPECTION RESCHEDULE]";
      }

      inspectionService.saveInspection(selectedAppForInspection.id, {
        propertyId: selectedAppForInspection.propertyId,
        propertyTitle: selectedAppForInspection.propertyTitle,
        landlordId: landlordId,
        landlordName: selectedAppForInspection.landlordFirstName ? `${selectedAppForInspection.landlordFirstName} ${selectedAppForInspection.landlordLastName || ''}` : "Landlord",
        tenantId: selectedAppForInspection.tenantId || "tenant",
        tenantName: tenantName,
        date: inspectionForm.date || existing.date || new Date().toISOString().split("T")[0],
        time: inspectionForm.time || existing.time || "10:00 AM",
        location: existing.location || selectedAppForInspection.propertyAddress || selectedAppForInspection.propertyTitle || "On-site",
        notes: inspectionForm.notes || existing.notes || "",
        status: newStatus,
        createdBy: "tenant"
      });

      // Refresh inspections
      const data = await inspectionService.getAllInspections();
      setInspections(data || []);

      // Send chat notification to landlord
      if (landlordId) {
        const msg = `${msgHeader}\nProperty: ${selectedAppForInspection.propertyTitle}\nProposed Date: ${inspectionForm.date || existing.date}\nTime: ${inspectionForm.time || existing.time}${inspectionForm.notes ? `\nNote from tenant: ${inspectionForm.notes}` : ''}`;
        await chatService.sendMessage(landlordId, msg, selectedAppForInspection.propertyId, {
          partner_name: selectedAppForInspection.landlordFirstName ? `${selectedAppForInspection.landlordFirstName} ${selectedAppForInspection.landlordLastName || ''}` : "Landlord"
        });
      }

      triggerToast(`Inspection appointment ${newStatus.toLowerCase()} successfully!`, "success");
      setShowInspectionModal(false);
      setSelectedAppForInspection(null);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to process inspection booking", "error");
    } finally {
      setInspectionSubmitting(false);
    }
  };

  const filteredApps = applications.filter(app => 
    app.propertyTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-full pb-20 text-left">
      {/* Top Header */}
      <header className="mb-6 bg-white dark:bg-[#192A1F] border border-black/5 dark:border-white/5 shadow-sm rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1C1917] dark:text-white tracking-tight">My Applications</h1>
          <p className="text-sm font-medium text-[#71717A] dark:text-[#A3BCA7] mt-1">Track your tenancy journey, inspect properties, sign leases, and handle payments.</p>
        </div>
        <button
          onClick={() => setShowCalendarModal(true)}
          className="px-6 py-3 bg-[#1E3324] dark:bg-[#E5C583] text-white dark:text-[#09090b] font-bold text-xs rounded-xl shadow-sm hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer w-fit"
        >
          <Calendar className="h-4 w-4" /> View Schedule Calendar
        </button>
      </header>

      <div className="mb-6 max-w-md">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A]" />
              <input
                type="text"
                className="w-full h-10 pl-10 pr-4 rounded-md border border-[#E7E5E0] dark:border-white/15 bg-white dark:bg-[#14221B] text-sm text-[#1C1917] dark:text-white placeholder:text-[#71717A] focus:border-[#2C4633] dark:focus:border-[#E5C583] outline-none transition-colors"
                placeholder="Search by property or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#71717A] dark:text-white/60">
            <Loader2 className="h-7 w-7 animate-spin text-[#2C4633] dark:text-[#E5C583]" />
            <span className="text-sm font-medium">Loading your applications...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 rounded-md border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 max-w-md mx-auto my-8">
            <AlertTriangle className="h-10 w-10 text-red-600 mb-3" />
            <h3 className="font-semibold text-[#1C1917] dark:text-white mb-1">Failed to load applications</h3>
            <p className="text-xs text-red-700 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={loadApplications}
              className="flex items-center gap-2 px-4 py-2 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0C1410] text-xs font-medium rounded-md hover:bg-[#1E3324] transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" /> Try Again
            </button>
          </div>
        ) : filteredApps.length > 0 ? (
          <div className="space-y-6">
            {filteredApps.map(app => {
              const currentInspection = inspections.find(i => String(i.applicationId || i.application_id) === String(app.id));

              // Check lifecycle stages stored in local storage
              const sentInvoiceIds = JSON.parse(localStorage.getItem("sentInvoiceAppIds") || "[]");
              const paidProofIds = JSON.parse(localStorage.getItem("paidProofAppIds") || "[]");
              const verifiedPaidIds = JSON.parse(localStorage.getItem("verifiedPaidAppIds") || "[]");
              const sentLeaseIds = JSON.parse(localStorage.getItem("sentLeaseAppIds") || "[]");
              const signedLeaseIds = JSON.parse(localStorage.getItem("signedLeaseAppIds") || "[]");
              const leasedIds = JSON.parse(localStorage.getItem("leasedAppIds") || "[]");

              let effectiveStatus = app.status || "pending";
              if (leasedIds.includes(String(app.id))) effectiveStatus = "move_in_ready";
              else if (signedLeaseIds.includes(String(app.id))) effectiveStatus = "lease_signed";
              else if (sentLeaseIds.includes(String(app.id))) effectiveStatus = "lease_sent";
              else if (verifiedPaidIds.includes(String(app.id))) effectiveStatus = "rent_paid";
              else if (paidProofIds.includes(String(app.id))) effectiveStatus = "payment_submitted";
              else if (sentInvoiceIds.includes(String(app.id))) effectiveStatus = "invoice_sent";

              const isLeased = effectiveStatus === "move_in_ready" || effectiveStatus === "leased" || effectiveStatus === "Leased" || app.status?.toLowerCase() === "leased";
              const isLockedFromWithdrawal = effectiveStatus !== "pending" && effectiveStatus !== "Pending";

              // Timeline Stage Index: 1 = Submitted, 2 = Under Review / Invoiced, 3 = Lease Signed / Leased
              let stageStep = 1;
              if (isLeased || effectiveStatus === "lease_signed" || effectiveStatus === "lease_sent") stageStep = 3;
              else if (effectiveStatus === "invoice_sent" || effectiveStatus === "payment_submitted" || effectiveStatus === "rent_paid" || effectiveStatus === "Under Review") stageStep = 2;

              return (
                <div key={app.id} className="p-6 rounded-3xl border border-[#E7E5E0] dark:border-white/10 bg-white dark:bg-[#14221B] flex flex-col gap-5 transition-all">
                  {/* Top Bar: Property Title & Badge */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#E7E5E0] dark:border-white/10">
                    <div>
                      <h3
                        className="text-lg font-bold text-[#1C1917] dark:text-white cursor-pointer hover:text-[#2C4633] dark:hover:text-[#E5C583] transition-colors"
                        onClick={() => navigate(`/listings/${app.propertyId}`)}
                      >
                        {app.propertyTitle || `Property #${app.propertyId}`}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-[#71717A] dark:text-white/60 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> Applied: {app.date}
                        </span>
                        {app.landlordFirstName && (
                          <span className="font-medium text-[#2C4633] dark:text-[#E5C583]">
                            Landlord: {app.landlordFirstName} {app.landlordLastName || ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 text-xs font-medium rounded uppercase tracking-wider ${
                      isLeased ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40' :
                      effectiveStatus === 'Rejected' || effectiveStatus === 'declined' ? 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/40' :
                      'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40'
                    }`}>
                      {isLeased ? 'Leased • Active' : effectiveStatus.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* RICH VERTICAL APPLICATION TIMELINE JOURNEY */}
                  {(() => {
                    const step1_done = true;
                    const step2_done = Boolean(currentInspection || stageStep >= 2 || isLeased);
                    const step3_done = Boolean(effectiveStatus === "payment_submitted" || effectiveStatus === "rent_paid" || stageStep >= 3 || isLeased);
                    const step4_done = Boolean(effectiveStatus === "lease_signed" || effectiveStatus === "move_in_ready" || isLeased);
                    const step5_done = Boolean(effectiveStatus === "move_in_ready" || isLeased);
                    
                    let activeStepNum = 1;
                    let activeStepTitle = "Application Submitted & Profile Sync";
                    if (step5_done) {
                      activeStepNum = 5;
                      activeStepTitle = "Move-in & Key Handover (Completed)";
                    } else if (step4_done) {
                      activeStepNum = 5;
                      activeStepTitle = "Move-in & Key Handover";
                    } else if (step3_done) {
                      activeStepNum = 4;
                      activeStepTitle = "Digital Lease & Agreement Signing";
                    } else if (step2_done) {
                      activeStepNum = 3;
                      activeStepTitle = "Rent Invoice & Payment Verification";
                    } else {
                      activeStepNum = 2;
                      activeStepTitle = "Landlord Review & Walkthrough Inspection";
                    }

                    const isExpanded = expandedAppIds.includes(app.id);

                    return (
                      <>
                        {!isExpanded ? (
                          <div 
                            onClick={() => setExpandedAppIds(prev => [...prev, app.id])}
                            className="flex items-center justify-between p-4 bg-stone-50 dark:bg-[#0C1410]/50 rounded-[24px] border border-stone-200 dark:border-white/10 cursor-pointer hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0C1410] flex items-center justify-center font-bold text-sm shadow-sm">
                                {activeStepNum}
                              </div>
                              <div className="text-left">
                                <p className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-0.5">Active Stage</p>
                                <h4 className="text-sm font-bold text-[#1C1917] dark:text-white">{activeStepTitle}</h4>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-stone-400" />
                          </div>
                        ) : (
                          <div className="bg-[#FAF8F5] dark:bg-[#0C1410] p-5 rounded-[24px] border border-[#E7E5E0] dark:border-white/5 mt-0 mb-2 relative">
                            <button 
                              onClick={() => setExpandedAppIds(prev => prev.filter(id => id !== app.id))}
                              className="absolute top-5 right-5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 bg-white dark:bg-white/5 rounded-full shadow-sm transition-colors cursor-pointer"
                            >
                              <ChevronUp className="h-5 w-5" />
                            </button>
                            <h4 className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-6 ml-6 mt-1">Full Timeline Journey</h4>
                            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E7E5E0] dark:before:bg-white/10">
                              
                              {/* STEP 1: Application Submitted */}
                          <div className="relative flex items-start gap-4">
                            <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${step1_done ? 'bg-[#2C4633] text-white dark:bg-[#E5C583] dark:text-[#0C1410]' : 'bg-stone-200 text-[#71717A]'}`}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <h4 className="text-xs font-semibold text-[#1C1917] dark:text-white">1. Application Submitted & Profile Sync</h4>
                                <span className="text-[11px] text-[#71717A] dark:text-white/50">{app.date}</span>
                              </div>
                              <p className="text-xs text-[#71717A] dark:text-white/60 mt-0.5">Encrypted NIN profile credentials and guarantor details submitted to landlord.</p>
                            </div>
                          </div>

                          {/* STEP 2: Landlord Screening & Walkthrough Inspection */}
                          <div className="relative flex items-start gap-4">
                            <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${step2_done ? 'bg-[#2C4633] text-white dark:bg-[#E5C583] dark:text-[#0C1410]' : step1_done ? 'border-2 border-[#2C4633] bg-white text-[#2C4633] dark:border-[#E5C583] dark:bg-[#14221B] dark:text-[#E5C583]' : 'bg-stone-200 text-[#71717A]'}`}>
                              {step2_done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Calendar className="h-3 w-3" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <h4 className="text-xs font-semibold text-[#1C1917] dark:text-white">2. Landlord Review & Walkthrough Inspection</h4>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider ${step2_done ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                                  {step2_done ? 'Verified' : 'Active Stage'}
                                </span>
                              </div>
                              <p className="text-xs text-[#71717A] dark:text-white/60 mt-0.5">
                                {currentInspection ? `Walkthrough scheduled for ${currentInspection.date} at ${currentInspection.time}` : 'Schedule an on-site or virtual walkthrough inspection with the landlord.'}
                              </p>
                              {!isLeased && (
                                <div className="mt-2">
                                  <button
                                    onClick={() => {
                                      setSelectedAppForInspection(app);
                                      setInspectionForm({
                                        date: currentInspection?.date || new Date().toISOString().split("T")[0],
                                        time: currentInspection?.time || "10:00 AM",
                                        notes: ""
                                      });
                                      setShowInspectionModal(true);
                                    }}
                                    className="px-3 py-1 bg-white dark:bg-[#14221B] border border-[#E7E5E0] dark:border-white/15 text-[#1C1917] dark:text-white hover:border-[#2C4633] font-medium text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer w-fit"
                                  >
                                    <Calendar className="h-3.5 w-3.5 text-[#2C4633] dark:text-[#E5C583]" />
                                    {currentInspection ? 'Manage Walkthrough Slot' : 'Book Walkthrough Slot'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* STEP 3: Rent Invoice & Security Deposit */}
                          <div className="relative flex items-start gap-4">
                            <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${step3_done ? 'bg-[#2C4633] text-white dark:bg-[#E5C583] dark:text-[#0C1410]' : effectiveStatus === 'invoice_sent' ? 'border-2 border-[#2C4633] bg-white text-[#2C4633] dark:border-[#E5C583] dark:bg-[#14221B] dark:text-[#E5C583] animate-pulse' : 'bg-stone-200 text-[#71717A]'}`}>
                              {step3_done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <FileText className="h-3 w-3" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <h4 className="text-xs font-semibold text-[#1C1917] dark:text-white">3. Rent Invoice & Payment Verification</h4>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider ${step3_done ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' : effectiveStatus === 'invoice_sent' ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-stone-100 text-stone-500'}`}>
                                  {step3_done ? 'Confirmed' : effectiveStatus === 'invoice_sent' ? 'Invoice Issued' : 'Awaiting Invoice'}
                                </span>
                              </div>
                              <p className="text-xs text-[#71717A] dark:text-white/60 mt-0.5">
                                {effectiveStatus === 'rent_paid' ? 'Rent payment verified by landlord.' : effectiveStatus === 'payment_submitted' ? 'Payment receipt uploaded. Landlord verifying...' : effectiveStatus === 'invoice_sent' ? 'Rent invoice issued by landlord.' : 'Landlord will generate rent invoice once application review is complete.'}
                              </p>
                              {(effectiveStatus === 'invoice_sent' || effectiveStatus === 'payment_submitted' || effectiveStatus === 'rent_paid') && !isLeased && (
                                <div className="mt-2">
                                  <button
                                    onClick={() => handleOpenInvoiceModal(app)}
                                    className="px-3 py-1.5 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0C1410] font-medium text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer w-fit"
                                  >
                                    <FileText className="h-3.5 w-3.5" /> View Invoice & Pay
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* STEP 4: Tenancy Agreement & Digital Signature */}
                          <div className="relative flex items-start gap-4">
                            <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${step4_done ? 'bg-[#2C4633] text-white dark:bg-[#E5C583] dark:text-[#0C1410]' : effectiveStatus === 'lease_sent' ? 'border-2 border-[#2C4633] bg-white text-[#2C4633] dark:border-[#E5C583] dark:bg-[#14221B] dark:text-[#E5C583] animate-pulse' : 'bg-stone-200 text-[#71717A]'}`}>
                              {step4_done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3 w-3" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <h4 className="text-xs font-semibold text-[#1C1917] dark:text-white">4. Tenancy Lease Agreement</h4>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider ${step4_done ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' : effectiveStatus === 'lease_sent' ? 'bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300' : 'bg-stone-100 text-stone-500'}`}>
                                  {step4_done ? 'Signed' : effectiveStatus === 'lease_sent' ? 'Ready to Sign' : 'Pending Step 3'}
                                </span>
                              </div>
                              <p className="text-xs text-[#71717A] dark:text-white/60 mt-0.5">
                                {step4_done ? 'Lease agreement signed digitally.' : effectiveStatus === 'lease_sent' ? 'Your lease agreement has been drafted and is ready for your signature.' : 'Drafted automatically after rent payment verification.'}
                              </p>
                              {effectiveStatus === 'lease_sent' && !isLeased && (
                                <div className="mt-2">
                                  <button
                                    onClick={() => {
                                      setSelectedLeaseApp(app);
                                      setShowLeaseModal(true);
                                    }}
                                    className="px-3 py-1.5 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0C1410] font-medium text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer w-fit"
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5" /> Review & Sign Lease Contract
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* STEP 5: Key Pickup & Move-In Guidelines */}
                          <div className="relative flex items-start gap-4">
                            <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${step5_done ? 'bg-[#2C4633] text-white dark:bg-[#E5C583] dark:text-[#0C1410]' : 'bg-stone-200 text-[#71717A]'}`}>
                              {step5_done ? <Key className="h-3.5 w-3.5" /> : <Lock className="h-3 w-3" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <h4 className="text-xs font-semibold text-[#1C1917] dark:text-white">5. Key Handover & House Guidelines</h4>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider ${step5_done ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-stone-100 text-stone-500'}`}>
                                  {step5_done ? 'Move-In Ready' : 'Pending Step 4'}
                                </span>
                              </div>
                              <p className="text-xs text-[#71717A] dark:text-white/60 mt-0.5">
                                {step5_done ? 'Congratulations! Property key pickup schedule and tenant house rules are available.' : 'Key handover details unlocked upon contract signature.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                          )}
                      </>
                    );
                  })()}

                  {/* LIFECYCLE STAGE BANNER */}
                  {effectiveStatus === "invoice_sent" && (
                    <div className="my-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                      <span className="font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        <FileText className="h-3.5 w-3.5" /> Rent Invoice Issued
                      </span>
                      <p className="text-xs leading-relaxed">
                        Landlord has issued your rent invoice. Please view invoice details and upload your payment receipt.
                      </p>
                    </div>
                  )}

                  {effectiveStatus === "payment_submitted" && (
                    <div className="my-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                      <span className="font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider text-blue-700 dark:text-blue-400">
                        <Clock className="h-3.5 w-3.5" /> Payment Proof Submitted
                      </span>
                      <p className="text-xs leading-relaxed">
                        Your payment receipt has been uploaded. Awaiting landlord verification to generate your lease agreement.
                      </p>
                    </div>
                  )}

                  {effectiveStatus === "rent_paid" && (
                    <div className="my-2 p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                      <span className="font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Payment Verified
                      </span>
                      <p className="text-xs leading-relaxed">
                        Rent payment confirmed! Landlord is currently drafting your official residential lease agreement.
                      </p>
                    </div>
                  )}

                  {effectiveStatus === "lease_sent" && (
                    <div className="my-2 p-3 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-200 space-y-1">
                      <span className="font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider text-purple-700 dark:text-purple-400">
                        <ShieldCheck className="h-3.5 w-3.5" /> Lease Agreement Ready
                      </span>
                      <p className="text-xs leading-relaxed">
                        Your lease contract is ready for digital signature! Please review and sign below.
                      </p>
                    </div>
                  )}

                  {effectiveStatus === "lease_signed" && (
                    <div className="my-2 p-3 rounded-md bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                      <span className="font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Lease Digitally Signed
                      </span>
                      <p className="text-xs leading-relaxed">
                        Signed successfully! Landlord is scheduling key pickup and issuing house rules.
                      </p>
                    </div>
                  )}

                  {effectiveStatus === "move_in_ready" && (
                    <div className="my-2 p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                      <span className="font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        <Key className="h-3.5 w-3.5" /> Move-in Ready & Leased!
                      </span>
                      <p className="text-xs leading-relaxed">
                        Congratulations! Your key handover appointment and house rules are now available.
                      </p>
                    </div>
                  )}

                  {/* Latest Landlord Request / Message */}
                  {app.lastMessage && !dismissedMessages.includes(String(app.id)) && (
                    <div 
                      onClick={() => {
                        handleDismissMessage(app.id);
                        sessionStorage.setItem("activeChatLandlordName", app.landlord_name || app.propertyTitle || "Landlord");
                        if (typeof setActiveTab === "function") setActiveTab(2);
                      }}
                      className="my-2 p-2.5 rounded-lg bg-neutral-50 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs text-ink-600 dark:text-cream-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors shadow-sm"
                    >
                      <div className="font-semibold flex items-center gap-1.5 mb-1 text-[10.5px] uppercase tracking-widest text-ink-500 dark:text-cream-100/50">
                        <MessageSquare className="h-3 w-3" /> New Message
                      </div>
                      <p className="italic line-clamp-1">{app.lastMessage}</p>
                    </div>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-[#E7E5E0] dark:border-white/10 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isLeased ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedAppToRate(app);
                              setShowRateLandlordModal(true);
                            }}
                            className="px-3 py-1.5 bg-[#FAF8F5] dark:bg-[#0C1410] border border-[#E7E5E0] dark:border-white/15 text-[#1C1917] dark:text-white font-medium text-xs rounded-md hover:border-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Rate Landlord
                          </button>

                          <button
                            onClick={() => {
                              sessionStorage.setItem("activeChatLandlord", JSON.stringify({
                                id: app.landlordId || "landlord_1",
                                name: `${app.landlordFirstName || 'Landlord'} ${app.landlordLastName || ''}`.trim(),
                                propertyTitle: app.propertyTitle
                              }));
                              if (setActiveTab) setActiveTab(2);
                            }}
                            className="px-3 py-1.5 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0C1410] font-medium text-xs rounded-md hover:bg-[#1E3324] transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Chat Landlord
                          </button>
                        </>
                      ) : (
                        <>
                          {/* DYNAMIC PRIMARY STAGE BUTTON */}
                          {effectiveStatus === "lease_sent" && (
                            <button
                              onClick={() => {
                                setSelectedLeaseApp(app);
                                setShowLeaseModal(true);
                              }}
                              className="px-3 py-1.5 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0C1410] font-medium text-xs rounded-md hover:bg-[#1E3324] transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" /> Review & Sign Lease
                            </button>
                          )}

                          {(effectiveStatus === "invoice_sent" || effectiveStatus === "payment_submitted" || effectiveStatus === "rent_paid") && (
                            <button
                              onClick={() => handleOpenInvoiceModal(app)}
                              className="px-3 py-1.5 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0C1410] font-medium text-xs rounded-md hover:bg-[#1E3324] transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileText className="h-3.5 w-3.5" /> View Invoice & Pay
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedAppForUpload(app);
                              setShowUploadModal(true);
                            }}
                            className="px-3 py-1.5 bg-white dark:bg-[#14221B] border border-[#E7E5E0] dark:border-white/15 text-[#1C1917] dark:text-white font-medium text-xs rounded-md hover:border-[#2C4633] transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5 text-[#71717A]" /> Upload Doc
                          </button>

                          <button
                            onClick={() => {
                              sessionStorage.setItem("activeChatLandlord", JSON.stringify({
                                id: app.landlordId || "landlord_1",
                                name: `${app.landlordFirstName || 'Landlord'} ${app.landlordLastName || ''}`.trim(),
                                propertyTitle: app.propertyTitle
                              }));
                              if (setActiveTab) setActiveTab(2);
                            }}
                            className="px-3 py-1.5 bg-white dark:bg-[#14221B] border border-[#E7E5E0] dark:border-white/15 text-[#1C1917] dark:text-white font-medium text-xs rounded-md hover:border-[#2C4633] transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-[#71717A]" /> Chat Landlord
                          </button>

                          {/* WITHDRAW BUTTON (LOCKED IF LANDLORD PROCEEDED) */}
                          {isLockedFromWithdrawal ? (
                            <button
                              disabled
                              title="Application in active review/lease stage and cannot be withdrawn."
                              className="px-3 py-1.5 bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-400 font-medium text-xs rounded-md flex items-center gap-1 cursor-not-allowed opacity-60"
                            >
                              <Lock className="h-3.5 w-3.5" /> Locked
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedAppForWithdraw(app);
                                setShowWithdrawModal(true);
                              }}
                              className="px-3 py-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 font-medium text-xs rounded-md hover:bg-red-100 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Withdraw
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#07130D]/50 my-2">
            <div className="mb-3 flex justify-center"><FileText className="h-8 w-8 text-moss-600/50 dark:text-[#E5C583]/50" /></div>
            <h4 className="font-bold text-[15px] text-ink-900 dark:text-white mb-1">
              {searchQuery ? "No matching applications found." : "No applications yet"}
            </h4>
            <p className="text-[13px] text-[#6C6E73] dark:text-[#A3BCA7] max-w-sm mx-auto mb-5 leading-relaxed">
              {searchQuery ? "Try adjusting your search terms." : "When you apply for properties, they will appear here so you can track their status."}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setActiveTab(1)}
                className="bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] text-[12.5px] font-bold px-5 py-2.5 rounded-xl"
              >
                Browse Properties
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modal: Book / Confirm / Manage Property Inspection */}
      {showInspectionModal && selectedAppForInspection && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#07130D] rounded-3xl max-w-md w-full p-6 shadow-xl border border-neutral-200 dark:border-neutral-800 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-base text-ink-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-moss-600 dark:text-[#E5C583]" /> Property Inspection Appointment
              </h3>
              <button onClick={() => setShowInspectionModal(false)} className="text-ink-400 hover:text-ink-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            {(() => {
              const activeInsp = inspections.find(i => String(i.applicationId || i.application_id) === String(selectedAppForInspection.id));

              if (activeInsp && activeInsp.status === "Scheduled") {
                return (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs space-y-1.5">
                      <span className="font-bold text-amber-900 dark:text-amber-200 block text-sm">
                        Landlord Scheduled an Inspection
                      </span>
                      <p className="text-ink-700 dark:text-cream-100/80">
                        Date: <strong>{activeInsp.date}</strong> at <strong>{activeInsp.time}</strong>
                      </p>
                      <p className="text-ink-700 dark:text-cream-100/80">
                        Location: <strong>{activeInsp.location}</strong>
                      </p>
                      {activeInsp.notes && <p className="italic text-ink-600 dark:text-cream-100/70 pt-1 border-t border-amber-200/60">"{activeInsp.notes}"</p>}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-white/10">
                      <button
                        type="button"
                        onClick={(e) => handleTenantInspectionSubmit(e, "reschedule")}
                        disabled={inspectionSubmitting}
                        className="px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 rounded-xl cursor-pointer"
                      >
                        Request Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleTenantInspectionSubmit(e, "confirm")}
                        disabled={inspectionSubmitting}
                        className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-sm"
                      >
                        {inspectionSubmitting ? "Confirming..." : "Confirm Inspection Slot ✓"}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <form onSubmit={(e) => handleTenantInspectionSubmit(e, "request")} className="space-y-4">
                  <p className="text-xs text-ink-600 dark:text-cream-100/70">
                    Propose your preferred inspection date & time for <strong>{selectedAppForInspection.propertyTitle}</strong>:
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Preferred Date</label>
                      <input
                        type="date"
                        required
                        value={inspectionForm.date}
                        onChange={(e) => setInspectionForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full rounded-xl border border-neutral-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-cream-50 dark:bg-[#07130D] outline-none focus:border-moss-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Preferred Time</label>
                      <select
                        value={inspectionForm.time}
                        onChange={(e) => setInspectionForm(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full rounded-xl border border-neutral-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-cream-50 dark:bg-[#07130D] outline-none focus:border-moss-600"
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
                    <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Message to Landlord (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Would love to inspect the property on Saturday morning..."
                      value={inspectionForm.notes}
                      onChange={(e) => setInspectionForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full rounded-xl border border-neutral-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-cream-50 dark:bg-[#07130D] outline-none focus:border-moss-600 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowInspectionModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-cream-100 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inspectionSubmitting}
                      className="px-5 py-2 text-xs font-bold bg-moss-600 hover:bg-moss-700 text-white rounded-xl disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {inspectionSubmitting ? "Requesting..." : "Send Inspection Request"}
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* SCHEDULE CALENDAR MODAL */}
      <InspectionCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        userRole="tenant"
        setActiveTab={setActiveTab}
      />

      {/* Modal: Withdraw Application with Reason */}
      {showWithdrawModal && selectedAppForWithdraw && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#07130D] rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 dark:border-neutral-800 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-base text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Withdraw Application
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-ink-400 hover:text-ink-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <p className="text-xs text-ink-600 dark:text-cream-100/70 leading-relaxed">
              Are you sure you want to withdraw your application for <strong>{selectedAppForWithdraw.propertyTitle}</strong>? Please provide a reason so the landlord is informed.
            </p>

            <form onSubmit={handleConfirmWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-2">Select Reason for Withdrawal</label>
                <div className="space-y-1.5">
                  {PRESET_WITHDRAWAL_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        withdrawalReason === reason
                          ? "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200"
                          : "bg-neutral-50 dark:bg-white/5 border-neutral-200 dark:border-neutral-800 text-ink-800 dark:text-cream-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="withdrawalReason"
                        value={reason}
                        checked={withdrawalReason === reason}
                        onChange={() => setWithdrawalReason(reason)}
                        className="accent-rose-600 cursor-pointer"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">
                  Additional Details / Note for Landlord {withdrawalReason === "Other / Personal reasons" && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  required={withdrawalReason === "Other / Personal reasons"}
                  placeholder="Explain why you are withdrawing your application..."
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-cream-50/50 dark:bg-[#07130D] p-3 text-xs text-ink-900 dark:text-white outline-none focus:border-rose-500 transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-cream-100 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawing || (withdrawalReason === "Other / Personal reasons" && !customReasonText.trim())}
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {withdrawing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Withdrawing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" /> Confirm & Send to Landlord
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Requested Document */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#07130D] rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 dark:border-neutral-800 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-base text-ink-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-moss-600" /> Upload Requested Document
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-ink-400 hover:text-ink-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <p className="text-xs text-ink-600 dark:text-cream-100/70">
              Upload a document for <strong>{selectedAppForUpload?.propertyTitle}</strong>. The landlord will receive it immediately in your chat thread.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Document Category</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-cream-50 dark:bg-[#07130D] p-2.5 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600"
                >
                  <option value="Proof of Employment / Payslip">Proof of Employment / Payslip</option>
                  <option value="Government ID / NIN Verification">Government ID / NIN Verification</option>
                  <option value="Bank Statement">Bank Statement (6 Months)</option>
                  <option value="Guarantor Proof">Guarantor Document / Letter</option>
                  <option value="Other Document">Other Requested Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Select File (PDF or Image, max 5MB)</label>
                <input
                  type="file"
                  required
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full text-xs text-ink-600 dark:text-cream-100/70 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-moss-100 file:text-moss-800 dark:file:bg-moss-900/50 dark:file:text-moss-300 hover:file:bg-moss-200 cursor-pointer"
                />
              </div>

              {uploadFileName && (
                <div className="p-3 bg-moss-50 dark:bg-white/10 border border-moss-200 dark:border-white/10 rounded-xl text-xs text-moss-900 dark:text-moss-300 font-medium truncate">
                  Attached: <strong>{uploadFileName}</strong>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-ink-600 dark:text-cream-100 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-5 py-2 text-xs font-bold bg-moss-600 hover:bg-moss-700 text-white rounded-xl disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...
                    </>
                  ) : (
                    "Upload & Send to Landlord"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Rent Invoice Modal */}
      <TenantInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        invoice={selectedInvoice}
        applicationId={selectedAppId}
        onSuccess={() => {
          loadApplications();
        }}
      />

      {/* Digital Lease Modal */}
      <TenantLeaseModal
        isOpen={showLeaseModal}
        onClose={() => setShowLeaseModal(false)}
        application={selectedLeaseApp}
        onSuccess={() => {
          loadApplications();
        }}
      />

      {/* Move-in Rules & Key Pickup Modal */}
      {showMoveInModal && selectedMoveInRules && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#07130D] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/10 pb-3">
              <h3 className="font-black text-base text-ink-900 dark:text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-emerald-600 dark:text-[#E5C583]" /> Move-in Rules & Key Handover Details
              </h3>
              <button onClick={() => setShowMoveInModal(false)} className="text-ink-400 hover:text-ink-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                <h4 className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Key Pickup Appointment
                </h4>
                <p className="text-ink-800 dark:text-cream-100 font-semibold">
                  Date: <strong>{selectedMoveInRules.moveInDate}</strong> at <strong>{selectedMoveInRules.keyPickupTime}</strong>
                </p>
                <p className="text-ink-800 dark:text-cream-100 font-semibold">
                  Location: <strong>{selectedMoveInRules.keyPickupLocation}</strong>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <h4 className="font-extrabold text-ink-900 dark:text-white flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-moss-600" /> House Rules & Policies
                </h4>
                <div className="p-3 bg-white dark:bg-[#07130D] rounded-xl border border-neutral-200 dark:border-neutral-800 font-mono text-[11px] whitespace-pre-line leading-relaxed text-ink-800 dark:text-cream-100">
                  {selectedMoveInRules.houseRules}
                </div>
              </div>

              {selectedMoveInRules.additionalNotes && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 space-y-1">
                  <span className="font-bold block text-[11px]">Additional Key / Utility Notes:</span>
                  <p className="italic">{selectedMoveInRules.additionalNotes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-100 dark:border-white/10">
              <button
                onClick={() => setShowMoveInModal(false)}
                className="px-5 py-2 text-xs font-bold bg-moss-600 text-white rounded-xl cursor-pointer"
              >
                Close Guidelines
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Landlord Modal */}
      {showRateLandlordModal && selectedAppToRate && (() => {
        const userEmail = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
        const rawProf = sessionStorage.getItem("tenantCurrentProfile") || sessionStorage.getItem("currentUserProfile") || (userEmail ? localStorage.getItem("tenantProfile_" + userEmail) : null);
        const prof = rawProf ? JSON.parse(rawProf) : {};
        const tenantName = `${prof.firstName || ''} ${prof.lastName || ''}`.trim() || userEmail || "Tenant";

        const landlordId = selectedAppToRate.landlordId || selectedAppToRate.landlord_id || (selectedAppToRate.landlordFirstName ? `landlord-${selectedAppToRate.landlordFirstName.toLowerCase()}` : "landlord");
        const landlordName = selectedAppToRate.landlordFirstName ? `${selectedAppToRate.landlordFirstName} ${selectedAppToRate.landlordLastName || ''}` : "Landlord";

        return (
          <RateLandlordModal
            isOpen={showRateLandlordModal}
            onClose={() => setShowRateLandlordModal(false)}
            landlordId={landlordId}
            landlordName={landlordName}
            tenantId={sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId") || userEmail || "tenant"}
            tenantName={tenantName}
            propertyTitle={selectedAppToRate.propertyTitle || ""}
            onSuccess={() => loadApplications()}
          />
        );
      })()}
    </div>
  );
}


