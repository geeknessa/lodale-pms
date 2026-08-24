import { apiClient } from '../lib/apiClient';

export const chatService = {
  /**
   * Get a list of all active conversations (unique users).
   */
  async getConversations() {
    try {
      const data = await apiClient('/chat/conversations');
      return data.conversations || [];
    } catch (err) {
      console.error('Failed to get conversations:', err);
      return [];
    }
  },

  /**
   * Get the message history with a specific partner.
   * @param {string} partnerId - The UUID of the other user.
   */
  async getMessages(partnerId) {
    try {
      const data = await apiClient(`/chat/${partnerId}`);
      return data.messages || [];
    } catch (err) {
      console.error('Failed to get messages:', err);
      return [];
    }
  },

  /**
   * Send a message to a specific partner.
   * @param {string} receiverId - The UUID of the other user.
   * @param {string} message - The text body of the message.
   * @param {string} [propertyId] - Optional property ID context.
   */
  async sendMessage(receiverId, message, propertyId = null) {
    try {
      const data = await apiClient('/chat', {
        method: 'POST',
        body: { receiverId, message, propertyId },
      });
      return data.message;
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    }
  }
};
