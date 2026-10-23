import { apiClient } from '../lib/apiClient';

// In-memory cache for instant fallback while network revalidates
const ratingsCache = new Map();

/**
 * Rating & Review Service for Landlords and Tenants backed by PostgreSQL
 */
export const ratingService = {
  /**
   * Submit a review for a Landlord by a Tenant.
   */
  async submitLandlordReview({
    landlordId,
    landlordName,
    tenantId,
    tenantName,
    rating,
    comment,
    wouldRecommend = true,
    propertyTitle = "",
    propertyId = null,
    leaseId = null
  }) {
    if (!landlordId) return { success: false, message: "Missing landlord identifier." };

    try {
      const payload = {
        ratee_id: landlordId,
        landlordId,
        rating_type: 'tenant_rates_landlord',
        property_id: propertyId,
        lease_id: leaseId,
        rating: Number(rating) || 5,
        comment: (comment || "").trim(),
        would_recommend: Boolean(wouldRecommend)
      };

      const res = await apiClient('/ratings', {
        method: 'POST',
        body: payload
      });

      // Invalidate cache for this landlord across keys
      ratingsCache.delete(`landlord_${landlordId}`);
      ratingsCache.delete(`landlord_${String(landlordId).toLowerCase()}`);
      ratingsCache.clear();

      // Proactively fetch updated ratings to warm cache with fresh average
      try {
        await ratingService.getLandlordReviews(landlordId, true);
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('landlordRatingUpdated', { detail: { landlordId } }));
      window.dispatchEvent(new CustomEvent('ratingsUpdated', { detail: { landlordId } }));
      try { localStorage.setItem('lodale_ratings_updated_at', String(Date.now())); } catch (_) {}

      return {
        success: true,
        review: res.rating || payload
      };
    } catch (err) {
      console.error('[ratingService.submitLandlordReview error]:', err);
      return {
        success: false,
        message: err.message || 'Failed to submit landlord rating.'
      };
    }
  },

  /**
   * Get all reviews and computed average score for a Landlord.
   */
  async getLandlordReviews(landlordId, forceFresh = false) {
    const targetId = landlordId || 'me';
    const cacheKey = `landlord_${String(targetId).toLowerCase()}`;
    if (!forceFresh && ratingsCache.has(cacheKey)) {
      return ratingsCache.get(cacheKey);
    }

    try {
      const data = await apiClient(`/ratings/user/${encodeURIComponent(targetId)}?type=tenant_rates_landlord`);
      if (data && typeof data === 'object') {
        ratingsCache.set(cacheKey, data);
        ratingsCache.set(`landlord_${targetId}`, data);
        if (targetId !== 'me') {
          ratingsCache.set(`landlord_me`, data);
        }
        return data;
      }
    } catch (err) {
      console.warn('[ratingService.getLandlordReviews error]:', err.message);
    }

    return ratingsCache.get(cacheKey) || ratingsCache.get(`landlord_${targetId}`) || { hasReviews: false, rating: "New", count: 0, reviews: [] };
  },

  /**
   * Submit a review for a Tenant by a Landlord.
   */
  async submitTenantReview({
    tenantId,
    tenantName,
    tenantEmail,
    landlordId,
    landlordName,
    rating,
    comment,
    wouldRentAgain = true,
    propertyTitle = "",
    propertyId = null,
    leaseId = null
  }) {
    if (!tenantId && !tenantEmail) return { success: false, message: "Missing tenant identifier." };

    try {
      const payload = {
        ratee_id: tenantId,
        tenantId,
        tenantEmail,
        rating_type: 'landlord_rates_tenant',
        property_id: propertyId,
        lease_id: leaseId,
        rating: Number(rating) || 5,
        comment: (comment || "").trim(),
        would_recommend: Boolean(wouldRentAgain)
      };

      const res = await apiClient('/ratings', {
        method: 'POST',
        body: payload
      });

      // Invalidate cache for this tenant
      ratingsCache.delete(`tenant_${tenantId}`);
      if (tenantEmail) ratingsCache.delete(`tenant_${tenantEmail.toLowerCase()}`);
      ratingsCache.clear();

      try {
        await ratingService.getTenantReviews(tenantId, tenantEmail, true);
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('tenantRatingUpdated', { detail: { tenantId, tenantEmail } }));
      window.dispatchEvent(new CustomEvent('ratingsUpdated', { detail: { tenantId, tenantEmail } }));
      try { localStorage.setItem('lodale_ratings_updated_at', String(Date.now())); } catch (_) {}

      return {
        success: true,
        review: res.rating || payload
      };
    } catch (err) {
      console.error('[ratingService.submitTenantReview error]:', err);
      return {
        success: false,
        message: err.message || 'Failed to submit tenant rating.'
      };
    }
  },

  /**
   * Get all reviews and reliability score for a Tenant.
   */
  async getTenantReviews(tenantId, tenantEmail, forceFresh = false) {
    const idOrEmail = tenantId || tenantEmail;
    if (!idOrEmail) return { hasReviews: false, rating: "New", count: 0, reviews: [] };

    const cacheKey = `tenant_${String(idOrEmail).toLowerCase()}`;
    if (!forceFresh && ratingsCache.has(cacheKey)) {
      return ratingsCache.get(cacheKey);
    }

    try {
      const data = await apiClient(`/ratings/user/${encodeURIComponent(idOrEmail)}?type=landlord_rates_tenant`);
      if (data && typeof data === 'object') {
        ratingsCache.set(cacheKey, data);
        if (tenantId) ratingsCache.set(`tenant_${tenantId}`, data);
        if (tenantEmail) ratingsCache.set(`tenant_${tenantEmail.toLowerCase()}`, data);
        return data;
      }
    } catch (err) {
      console.warn('[ratingService.getTenantReviews error]:', err.message);
    }

    return ratingsCache.get(cacheKey) || { hasReviews: false, rating: "New", count: 0, reviews: [] };
  }
};
