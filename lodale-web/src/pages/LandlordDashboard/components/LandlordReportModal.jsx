import { useState } from "react";
import { X, Printer, Download, FileText, CheckCircle2, Building2, Users, Wallet, ShieldCheck, AlertCircle } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import { triggerToast } from "../../../context/ToastContext";

export default function LandlordReportModal({ isOpen, onClose, username, properties = [], leases = [], invoices = [] }) {
  if (!isOpen) return null;

  const reportDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const reportRef = `REP-${Date.now().toString().slice(-6)}`;

  // Calculate portfolio statistics safely
  const safeProperties = Array.isArray(properties) ? properties : [];
  const totalProperties = safeProperties.length;
  let totalUnits = 0;
  let occupiedCount = 0;

  const propertyTenantsMap = (() => {
    try {
      const saved = localStorage.getItem("propertyTenants");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  })();

  // Helper function to get property status and verification
  const getPropertyStatusDetails = (p) => {
    const statusTag = (p.status || "").toLowerCase();
    const hasTenants = (propertyTenantsMap[p.id] && propertyTenantsMap[p.id].length > 0) || statusTag === "occupied" || statusTag === "active_occupied";
    
    if (hasTenants) {
      return {
        label: "Occupied",
        badgeClass: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
        isVerified: true
      };
    }

    const isLive = statusTag === 'active_vacant' || statusTag === 'live' || statusTag === 'approved' || statusTag === 'active';
    if (isLive) {
      return {
        label: "Live Vacant",
        badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
        isVerified: true
      };
    }

    const isInfoReq = statusTag === 'info_requested' || statusTag === 'info requested' || statusTag === 'needs_proof' || statusTag === 'more_proof_requested';
    if (isInfoReq) {
      return {
        label: "Needs Proof",
        badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
        isVerified: false
      };
    }

    const isRejected = statusTag === 'rejected' || statusTag === 'inactive';
    if (isRejected) {
      return {
        label: "Rejected",
        badgeClass: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
        isVerified: false
      };
    }

    // Default to In Review for pending_review, pending approval, pending, etc.
    return {
      label: "In Review",
      badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
      isVerified: false
    };
  };

  let verifiedCount = 0;
  safeProperties.forEach(p => {
    const status = (p.status || "").toLowerCase();
    const hasTenants = (propertyTenantsMap[p.id] && propertyTenantsMap[p.id].length > 0) || status === "occupied" || status === "active_occupied";
    if (hasTenants) occupiedCount++;

    const details = getPropertyStatusDetails(p);
    if (details.isVerified) verifiedCount++;

    if (Array.isArray(p.units) && p.units.length > 0) {
      totalUnits += p.units.length;
    } else {
      totalUnits += 1;
    }
  });

  const occupancyRate = totalProperties > 0 ? Math.round((occupiedCount / totalProperties) * 100) : 0;
  const verifiedPercentage = totalProperties > 0 ? Math.round((verifiedCount / totalProperties) * 100) : 100;

  // Revenue calculation
  let totalAnnualRent = 0;
  safeProperties.forEach(p => {
    const rawVal = Number(String(p.price || p.rent_amount || "0").replace(/[^0-9]/g, ""));
    totalAnnualRent += rawVal;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Landlord Portfolio Financial Report\n";
      csvContent += `Prepared For,${username}\n`;
      csvContent += `Date,${reportDate}\n`;
      csvContent += `Report Ref,${reportRef}\n\n`;

      csvContent += "Property Title,Location,Price,Status,Occupants\n";

      safeProperties.forEach(p => {
        const title = `"${(p.title || "").replace(/"/g, '""')}"`;
        const loc = `"${(p.location || "").replace(/"/g, '""')}"`;
        const price = `"${p.price || ""}"`;
        const details = getPropertyStatusDetails(p);
        const tenantCount = (propertyTenantsMap[p.id] ? propertyTenantsMap[p.id].length : 0);
        csvContent += `${title},${loc},${price},${details.label},${tenantCount}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Lodale_Portfolio_Report_${reportRef}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerToast("Portfolio report exported as CSV successfully!", "success", "CSV Exported");
    } catch (e) {
      console.error("CSV Export Error:", e);
      triggerToast("Failed to export CSV report.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#12221C] border border-ink-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden my-6 text-left text-ink-900 dark:text-white font-sans animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-ink-100 dark:border-white/10 bg-cream-50 dark:bg-[#162721]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-moss-100 text-moss-800 dark:bg-[#E5C583]/15 dark:text-[#E5C583]">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">Portfolio Executive Statement</h2>
              <p className="text-xs text-ink-500 dark:text-cream-100/70">
                Official Financial & Tenancy Audit Report • Ref: <span className="font-mono font-bold text-moss-700 dark:text-[#E5C583]">{reportRef}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-900/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download CSV Spreadsheet"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-moss-700 hover:bg-moss-800 text-white dark:bg-[#E5C583] dark:hover:bg-[#d8b46e] dark:text-[#16241F] font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Print Statement / Save PDF"
            >
              <Printer className="h-3.5 w-3.5" /> Print / Save PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-ink-100 hover:bg-ink-200 dark:bg-white/10 dark:hover:bg-white/20 text-ink-600 dark:text-cream-100 transition-colors cursor-pointer ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Report Content Body (Printable Container) */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          
          {/* Statement Letterhead */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-ink-100 dark:border-white/10">
            <div>
              <span className="text-xl font-black text-moss-800 dark:text-[#E5C583] tracking-wide">LODALE.</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automated Real Estate Management Statement</p>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-600 dark:text-cream-100/80 space-y-0.5">
              <p><strong>Prepared For:</strong> {username}</p>
              <p><strong>Statement Date:</strong> {reportDate}</p>
              <p><strong>Platform Status:</strong> Verified Landlord Portfolio</p>
            </div>
          </div>

          {/* Key Portfolio Indicators (KPIs) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Properties</span>
              <span className="text-xl font-black text-ink-900 dark:text-white">{totalProperties}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{totalUnits} total units</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Occupancy Rate</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{occupancyRate}%</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{occupiedCount} occupied</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Gross Annual Value</span>
              <span className="text-base sm:text-lg font-black text-moss-800 dark:text-[#E5C583]">₦{totalAnnualRent.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Est. gross rent/yr</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Ledger Health</span>
              <span className={`text-xl font-black flex items-center gap-1 ${verifiedPercentage === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                <CheckCircle2 className="h-4 w-4 inline" /> {verifiedPercentage}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{verifiedCount} of {totalProperties} verified</span>
            </div>
          </div>

          {/* Table 1: Registered Property Portfolio */}
          <div>
            <h3 className="text-sm font-bold text-ink-900 dark:text-white mb-2.5 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-moss-700 dark:text-[#E5C583]" />
              Property Portfolio & Occupancy Register
            </h3>

            {safeProperties.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                No properties registered in portfolio.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10.5px]">
                    <tr>
                      <th className="p-3">Property Title</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Rent / Year</th>
                      <th className="p-3">Occupancy Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-ink-800 dark:text-cream-100/90 font-medium">
                    {safeProperties.map((p, idx) => {
                      const details = getPropertyStatusDetails(p);

                      return (
                        <tr key={p.id || idx} className="hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="p-3 font-bold">{p.title}</td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">{p.location}</td>
                          <td className="p-3 font-bold text-moss-700 dark:text-[#E5C583]">{p.price}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${details.badgeClass}`}>
                              {details.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Certification Footer Notice */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="h-5 w-5 text-moss-700 dark:text-[#E5C583] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-ink-900 dark:text-white block mb-0.5">Official Lodale System Statement Certification</span>
              <span>This document serves as an audited statement of your property listings, occupancy statuses, and rental valuations as recorded in the Lodale PMS platform on {reportDate}.</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-ink-100 dark:border-white/10 bg-cream-50 dark:bg-[#162721] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-ink-900 hover:bg-black text-white dark:bg-[#E5C583] dark:hover:bg-[#d8b46e] dark:text-[#16241F] font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Close Statement
          </button>
        </div>

      </div>
    </div>
  );
}
