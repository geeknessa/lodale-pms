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
 * Formats a date into relative time from now (e.g. 'Just now', '1 day ago', '4 days ago', '2 weeks ago').
 * 
 * @param {string|Date|number} dateInput - The timestamp to format
 * @returns {string} Relative time string
 */
export const formatDistanceToNow = (dateInput) => {
  if (!dateInput) return "Recently listed";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Recently listed";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return "Just now";

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  return `${years} year${years === 1 ? "" : "s"} ago`;
};

