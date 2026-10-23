import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileCheck, 
  FileText, 
  Search, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Printer, 
  X, 
  Building2, 
  User, 
  CreditCard, 
  ShieldCheck, 
  ChevronRight,
  AlertCircle,
  Calendar,
  Lock
} from 'lucide-react';
import { leaseService } from '../../../services/leaseService';
import { 
  formatCurrency, 
  formatDisplayDate, 
  getRentPeriodSuffix, 
  getRentPeriodLabel 
} from '../../../utils/formatters';
import { parseRentAmount } from '../../../utils/landlordMetrics';

export function LandlordLeases({ landlordProfile, triggerToast, onBackToHome, onNavigateTab }) {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'fully_signed' | 'past'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLease, setSelectedLease] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch landlord leases from backend API
  const fetchLeases = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const data = await leaseService.getMyLeases();
      setLeases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[LandlordLeases] Error fetching leases:', err);
      const msg = err?.message || 'Failed to load lease agreements. Please try again.';
      setErrorMsg(msg);
      if (triggerToast) {
        triggerToast(msg, 'error', 'Error');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeases();
  }, []);

  // Filtered and searched leases
  const filteredLeases = useMemo(() => {
    const safeList = Array.isArray(leases) ? leases : [];
    const query = (searchQuery || '').trim().toLowerCase();
    const now = new Date();

    return safeList.filter((lease) => {
      if (!lease) return false;
      const status = (lease.status || '').toLowerCase();
      const endDate = lease.end_date || lease.endDate ? new Date(lease.end_date || lease.endDate) : null;
      const isPast = status === 'ended' || status === 'terminated' || status === 'cancelled' || (endDate && endDate < now);

      // Status Filter
      if (filter === 'active') {
        const isActive = status === 'active' || (status === 'fully_signed' && (!endDate || endDate >= now));
        if (!isActive) return false;
      } else if (filter === 'fully_signed') {
        if (status !== 'fully_signed') return false;
      } else if (filter === 'past') {
        if (!isPast) return false;
      }

      // Search Filter
      if (query) {
        const tenantName = (lease.tenant_name || lease.tenantName || '').toLowerCase();
        const propTitle = (lease.property_title || lease.propertyTitle || '').toLowerCase();
        const propAddress = (lease.property_full_address || lease.property_address || '').toLowerCase();
        const matchesQuery = tenantName.includes(query) || propTitle.includes(query) || propAddress.includes(query);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [leases, filter, searchQuery]);

  // Status Badge Component
  const renderStatusBadge = (status) => {
    const s = (status || 'draft').toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50">
          <CheckCircle2 className="h-3 w-3" /> ACTIVE
        </span>
      );
    }
    if (s === 'fully_signed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800/50">
          <CheckCircle2 className="h-3 w-3" /> FULLY SIGNED
        </span>
      );
    }
    if (s === 'partially_signed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50">
          <Clock className="h-3 w-3" /> PARTIALLY SIGNED
        </span>
      );
    }
    if (s === 'ended' || s === 'terminated' || s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50">
          <X className="h-3 w-3" /> {s.toUpperCase()}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-300 border border-slate-300 dark:border-white/10">
        <Clock className="h-3 w-3" /> {s.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#192A1F] p-6 rounded-3xl border border-slate-200/80 dark:border-[#2C4633] shadow-xs">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBackToHome}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-cream-100/80 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Back to Dashboard Home"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Leases
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-[#E5C583]/15 dark:text-[#E5C583] border border-emerald-200 dark:border-[#E5C583]/30">
                {Array.isArray(leases) ? leases.length : 0} Total
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-cream-100/60 mt-0.5">
              Signed and active tenancy agreements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchLeases(false)}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2C4633] bg-white dark:bg-white/5 text-slate-700 dark:text-cream-100/80 hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            title="Refresh leases"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. FILTERS AND SEARCH */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#192A1F] rounded-2xl border border-slate-200/60 dark:border-[#2C4633] overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'fully_signed', label: 'Fully signed' },
            { id: 'past', label: 'Past' },
          ].map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-[#00875A] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-cream-100/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tenant or property..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-[#2C4633] bg-white dark:bg-[#192A1F] text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#00875A] dark:focus:border-[#E5C583] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. ERROR BANNER */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between text-rose-800 dark:text-rose-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchLeases(false)}
            className="font-bold underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. LEASES LIST */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 rounded-3xl bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] animate-pulse flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-white/10 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-40 bg-slate-200 dark:bg-white/10 rounded-md" />
                  <div className="h-3 w-56 bg-slate-200 dark:bg-white/10 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded-md" />
                <div className="h-9 w-20 bg-slate-200 dark:bg-white/10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredLeases.length === 0 ? (
        /* EMPTY STATE */
        <div className="p-10 sm:p-14 text-center rounded-3xl bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-white/5 border border-emerald-100 dark:border-white/10 flex items-center justify-center mx-auto text-[#00875A] dark:text-[#E5C583]">
            <FileCheck className="h-8 w-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {searchQuery || filter !== 'all' ? 'No matching lease agreements' : 'No lease agreements yet'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-cream-100/70 leading-relaxed">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your search query or filter to find specific contracts.'
                : 'Leases appear here after rent is paid and a lease is generated from Applications.'}
            </p>
          </div>
          <div className="pt-2">
            {onNavigateTab ? (
              <button
                type="button"
                onClick={() => onNavigateTab(0, 'Applications')}
                className="px-5 py-2.5 rounded-xl bg-[#00875A] hover:bg-[#007048] text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                Go to Applications <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onBackToHome}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      ) : (
        /* LIST OF LEASES */
        <div className="space-y-3">
          {filteredLeases.map((lease) => {
            const tenantName = lease.tenant_name || lease.tenantName || 'Tenant';
            const propertyTitle = lease.property_title || lease.propertyTitle || 'Property';
            const propertyAddress = lease.property_full_address || lease.property_address || '';
            const parsedRent = parseRentAmount(lease.rent_amount ?? lease.rentAmount);
            const rentFormatted = parsedRent !== null
              ? formatCurrency(parsedRent, getRentPeriodSuffix(lease.rent_period || lease.rentPeriod))
              : "—";
            const startDateStr = formatDisplayDate(lease.start_date || lease.startDate);
            const endDateStr = formatDisplayDate(lease.end_date || lease.endDate);
            const tenantSigned = Boolean(lease.tenant_signed_at || lease.tenantSignedAt);
            const landlordSigned = Boolean(lease.landlord_signed_at || lease.landlordSignedAt);

            return (
              <div
                key={lease.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] shadow-xs hover:border-[#00875A]/40 dark:hover:border-[#E5C583]/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left Section: Icon & Info */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-white/5 border border-emerald-100 dark:border-white/10 flex items-center justify-center shrink-0 text-[#00875A] dark:text-[#E5C583]">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                        {propertyTitle}
                      </h3>
                      {renderStatusBadge(lease.status)}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-cream-100/70 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-cream-100">
                        <User className="h-3.5 w-3.5 text-[#00875A] dark:text-[#E5C583]" />
                        {tenantName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {startDateStr} – {endDateStr}
                      </span>
                      {propertyAddress && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline truncate max-w-xs">{propertyAddress}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Section: Signatures, Rent & View Button */}
                <div className="flex items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-white/5">
                  {/* Signature Hints */}
                  <div className="flex items-center gap-3 text-[11px]">
                    <div className="flex items-center gap-1" title={tenantSigned ? 'Tenant has signed' : 'Awaiting tenant signature'}>
                      <span className="text-slate-400 dark:text-cream-100/50">Tenant:</span>
                      {tenantSigned ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="h-3 w-3" /> Signed
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1" title={landlordSigned ? 'Landlord has signed' : 'Awaiting landlord signature'}>
                      <span className="text-slate-400 dark:text-cream-100/50">Landlord:</span>
                      {landlordSigned ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="h-3 w-3" /> Signed
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rent amount */}
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white block">
                      {rentFormatted}
                    </span>
                  </div>

                  {/* View action button */}
                  <button
                    type="button"
                    onClick={() => setSelectedLease(lease)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>View</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. LEASE DETAIL MODAL */}
      {selectedLease && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedLease(null)}
        >
          <div 
            className="w-full max-w-2xl bg-white dark:bg-[#0E1A14] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-white/10 max-h-[92vh] overflow-y-auto relative text-left space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-white/5 text-[#00875A] dark:text-[#E5C583] rounded-2xl border border-emerald-100 dark:border-white/10">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      Residential Lease Agreement
                    </h2>
                    {renderStatusBadge(selectedLease.status)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-cream-100/60 mt-0.5">
                    Official digitally executed contract on Lodale PMS
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-cream-100/80 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Print / Save as PDF"
                >
                  <Printer className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLease(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close agreement"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="space-y-4 text-xs leading-relaxed">
              {/* Property & Term Overview Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-cream-100/50 block">
                      Property
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedLease.property_title || selectedLease.propertyTitle || 'Property Unit'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-cream-100/70 mt-0.5">
                      {selectedLease.property_full_address || selectedLease.property_address || 'Address provided on record'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-cream-100/50 block">
                      Agreed Rent
                    </span>
                    <span className="text-base font-extrabold text-[#00875A] dark:text-[#E5C583] block mt-0.5">
                      {(() => {
                        const parsed = parseRentAmount(selectedLease.rent_amount ?? selectedLease.rentAmount);
                        return parsed !== null
                          ? formatCurrency(parsed, getRentPeriodSuffix(selectedLease.rent_period || selectedLease.rentPeriod))
                          : "—";
                      })()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/60 dark:border-white/5 text-[11.5px]">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-cream-100/50 block">Start Date</span>
                    <strong className="text-slate-800 dark:text-white">
                      {formatDisplayDate(selectedLease.start_date || selectedLease.startDate)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-cream-100/50 block">End Date</span>
                    <strong className="text-slate-800 dark:text-white">
                      {formatDisplayDate(selectedLease.end_date || selectedLease.endDate)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-cream-100/50 block">Billing Period</span>
                    <strong className="text-slate-800 dark:text-white">
                      {getRentPeriodLabel(selectedLease.rent_period || selectedLease.rentPeriod)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-cream-100/50 block">Security Deposit</span>
                    <strong className="text-slate-800 dark:text-white">
                      {Number(selectedLease.security_deposit || 0) > 0
                        ? formatCurrency(selectedLease.security_deposit)
                        : 'None'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Parties Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Landlord Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-cream-100/50 block mb-1">
                    Landlord (Lessor)
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#13231B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <User className="h-4 w-4 text-[#E5C583]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {landlordProfile?.first_name 
                          ? `${landlordProfile.first_name} ${landlordProfile.last_name || ''}`.trim()
                          : (selectedLease.landlord_name || 'Property Owner')}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-cream-100/60 truncate">
                        {landlordProfile?.email || selectedLease.landlord_email || 'Verified Landlord'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tenant Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-cream-100/50 block mb-1">
                    Tenant (Lessee)
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#00875A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {selectedLease.tenant_name || selectedLease.tenantName || 'Tenant'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-cream-100/60 truncate">
                        {selectedLease.tenant_email || 'Verified Tenant'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Clauses & Policies */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
                <h5 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#00875A] dark:text-[#E5C583]" />
                  Tenancy Covenants & Policies
                </h5>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-cream-100/80">
                  <li>The Lessee shall pay agreed rent punctually in accordance with the billing schedule.</li>
                  <li>
                    Pets policy:{' '}
                    <strong>
                      {selectedLease.include_pets ? 'Allowed with prior consent.' : 'No unauthorized pets permitted on premises.'}
                    </strong>
                  </li>
                  <li>
                    Smoking policy:{' '}
                    <strong>
                      {selectedLease.include_smoking ? 'Permitted in designated smoking zones.' : 'Strictly no smoking inside the premises.'}
                    </strong>
                  </li>
                  <li>
                    Late fee policy:{' '}
                    <strong>
                      {selectedLease.include_late_fee ? 'Standard late payment penalty applies after grace period.' : 'No late penalty stipulated.'}
                    </strong>
                  </li>
                  {selectedLease.custom_clauses && (
                    <li className="italic text-slate-700 dark:text-cream-100">
                      Additional terms: "{selectedLease.custom_clauses}"
                    </li>
                  )}
                </ul>
              </div>

              {/* Signatures & Execution Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-white/5 border border-emerald-200/60 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-[#00875A] dark:text-[#E5C583]" />
                    Digital Execution Audit Trail
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-cream-100/50">
                    Ref: {selectedLease.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-[#07130D] rounded-xl border border-slate-200/60 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 dark:text-cream-100/50 block">Landlord Signature</span>
                    {selectedLease.landlord_signed_at ? (
                      <div className="mt-1">
                        <strong className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Digitally Signed
                        </strong>
                        <span className="text-[10px] text-slate-500 dark:text-cream-100/60 block mt-0.5">
                          {formatDisplayDate(selectedLease.landlord_signed_at, { includeTime: true })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
                        <Clock className="h-3.5 w-3.5" /> Pending signature
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-white dark:bg-[#07130D] rounded-xl border border-slate-200/60 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 dark:text-cream-100/50 block">Tenant Signature</span>
                    {selectedLease.tenant_signed_at ? (
                      <div className="mt-1">
                        <strong className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Digitally Signed
                        </strong>
                        <span className="text-[10px] text-slate-500 dark:text-cream-100/60 block mt-0.5">
                          {formatDisplayDate(selectedLease.tenant_signed_at, { includeTime: true })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
                        <Clock className="h-3.5 w-3.5" /> Pending signature
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print / Save Agreement
              </button>
              <button
                type="button"
                onClick={() => setSelectedLease(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandlordLeases;
