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
export const formatCurrency = (priceVal, suffix = "") => {
  if (priceVal === null || priceVal === undefined || priceVal === "") return `₦0${suffix}`;
  
  let str = String(priceVal).trim();
  // Remove existing Naira signs and suffixes if present to avoid duplication
  str = str.replace(/^[₦N\s]+/, "").replace(/\/mo.*$/i, "").replace(/\/yr.*$/i, "").trim();
  
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
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-NG", options);
  } catch {
    return String(dateVal);
  }
};

/**
 * Formats a date string or Date object to a short US format.
 * Example: '01/01/2026' -> 'Jan 1, 2026'
 * 
 * @param {string|Date} dateVal - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateShort = (dateVal) => {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(dateVal);
  }
};
