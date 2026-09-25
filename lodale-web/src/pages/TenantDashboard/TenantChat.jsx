import { useState, useEffect, useRef } from "react";
import {
  Search, Phone, Video, MoreHorizontal, Send, Paperclip,
  Mic, Play, Pause, ChevronRight, Building2, ArrowLeft, Trash2
} from "lucide-react";
import { triggerToast } from "../../context/ToastContext";
import { supportService } from "../../services/supportService";
import { chatService } from "../../services/chatService";
import Avatar from "../../components/Avatar";
import Button from "../../components/Button";
import gsap from "gsap";
import "./TenantChat.css";

export default function TenantChat({ setActiveTab }) {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(() => sessionStorage.getItem("activeChatPartnerId") || localStorage.getItem("activeChatPartnerId") || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [mobileShowSidebar, setMobileShowSidebar] = useState(true);

  const [supportMessages, setSupportMessages] = useState([]);
  const [threadMessages, setThreadMessages] = useState([]);

  const messagesEndRef = useRef(null);
  const chatListRef = useRef(null);
  const messageThreadRef = useRef(null);

  const fetchChatData = async () => {
    // Fetch Chat Conversations
    const convos = await chatService.getConversations();

    // Inject Support Thread at top
    const supportThread = {
      partner_id: "lodale-support",
      first_name: "Lodale",
      last_name: "Admin",
      avatar_url: "/logo_black.svg",
      last_message: supportMessages.length > 0 ? supportMessages[supportMessages.length - 1].message : "Lodale Official Support Team",
      last_message_time: supportMessages.length > 0 ? supportMessages[supportMessages.length - 1].created_at : new Date(),
      isSupport: true
    };

    setChats([supportThread, ...convos]);
  };

  useEffect(() => {
    const checkPendingPartner = () => {
      const pendingPartnerId = sessionStorage.getItem("activeChatPartnerId") || localStorage.getItem("activeChatPartnerId");
      if (pendingPartnerId) {
        setActiveChatId(pendingPartnerId);
        setMobileShowSidebar(false);
        sessionStorage.removeItem("activeChatPartnerId");
        localStorage.removeItem("activeChatPartnerId");
      }
    };
    checkPendingPartner();
    window.addEventListener("focus", checkPendingPartner);
    return () => window.removeEventListener("focus", checkPendingPartner);
  }, []);

  // Initial Data Fetching
  useEffect(() => {
    fetchChatData();
    const interval = setInterval(fetchChatData, 12000);
    return () => clearInterval(interval);
  }, [supportMessages]);

  // Fetch support messages separately
  useEffect(() => {
    const fetchSupport = async () => {
      const msgs = await supportService.getUserMessages();
      setSupportMessages(msgs || []);
    };
    fetchSupport();
    const interval = setInterval(fetchSupport, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch individual thread messages when active chat changes
  useEffect(() => {
    if (!activeChatId) return;

    if (activeChatId === "lodale-support") {
      setThreadMessages(supportMessages.map(m => ({
        id: m.id,
        isMine: m.sender_role === 'tenant',
        text: m.message,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
      return;
    }

    const fetchThread = async () => {
      const msgs = await chatService.getMessages(activeChatId);
      setThreadMessages(msgs.map(m => ({
        id: m.id,
        isMine: m.sender_id !== activeChatId,
        text: m.message,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    };

    fetchThread();
    const interval = setInterval(fetchThread, 4000);
    return () => clearInterval(interval);
  }, [activeChatId, supportMessages]);

  // Scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

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

  const activeChat = chats.find(c => c.partner_id === activeChatId);

  const filteredChats = chats.filter(c => {
    const name = c.isSupport ? "Lodale Admin" : `${c.first_name || ''} ${c.last_name || ''}`.trim();
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.last_message || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleDeleteConversation = async () => {
    if (!activeChatId || activeChatId === "lodale-support") return;
    const confirmDelete = window.confirm("Are you sure you want to delete this conversation? This will clear all messages with this contact.");
    if (!confirmDelete) return;

    try {
      await chatService.deleteConversation(activeChatId);
      triggerToast("Conversation deleted", "info", "Deleted");
      setActiveChatId(null);
      fetchChatData();
    } catch (err) {
      triggerToast("Failed to delete conversation", "error");
    }
  };

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

    try {
      await chatService.sendMessage(activeChatId, newMessage);
      setNewMessage("");
      const msgs = await chatService.getMessages(activeChatId);
      setThreadMessages(msgs.map(m => ({
        id: m.id,
        isMine: m.sender_id !== activeChatId,
        text: m.message,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    } catch (err) {
      triggerToast("Failed to send message", "error");
    }
  };

  const chatFileInputRef = useRef(null);

  const handlePaperclipFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        triggerToast("File size exceeds 5MB limit.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        const msg = `[DOCUMENT UPLOADED]\nDocument Type: Chat Attachment\nFile Name: ${file.name}\nData: ${dataUrl}`;
        if (activeChatId) {
          try {
            await chatService.sendMessage(activeChatId, msg);
            triggerToast(`Sent attachment "${file.name}"`, "success");
            const msgs = await chatService.getMessages(activeChatId);
            setThreadMessages(msgs.map(m => ({
              id: m.id,
              isMine: m.sender_id !== activeChatId,
              text: m.message,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })));
          } catch (err) {
            triggerToast("Failed to send attachment", "error");
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderMessageText = (text) => {
    if (!text) return "";
    if (text.startsWith("[DOCUMENT UPLOADED]")) {
      const typeMatch = text.match(/Document Type:\s*(.+)/);
      const nameMatch = text.match(/File Name:\s*(.+)/);
      const dataMatch = text.match(/Data:\s*(.+)/);

      const docType = typeMatch ? typeMatch[1].trim() : "Attached Document";
      const fileName = nameMatch ? nameMatch[1].trim() : "Document File";
      const dataUrl = dataMatch ? dataMatch[1].trim() : null;

      return (
        <div className="p-3 bg-white/10 rounded-xl border border-white/20 my-1 space-y-2 text-left">
          <div className="flex items-center gap-2">
            <span className="text-lg">📄</span>
            <div>
              <p className="font-bold text-xs">{docType}</p>
              <p className="text-[11px] opacity-80">{fileName}</p>
            </div>
          </div>
          {dataUrl && (
            <a
              href={dataUrl}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-moss-900 dark:bg-moss-800 dark:text-white rounded-lg text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
            >
              Download / View Document
            </a>
          )}
        </div>
      );
    }
    return text;
  };

  return (
    <div className={`lc-container ${mobileShowSidebar ? "mobile-sidebar-active" : "mobile-thread-active"}`}>
      <input
        type="file"
        ref={chatFileInputRef}
        onChange={handlePaperclipFile}
        accept="image/*,application/pdf,.doc,.docx"
        className="hidden"
      />

      {/* 1. LEFT COLUMN: Chat List */}
      <div className="lc-sidebar">

        {/* Header */}
        <div className="lc-sidebar-header flex items-center justify-between" style={{ padding: "20px 20px 12px 20px", textAlign: "left" }}>
          <h2 className="lc-sidebar-title" style={{ fontSize: "20px", fontWeight: "850", color: "var(--tenant-text-main)", margin: 0, letterSpacing: "-0.02em" }}>Messages</h2>
        </div>

        {/* Sort & Search */}
        <div className="lc-search-bar-row">
          <div className="lc-search-wrapper" style={{ width: '100%' }}>
            <Search className="lc-search-icon" />
            <input
              type="text"
              placeholder="Search chats..."
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
              const isActive = chat.partner_id === activeChatId;
              const name = chat.isSupport ? "Lodale Admin" : `${chat.first_name || ''} ${chat.last_name || ''}`.trim() || "Landlord Partner";

              let timeStr = "Just now";
              if (chat.last_message_time) {
                const d = new Date(chat.last_message_time);
                if (!isNaN(d.getTime())) {
                  timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
              }

              return (
                <div
                  key={chat.partner_id}
                  className={`lc-chat-card ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setActiveChatId(chat.partner_id);
                    setMobileShowSidebar(false);
                  }}
                >
                  <div className="lc-card-avatar-wrapper">
                    <Avatar src={chat.avatar_url} name={name} className="lc-card-avatar rounded-full" />
                    <span className="lc-online-badge" />
                  </div>

                  <div className="lc-card-info">
                    <div className="lc-card-header-row">
                      <span className="lc-card-name">{name}</span>
                      <span className="lc-card-time">{timeStr}</span>
                    </div>
                    <p className="lc-card-snippet">{chat.last_message || "Start a conversation"}</p>
                  </div>

                  {isActive && <div className="lc-active-indicator" />}
                </div>
              );
            })
          ) : (
            <div className="lc-empty-chats flex flex-col items-center justify-center p-6 text-center">
              <p className="text-xs font-semibold text-ink-700 dark:text-cream-100">No active conversations yet.</p>
              <span className="text-[11px] text-ink-400 mt-1 mb-3">Initiate a chat from your property applications or search listings.</span>
              <Button
                onClick={() => {
                  if (setActiveTab) setActiveTab(4);
                }}
                className="bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] text-xs font-bold px-3 py-1.5 rounded-xl"
              >
                View Applications
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. MIDDLE COLUMN: Active Chat Thread */}
      {activeChat ? (
        <div className="lc-thread-wrapper">
          {/* Header */}
          <div className="lc-thread-header">
            {/* Mobile Back Button */}
            <button
              className="lc-mobile-back-btn p-2 mr-2 text-ink-500 hover:bg-ink-100 rounded-lg lg:hidden"
              onClick={() => setMobileShowSidebar(true)}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="lc-header-tenant-info">
              <Avatar
                src={activeChat.avatar_url}
                name={activeChat.isSupport ? "Lodale Admin" : `${activeChat.first_name || ''} ${activeChat.last_name || ''}`.trim()}
                className="lc-header-avatar rounded-full"
              />
              <div>
                <h3 className="lc-header-name">
                  {activeChat.isSupport ? "Lodale Official Support" : `${activeChat.first_name || ''} ${activeChat.last_name || ''}`.trim()}
                </h3>
                <span className="lc-header-status text-moss-600 dark:text-moss-400">Online</span>
              </div>
            </div>

            <div className="lc-header-actions flex items-center gap-1">
              <button className="lc-header-btn" title="Voice Call">
                <Phone className="h-4.5 w-4.5" />
              </button>
              <button className="lc-header-btn" title="Video Call">
                <Video className="h-4.5 w-4.5" />
              </button>
              {activeChatId !== "lodale-support" && (
                <button
                  className="lc-header-btn text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2 rounded-lg transition-colors cursor-pointer"
                  title="Delete Conversation"
                  onClick={handleDeleteConversation}
                >
                  <Trash2 className="h-4.5 w-4.5 text-rose-600" />
                </button>
              )}
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

            {threadMessages.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "var(--text-muted)", textAlign: "center" }}>
                <span style={{ fontSize: "28px" }}>💬</span>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", margin: "12px 0 4px 0" }}>No Messages Yet</p>
                <p style={{ fontSize: "11.5px", margin: 0, maxWidth: "200px", lineHeight: "1.4" }}>Send a message to start the conversation.</p>
              </div>
            ) : (
              threadMessages.map((msg, index) => {
                const isMine = msg.isMine;
                return (
                  <div key={msg.id || index} className={`lc-bubble-wrapper ${isMine ? "outgoing" : "incoming"}`}>
                    {!isMine && (
                      <Avatar
                        src={activeChat.avatar_url}
                        name={activeChat.isSupport ? "Lodale Admin" : `${activeChat.first_name || ''} ${activeChat.last_name || ''}`.trim()}
                        className="lc-bubble-avatar rounded-full"
                      />
                    )}
                    <div className="lc-bubble-content">
                      <div className="lc-bubble text-[13px]">{renderMessageText(msg.text)}</div>
                      <span className="lc-bubble-time">{msg.time}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form className="lc-input-form" onSubmit={handleSendMessage}>
            <button
              type="button"
              className="lc-input-btn"
              title="Attach Document or Image"
              onClick={() => chatFileInputRef.current?.click()}
            >
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
        <div className="lc-thread-wrapper lc-no-active hidden lg:flex">
          <Building2 className="h-14 w-14 text-ink-200 mb-2 animate-bounce" />
          <h3>Select a conversation</h3>
          <p>Choose a chat from the list on the left to view messages.</p>
        </div>
      )}
    </div>
  );
}
