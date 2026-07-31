import { useState, useEffect, useRef } from "react";
import { 
  Search, Phone, Video, MoreHorizontal, Send, Paperclip, 
  Mic, Play, Pause, ChevronRight, Building2
} from "lucide-react";
import gsap from "gsap";
import "./Landllordchat.css";

export default function LandlordChat() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [audioPlaying, setAudioPlaying] = useState(false);

  const messagesEndRef = useRef(null);
  const chatListRef = useRef(null);
  const messageThreadRef = useRef(null);

  // Load chats from localStorage
  useEffect(() => {
    const loadChats = () => {
      const saved = localStorage.getItem("landlordChats");
      if (saved) {
        const parsed = JSON.parse(saved);
        setChats(parsed);
        
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
      }
    };

    loadChats();
    window.addEventListener("storage", loadChats);
    return () => window.removeEventListener("storage", loadChats);
  }, [activeChatId]);

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

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;

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
    localStorage.setItem("landlordChats", JSON.stringify(updatedChats));
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
          <button className="lc-tab" onClick={() => alert("Applicants list is populated via top applications bar.")}>Applicants</button>
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
              <button className="lc-header-btn" title="Phone Call" onClick={() => alert(`Calling ${activeChat.name}...`)}>
                <Phone className="h-4.5 w-4.5" />
              </button>
              <button className="lc-header-btn" title="Video Call" onClick={() => alert(`Starting video call with ${activeChat.name}...`)}>
                <Video className="h-4.5 w-4.5" />
              </button>
              <button className="lc-header-btn" title="More Options">
                <MoreHorizontal className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Scrollable messages area */}
          <div className="lc-messages-container" ref={messageThreadRef}>
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

                {/* Audio Waveform mock message bubble matching JPG design - only show if there are messages */}
                <div className="lc-bubble-wrapper incoming">
                  <img src={activeChat.avatar} alt={activeChat.name} className="lc-bubble-avatar" />
                  <div className="lc-bubble-content">
                    <div className="lc-audio-bubble">
                      <button className="lc-audio-play-btn" onClick={() => setAudioPlaying(!audioPlaying)}>
                        {audioPlaying ? <Pause className="h-4 w-4 fill-white text-white" /> : <Play className="h-4 w-4 fill-white text-white ml-0.5" />}
                      </button>
                      {/* Dynamic waveform visualization container */}
                      <div className="lc-waveform">
                        {[12, 18, 14, 25, 30, 20, 16, 22, 28, 12, 14, 20, 26, 32, 15, 10, 18, 22, 14, 20, 12, 16, 24, 18, 14, 10, 12, 16, 14, 12, 10].map((h, i) => (
                          <span 
                            key={i} 
                            className={`lc-waveform-bar ${audioPlaying ? "playing" : ""}`} 
                            style={{ height: `${h}px`, animationDelay: `${i * 0.05}s` }} 
                          />
                        ))}
                      </div>
                      <span className="lc-audio-duration">01:24</span>
                    </div>
                    <span className="lc-bubble-time">Today 11:45 AM</span>
                  </div>
                </div>
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form className="lc-input-form" onSubmit={handleSendMessage}>
            <button type="button" className="lc-input-btn" title="Add Attachment" onClick={() => alert("Select document or image...")}>
              <Paperclip className="h-5 w-5" />
            </button>
            
            <input 
              type="text" 
              placeholder="Type your message..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="lc-input-field text-[13.5px]"
            />

            <button type="button" className="lc-input-btn" title="Record Audio" onClick={() => alert("Recording audio note...")}>
              <Mic className="h-5 w-5" />
            </button>
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
