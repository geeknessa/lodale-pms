/**
 * Session Helper Utility
 * Manages per-tab isolated authentication using sessionStorage first,
 * with localStorage fallback. Allows concurrent logins with different roles
 * across different browser tabs.
 */

export function setSessionAuth({ role, email, name, profile, dbUserId, adminAuth }) {
  const authStr = "true";
  const expireTime = (Date.now() + 24 * 60 * 60 * 1000).toString();

  // 1. Save to tab-specific sessionStorage
  sessionStorage.setItem("isAuthenticated", authStr);
  sessionStorage.setItem("sessionExpiresAt", expireTime);
  if (role) sessionStorage.setItem("userRole", role);
  if (email) sessionStorage.setItem("lastLoggedInEmail", email);
  if (name) sessionStorage.setItem("username", name);
  if (profile) sessionStorage.setItem("currentUserProfile", typeof profile === 'string' ? profile : JSON.stringify(profile));
  if (dbUserId) sessionStorage.setItem("db_user_id", dbUserId);
  if (adminAuth) sessionStorage.setItem("adminAuthenticated", "true");

  // 2. Save to persistent localStorage
  localStorage.setItem("isAuthenticated", authStr);
  localStorage.setItem("sessionExpiresAt", expireTime);
  if (role) localStorage.setItem("userRole", role);
  if (email) localStorage.setItem("lastLoggedInEmail", email);
  if (name) localStorage.setItem("username", name);
  if (profile) localStorage.setItem("currentUserProfile", typeof profile === 'string' ? profile : JSON.stringify(profile));
  if (dbUserId) localStorage.setItem("db_user_id", dbUserId);
  if (adminAuth) localStorage.setItem("adminAuthenticated", "true");
}

export function isSessionAuthenticated() {
  const sessAuth = sessionStorage.getItem("isAuthenticated");
  if (sessAuth !== null) {
    return sessAuth === "true";
  }
  return localStorage.getItem("isAuthenticated") === "true";
}

export function getSessionRole() {
  const sessRole = sessionStorage.getItem("userRole");
  if (sessRole) return sessRole.toLowerCase().trim();
  return (localStorage.getItem("userRole") || "tenant").toLowerCase().trim();
}

export function getSessionEmail() {
  return sessionStorage.getItem("lastLoggedInEmail") || localStorage.getItem("lastLoggedInEmail") || "";
}

export function getSessionUsername() {
  return sessionStorage.getItem("username") || localStorage.getItem("username") || "User";
}

export function clearTabSession() {
  sessionStorage.removeItem("isAuthenticated");
  sessionStorage.removeItem("userRole");
  sessionStorage.removeItem("lastLoggedInEmail");
  sessionStorage.removeItem("username");
  sessionStorage.removeItem("currentUserProfile");
  sessionStorage.removeItem("adminAuthenticated");
  sessionStorage.removeItem("sessionExpiresAt");

  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("userRole");
  localStorage.removeItem("lastLoggedInEmail");
  localStorage.removeItem("sessionExpiresAt");
  localStorage.removeItem("adminAuthenticated");
}
