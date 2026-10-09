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
      wouldRecommend
    } = req.body;

    let targetRateeId = ratee_id || tenantId || landlordId;

    // If ratee passed as email or non-UUID, look up the user by email
    if (!targetRateeId || !UUID_REGEX.test(targetRateeId)) {
      const emailToLookup = rateeEmail || tenantEmail || (targetRateeId && targetRateeId.includes('@') ? targetRateeId : null);
      if (emailToLookup) {
        const found = await UserModel.findByEmail(emailToLookup);
        if (found) targetRateeId = found.id;
      }
    }

    if (!targetRateeId || !UUID_REGEX.test(targetRateeId)) {
      return res.status(400).json({ error: 'Valid ratee identifier (UUID) is required' });
    }

    if (rater_id === targetRateeId) {
      return res.status(400).json({ error: 'Users cannot rate themselves' });
    }

    // Determine rating direction
    let resolvedType = rating_type;
    if (!resolvedType) {
      resolvedType = rater_role === 'landlord' ? 'landlord_rates_tenant' : 'tenant_rates_landlord';
    }

    // Verify tenant actually has an active or past lease with landlord before allowing rating
    if (resolvedType === 'tenant_rates_landlord') {
      const leaseCheck = await pool.query(
        'SELECT id FROM leases WHERE tenant_id = $1 AND landlord_id = $2 LIMIT 1',
        [rater_id, targetRateeId]
      );
      if (leaseCheck.rowCount === 0) {
        return res.status(403).json({ error: 'You can only rate landlords you have an active or past lease with' });
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

    if (userId === 'me') {
      userId = req.user.id;
    }

    // Support lookup by email
    if (userId && userId.includes('@')) {
      const found = await UserModel.findByEmail(userId);
      if (found) userId = found.id;
    }

    if (!userId || !UUID_REGEX.test(userId)) {
      return res.json({ hasReviews: false, rating: 'New', count: 0, reviews: [] });
    }

    const result = await RatingModel.getRatingsForUser(userId, type || null);
    res.json(result);
  })
};
