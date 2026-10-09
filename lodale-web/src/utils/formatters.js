/**
 * Shared formatting utilities for Lodale PMS
 */

/**
 * Formats a numeric value or string as a Nigerian Naira currency string.
 * Example: 2500000 -> '₦2,500,000'
 * 
 * @param {string|number} priceVal - The amount to format
 * @param {string} suffix - Optional suffix like '/mo' or '/yr'
 * @returns {string} Formatted currency string
 */
export const getRentPeriodSuffix = (period) => {
  if (!period) return "/yr";
  const p = String(period).toLowerCase().trim();
  if (p === "3_months" || p === "3 months" || p === "3months" || p === "3-months") return "/3 mos";
  if (p === "6_months" || p === "6 months" || p === "bi-annually" || p === "biannually") return "/6 mos";
  if (p === "monthly" || p === "month" || p === "per month") return "/mo";
  if (p === "weekly" || p === "week" || p === "per week") return "/wk";
  if (p === "daily" || p === "day" || p === "nightly" || p === "night") return "/night";
  if (p === "quarterly" || p === "quarter") return "/quarter";
  if (p === "annually" || p === "yearly" || p === "year" || p === "per year" || p === "per annum") return "/yr";
  if (p.includes("month") && !p.includes("3_") && !p.includes("6_")) return "/mo";
  return p.startsWith("/") ? p : `/${p}`;
};

export const formatCurrency = (priceVal, suffix = "") => {
  if (priceVal === null || priceVal === undefined || priceVal === "") return `₦0${suffix}`;
  
  let str = String(priceVal).trim();
  // Remove existing Naira signs and suffixes if present to avoid duplication
  str = str.replace(/^[₦N\s]+/, "").replace(/\/(mo|yr|3 mos|6 mos|wk|night|day|quarter)[a-z0-9_\s]*$/i, "").trim();
  
  const numeric = parseFloat(str.replace(/,/g, ""));
  if (!isNaN(numeric)) {
    return `₦${numeric.toLocaleString()}${suffix}`;
  }
  return `₦${str}${suffix}`;
};

/**
 * Formats a date string or Date object to a standard Nigerian locale format.
 * Example: '01/01/2026' -> '1 January 2026'
 * 
 * @param {string|Date} dateVal - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateVal, options = { day: "numeric", month: "long", year: "numeric" }) => {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-NG", options);
  } catch {
    return String(dateVal);
  }
};

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Formats a date-only string (YYYY-MM-DD) without timezone conversion.
 * Never converts timezones or shifts days backwards.
 * If date is missing/empty, returns "—".
 * 
 * @param {string} dateVal - Date string in YYYY-MM-DD format
 * @param {'short'|'full'} style - Month style ('short': '1 Oct 2026', 'full': '1 October 2026')
 * @returns {string} Formatted date string or '—'
 */
export const formatDateOnly = (dateVal, style = "short") => {
  if (!dateVal) return "—";
  const str = String(dateVal).trim();
  const m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) {
    if (str.includes("T") || str.includes("Z")) {
      return formatTimestamp(str, { style });
    }
    return "—";
  }
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return "—";
  const monthName = style === "full" ? MONTHS_FULL[month - 1] : MONTHS_SHORT[month - 1];
  return `${day} ${monthName} ${year}`;
};

/**
 * Formats a timestamp (ISO string or epoch number) in the Africa/Lagos timezone.
 * If date is missing/empty, returns "—".
 * 
 * @param {string|number|Date} timestampVal - Timestamp to format
 * @param {object} options - Optional { style: 'short'|'full', includeTime: boolean }
 * @returns {string} Formatted timestamp string or '—'
 */
export const formatTimestamp = (timestampVal, options = {}) => {
  if (!timestampVal) return "—";
  try {
    const d = typeof timestampVal === "number" ? new Date(timestampVal) : new Date(String(timestampVal));
    if (isNaN(d.getTime())) return "—";
    const style = options.style || "short";
    const includeTime = Boolean(options.includeTime);
    const day = d.toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", day: "numeric" });
    const month = d.toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", month: style === "full" ? "long" : "short" });
    const year = d.toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", year: "numeric" });
    let res = `${day} ${month} ${year}`;
    if (includeTime) {
      const time = d.toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit" });
      res += `, ${time}`;
    }
    return res;
  } catch {
    return "—";
  }
};

/**
 * Universal date display helper.
 * Date-only strings (YYYY-MM-DD) are formatted with NO timezone conversion.
 * Timestamps with time/UTC markers are formatted in Africa/Lagos.
 * Missing or null dates return "—".
 */
export const formatDisplayDate = (val, options = {}) => {
  if (!val) return "—";
  const s = String(val).trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    return formatDateOnly(s, options.style || "short");
  }
  return formatTimestamp(val, options);
};

/**
 * Returns number of months corresponding to a rent period string.
 */
export const getMonthsInRentPeriod = (period) => {
  if (!period) return 12;
  const p = String(period).toLowerCase().trim();
  if (p === "monthly" || p === "month" || p === "per month" || p === "/mo") return 1;
  if (p === "3_months" || p === "3 months" || p === "3months" || p === "3-months" || p === "quarterly" || p === "quarter" || p === "/3 mos") return 3;
  if (p === "6_months" || p === "6 months" || p === "bi-annually" || p === "biannually" || p === "/6 mos") return 6;
  if (p === "annually" || p === "yearly" || p === "year" || p === "per year" || p === "per annum" || p === "/yr") return 12;
  if (p.includes("month") && !p.includes("3_") && !p.includes("6_")) return 1;
  return null;
};

/**
 * Month-end safe addition of rent periods to a date-only string (YYYY-MM-DD).
 * E.g., 31 Jan + 1 month -> 28 Feb (or 29 Feb in leap year).
 * E.g., 31 Mar + 1 month -> 30 Apr.
 * 
 * @param {string} startDateStr - YYYY-MM-DD
 * @param {string} period - Rent period string ('monthly', '3_months', '6_months', 'annually', etc.)
 * @param {number} count - Multiplier of rent periods
 * @returns {string|null} YYYY-MM-DD
 */
export const addRentPeriodMonthEndSafe = (startDateStr, period, count = 1) => {
  if (!startDateStr) return null;
  const s = String(startDateStr).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return null;
  const startYear = parseInt(m[1], 10);
  const startMonth = parseInt(m[2], 10);
  const startDay = parseInt(m[3], 10);

  const monthsPerPeriod = getMonthsInRentPeriod(period);
  if (monthsPerPeriod === null) return null;

  const totalMonths = monthsPerPeriod * count;
  const targetYear = startYear + Math.floor((startMonth - 1 + totalMonths) / 12);
  const targetMonth = ((startMonth - 1 + totalMonths) % 12) + 1;
  // Month-end safe: get maximum days in target month
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const targetDay = Math.min(startDay, daysInTargetMonth);

  const mm = String(targetMonth).padStart(2, "0");
  const dd = String(targetDay).padStart(2, "0");
  return `${targetYear}-${mm}-${dd}`;
};

/**
 * Standard rent period human-readable label mapping.
 * e.g. "/month", "per 3 months", "/year"
 */
export const getRentPeriodLabel = (period) => {
  if (!period) return "/year";
  const p = String(period).toLowerCase().trim();
  if (p === "monthly" || p === "month" || p === "per month") return "/month";
  if (p === "3_months" || p === "3 months" || p === "3months" || p === "3-months") return "per 3 months";
  if (p === "6_months" || p === "6 months" || p === "bi-annually" || p === "biannually") return "per 6 months";
  if (p === "weekly" || p === "week" || p === "per week") return "/week";
  if (p === "annually" || p === "yearly" || p === "year" || p === "per year" || p === "per annum") return "/year";
  return `/${p}`;
};


