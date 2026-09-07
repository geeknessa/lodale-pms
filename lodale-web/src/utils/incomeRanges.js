/**
 * Standardized Income Ranges and Qualification Utilities for Lodale.
 * All income ranges represent ANNUAL income (/yr).
 */

export const INCOME_RANGES = [
  "Less than ₦500,000 / yr",
  "₦500,000 ₦1,000,000 / yr",
  "₦1,000,000 - ₦2,500,000 / yr",
  "₦2,500,000 - ₦5,000,000 / yr",
  "₦5,000,000 - ₦10,000,000 / yr",
  "Above ₦10,000,000 / yr"
];

export const PRESET_HOUSE_RULES = [
  "No Pets",
  "No Smoking",
  "No Students",
  "Working Professionals Only",
  "Quiet Hours (After 10 PM)",
  "No firearms",
  "No overnight guests",
  "Min of 5 guests",
  "No parties allowed"
];

/**
 * Returns a numerical tier (1 to 5) for income level comparisons.
 * Returns 0 if invalid or unspecified.
 */
export function getIncomeTierLevel(rangeStr) {
  if (!rangeStr || typeof rangeStr !== 'string') return 0;
  const str = rangeStr.trim();
  const lower = str.toLowerCase();

  if (
    lower.includes("no min") ||
    lower.includes("none") ||
    lower.includes("any") ||
    lower === "0" ||
    lower === "null" ||
    lower === "unspecified"
  ) {
    return 0;
  }

  if (str.includes("Less than ₦1,000,000") || str.includes("Less than ₦500,000") || lower.includes("less than") || str.includes("100k") || str.includes("100,000")) return 1;
  if (str.includes("₦1,000,000 - ₦2,500,000") || str.includes("₦500,000") || str.includes("2.5m") || str.includes("2,500,000")) return 2;
  if (str.includes("₦2,500,000 - ₦5,000,000") || str.includes("5m") || str.includes("5,000,000")) return 3;
  if (str.includes("₦5,000,000 - ₦10,000,000") || str.includes("10m") || str.includes("10,000,000")) return 4;
  if (str.includes("Above ₦10,000,000") || str.includes("Above")) return 5;

  // Fallback numerical parser if custom string or old numeric value passed
  const clean = str.replace(/[^0-9.]/g, '');
  const val = parseFloat(clean) || 0;
  if (val > 0 && val < 1000000) return 1;
  if (val >= 1000000 && val < 2500000) return 2;
  if (val >= 2500000 && val < 5000000) return 3;
  if (val >= 5000000 && val < 10000000) return 4;
  if (val >= 10000000) return 5;

  return 0;
}

/**
 * Evaluates whether tenant's annual income range meets or exceeds the required income range.
 */
export function doesIncomeMeetRequirement(tenantIncomeRange, requiredIncomeRange) {
  if (!requiredIncomeRange || typeof requiredIncomeRange !== 'string') {
    return true;
  }
  const reqStr = requiredIncomeRange.trim().toLowerCase();
  if (
    !reqStr ||
    reqStr === "no minimum income" ||
    reqStr === "no minimum" ||
    reqStr.includes("no min") ||
    reqStr === "none" ||
    reqStr === "any" ||
    reqStr === "0" ||
    reqStr === "null" ||
    reqStr === "undefined" ||
    reqStr === "unspecified"
  ) {
    return true;
  }

  const requiredLevel = getIncomeTierLevel(requiredIncomeRange);
  if (requiredLevel === 0) {
    // No minimum required tier specified or unparsed -> meets requirement by default
    return true;
  }

  const tenantLevel = getIncomeTierLevel(tenantIncomeRange);
  if (tenantLevel === 0) {
    // Landlord has a specific required tier (level > 0), but tenant has no valid income level set
    return false;
  }

  return tenantLevel >= requiredLevel;
}
