/**
 * Rating & Review Service for Landlords and Tenants
 */

export const ratingService = {
  /**
   * Submit a review for a Landlord by a Tenant.
   */
  submitLandlordReview({ landlordId, landlordName, tenantId, tenantName, rating, comment, wouldRecommend = true, propertyTitle = "" }) {
    if (!landlordId) return { success: false, message: "Missing landlord identifier." };

    const key = `landlord_reviews_${landlordId}`;
    let existing = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) existing = JSON.parse(raw);
    } catch (e) {
      console.warn("Error reading landlord reviews:", e);
    }

    // Replace previous review by this tenant if already reviewed
    const filtered = existing.filter(r => String(r.tenantId) !== String(tenantId));
    const newReview = {
      id: "rev_" + Date.now(),
      landlordId: String(landlordId),
      landlordName: landlordName || "Landlord",
      tenantId: String(tenantId),
      tenantName: tenantName || "Tenant",
      rating: Number(rating) || 5,
      comment: comment || "",
      wouldRecommend: Boolean(wouldRecommend),
      propertyTitle: propertyTitle || "",
      createdAt: new Date().toISOString()
    };

    const updatedList = [newReview, ...filtered];
    try {
      localStorage.setItem(key, JSON.stringify(updatedList));
      // Also update global landlord review store
      const globalKey = `all_landlord_reviews`;
      const allRaw = localStorage.getItem(globalKey);
      let allList = allRaw ? JSON.parse(allRaw) : [];
      allList = [newReview, ...allList.filter(r => r.id !== newReview.id)];
      localStorage.setItem(globalKey, JSON.stringify(allList));
    } catch (e) {
      console.warn("Error persisting landlord review:", e);
    }

    return { success: true, review: newReview };
  },

  /**
   * Get all reviews and computed average score for a Landlord.
   */
  getLandlordReviews(landlordId) {
    if (!landlordId) return { hasReviews: false, rating: "New", count: 0, reviews: [] };

    const key = `landlord_reviews_${landlordId}`;
    let reviews = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) reviews = JSON.parse(raw);
    } catch (e) {}

    if (!reviews || reviews.length === 0) {
      return { hasReviews: false, rating: "New", count: 0, reviews: [] };
    }

    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const avg = (sum / reviews.length).toFixed(1);

    return {
      hasReviews: true,
      rating: String(avg),
      count: reviews.length,
      reviews
    };
  },

  /**
   * Submit a review for a Tenant by a Landlord.
   */
  submitTenantReview({ tenantId, tenantName, tenantEmail, landlordId, landlordName, rating, comment, wouldRentAgain = true, propertyTitle = "" }) {
    if (!tenantId && !tenantEmail) return { success: false, message: "Missing tenant identifier." };

    const cleanTenantId = String(tenantId || tenantEmail);
    const cleanTenantEmail = (tenantEmail || (cleanTenantId.includes("@") ? cleanTenantId : "")).toLowerCase();

    const key = `tenant_reviews_${cleanTenantId}`;
    let existing = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) existing = JSON.parse(raw);
    } catch (e) {}

    const filtered = existing.filter(r => String(r.landlordId) !== String(landlordId));
    const newReview = {
      id: "ten_rev_" + Date.now(),
      tenantId: cleanTenantId,
      tenantEmail: cleanTenantEmail,
      tenantName: tenantName || "Tenant",
      landlordId: String(landlordId || "landlord"),
      landlordName: landlordName || "Landlord",
      rating: Number(rating) || 5,
      comment: comment || "",
      wouldRentAgain: Boolean(wouldRentAgain),
      propertyTitle: propertyTitle || "",
      createdAt: new Date().toISOString()
    };

    const updatedList = [newReview, ...filtered];
    try {
      localStorage.setItem(key, JSON.stringify(updatedList));

      if (cleanTenantEmail) {
        const emailKey = `tenant_reviews_${cleanTenantEmail}`;
        localStorage.setItem(emailKey, JSON.stringify(updatedList));
      }

      // Also store in global tenant reviews repository
      const globalKey = `all_tenant_reviews`;
      const allRaw = localStorage.getItem(globalKey);
      let allList = allRaw ? JSON.parse(allRaw) : [];
      allList = [newReview, ...allList.filter(r => r.id !== newReview.id && String(r.landlordId) !== String(landlordId))];
      localStorage.setItem(globalKey, JSON.stringify(allList));

      // Update tenant's profile reliability rating
      if (cleanTenantEmail) {
        const profKey = `tenantProfile_${cleanTenantEmail}`;
        const rawProf = localStorage.getItem(profKey);
        if (rawProf) {
          try {
            const parsed = JSON.parse(rawProf);
            const sum = updatedList.reduce((acc, r) => acc + Number(r.rating), 0);
            const avg = (sum / updatedList.length).toFixed(1);
            parsed.reliabilityScore = String(avg);
            localStorage.setItem(profKey, JSON.stringify(parsed));
          } catch (err) {}
        }
      }
    } catch (e) {
      console.warn("Error persisting tenant review:", e);
    }

    return { success: true, review: newReview };
  },

  /**
   * Get all reviews and reliability score for a Tenant.
   */
  getTenantReviews(tenantId, tenantEmail) {
    const idStr = String(tenantId || "").trim();
    const emailStr = String(tenantEmail || (idStr.includes("@") ? idStr : "")).trim().toLowerCase();

    if (!idStr && !emailStr) {
      return { hasReviews: false, rating: "New", count: 0, reviews: [] };
    }

    let rawList = [];

    // 1. Try global storage
    try {
      const globalRaw = localStorage.getItem("all_tenant_reviews");
      if (globalRaw) {
        const globalParsed = JSON.parse(globalRaw);
        if (Array.isArray(globalParsed)) rawList.push(...globalParsed);
      }
    } catch (e) {}

    // 2. Try ID-specific key
    if (idStr) {
      try {
        const idRaw = localStorage.getItem(`tenant_reviews_${idStr}`);
        if (idRaw) {
          const idParsed = JSON.parse(idRaw);
          if (Array.isArray(idParsed)) rawList.push(...idParsed);
        }
      } catch (e) {}
    }

    // 3. Try Email-specific key
    if (emailStr && emailStr !== idStr) {
      try {
        const emailRaw = localStorage.getItem(`tenant_reviews_${emailStr}`);
        if (emailRaw) {
          const emailParsed = JSON.parse(emailRaw);
          if (Array.isArray(emailParsed)) rawList.push(...emailParsed);
        }
      } catch (e) {}
    }

    // Deduplicate and filter by tenant identifier/email
    const reviewsMap = new Map();
    rawList.forEach(r => {
      if (!r || !r.id) return;
      const matchId = idStr && (String(r.tenantId) === idStr || String(r.tenantEmail) === idStr);
      const matchEmail = emailStr && (String(r.tenantEmail).toLowerCase() === emailStr || String(r.tenantId).toLowerCase() === emailStr);
      if (matchId || matchEmail || (!idStr && !emailStr)) {
        reviewsMap.set(r.id, r);
      }
    });

    const reviews = Array.from(reviewsMap.values());

    if (reviews.length === 0) {
      return { hasReviews: false, rating: "New", count: 0, reviews: [] };
    }

    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const avg = (sum / reviews.length).toFixed(1);

    return {
      hasReviews: true,
      rating: String(avg),
      count: reviews.length,
      reviews
    };
  }
};
