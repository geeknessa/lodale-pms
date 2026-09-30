import { apiClient } from '../lib/apiClient';

export const notificationService = {
  /**
   * Get notifications for the authenticated user
   */
  async getMyNotifications() {
    try {
      const data = await apiClient('/notifications');
      return data || [];
    } catch (err) {
      console.warn('[notificationService.getMyNotifications error]:', err.message);
      return [];
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    try {
      const data = await apiClient(`/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      return data;
    } catch (err) {
      console.warn('[notificationService.markAsRead error]:', err.message);
      throw err;
    }
  },

  /**
   * Create a new notification manually
   */
  async createNotification(notificationData) {
    try {
      const data = await apiClient('/notifications', {
        method: 'POST',
        body: notificationData
      });
      return data;
    } catch (err) {
      console.warn('[notificationService.createNotification error]:', err.message);
      throw err;
    }
  }
};
