import { apiClient } from '../lib/apiClient';

export const chatService = {
  /**
   * Get a list of all active conversations.
   */
  async getConversations() {
    try {
      const data = await apiClient('/chat/conversations');
      return data?.conversations || [];
    } catch (err) {
      console.error('Failed to get chat conversations:', err?.message);
      return [];
    }
  },

  /**
   * Get the message history with a specific partner.
   */
  async getMessages(partnerId) {
    if (!partnerId) return [];
    try {
      const data = await apiClient(`/chat/${partnerId}`);
      return data?.messages || [];
    } catch (err) {
      console.error('Failed to get chat messages:', err?.message);
      return [];
    }
  },

  /**
   * Send a message to a specific partner.
   */
  async sendMessage(receiverId, message, propertyId = null) {
    if (!receiverId || !message) return null;
    try {
      const data = await apiClient('/chat', {
        method: 'POST',
        body: { receiverId, message, propertyId },
      });
      return data?.message || null;
    } catch (err) {
      console.error('Failed to send message:', err?.message);
      return null;
    }
  },

  /**
   * Delete a conversation with a partner.
   */
  async deleteConversation(partnerId) {
    if (!partnerId) return false;
    try {
      await apiClient(`/chat/${partnerId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      console.error('Failed to delete conversation:', err?.message);
      return false;
    }
  }
};
