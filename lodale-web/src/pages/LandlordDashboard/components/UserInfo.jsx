import { useState } from "react";
import { 
  X, Star, CheckCircle2, ArrowLeft,
  Home, User, ShieldCheck
} from "lucide-react";
import Avatar from "../../../components/Avatar";

// Helper to get detailed reliability score breakdown based on actual tenant data
const getReliabilityDetails = (tenant) => {
  const score = parseFloat(tenant.reliabilityScore) || 0;
  
  if (score === 0) {
    return {
      score: 0,
      paymentHistory: null,
      propertyCondition: null,
      reviews: [],
      rentAgain: "N/A"
    };
  }

  return {
    score: score,
    paymentHistory: tenant.paymentHistory || null,
    propertyCondition: tenant.propertyCondition || null,
    reviews: tenant.customReviews || tenant.reviews || [],
    rentAgain: tenant.rentAgain || "N/A"
  };
};

export default function UserInfo({ tenant, onClose, onApprove, onDecline }) {
  const [activeTab, setActiveTab] = useState("application"); // "application", "history", "documents", "notes"
  const [showReliabilityDetails, setShowReliabilityDetails] = useState(false);
  
  if (!tenant) return null;

  const isApplicant = Boolean(onApprove || onDecline || tenant.isApplicant || tenant.applicationId || tenant.status === "pending" || tenant.status === "application_received");

  const scoreDetails = getReliabilityDetails(tenant);
  
  if (tenant.customReviews && Array.isArray(tenant.customReviews)) {
    scoreDetails.reviews = [...tenant.customReviews, ...scoreDetails.reviews];
  }

  // Extract ONLY real system & user input fields (NO hardcoded fake fallbacks)
  const tenantName = tenant.name || tenant.tenantName || `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || (tenant.tenant ? `${tenant.tenant.first_name || tenant.tenant.firstName || ''} ${tenant.tenant.last_name || tenant.tenant.lastName || ''}`.trim() : '') || "Applicant";
  const contactNo = tenant.phone || tenant.contactNo || tenant.tenant_phone || (tenant.tenant && tenant.tenant.phone) || "Not Provided";
  const emailId = tenant.email || tenant.tenant_email || (tenant.tenant && tenant.tenant.email) || "Not Provided";
  const occupation = tenant.occupation || (tenant.tenant && tenant.tenant.occupation) || "Not Provided";
  const emergencyContact = tenant.emergencyContact || tenant.emergency_contact || tenant.guarantorPhone || "Not Provided";
  const currentAddress = tenant.currentAddress || tenant.address || tenant.propertyTitle || "Not Provided";
  
  // Format income strictly from real numerical or text inputs
  const rawIncome = tenant.income || tenant.monthlyIncome || tenant.incomeRange || (tenant.tenant && (tenant.tenant.incomeRange || tenant.tenant.monthly_income)) || null;
  const monthlyIncome = rawIncome 
    ? (typeof rawIncome === "number" ? `₦${rawIncome.toLocaleString()}/month` : String(rawIncome))
    : "Not Provided";

  // Application specific fields from actual user input
  const appDate = tenant.applicationDate || tenant.date || (tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "Not Provided");
  const moveInDate = tenant.moveInDate || tenant.desiredMoveInDate || tenant.move_in_date || "Not Provided";
  const leaseTerm = tenant.leaseTerm || tenant.desiredLeaseTerm || tenant.lease_duration || "Not Provided";
  
  const occupantsVal = tenant.occupants ?? tenant.dependants ?? tenant.numberOfOccupants ?? (tenant.tenant && (tenant.tenant.dependants ?? tenant.tenant.number_of_dependants)) ?? null;
  const occupants = occupantsVal !== null && occupantsVal !== undefined ? String(occupantsVal) : "Not Provided";
  
  const petsVal = tenant.pets ?? tenant.has_pets ?? null;
  const pets = petsVal !== null && petsVal !== undefined ? (petsVal === true || petsVal === "yes" ? "Yes" : (petsVal === false || petsVal === "no" ? "None" : String(petsVal))) : "Not Provided";

  const carsVal = tenant.vehicles ?? tenant.cars ?? tenant.number_of_cars ?? null;
  const cars = carsVal !== null && carsVal !== undefined ? String(carsVal) : "Not Provided";

  const maritalStatus = tenant.maritalStatus || (tenant.tenant && (tenant.tenant.maritalStatus || tenant.tenant.marital_status)) || "Not Provided";

  // Real rental history list from system data
  const rentalHistoryList = Array.isArray(tenant.rentalHistory) ? tenant.rentalHistory : (tenant.propertyTitle ? [{
    title: tenant.propertyTitle,
    period: tenant.leasePeriod || "Current Tenancy",
    status: tenant.leaseStatus || tenant.status || "Active",
    amount: tenant.propertyRentAmount ? `₦${parseFloat(tenant.propertyRentAmount).toLocaleString()}/mo` : null
  }] : []);

  // Real uploaded documents list from system data
  const documentsList = Array.isArray(tenant.documents) ? tenant.documents : [
    ...(tenant.nin_verified || tenant.ninVerified ? [{ name: "National Identity Number (NIN)", status: "Verified Match ✓", type: "NIN" }] : []),
    ...(tenant.guarantorName ? [{ name: `Guarantor Verification (${tenant.guarantorName})`, status: "Submitted ✓", type: "Guarantor" }] : [])
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-5xl bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 sm:p-8 shadow-2xl border border-ink-100 dark:border-white/10 max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR WITH BREADCRUMB AND ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-ink-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-ink-100 dark:bg-white/10 hover:bg-ink-200 dark:hover:bg-white/20 text-ink-800 dark:text-cream-100 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex items-center gap-1.5 text-xs text-ink-400 dark:text-cream-100/60 font-semibold">
              <span className="flex items-center gap-1"><Home className="h-3.5 w-3.5" /> {isApplicant ? "Applications" : "Tenants"}</span>
              <span>/</span>
              <span className="text-moss-700 dark:text-[#E5C583] font-bold flex items-center gap-1 bg-moss-50 dark:bg-white/10 px-2 py-0.5 rounded-lg">
                <User className="h-3.5 w-3.5" /> Tenant Details
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isApplicant && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onDecline) onDecline(tenant);
                    else onClose();
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-ink-600 dark:text-cream-100/70 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    if (onApprove) onApprove(tenant);
                    else onClose();
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  Proceed Application &rarr;
                </button>
              </div>
            )}

            <button 
              onClick={() => setShowReliabilityDetails(true)}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Click to view detailed reliability history"
            >
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span>★ {tenant.reliabilityScore > 0 ? tenant.reliabilityScore : "New"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-ink-400 hover:text-ink-800 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* HEADER TITLE */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-ink-900 dark:text-cream-100 tracking-tight">Tenant Details</h2>
        </div>

        {/* MAIN CONTENT GRID (2 COLUMNS) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* LEFT COLUMN: PERSONAL DETAILS CARD */}
          <div className="md:col-span-4 bg-ink-50/50 dark:bg-white/5 border border-ink-100 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center text-center shadow-xs">
            <div className="relative mb-4">
              <Avatar src={tenant.avatar} name={tenantName} className="w-24 h-24 rounded-full border-4 border-white dark:border-[#2A2A2A] shadow-md object-cover" />
              {(tenant.nin_verified || tenant.ninVerified) && (
                <span className="absolute bottom-0 right-0 p-1 bg-emerald-500 text-white rounded-full shadow-sm" title="Verified Identity">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              )}
            </div>

            <h3 className="text-lg font-extrabold text-ink-900 dark:text-cream-100">{tenantName}</h3>
            <span className="text-xs font-bold px-3 py-1 bg-moss-700/10 text-moss-700 dark:bg-[#E5C583]/20 dark:text-[#E5C583] rounded-full mt-1 mb-6 capitalize">
              {(tenant.leaseStatus || tenant.status || "Applicant").replace('_', ' ')}
            </span>

            {/* PERSONAL DETAILS KEY-VALUE LIST */}
            <div className="w-full text-left space-y-4 border-t border-ink-200/60 dark:border-white/10 pt-5">
              <h4 className="text-xs font-black text-ink-400 dark:text-cream-100/60 uppercase tracking-wider mb-2">Personal Details</h4>

              <div>
                <span className="text-xs text-ink-400 dark:text-cream-100/60 font-semibold block">Contact No. :</span>
                <span className="text-xs sm:text-sm font-bold text-ink-900 dark:text-cream-100">{contactNo}</span>
              </div>

              <div>
                <span className="text-xs text-ink-400 dark:text-cream-100/60 font-semibold block">Email Id :</span>
                <span className="text-xs sm:text-sm font-bold text-ink-900 dark:text-cream-100 break-all">{emailId}</span>
              </div>

              <div>
                <span className="text-xs text-ink-400 dark:text-cream-100/60 font-semibold block">Occupation :</span>
                <span className="text-xs sm:text-sm font-bold text-ink-900 dark:text-cream-100">{occupation}</span>
              </div>

              <div>
                <span className="text-xs text-ink-400 dark:text-cream-100/60 font-semibold block">Emergency Contact No. :</span>
                <span className="text-xs sm:text-sm font-bold text-ink-900 dark:text-cream-100">{emergencyContact}</span>
              </div>

              <div>
                <span className="text-xs text-ink-400 dark:text-cream-100/60 font-semibold block">Current Address :</span>
                <span className="text-xs sm:text-sm font-bold text-ink-900 dark:text-cream-100">{currentAddress}</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: TABBED DETAILS CONTAINER */}
          <div className="md:col-span-8 bg-white dark:bg-[#242424] border border-ink-100 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
            <div>
              {/* TAB NAVIGATION HEADER */}
              <div className="flex items-center gap-6 border-b border-ink-100 dark:border-white/10 pb-3 mb-6 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("application")}
                  className={`pb-3 font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer relative ${
                    activeTab === "application"
                      ? "text-moss-700 dark:text-[#E5C583]"
                      : "text-ink-400 dark:text-cream-100/60 hover:text-ink-800"
                  }`}
                >
                  Application Details
                  {activeTab === "application" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-moss-700 dark:bg-[#E5C583] rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("history")}
                  className={`pb-3 font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer relative flex items-center gap-1.5 ${
                    activeTab === "history"
                      ? "text-moss-700 dark:text-[#E5C583]"
                      : "text-ink-400 dark:text-cream-100/60 hover:text-ink-800"
                  }`}
                >
                  Rental History
                  <span className="px-1.5 py-0.2 bg-ink-100 dark:bg-white/10 text-ink-700 dark:text-cream-100 text-[10px] font-extrabold rounded-full">
                    {String(rentalHistoryList.length).padStart(2, '0')}
                  </span>
                  {activeTab === "history" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-moss-700 dark:bg-[#E5C583] rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("documents")}
                  className={`pb-3 font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer relative flex items-center gap-1.5 ${
                    activeTab === "documents"
                      ? "text-moss-700 dark:text-[#E5C583]"
                      : "text-ink-400 dark:text-cream-100/60 hover:text-ink-800"
                  }`}
                >
                  Documents
                  <span className="px-1.5 py-0.2 bg-ink-100 dark:bg-white/10 text-ink-700 dark:text-cream-100 text-[10px] font-extrabold rounded-full">
                    {String(documentsList.length).padStart(2, '0')}
                  </span>
                  {activeTab === "documents" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-moss-700 dark:bg-[#E5C583] rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("notes")}
                  className={`pb-3 font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer relative ${
                    activeTab === "notes"
                      ? "text-moss-700 dark:text-[#E5C583]"
                      : "text-ink-400 dark:text-cream-100/60 hover:text-ink-800"
                  }`}
                >
                  Notes & Comments
                  {activeTab === "notes" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-moss-700 dark:bg-[#E5C583] rounded-full" />
                  )}
                </button>
              </div>

              {/* TAB 1: APPLICATION DETAILS */}
              {activeTab === "application" && (
                <div className="p-5 sm:p-6 rounded-2xl bg-ink-50/60 dark:bg-white/5 border border-ink-100 dark:border-white/10 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 text-xs sm:text-sm">
                    <div>
                      <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">Application Date :</span>
                      <span className="font-extrabold text-ink-900 dark:text-cream-100">{appDate}</span>
                    </div>

                    <div>
                      <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">No. of Occupants :</span>
                      <span className="font-extrabold text-ink-900 dark:text-cream-100">{occupants}</span>
                    </div>

                    <div>
                      <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">Desired Move-in Date :</span>
                      <span className="font-extrabold text-ink-900 dark:text-cream-100">{moveInDate}</span>
                    </div>

                    <div>
                      <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">Pet(s) :</span>
                      <span className="font-extrabold text-ink-900 dark:text-cream-100">{pets}</span>
                    </div>

                    <div>
                      <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">Desired Lease Term :</span>
                      <span className="font-extrabold text-ink-900 dark:text-cream-100">{leaseTerm}</span>
                    </div>

                    <div>
                      <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">Car(s) :</span>
                      <span className="font-extrabold text-ink-900 dark:text-cream-100">{cars}</span>
                    </div>

                    <div>
                      <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">Marital Status :</span>
                      <span className="font-extrabold text-ink-900 dark:text-cream-100">{maritalStatus}</span>
                    </div>

                    <div>
                      <span className="text-ink-400 dark:text-cream-100/60 font-semibold block mb-1">Monthly Income :</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">{monthlyIncome}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RENTAL HISTORY */}
              {activeTab === "history" && (
                <div className="p-5 sm:p-6 rounded-2xl bg-ink-50/60 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-4 animate-in fade-in duration-200">
                  {rentalHistoryList.length === 0 ? (
                    <div className="text-center py-8 text-ink-400 dark:text-cream-100/60">
                      <p className="text-xs font-semibold">No prior rental history recorded for this tenant.</p>
                    </div>
                  ) : (
                    rentalHistoryList.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-white dark:bg-[#1E1E1E] border border-ink-100 dark:border-white/10 flex items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-sm text-ink-900 dark:text-cream-100">{item.title}</h4>
                          <p className="text-xs text-ink-500 dark:text-cream-100/70 mt-0.5">Lease Term: {item.period}</p>
                          <span className="inline-block mt-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full capitalize">
                            {item.status}
                          </span>
                        </div>
                        {item.amount && <span className="font-black text-sm text-moss-700 dark:text-[#E5C583]">{item.amount}</span>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: DOCUMENTS */}
              {activeTab === "documents" && (
                <div className="p-5 sm:p-6 rounded-2xl bg-ink-50/60 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-3 animate-in fade-in duration-200">
                  {documentsList.length === 0 ? (
                    <div className="text-center py-8 text-ink-400 dark:text-cream-100/60">
                      <p className="text-xs font-semibold">No verification documents attached to this application.</p>
                    </div>
                  ) : (
                    documentsList.map((doc, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-white dark:bg-[#1E1E1E] border border-ink-100 dark:border-white/10 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-ink-900 dark:text-cream-100">{doc.name}</h4>
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{doc.status}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-ink-400 uppercase">{doc.type || "Doc"}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: NOTES & COMMENTS */}
              {activeTab === "notes" && (
                <div className="p-5 sm:p-6 rounded-2xl bg-ink-50/60 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-xl bg-white dark:bg-[#1E1E1E] border border-ink-100 dark:border-white/10">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-ink-400 mb-2">Background & Verification Notes</h4>
                    <p className="text-xs sm:text-sm text-ink-700 dark:text-cream-100/90 leading-relaxed italic">
                      "{tenant.notes || tenant.message || "No background notes provided by applicant."}"
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

            {/* MODAL FOOTER */}
            <div className="mt-6 pt-4 border-t border-ink-100 dark:border-white/10 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-ink-100 dark:bg-white/10 hover:bg-ink-200 dark:hover:bg-white/20 text-ink-800 dark:text-cream-100 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* RELIABILITY BREAKDOWN SUB-MODAL */}
      {showReliabilityDetails && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowReliabilityDetails(false)}>
          <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 shadow-2xl border border-ink-100 dark:border-white/10 max-h-[85vh] overflow-y-auto relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-ink-100 dark:border-white/10 mb-4">
              <h3 className="font-extrabold text-base text-ink-900 dark:text-cream-100">Reliability Breakdown</h3>
              <button 
                className="p-1 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10" 
                onClick={() => setShowReliabilityDetails(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/50 flex items-center gap-4 mb-4">
              <Star className="h-8 w-8 fill-amber-500 text-amber-500 shrink-0" />
              <div>
                <span className="text-2xl font-black text-amber-950 dark:text-amber-200">{scoreDetails.score > 0 ? scoreDetails.score.toFixed(1) : "New"} <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">{scoreDetails.score > 0 ? "/ 5.0" : ""}</span></span>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">Verified landlord rating computed from rental history and timely payments.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10">
                <span className="font-bold text-ink-900 dark:text-cream-100 block mb-1">Platform Rating</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{scoreDetails.score > 0 ? `${scoreDetails.score.toFixed(1)} Rating Score` : "New Platform Account"}</span>
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
    </div>
  );
}
