import React, { useState, useEffect } from "react";
import { FileText, X, ShieldCheck, PenTool } from "lucide-react";
import { leaseService } from "../services/leaseService";
import { chatService } from "../services/chatService";
import { triggerToast } from "../context/ToastContext";

export default function TenantLeaseModal({ isOpen, onClose, application, onSuccess }) {
  const [leaseData, setLeaseData] = useState(null);
  const [signatureName, setSignatureName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && application) {
      loadLease();
    }
  }, [isOpen, application]);

  const loadLease = async () => {
    try {
      let lease = await leaseService.getLeaseByApplicationId(application.id);
      if (!lease) {
        const localLeases = JSON.parse(localStorage.getItem("tenantLeases") || "[]");
        lease = localLeases.find(l => String(l.applicationId || l.application_id) === String(application.id)) || null;
      }
      setLeaseData(lease);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen || !application) return null;

  const handleSubmitSignature = async (e) => {
    e.preventDefault();
    if (!signatureName.trim() || !agreeTerms) {
      triggerToast("Please type your signature and agree to the terms.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const appId = application.id;
      const landlordId = application.landlordId || application.landlord_id || (application.landlordFirstName ? `landlord-${application.landlordFirstName.toLowerCase()}` : "landlord");

      // Update signed lease record in localStorage
      const localLeases = JSON.parse(localStorage.getItem("tenantLeases") || "[]");
      const idx = localLeases.findIndex(l => String(l.applicationId || l.application_id) === String(appId));
      const signedObj = {
        ...(leaseData || {}),
        applicationId: String(appId),
        status: "signed",
        signedByTenant: true,
        tenantSignature: signatureName.trim(),
        signedAt: new Date().toISOString()
      };

      if (idx >= 0) {
        localLeases[idx] = signedObj;
      } else {
        localLeases.push(signedObj);
      }
      localStorage.setItem("tenantLeases", JSON.stringify(localLeases));

      // Persist signed status in signedLeaseAppIds
      const signedIds = JSON.parse(localStorage.getItem("signedLeaseAppIds") || "[]");
      if (!signedIds.includes(String(appId))) {
        signedIds.push(String(appId));
        localStorage.setItem("signedLeaseAppIds", JSON.stringify(signedIds));
      }

      // Send chat notification to landlord
      if (landlordId) {
        const msg = `[LEASE AGREEMENT SIGNED BY TENANT]\nProperty: ${application.propertyTitle}\nDigital Signature: "${signatureName.trim()}"\nSigned Date: ${new Date().toLocaleDateString("en-GB")}\n\nLease agreement successfully signed. Next step: Move-in guidelines & key pickup!`;
        await chatService.sendMessage(landlordId, msg, application.propertyId);
      }

      triggerToast("Lease agreement digitally signed and submitted to landlord!", "success");
      if (onSuccess) onSuccess(signedObj);
      onClose();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to submit digital signature", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#16241F] rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 max-h-[92vh] overflow-y-auto relative text-left"
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
                Property: <strong>{application.propertyTitle}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-ink-400 hover:text-ink-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* LEASE DOCUMENT DISPLAY */}
        <div className="space-y-4 text-xs">
          <div className="p-5 rounded-2xl bg-cream-50/70 dark:bg-white/5 border border-neutral-200 dark:border-white/10 space-y-3 max-h-[300px] overflow-y-auto font-sans leading-relaxed">
            <div className="flex justify-between items-center border-b border-neutral-200 dark:border-white/10 pb-2">
              <h3 className="font-extrabold text-sm text-ink-900 dark:text-white">RESIDENTIAL LEASE AGREEMENT</h3>
              <span className="text-[11px] font-bold text-moss-700 dark:text-[#E5C583] uppercase">Official Contract</span>
            </div>

            <p>
              This Residential Lease Agreement ("Agreement") is made between <strong>Landlord</strong> and <strong>{application.tenant_first_name ? `${application.tenant_first_name} ${application.tenant_last_name || ''}` : "Tenant Candidate"}</strong> regarding tenancy at <strong>{application.propertyTitle}</strong>.
            </p>

            <div className="grid grid-cols-2 gap-3 p-3 bg-white dark:bg-[#12221C] rounded-xl border border-neutral-200 dark:border-neutral-800 font-semibold">
              <div>
                <span className="text-[10px] text-ink-400 dark:text-cream-100/50 uppercase block">Rent Amount</span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {leaseData?.rentAmount ? `₦${parseFloat(leaseData.rentAmount).toLocaleString()} / yr` : (application.propertyRentAmount ? `₦${parseFloat(application.propertyRentAmount).toLocaleString()} / yr` : "As Agreed")}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-ink-400 dark:text-cream-100/50 uppercase block">Lease Duration</span>
                <span className="text-sm font-bold text-ink-900 dark:text-white">
                  {leaseData?.duration === "1_year" ? "1 Year (12 Months)" : (leaseData?.duration || "1 Year")}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-ink-800 dark:text-cream-100">
              <h4 className="font-bold text-xs uppercase text-ink-500 tracking-wider">Key Clauses & Policies:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Tenant agrees to pay the annual rent promptly on or before the due date.</li>
                <li>Security deposit will be held for the duration of the lease and refunded upon inspection check.</li>
                <li>Pets policy: {leaseData?.includePets ? "Pets permitted with prior approval." : "No unauthorized pets allowed on premises."}</li>
                <li>Smoking policy: {leaseData?.includeSmoking ? "Designated smoking areas permitted." : "No smoking allowed inside property."}</li>
                {leaseData?.customClauses && (
                  <li className="italic text-moss-700 dark:text-[#E5C583]">Custom Landlord Terms: "{leaseData.customClauses}"</li>
                )}
              </ul>
            </div>
          </div>

          {/* DIGITAL SIGNATURE FORM */}
          <form onSubmit={handleSubmitSignature} className="p-4 rounded-2xl bg-moss-50/50 dark:bg-moss-900/20 border border-moss-200 dark:border-moss-800/40 space-y-3">
            <h4 className="font-extrabold text-xs text-moss-900 dark:text-[#E5C583] flex items-center gap-1.5">
              <PenTool className="h-4 w-4" /> Digital Signature Required
            </h4>

            <div>
              <label className="block font-bold text-ink-700 dark:text-cream-100 mb-1">Type Full Printed Name as Signature</label>
              <input
                type="text"
                required
                placeholder="e.g. Vanessa Ikem"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 dark:border-white/10 p-2.5 text-xs text-ink-900 dark:text-white bg-white dark:bg-[#12221C] outline-none focus:border-moss-600 font-bold"
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
                disabled={isSubmitting || !signatureName.trim() || !agreeTerms}
                className="px-5 py-2 text-xs font-bold bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#263b33] rounded-xl disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <ShieldCheck className="h-4 w-4" /> Submit Signed Lease
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
