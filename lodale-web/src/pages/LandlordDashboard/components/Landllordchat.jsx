import { useState, useEffect, useRef } from "react";
import { 
  Search, Phone, Video, MoreHorizontal, Send, Paperclip, 
  Mic, Play, Pause, ChevronRight, Building2
} from "lucide-react";
import { triggerToast } from "../../../context/ToastContext";
import { supportService } from "../../../services/supportService";
import gsap from "gsap";
import "./Landllordchat.css";

export default function LandlordChat() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [supportMessages, setSupportMessages] = useState([]);

  const messagesEndRef = useRef(null);
  const chatListRef = useRef(null);
  const messageThreadRef = useRef(null);

  // Load chats from localStorage
  useEffect(() => {
    const loadChats = () => {
      const saved = localStorage.getItem("landlordChats");
      let parsed = [];
      if (saved) {
        parsed = JSON.parse(saved);
      }
      
      // Inject Lodale Support Thread
      const supportThread = {
        id: "lodale-support",
        name: "Lodale Admin",
        avatar: "/logo_black.svg", // Lodale logo
        lastMessage: supportMessages.length > 0 ? supportMessages[supportMessages.length - 1].message : "Lodale Official Support Team",
        time: supportMessages.length > 0 ? new Date(supportMessages[supportMessages.length - 1].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Always online",
        messages: supportMessages.map(m => ({
          id: m.id,
          sender: m.sender_role === 'landlord' ? 'landlord' : 'tenant', // Mapping for CSS
          text: m.message,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }))
      };
      
      setChats([supportThread, ...parsed]);

      // Auto-select chat from activeChatTenantName if set from Tenants tab
      const redirectTenantName = localStorage.getItem("activeChatTenantName");
        if (redirectTenantName) {
          const thread = parsed.find(c => c.name.toLowerCase() === redirectTenantName.toLowerCase());
          if (thread) {
            setActiveChatId(thread.id);
          }
          localStorage.removeItem("activeChatTenantName");
        } else if (parsed.length > 0 && !activeChatId) {
          setActiveChatId(parsed[0].id);
        }
      };

    loadChats();
    window.addEventListener("storage", loadChats);
    return () => window.removeEventListener("storage", loadChats);
  }, [activeChatId, supportMessages]);

  // Fetch support messages
  useEffect(() => {
    const fetchSupport = async () => {
      const msgs = await supportService.getUserMessages();
      setSupportMessages(msgs || []);
    };
    fetchSupport();
    const interval = setInterval(fetchSupport, 10000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, chats]);

  // GSAP animations on active chat change
  useEffect(() => {
    if (activeChatId && messageThreadRef.current) {
      const bubbles = messageThreadRef.current.querySelectorAll(".lc-bubble-wrapper");
      gsap.fromTo(bubbles,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [activeChatId]);

  const activeChat = chats.find(c => c.id === activeChatId);

  const filteredChats = chats.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;

    if (activeChatId === "lodale-support") {
      try {
        const sent = await supportService.sendMessage(newMessage);
        setSupportMessages(prev => [...prev, sent]);
        setNewMessage("");
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } catch (err) {
        triggerToast("Failed to send message to Lodale Admin", "error");
      }
      return;
    }

    const updatedChats = chats.map(c => {
      if (c.id === activeChatId) {
        const newMsgObj = {
          id: Date.now(),
          sender: "landlord",
          text: newMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        return {
          ...c,
          lastMessage: newMessage,
          time: "Just now",
          messages: [...c.messages, newMsgObj]
        };
      }
      return c;
    });

    setChats(updatedChats);
    localStorage.setItem("landlordChats", JSON.stringify(updatedChats.filter(c => c.id !== "lodale-support")));

    // Sync to tenantChats
    const landlordName = sessionStorage.getItem("username") || "Emeka Obi"; // fallback mock
    const savedTenantChats = localStorage.getItem("tenantChats");
    let tChats = savedTenantChats ? JSON.parse(savedTenantChats) : [];
    
    let tThread = tChats.find(c => c.name.toLowerCase() === landlordName.toLowerCase());
    const newSyncMsg = {
      id: Date.now(),
      sender: "landlord", // incoming for tenant
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    if (tThread) {
      tThread.messages.push(newSyncMsg);
      tThread.lastMessage = newMessage;
      tThread.time = "Just now";
    } else {
      tChats.push({
        id: landlordName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
        name: landlordName,
        avatar: "", 
        lastMessage: newMessage,
        time: "Just now",
        messages: [newSyncMsg]
      });
    }
    localStorage.setItem("tenantChats", JSON.stringify(tChats.filter(c => c.id !== "lodale-support")));

    setNewMessage("");
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="lc-container">
      {/* 1. LEFT COLUMN: Chat List */}
      <div className="lc-sidebar">
        {/* Tabs */}
        <div className="lc-tabs">
          <button className="lc-tab active">Tenants</button>
          <button className="lc-tab" onClick={() => triggerToast("Applicants list is populated via the top applications bar.", "info", "Applicants Filter")}>Applicants</button>
        </div>

        {/* Sort & Search */}
        <div className="lc-search-bar-row">
          <div className="lc-sort-dropdown">
            <span>Latest First</span>
            <ChevronRight className="h-3.5 w-3.5 rotate-90 text-ink-500" />
          </div>
          
          <div className="lc-search-wrapper">
            <Search className="lc-search-icon" />
            <input 
              type="text" 
              placeholder="Search chat..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="lc-search-input"
            />
          </div>
        </div>

        {/* Chat Thread Cards */}
        <div className="lc-list-stack" ref={chatListRef}>
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              return (
                <div 
                  key={chat.id} 
                  className={`lc-chat-card ${isActive ? "active" : ""}`}
                  onClick={() => setActiveChatId(chat.id)}
                >
                  <div className="lc-card-avatar-wrapper">
                    <img src={chat.avatar} alt={chat.name} className="lc-card-avatar" />
                    <span className="lc-online-badge" />
                  </div>

                  <div className="lc-card-info">
                    <div className="lc-card-header-row">
                      <span className="lc-card-name">{chat.name}</span>
                      <span className="lc-card-time">{chat.time}</span>
                    </div>
                    <p className="lc-card-snippet">{chat.lastMessage}</p>
                  </div>
                  
                  {isActive && <div className="lc-active-indicator" />}
                </div>
              );
            })
          ) : (
            <div className="lc-empty-chats">
              <p>No active conversations yet.</p>
              <span className="text-[11px] text-ink-300">Approve applications or interact with tenant requests to start chatting.</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. MIDDLE COLUMN: Active Chat Thread */}
      {activeChat ? (
        <div className="lc-thread-wrapper">
          {/* Header */}
          <div className="lc-thread-header">
            <div className="lc-header-tenant-info">
              <img src={activeChat.avatar} alt={activeChat.name} className="lc-header-avatar" />
              <div>
                <h3 className="lc-header-name">{activeChat.name}</h3>
                <span className="lc-header-status">Online</span>
              </div>
            </div>

            <div className="lc-header-actions">
              <button className="lc-header-btn" title="More Options">
                <MoreHorizontal className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Scrollable messages area */}
          <div className="lc-messages-container" ref={messageThreadRef}>
            {activeChatId === "lodale-support" && (
              <div className="p-3 mb-4 mx-4 rounded-xl bg-emerald-50 dark:bg-[#1A2E22] border border-emerald-200 dark:border-[#2A4B36] text-center shadow-sm">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Lodale Official Support
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 leading-tight">
                  Send a message here if you have any problems or complaints. Our team will respond shortly.
                </p>
              </div>
            )}
            <div className="lc-date-divider">
              <span>Today</span>
            </div>

            {activeChat.messages.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "var(--text-muted)", textAlign: "center" }}>
                <span style={{ fontSize: "28px" }}>💬</span>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", margin: "12px 0 4px 0" }}>No Messages Yet</p>
                <p style={{ fontSize: "11.5px", margin: 0, maxWidth: "200px", lineHeight: "1.4" }}>Send a message to start the conversation with {activeChat.name}.</p>
              </div>
            ) : (
              <>
                {activeChat.messages.map((msg, index) => {
                  const isLandlord = msg.sender === "landlord";
                  return (
                    <div key={msg.id || index} className={`lc-bubble-wrapper ${isLandlord ? "outgoing" : "incoming"}`}>
                      {!isLandlord && (
                        <img src={activeChat.avatar} alt={activeChat.name} className="lc-bubble-avatar" />
                      )}
                      <div className="lc-bubble-content">
                        <div className="lc-bubble text-[13px]">{msg.text}</div>
                        <span className="lc-bubble-time">{msg.time}</span>
                      </div>
                    </div>
                  );
                })}

              </>
            )}

            {/* Application quick action bar if tenant */}
            {activeChat.linkedProperty && (
              <>
                <div className="lc-linked-property-card">
                  <div>
                    <span className="lc-[#E5C583]">Linked Listing:</span>
                    <h4 className="lc-prop-title">{activeChat.linkedProperty}</h4>
                  </div>
                  <span className="lc-prop-badge">Lease Active</span>
                </div>

                <div className="lc-quick-actions">
                  <span className="lc-qa-lbl">Landlord Quick Actions:</span>
                  <div className="lc-qa-btns">
                    <button className="lc-qa-btn approve">Approve Lease</button>
                    <button className="lc-qa-btn decline">Decline</button>
                  </div>
                </div>
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form className="lc-input-form" onSubmit={handleSendMessage}>
            <button type="button" className="lc-input-btn" title="Add Attachment" onClick={() => triggerToast("File attachment dialog ready. Select image or document.", "info", "Attach File")}>
              <Paperclip className="h-5 w-5" />
            </button>
            
            <input 
              type="text" 
              placeholder="Type your message..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="lc-input-field text-[13.5px]"
            />

            <button type="submit" className="lc-send-btn" title="Send Message">
              <Send className="h-4.5 w-4.5 text-white" />
            </button>
          </form>
        </div>
      ) : (
        <div className="lc-thread-wrapper lc-no-active">
          <Building2 className="h-14 w-14 text-ink-200 mb-2 animate-bounce" />
          <h3>Select a conversation</h3>
          <p>Choose a tenant from the list on the left to view messages and details.</p>
        </div>
      )}
    </div>
  );
}
