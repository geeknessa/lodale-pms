import dotenv from 'dotenv';
dotenv.config();

import { pool } from '../src/db/db.js';
import { PropertyVerificationService } from '../src/services/propertyVerificationService.js';
import { PropertyModel } from '../src/models/propertyModel.js';
import { AdminModel } from '../src/models/adminModel.js';

async function runTests() {
  console.log('=================================================================');
  console.log('   LODALE PMS — AUTOMATIC PROPERTY APPROVAL TEST SUITE (1 - 9)   ');
  console.log('=================================================================\n');

  let passedTests = 0;
  let totalTests = 9;

  // Cleanup helper for test properties
  const createdTestPropIds = [];
  const createdTestUserIds = [];

  try {
    // 0. Ensure baseline landlord and comparable properties exist
    // ------------------------------------------------------------------
    console.log('[Setup] Preparing test environment and baseline comparables...');
    
    // Check or create test active landlord
    let landlordRes = await pool.query("SELECT * FROM users WHERE email = 'test.autoapproval.landlord@example.com' LIMIT 1");
    let testLandlordId;
    if (landlordRes.rows.length === 0) {
      const uRes = await pool.query(`
        INSERT INTO users (first_name, last_name, email, primary_role, account_status)
        VALUES ('Chidi', 'Okeke', 'test.autoapproval.landlord@example.com', 'landlord', 'active')
        RETURNING id
      `);
      testLandlordId = uRes.rows[0].id;
      createdTestUserIds.push(testLandlordId);
    } else {
      testLandlordId = landlordRes.rows[0].id;
      await pool.query("UPDATE users SET account_status = 'active' WHERE id = $1", [testLandlordId]);
    }

    // Check or create suspended test landlord
    let suspLandlordRes = await pool.query("SELECT * FROM users WHERE email = 'test.suspended.landlord@example.com' LIMIT 1");
    let suspendedLandlordId;
    if (suspLandlordRes.rows.length === 0) {
      const uRes = await pool.query(`
        INSERT INTO users (first_name, last_name, email, primary_role, account_status)
        VALUES ('Bad', 'Actor', 'test.suspended.landlord@example.com', 'landlord', 'suspended')
        RETURNING id
      `);
      suspendedLandlordId = uRes.rows[0].id;
      createdTestUserIds.push(suspendedLandlordId);
    } else {
      suspendedLandlordId = suspLandlordRes.rows[0].id;
      await pool.query("UPDATE users SET account_status = 'suspended' WHERE id = $1", [suspendedLandlordId]);
    }

    // Seed 2 comparable live properties in "Ikeja GRA" at ~₦3,000,000 for price baseline
    const comp1Slug = 'comp-prop-ikeja-1-' + Date.now();
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

    const comp2Slug = 'comp-prop-ikeja-2-' + Date.now();
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

    console.log('[Setup] Completed setup successfully.\n');

    // ==================================================================
    // TEST 1: Complete Legitimate Property -> AUTO APPROVED
    // ==================================================================
    console.log('--- TEST 1: Complete legitimate property ---');
    const validPropertyData = {
      title: 'Luxury 3-Bed Duplex in Ikeja GRA',
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

    const t1Verification = await PropertyVerificationService.verifyProperty(validPropertyData, testLandlordId);
    console.log(`Decision: ${t1Verification.decision}, Score: ${t1Verification.score}/100, Risk: ${t1Verification.riskLevel}`);
    
    if (t1Verification.decision === 'AUTO_APPROVE' && t1Verification.score >= 90) {
      // Create via model
      const prop1 = await PropertyModel.createProperty({
        effectiveLandlordId: testLandlordId,
        slug: 'test-1-prop-' + Date.now(),
        ...validPropertyData,
        sanitizedPropertyType: 'single_house',
        status: 'active_vacant',
        verification_score: t1Verification.score,
        approval_type: 'automatic',
        risk_level: t1Verification.riskLevel,
        verification_results: t1Verification.results,
        approved_at: new Date().toISOString()
      });
      createdTestPropIds.push(prop1.id);

      if (prop1.status === 'active_vacant' && prop1.approval_type === 'automatic') {
        console.log('✓ TEST 1 PASSED: Property was automatically approved and is Live.\n');
        passedTests++;
      } else {
        console.error('✗ TEST 1 FAILED: Status or approval_type mismatch in DB.', prop1);
      }
    } else {
      console.error('✗ TEST 1 FAILED: Expected AUTO_APPROVE but got:', t1Verification);
    }

    // ==================================================================
    // TEST 2: Missing Required Information -> ADMIN REVIEW
    // ==================================================================
    console.log('--- TEST 2: Missing required information ---');
    const missingInfoProperty = {
      title: '', // Missing title
      description: 'Too short', // Short description
      address_line1: '', // Missing address
      city: 'Ikeja GRA',
      state: 'Lagos',
      property_type: 'single_house',
      bedrooms: 3,
      bathrooms: 3,
      rent_amount: 3000000,
      ownership_doc: 'Deed of Assignment',
      cover_image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00'
    };

    const t2Verification = await PropertyVerificationService.verifyProperty(missingInfoProperty, testLandlordId);
    console.log(`Decision: ${t2Verification.decision}, Score: ${t2Verification.score}/100, Risk: ${t2Verification.riskLevel}`);
    console.log(`Reasons: ${t2Verification.reviewReasons.join(' | ')}`);

    if (t2Verification.decision === 'ADMIN_REVIEW' && t2Verification.results.required_information.status === 'FAIL') {
      console.log('✓ TEST 2 PASSED: Missing required information correctly routed to Admin Review.\n');
      passedTests++;
    } else {
      console.error('✗ TEST 2 FAILED: Expected ADMIN_REVIEW but got:', t2Verification);
    }

    // ==================================================================
    // TEST 3: Suspended / Blocked Landlord -> ADMIN REVIEW
    // ==================================================================
    console.log('--- TEST 3: Suspended or blocked landlord ---');
    const t3Verification = await PropertyVerificationService.verifyProperty(validPropertyData, suspendedLandlordId);
    console.log(`Decision: ${t3Verification.decision}, Score: ${t3Verification.score}/100, Risk: ${t3Verification.riskLevel}`);
    console.log(`Reasons: ${t3Verification.reviewReasons.join(' | ')}`);

    if (t3Verification.decision === 'ADMIN_REVIEW' && t3Verification.results.landlord_account.status === 'FAIL') {
      console.log('✓ TEST 3 PASSED: Suspended landlord submission correctly blocked and routed to Admin Review.\n');
      passedTests++;
    } else {
      console.error('✗ TEST 3 FAILED: Expected ADMIN_REVIEW for suspended landlord but got:', t3Verification);
    }

    // ==================================================================
    // TEST 4: Likely Duplicate Property -> ADMIN REVIEW
    // ==================================================================
    console.log('--- TEST 4: Likely duplicate property ---');
    // Using exact address and title from Test 1 property
    const duplicatePropertyData = {
      ...validPropertyData,
      title: 'Luxury 3-Bed Duplex in Ikeja GRA',
      address_line1: '25 Oba Akinjobi Way'
    };

    const t4Verification = await PropertyVerificationService.verifyProperty(duplicatePropertyData, testLandlordId);
    console.log(`Decision: ${t4Verification.decision}, Score: ${t4Verification.score}/100, Risk: ${t4Verification.riskLevel}`);
    console.log(`Reasons: ${t4Verification.reviewReasons.join(' | ')}`);

    if (t4Verification.decision === 'ADMIN_REVIEW' && t4Verification.results.duplicate_detection.status === 'DUPLICATE_DETECTED') {
      console.log('✓ TEST 4 PASSED: Duplicate property detection flagged anomaly and routed to Admin Review.\n');
      passedTests++;
    } else {
      console.error('✗ TEST 4 FAILED: Expected duplicate detection ADMIN_REVIEW but got:', t4Verification);
    }

    // ==================================================================
    // TEST 5: Suspicious Price with Sufficient Comparison Data -> ADMIN REVIEW
    // ==================================================================
    console.log('--- TEST 5: Suspicious price with sufficient comparison data ---');
    // Average price in Ikeja GRA is ~₦3,100,000. Submitting ₦50,000,000 (16x market average)
    const anomalyPriceProperty = {
      ...validPropertyData,
      title: 'Extremely Overpriced House',
      address_line1: '99 NonExistent Way',
      rent_amount: 50000000
    };

    const t5Verification = await PropertyVerificationService.verifyProperty(anomalyPriceProperty, testLandlordId);
    console.log(`Decision: ${t5Verification.decision}, Score: ${t5Verification.score}/100, Risk: ${t5Verification.riskLevel}`);
    console.log(`Reasons: ${t5Verification.reviewReasons.join(' | ')}`);

    if (t5Verification.decision === 'ADMIN_REVIEW' && t5Verification.results.price_analysis.status === 'ANOMALY_DETECTED') {
      console.log('✓ TEST 5 PASSED: Price anomaly detected with sufficient comparables; routed to Admin Review.\n');
      passedTests++;
    } else {
      console.error('✗ TEST 5 FAILED: Expected ANOMALY_DETECTED but got:', t5Verification);
    }

    // ==================================================================
    // TEST 6: Insufficient Price Comparison Data -> ADMIN REVIEW
    // ==================================================================
    console.log('--- TEST 6: Insufficient price comparison data ---');
    // Submitting property in an area with 0 existing comparable live properties
    const noComparablesProperty = {
      ...validPropertyData,
      title: 'Cottage in Remote Unique Area',
      address_line1: '1 Remote Mountain Rd',
      city: 'Obudu-Highlands-998877',
      state: 'Cross River',
      rent_amount: 2500000
    };

    const t6Verification = await PropertyVerificationService.verifyProperty(noComparablesProperty, testLandlordId);
    console.log(`Decision: ${t6Verification.decision}, Score: ${t6Verification.score}/100, Risk: ${t6Verification.riskLevel}`);
    console.log(`Reasons: ${t6Verification.reviewReasons.join(' | ')}`);

    if (t6Verification.decision === 'ADMIN_REVIEW' && t6Verification.results.price_analysis.status === 'INSUFFICIENT_DATA') {
      console.log('✓ TEST 6 PASSED: Insufficient price comparison data correctly identified; routed to Admin Review.\n');
      passedTests++;
    } else {
      console.error('✗ TEST 6 FAILED: Expected INSUFFICIENT_DATA but got:', t6Verification);
    }

    // ==================================================================
    // TEST 7: Technical Verification Failure -> ADMIN REVIEW
    // ==================================================================
    console.log('--- TEST 7: Technical verification failure ---');
    // Calling verifyProperty with unexpected parameter that triggers safe fallback
    const brokenData = null; // Will trigger error in checks
    const t7Verification = await PropertyVerificationService.verifyProperty(brokenData, testLandlordId);
    console.log(`Decision: ${t7Verification.decision}, Score: ${t7Verification.score}/100, Risk: ${t7Verification.riskLevel}`);
    console.log(`Reasons: ${t7Verification.reviewReasons.join(' | ')}`);

    if (t7Verification.decision === 'ADMIN_REVIEW' && t7Verification.riskLevel === 'high') {
      console.log('✓ TEST 7 PASSED: Technical verification error safely failed closed to Admin Review.\n');
      passedTests++;
    } else {
      console.error('✗ TEST 7 FAILED: Expected safe ADMIN_REVIEW fallback but got:', t7Verification);
    }

    // ==================================================================
    // TEST 8: Property Manually Approved by Admin -> MANUAL APPROVAL -> LIVE
    // ==================================================================
    console.log('--- TEST 8: Property manually approved by admin ---');
    // Create a property initially pending review
    const pendingSlug = 'pending-for-manual-app-' + Date.now();
    const pendPropRes = await pool.query(`
      INSERT INTO properties (
        landlord_id, title, slug, description, property_type, address_line1, city, state,
        bedrooms, bathrooms, rent_amount, status, approval_type, is_deleted
      ) VALUES (
        $1, 'Manual Approval Target', $2, 'Pending review listing awaiting admin', 'single_house',
        '55 Review St', 'Ikeja GRA', 'Lagos', 2, 2, 2800000.00, 'pending_review', 'pending', false
      ) RETURNING id
    `, [testLandlordId, pendingSlug]);
    const pendingPropId = pendPropRes.rows[0].id;
    createdTestPropIds.push(pendingPropId);

    // Admin executes manual approval
    const approvedProp = await AdminModel.updatePropertyStatus(pendingPropId, 'active_vacant', 'manual');
    await AdminModel.updateQueueStatus(pendingPropId, 'approved', null);

    console.log(`Manual Approval Result: Status=${approvedProp.status}, ApprovalType=${approvedProp.approval_type}, ApprovedAt=${approvedProp.approved_at}`);

    if (approvedProp.status === 'active_vacant' && approvedProp.approval_type === 'manual' && approvedProp.approved_at) {
      console.log('✓ TEST 8 PASSED: Admin manual approval correctly set status to active_vacant and approval_type to manual.\n');
      passedTests++;
    } else {
      console.error('✗ TEST 8 FAILED: Status or approval_type mismatch after manual approval.', approvedProp);
    }

    // ==================================================================
    // TEST 9: Property Manually Rejected -> REJECTED
    // ==================================================================
    console.log('--- TEST 9: Property manually rejected ---');
    // Admin executes rejection
    const rejectedProp = await AdminModel.updatePropertyStatus(pendingPropId, 'inactive');
    await AdminModel.updateQueueStatus(pendingPropId, 'rejected', 'Failed inspection requirement');

    console.log(`Manual Rejection Result: Status=${rejectedProp.status}`);

    const queueCheck = await pool.query('SELECT queue_status, rejection_reason FROM listing_approval_queue WHERE property_id = $1 ORDER BY submitted_at DESC LIMIT 1', [pendingPropId]);
    const qRow = queueCheck.rows[0] || {};
    console.log(`Queue Status: ${qRow.queue_status}, RejectionReason: ${qRow.rejection_reason}`);

    if (rejectedProp.status === 'inactive' && qRow.queue_status === 'rejected') {
      console.log('✓ TEST 9 PASSED: Admin manual rejection correctly set status to inactive and queue status to rejected.\n');
      passedTests++;
    } else {
      console.error('✗ TEST 9 FAILED: Rejection state mismatch.', rejectedProp, qRow);
    }

  } catch (err) {
    console.error('Fatal error during test suite execution:', err);
  } finally {
    // Cleanup test artifacts from DB
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
  console.log(`   TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED   `);
  console.log('=================================================================');

  if (passedTests === totalTests) {
    console.log('ALL 9 TESTS PASSED SUCCESSFULLY! Automated Property Approval is fully verified.');
    process.exit(0);
  } else {
    console.error(`FAILURE: Only ${passedTests} of ${totalTests} tests passed.`);
    process.exit(1);
  }
}

runTests();
