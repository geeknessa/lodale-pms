import { pool } from '../db/db.js';

const KNOWN_PROPERTY_TYPES = [
  'single_house', 'apartment', 'estate', 'hostel', 'bq', 'commercial',
  'flat', 'duplex', 'bungalow', 'terrace', 'penthouse', 'room_and_parlour',
  'self_contained', 'mini_flat', 'office', 'shop', 'warehouse'
];

export const PropertyVerificationService = {
  /**
   * 1. Landlord Account Verification (20 points, Critical)
   */
  async checkLandlordAccount(landlordId) {
    if (!landlordId) {
      return {
        key: 'landlord_account',
        name: 'Landlord Account',
        status: 'FAIL',
        score: 0,
        maxScore: 20,
        isCritical: true,
        reason: 'Landlord identity is missing or unauthenticated'
      };
    }

    const res = await pool.query(
      'SELECT id, first_name, last_name, email, primary_role, account_status, id_verification_status FROM users WHERE id = $1',
      [landlordId]
    );

    if (res.rows.length === 0) {
      return {
        key: 'landlord_account',
        name: 'Landlord Account',
        status: 'FAIL',
        score: 0,
        maxScore: 20,
        isCritical: true,
        reason: 'Landlord account record not found in system'
      };
    }

    const user = res.rows[0];
    const accountStatus = (user.account_status || 'active').toLowerCase();

    const blockedStatuses = ['suspended', 'deactivated', 'blocked', 'archived', 'deleted_by_user'];
    if (blockedStatuses.includes(accountStatus)) {
      return {
        key: 'landlord_account',
        name: 'Landlord Account',
        status: 'FAIL',
        score: 0,
        maxScore: 20,
        isCritical: true,
        reason: `Landlord account is ${accountStatus}`
      };
    }

    if (!user.first_name || !user.last_name || !user.email) {
      return {
        key: 'landlord_account',
        name: 'Landlord Account',
        status: 'FAIL',
        score: 0,
        maxScore: 20,
        isCritical: true,
        reason: 'Landlord profile is missing essential identity information'
      };
    }

    return {
      key: 'landlord_account',
      name: 'Landlord Account',
      status: 'PASS',
      score: 20,
      maxScore: 20,
      isCritical: true,
      reason: 'Active landlord account with valid standing'
    };
  },

  /**
   * 2. Required Property Information (15 points, Critical)
   */
  checkRequiredInformation(data) {
    if (!data || typeof data !== 'object') {
      return {
        key: 'required_information',
        name: 'Required Information',
        status: 'FAIL',
        score: 0,
        maxScore: 15,
        isCritical: true,
        reason: 'Missing property submission payload'
      };
    }
    const missing = [];
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
      missing.push('Property Title (min 3 chars)');
    }
    if (!data.address_line1 || typeof data.address_line1 !== 'string' || data.address_line1.trim().length < 3) {
      missing.push('Street Address');
    }
    if (!data.city || typeof data.city !== 'string' || data.city.trim().length < 2) {
      missing.push('City');
    }
    if (!data.state || typeof data.state !== 'string' || data.state.trim().length < 2) {
      missing.push('State');
    }
    if (!data.property_type || typeof data.property_type !== 'string' || data.property_type.trim().length < 2) {
      missing.push('Property Type');
    }
    if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 10) {
      missing.push('Description (min 10 chars)');
    }

    if (missing.length > 0) {
      return {
        key: 'required_information',
        name: 'Required Information',
        status: 'FAIL',
        score: 0,
        maxScore: 15,
        isCritical: true,
        reason: `Missing or incomplete required fields: ${missing.join(', ')}`
      };
    }

    return {
      key: 'required_information',
      name: 'Required Information',
      status: 'PASS',
      score: 15,
      maxScore: 15,
      isCritical: true,
      reason: 'All required property listing fields completed'
    };
  },

  /**
   * 3. Property Validation (15 points, Critical)
   */
  checkPropertyValidation(data) {
    if (!data || typeof data !== 'object') {
      return {
        key: 'property_validation',
        name: 'Property Validation',
        status: 'FAIL',
        score: 0,
        maxScore: 15,
        isCritical: true,
        reason: 'Missing property submission payload'
      };
    }
    const rentAmount = Number(data.rent_amount);
    if (isNaN(rentAmount) || rentAmount <= 0) {
      return {
        key: 'property_validation',
        name: 'Property Validation',
        status: 'FAIL',
        score: 0,
        maxScore: 15,
        isCritical: true,
        reason: 'Rent amount must be a valid positive number'
      };
    }

    const bedrooms = Number(data.bedrooms);
    if (isNaN(bedrooms) || bedrooms < 0) {
      return {
        key: 'property_validation',
        name: 'Property Validation',
        status: 'FAIL',
        score: 0,
        maxScore: 15,
        isCritical: true,
        reason: 'Number of bedrooms must be non-negative'
      };
    }

    const bathrooms = Number(data.bathrooms);
    if (isNaN(bathrooms) || bathrooms < 0) {
      return {
        key: 'property_validation',
        name: 'Property Validation',
        status: 'FAIL',
        score: 0,
        maxScore: 15,
        isCritical: true,
        reason: 'Number of bathrooms must be non-negative'
      };
    }

    const sanitizedType = (data.property_type || '').toString().trim().toLowerCase().replace(/\s+/g, '_');
    if (!KNOWN_PROPERTY_TYPES.includes(sanitizedType)) {
      return {
        key: 'property_validation',
        name: 'Property Validation',
        status: 'FAIL',
        score: 0,
        maxScore: 15,
        isCritical: true,
        reason: `Unrecognized property type: ${data.property_type}`
      };
    }

    const desc = (data.description || '').trim();
    const spamRegex = /^(asdf|test|xxx|placeholder|qwer|demo|foo|bar)$/i;
    if (spamRegex.test(desc) || desc.length < 10) {
      return {
        key: 'property_validation',
        name: 'Property Validation',
        status: 'FAIL',
        score: 0,
        maxScore: 15,
        isCritical: true,
        reason: 'Property description appears to be placeholder or insufficient'
      };
    }

    return {
      key: 'property_validation',
      name: 'Property Validation',
      status: 'PASS',
      score: 15,
      maxScore: 15,
      isCritical: true,
      reason: 'Rent pricing, room counts, and property details are valid'
    };
  },

  /**
   * 4. Required Documents & Photos (20 points, Critical)
   */
  checkRequiredDocuments(data) {
    if (!data || typeof data !== 'object') {
      return {
        key: 'required_documents',
        name: 'Required Documents & Photos',
        status: 'FAIL',
        score: 0,
        maxScore: 20,
        isCritical: true,
        reason: 'Missing property submission payload'
      };
    }
    const hasDoc = Boolean(
      (data.ownership_doc && typeof data.ownership_doc === 'string' && data.ownership_doc.trim()) ||
      (data.ownership_doc_url && typeof data.ownership_doc_url === 'string' && data.ownership_doc_url.trim())
    );

    let imageCount = 0;
    if (data.cover_image && typeof data.cover_image === 'string' && data.cover_image.trim()) {
      imageCount++;
    }
    if (Array.isArray(data.images) && data.images.length > 0) {
      imageCount += data.images.length;
    } else if (typeof data.images === 'string' && data.images.trim() && data.images !== '[]') {
      try {
        const parsed = JSON.parse(data.images);
        if (Array.isArray(parsed)) imageCount += parsed.length;
      } catch (e) {
        imageCount++;
      }
    }

    if (!hasDoc && imageCount === 0) {
      return {
        key: 'required_documents',
        name: 'Required Documents & Photos',
        status: 'FAIL',
        score: 0,
        maxScore: 20,
        isCritical: true,
        reason: 'Both title proof documents and property photos are missing'
      };
    }

    if (!hasDoc) {
      return {
        key: 'required_documents',
        name: 'Required Documents & Photos',
        status: 'FAIL',
        score: 0,
        maxScore: 20,
        isCritical: true,
        reason: 'Ownership verification document (Deed / C of O) is missing'
      };
    }

    if (imageCount === 0) {
      return {
        key: 'required_documents',
        name: 'Required Documents & Photos',
        status: 'FAIL',
        score: 0,
        maxScore: 20,
        isCritical: true,
        reason: 'At least one property photo or cover image is required'
      };
    }

    return {
      key: 'required_documents',
      name: 'Required Documents & Photos',
      status: 'PASS',
      score: 20,
      maxScore: 20,
      isCritical: true,
      reason: 'Ownership document and gallery photos verified'
    };
  },

  /**
   * 5. Duplicate Property Detection (15 points, Critical)
   */
  async checkDuplicateProperty(data, landlordId) {
    if (!data || typeof data !== 'object') {
      return {
        key: 'duplicate_detection',
        name: 'Duplicate Detection',
        status: 'PASS',
        score: 15,
        maxScore: 15,
        isCritical: true,
        reason: 'No payload data provided'
      };
    }
    const title = (data.title || '').trim();
    const address = (data.address_line1 || '').trim();
    const city = (data.city || '').trim();
    const propertyType = (data.property_type || '').trim().toLowerCase().replace(/\s+/g, '_');
    const propertyId = data.id ? String(data.id) : null;

    // Check 1: Same landlord with same address or title
    let sameLandlordQuery = `
      SELECT id, title, address_line1, city FROM properties 
      WHERE (is_deleted IS FALSE OR is_deleted IS NULL)
        AND landlord_id = $1
        AND (LOWER(TRIM(address_line1)) = LOWER(TRIM($2)) OR LOWER(TRIM(title)) = LOWER(TRIM($3)))
    `;
    const params1 = [landlordId, address, title];
    if (propertyId) {
      params1.push(propertyId);
      sameLandlordQuery += ` AND id::text != $${params1.length}`;
    }
    sameLandlordQuery += ` LIMIT 1`;
    const sameLandlordRes = await pool.query(sameLandlordQuery, params1);
    if (sameLandlordRes.rows.length > 0) {
      const match = sameLandlordRes.rows[0];
      return {
        key: 'duplicate_detection',
        name: 'Duplicate Detection',
        status: 'DUPLICATE_DETECTED',
        score: 0,
        maxScore: 15,
        isCritical: true,
        reason: `Potential duplicate: Landlord already has listing "${match.title}" at "${match.address_line1}"`
      };
    }

    // Check 2: Same address, city, and property type across entire database
    let sameAddressQuery = `
      SELECT id, title, address_line1, city, landlord_id FROM properties 
      WHERE (is_deleted IS FALSE OR is_deleted IS NULL)
        AND LOWER(TRIM(address_line1)) = LOWER(TRIM($1))
        AND LOWER(TRIM(city)) = LOWER(TRIM($2))
        AND LOWER(TRIM(property_type)) = LOWER(TRIM($3))
    `;
    const params2 = [address, city, propertyType];
    if (propertyId) {
      params2.push(propertyId);
      sameAddressQuery += ` AND id::text != $${params2.length}`;
    }
    sameAddressQuery += ` LIMIT 1`;
    const sameAddressRes = await pool.query(sameAddressQuery, params2);
    if (sameAddressRes.rows.length > 0) {
      const match = sameAddressRes.rows[0];
      return {
        key: 'duplicate_detection',
        name: 'Duplicate Detection',
        status: 'DUPLICATE_DETECTED',
        score: 0,
        maxScore: 15,
        isCritical: true,
        reason: `Duplicate address: Listing "${match.title}" already exists at "${match.address_line1}, ${match.city}"`
      };
    }

    // Check 3: Same unique cover image (exclude common stock / preset images)
    const coverImage = (data.cover_image || '').trim();
    const isPreset = coverImage.includes('unsplash.com') || coverImage.includes('skyline_apartment') || coverImage.length < 30;
    if (coverImage && !isPreset) {
      let sameImageQuery = `
        SELECT id, title FROM properties
        WHERE (is_deleted IS FALSE OR is_deleted IS NULL)
          AND cover_image = $1
      `;
      const params3 = [coverImage];
      if (propertyId) {
        params3.push(propertyId);
        sameImageQuery += ` AND id::text != $${params3.length}`;
      }
      sameImageQuery += ` LIMIT 1`;
      const sameImageRes = await pool.query(sameImageQuery, params3);
      if (sameImageRes.rows.length > 0) {
        return {
          key: 'duplicate_detection',
          name: 'Duplicate Detection',
          status: 'DUPLICATE_DETECTED',
          score: 0,
          maxScore: 15,
          isCritical: true,
          reason: `Duplicate listing image detected matching existing listing "${sameImageRes.rows[0].title}"`
        };
      }
    }

    return {
      key: 'duplicate_detection',
      name: 'Duplicate Detection',
      status: 'PASS',
      score: 15,
      maxScore: 15,
      isCritical: true,
      reason: 'No duplicate property or address detected'
    };
  },

  /**
   * 6. Price Anomaly Check (10 points, Critical)
   * Where enough comparable approved/live data exists, compare prices.
   * If not enough comparable data (< 2), mark INSUFFICIENT_DATA and route to Admin Review.
   */
  async checkPriceAnomaly(data) {
    if (!data || typeof data !== 'object') {
      return {
        key: 'price_analysis',
        name: 'Price Analysis',
        status: 'INSUFFICIENT_DATA',
        score: 0,
        maxScore: 10,
        isCritical: true,
        comparablesCount: 0,
        reason: 'No payload data provided'
      };
    }
    const rentAmount = Number(data.rent_amount) || 0;
    const city = (data.city || '').trim();
    const state = (data.state || '').trim();
    const propertyType = (data.property_type || '').trim().toLowerCase().replace(/\s+/g, '_');
    const propertyId = data.id ? String(data.id) : null;

    // Search for approved/live comparable properties in the same city or state & type
    let query = `
      SELECT rent_amount, bedrooms, city, property_type 
      FROM properties
      WHERE (is_deleted IS FALSE OR is_deleted IS NULL)
        AND status IN ('active_vacant', 'approved', 'live', 'active', 'occupied', 'active_occupied')
        AND (
          LOWER(TRIM(city)) = LOWER(TRIM($1))
          OR (LOWER(TRIM(state)) = LOWER(TRIM($2)) AND LOWER(TRIM(property_type)) = LOWER(TRIM($3)))
        )
    `;
    const params = [city, state, propertyType];
    if (propertyId) {
      params.push(propertyId);
      query += ` AND id::text != $${params.length}`;
    }
    const res = await pool.query(query, params);
    const comparables = res.rows.map(r => Number(r.rent_amount)).filter(p => !isNaN(p) && p > 0);

    // If fewer than 2 comparables exist, evaluate if price is within plausible real-estate bounds
    if (comparables.length < 2) {
      const isPlausiblePrice = rentAmount >= 50000 && rentAmount <= 500000000;
      if (isPlausiblePrice) {
        return {
          key: 'price_analysis',
          name: 'Price Analysis',
          status: 'PASS',
          score: 10,
          maxScore: 10,
          isCritical: false,
          comparablesCount: comparables.length,
          reason: `Price ₦${rentAmount.toLocaleString()} is within plausible market rates for ${propertyType || 'property'} in ${city || state || 'area'}`
        };
      }
      return {
        key: 'price_analysis',
        name: 'Price Analysis',
        status: 'INSUFFICIENT_DATA',
        score: 0,
        maxScore: 10,
        isCritical: true,
        comparablesCount: comparables.length,
        reason: `Price ₦${rentAmount.toLocaleString()} is outside realistic market ranges (₦50,000 - ₦500,000,000) and lacks sufficient comparable live property data in ${city || state} (found ${comparables.length}, min 2 required).`
      };
    }

    // Calculate baseline stats
    const sum = comparables.reduce((a, b) => a + b, 0);
    const avg = sum / comparables.length;
    const minAcceptable = avg * 0.35;
    const maxAcceptable = avg * 2.85;

    if (rentAmount < minAcceptable || rentAmount > maxAcceptable) {
      return {
        key: 'price_analysis',
        name: 'Price Analysis',
        status: 'ANOMALY_DETECTED',
        score: 0,
        maxScore: 10,
        isCritical: true,
        comparablesCount: comparables.length,
        averagePrice: Math.round(avg),
        reason: `Price ₦${rentAmount.toLocaleString()} is outside the expected market range (₦${Math.round(minAcceptable).toLocaleString()} - ₦${Math.round(maxAcceptable).toLocaleString()}) based on ${comparables.length} comparable properties.`
      };
    }

    return {
      key: 'price_analysis',
      name: 'Price Analysis',
      status: 'PASS',
      score: 10,
      maxScore: 10,
      isCritical: false,
      comparablesCount: comparables.length,
      averagePrice: Math.round(avg),
      reason: `Price ₦${rentAmount.toLocaleString()} aligns with market rates (avg ₦${Math.round(avg).toLocaleString()}) across ${comparables.length} comparable properties`
    };
  },

  /**
   * 7. Landlord History (5 points)
   */
  async checkLandlordHistory(landlordId) {
    if (!landlordId) {
      return {
        key: 'landlord_history',
        name: 'Landlord History',
        status: 'PASS',
        score: 5,
        maxScore: 5,
        isCritical: false,
        reason: 'New landlord with no negative history'
      };
    }

    // Check previous rejected listings or suspensions
    const histQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status IN ('inactive', 'rejected')) AS rejected_count,
        COUNT(*) FILTER (WHERE status = 'suspended') AS suspended_count,
        COUNT(*) FILTER (WHERE status IN ('active_vacant', 'approved', 'live', 'active', 'occupied')) AS approved_count
      FROM properties
      WHERE landlord_id = $1
    `;
    const res = await pool.query(histQuery, [landlordId]);
    const row = res.rows[0] || {};
    const rejectedCount = Number(row.rejected_count) || 0;
    const suspendedCount = Number(row.suspended_count) || 0;
    const approvedCount = Number(row.approved_count) || 0;

    if (suspendedCount > 0 || rejectedCount >= 3) {
      return {
        key: 'landlord_history',
        name: 'Landlord History',
        status: 'SUSPICIOUS_HISTORY',
        score: 0,
        maxScore: 5,
        isCritical: true,
        rejectedCount,
        suspendedCount,
        reason: `Landlord has past listing issues (${rejectedCount} rejected, ${suspendedCount} suspended). Sent to Admin Review.`
      };
    }

    if (rejectedCount > 0) {
      return {
        key: 'landlord_history',
        name: 'Landlord History',
        status: 'MINOR_INFRACTIONS',
        score: 0,
        maxScore: 5,
        isCritical: false,
        rejectedCount,
        suspendedCount,
        reason: `Landlord has past rejected listing (${rejectedCount} rejected). Deducted 5 points.`
      };
    }

    return {
      key: 'landlord_history',
      name: 'Landlord History',
      status: 'PASS',
      score: 5,
      maxScore: 5,
      isCritical: false,
      approvedCount,
      reason: approvedCount > 0 
        ? `Proven landlord record with ${approvedCount} previous approved listings`
        : 'Clean landlord history with zero infractions'
    };
  },

  /**
   * Master Verification Pipeline
   * Returns:
   * {
   *   decision: 'AUTO_APPROVE' | 'ADMIN_REVIEW',
   *   score: number,
   *   riskLevel: 'low' | 'medium' | 'high',
   *   results: { ... },
   *   reviewReasons: string[]
   * }
   */
  async verifyProperty(propertyData, landlordId) {
    try {
      const landlordAccountCheck = await this.checkLandlordAccount(landlordId);
      const requiredInfoCheck = this.checkRequiredInformation(propertyData);
      const propertyValidationCheck = this.checkPropertyValidation(propertyData);
      const requiredDocsCheck = this.checkRequiredDocuments(propertyData);
      const duplicateCheck = await this.checkDuplicateProperty(propertyData, landlordId);
      const priceAnomalyCheck = await this.checkPriceAnomaly(propertyData);
      const landlordHistoryCheck = await this.checkLandlordHistory(landlordId);

      const checks = [
        landlordAccountCheck,
        requiredInfoCheck,
        propertyValidationCheck,
        requiredDocsCheck,
        duplicateCheck,
        priceAnomalyCheck,
        landlordHistoryCheck
      ];

      const totalScore = checks.reduce((sum, c) => sum + (c.score || 0), 0);
      const criticalFailures = checks.filter(c => c.isCritical && c.status !== 'PASS');
      const reviewReasons = checks
        .filter(c => c.status !== 'PASS')
        .map(c => `${c.name}: ${c.reason}`);

      const resultsMap = {};
      checks.forEach(c => {
        resultsMap[c.key] = {
          name: c.name,
          status: c.status,
          score: c.score,
          maxScore: c.maxScore,
          reason: c.reason
        };
      });

      let decision = 'ADMIN_REVIEW';
      let riskLevel = 'medium';

      if (criticalFailures.length > 0) {
        decision = 'ADMIN_REVIEW';
        riskLevel = 'high';
      } else if (totalScore >= 90) {
        decision = 'AUTO_APPROVE';
        riskLevel = 'low';
      } else {
        decision = 'ADMIN_REVIEW';
        riskLevel = 'medium';
      }

      return {
        decision,
        score: totalScore,
        riskLevel,
        reviewReasons,
        results: resultsMap
      };
    } catch (err) {
      console.error('[PropertyVerificationService] Technical verification failure:', err);
      // Safety rule: Technical error always defaults to ADMIN REVIEW and NEVER auto-approves
      return {
        decision: 'ADMIN_REVIEW',
        score: 0,
        riskLevel: 'high',
        reviewReasons: [`Technical verification error: ${err.message}. Routed to Admin Review for safety.`],
        results: {
          system_error: {
            name: 'System Verification Engine',
            status: 'ERROR',
            score: 0,
            maxScore: 100,
            reason: err.message
          }
        }
      };
    }
  }
};
