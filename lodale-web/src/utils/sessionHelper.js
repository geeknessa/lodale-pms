/**
 * Session Helper Utility
 * Manages per-tab isolated authentication using sessionStorage first,
 * with localStorage fallback. Prevents cross-role profile pollution
 * by maintaining isolated role keys (currentUserProfile_tenant, currentUserProfile_landlord, currentUserProfile_admin).
 */

export function setSessionAuth({ role, email, name, profile, dbUserId, adminAuth }) {
  const authStr = "true";
  const expireTime = (Date.now() + 24 * 60 * 60 * 1000).toString();
  const normalizedRole = (role || "tenant").toLowerCase().trim();
  const profileKey = `currentUserProfile_${normalizedRole}`;

  // 1. Save to tab-specific sessionStorage
  sessionStorage.setItem("isAuthenticated", authStr);
  sessionStorage.setItem("sessionExpiresAt", expireTime);
  if (role) sessionStorage.setItem("userRole", role);
  if (email) sessionStorage.setItem("lastLoggedInEmail", email);
  if (name) sessionStorage.setItem(`username_${normalizedRole}`, name);
  if (profile) sessionStorage.setItem(profileKey, typeof profile === 'string' ? profile : JSON.stringify(profile));
  if (dbUserId) sessionStorage.setItem("db_user_id", dbUserId);
  if (adminAuth) sessionStorage.setItem("adminAuthenticated", "true");

  // 2. Save to persistent localStorage
  localStorage.setItem("isAuthenticated", authStr);
  localStorage.setItem("sessionExpiresAt", expireTime);
  if (role) localStorage.setItem("userRole", role);
  if (email) localStorage.setItem("lastLoggedInEmail", email);
  if (name) localStorage.setItem(`username_${normalizedRole}`, name);
  if (profile) localStorage.setItem(profileKey, typeof profile === 'string' ? profile : JSON.stringify(profile));
  if (dbUserId) localStorage.setItem("db_user_id", dbUserId);
  if (adminAuth) localStorage.setItem("adminAuthenticated", "true");
}

export function getRoleProfile(role) {
  const normalizedRole = (role || getSessionRole()).toLowerCase().trim();
  const profileKey = `currentUserProfile_${normalizedRole}`;
  const raw = sessionStorage.getItem(profileKey) || localStorage.getItem(profileKey);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function saveRoleProfile(role, profileData) {
  const normalizedRole = (role || getSessionRole()).toLowerCase().trim();
  const profileKey = `currentUserProfile_${normalizedRole}`;
  const strData = typeof profileData === 'string' ? profileData : JSON.stringify(profileData);
  sessionStorage.setItem(profileKey, strData);
  localStorage.setItem(profileKey, strData);
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

export function getSessionUsername(role) {
  const normalizedRole = (role || getSessionRole()).toLowerCase().trim();
  return sessionStorage.getItem(`username_${normalizedRole}`) ||
         localStorage.getItem(`username_${normalizedRole}`) ||
         sessionStorage.getItem("username") ||
         localStorage.getItem("username") || "User";
}

export function clearTabSession() {
  const roles = ["tenant", "landlord", "admin"];
  roles.forEach(r => {
    sessionStorage.removeItem(`currentUserProfile_${r}`);
    sessionStorage.removeItem(`username_${r}`);
    localStorage.removeItem(`currentUserProfile_${r}`);
    localStorage.removeItem(`username_${r}`);
  });

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
