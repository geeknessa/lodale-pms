import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  PenLine, 
  Clock, 
  Printer, 
  Send, 
  X, 
  Building2, 
  Users, 
  CreditCard, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { rentService } from '../../../services/rentService';

export function LandlordReceipts({ landlordProfile, triggerToast, onBackToHome, initialReceiptId }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'this_month' | 'pending_send'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Signing & Sending state
  const [isSigning, setIsSigning] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSignInput, setShowSignInput] = useState(false);
  const [signatureName, setSignatureName] = useState('');

  // Default signature name from profile
  const defaultLandlordName = useMemo(() => {
    if (!landlordProfile) return 'Property Owner';
    const first = landlordProfile.first_name || '';
    const last = landlordProfile.last_name || '';
    const full = `${first} ${last}`.trim();
    return full || landlordProfile.company_name || 'Property Owner';
  }, [landlordProfile]);

  // Fetch receipts on mount
  const fetchReceipts = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    try {
      const data = await rentService.getLandlordReceipts();
      setReceipts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      if (triggerToast) {
        triggerToast('Failed to load receipts. Please try again.', 'error', 'Error');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  // Auto-open requested receipt (e.g. from notification "View Receipt" button)
  useEffect(() => {
    const targetId = initialReceiptId || sessionStorage.getItem('highlight_receipt_id');
    if (targetId && receipts.length > 0) {
      const found = receipts.find(r => 
        String(r.paymentId) === String(targetId) || 
        String(r.invoiceId) === String(targetId) ||
        String(r.referenceNumber) === String(targetId)
      );
      if (found) {
        setSelectedReceipt(found);
        sessionStorage.removeItem('highlight_receipt_id');
      }
    }
  }, [receipts, initialReceiptId]);

  // When a receipt is selected, initialize signature name
  useEffect(() => {
    if (selectedReceipt) {
      setSignatureName(selectedReceipt.signedBy || defaultLandlordName);
      setShowSignInput(false);
    }
  }, [selectedReceipt, defaultLandlordName]);

  // Filtered & Searched receipts
  const filteredReceipts = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    return receipts.filter((r) => {
      // 1. Tab Filter
      if (filter === 'this_month') {
        if (!r.paymentDate) return false;
        const parts = r.paymentDate.split('-');
        if (parts.length >= 2) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          if (y !== curYear || m !== curMonth) return false;
        }
      } else if (filter === 'pending_send') {
        if (r.sentAt) return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const tenantMatch = (r.tenantName || '').toLowerCase().includes(q);
        const propMatch = (r.propertyTitle || '').toLowerCase().includes(q);
        const refMatch = (r.referenceNumber || '').toLowerCase().includes(q);
        const numMatch = (r.receiptNumber || '').toLowerCase().includes(q);
        return tenantMatch || propMatch || refMatch || numMatch;
      }

      return true;
    });
  }, [receipts, filter, searchQuery]);

  // Summary counts
  const counts = useMemo(() => {
    const total = receipts.length;
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const thisMonth = receipts.filter((r) => {
      if (!r.paymentDate) return false;
      const parts = r.paymentDate.split('-');
      return parts.length >= 2 && parseInt(parts[0], 10) === curYear && parseInt(parts[1], 10) - 1 === curMonth;
    }).length;

    const pendingSend = receipts.filter((r) => !r.sentAt).length;

    return { total, thisMonth, pendingSend };
  }, [receipts]);

  // Handle Signing
  const handleSignReceipt = async () => {
    if (!selectedReceipt) return;
    const finalSigner = signatureName.trim() || defaultLandlordName;
    setIsSigning(true);
    try {
      const res = await rentService.signReceipt(selectedReceipt.paymentId, finalSigner);
      const updatedReceipt = {
        ...selectedReceipt,
        signedBy: res.signedBy || finalSigner,
        signedAt: res.signedAt || new Date().toISOString(),
        status: res.status || 'signed',
      };
      setSelectedReceipt(updatedReceipt);
      setReceipts((prev) =>
        prev.map((r) => (r.paymentId === selectedReceipt.paymentId ? updatedReceipt : r))
      );
      setShowSignInput(false);
      if (triggerToast) {
        triggerToast('Receipt officially signed and verified.', 'success', 'Receipt Signed');
      }
    } catch (err) {
      console.error('Error signing receipt:', err);
      if (triggerToast) {
        triggerToast(err.message || 'Failed to sign receipt', 'error', 'Error');
      }
    } finally {
      setIsSigning(false);
    }
  };

  // Handle Sending
  const handleSendReceipt = async () => {
    if (!selectedReceipt) return;
    setIsSending(true);
    try {
      const res = await rentService.sendReceipt(selectedReceipt.paymentId);
      const updatedReceipt = {
        ...selectedReceipt,
        sentAt: res.sentAt || new Date().toISOString(),
        status: 'sent',
      };
      setSelectedReceipt(updatedReceipt);
      setReceipts((prev) =>
        prev.map((r) => (r.paymentId === selectedReceipt.paymentId ? updatedReceipt : r))
      );

      const emailNote = res.emailSent
        ? ' and email copy dispatched'
        : ' (in-app notification delivered)';
      const msg = res.alreadySent
        ? `Receipt re-sent to tenant${emailNote}.`
        : `Official receipt sent to tenant${emailNote}.`;

      if (triggerToast) {
        triggerToast(msg, 'success', 'Receipt Delivered');
      }
    } catch (err) {
      console.error('Error sending receipt:', err);
      if (triggerToast) {
        triggerToast(err.message || 'Failed to send receipt to tenant', 'error', 'Error');
      }
    } finally {
      setIsSending(false);
    }
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Helper format date
  const formatFriendlyDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #lodale-official-receipt-print, #lodale-official-receipt-print * {
            visibility: visible !important;
          }
          #lodale-official-receipt-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 30px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            z-index: 999999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-[#2C4633]">
        <div>
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="text-xs font-bold text-moss-700 dark:text-[#E5C583] hover:underline flex items-center gap-1.5 mb-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard Home</span>
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-center shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Receipts
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-cream-100/70 font-medium mt-0.5">
                Official payment receipts for your tenants
              </p>
            </div>
          </div>
        </div>

        {/* Refresh button */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <button
            type="button"
            onClick={() => fetchReceipts(false)}
            disabled={isRefreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#192A1F] border border-slate-200 dark:border-[#2C4633] text-slate-600 dark:text-cream-100/70 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh payment receipts"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing || loading ? 'animate-spin text-moss-700 dark:text-[#E5C583]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. FILTERS AND SEARCH TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#192A1F] border border-slate-200 dark:border-[#2C4633] self-start">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-[#00875A] text-white shadow-xs'
                : 'text-slate-600 dark:text-cream-100/70 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              filter === 'all' ? 'bg-white/20' : 'bg-slate-200 dark:bg-white/10'
            }`}>
              {counts.total}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('this_month')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'this_month'
                ? 'bg-[#00875A] text-white shadow-xs'
                : 'text-slate-600 dark:text-cream-100/70 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>This Month</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              filter === 'this_month' ? 'bg-white/20' : 'bg-slate-200 dark:bg-white/10'
            }`}>
              {counts.thisMonth}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending_send')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'pending_send'
                ? 'bg-[#00875A] text-white shadow-xs'
                : 'text-slate-600 dark:text-cream-100/70 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Pending Send</span>
            {counts.pendingSend > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                filter === 'pending_send' ? 'bg-white/20' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
              }`}>
                {counts.pendingSend}
              </span>
            )}
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tenant, property, reference..."
            className="w-full pl-9.5 pr-4 py-2 bg-white dark:bg-[#192A1F] border border-slate-200 dark:border-[#2C4633] rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600/30 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. RECEIPTS TABLE / LIST */}
      <div className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                {searchQuery || filter !== 'all' ? 'No matching receipts' : 'No confirmed receipts yet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-cream-100/60 max-w-sm mx-auto mt-1 leading-relaxed">
                {searchQuery || filter !== 'all'
                  ? 'Try adjusting your search criteria or filter to see more receipts.'
                  : 'Confirmed rent payments made by your tenants via Paystack or verified bank transfer will automatically generate official receipts here.'}
              </p>
            </div>
            {(searchQuery || filter !== 'all') && (
              <button
                type="button"
                onClick={() => { setFilter('all'); setSearchQuery(''); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#2C4633] bg-slate-50/60 dark:bg-black/10 text-slate-500 dark:text-cream-100/60 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-5">Date Paid</th>
                  <th className="py-3.5 px-5">Tenant Name</th>
                  <th className="py-3.5 px-5">Property</th>
                  <th className="py-3.5 px-5">Amount (₦)</th>
                  <th className="py-3.5 px-5">Method</th>
                  <th className="py-3.5 px-5">Reference</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium text-slate-700 dark:text-cream-100/80">
                {filteredReceipts.map((r) => {
                  const isSent = Boolean(r.sentAt);
                  const isSigned = Boolean(r.signedAt || r.signedBy);

                  return (
                    <tr
                      key={r.paymentId}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                      onClick={() => setSelectedReceipt(r)}
                    >
                      {/* Date Paid */}
                      <td className="py-4 px-5 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        {formatFriendlyDate(r.paymentDate)}
                      </td>

                      {/* Tenant Name */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {r.tenantName}
                        </div>
                        {r.tenantEmail && (
                          <div className="text-[10.5px] text-slate-400 dark:text-cream-100/50 truncate max-w-[140px]">
                            {r.tenantEmail}
                          </div>
                        )}
                      </td>

                      {/* Property */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {r.propertyTitle}
                        </div>
                        {r.propertyAddress && (
                          <div className="text-[10.5px] text-slate-400 dark:text-cream-100/50 truncate max-w-[160px]">
                            {r.propertyAddress}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-5 whitespace-nowrap font-extrabold text-slate-900 dark:text-white text-sm">
                        ₦{Number(r.amount || 0).toLocaleString()}
                      </td>

                      {/* Method */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-cream-100">
                          <CreditCard className="h-3 w-3 text-slate-400" />
                          <span>{r.paymentMethod}</span>
                        </span>
                      </td>

                      {/* Reference */}
                      <td className="py-4 px-5 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-cream-100/60 max-w-[150px] truncate" title={r.referenceNumber}>
                        {r.referenceNumber}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {isSent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Sent to tenant</span>
                          </span>
                        ) : isSigned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                            <PenLine className="h-3 w-3" />
                            <span>Signed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                            <Clock className="h-3 w-3" />
                            <span>Generated</span>
                          </span>
                        )}
                      </td>

                      {/* Row action */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReceipt(r);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-[#00875A] dark:text-[#E5C583] hover:bg-[#00875A] hover:text-white dark:hover:bg-[#00875A] dark:hover:text-white text-xs font-bold transition-all cursor-pointer shadow-2xs border border-emerald-200/60 dark:border-emerald-800/30"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. RECEIPT DETAIL MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#142319] border border-slate-200 dark:border-[#2C4633] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Top Action Bar */}
            <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-200 dark:border-[#2C4633] bg-slate-50/80 dark:bg-black/20 no-print">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[#00875A] dark:text-[#E5C583]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Official Receipt Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close receipt modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Printable Receipt Canvas */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-thin">
              
              {/* PRINTABLE RECEIPT CONTAINER */}
              <div
                id="lodale-official-receipt-print"
                className="bg-white text-slate-900 border-2 border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6"
              >
                {/* Official Receipt Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#00875A] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl leading-none font-black text-slate-900 tracking-tight">
                        Lodale
                      </div>
                      <span className="text-[10px] tracking-widest uppercase font-extrabold text-slate-400 block mt-0.5">
                        PROPERTY MANAGEMENT
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="inline-block bg-[#00875A] text-white px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider mb-1 shadow-2xs">
                      Official Rent Receipt
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-800">
                      {selectedReceipt.receiptNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Issue Date: {formatFriendlyDate(selectedReceipt.paymentDate)}
                    </div>
                  </div>
                </div>

                {/* Landlord & Tenant Two-Column Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 rounded-xl p-4 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                      Issued To (Tenant)
                    </span>
                    <div className="font-bold text-sm text-slate-900">
                      {selectedReceipt.tenantName}
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      Property: <span className="font-semibold text-slate-800">{selectedReceipt.propertyTitle}</span>
                    </div>
                    {selectedReceipt.propertyAddress && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {selectedReceipt.propertyAddress}
                      </div>
                    )}
                    {selectedReceipt.tenantEmail && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {selectedReceipt.tenantEmail}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                      Issued By (Landlord / Manager)
                    </span>
                    <div className="font-bold text-sm text-slate-900">
                      {selectedReceipt.landlordName || defaultLandlordName}
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      Verified Portfolio Property Owner
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Payment Ref: <span className="font-mono">{selectedReceipt.referenceNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Method: <span className="font-semibold">{selectedReceipt.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4">Period</th>
                        <th className="py-2.5 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(selectedReceipt.items || []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {item.description || 'Rental Payment'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {selectedReceipt.billingPeriodStart && selectedReceipt.billingPeriodEnd
                              ? `${formatFriendlyDate(selectedReceipt.billingPeriodStart)} - ${formatFriendlyDate(selectedReceipt.billingPeriodEnd)}`
                              : 'Standard Lease Period'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            ₦{Number(item.amount || selectedReceipt.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50/50">
                        <td colSpan="2" className="py-3 px-4 font-extrabold text-slate-900 uppercase text-xs">
                          Total Amount Paid:
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 text-base">
                          ₦{Number(selectedReceipt.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Landlord Stamp & Signature Box */}
                <div className="pt-2">
                  {selectedReceipt.signedBy ? (
                    <div className="border-2 border-dashed border-[#1B4D35] bg-emerald-50/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#1B4D35] text-[#E5C583] flex items-center justify-center shrink-0">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                            Officially Signed & Stamped
                          </span>
                          <span className="font-bold text-sm text-slate-900 block">
                            {selectedReceipt.signedBy}
                          </span>
                          <span className="text-[10.5px] text-slate-500">
                            Digital Signature recorded on {formatFriendlyDate(selectedReceipt.signedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right self-end sm:self-center">
                        <span className="text-[10px] font-black text-emerald-800 uppercase px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300">
                          VERIFIED
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 text-center space-y-3 no-print">
                      <div className="flex items-center justify-center gap-2 text-slate-600 text-xs font-semibold">
                        <PenLine className="h-4 w-4 text-slate-400" />
                        <span>This receipt is not yet digitally signed by the landlord.</span>
                      </div>

                      {showSignInput ? (
                        <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
                          <input
                            type="text"
                            value={signatureName}
                            onChange={(e) => setSignatureName(e.target.value)}
                            placeholder="Your signature name"
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-moss-600"
                          />
                          <button
                            type="button"
                            onClick={handleSignReceipt}
                            disabled={isSigning}
                            className="px-3.5 py-1.5 bg-[#00875A] hover:bg-[#007048] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            {isSigning ? 'Signing...' : 'Confirm Sign'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSignInput(false)}
                            className="p-1.5 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowSignInput(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00875A] hover:bg-[#007048] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          <PenLine className="h-3.5 w-3.5" />
                          <span>Sign Receipt</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Delivery Notice */}
                {selectedReceipt.sentAt && (
                  <div className="text-center text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                    Delivered to tenant in-app on {formatFriendlyDate(selectedReceipt.sentAt)}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Action Buttons */}
            <div className="p-4 sm:px-6 border-t border-slate-200 dark:border-[#2C4633] bg-slate-50/80 dark:bg-black/20 flex flex-wrap items-center justify-between gap-3 no-print">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2.5">
                {/* Print/Download Button */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 text-slate-800 dark:text-white border border-slate-300 dark:border-white/10 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Download / Print</span>
                </button>

                {/* Send Copy to Tenant Button */}
                <button
                  type="button"
                  onClick={handleSendReceipt}
                  disabled={isSending}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    selectedReceipt.sentAt
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#00875A] hover:bg-[#007048] text-white dark:bg-[#00875A] dark:hover:bg-[#007048] dark:text-white'
                  } disabled:opacity-50`}
                  title={selectedReceipt.sentAt ? `Already sent on ${formatFriendlyDate(selectedReceipt.sentAt)}` : 'Send official receipt to tenant'}
                >
                  <Send className={`h-3.5 w-3.5 ${isSending ? 'animate-pulse' : ''}`} />
                  <span>
                    {isSending
                      ? 'Sending...'
                      : selectedReceipt.sentAt
                        ? 'Re-send to Tenant'
                        : 'Send Copy to Tenant'}
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default LandlordReceipts;
