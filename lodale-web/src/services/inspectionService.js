// Service for persisting and managing application inspection appointments
const STORAGE_PREFIX = "appInspection_";

export const inspectionService = {
  /**
   * Get inspection details for a specific application ID
   */
  getInspection(appId) {
    if (!appId) return null;
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${appId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Error reading inspection data:", e);
      return null;
    }
  },

  /**
   * Save or schedule a new inspection for an application
   */
  saveInspection(appId, data) {
    if (!appId) return null;
    try {
      const existing = this.getInspection(appId) || {};
      const inspectionObj = {
        appId: String(appId),
        propertyId: data.propertyId || existing.propertyId,
        propertyTitle: data.propertyTitle || existing.propertyTitle || "Property Listing",
        landlordId: data.landlordId || existing.landlordId,
        landlordName: data.landlordName || existing.landlordName || "Landlord",
        tenantId: data.tenantId || existing.tenantId,
        tenantName: data.tenantName || existing.tenantName || "Tenant",
        date: data.date || existing.date,
        time: data.time || existing.time || "10:00 AM",
        location: data.location || existing.location || "On-site at property",
        notes: data.notes || existing.notes || "",
        status: data.status || existing.status || "Scheduled", // "Scheduled", "Confirmed", "Requested", "Reschedule Requested", "Cancelled"
        createdBy: data.createdBy || existing.createdBy || "landlord",
        updatedAt: new Date().toISOString(),
        ...data
      };
      localStorage.setItem(`${STORAGE_PREFIX}${appId}`, JSON.stringify(inspectionObj));

      // Also maintain a master list index for calendar queries
      const masterList = JSON.parse(localStorage.getItem("allAppInspectionsList") || "[]");
      const idx = masterList.findIndex(item => String(item.appId) === String(appId));
      if (idx >= 0) {
        masterList[idx] = inspectionObj;
      } else {
        masterList.push(inspectionObj);
      }
      localStorage.setItem("allAppInspectionsList", JSON.stringify(masterList));

      return inspectionObj;
    } catch (e) {
      console.error("Error saving inspection data:", e);
      return null;
    }
  },

  /**
   * Update the status or fields of an existing inspection
   */
  updateInspectionStatus(appId, status, extraFields = {}) {
    const existing = this.getInspection(appId);
    if (!existing) return null;
    return this.saveInspection(appId, {
      ...existing,
      status,
      ...extraFields,
      updatedAt: new Date().toISOString()
    });
  },

  /**
   * Get all inspections across all applications (for calendar display)
   */
  getAllInspections() {
    try {
      const masterList = JSON.parse(localStorage.getItem("allAppInspectionsList") || "[]");
      return masterList;
    } catch (e) {
      console.error("Error fetching all inspections:", e);
      return [];
    }
  }
};
