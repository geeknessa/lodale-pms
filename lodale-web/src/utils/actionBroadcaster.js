// Broadcaster for real-time notifications and action events across tabs and components
const channel = typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('lodale_actions') 
  : null;

export const broadcastAction = (actionType, payload = {}) => {
  const eventData = { type: actionType, payload, timestamp: Date.now() };
  if (channel) {
    try {
      channel.postMessage(eventData);
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lodale_action', { detail: eventData }));
  }
};

export const onBroadcastAction = (callback) => {
  const handleMessage = (e) => {
    if (e.data) callback(e.data);
  };
  const handleCustomEvent = (e) => {
    if (e.detail) callback(e.detail);
  };

  if (channel) {
    channel.addEventListener('message', handleMessage);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('lodale_action', handleCustomEvent);
  }

  return () => {
    if (channel) {
      channel.removeEventListener('message', handleMessage);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('lodale_action', handleCustomEvent);
    }
  };
};
