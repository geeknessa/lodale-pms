import React, { useState, useEffect } from "react";
import { FileText, X, ShieldCheck, PenTool, Loader2, AlertCircle } from "lucide-react";
import { leaseService } from "../services/leaseService";
import { chatService } from "../services/chatService";
import { triggerToast } from "../context/ToastContext";

export default function TenantLeaseModal({ isOpen, onClose, application, onSuccess }) {
  const [leaseData, setLeaseData] = useState(null);
  const [loadingLease, setLoadingLease] = useState(true);
  const [signatureName, setSignatureName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && application) {
      loadLease();
    } else {
      setLeaseData(null);
      setSignatureName("");
      setAgreeTerms(false);
      setIsSubmitting(false);
    }
  }, [isOpen, application]);

  const loadLease = async () => {
    setLoadingLease(true);
    try {
      const lease = await leaseService.getLeaseByApplicationId(application.id);
      setLeaseData(lease);
    } catch (err) {
      console.error("[TenantLeaseModal] Error loading lease:", err);
      setLeaseData(null);
    } finally {
      setLoadingLease(false);
    }
  };

  if (!isOpen || !application) return null;

  const handleSubmitSignature = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!leaseData || !leaseData.id) {
      triggerToast("Lease document could not be found. Please try again.", "error");
      return;
    }

    if (!signatureName.trim() || !agreeTerms) {
      triggerToast("Please type your signature and agree to the terms.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Sign the lease via backend API
      const signedLease = await leaseService.signLease(leaseData.id);

      if (!signedLease) {
        throw new Error("Failed to sign lease.");
      }

      // 2. Send notification message to landlord
      const landlordId = application.landlordId || application.landlord_id || leaseData.landlord_id;
      if (landlordId) {
        const msg = `[LEASE AGREEMENT SIGNED BY TENANT]\nProperty: ${application.propertyTitle || leaseData.property_title}\nDigital Signature: "${signatureName.trim()}"\nSigned Date: ${new Date().toLocaleDateString("en-GB")}\n\nLease agreement successfully signed. Next step: Initial rent payment and Move-in guidelines.`;
        await chatService.sendMessage(landlordId, msg, application.propertyId || leaseData.property_id);
      }

      triggerToast("Lease agreement digitally signed and submitted to landlord.", "success");
      
      if (onSuccess) onSuccess(signedLease);
      onClose();
    } catch (err) {
      console.error("[TenantLeaseModal] Signature submission error:", err);
      triggerToast(err.message || "Failed to submit digital signature.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const rentValue = leaseData?.rent_amount || leaseData?.rentAmount || application?.propertyRentAmount;
  const formattedRent = rentValue ? `₦${parseFloat(rentValue).toLocaleString()} / yr` : "As Agreed";
  const durationValue = leaseData?.duration === "1_year" ? "1 Year (12 Months)" : (leaseData?.duration || "1 Year");

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#07130D] rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 max-h-[92vh] overflow-y-auto relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-moss-100 dark:bg-[#E5C583]/15 text-moss-800 dark:text-[#E5C583] rounded-2xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-ink-900 dark:text-white">Review & Sign Residential Lease Agreement</h2>
              <p className="text-xs text-ink-500 dark:text-cream-100/70">
                Property: <strong>{application.propertyTitle || "Property"}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-ink-400 hover:text-ink-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loadingLease ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-ink-500 dark:text-cream-100/60">
            <Loader2 className="h-8 w-8 animate-spin text-moss-600 dark:text-[#E5C583]" />
            <p className="text-sm font-medium">Fetching lease contract from database...</p>
          </div>
        ) : !leaseData ? (
          <div className="py-10 px-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ink-900 dark:text-white mb-1">No Lease Agreement Prepared Yet</h3>
              <p className="text-xs text-ink-600 dark:text-cream-100/70 max-w-md mx-auto">
                The landlord has not drafted and issued a digital lease agreement for this application yet. You will be notified as soon as the landlord prepares the contract.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0C1410] rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* LEASE DOCUMENT DISPLAY */
          <div className="space-y-4 text-xs">
            <div className="p-5 rounded-2xl bg-cream-50/70 dark:bg-white/5 border border-neutral-200 dark:border-white/10 space-y-3 max-h-[300px] overflow-y-auto font-sans leading-relaxed">
              <div className="flex justify-between items-center border-b border-neutral-200 dark:border-white/10 pb-2">
                <h3 className="font-extrabold text-sm text-ink-900 dark:text-white">RESIDENTIAL LEASE AGREEMENT</h3>
                <span className="text-[11px] font-bold text-moss-700 dark:text-[#E5C583] uppercase">Official Contract</span>
              </div>

              <p>
                This Residential Lease Agreement ("Agreement") is made between <strong>Landlord</strong> and <strong>{application.tenant_first_name ? `${application.tenant_first_name} ${application.tenant_last_name || ''}` : "Tenant Candidate"}</strong> regarding tenancy at <strong>{application.propertyTitle || "Property"}</strong>.
              </p>

              <div className="grid grid-cols-2 gap-3 p-3 bg-white dark:bg-[#07130D] rounded-xl border border-neutral-200 dark:border-neutral-800 font-semibold">
                <div>
                  <span className="text-[10px] text-ink-400 dark:text-cream-100/50 uppercase block">Rent Amount</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formattedRent}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-400 dark:text-cream-100/50 uppercase block">Lease Duration</span>
                  <span className="text-sm font-bold text-ink-900 dark:text-white">
                    {durationValue}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-ink-800 dark:text-cream-100">
                <h4 className="font-bold text-xs uppercase text-ink-500 tracking-wider">Key Clauses & Policies:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Tenant agrees to pay the annual rent promptly on or before the due date.</li>
                  <li>Security deposit will be held for the duration of the lease and refunded upon inspection check.</li>
                  <li>Pets policy: {(leaseData.include_pets || leaseData.includePets) ? "Pets permitted with prior approval." : "No unauthorized pets allowed on premises."}</li>
                  <li>Smoking policy: {(leaseData.include_smoking || leaseData.includeSmoking) ? "Designated smoking areas permitted." : "No smoking allowed inside property."}</li>
                  {(leaseData.custom_clauses || leaseData.customClauses) && (
                    <li className="italic text-moss-700 dark:text-[#E5C583]">Custom Landlord Terms: "{leaseData.custom_clauses || leaseData.customClauses}"</li>
                  )}
                </ul>
              </div>
            </div>

            {/* DIGITAL SIGNATURE FORM */}
            <form onSubmit={handleSubmitSignature} className="p-4 rounded-2xl bg-moss-50/50 dark:bg-white/10 border border-moss-200 dark:border-white/10 space-y-3">
              <h4 className="font-extrabold text-xs text-moss-900 dark:text-[#E5C583] flex items-center gap-1.5">
                <PenTool className="h-4 w-4" /> Digital Signature Required
              </h4>

              <div>
                <label className="block font-bold text-ink-700 dark:text-cream-100 mb-1">Type Full Printed Name as Signature</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amina Bello"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-white dark:bg-[#07130D] outline-none focus:border-moss-600 font-bold"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 accent-moss-700 cursor-pointer"
                />
                <span className="text-[11px] text-ink-700 dark:text-cream-100/90 leading-tight">
                  I confirm that I have read, understood, and agree to all terms and conditions of this Residential Lease Agreement. My digital signature above is legally binding.
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-moss-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-cream-100 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !signatureName.trim() || !agreeTerms || !leaseData?.id}
                  className="px-5 py-2 text-xs font-bold bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0C1410] rounded-xl disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> Submit Signed Lease
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
