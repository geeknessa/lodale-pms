// Service for persisting reminder configuration, calculating upcoming due dates & inspections, and dispatching reminders
import { inspectionService } from "./inspectionService";

const STORAGE_KEY_SETTINGS = "landlord_reminder_settings";
const STORAGE_KEY_LOGS = "landlord_reminder_dispatches";

export const reminderService = {
  /**
   * Get current landlord reminder settings
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
      inspectionCustomMessage: "Hi! This is a reminder regarding your scheduled property inspection for {property} on {inspectionDate} at {inspectionTime}."
    };
  },

  /**
   * Save landlord reminder settings
   */
  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error("Error saving reminder settings:", e);
      return false;
    }
  },

  /**
   * Get log of dispatched reminders to prevent duplicates
   */
  getDispatchLog() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Get formatted audit trail logs of dispatched reminders for display
   */
  getLogs() {
    try {
      const landlordNotifs = JSON.parse(localStorage.getItem("landlordNotifications") || "[]");
      return landlordNotifs
        .filter(n => n.type === 'reminder_dispatched' || n.type === 'inspection_reminder_dispatched')
        .map(n => ({
          id: n.id,
          recipientName: n.title,
          type: n.type === 'inspection_reminder_dispatched' ? 'Inspection Alert' : 'Rent Reminder',
          message: n.message,
          timestamp: n.time || "Recent"
        }));
    } catch (e) {
      return [];
    }
  },

  /**
   * Record a dispatch event
   */
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
   * Dispatch a rent due date reminder for a specific tenant
   */
  dispatchRentReminder(tenant, leadDaysText, isManual = false) {
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

    const now = new Date().toISOString();

    // 1. Deliver to Tenant Notifications
    try {
      const tenantNotifs = JSON.parse(localStorage.getItem("tenantNotifications") || "[]");
      tenantNotifs.unshift({
        id: `rent_rem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: `Payment Reminder: ${propertyTitle}`,
        message: message,
        time: "Just now",
        createdAt: now,
        read: false,
        type: "rent_reminder",
        amount: formattedAmount,
        dueDate: dueDateStr
      });
      localStorage.setItem("tenantNotifications", JSON.stringify(tenantNotifs));
    } catch (e) {
      console.error("Failed to post tenant notification:", e);
    }

    // 2. Deliver to Tenant Chat
    try {
      const allChatMessages = JSON.parse(localStorage.getItem("chat_messages") || "[]");
      allChatMessages.push({
        id: `chat_rem_${Date.now()}`,
        app_id: tenant.applicationId || tenant.appId || tenant.id,
        sender_role: "landlord",
        sender_name: "Automated Reminder",
        message: `🔔 REMINDER: ${message}`,
        created_at: now
      });
      localStorage.setItem("chat_messages", JSON.stringify(allChatMessages));
    } catch (e) {
      console.error("Failed to post reminder chat message:", e);
    }

    // 3. Log into Landlord Notifications
    try {
      const landlordNotifs = JSON.parse(localStorage.getItem("landlordNotifications") || "[]");
      landlordNotifs.unshift({
        id: `landlord_rem_${Date.now()}`,
        title: title,
        message: `Sent reminder to ${tenantName} for ${propertyTitle} (Due: ${dueDateStr}).`,
        time: "Just now",
        createdAt: now,
        read: false,
        type: "reminder_dispatched"
      });
      localStorage.setItem("landlordNotifications", JSON.stringify(landlordNotifs));
    } catch (e) {
      console.error("Failed to post landlord confirmation:", e);
    }

    return true;
  },

  /**
   * Dispatch an inspection reminder for a scheduled inspection
   */
  dispatchInspectionReminder(inspection, leadDaysText, isManual = false) {
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

    const now = new Date().toISOString();

    // 1. Deliver to Tenant Notifications
    try {
      const tenantNotifs = JSON.parse(localStorage.getItem("tenantNotifications") || "[]");
      tenantNotifs.unshift({
        id: `insp_rem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: `Upcoming Inspection: ${propertyTitle}`,
        message: message,
        time: "Just now",
        createdAt: now,
        read: false,
        type: "inspection_reminder",
        inspectionDate: dateStr,
        inspectionTime: timeStr
      });
      localStorage.setItem("tenantNotifications", JSON.stringify(tenantNotifs));
    } catch (e) {
      console.error("Failed to post tenant inspection notification:", e);
    }

    // 2. Deliver to Tenant Chat
    try {
      const allChatMessages = JSON.parse(localStorage.getItem("chat_messages") || "[]");
      allChatMessages.push({
        id: `chat_insp_rem_${Date.now()}`,
        app_id: inspection.appId || inspection.id,
        sender_role: "landlord",
        sender_name: "Automated Reminder",
        message: `📅 INSPECTION REMINDER: ${message}`,
        created_at: now
      });
      localStorage.setItem("chat_messages", JSON.stringify(allChatMessages));
    } catch (e) {
      console.error("Failed to post inspection chat message:", e);
    }

    // 3. Log into Landlord Notifications
    try {
      const landlordNotifs = JSON.parse(localStorage.getItem("landlordNotifications") || "[]");
      landlordNotifs.unshift({
        id: `landlord_insp_rem_${Date.now()}`,
        title: title,
        message: `Sent inspection reminder to ${tenantName} for ${propertyTitle} on ${dateStr} at ${timeStr}.`,
        time: "Just now",
        createdAt: now,
        read: false,
        type: "inspection_reminder_dispatched"
      });
      localStorage.setItem("landlordNotifications", JSON.stringify(landlordNotifs));
    } catch (e) {
      console.error("Failed to log landlord inspection confirmation:", e);
    }

    return true;
  },

  /**
   * Perform background evaluation and dispatch automated reminders
   */
  checkAndDispatchReminders(activeTenants = [], inspections = []) {
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
      activeTenants.forEach((tenant) => {
        if (!tenant) return;

        // Resolve due date
        let dueDateObj = null;
        if (tenant.start_date || tenant.startDate) {
          const startDate = new Date(tenant.start_date || tenant.startDate);
          dueDateObj = new Date(today.getFullYear(), today.getMonth(), startDate.getDate());
          if (dueDateObj < today) {
            dueDateObj.setMonth(dueDateObj.getMonth() + 1);
          }
        } else {
          // Default to 15th of current/next month
          dueDateObj = new Date(today.getFullYear(), today.getMonth(), 15);
          if (dueDateObj < today) {
            dueDateObj.setMonth(dueDateObj.getMonth() + 1);
          }
        }

        const diffTime = dueDateObj.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        settings.rentLeadDays.forEach((leadDay) => {
          if (diffDays === leadDay) {
            const tenantId = tenant.id || tenant.name || "tenant";
            const dispatchId = `rent_${tenantId}_day_${leadDay}_${todayISOStr}`;

            if (!dispatchLog.includes(dispatchId)) {
              const leadText = leadDay === 0 ? "Due Today" : `${leadDay} day${leadDay > 1 ? 's' : ''} before due date`;
              const success = this.dispatchRentReminder(tenant, leadText, false);
              if (success) {
                this.recordDispatch(dispatchId);
                dispatchedCount++;
              }
            }
          }
        });
      });
    }

    // --- EVALUATE INSPECTION REMINDERS ---
    if (settings.autoInspectionRemindersEnabled) {
      const allInspections = Array.isArray(inspections) && inspections.length > 0
        ? inspections
        : inspectionService.getAllInspections();

      allInspections.forEach((insp) => {
        if (!insp || !insp.date || insp.status === "Cancelled") return;

        const inspDateObj = new Date(insp.date);
        inspDateObj.setHours(0, 0, 0, 0);

        const diffTime = inspDateObj.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        settings.inspectionLeadDays.forEach((leadDay) => {
          if (diffDays === leadDay) {
            const inspId = insp.appId || insp.id || "inspection";
            const dispatchId = `insp_${inspId}_day_${leadDay}_${todayISOStr}`;

            if (!dispatchLog.includes(dispatchId)) {
              const leadText = leadDay === 0 ? "Today" : `${leadDay} day${leadDay > 1 ? 's' : ''} before inspection`;
              const success = this.dispatchInspectionReminder(insp, leadText, false);
              if (success) {
                this.recordDispatch(dispatchId);
                dispatchedCount++;
              }
            }
          }
        });
      });
    }

    return { dispatchedCount };
  }
};
