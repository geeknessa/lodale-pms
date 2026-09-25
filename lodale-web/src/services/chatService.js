import { apiClient } from '../lib/apiClient';

const LOCAL_STORE_KEY = "lodale_local_chat_store";
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function isUuid(id) {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

function getLocalStore() {
  try {
    const raw = localStorage.getItem(LOCAL_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveLocalStore(store) {
  try {
    localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event("storage"));
  } catch (e) { }
}

export const chatService = {
  /**
   * Get a list of all active conversations.
   */
  async getConversations() {
    let apiConvos = [];
    try {
      const data = await apiClient('/chat/conversations');
      if (data && Array.isArray(data.conversations)) {
        apiConvos = data.conversations;
      }
    } catch (err) {
      console.warn('Backend chat conversations unavailable, using local cache:', err?.message);
    }

    const localStore = getLocalStore();
    const map = new Map();

    // Add API conversations
    apiConvos.forEach(c => {
      if (c && c.partner_id) {
        map.set(String(c.partner_id), c);
      }
    });

    // Merge with local conversations
    Object.keys(localStore).forEach(partnerId => {
      const entry = localStore[partnerId];
      if (entry && entry.messages && entry.messages.length > 0) {
        const lastMsg = entry.messages[entry.messages.length - 1];
        const existing = map.get(String(partnerId));
        if (!existing) {
          map.set(String(partnerId), {
            partner_id: partnerId,
            first_name: entry.partnerName || "User",
            last_name: "",
            avatar_url: entry.partnerAvatar || "",
            last_message: lastMsg.message,
            last_message_time: lastMsg.created_at,
            is_read: true
          });
        } else {
          // If local has newer message
          if (new Date(lastMsg.created_at) > new Date(existing.last_message_time || 0)) {
            map.set(String(partnerId), {
              ...existing,
              last_message: lastMsg.message,
              last_message_time: lastMsg.created_at
            });
          }
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
  },

  /**
   * Get the message history with a specific partner.
   */
  async getMessages(partnerId) {
    let apiMsgs = [];
    if (isUuid(partnerId)) {
      try {
        const data = await apiClient(`/chat/${partnerId}`);
        if (data && Array.isArray(data.messages)) {
          apiMsgs = data.messages;
        }
      } catch (err) {
        console.warn('Backend getMessages unavailable, using local cache:', err?.message);
      }
    }

    const localStore = getLocalStore();
    const localMsgs = (localStore[partnerId] && localStore[partnerId].messages) || [];

    // Combine & deduplicate messages by ID or timestamp+text
    const seen = new Set();
    const combined = [];

    [...apiMsgs, ...localMsgs].forEach(m => {
      if (!m) return;
      const key = m.id || `${m.created_at}_${m.message}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(m);
      }
    });

    return combined.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },

  /**
   * Send a message to a specific partner.
   */
  async sendMessage(receiverId, message, propertyId = null, extraPartnerInfo = {}) {
    let serverMsg = null;
    if (isUuid(receiverId)) {
      try {
        const data = await apiClient('/chat', {
          method: 'POST',
          body: { receiverId, message, propertyId: isUuid(propertyId) ? propertyId : null },
        });
        if (data && data.message) {
          serverMsg = data.message;
        }
      } catch (err) {
        console.warn('Backend sendMessage unavailable, caching locally:', err?.message);
      }
    }

    // Save locally to store
    const localStore = getLocalStore();
    if (!localStore[receiverId]) {
      localStore[receiverId] = {
        partnerName: extraPartnerInfo.partner_name || extraPartnerInfo.name || "User",
        partnerAvatar: extraPartnerInfo.partner_avatar || extraPartnerInfo.avatar || "",
        messages: []
      };
    }

    const newMsgObj = serverMsg || {
      id: "local-" + Date.now(),
      sender_id: "me",
      receiver_id: receiverId,
      property_id: propertyId,
      message: message,
      is_read: true,
      created_at: new Date().toISOString()
    };

    localStore[receiverId].messages.push(newMsgObj);
    if (extraPartnerInfo.partner_name) localStore[receiverId].partnerName = extraPartnerInfo.partner_name;
    if (extraPartnerInfo.partner_avatar) localStore[receiverId].partnerAvatar = extraPartnerInfo.partner_avatar;

    saveLocalStore(localStore);
    return newMsgObj;
  },

  /**
   * Delete a conversation with a partner.
   */
  async deleteConversation(partnerId) {
    if (isUuid(partnerId)) {
      try {
        await apiClient(`/chat/${partnerId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('Backend deleteConversation warning:', err?.message);
      }
    }

    const localStore = getLocalStore();
    if (localStore[partnerId]) {
      delete localStore[partnerId];
      saveLocalStore(localStore);
    }
    return true;
  }
};
