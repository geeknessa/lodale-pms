import dotenv from 'dotenv';
dotenv.config();

import { pool } from '../src/db/db.js';
import { PropertyVerificationService } from '../src/services/propertyVerificationService.js';
import { PropertyModel } from '../src/models/propertyModel.js';
import { AdminModel } from '../src/models/adminModel.js';
import { autoApprovalService } from '../src/services/autoApprovalService.js';

async function runDelayTests() {
  console.log('=================================================================');
  console.log(' LODALE PMS -- 1-MINUTE DELAY & SAFETY CHECK TEST SUITE          ');
  console.log('=================================================================\n');

  let passedTests = 0;
  let totalTests = 7;
  const createdTestPropIds = [];
  const createdTestUserIds = [];

  try {
    // 0. Setup active landlord
    console.log('[Setup] Preparing test landlord and baseline data...');
    let landlordRes = await pool.query("SELECT * FROM users WHERE email = 'delay.test.landlord@example.com' LIMIT 1");
    let testLandlordId;
    if (landlordRes.rows.length === 0) {
      const uRes = await pool.query(`
        INSERT INTO users (first_name, last_name, email, primary_role, account_status)
        VALUES ('TestDelay', 'Landlord', 'delay.test.landlord@example.com', 'landlord', 'active')
        RETURNING id
      `);
      testLandlordId = uRes.rows[0].id;
      createdTestUserIds.push(testLandlordId);
    } else {
      testLandlordId = landlordRes.rows[0].id;
      await pool.query("UPDATE users SET account_status = 'active', deleted_at = NULL WHERE id = $1", [testLandlordId]);
    }

    // Seed 2 comparable live properties in "Ikeja GRA" at ~₦3,000,000 for price baseline
    const comp1Slug = 'comp-delay-ikeja-1-' + Date.now();
    const comp1Res = await pool.query(`
      INSERT INTO properties (
        landlord_id, title, slug, description, property_type, address_line1, city, state,
        bedrooms, bathrooms, rent_amount, status, ownership_doc, cover_image, is_deleted
      ) VALUES (
        $1, 'Comparable Villa 1', $2, 'Standard 3 bedroom villa in Ikeja GRA', 'single_house',
        '10 Isaac John St', 'Ikeja GRA', 'Lagos', 3, 3, 3000000.00, 'active_vacant', 'Deed of Assignment',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750', false
      ) RETURNING id
    `, [testLandlordId, comp1Slug]);
    createdTestPropIds.push(comp1Res.rows[0].id);

    const comp2Slug = 'comp-delay-ikeja-2-' + Date.now();
    const comp2Res = await pool.query(`
      INSERT INTO properties (
        landlord_id, title, slug, description, property_type, address_line1, city, state,
        bedrooms, bathrooms, rent_amount, status, ownership_doc, cover_image, is_deleted
      ) VALUES (
        $1, 'Comparable Villa 2', $2, 'Another 3 bedroom villa in Ikeja GRA', 'single_house',
        '14 Joel Ogunnaike St', 'Ikeja GRA', 'Lagos', 3, 3, 3200000.00, 'active_vacant', 'Deed of Assignment',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688', false
      ) RETURNING id
    `, [testLandlordId, comp2Slug]);
    createdTestPropIds.push(comp2Res.rows[0].id);

    // ==================================================================
    // TEST 1: Qualifying Property Submits -> NOT Approved Immediately
    // ==================================================================
    console.log('--- TEST 1: Qualifying Property Deferred Delay ---');
    const validData = {
      title: 'Luxury 3-Bed Duplex in Ikeja GRA ' + Date.now(),
      description: 'Stunning luxury detached 3-bedroom duplex with spacious parking, modern fitted kitchen, and treated water.',
      address_line1: '25 Oba Akinjobi Way',
      city: 'Ikeja GRA',
      state: 'Lagos',
      property_type: 'single_house',
      bedrooms: 3,
      bathrooms: 3,
      rent_amount: 3100000,
      ownership_doc: 'Deed of Assignment (Verified Legal Scan)',
      ownership_doc_url: 'https://example.com/docs/deed-25oba.pdf',
      cover_image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
      ]
    };

    const verification = await PropertyVerificationService.verifyProperty(validData, testLandlordId);
    console.log(`Verification Score: ${verification.score}, Decision: ${verification.decision}`);

    if (verification.decision !== 'AUTO_APPROVE' || verification.score < 90) {
      throw new Error(`Test 1 precondition failed: Expected AUTO_APPROVE but got ${verification.decision} (${verification.score})`);
    }

    const autoApproveAt = new Date(Date.now() + 60000).toISOString();
    const prop1 = await PropertyModel.createProperty({
      ...validData,
      effectiveLandlordId: testLandlordId,
      slug: 'test-delay-prop1-' + Date.now(),
      status: 'pending_review',
      approval_type: 'pending',
      approved_at: null,
      auto_approve_at: autoApproveAt,
      verification_score: verification.score,
      risk_level: verification.riskLevel,
      verification_results: verification.results
    });
    createdTestPropIds.push(prop1.id);
    await PropertyModel.queueForApproval(prop1.id, testLandlordId, 'queued');

    console.log(`Property Created: status=${prop1.status}, approval_type=${prop1.approval_type}, auto_approve_at=${prop1.auto_approve_at}`);

    if (prop1.status === 'pending_review' && prop1.approval_type === 'pending' && prop1.approved_at === null && prop1.auto_approve_at !== null) {
      console.log('[PASS] TEST 1: Property was NOT immediately approved. Correctly queued with 1-minute delay timestamp.\n');
      passedTests++;
    } else {
      console.error('[FAIL] TEST 1: Property was inappropriately approved or missing delay timestamp.');
    }

    // ==================================================================
    // TEST 2: Process Auto-Approval after Delay -> Becomes Live
    // ==================================================================
    console.log('--- TEST 2: Delayed Approval Execution (Safety Checks Pass) ---');
    const approvalResult = await autoApprovalService.processAutoApproval(prop1.id);
    console.log(`ProcessAutoApproval result: success=${approvalResult.success}`);

    const verifiedProp1 = await pool.query('SELECT status, approval_type, approved_at, auto_approve_at FROM properties WHERE id = $1', [prop1.id]);
    const p1Row = verifiedProp1.rows[0];
    console.log(`Updated Property 1: status=${p1Row.status}, approval_type=${p1Row.approval_type}, approved_at=${p1Row.approved_at}, auto_approve_at=${p1Row.auto_approve_at}`);

    if (approvalResult.success && p1Row.status === 'active_vacant' && p1Row.approval_type === 'automatic' && p1Row.approved_at !== null && p1Row.auto_approve_at === null) {
      console.log('[PASS] TEST 2: Property successfully transitioned to active_vacant/automatic after safety checks.\n');
      passedTests++;
    } else {
      console.error('[FAIL] TEST 2: Delayed approval failed to activate property.', p1Row);
    }

    // ==================================================================
    // TEST 3: Landlord Suspended During 1-Minute Window -> Abort Auto-Approval
    // ==================================================================
    console.log('--- TEST 3: Landlord Suspended During 1-Minute Window ---');
    const prop2 = await PropertyModel.createProperty({
      ...validData,
      effectiveLandlordId: testLandlordId,
      slug: 'test-delay-prop2-' + Date.now(),
      status: 'pending_review',
      approval_type: 'pending',
      approved_at: null,
      auto_approve_at: new Date(Date.now() + 60000).toISOString(),
      verification_score: verification.score,
      risk_level: verification.riskLevel,
      verification_results: verification.results
    });
    createdTestPropIds.push(prop2.id);
    await PropertyModel.queueForApproval(prop2.id, testLandlordId, 'queued');

    // Suspend landlord during the waiting window
    await pool.query("UPDATE users SET account_status = 'suspended' WHERE id = $1", [testLandlordId]);

    const suspResult = await autoApprovalService.processAutoApproval(prop2.id);
    console.log(`AutoApproval with Suspended Landlord: success=${suspResult.success}, reason=${suspResult.reason}`);

    const p2Check = await pool.query('SELECT status, approval_type FROM properties WHERE id = $1', [prop2.id]);
    if (!suspResult.success && p2Check.rows[0].status === 'pending_review') {
      console.log('[PASS] TEST 3: Auto-approval safely aborted because landlord was suspended. Property remains in pending_review.\n');
      passedTests++;
    } else {
      console.error('[FAIL] TEST 3: Auto-approval proceeded despite suspended landlord.', p2Check.rows[0]);
    }

    // Restore landlord to active for remaining tests
    await pool.query("UPDATE users SET account_status = 'active' WHERE id = $1", [testLandlordId]);

    // ==================================================================
    // TEST 4: Admin Rejection During 1-Minute Window -> Auto-Approval Aborts
    // ==================================================================
    console.log('--- TEST 4: Admin Rejection During 1-Minute Window ---');
    const prop3 = await PropertyModel.createProperty({
      ...validData,
      effectiveLandlordId: testLandlordId,
      slug: 'test-delay-prop3-' + Date.now(),
      status: 'pending_review',
      approval_type: 'pending',
      approved_at: null,
      auto_approve_at: new Date(Date.now() + 60000).toISOString(),
      verification_score: verification.score,
      risk_level: verification.riskLevel,
      verification_results: verification.results
    });
    createdTestPropIds.push(prop3.id);
    await PropertyModel.queueForApproval(prop3.id, testLandlordId, 'queued');

    // Admin rejects property before 1 minute passes
    await AdminModel.updatePropertyStatus(prop3.id, 'inactive');
    await AdminModel.updateQueueStatus(prop3.id, 'rejected', 'Property documentation unverified');

    const rejectResult = await autoApprovalService.processAutoApproval(prop3.id);
    console.log(`AutoApproval with Admin Rejection: success=${rejectResult.success}, reason=${rejectResult.reason}`);

    const p3Check = await pool.query('SELECT status, approval_type, auto_approve_at FROM properties WHERE id = $1', [prop3.id]);
    if (!rejectResult.success && p3Check.rows[0].status === 'inactive') {
      console.log('[PASS] TEST 4: Admin rejection safely protected. Auto-approval aborted.\n');
      passedTests++;
    } else {
      console.error('[FAIL] TEST 4: Auto-approval overwrote admin rejection.', p3Check.rows[0]);
    }

    // ==================================================================
    // TEST 5: Admin Manual Approval During 1-Minute Window -> Manual Preserved
    // ==================================================================
    console.log('--- TEST 5: Admin Manual Approval During 1-Minute Window ---');
    const prop4 = await PropertyModel.createProperty({
      ...validData,
      effectiveLandlordId: testLandlordId,
      slug: 'test-delay-prop4-' + Date.now(),
      status: 'pending_review',
      approval_type: 'pending',
      approved_at: null,
      auto_approve_at: new Date(Date.now() + 60000).toISOString(),
      verification_score: verification.score,
      risk_level: verification.riskLevel,
      verification_results: verification.results
    });
    createdTestPropIds.push(prop4.id);
    await PropertyModel.queueForApproval(prop4.id, testLandlordId, 'queued');

    // Admin manually approves
    await AdminModel.updatePropertyStatus(prop4.id, 'active_vacant', 'manual');
    await AdminModel.updateQueueStatus(prop4.id, 'approved', 'Manually reviewed and passed');

    const manApproveResult = await autoApprovalService.processAutoApproval(prop4.id);
    console.log(`AutoApproval with Admin Manual Approval: success=${manApproveResult.success}, reason=${manApproveResult.reason}`);

    const p4Check = await pool.query('SELECT status, approval_type FROM properties WHERE id = $1', [prop4.id]);
    if (!manApproveResult.success && p4Check.rows[0].approval_type === 'manual') {
      console.log('[PASS] TEST 5: Admin manual approval preserved with approval_type = manual.\n');
      passedTests++;
    } else {
      console.error('[FAIL] TEST 5: Admin manual approval was corrupted.', p4Check.rows[0]);
    }

    // ==================================================================
    // TEST 6: Non-qualifying Property (Score < 90) -> No Delay, Sent to Admin
    // ==================================================================
    console.log('--- TEST 6: Non-qualifying Property (Score < 90) ---');
    const missingDocsData = {
      ...validData,
      ownership_doc: null,
      ownership_doc_url: null,
      images: []
    };
    const lowVerification = await PropertyVerificationService.verifyProperty(missingDocsData, testLandlordId);
    console.log(`Low Verification Score: ${lowVerification.score}, Decision: ${lowVerification.decision}`);

    const prop5 = await PropertyModel.createProperty({
      ...missingDocsData,
      effectiveLandlordId: testLandlordId,
      slug: 'test-delay-prop5-' + Date.now(),
      status: 'pending_review',
      approval_type: 'pending',
      approved_at: null,
      auto_approve_at: null, // Not scheduled for auto-approval
      verification_score: lowVerification.score,
      risk_level: lowVerification.riskLevel,
      verification_results: lowVerification.results
    });
    createdTestPropIds.push(prop5.id);
    await PropertyModel.queueForApproval(prop5.id, testLandlordId, 'queued');

    if (prop5.status === 'pending_review' && prop5.auto_approve_at === null && (lowVerification.decision === 'ADMIN_REVIEW' || lowVerification.decision === 'MANUAL_REVIEW')) {
      console.log('[PASS] TEST 6: Non-qualifying property routed to Admin Review with auto_approve_at = null.\n');
      passedTests++;
    } else {
      console.error('[FAIL] TEST 6: Non-qualifying property inappropriately queued.', prop5);
    }

    // ==================================================================
    // TEST 7: Background Worker Recovers Past-Due Auto Approvals
    // ==================================================================
    console.log('--- TEST 7: Background Worker Recovers Past-Due Pending Properties ---');
    // Ensure clean landlord history for worker recovery test
    await pool.query("UPDATE properties SET status = 'draft' WHERE id = $1", [prop3.id]);

    const prop6Data = {
      ...validData,
      title: 'Luxury 3-Bed Duplex Worker Test ' + Date.now(),
      address_line1: '99 Oba Akinjobi Way'
    };
    const prop6Verification = await PropertyVerificationService.verifyProperty(prop6Data, testLandlordId);

    // Simulate a property whose 1-minute window elapsed while server was restarting (auto_approve_at <= NOW())
    const pastTimestamp = new Date(Date.now() - 5000).toISOString();
    const prop6 = await PropertyModel.createProperty({
      ...prop6Data,
      effectiveLandlordId: testLandlordId,
      slug: 'test-delay-prop6-' + Date.now(),
      status: 'pending_review',
      approval_type: 'pending',
      approved_at: null,
      auto_approve_at: pastTimestamp,
      verification_score: prop6Verification.score,
      risk_level: prop6Verification.riskLevel,
      verification_results: prop6Verification.results
    });
    createdTestPropIds.push(prop6.id);
    await PropertyModel.queueForApproval(prop6.id, testLandlordId, 'queued');

    // Trigger the background worker's check
    await autoApprovalService.checkPendingAutoApprovals();

    const p6Check = await pool.query('SELECT status, approval_type, approved_at, auto_approve_at FROM properties WHERE id = $1', [prop6.id]);
    console.log(`Worker Recovery Check: status=${p6Check.rows[0].status}, approval_type=${p6Check.rows[0].approval_type}`);

    if (p6Check.rows[0].status === 'active_vacant' && p6Check.rows[0].approval_type === 'automatic' && p6Check.rows[0].auto_approve_at === null) {
      console.log('[PASS] TEST 7: Background worker successfully recovered and auto-approved past-due property.\n');
      passedTests++;
    } else {
      console.error('[FAIL] TEST 7: Worker failed to process past-due property.', p6Check.rows[0]);
    }

  } catch (err) {
    console.error('Fatal error during delay test suite:', err);
  } finally {
    // Cleanup
    console.log('[Cleanup] Cleaning up test properties and users...');
    for (const propId of createdTestPropIds) {
      try {
        await pool.query('DELETE FROM listing_approval_queue WHERE property_id = $1', [propId]);
        await pool.query('DELETE FROM property_amenities WHERE property_id = $1', [propId]);
        await pool.query('DELETE FROM property_units WHERE property_id = $1', [propId]);
        await pool.query('DELETE FROM properties WHERE id = $1', [propId]);
      } catch (e) {}
    }
    for (const userId of createdTestUserIds) {
      try {
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
      } catch (e) {}
    }
    console.log('[Cleanup] Done.\n');
  }

  console.log('=================================================================');
  console.log(` TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('=================================================================');

  if (passedTests === totalTests) {
    console.log('ALL 7 DELAY & SAFETY CHECK TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error(`FAILURE: Only ${passedTests} of ${totalTests} passed.`);
    process.exit(1);
  }
}

runDelayTests();
