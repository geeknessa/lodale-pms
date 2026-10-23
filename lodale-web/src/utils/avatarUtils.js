/**
 * Utility functions for resolving and handling avatar image URLs across the application.
 */

/**
 * Resolves an avatar URL to an accessible image URL.
 * - Handles empty/missing URLs gracefully by returning an empty string.
 * - Preserves Cloudinary and external HTTP(S) URLs intact.
 * - Preserves inline base64 data URIs intact for local preview.
 * - Resolves relative local '/uploads/...' paths against the backend server base URL.
 * - Preserves frontend static assets (e.g. '/src/...', '/logo_black.svg').
 * 
 * @param {string|null|undefined} url - The avatar URL or path to resolve.
 * @returns {string} The fully qualified or safe URL.
 */
export const resolveAvatarUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '';
  }

  const trimmed = url.trim();

  // Keep full HTTP/HTTPS URLs (Cloudinary, Unsplash, external avatars)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Keep base64 data URIs (instant local previews)
  if (trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Keep frontend Vite assets
  if (trimmed.startsWith('/src/') || trimmed.startsWith('src/')) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  // Normalize uploads path or raw filename (e.g. "avatar-xxx.jpg" or "/uploads/avatar-xxx.jpg")
  let cleanPath = trimmed;
  if (trimmed.startsWith('avatar-') || trimmed.startsWith('file-')) {
    cleanPath = `/uploads/${trimmed}`;
  } else if (trimmed.startsWith('uploads/')) {
    cleanPath = `/${trimmed}`;
  }

  if (cleanPath.startsWith('/uploads/')) {
    const apiBase = import.meta.env?.VITE_API_BASE_URL;
    // If VITE_API_BASE_URL is explicitly configured with a remote origin (e.g. https://api.example.com)
    if (apiBase && (apiBase.startsWith('http://') || apiBase.startsWith('https://'))) {
      try {
        const parsed = new URL(apiBase);
        const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '0.0.0.0';
        if (!isLocalHost) {
          const serverBase = apiBase.replace(/\/api\/?$/, '');
          return `${serverBase}${cleanPath}`;
        }
      } catch (e) { }
    }

    // In local development or same-origin deployment, use the relative path so
    // it automatically routes through Vite dev proxy (or reverse proxy) without CORS/port issues.
    return cleanPath;
  }

  // Frontend public folder assets (e.g., /logo_black.svg, /default-avatar.png)
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return trimmed;
};

export default resolveAvatarUrl;
