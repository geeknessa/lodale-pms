// Service for persisting reminder configuration, calculating upcoming due dates & inspections, and dispatching reminders
import { apiClient } from '../lib/apiClient';
import { inspectionService } from "./inspectionService";
import { chatService } from "./chatService";

const STORAGE_KEY_SETTINGS = "landlord_reminder_settings";
const STORAGE_KEY_LOGS = "landlord_reminder_dispatches";

export const reminderService = {
  /**
   * Get current landlord reminder settings (Kept in local storage as client preferences)
   */
  getSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Error reading reminder settings:", e);
    }
    // Default fallback configuration
    return {
      autoRentRemindersEnabled: true,
      rentLeadDays: [7, 3, 1, 0], // Days before due date to fire reminder (0 = on due date)
      rentCustomMessage: "Hello! This is a polite reminder that your rent payment for {property} is due on {dueDate}. Please ensure timely settlement.",
      autoInspectionRemindersEnabled: true,
      inspectionLeadDays: [3, 1], // Days before inspection date
      inspectionCustomMessage: "Hi! This is a reminder regarding your scheduled property inspection for {property} on {inspectionDate} at {inspectionTime}.",
      
      // Auto-Nudge Lease Renewal Settings
      autoNudgeEnabled: true,
      autoNudgeDays: 60,
      autoNudgeRentIncreaseProposed: 0,
      autoNudgeRentIncreaseType: "fixed", // "fixed" or "percentage"
      
      // Smart Autopay & Penalty Automations
      gracePeriodDays: 3,
      lateFeeAmount: 0,
      lateFeeType: "fixed", // "fixed" or "percentage"
      
      // Move-out Checklists
      moveOutChecklistDays: 14,

      // Loyalty Rewards
      loyaltyRewardsEnabled: false,
    };
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error("Error saving reminder settings:", e);
      return false;
    }
  },

  getDispatchLog() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  recordDispatch(dispatchId) {
    try {
      const log = this.getDispatchLog();
      if (!log.includes(dispatchId)) {
        log.push(dispatchId);
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(log));
      }
    } catch (e) {
      console.error("Error recording dispatch log:", e);
    }
  },

  /**
   * Fetch logs of dispatched reminders (via backend API)
   */
  async getLogs() {
    try {
      const data = await apiClient('/notifications');
      if (data && Array.isArray(data.notifications)) {
        return data.notifications.map(n => ({
          id: n.id,
          recipientName: n.title,
          type: n.type === 'inspection_reminder_dispatched' ? 'Inspection Alert' : 'Rent Reminder',
          message: n.message,
          timestamp: new Date(n.created_at).toLocaleString()
        }));
      }
      return [];
    } catch (e) {
      console.warn("Failed to fetch notification logs:", e);
      return [];
    }
  },

  /**
   * Dispatch a rent due date reminder for a specific tenant
   */
  async dispatchRentReminder(tenant, leadDaysText, isManual = false) {
    if (!tenant) return false;
    const settings = this.getSettings();

    const tenantName = tenant.name || tenant.tenantName || "Tenant";
    const propertyTitle = tenant.propertyTitle || tenant.leaseStatus || "Leased Property";
    const amount = tenant.rentAmount || tenant.amount || tenant.rent || "Rent";
    const formattedAmount = typeof amount === "number" ? `₦${amount.toLocaleString()}` : String(amount);
    const dueDateStr = tenant.dueDate || "1st of next month";

    const title = isManual ? `Rent Payment Reminder (${tenantName})` : `Automated Rent Reminder (${leadDaysText})`;
    const message = (settings.rentCustomMessage || "Hello! This is a polite reminder that your rent payment for {property} is due on {dueDate}.")
      .replace("{property}", propertyTitle)
      .replace("{dueDate}", dueDateStr)
      .replace("{amount}", formattedAmount);

    const tenantId = tenant.tenant_id || tenant.id;
    const currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId");

    // 1. Deliver to Tenant Notifications via Backend
    if (tenantId) {
      try {
        await apiClient('/notifications', {
          method: 'POST',
          body: {
            userId: tenantId,
            title: `Payment Reminder: ${propertyTitle}`,
            message: message,
            type: "rent_reminder"
          }
        });
      } catch (e) {
        console.warn("Failed to dispatch tenant notification via API");
      }

      // 2. Deliver to Tenant Chat via Backend
      try {
        await chatService.sendMessage(tenantId, `🔔 REMINDER: ${message}`);
      } catch (e) {
        console.warn("Failed to dispatch chat reminder via API");
      }
    }

    // 3. Log into Landlord Notifications via Backend
    if (currentUserId) {
      try {
        await apiClient('/notifications', {
          method: 'POST',
          body: {
            userId: currentUserId,
            title: title,
            message: `Sent reminder to ${tenantName} for ${propertyTitle} (Due: ${dueDateStr}).`,
            type: "reminder_dispatched"
          }
        });
      } catch (e) {
        console.warn("Failed to log landlord notification via API");
      }
    }

    return true;
  },

  /**
   * Dispatch an inspection reminder for a scheduled inspection
   */
  async dispatchInspectionReminder(inspection, leadDaysText, isManual = false) {
    if (!inspection) return false;
    const settings = this.getSettings();

    const tenantName = inspection.tenantName || "Tenant";
    const propertyTitle = inspection.propertyTitle || "Property";
    const dateStr = inspection.date || "Scheduled Date";
    const timeStr = inspection.time || "10:00 AM";

    const title = isManual ? `Inspection Reminder (${tenantName})` : `Automated Inspection Reminder (${leadDaysText})`;
    const message = (settings.inspectionCustomMessage || "Hi! This is a reminder regarding your scheduled property inspection for {property} on {inspectionDate} at {inspectionTime}.")
      .replace("{property}", propertyTitle)
      .replace("{inspectionDate}", dateStr)
      .replace("{inspectionTime}", timeStr);

    const tenantId = inspection.tenant_id || inspection.id;
    const currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId");

    // 1. Deliver to Tenant Notifications via Backend
    if (tenantId) {
      try {
        await apiClient('/notifications', {
          method: 'POST',
          body: {
            userId: tenantId,
            title: `Upcoming Inspection: ${propertyTitle}`,
            message: message,
            type: "inspection_reminder"
          }
        });
      } catch (e) {
        console.warn("Failed to dispatch tenant inspection notification via API");
      }

      // 2. Deliver to Tenant Chat via Backend
      try {
        await chatService.sendMessage(tenantId, `📅 INSPECTION REMINDER: ${message}`);
      } catch (e) {
        console.warn("Failed to dispatch chat inspection reminder via API");
      }
    }

    // 3. Log into Landlord Notifications via Backend
    if (currentUserId) {
      try {
        await apiClient('/notifications', {
          method: 'POST',
          body: {
            userId: currentUserId,
            title: title,
            message: `Sent inspection reminder to ${tenantName} for ${propertyTitle} on ${dateStr} at ${timeStr}.`,
            type: "inspection_reminder_dispatched"
          }
        });
      } catch (e) {
        console.warn("Failed to log landlord inspection notification via API");
      }
    }

    return true;
  },

  /**
   * Perform background evaluation and dispatch automated reminders
   */
  async checkAndDispatchReminders(activeTenants = [], inspections = []) {
    const settings = this.getSettings();
    if (!settings.autoRentRemindersEnabled && !settings.autoInspectionRemindersEnabled) {
      return { dispatchedCount: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISOStr = today.toISOString().split('T')[0];
    const dispatchLog = this.getDispatchLog();
    let dispatchedCount = 0;

    // --- EVALUATE RENT DUE REMINDERS ---
    if (settings.autoRentRemindersEnabled && Array.isArray(activeTenants)) {
      for (const tenant of activeTenants) {
        if (!tenant) continue;

        let dueDateObj = null;
        if (tenant.start_date || tenant.startDate) {
          const startDate = new Date(tenant.start_date || tenant.startDate);
          dueDateObj = new Date(today.getFullYear(), today.getMonth(), startDate.getDate());
          if (dueDateObj < today) {
            dueDateObj.setMonth(dueDateObj.getMonth() + 1);
          }
        } else {
          dueDateObj = new Date(today.getFullYear(), today.getMonth(), 15);
          if (dueDateObj < today) {
            dueDateObj.setMonth(dueDateObj.getMonth() + 1);
          }
        }

        const diffTime = dueDateObj.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        for (const leadDay of settings.rentLeadDays) {
          if (diffDays === leadDay) {
            const tenantId = tenant.id || tenant.name || "tenant";
            const dispatchId = `rent_${tenantId}_day_${leadDay}_${todayISOStr}`;

            if (!dispatchLog.includes(dispatchId)) {
              const leadText = leadDay === 0 ? "Due Today" : `${leadDay} day${leadDay > 1 ? 's' : ''} before due date`;
              const success = await this.dispatchRentReminder(tenant, leadText, false);
              if (success) {
                this.recordDispatch(dispatchId);
                dispatchedCount++;
              }
            }
          }
        }
      }
    }

    // --- EVALUATE INSPECTION REMINDERS ---
    if (settings.autoInspectionRemindersEnabled) {
      const allInspections = Array.isArray(inspections) && inspections.length > 0
        ? inspections
        : (typeof inspectionService.getAllInspections === 'function' ? await inspectionService.getAllInspections() : []);

      for (const insp of allInspections) {
        if (!insp || !insp.date || insp.status === "Cancelled") continue;

        const inspDateObj = new Date(insp.date);
        inspDateObj.setHours(0, 0, 0, 0);

        const diffTime = inspDateObj.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        for (const leadDay of settings.inspectionLeadDays) {
          if (diffDays === leadDay) {
            const inspId = insp.appId || insp.id || "inspection";
            const dispatchId = `insp_${inspId}_day_${leadDay}_${todayISOStr}`;

            if (!dispatchLog.includes(dispatchId)) {
              const leadText = leadDay === 0 ? "Today" : `${leadDay} day${leadDay > 1 ? 's' : ''} before inspection`;
              const success = await this.dispatchInspectionReminder(insp, leadText, false);
              if (success) {
                this.recordDispatch(dispatchId);
                dispatchedCount++;
              }
            }
          }
        }
      }
    }

    return { dispatchedCount };
  },

  /**
   * Process and evaluate Renewal Nudges for active tenants
   */
  async checkAndDispatchRenewalNudges(activeTenants = []) {
    const settings = this.getSettings();
    if (!settings.autoNudgeEnabled || !Array.isArray(activeTenants)) return { dispatchedCount: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISOStr = today.toISOString().split('T')[0];
    const dispatchLog = this.getDispatchLog();
    let dispatchedCount = 0;

    for (const tenant of activeTenants) {
      if (!tenant || !tenant.end_date && !tenant.endDate) continue;

      const endDate = new Date(tenant.end_date || tenant.endDate);
      endDate.setHours(0, 0, 0, 0);

      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === settings.autoNudgeDays) {
        const tenantId = tenant.id || tenant.tenant_id;
        const dispatchId = `nudge_${tenantId}_day_${settings.autoNudgeDays}_${todayISOStr}`;

        if (!dispatchLog.includes(dispatchId)) {
          // Calculate proposed increase if any
          let proposedRent = tenant.rentAmount || tenant.amount || 0;
          if (settings.autoNudgeRentIncreaseProposed > 0) {
            if (settings.autoNudgeRentIncreaseType === "percentage") {
              proposedRent = proposedRent * (1 + (settings.autoNudgeRentIncreaseProposed / 100));
            } else {
              proposedRent = proposedRent + settings.autoNudgeRentIncreaseProposed;
            }
          }

          const message = `Your lease ends on ${endDate.toLocaleDateString()}. Your landlord has offered a renewal at ₦${proposedRent.toLocaleString()}. Do you plan to stay?`;

          try {
            await apiClient('/notifications', {
              method: 'POST',
              body: {
                userId: tenantId,
                title: `Lease Expiring Soon`,
                message: message,
                type: "renewal_intent"
              }
            });
            await chatService.sendMessage(tenantId, `🔄 ${message}`);
            this.recordDispatch(dispatchId);
            dispatchedCount++;
          } catch (e) {
            console.warn("Failed to dispatch renewal nudge", e);
          }
        }
      }
    }
    return { dispatchedCount };
  },

  /**
   * Process Late Fees for unpaid rent invoices
   * This is a conceptual implementation interacting with rentService logic
   */
  async processLateFees(unpaidInvoices = []) {
    const settings = this.getSettings();
    if (!settings.lateFeeAmount || settings.lateFeeAmount <= 0) return { feesAssessed: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let feesAssessed = 0;
    const dispatchLog = this.getDispatchLog();

    for (const invoice of unpaidInvoices) {
      if (invoice.status === "Paid") continue;

      const dueDate = new Date(invoice.dueDate || invoice.created_at);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // If past grace period
      if (diffDays > settings.gracePeriodDays) {
        const feeDispatchId = `late_fee_${invoice.id}_${today.toISOString().split('T')[0]}`;
        
        if (!dispatchLog.includes(feeDispatchId)) {
          try {
            // Generate late fee via rent service API
            let feeAmount = settings.lateFeeAmount;
            if (settings.lateFeeType === "percentage") {
              feeAmount = (invoice.amount || 0) * (settings.lateFeeAmount / 100);
            }
            
            await apiClient('/rent/invoice', {
              method: 'POST',
              body: {
                tenantId: invoice.tenant_id,
                propertyId: invoice.property_id,
                amount: feeAmount,
                description: `Late fee for invoice ${invoice.id} (Past ${settings.gracePeriodDays} day grace period)`
              }
            });

            this.recordDispatch(feeDispatchId);
            feesAssessed++;
          } catch (e) {
            console.warn("Failed to generate late fee invoice", e);
          }
        }
      }
    }
    return { feesAssessed };
  }
};
