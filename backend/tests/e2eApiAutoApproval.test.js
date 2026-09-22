import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_ENV = 'test';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/server.js';
import { pool } from '../src/db/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

async function runE2eTests() {
  console.log('=================================================================');
  console.log('    LODALE PMS — END-TO-END HTTP API AUTO APPROVAL TESTS        ');
  console.log('=================================================================\n');

  const createdPropIds = [];
  let testLandlordId;
  let testLandlordToken;
  let adminToken;

  try {
    // 1. Setup Auth Tokens & Users
    adminToken = jwt.sign(
      { id: 'constant_admin_id', email: 'admin', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    let lRes = await pool.query("SELECT id FROM users WHERE email = 'e2e.landlord@lodale.com' LIMIT 1");
    if (lRes.rows.length === 0) {
      const insRes = await pool.query(`
        INSERT INTO users (first_name, last_name, email, primary_role, account_status)
        VALUES ('E2E', 'Landlord', 'e2e.landlord@lodale.com', 'landlord', 'active')
        RETURNING id
      `);
      testLandlordId = insRes.rows[0].id;
    } else {
      testLandlordId = lRes.rows[0].id;
      await pool.query("UPDATE users SET account_status = 'active' WHERE id = $1", [testLandlordId]);
    }

    // Clean up any lingering properties from previous runs
    await pool.query("DELETE FROM listing_approval_queue WHERE submitted_by = $1", [testLandlordId]);
    await pool.query("DELETE FROM properties WHERE landlord_id = $1", [testLandlordId]);

    testLandlordToken = jwt.sign(
      { id: testLandlordId, email: 'e2e.landlord@lodale.com', role: 'landlord' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Seed 2 comparables in 'Victoria Island' at ~₦5,000,000
    const c1 = await pool.query(`
      INSERT INTO properties (
        landlord_id, title, slug, description, property_type, address_line1, city, state,
        bedrooms, bathrooms, rent_amount, status, ownership_doc, cover_image, is_deleted
      ) VALUES (
        $1, 'VI Baseline Villa 1', $2, 'Modern 3 bedroom flat in Victoria Island', 'apartment',
        '10 Adeola Odeku St', 'Victoria Island', 'Lagos', 3, 3, 5000000.00, 'active_vacant',
        'Deed of Assignment', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750', false
      ) RETURNING id
    `, [testLandlordId, 'vi-base-1-' + Date.now()]);
    createdPropIds.push(c1.rows[0].id);

    const c2 = await pool.query(`
      INSERT INTO properties (
        landlord_id, title, slug, description, property_type, address_line1, city, state,
        bedrooms, bathrooms, rent_amount, status, ownership_doc, cover_image, is_deleted
      ) VALUES (
        $1, 'VI Baseline Villa 2', $2, 'Luxury 3 bedroom flat in Victoria Island', 'apartment',
        '25 Kofo Abayomi St', 'Victoria Island', 'Lagos', 3, 3, 5200000.00, 'active_vacant',
        'Deed of Assignment', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688', false
      ) RETURNING id
    `, [testLandlordId, 'vi-base-2-' + Date.now()]);
    createdPropIds.push(c2.rows[0].id);

    // ------------------------------------------------------------------
    // E2E Flow 1: Landlord creates complete legitimate property
    // ------------------------------------------------------------------
    console.log('[E2E 1] Landlord submits complete legitimate property via POST /api/properties...');
    const createRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${testLandlordToken}`)
      .send({
        title: 'Waterfront Penthouse VI',
        description: 'Spectacular waterfront penthouse with panoramic lagoon view, 24/7 power, and gym.',
        address_line1: '45 Ozumba Mbadiwe Ave',
        city: 'Victoria Island',
        state: 'Lagos',
        property_type: 'apartment',
        bedrooms: 3,
        bathrooms: 3,
        rent_amount: 5100000,
        ownership_doc: 'Governor Consent (Verified)',
        ownership_doc_url: 'https://example.com/docs/gov-consent.pdf',
        cover_image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
        images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00']
      });

    console.log(`HTTP Status: ${createRes.status}`);
    console.log(`Returned Status: ${createRes.body.status}, ApprovalType: ${createRes.body.approval_type}, Score: ${createRes.body.verification_score}`);
    console.log(`Message: ${createRes.body.message}\n`);

    if (createRes.status !== 201 || createRes.body.status !== 'active_vacant' || createRes.body.approval_type !== 'automatic') {
      throw new Error(`E2E 1 failed: Expected active_vacant + automatic, got ${JSON.stringify(createRes.body)}`);
    }
    const autoApprovedPropId = createRes.body.id;
    createdPropIds.push(autoApprovedPropId);
    console.log('✓ E2E 1 PASSED: Property automatically approved on creation!\n');

    // ------------------------------------------------------------------
    // E2E Flow 2: Landlord fetches listings via GET /api/properties/landlord/:id
    // ------------------------------------------------------------------
    console.log('[E2E 2] Landlord queries their listings via GET /api/properties/landlord/:id...');
    const landlordPropsRes = await request(app)
      .get(`/api/properties/landlord/${testLandlordId}`)
      .set('Authorization', `Bearer ${testLandlordToken}`);

    const foundInLandlordList = landlordPropsRes.body.find(p => p.id === autoApprovedPropId);
    if (!foundInLandlordList || foundInLandlordList.status !== 'active_vacant') {
      throw new Error(`E2E 2 failed: Auto-approved property not found as active_vacant in landlord listings.`);
    }
    console.log(`Found Property in Landlord Listings: "${foundInLandlordList.title}" with status: "${foundInLandlordList.status}"`);
    console.log('✓ E2E 2 PASSED: Landlord correctly sees the listing as Live!\n');

    // ------------------------------------------------------------------
    // E2E Flow 3: Admin queries all listings via GET /api/admin/properties
    // ------------------------------------------------------------------
    console.log('[E2E 3] Admin queries listings via GET /api/admin/properties...');
    const adminPropsRes = await request(app)
      .get('/api/admin/properties')
      .set('Authorization', `Bearer ${adminToken}`);

    const foundInAdminList = adminPropsRes.body.find(p => p.id === autoApprovedPropId);
    if (!foundInAdminList || foundInAdminList.status !== 'Live' || foundInAdminList.approvalType !== 'automatic') {
      throw new Error(`E2E 3 failed: Expected Live status with approvalType automatic in admin list. Got: ${JSON.stringify(foundInAdminList)}`);
    }
    console.log(`Admin sees Property: "${foundInAdminList.title}" | Status: ${foundInAdminList.status} | ApprovalType: ${foundInAdminList.approvalType} | Score: ${foundInAdminList.verificationScore}/100 | Risk: ${foundInAdminList.riskLevel}`);
    console.log('✓ E2E 3 PASSED: Admin correctly sees Auto-Approved Live listing with score & risk level!\n');

    // ------------------------------------------------------------------
    // E2E Flow 4: Landlord submits incomplete property needing review
    // ------------------------------------------------------------------
    console.log('[E2E 4] Landlord submits incomplete property (needs review)...');
    const incompleteRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${testLandlordToken}`)
      .send({
        title: 'Needs Admin Review Villa',
        description: 'Short desc',
        address_line1: '98 Pending Lane',
        city: 'Victoria Island',
        state: 'Lagos',
        property_type: 'apartment',
        bedrooms: 2,
        bathrooms: 2,
        rent_amount: 5000000,
        ownership_doc: '', // Missing ownership doc
        cover_image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00'
      });

    console.log(`HTTP Status: ${incompleteRes.status}`);
    console.log(`Returned Status: ${incompleteRes.body.status}, ApprovalType: ${incompleteRes.body.approval_type}, Score: ${incompleteRes.body.verification_score}`);
    console.log(`Review Reasons: ${incompleteRes.body.review_reasons?.join(', ')}\n`);

    if (incompleteRes.body.status !== 'pending_review' || incompleteRes.body.approval_type !== 'pending') {
      throw new Error(`E2E 4 failed: Expected pending_review status. Got: ${JSON.stringify(incompleteRes.body)}`);
    }
    const pendingPropId = incompleteRes.body.id;
    createdPropIds.push(pendingPropId);
    console.log('✓ E2E 4 PASSED: Incomplete listing correctly routed to pending_review for Admin Review!\n');

    // ------------------------------------------------------------------
    // E2E Flow 5: Admin reviews and manually approves the pending property
    // ------------------------------------------------------------------
    console.log('[E2E 5] Admin manually approves the pending listing via POST /api/admin/properties/:id/review...');
    const adminApproveRes = await request(app)
      .post(`/api/admin/properties/${pendingPropId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });

    console.log(`Admin Review Result: ${JSON.stringify(adminApproveRes.body)}`);
    if (adminApproveRes.body.status !== 'active_vacant' || adminApproveRes.body.approval_type !== 'manual') {
      throw new Error(`E2E 5 failed: Manual approval did not set active_vacant and approval_type manual`);
    }
    console.log('✓ E2E 5 PASSED: Admin manual override successfully approved listing with approval_type = manual!\n');

    // ------------------------------------------------------------------
    // E2E Flow 6: Admin overrides and rejects a live listing
    // ------------------------------------------------------------------
    console.log('[E2E 6] Admin rejects the listing via POST /api/admin/properties/:id/review...');
    const adminRejectRes = await request(app)
      .post(`/api/admin/properties/${pendingPropId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'reject', reason: 'Document verification failed on audit' });

    console.log(`Admin Reject Result: ${JSON.stringify(adminRejectRes.body)}`);
    if (adminRejectRes.body.status !== 'inactive') {
      throw new Error(`E2E 6 failed: Rejection did not set inactive status`);
    }
    console.log('✓ E2E 6 PASSED: Admin override successfully rejected listing and set status = inactive!\n');

    console.log('=================================================================');
    console.log('     ALL END-TO-END HTTP API FLOWS TESTED & PASSED (6 / 6)       ');
    console.log('=================================================================');
  } catch (err) {
    console.error('Fatal error in E2E API tests:', err);
    process.exit(1);
  } finally {
    console.log('[Cleanup] Cleaning up test properties...');
    for (const id of createdPropIds) {
      try {
        await pool.query('DELETE FROM listing_approval_queue WHERE property_id = $1', [id]);
        await pool.query('DELETE FROM property_amenities WHERE property_id = $1', [id]);
        await pool.query('DELETE FROM property_units WHERE property_id = $1', [id]);
        await pool.query('DELETE FROM properties WHERE id = $1', [id]);
      } catch (e) {}
    }
    if (testLandlordId) {
      try {
        await pool.query("DELETE FROM users WHERE email = 'e2e.landlord@lodale.com'");
      } catch (e) {}
    }
    await pool.end();
    console.log('[Cleanup] Finished.\n');
  }
}

runE2eTests();
