import React, { useState, useEffect } from "react";
import { applicationService } from "../../../services/applicationService";
import { chatService } from "../../../services/chatService";
import { leaseService } from "../../../services/leaseService";
import Avatar from "../../../components/Avatar";
import LeaseBuilderModal from "../../../components/LeaseBuilderModal";
import { 
  CheckCircle2, XCircle, FileText, Briefcase, 
  Wallet, ShieldCheck, Mail, MapPin, Calendar, ExternalLink, MessageSquare
} from "lucide-react";
import { triggerToast } from "../../../context/ToastContext";

export default function LandlordApplications({ setActiveTab }) {
  const [applications, setApplications] = useState([]);
  const [activeApplicantId, setActiveApplicantId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const openLeaseSetup = () => {
    if (!activeApp) return;
    setLeaseForm({
      startDate: new Date().toISOString().split('T')[0],
      duration: "1_year",
      rentAmount: activeApp.propertyRentAmount || "",
      rentPeriod: activeApp.propertyRentPeriod || "annually",
      securityDeposit: "",
      customClauses: "",
      includePets: false,
      includeSmoking: false,
      includeLateFee: true
    });
    setShowLeaseSetupModal(true);
  };

  const handleGenerateLease = async (e) => {
    e.preventDefault();
    if (!activeApp) return;
    setIsSubmitting(true);
    try {
      const start = new Date(leaseForm.startDate);
      let end = new Date(start);
      if (leaseForm.duration === "1_month") {
        end.setMonth(end.getMonth() + 1);
      } else if (leaseForm.duration === "6_months") {
        end.setMonth(end.getMonth() + 6);
      } else {
        end.setFullYear(end.getFullYear() + 1);
      }

      await leaseService.generateLease({
        propertyId: activeApp.propertyId,
        tenantId: activeApp.tenantId,
        applicationId: activeApp.id,
        startDate: leaseForm.startDate,
        endDate: end.toISOString().split('T')[0],
        rentAmount: leaseForm.rentAmount,
        rentPeriod: leaseForm.rentPeriod,
        securityDeposit: leaseForm.securityDeposit || 0,
        customClauses: leaseForm.customClauses,
        includePets: leaseForm.includePets,
        includeSmoking: leaseForm.includeSmoking,
        includeLateFee: leaseForm.includeLateFee
      });
      triggerToast("Lease generated successfully and sent to tenant!", "success");
      setShowLeaseSetupModal(false);
      fetchApplications();
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.error || "Failed to generate lease", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const apps = await applicationService.getLandlordApplications();
      setApplications(apps);
      if (apps.length > 0 && !activeApplicantId) {
        setActiveApplicantId(apps[0].id);
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
      triggerToast("Failed to update application", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [customRequestText, setCustomRequestText] = useState("");

  const initiateChat = async (app, initialMessage = null) => {
    try {
      const recipientId = app.tenantId || app.tenant_id || app.tenant?.id;
      if (!recipientId) {
        triggerToast("Unable to resolve applicant recipient ID.", "error");
        return;
      }
      const tenantName = `${app.tenant?.firstName || ''} ${app.tenant?.lastName || ''}`.trim() || "Applicant";
      const msg = initialMessage || `Hello ${app.tenant?.firstName || ''}, I am reviewing your application for ${app.propertyTitle}.`;
      await chatService.sendMessage(recipientId, msg, app.propertyId, {
        partner_name: tenantName,
        partner_avatar: app.tenant?.avatar || ""
      });
      sessionStorage.setItem("activeChatPartnerId", recipientId);
      localStorage.setItem("activeChatPartnerId", recipientId);
      localStorage.setItem("activeChatTenantName", tenantName);
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
    const tenantName = `${activeApp.tenant?.firstName || ''} ${activeApp.tenant?.lastName || ''}`.trim() || "Applicant";
    const message = `[LANDLORD REQUEST FOR ${activeApp.propertyTitle}]\nRequesting: ${requestTitle}${requestDetails ? `\nDetails: ${requestDetails}` : ''}\n\nPlease reply or upload the requested documents here.`;
    try {
      await chatService.sendMessage(recipientId, message, activeApp.propertyId, {
        partner_name: tenantName,
        partner_avatar: activeApp.tenant?.avatar || ""
      });
      sessionStorage.setItem("activeChatPartnerId", recipientId);
      localStorage.setItem("activeChatPartnerId", recipientId);
      localStorage.setItem("activeChatTenantName", tenantName);
      triggerToast(`Request sent to ${activeApp.tenant?.firstName || 'applicant'}!`, "success");
      setShowRequestModal(false);
      setCustomRequestText("");
      if (setActiveTab) setActiveTab(3);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to send request message", "error");
    }
  };

  const activeApp = applications.find(a => a.id === activeApplicantId);

  // Requirements logic
  const minIncome = activeApp ? (activeApp.propertyRequirements?.minimumIncome || 0) : 0;
  const applicantIncome = activeApp ? (activeApp.tenant?.monthlyIncome || 0) : 0;
  const meetsIncome = applicantIncome >= minIncome;

  const reqGuarantor = activeApp ? activeApp.propertyRequirements?.requiresGuarantor : false;
  const hasGuarantor = activeApp && activeApp.tenant?.guarantorName;
  // If they don't strictly need a guarantor (maybe income is high enough), we can show flexible states.
  const guarantorSatisfied = !reqGuarantor || hasGuarantor;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-ink-500">
        Loading applications...
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-ink-500">
        <FileText className="h-12 w-12 mb-2 text-ink-300" />
        <h3 className="font-bold text-ink-800 dark:text-white">No Applications</h3>
        <p className="text-sm">You do not have any pending applications.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[700px] bg-white dark:bg-[#12221C] rounded-2xl border border-ink-100 dark:border-white/10 overflow-hidden shadow-sm">
      
      {/* Left Sidebar: Application List */}
      <div className="w-full lg:w-1/3 border-r border-ink-100 dark:border-white/10 flex flex-col">
        <div className="p-4 border-b border-ink-100 dark:border-white/10">
          <h2 className="font-bold text-lg text-ink-900 dark:text-white">Applications</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {applications.map(app => (
            <div 
              key={app.id} 
              onClick={() => setActiveApplicantId(app.id)}
              className={`p-4 border-b border-ink-50 dark:border-white/5 cursor-pointer transition-colors ${
                activeApplicantId === app.id ? 'bg-moss-50 dark:bg-moss-900/20' : 'hover:bg-ink-50 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-sm text-ink-900 dark:text-white">
                  {app.tenant_first_name} {app.tenant_last_name}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                  app.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                  app.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                  app.status === 'declined' ? 'bg-rose-100 text-rose-800' :
                  'bg-indigo-100 text-indigo-800'
                }`}>
                  {app.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-ink-600 dark:text-cream-100/70 truncate">{app.propertyTitle}</p>
              <p className="text-[10px] text-ink-400 mt-1">Applied: {app.date || (app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Unknown Date')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Area: Application Review */}
      <div className="w-full lg:w-2/3 flex flex-col bg-cream-50 dark:bg-[#0B1512]">
        {activeApp ? (
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Avatar src="" name={`${activeApp.tenant?.firstName} ${activeApp.tenant?.lastName}`} className="h-16 w-16 rounded-full text-xl" />
                <div>
                  <h2 className="text-xl font-bold text-ink-900 dark:text-white flex items-center gap-2">
                    {activeApp.tenant?.firstName} {activeApp.tenant?.lastName}
                  </h2>
                  <p className="text-sm text-ink-500 flex items-center gap-1 mt-1">
                    <Mail className="h-4 w-4" /> {activeApp.tenant?.email || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-500 uppercase font-bold tracking-wider mb-1">Applying For</p>
                <p className="font-bold text-moss-800 dark:text-moss-400">{activeApp.propertyTitle}</p>
              </div>
            </div>

            {/* Applicant Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              
              {/* Financials & Employment Box */}
              <div className="bg-white dark:bg-[#12221C] p-5 rounded-xl border border-ink-100 dark:border-white/10 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 dark:text-cream-100/70 flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-moss-600" /> Financials & Employment
                </h3>
                
                <div>
                  <p className="text-xs text-ink-500">Declared Monthly Income</p>
                  <p className="font-bold text-ink-900 dark:text-white text-lg flex items-center gap-2 mt-0.5">
                    ₦{applicantIncome.toLocaleString()}
                    {meetsIncome ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Meets Requirement
                      </span>
                    ) : (
                      <span className="text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Below Requirement
                      </span>
                    )}
                  </p>
                  {minIncome > 0 && <p className="text-[10px] text-ink-400 mt-0.5">Property requires: ₦{minIncome.toLocaleString()}/mo</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-ink-50 dark:border-white/5">
                  <div>
                    <p className="text-xs text-ink-500 flex items-center gap-1"><Briefcase className="h-3 w-3 text-ink-400"/> Employment</p>
                    <p className="font-semibold text-sm mt-0.5 text-ink-800 dark:text-white">{activeApp.tenant?.employmentStatus || 'Unspecified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-500 flex items-center gap-1"><Briefcase className="h-3 w-3 text-ink-400"/> Employer</p>
                    <p className="font-semibold text-sm mt-0.5 text-ink-800 dark:text-white truncate">{activeApp.tenant?.employerName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-500">Occupation</p>
                    <p className="font-semibold text-sm mt-0.5 text-ink-800 dark:text-white truncate">{activeApp.tenant?.occupation || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-500">Marital & Dependants</p>
                    <p className="font-semibold text-sm mt-0.5 text-ink-800 dark:text-white">
                      {activeApp.tenant?.maritalStatus || 'Single'} • {activeApp.tenant?.number_of_dependants ?? activeApp.tenant?.dependants ?? 0} Dep.
                    </p>
                  </div>
                </div>
              </div>

              {/* Guarantor Box */}
              <div className="bg-white dark:bg-[#12221C] p-5 rounded-xl border border-ink-100 dark:border-white/10 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 dark:text-cream-100/70 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-moss-600" /> Guarantor Info
                </h3>
                
                <div>
                  <p className="text-xs text-ink-500 mb-1">Status</p>
                  {hasGuarantor ? (
                    <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-2.5 py-1 rounded-full font-semibold">
                      Guarantor Provided
                    </span>
                  ) : (
                    <span className="text-xs bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-cream-100/70 px-2.5 py-1 rounded-full font-semibold">
                      Optional (Not Provided)
                    </span>
                  )}
                </div>
                
                {hasGuarantor ? (
                  <div className="space-y-1.5 pt-2 border-t border-ink-50 dark:border-white/5">
                    <p className="font-bold text-sm text-ink-900 dark:text-white">{activeApp.tenant?.guarantorName}</p>
                    <p className="text-xs text-ink-600 dark:text-cream-100/80">Relationship: <span className="font-medium">{activeApp.tenant?.guarantorRelationship || 'N/A'}</span></p>
                    <p className="text-xs text-ink-600 dark:text-cream-100/80">Phone: <span className="font-medium">{activeApp.tenant?.guarantorPhone || 'N/A'}</span></p>
                    {activeApp.tenant?.guarantorEmail && (
                      <p className="text-xs text-ink-600 dark:text-cream-100/80">Email: <span className="font-medium">{activeApp.tenant.guarantorEmail}</span></p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-ink-400 italic pt-2 border-t border-ink-50 dark:border-white/5">
                    Applicant did not attach a guarantor for this submission.
                  </p>
                )}
              </div>

            </div>

            {/* Application Notes/Message */}
            <div className="bg-white dark:bg-[#12221C] p-5 rounded-xl border border-ink-100 dark:border-white/10 shadow-sm mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 dark:text-cream-100/70 mb-2 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-moss-600" /> Note from Applicant
              </h3>
              <p className="text-sm text-ink-800 dark:text-cream-100 leading-relaxed bg-cream-50/70 dark:bg-white/5 p-4 rounded-xl border border-ink-100/50 dark:border-white/5 italic">
                "{activeApp.notes || activeApp.message || "No note provided by applicant."}"
              </p>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between mt-auto pt-6 border-t border-ink-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm rounded-lg transition-colors"
                  onClick={() => initiateChat(activeApp)}
                >
                  <MessageSquare className="h-4 w-4" /> Message Applicant
                </button>

                <button
                  className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-sm rounded-lg transition-colors border border-amber-200"
                  onClick={() => setShowRequestModal(true)}
                >
                  <FileText className="h-4 w-4 text-amber-600" /> Request Documents
                </button>
              </div>

              <div className="flex gap-3">
                <button 
                  className="px-6 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm rounded-lg transition-colors"
                  onClick={() => setShowDeclineModal(true)}
                  disabled={activeApp.status === 'declined' || isSubmitting}
                >
                  Decline
                </button>
                <button 
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  onClick={openLeaseSetup}
                  disabled={activeApp.status === 'approved' || isSubmitting}
                >
                  Approve Application
                </button>
              </div>
            </div>

            {/* Modal: Request Documents / Details */}
            {showRequestModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#16241F] rounded-2xl max-w-md w-full p-6 shadow-xl border border-ink-100 dark:border-white/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-3">
                    <h3 className="font-bold text-lg text-ink-900 dark:text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-moss-600" /> Request Information from Tenant
                    </h3>
                    <button onClick={() => setShowRequestModal(false)} className="text-ink-400 hover:text-ink-600 font-bold text-lg">×</button>
                  </div>

                  <p className="text-xs text-ink-600 dark:text-cream-100/70">
                    Select a preset request or write a custom document request for <strong>{activeApp.tenant?.firstName}</strong>:
                  </p>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleSendRequest("Proof of Employment / Recent 3 Months Payslips")}
                      className="p-3 text-left text-xs font-semibold bg-cream-50 dark:bg-white/5 hover:bg-moss-50 dark:hover:bg-moss-900/30 rounded-xl border border-ink-100 dark:border-white/10 text-ink-800 dark:text-cream-100 flex items-center justify-between"
                    >
                      <span>📄 Request Proof of Employment / Payslips</span>
                      <span className="text-moss-700 dark:text-moss-400 font-bold">Send →</span>
                    </button>

                    <button
                      onClick={() => handleSendRequest("Government ID / NIN Identity Verification")}
                      className="p-3 text-left text-xs font-semibold bg-cream-50 dark:bg-white/5 hover:bg-moss-50 dark:hover:bg-moss-900/30 rounded-xl border border-ink-100 dark:border-white/10 text-ink-800 dark:text-cream-100 flex items-center justify-between"
                    >
                      <span>🆔 Request Government ID / NIN Verification</span>
                      <span className="text-moss-700 dark:text-moss-400 font-bold">Send →</span>
                    </button>

                    <button
                      onClick={() => handleSendRequest("Guarantor Details & Phone Contact")}
                      className="p-3 text-left text-xs font-semibold bg-cream-50 dark:bg-white/5 hover:bg-moss-50 dark:hover:bg-moss-900/30 rounded-xl border border-ink-100 dark:border-white/10 text-ink-800 dark:text-cream-100 flex items-center justify-between"
                    >
                      <span>🛡️ Request Guarantor Details & Contact</span>
                      <span className="text-moss-700 dark:text-moss-400 font-bold">Send →</span>
                    </button>

                    <button
                      onClick={() => handleSendRequest("Bank Statement / Financial Proof")}
                      className="p-3 text-left text-xs font-semibold bg-cream-50 dark:bg-white/5 hover:bg-moss-50 dark:hover:bg-moss-900/30 rounded-xl border border-ink-100 dark:border-white/10 text-ink-800 dark:text-cream-100 flex items-center justify-between"
                    >
                      <span>💼 Request Bank Statement (6 Months)</span>
                      <span className="text-moss-700 dark:text-moss-400 font-bold">Send →</span>
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
                        className="px-3 py-1.5 text-xs font-semibold text-ink-600 dark:text-cream-100 hover:bg-ink-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSendRequest("Custom Request", customRequestText)}
                        disabled={!customRequestText.trim()}
                        className="px-4 py-1.5 text-xs font-bold bg-moss-600 hover:bg-moss-700 text-white rounded-lg disabled:opacity-50"
                      >
                        Send Custom Request
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-ink-400">
            <Briefcase className="h-12 w-12 mb-3 opacity-50" />
            <p>Select an application to review details</p>
          </div>
        )}
      </div>

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#12221C] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-2">Decline Application</h3>
            <p className="text-sm text-ink-500 mb-4">
              Please provide a reason for declining. The applicant will see this.
            </p>
            
            <textarea
              className="w-full h-32 p-3 bg-cream-50 dark:bg-white/5 border border-ink-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-moss-500 outline-none resize-none text-sm"
              placeholder="e.g. Income requirement not met, or property already rented."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-6">
              <button 
                className="px-4 py-2 font-bold text-sm text-ink-600 hover:bg-ink-50 rounded-lg"
                onClick={() => setShowDeclineModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-lg"
                onClick={() => handleStatusUpdate('declined', declineReason)}
                disabled={!declineReason.trim() || isSubmitting}
              >
                {isSubmitting ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lease Builder Modal */}
      <LeaseBuilderModal
        isOpen={showLeaseSetupModal}
        onClose={() => setShowLeaseSetupModal(false)}
        application={activeApp}
        property={{
          id: activeApp?.propertyId,
          title: activeApp?.propertyTitle,
          rent_amount: activeApp?.propertyRentAmount,
          rent_period: activeApp?.propertyRentPeriod
        }}
        tenant={activeApp?.tenant}
        onSuccess={() => {
          fetchApplications();
        }}
      />
    </div>
  );
}
