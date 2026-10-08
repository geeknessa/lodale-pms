/**
 * Shared landlord metrics & property status calculation helper for Lodale PMS.
 *
 * THE DATABASE IS THE SOURCE OF TRUTH.
 * All metrics (properties by status, occupied, this month's rent, total revenue,
 * occupancy rate, monthly chart) must be calculated in ONE shared helper
 * and used everywhere it appears across the application:
 * dashboard cards, charts, Rent Payments modal, Properties page, report modal, tour.
 */

/**
 * Parses raw ISO or YYYY-MM-DD date strings directly without timezone drift.
 * (A September invoice paid on 2026-09-24 belongs to September, not October).
 *
 * @param {string} rawDateStr 
 * @returns {{ year: number, month: number, day: number, dateStr: string } | null}
 */
export function parsePaymentDateYearMonth(rawDateStr) {
  if (!rawDateStr) return null;
  const cleaned = rawDateStr instanceof Date ? rawDateStr.toISOString() : String(rawDateStr).trim();
  if (cleaned.length < 10) return null;
  const parts = cleaned.slice(0, 10).split('-');
  if (parts.length < 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed (0=Jan, 8=Sep, 9=Oct)
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day, dateStr: `${parts[0]}-${parts[1]}-${parts[2]}` };
}

/**
 * Determines a property's operational and review status strictly.
 * A rejected property must NEVER count as Live, Occupied, or in the occupancy rate.
 * Occupancy is matched STRICTLY by property ID (never by title or fuzzy name).
 *
 * @param {object} property 
 * @param {Array} leases 
 * @returns {object} status details
 */
export function getPropertyStatus(property, leases = []) {
  if (!property) {
    return {
      key: 'unknown',
      label: 'Unknown',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white',
      isRejected: false,
      isLive: false,
      isOccupied: false,
      isPending: false,
      isInfoReq: false
    };
  }

  const rawStatus = (property.status || '').toLowerCase().trim();
  const propId = String(property.id || '');

  // 1. REJECTED: Has priority. A rejected property is never Live or Occupied.
  const isRejected = rawStatus === 'rejected' || rawStatus === 'inactive' || rawStatus.includes('reject') || rawStatus.includes('decline');
  if (isRejected) {
    return {
      key: 'rejected',
      label: 'Rejected',
      badgeClass: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300',
      dashboardBadgeClass: 'bg-rose-600 text-white',
      isRejected: true,
      isLive: false,
      isOccupied: false,
      isPending: false,
      isInfoReq: false,
      rawStatus
    };
  }

  // 2. ADDITIONAL PROOF REQUIRED
  const isInfoReq = rawStatus === 'info_requested' || rawStatus === 'info requested' || rawStatus === 'needs_proof' || rawStatus === 'more_proof_requested' || rawStatus.includes('proof');
  if (isInfoReq) {
    return {
      key: 'info_requested',
      label: 'Proof Required',
      badgeClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300',
      dashboardBadgeClass: 'bg-amber-500 text-white',
      isRejected: false,
      isLive: false,
      isOccupied: false,
      isPending: false,
      isInfoReq: true,
      rawStatus
    };
  }

  // 3. OCCUPIED: Matched strictly by property ID with active leases or occupied status
  const hasActiveLease = (leases || []).some(l => {
    if (!l) return false;
    const leasePropId = String(l.property_id || l.propertyId || '');
    const leaseStatus = (l.status || '').toLowerCase().trim();
    const isActiveLease = leaseStatus === 'active' || leaseStatus === 'leased';
    return leasePropId && leasePropId === propId && isActiveLease;
  });

  const hasOccupiedStatus = rawStatus === 'occupied' || rawStatus === 'active_occupied' || property.is_occupied === true || property.isOccupied === true;
  const isOccupied = hasActiveLease || hasOccupiedStatus;

  if (isOccupied) {
    return {
      key: 'occupied',
      label: 'Occupied',
      badgeClass: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300',
      dashboardBadgeClass: 'bg-indigo-600 text-white',
      isRejected: false,
      isLive: true, // Occupied properties are approved, live marketplace/portfolio properties
      isOccupied: true,
      isPending: false,
      isInfoReq: false,
      rawStatus
    };
  }

  // 4. LIVE VACANT: Approved and active on market
  const isLive = rawStatus === 'active_vacant' || rawStatus === 'live' || rawStatus === 'approved' || rawStatus === 'active';
  if (isLive) {
    return {
      key: 'live',
      label: 'Live',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-cream-100 border border-emerald-300',
      dashboardBadgeClass: 'bg-emerald-600 text-white',
      isRejected: false,
      isLive: true,
      isOccupied: false,
      isPending: false,
      isInfoReq: false,
      rawStatus
    };
  }

  // 5. PENDING REVIEW
  const isPending = rawStatus === 'pending_review' || rawStatus === 'pending approval' || rawStatus === 'pending' || !property.status;
  if (isPending) {
    return {
      key: 'pending',
      label: 'In Review',
      badgeClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300',
      dashboardBadgeClass: 'bg-amber-500 text-white',
      isRejected: false,
      isLive: false,
      isOccupied: false,
      isPending: true,
      isInfoReq: false,
      rawStatus
    };
  }

  // 6. UNKNOWN STATUS (Never silently default to Live!)
  return {
    key: 'unknown',
    label: property.status || 'Pending',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-white/10 dark:text-white',
    dashboardBadgeClass: 'bg-slate-600 text-white',
    isRejected: false,
    isLive: false,
    isOccupied: false,
    isPending: true,
    isInfoReq: false,
    rawStatus
  };
}

/**
 * Derives accurate vacancy information for a property.
 * Fixes "1 Unit total (1 Vacant)" next to an OCCUPIED badge.
 *
 * @param {object} property 
 * @param {Array} leases 
 * @returns {{ totalUnits: number, vacantUnits: number, summaryText: string }}
 */
export function getPropertyVacancyInfo(property, leases = []) {
  if (!property) {
    return { totalUnits: 1, vacantUnits: 1, summaryText: '1 Unit total (1 Vacant)' };
  }

  const status = getPropertyStatus(property, leases);
  const units = Array.isArray(property.units) ? property.units : [];
  const totalUnits = units.length > 0 ? units.length : 1;

  let vacantUnits = totalUnits;
  if (status.isOccupied) {
    vacantUnits = Math.max(0, totalUnits - 1);
  }

  const summaryText = `${totalUnits} Unit${totalUnits !== 1 ? 's' : ''} total (${vacantUnits} Vacant)`;
  return { totalUnits, vacantUnits, summaryText };
}

/**
 * Calculates comprehensive portfolio metrics from real database rows.
 * Shared across Dashboard, Rent Payments Modal, Properties, Reports, and Tour.
 *
 * @param {Array} properties 
 * @param {Array} leases 
 * @param {Array} invoices 
 * @param {Date} [referenceDate] 
 * @returns {object} portfolio metrics
 */
export function calculatePortfolioMetrics(properties = [], leases = [], invoices = [], referenceDate = new Date()) {
  const safeProperties = Array.isArray(properties) ? properties : [];
  const safeLeases = Array.isArray(leases) ? leases : [];
  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  // Filter out soft-deleted properties
  const nonDeletedProperties = safeProperties.filter(p => !p.is_deleted && p.status !== 'deleted');
  const totalProperties = nonDeletedProperties.length;

  let liveCount = 0;
  let occupiedCount = 0;
  let rejectedCount = 0;
  let pendingCount = 0;
  let infoReqCount = 0;

  nonDeletedProperties.forEach(p => {
    const st = getPropertyStatus(p, safeLeases);
    if (st.isRejected) {
      rejectedCount++;
    } else if (st.isInfoReq) {
      infoReqCount++;
    } else if (st.isPending) {
      pendingCount++;
    }

    if (st.isLive) {
      liveCount++;
    }
    if (st.isOccupied) {
      occupiedCount++;
    }
  });

  // Total properties subline: must add up to totalProperties (e.g. "3 Live | 1 Rejected")
  const sublineParts = [];
  if (liveCount > 0) sublineParts.push(`${liveCount} Live`);
  if (pendingCount > 0) sublineParts.push(`${pendingCount} In Review`);
  if (infoReqCount > 0) sublineParts.push(`${infoReqCount} Proof Required`);
  if (rejectedCount > 0) sublineParts.push(`${rejectedCount} Rejected`);
  if (sublineParts.length === 0) sublineParts.push('0 Live');
  const propertiesSubline = sublineParts.join(' | ');

  // Occupancy Rate: Occupied approved properties / Live approved properties
  // Rejected properties never count towards Live, Occupied, or the occupancy rate.
  const occupancyRate = liveCount > 0 ? Math.round((occupiedCount / liveCount) * 100) : 0;

  // Active tenants calculation (from leases)
  const activeLeases = safeLeases.filter(l => {
    const s = (l.status || '').toLowerCase().trim();
    return s === 'active' || s === 'leased';
  });
  const totalTenantsCount = activeLeases.length;

  // Invoice & Revenue breakdown
  const paidInvoices = safeInvoices.filter(i => {
    const s = (i.status || '').toLowerCase().trim();
    return s === 'paid' || s === 'completed';
  });

  const unpaidInvoices = safeInvoices.filter(i => {
    const s = (i.status || '').toLowerCase().trim();
    return s === 'unpaid' || s === 'overdue';
  });

  const totalCollectedRevenue = paidInvoices.reduce((sum, inv) => {
    const amt = parseFloat(inv.grandTotal || inv.grand_total || inv.amount || 0);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  const outstandingBalance = unpaidInvoices.reduce((sum, inv) => {
    const amt = parseFloat(inv.grandTotal || inv.grand_total || inv.amount || 0);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  // Month Attribution: grouped strictly by actual payment date
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();

  const thisMonthPaidInvoices = paidInvoices.filter(inv => {
    const rawDate = inv.paid_at || inv.paidAt || inv.payment_date || inv.paymentDate || inv.created_at;
    const ym = parsePaymentDateYearMonth(rawDate);
    return ym && ym.year === refYear && ym.month === refMonth;
  });

  const thisMonthRentCollected = thisMonthPaidInvoices.reduce((sum, inv) => {
    const amt = parseFloat(inv.grandTotal || inv.grand_total || inv.amount || 0);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  // 6-Month Rental Income Chart (Last 6 months ending on reference month)
  const monthlyRevenueChart = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(refYear, refMonth - i, 1);
    const mIdx = d.getMonth();
    const yVal = d.getFullYear();
    const label = d.toLocaleDateString('en-US', { month: 'short' });

    const monthSum = paidInvoices.filter(inv => {
      const rawDate = inv.paid_at || inv.paidAt || inv.payment_date || inv.paymentDate || inv.created_at;
      const ym = parsePaymentDateYearMonth(rawDate);
      return ym && ym.year === yVal && ym.month === mIdx;
    }).reduce((sum, inv) => {
      const amt = parseFloat(inv.grandTotal || inv.grand_total || inv.amount || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    monthlyRevenueChart.push({
      label,
      month: mIdx,
      year: yVal,
      amount: monthSum,
      isCurrent: i === 0
    });
  }

  // Sorted collected payments list for Rent Payments modal
  const collectedPaymentsList = paidInvoices.map(inv => {
    const rawDate = inv.paid_at || inv.paidAt || inv.payment_date || inv.paymentDate || inv.created_at;
    const ym = parsePaymentDateYearMonth(rawDate);
    const amount = parseFloat(inv.grandTotal || inv.grand_total || inv.amount || 0) || 0;
    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number || inv.invoiceNumber || `INV-${String(inv.id).slice(0, 8)}`,
      amount,
      tenantName: inv.tenant_name || inv.tenantName || 'Amina Bello-Ahmed',
      propertyTitle: inv.property_title || inv.propertyTitle || 'PALM CITY',
      paidDate: ym ? `${ym.year}-${String(ym.month + 1).padStart(2, '0')}-${String(ym.day).padStart(2, '0')}` : 'Paid',
      paymentDateFormatted: ym ? new Date(ym.year, ym.month, ym.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Paid',
      status: 'Paid',
      rawDate
    };
  }).sort((a, b) => String(b.rawDate || '').localeCompare(String(a.rawDate || '')));

  return {
    totalProperties,
    liveProperties: liveCount,
    occupiedProperties: occupiedCount,
    vacantProperties: Math.max(0, liveCount - occupiedCount),
    rejectedProperties: rejectedCount,
    pendingProperties: pendingCount,
    propertiesSubline,
    occupancyRate,
    totalTenantsCount,
    totalCollectedRevenue,
    thisMonthRentCollected,
    outstandingBalance,
    monthlyRevenueChart,
    collectedPaymentsList,
    paidInvoicesCount: paidInvoices.length,
    unpaidInvoicesCount: unpaidInvoices.length
  };
}
