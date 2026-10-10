/**
 * Quota-safe wrappers around sessionStorage / localStorage.
 *
 * Why this exists: some legacy users have raw base64 data URLs in
 * users.avatar_url (and some property records embed base64 images).
 * Caching those objects verbatim can exceed the ~5 MB Web Storage quota and
 * throw QuotaExceededError, which previously broke login.
 *
 * Rules enforced here:
 *  - Inline images (data: URLs, or oversized strings in image-like fields) are
 *    stripped before anything is cached. Normal file URLs (/uploads/...) stay.
 *  - setItem never throws. On failure the value is kept in an in-memory
 *    fallback for the lifetime of the page so the app keeps working, the
 *    stale persisted copy is removed, and nothing is shown to the user.
 *  - Inline avatars are never cached; components load them from the API
 *    (userService.getProfile) and hold them in React state only.
 */

export const INLINE_IMAGE_MAX_LENGTH = 2000;

// Matches a data URL prefix such as "data:image/png;base64," or "data:application/pdf,".
const DATA_URL_RE = /^data:[a-z]+\/[a-z0-9.+-]+[;,]/i;

// Keys whose string values are expected to be URLs/images. Long strings under
// these keys are almost certainly embedded binary data.
const IMAGE_KEY_RE = /avatar|image|photo|picture|cover|logo|thumbnail|doc_url|docdataurl|dataurl/i;

const MAX_DEPTH = 8;

const memoryFallback = {
  session: new Map(),
  local: new Map(),
};

function resolveStorage(area) {
  // Accessing window.sessionStorage itself can throw (e.g. disabled storage).
  return area === "local" ? window.localStorage : window.sessionStorage;
}

/**
 * True when the value is an inline image that must not be cached:
 * a data: URL, or a string longer than INLINE_IMAGE_MAX_LENGTH.
 */
export function isInlineImage(value) {
  return (
    typeof value === "string" &&
    (DATA_URL_RE.test(value) || value.length > INLINE_IMAGE_MAX_LENGTH)
  );
}

function sanitizeValue(value, key, depth) {
  if (typeof value === "string") {
    if (DATA_URL_RE.test(value)) return undefined;
    if (IMAGE_KEY_RE.test(key) && value.length > INLINE_IMAGE_MAX_LENGTH) return undefined;
    return value;
  }
  if (value === null || typeof value !== "object" || depth > MAX_DEPTH) return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeValue(item, key, depth + 1))
      .filter((item) => item !== undefined);
  }
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    const cleaned = sanitizeValue(v, k, depth + 1);
    if (cleaned !== undefined) out[k] = cleaned;
  }
  return out;
}

/**
 * Returns a deep copy of `value` with inline images removed, suitable for
 * caching. Inline avatar fields are dropped entirely (not set to "") so that
 * `a || b` fallbacks elsewhere keep working and API data wins on merge.
 */
export function stripInlineImages(value) {
  return sanitizeValue(value, "", 0);
}

/**
 * Like stripInlineImages, but for a single URL-ish value: returns "" when the
 * value is an inline image, otherwise the value unchanged.
 */
export function cacheableUrl(value) {
  return isInlineImage(value) ? "" : value || "";
}

/**
 * setItem that never throws. Returns true when persisted, false when the value
 * was kept in memory only.
 * @param {"session"|"local"} area
 */
export function safeSetItem(area, key, value) {
  const str = String(value);
  try {
    resolveStorage(area).setItem(key, str);
    memoryFallback[area].delete(key);
    return true;
  } catch (err) {
    memoryFallback[area].set(key, str);
    // Drop any stale persisted copy so readers don't see outdated data.
    try { resolveStorage(area).removeItem(key); } catch { /* storage unavailable */ }
    if (import.meta.env?.DEV) {
      console.warn(`[safeStorage] ${area}Storage.setItem("${key}") failed; kept in memory.`, err?.name || err);
    }
    return false;
  }
}

/**
 * getItem that never throws and falls back to the in-memory copy written by
 * safeSetItem when persistence failed.
 * @param {"session"|"local"} area
 */
export function safeGetItem(area, key) {
  try {
    const v = resolveStorage(area).getItem(key);
    if (v !== null) return v;
  } catch { /* storage unavailable */ }
  return memoryFallback[area].has(key) ? memoryFallback[area].get(key) : null;
}

/**
 * Removes a key from storage and the in-memory fallback. Never throws.
 * @param {"session"|"local"} area
 */
export function safeRemoveItem(area, key) {
  memoryFallback[area].delete(key);
  try { resolveStorage(area).removeItem(key); } catch { /* storage unavailable */ }
}

/**
 * Serialises `value` with inline images stripped and stores it safely.
 * Use for every user/profile/property cache write.
 * @param {"session"|"local"} area
 */
export function safeSetJSON(area, key, value) {
  let json;
  try {
    json = JSON.stringify(stripInlineImages(value));
  } catch {
    return false;
  }
  return safeSetItem(area, key, json);
}

/**
 * Caches a single avatar URL string. Normal file URLs (/uploads/...) are
 * stored; inline (base64) avatars are never cached and clear the key instead,
 * so callers fall back to the copy loaded from the API into React state.
 * @param {"session"|"local"} area
 */
export function cacheAvatarUrl(area, key, url) {
  if (!url || isInlineImage(url)) {
    safeRemoveItem(area, key);
    return false;
  }
  return safeSetItem(area, key, url);
}
