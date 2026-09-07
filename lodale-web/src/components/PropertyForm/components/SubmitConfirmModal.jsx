import React from "react";
import { Building2, CheckCircle2, ShieldAlert, Loader2, X } from "lucide-react";

export default function SubmitConfirmModal({
  showConfirmModal,
  setShowConfirmModal,
  isSubmitting,
  handleConfirmSubmit,
  displayName,
  propertyType,
  address,
  cityName,
  stateName,
  isMultiUnit,
  unitsList,
  rent
}) {
  if (!showConfirmModal) return null;

  const displayType = (propertyType || "single_house").replace(/_/g, " ").toUpperCase();
  const locationText = `${address || ""}, ${cityName || ""}, ${stateName || ""}`.replace(/^,\s*/, "").replace(/,\s*$/, "");
  const unitsCount = isMultiUnit ? (unitsList?.length || 0) : 1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#12221C] text-slate-900 dark:text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 relative space-y-5">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => setShowConfirmModal(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-white/5 cursor-pointer disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 dark:bg-[#E5C583]/15 text-[#2C4633] dark:text-[#E5C583] flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base leading-snug">Confirm Property Submission</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Review listing details before submitting to Admin</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2.5 text-xs">
          <div className="flex justify-between border-b border-slate-200/60 dark:border-white/5 pb-2">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Property Name:</span>
            <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{displayName || "Untitled Property"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 dark:border-white/5 pb-2">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Category:</span>
            <span className="font-bold text-emerald-700 dark:text-[#E5C583]">{displayType}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 dark:border-white/5 pb-2">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Location:</span>
            <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{locationText || "Lagos"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">{isMultiUnit ? "Total Units:" : "Asking Rent:"}</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {isMultiUnit ? `${unitsCount} Unit(s)` : (rent ? `₦${Number(rent.replace(/[^0-9]/g, "")).toLocaleString()}/yr` : "N/A")}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <span>This listing and attached proof of ownership will be submitted for Admin review & verification.</span>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setShowConfirmModal(false)}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmSubmit}
            className="flex-1 py-3 px-4 rounded-xl bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#12221C] font-bold text-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm & Submit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
