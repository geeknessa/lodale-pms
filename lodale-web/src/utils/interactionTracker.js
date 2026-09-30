export const interactionTracker = {
  getStoreKey: () => 'lodale_property_interactions',

  // Initialize store if not exists
  initStore: () => {
    try {
      const store = localStorage.getItem(interactionTracker.getStoreKey());
      if (!store) {
        localStorage.setItem(interactionTracker.getStoreKey(), JSON.stringify([]));
        return [];
      }
      return JSON.parse(store);
    } catch (e) {
      console.warn("Failed to init interaction store:", e);
      return [];
    }
  },

  // Track an event (type = 'view' or 'save')
  trackEvent: (propertyId, landlordId, type = 'view') => {
    if (!propertyId || !landlordId) return;

    try {
      const events = interactionTracker.initStore();
      
      const newEvent = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        propertyId,
        landlordId,
        type, // 'view' or 'save'
        date: new Date().toISOString(),
      };

      events.push(newEvent);
      localStorage.setItem(interactionTracker.getStoreKey(), JSON.stringify(events));
      
      // Dispatch custom event for dashboard auto-refresh
      window.dispatchEvent(new Event("propertyInteractionsUpdated"));
    } catch (e) {
      console.error("Failed to track interaction:", e);
    }
  },

  // Get interactions for a specific landlord within the last 7 days grouped by day name
  getWeeklyStatsForLandlord: (landlordId) => {
    const events = interactionTracker.initStore();
    
    // Group structures
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const stats = {
      Sun: { views: 0, saves: 0 },
      Mon: { views: 0, saves: 0 },
      Tue: { views: 0, saves: 0 },
      Wed: { views: 0, saves: 0 },
      Thu: { views: 0, saves: 0 },
      Fri: { views: 0, saves: 0 },
      Sat: { views: 0, saves: 0 }
    };

    if (!landlordId) return stats;

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    events.forEach(event => {
      // String comparison is safer
      if (String(event.landlordId) === String(landlordId)) {
        const eventDate = new Date(event.date);
        
        // Ensure within the last 7 days
        if (eventDate >= sevenDaysAgo) {
          const dayName = weekDays[eventDate.getDay()];
          if (event.type === 'view') {
            stats[dayName].views += 1;
          } else if (event.type === 'save') {
            stats[dayName].saves += 1;
          }
        }
      }
    });

    return stats;
  }
};
