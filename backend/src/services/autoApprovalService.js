import { pool } from '../db/db.js';
import { PropertyVerificationService } from './propertyVerificationService.js';

class AutoApprovalService {
  constructor() {
    this.timers = new Map();
    this.workerInterval = null;
    this.isWorkerRunning = false;
  }

  /**
   * Schedules a delayed auto-approval check for a property.
   * @param {string} propertyId 
   * @param {number} delayMs Defaults to 60,000ms (1 minute)
   */
  schedulePropertyAutoApproval(propertyId, delayMs = 60000) {
    if (!propertyId) return;

    // Clear any existing timer for this property
    if (this.timers.has(propertyId)) {
      clearTimeout(this.timers.get(propertyId));
      this.timers.delete(propertyId);
    }

    const timer = setTimeout(async () => {
      this.timers.delete(propertyId);
      try {
        await this.processAutoApproval(propertyId);
      } catch (err) {
        console.error(`[AutoApprovalService] Error executing delayed approval for property ${propertyId}:`, err);
      }
    }, delayMs);

    this.timers.set(propertyId, timer);
    console.log(`[AutoApprovalService] Scheduled auto-approval for property ${propertyId} in ${delayMs / 1000}s`);
  }

  /**
   * Cancels any scheduled in-memory auto-approval timer for a property.
   * @param {string} propertyId 
   */
  cancelScheduledAutoApproval(propertyId) {
    if (this.timers.has(propertyId)) {
      clearTimeout(this.timers.get(propertyId));
      this.timers.delete(propertyId);
    }
  }

  /**
   * Performs the 6 required safety checks and approves the property if all pass.
   * @param {string} propertyId 
   * @returns {Promise<{ success: boolean, reason?: string, property?: object }>}
   */
  async processAutoApproval(propertyId) {
    try {
      // Safety Check 1: Property still exists and is not deleted
      const propRes = await pool.query(
        'SELECT * FROM properties WHERE id::text = $1',
        [propertyId]
      );
      if (propRes.rowCount === 0) {
        return { success: false, reason: 'Property not found' };
      }
      const property = propRes.rows[0];

      if (property.is_deleted) {
        await pool.query('UPDATE properties SET auto_approve_at = NULL WHERE id = $1', [property.id]);
        return { success: false, reason: 'Property has been deleted' };
      }

      // Safety Check 2 & 3: Property has not been rejected, approved, or manually reviewed by Admin
      if (property.status !== 'pending_review') {
        // Property was already reviewed/acted upon or state changed
        await pool.query('UPDATE properties SET auto_approve_at = NULL WHERE id = $1', [property.id]);
        return { success: false, reason: `Property status is '${property.status}', not pending_review` };
      }

      const queueRes = await pool.query(
        'SELECT queue_status, reviewed_at FROM listing_approval_queue WHERE property_id = $1 ORDER BY submitted_at DESC LIMIT 1',
        [property.id]
      );
      if (queueRes.rowCount > 0) {
        const queueEntry = queueRes.rows[0];
        if (queueEntry.queue_status === 'rejected' || queueEntry.queue_status === 'approved' || queueEntry.reviewed_at) {
          await pool.query('UPDATE properties SET auto_approve_at = NULL WHERE id = $1', [property.id]);
          return { success: false, reason: `Property was manually reviewed by Admin (queue_status: ${queueEntry.queue_status})` };
        }
      }

      // Safety Check 4: Landlord account is still active and not suspended or deleted
      const landlordRes = await pool.query(
        'SELECT id, account_status, deleted_at FROM users WHERE id = $1',
        [property.landlord_id]
      );
      if (landlordRes.rowCount === 0) {
        await pool.query('UPDATE properties SET auto_approve_at = NULL WHERE id = $1', [property.id]);
        return { success: false, reason: 'Landlord account does not exist' };
      }
      const landlord = landlordRes.rows[0];
      if (landlord.account_status !== 'active' || landlord.deleted_at) {
        // Landlord is suspended or deleted: do not auto-approve, route to Admin Review
        await pool.query('UPDATE properties SET auto_approve_at = NULL WHERE id = $1', [property.id]);
        console.warn(`[AutoApprovalService] Aborted auto-approval: Landlord ${property.landlord_id} is ${landlord.account_status}`);
        return { success: false, reason: `Landlord account is ${landlord.account_status}` };
      }

      // Safety Checks 5 & 6: Re-verify verification requirements and confirm no critical failures
      // Fetch current blocks and units for full verification context
      const blocksRes = await pool.query('SELECT * FROM property_blocks WHERE property_id = $1', [property.id]);
      const unitsRes = await pool.query('SELECT * FROM property_units WHERE property_id = $1', [property.id]);

      const verificationPayload = {
        ...property,
        blocks: blocksRes.rows,
        units: unitsRes.rows
      };

      const verification = await PropertyVerificationService.verifyProperty(verificationPayload, property.landlord_id);

      if (verification.decision !== 'AUTO_APPROVE' || verification.score < 90) {
        // No longer qualifies: route to Admin Review
        await pool.query(
          `UPDATE properties 
           SET auto_approve_at = NULL, 
               verification_score = $2, 
               risk_level = $3, 
               verification_results = $4 
           WHERE id = $1`,
          [property.id, verification.score, verification.riskLevel, JSON.stringify(verification.results)]
        );
        console.warn(`[AutoApprovalService] Property ${property.id} no longer qualifies for auto-approval (score: ${verification.score}, decision: ${verification.decision}). Reasons:`, verification.reviewReasons);
        return { success: false, reason: 'Property no longer satisfies auto-approval requirements' };
      }

      // ALL 6 SAFETY CHECKS PASSED: Transition property to Live ('active_vacant')
      const updateRes = await pool.query(`
        UPDATE properties
        SET status = 'active_vacant',
            approval_type = 'automatic',
            approved_at = NOW(),
            auto_approve_at = NULL,
            risk_level = $2,
            verification_score = $3,
            verification_results = $4,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [property.id, verification.riskLevel, verification.score, JSON.stringify(verification.results)]);

      const updatedProperty = updateRes.rows[0];

      // Update listing approval queue record
      await pool.query(`
        UPDATE listing_approval_queue
        SET queue_status = 'approved',
            reviewed_at = NOW()
        WHERE property_id = $1
      `, [property.id]);

      console.log(`[AutoApprovalService] Property "${updatedProperty.title}" (${updatedProperty.id}) automatically approved after 1-minute delay.`);
      return { success: true, property: updatedProperty };

    } catch (err) {
      console.error(`[AutoApprovalService] Error in processAutoApproval for ${propertyId}:`, err);
      return { success: false, reason: err.message };
    }
  }

  /**
   * Scans database for any properties whose 1-minute waiting period has elapsed.
   * Handles server restarts and past-due approvals reliably.
   */
  async checkPendingAutoApprovals() {
    if (this.isWorkerRunning) return;
    this.isWorkerRunning = true;

    try {
      const res = await pool.query(`
        SELECT id, title, auto_approve_at
        FROM properties
        WHERE status = 'pending_review'
          AND (
            (auto_approve_at IS NOT NULL AND auto_approve_at <= NOW())
            OR
            (auto_approve_at IS NULL AND verification_score >= 90 AND created_at <= NOW() - INTERVAL '1 minute')
          )
        ORDER BY created_at ASC
        LIMIT 25
      `);

      for (const row of res.rows) {
        await this.processAutoApproval(row.id);
      }
    } catch (err) {
      console.error('[AutoApprovalService] Error checking pending auto approvals:', err.message);
    } finally {
      this.isWorkerRunning = false;
    }
  }

  /**
   * Starts the periodic background recovery worker.
   * @param {number} intervalMs Defaults to 10,000ms (10 seconds)
   */
  startAutoApprovalWorker(intervalMs = 10000) {
    if (this.workerInterval) return;

    // Run once on startup
    this.checkPendingAutoApprovals();

    this.workerInterval = setInterval(() => {
      this.checkPendingAutoApprovals();
    }, intervalMs);

    console.log(`[AutoApprovalService] Auto-approval background worker started (checking every ${intervalMs / 1000}s).`);
  }

  /**
   * Stops the background worker (useful for testing and graceful shutdown).
   */
  stopAutoApprovalWorker() {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}

export const autoApprovalService = new AutoApprovalService();
export default autoApprovalService;
