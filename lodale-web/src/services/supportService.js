import { apiClient } from '../lib/apiClient';

export const supportService = {
  /**
   * Get all support messages for the currently logged in user
   */
  async getUserMessages() {
    try {
      return await apiClient('/support');
    } catch (error) {
      console.warn('[SupportService] Failed to fetch user messages:', error.message);
      return [];
    }
  },

  /**
   * Send a support message from the currently logged in user
   */
  async sendMessage(message) {
    try {
      return await apiClient('/support', {
        method: 'POST',
        body: { message },
      });
    } catch (error) {
      console.error('[SupportService] Failed to send message:', error.message);
      throw error;
    }
  },

  /**
   * ADMIN ONLY: Get all support threads grouped by user
   */
  async getAdminThreads() {
    try {
      return await apiClient('/support/admin/threads');
    } catch (error) {
      console.error('[SupportService] Failed to fetch admin threads:', error.message);
      return [];
    }
  },

  /**
   * ADMIN ONLY: Reply to a specific user's support thread
   */
  async adminReply(userId, message) {
    try {
      return await apiClient('/support/admin/reply', {
        method: 'POST',
        body: { userId, message },
      });
    } catch (error) {
      console.error('[SupportService] Failed to send admin reply:', error.message);
      throw error;
    }
  }
};
