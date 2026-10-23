import { RatingModel } from '../models/ratingModel.js';
import { UserModel } from '../models/userModel.js';
import { pool } from '../db/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const ratingController = {
  /**
   * POST /api/ratings
   * Submit or update a rating for a user.
   */
  submitRating: asyncHandler(async (req, res) => {
    const rater_id = req.user.id;
    const rater_role = req.user.role || req.user.primary_role;

    let {
      ratee_id,
      tenantId,
      landlordId,
      rateeEmail,
      tenantEmail,
      rating_type,
      property_id,
      lease_id,
      rating,
      comment,
      would_recommend,
      wouldRentAgain,
      wouldRecommend,
      landlordEmail
    } = req.body;

    // Determine rating direction
    let resolvedType = rating_type;
    if (!resolvedType) {
      if (landlordId && rater_id !== landlordId) {
        resolvedType = 'tenant_rates_landlord';
      } else if (tenantId && rater_id !== tenantId) {
        resolvedType = 'landlord_rates_tenant';
      } else {
        resolvedType = rater_role === 'landlord' ? 'landlord_rates_tenant' : 'tenant_rates_landlord';
      }
    }

    // Resolve ratee target: when tenant rates landlord, ratee MUST be landlord
    let targetRateeId = resolvedType === 'tenant_rates_landlord'
      ? (landlordId || ratee_id)
      : (tenantId || ratee_id);

    if (!targetRateeId) {
      targetRateeId = ratee_id || landlordId || tenantId;
    }

    // If ratee passed as email or non-UUID, look up the user by email
    if (!targetRateeId || !UUID_REGEX.test(targetRateeId)) {
      const emailToLookup = rateeEmail || (resolvedType === 'tenant_rates_landlord' ? landlordEmail : tenantEmail) || (targetRateeId && targetRateeId.includes('@') ? targetRateeId : null);
      if (emailToLookup) {
        const found = await UserModel.findByEmail(emailToLookup);
        if (found) targetRateeId = found.id;
      }
    }

    // If still not a UUID and property_id or lease_id is provided, resolve from property/lease
    if ((!targetRateeId || !UUID_REGEX.test(targetRateeId)) && property_id && UUID_REGEX.test(property_id)) {
      try {
        const propRes = await pool.query('SELECT landlord_id FROM properties WHERE id = $1', [property_id]);
        if (propRes.rows.length > 0 && propRes.rows[0].landlord_id) {
          targetRateeId = propRes.rows[0].landlord_id;
        }
      } catch (e) {}
    }

    if ((!targetRateeId || !UUID_REGEX.test(targetRateeId)) && lease_id && UUID_REGEX.test(lease_id)) {
      try {
        const leaseRes = await pool.query('SELECT landlord_id, tenant_id FROM leases WHERE id = $1', [lease_id]);
        if (leaseRes.rows.length > 0) {
          targetRateeId = resolvedType === 'tenant_rates_landlord' ? leaseRes.rows[0].landlord_id : leaseRes.rows[0].tenant_id;
        }
      } catch (e) {}
    }

    if (!targetRateeId || !UUID_REGEX.test(targetRateeId)) {
      return res.status(400).json({ error: 'Valid ratee identifier (UUID) is required' });
    }

    if (rater_id === targetRateeId) {
      return res.status(400).json({ error: 'Users cannot rate themselves' });
    }

    // Verify tenant actually has an active or past lease or property application with landlord before allowing rating
    if (resolvedType === 'tenant_rates_landlord') {
      const relationshipCheck = await pool.query(
        `SELECT l.id FROM leases l
         LEFT JOIN properties p ON l.property_id = p.id
         WHERE l.tenant_id = $1 AND (l.landlord_id = $2 OR p.landlord_id = $2)
         UNION
         SELECT pa.id FROM property_applications pa
         JOIN properties p ON pa.property_id = p.id
         WHERE pa.tenant_id = $1 AND p.landlord_id = $2
         LIMIT 1`,
        [rater_id, targetRateeId]
      );
      if (relationshipCheck.rowCount === 0) {
        return res.status(403).json({ error: 'You can only rate landlords you have an active or past lease or application with' });
      }
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating score must be between 1 and 5' });
    }

    const recommendation = would_recommend !== undefined 
      ? Boolean(would_recommend) 
      : (wouldRentAgain !== undefined ? Boolean(wouldRentAgain) : (wouldRecommend !== undefined ? Boolean(wouldRecommend) : true));

    const saved = await RatingModel.createOrUpdateRating({
      rater_id,
      ratee_id: targetRateeId,
      rating_type: resolvedType,
      property_id,
      lease_id,
      rating: numRating,
      comment: (comment || '').trim(),
      would_recommend: recommendation
    });

    res.status(201).json({
      success: true,
      message: 'Rating saved successfully',
      rating: saved
    });
  }),

  /**
   * GET /api/ratings/user/:userId
   * Query params: type = 'landlord_rates_tenant' | 'tenant_rates_landlord'
   */
  getUserRatings: asyncHandler(async (req, res) => {
    let { userId } = req.params;
    const { type } = req.query;

    let targetId = userId || req.query.ratee_id || req.query.landlordId || req.query.tenantId;

    if (targetId === 'me' || targetId === 'current' || targetId === 'self') {
      targetId = req.user?.id;
    }

    // Support lookup by email
    if (targetId && targetId.includes('@')) {
      const found = await UserModel.findByEmail(targetId);
      targetId = found ? found.id : null;
    }

    if (!targetId && req.user?.id) {
      targetId = req.user.id;
    }

    // If targetId is still not resolved to a valid UUID and query is for landlord ratings
    if (!targetId || !UUID_REGEX.test(targetId)) {
      if (type === 'tenant_rates_landlord') {
        try {
          const ratedLandlord = await pool.query(
            `SELECT DISTINCT ratee_id as id FROM ratings WHERE rating_type = 'tenant_rates_landlord' LIMIT 1`
          );
          if (ratedLandlord.rows.length > 0) {
            targetId = ratedLandlord.rows[0].id;
          } else {
            const fallbackLandlord = await pool.query(
              `SELECT id FROM users WHERE primary_role = 'landlord' LIMIT 1`
            );
            if (fallbackLandlord.rows.length > 0) {
              targetId = fallbackLandlord.rows[0].id;
            }
          }
        } catch (_) {}
      }
    }

    if (!targetId || !UUID_REGEX.test(targetId)) {
      return res.json({ hasReviews: false, rating: 'New', count: 0, reviews: [] });
    }

    const result = await RatingModel.getRatingsForUser(targetId, type || null);
    res.json(result);
  })
};
