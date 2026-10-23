import React, { useState, useMemo } from "react";
import {
  Activity,
  Percent,
  AlertTriangle,
  Users,
  Building2,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  RefreshCw,
  Plus
} from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import { getPropertyStatus, parsePaymentDateYearMonth } from "../../../utils/landlordMetrics";

export default function PerformanceOverview({
  properties = [],
  leases = [],
  invoices = [],
  applications = [],
  loading = false,
  onRefresh,
  onBackToHome,
  onNavigateTab,
  onAddProperty,
  onSelectTenant: _onSelectTenant
}) {
  // Period filter: "month" (default) | "year"
  const [period, setPeriod] = useState("month");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Safe helper to extract initials for avatar
  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "TN";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Filter out soft-deleted properties
  const nonDeletedProperties = useMemo(() => {
    return (properties || []).filter(p => !p.is_deleted && p.status !== 'deleted');
  }, [properties]);

  // Active tenancies only
  const activeLeases = useMemo(() => {
    return (leases || []).filter(l => {
      const s = (l.status || '').toLowerCase().trim();
      return s === 'active' || s === 'leased';
    });
  }, [leases]);

  // Portfolio Occupancy & Units Breakdown
  const unitsSummary = useMemo(() => {
    let totalUnits = 0;
    let occupiedUnits = 0;
    let livePropsCount = 0;
    let vacantPropsCount = 0;

    const propertyRows = nonDeletedProperties.map(p => {
      const status = getPropertyStatus(p, activeLeases);
      const unitsList = Array.isArray(p.units) && p.units.length > 0 ? p.units : null;
      const propTotalUnits = unitsList ? unitsList.length : 1;

      // Count active leases matching this property
      const propLeases = activeLeases.filter(l => String(l.property_id || l.propertyId || '') === String(p.id));
      let propOccupiedUnits = 0;
      if (status.isOccupied) {
        propOccupiedUnits = propLeases.length > 0 ? Math.min(propLeases.length, propTotalUnits) : 1;
      }

      const propVacantUnits = Math.max(0, propTotalUnits - propOccupiedUnits);
      const propOccupancyRate = propTotalUnits > 0 ? Math.round((propOccupiedUnits / propTotalUnits) * 100) : 0;

      if (status.isLive) {
        livePropsCount++;
        totalUnits += propTotalUnits;
        occupiedUnits += propOccupiedUnits;
        if (propOccupiedUnits === 0) {
          vacantPropsCount++;
        }
      }

      return {
        id: p.id,
        title: p.title || 'Untitled Property',
        location: p.location || p.city || 'Abuja',
        image: p.cover_image || p.images?.[0] || '/skyline_apartment.png',
        totalUnits: propTotalUnits,
        occupiedUnits: propOccupiedUnits,
        vacantUnits: propVacantUnits,
        occupancyRate: propOccupancyRate,
        status,
        price: p.price || (p.rent_amount ? `₦${Number(p.rent_amount).toLocaleString()}` : '—')
      };
    });

    const overallOccupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    const vacantUnits = Math.max(0, totalUnits - occupiedUnits);

    return {
      totalUnits,
      occupiedUnits,
      vacantUnits,
      livePropsCount,
      vacantPropsCount,
      overallOccupancyRate,
      propertyRows
    };
  }, [nonDeletedProperties, activeLeases]);

  // Collection Rate & Revenue for Selected Period
  const revenueSummary = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const safeInvoices = Array.isArray(invoices) ? invoices : [];

    // Filter paid invoices in period
    const paidInvoicesInPeriod = safeInvoices.filter(i => {
      const st = (i.status || '').toLowerCase().trim();
      if (st !== 'paid' && st !== 'completed') return false;
      const rawDate = i.paid_at || i.paidAt || i.payment_date || i.paymentDate;
      if (!rawDate) return false;
      const ym = parsePaymentDateYearMonth(rawDate);
      if (!ym) return false;
      if (period === 'month') {
        return ym.year === curYear && ym.month === curMonth;
      } else {
        return ym.year === curYear;
      }
    });

    const paidAmount = paidInvoicesInPeriod.reduce((sum, i) => {
      const amt = parseFloat(i.grandTotal || i.grand_total || i.amount || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    // Filter all invoices issued or due in period (Expected)
    const invoicesInPeriod = safeInvoices.filter(i => {
      const rawDate = i.due_date || i.dueDate || i.created_at || i.createdAt || i.paid_at || i.payment_date;
      if (!rawDate) return false;
      const ym = parsePaymentDateYearMonth(rawDate);
      if (!ym) return false;
      if (period === 'month') {
        return ym.year === curYear && ym.month === curMonth;
      } else {
        return ym.year === curYear;
      }
    });

    let expectedAmount = invoicesInPeriod.reduce((sum, i) => {
      const amt = parseFloat(i.grandTotal || i.grand_total || i.amount || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    // If no invoices were generated yet but active leases exist, fall back to lease monthly schedule
    if (expectedAmount === 0 && activeLeases.length > 0) {
      const monthlyLeaseRentSum = activeLeases.reduce((sum, l) => {
        const amt = parseFloat(l.rent_amount || l.rent || l.amount || 0);
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);
      expectedAmount = period === 'month' ? monthlyLeaseRentSum : monthlyLeaseRentSum * 12;
    }

    expectedAmount = Math.max(expectedAmount, paidAmount);

    let collectionRate = null;
    let collectionReason = '';
    if (expectedAmount > 0) {
      collectionRate = Math.min(100, Math.round((paidAmount / expectedAmount) * 100));
    } else {
      collectionReason = 'No rent due or issued in this period';
    }

    return {
      paidAmount,
      expectedAmount,
      collectionRate,
      collectionReason,
      paidInvoicesCount: paidInvoicesInPeriod.length
    };
  }, [invoices, activeLeases, period]);

  // Arrears (Unpaid & Overdue Rent)
  const arrearsSummary = useMemo(() => {
    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    const now = new Date();

    const unpaid = safeInvoices.filter(i => {
      const st = (i.status || '').toLowerCase().trim();
      return st === 'unpaid' || st === 'overdue' || st === 'pending';
    });

    const arrearsItems = unpaid.map(i => {
      const amount = parseFloat(i.grandTotal || i.grand_total || i.amount || 0) || 0;
      const rawDue = i.due_date || i.dueDate;
      let dueDateFormatted = 'Payment Pending';
      let isOverdue = false;

      if (rawDue) {
        const d = new Date(rawDue);
        if (!isNaN(d.getTime())) {
          dueDateFormatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          isOverdue = d < now;
        }
      }

      return {
        id: i.id,
        invoiceNumber: i.invoice_number || i.invoiceNumber || `#INV-${i.id}`,
        tenantName: i.tenant_name || i.tenantName || i.tenant?.name || i.tenant?.full_name || 'Tenant',
        tenantEmail: i.tenant_email || i.tenant?.email || '',
        propertyTitle: i.property_title || i.propertyTitle || i.property?.title || 'Leased Property',
        propertyId: i.property_id || i.propertyId,
        amount,
        rawDue,
        dueDateFormatted,
        isOverdue,
        status: isOverdue ? 'overdue' : 'unpaid'
      };
    }).sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return b.amount - a.amount;
    });

    const totalArrearsAmount = arrearsItems.reduce((sum, item) => sum + item.amount, 0);

    return {
      totalArrearsAmount,
      totalArrearsCount: arrearsItems.length,
      arrearsItems
    };
  }, [invoices]);

  // Pending Applications
  const pendingAppsCount = useMemo(() => {
    return (applications || []).filter(a => {
      const st = (a.status || '').toLowerCase().trim();
      return st === 'pending' || st === 'submitted' || st === 'under_review' || st === 'received';
    }).length;
  }, [applications]);

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-[#2C4633]">
        <div>
          <button
            type="button"
            onClick={onBackToHome}
            className="text-xs font-semibold text-emerald-800 dark:text-[#E5C583] hover:underline flex items-center gap-1.5 mb-2.5 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard Home</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-[#E5C583] border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Performance Overview
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-cream-100/70 font-normal mt-0.5">
                As of {currentDateFormatted} · Real-time portfolio health based on active leases and invoices
              </p>
            </div>
          </div>
        </div>

        {/* Header Controls: Period Segmented Control + Manual Refresh */}
        <div className="flex items-center gap-3 self-start md:self-center shrink-0">
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#14221B] border border-slate-200 dark:border-[#2C4633]">
            <button
              type="button"
              onClick={() => setPeriod("month")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 ${period === "month"
                ? "bg-white text-slate-900 shadow-xs dark:bg-[#2C4633] dark:text-white font-semibold"
                : "text-slate-600 dark:text-cream-100/70 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setPeriod("year")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 ${period === "year"
                ? "bg-white text-slate-900 shadow-xs dark:bg-[#2C4633] dark:text-white font-semibold"
                : "text-slate-600 dark:text-cream-100/70 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              This Year
            </button>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing || loading}
            aria-label="Refresh metrics"
            title="Refresh metrics"
            className="p-2.5 rounded-xl bg-white dark:bg-[#192A1F] border border-slate-200 dark:border-[#2C4633] text-slate-600 dark:text-cream-100/70 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing || loading ? 'animate-spin text-emerald-800 dark:text-[#E5C583]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. ZERO PROPERTIES EMPTY STATE BANNER */}
      {nonDeletedProperties.length === 0 && !loading && (
        <div className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-2xl p-8 sm:p-10 text-center max-w-xl mx-auto space-y-4 my-6 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-[#E5C583] flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-800/30">
            <Building2 className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              No Properties in Portfolio
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-cream-100/70 max-w-md mx-auto leading-relaxed font-normal">
              Add your first rental property listing to start measuring occupancy rate, rent collection performance, and tenant retention.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddProperty}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B4D35] hover:bg-[#143D2A] dark:bg-[#E5C583] dark:hover:bg-[#d4b371] text-white dark:text-[#09090b] font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Property</span>
          </button>
        </div>
      )}

      {/* 3. ZERO LEASES NOTICE BANNER (Properties exist, but no leases signed yet) */}
      {nonDeletedProperties.length > 0 && activeLeases.length === 0 && !loading && (
        <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 shrink-0">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200">
                No active leases recorded yet
              </h4>
              <p className="text-[12px] text-amber-700 dark:text-amber-300/80 mt-0.5 font-normal">
                Review prospective tenant applications and issue digital leases to unlock live rent collection and occupancy tracking.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab(0, "Applications")}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shrink-0 shadow-xs self-start sm:self-center focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Review Applications &rarr;
          </button>
        </div>
      )}

      {/* 4. KPI ROW (4 RESPONSIVE EQUAL HEIGHT CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* KPI 1: Occupancy Rate */}
        <div className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[12px] sm:text-[13px] font-medium text-slate-500 dark:text-cream-100/60">
                Occupancy Rate
              </span>
              <div className="h-8.5 w-8.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-cream-100/80 flex items-center justify-center shrink-0">
                <Percent className="h-4 w-4 text-emerald-800 dark:text-[#E5C583]" />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-8 w-20 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full" />
              </div>
            ) : (
              <div>
                <div className="text-[22px] sm:text-[25px] font-semibold text-slate-900 dark:text-white tracking-tight tabular-nums leading-tight">
                  {unitsSummary.totalUnits > 0 ? `${unitsSummary.overallOccupancyRate}%` : "—"}
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden my-2.5">
                  <div
                    className="h-1.5 rounded-full bg-emerald-600 dark:bg-[#E5C583] transition-all duration-500 motion-reduce:transition-none"
                    style={{ width: `${unitsSummary.totalUnits > 0 ? Math.min(100, Math.max(0, unitsSummary.overallOccupancyRate)) : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-cream-100/60 font-normal truncate mt-0.5">
            {unitsSummary.totalUnits > 0
              ? `${unitsSummary.occupiedUnits} of ${unitsSummary.totalUnits} units occupied`
              : "No listed property units to evaluate"}
          </p>
        </div>

        {/* KPI 2: Collection Rate */}
        <div className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[12px] sm:text-[13px] font-medium text-slate-500 dark:text-cream-100/60">
                Collection Rate
              </span>
              <div className="h-8.5 w-8.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-cream-100/80 flex items-center justify-center shrink-0">
                <CreditCard className="h-4 w-4 text-emerald-800 dark:text-[#E5C583]" />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-8 w-20 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full" />
              </div>
            ) : (
              <div>
                <div className="text-[22px] sm:text-[25px] font-semibold text-slate-900 dark:text-white tracking-tight tabular-nums leading-tight">
                  {revenueSummary.collectionRate !== null ? `${revenueSummary.collectionRate}%` : "—"}
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden my-2.5">
                  <div
                    className="h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-500 motion-reduce:transition-none"
                    style={{ width: `${revenueSummary.collectionRate !== null ? Math.min(100, Math.max(0, revenueSummary.collectionRate)) : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <p
            className="text-[11px] sm:text-xs text-slate-500 dark:text-cream-100/60 font-normal truncate mt-0.5"
            title={revenueSummary.collectionRate !== null ? `${formatCurrency(revenueSummary.paidAmount)} collected of ${formatCurrency(revenueSummary.expectedAmount)} expected (${period === 'month' ? 'this month' : 'this year'})` : revenueSummary.collectionReason}
          >
            {revenueSummary.collectionRate !== null
              ? `${formatCurrency(revenueSummary.paidAmount)} of ${formatCurrency(revenueSummary.expectedAmount)}`
              : revenueSummary.collectionReason}
          </p>
        </div>

        {/* KPI 3: Total Arrears (Red ONLY when > 0, neutral when 0) */}
        <div className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[12px] sm:text-[13px] font-medium text-slate-500 dark:text-cream-100/60">
                Total Arrears
              </span>
              <div className={`h-8.5 w-8.5 rounded-xl flex items-center justify-center shrink-0 border ${arrearsSummary.totalArrearsAmount > 0
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40"
                : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-cream-100/80 border border-slate-200/60 dark:border-white/10"
                }`}>
                {arrearsSummary.totalArrearsAmount > 0 ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-8 w-24 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
                <div className="h-1.5 w-full bg-transparent my-2.5" />
              </div>
            ) : (
              <div>
                <div
                  className={`text-[20px] sm:text-[24px] font-semibold tracking-tight tabular-nums leading-tight ${arrearsSummary.totalArrearsAmount > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-900 dark:text-white"
                    }`}
                  title={formatCurrency(arrearsSummary.totalArrearsAmount)}
                >
                  {formatCurrency(arrearsSummary.totalArrearsAmount)}
                </div>
                {/* Visual spacer corresponding to progress bar height to ensure identical visual card height */}
                <div className="w-full h-1.5 my-2.5" />
              </div>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-cream-100/60 font-normal truncate mt-0.5">
            {arrearsSummary.totalArrearsCount > 0
              ? `${arrearsSummary.totalArrearsCount} overdue/unpaid ${arrearsSummary.totalArrearsCount === 1 ? 'invoice' : 'invoices'}`
              : "0 overdue invoices · Portfolio in good standing"}
          </p>
        </div>

        {/* KPI 4: Active Tenants (Stays neutral) */}
        <button
          type="button"
          onClick={() => onNavigateTab(2)}
          className="w-full text-left bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full hover:border-emerald-600/40 dark:hover:border-[#E5C583]/40 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[12px] sm:text-[13px] font-medium text-slate-500 dark:text-cream-100/60">
                Active Tenants
              </span>
              <div className="h-8.5 w-8.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-cream-100/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Users className="h-4 w-4 text-emerald-800 dark:text-[#E5C583]" />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-8 w-16 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
                <div className="h-1.5 w-full bg-transparent my-2.5" />
              </div>
            ) : (
              <div>
                <div className="text-[22px] sm:text-[25px] font-semibold text-slate-900 dark:text-white tracking-tight tabular-nums leading-tight">
                  {activeLeases.length}
                </div>
                {/* Visual spacer corresponding to progress bar height to ensure identical visual card height */}
                <div className="w-full h-1.5 my-2.5" />
              </div>
            )}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 dark:text-cream-100/60 font-normal truncate flex items-center justify-between mt-0.5">
            <span className="truncate">{unitsSummary.occupiedUnits} tenancies across {unitsSummary.livePropsCount} live listings</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-800 dark:group-hover:text-[#E5C583] group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
          </div>
        </button>

      </div>

      {/* 5. ROW 2: NEEDS ATTENTION + OCCUPANCY BY PROPERTY (EQUAL HEIGHT SCROLLABLE CARDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        {/* SECTION A: NEEDS ATTENTION (EQUAL HEIGHT TO OCCUPANCY CARD) */}
        <div className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col h-[420px] w-full">
          {/* Card Header (fixed height, shrink-0) */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-cream-100/80 shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                    Needs Attention
                  </h3>
                  {arrearsSummary.totalArrearsCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40 shrink-0">
                      {arrearsSummary.totalArrearsCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-cream-100/60 font-normal truncate">
                  Unpaid and overdue tenant rent invoices
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab(0, "Payments")}
              className="text-xs font-semibold text-emerald-800 dark:text-[#E5C583] hover:underline cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 rounded shrink-0 ml-2"
            >
              View Ledger &rarr;
            </button>
          </div>

          {/* Scrollable Content Area (flex-1 min-h-0 with smooth scrolling) */}
          {loading ? (
            <div className="flex-1 min-h-0 overflow-hidden space-y-2.5 py-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : arrearsSummary.arrearsItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583] flex items-center justify-center mb-1">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                All caught up - no unpaid invoices
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-cream-100/60 max-w-xs font-normal">
                All active tenant invoices are settled and in good standing. No collection actions required.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1.5">
              {arrearsSummary.arrearsItems.map(item => {
                const initials = getInitials(item.tenantName);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigateTab(2)}
                    className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.04] flex items-center justify-between gap-3 cursor-pointer group transition-all focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Initials Avatar */}
                      <div className="w-8 h-8 rounded-lg bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-white font-semibold text-[11px] flex items-center justify-center shrink-0 uppercase tracking-wider">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-semibold text-xs text-slate-900 dark:text-white truncate group-hover:text-emerald-800 dark:group-hover:text-[#E5C583] transition-colors">
                          {item.tenantName}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-cream-100/60 truncate" title={`${item.propertyTitle} · ${item.invoiceNumber}`}>
                          {item.propertyTitle} · {item.invoiceNumber}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs sm:text-sm tabular-nums text-slate-900 dark:text-white block">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border mt-0.5 ${item.isOverdue
                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40"
                        }`}>
                        {item.isOverdue ? `Overdue · ${item.dueDateFormatted}` : `Due ${item.dueDateFormatted}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Symmetrical Footer (fixed height, shrink-0) */}
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-cream-100/60 shrink-0">
            <span>
              {arrearsSummary.totalArrearsCount > 0 ? (
                <>Outstanding: <strong className="text-rose-600 dark:text-rose-400 font-semibold tabular-nums">{formatCurrency(arrearsSummary.totalArrearsAmount)}</strong></>
              ) : (
                <>Status: <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">In Good Standing</strong></>
              )}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab(0, "Payments")}
              className="text-xs font-semibold text-emerald-800 dark:text-[#E5C583] hover:underline flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
            >
              <span>{arrearsSummary.totalArrearsCount > 0 ? `View ${arrearsSummary.totalArrearsCount} Invoices` : 'Payment Records'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* SECTION B: OCCUPANCY BY PROPERTY (EQUAL HEIGHT TO NEEDS ATTENTION CARD) */}
        <div className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col h-[420px] w-full">
          {/* Card Header (fixed height, shrink-0) */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-cream-100/80 shrink-0">
                <Building2 className="h-4 w-4 text-emerald-800 dark:text-[#E5C583]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                    Occupancy by Property
                  </h3>
                  {unitsSummary.propertyRows.length > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-cream-100 border border-slate-200/60 dark:border-white/10 shrink-0">
                      {unitsSummary.propertyRows.length}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-cream-100/60 font-normal truncate">
                  Unit occupancy status across portfolio listings
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab(1)}
              className="text-xs font-semibold text-emerald-800 dark:text-[#E5C583] hover:underline cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 rounded shrink-0 ml-2"
            >
              All Properties &rarr;
            </button>
          </div>

          {/* Scrollable Content Area (flex-1 min-h-0 with smooth scrolling) */}
          {loading ? (
            <div className="flex-1 min-h-0 overflow-hidden space-y-2.5 py-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : unitsSummary.propertyRows.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-cream-100/40 flex items-center justify-center mb-1">
                <Building2 className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                No properties registered yet
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-cream-100/60 max-w-xs font-normal">
                Add properties to view unit occupancy status across your portfolio listings.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1.5">
              {unitsSummary.propertyRows.map(prop => {
                const isFullyOccupied = prop.occupancyRate === 100;
                const isPartiallyOccupied = prop.occupancyRate > 0 && prop.occupancyRate < 100;

                return (
                  <button
                    key={prop.id}
                    type="button"
                    onClick={() => onNavigateTab(1)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.04] space-y-2 transition-all group focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={prop.image}
                          alt={prop.title}
                          className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-white/10"
                          onError={(e) => { e.target.src = '/skyline_apartment.png'; }}
                        />
                        <div className="min-w-0">
                          <h5
                            className="font-semibold text-xs text-slate-900 dark:text-white truncate group-hover:text-emerald-800 dark:group-hover:text-[#E5C583] transition-colors"
                            title={prop.title}
                          >
                            {prop.title}
                          </h5>
                          <p
                            className="text-[11px] text-slate-500 dark:text-cream-100/60 truncate"
                            title={`${prop.location} · ${prop.price}`}
                          >
                            {prop.location} · {prop.price}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white tabular-nums block">
                          {prop.occupiedUnits} / {prop.totalUnits} Units
                        </span>
                        <span className={`text-[10px] font-semibold tabular-nums ${isFullyOccupied
                          ? "text-emerald-700 dark:text-emerald-400"
                          : isPartiallyOccupied
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-amber-600 dark:text-amber-400"
                          }`}>
                          {prop.occupancyRate}% Occupied
                        </span>
                      </div>
                    </div>

                    {/* Thin Progress Bar */}
                    <div className="w-full bg-slate-200/70 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 motion-reduce:transition-none ${isFullyOccupied
                          ? "bg-emerald-600 dark:bg-[#E5C583]"
                          : isPartiallyOccupied
                            ? "bg-indigo-600 dark:bg-indigo-400"
                            : "bg-slate-300 dark:bg-white/20"
                          }`}
                        style={{ width: `${Math.min(100, Math.max(0, prop.occupancyRate))}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Symmetrical Footer (fixed height, shrink-0) */}
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-cream-100/60 shrink-0">
            <span>Portfolio Average: <strong className="text-slate-800 dark:text-white font-semibold tabular-nums">{unitsSummary.overallOccupancyRate}%</strong></span>
            <button
              type="button"
              onClick={onAddProperty}
              className="text-xs font-semibold text-emerald-800 dark:text-[#E5C583] hover:underline flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Unit / Listing</span>
            </button>
          </div>
        </div>

      </div>

      {/* 6. ROW 3: VACANT CAPACITY + TENANT PIPELINE (COMPACT EQUAL 50/50 CARDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: Vacant Capacity */}
        <div className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full w-full">
          <div className="flex items-start justify-between gap-4 mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30 flex items-center justify-center shrink-0">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-[12px] font-medium text-slate-500 dark:text-cream-100/60 block">
                  Vacant Capacity
                </span>
                <h4 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {unitsSummary.vacantUnits} {unitsSummary.vacantUnits === 1 ? 'Unit' : 'Units'} Vacant
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab(1)}
              className="text-xs font-semibold text-emerald-800 dark:text-[#E5C583] hover:underline flex items-center gap-1 cursor-pointer transition-colors shrink-0 pt-1 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
            >
              <span>Manage Properties</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-cream-100/60">
            <span>{unitsSummary.vacantPropsCount} unleased {unitsSummary.vacantPropsCount === 1 ? 'property' : 'properties'} ready for occupancy</span>
            <span className="font-semibold text-slate-700 dark:text-white tabular-nums">
              {unitsSummary.totalUnits > 0 ? `${100 - unitsSummary.overallOccupancyRate}% Vacancy Rate` : '0%'}
            </span>
          </div>
        </div>

        {/* Card 2: Tenant Pipeline */}
        <div className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full w-full">
          <div className="flex items-start justify-between gap-4 mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-[#E5C583] border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-center shrink-0">
                <ClipboardList className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-[12px] font-medium text-slate-500 dark:text-cream-100/60 block">
                  Tenant Pipeline
                </span>
                <h4 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {pendingAppsCount} Pending {pendingAppsCount === 1 ? 'Application' : 'Applications'}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab(0, "Applications")}
              className="text-xs font-semibold text-emerald-800 dark:text-[#E5C583] hover:underline flex items-center gap-1 cursor-pointer transition-colors shrink-0 pt-1 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
            >
              <span>Review Pipeline</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-cream-100/60">
            <span>
              {pendingAppsCount > 0
                ? `${pendingAppsCount} applicant ${pendingAppsCount === 1 ? 'screening' : 'screenings'} awaiting landlord decision`
                : "No pending tenant verification reviews"}
            </span>
            {pendingAppsCount > 0 ? (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40">
                Action Required
              </span>
            ) : (
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                All Clear
              </span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
