/**
 * Safe wrapper around localStorage/sessionStorage setItem to catch QuotaExceededError
 * and handle fallback cleanup or notifications without crashing the application.
 */

export function isQuotaExceededError(err) {
  return (
    err instanceof DOMException &&
    (err.name === "QuotaExceededError" ||
      err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      err.code === 22 ||
      err.code === 1014)
  );
}

/**
 * Safely sets an item in localStorage, catching quota exceeded errors gracefully.
 * @param {string} key 
 * @param {string} value 
 * @returns {boolean} true if successful, false if failed
 */
export function safeSetLocalStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (isQuotaExceededError(err)) {
      console.warn(`[StorageQuota] QuotaExceededError saving key "${key}". Attempting fallback handling.`, err);
      // Optional fallback: attempt clearing old non-critical caches or just catch error
      return false;
    }
    console.error(`[Storage] Failed to set "${key}" in localStorage:`, err);
    return false;
  }
}

/**
 * Safely sets an item in sessionStorage, catching quota exceeded errors gracefully.
 * @param {string} key 
 * @param {string} value 
 * @returns {boolean} true if successful, false if failed
 */
export function safeSetSessionStorage(key, value) {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (isQuotaExceededError(err)) {
      console.warn(`[StorageQuota] QuotaExceededError saving key "${key}" to sessionStorage.`, err);
      return false;
    }
    console.error(`[Storage] Failed to set "${key}" in sessionStorage:`, err);
    return false;
  }
}

/**
 * Compresses an image file (or base64 string) via HTML5 Canvas to fit safely inside storage limits.
 * @param {File|Blob|string} imageSource File object or base64 data URL
 * @param {number} maxWidth Max width in pixels (default 400)
 * @param {number} maxHeight Max height in pixels (default 400)
 * @param {number} quality JPEG quality (0.0 to 1.0, default 0.8)
 * @returns {Promise<string>} Compressed base64 data URL
 */
export function compressImageForStorage(imageSource, maxWidth = 400, maxHeight = 400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    const processImage = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Unable to create canvas 2D context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedDataUrl);
    };

    img.onload = processImage;
    img.onerror = (err) => reject(err);

    if (typeof imageSource === "string") {
      img.src = imageSource;
    } else if (imageSource instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(imageSource);
    } else {
      reject(new Error("Unsupported image source type"));
    }
  });
}
