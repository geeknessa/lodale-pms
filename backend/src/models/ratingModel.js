import { pool } from '../db/db.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const RatingModel = {
  /**
   * Insert or update a rating.
   * rating_type: 'landlord_rates_tenant' | 'tenant_rates_landlord'
   */
  async createOrUpdateRating({
    rater_id,
    ratee_id,
    rating_type,
    property_id = null,
    lease_id = null,
    rating,
    comment = '',
    would_recommend = true
  }) {
    if (!rater_id || !ratee_id || !rating_type) {
      throw new Error('Missing required rating fields (rater_id, ratee_id, rating_type)');
    }

    const numRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const safePropId = property_id && UUID_REGEX.test(property_id) ? property_id : null;
    const safeLeaseId = lease_id && UUID_REGEX.test(lease_id) ? lease_id : null;

    const res = await pool.query(
      `INSERT INTO ratings (
        rater_id, ratee_id, rating_type, property_id, lease_id, rating, comment, would_recommend, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (rater_id, ratee_id, rating_type) DO UPDATE SET
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        would_recommend = EXCLUDED.would_recommend,
        property_id = COALESCE(EXCLUDED.property_id, ratings.property_id),
        lease_id = COALESCE(EXCLUDED.lease_id, ratings.lease_id),
        updated_at = NOW()
      RETURNING *`,
      [rater_id, ratee_id, rating_type, safePropId, safeLeaseId, numRating, comment || '', Boolean(would_recommend)]
    );

    return res.rows[0];
  },

  /**
   * Get all reviews and calculated score for a specific user (as ratee).
   * E.g. get ratings received by a tenant (rating_type = 'landlord_rates_tenant')
   * or received by a landlord (rating_type = 'tenant_rates_landlord')
   */
  async getRatingsForUser(ratee_id, rating_type = null) {
    if (!ratee_id || !UUID_REGEX.test(ratee_id)) {
      return { hasReviews: false, rating: 'New', count: 0, reviews: [] };
    }

    let query = `
      SELECT r.id, r.rater_id, r.ratee_id, r.rating_type, r.property_id, r.lease_id,
             r.rating, r.comment, r.would_recommend, r.created_at, r.updated_at,
             u.first_name as rater_first_name, u.last_name as rater_last_name, u.email as rater_email, u.avatar_url as rater_avatar,
             p.title as property_title
      FROM ratings r
      JOIN users u ON r.rater_id = u.id
      LEFT JOIN properties p ON r.property_id = p.id
      WHERE r.ratee_id = $1
    `;
    const params = [ratee_id];

    if (rating_type) {
      params.push(rating_type);
      query += ` AND r.rating_type = $2`;
    }

    query += ` ORDER BY r.created_at DESC`;

    const res = await pool.query(query, params);
    const rows = res.rows || [];

    const reviews = rows.map((row) => ({
      id: row.id,
      raterId: row.rater_id,
      raterName: `${row.rater_first_name || ''} ${row.rater_last_name || ''}`.trim() || 'Anonymous User',
      raterEmail: row.rater_email || '',
      raterAvatar: row.rater_avatar || '',
      rateeId: row.ratee_id,
      ratingType: row.rating_type,
      propertyId: row.property_id,
      propertyTitle: row.property_title || '',
      leaseId: row.lease_id,
      rating: Number(row.rating) || 5,
      comment: row.comment || '',
      wouldRecommend: Boolean(row.would_recommend),
      wouldRentAgain: Boolean(row.would_recommend),
      createdAt: row.created_at
    }));

    if (reviews.length === 0) {
      return { hasReviews: false, rating: 'New', count: 0, reviews: [] };
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
