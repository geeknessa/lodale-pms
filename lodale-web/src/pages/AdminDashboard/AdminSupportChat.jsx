import React, { useState, useEffect, useRef } from "react";
import { Search, Send, MessageSquare } from "lucide-react";
import { supportService } from "../../services/supportService";
import { triggerToast } from "../../context/ToastContext";

export default function AdminSupportChat() {
  const [threads, setThreads] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const fetchThreads = async () => {
    try {
      const data = await supportService.getAdminThreads();
      setThreads(data || []);
    } catch (err) {
      console.error("Failed to load threads", err);
    }
  };

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeUserId, threads]);

  const activeThread = threads.find(t => t.user_id === activeUserId);

  const filteredThreads = threads.filter(t => 
    (t.user_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.last_message || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUserId) return;

    try {
      const sent = await supportService.adminReply(activeUserId, newMessage);
      // Optimistically update
      setThreads(prev => prev.map(t => {
        if (t.user_id === activeUserId) {
          return {
            ...t,
            last_message: sent.message,
            last_message_time: sent.created_at,
            messages: [...(t.messages || []), sent]
          };
        }
        return t;
      }));
      setNewMessage("");
    } catch (err) {
      triggerToast("Failed to send reply", "error");
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-[#0B1512] rounded-xl overflow-hidden border border-neutral-200 dark:border-white/10 shadow-sm" style={{ minHeight: "600px" }}>
      {/* LEFT SIDEBAR: Threads List */}
      <div className="w-1/3 border-r border-neutral-200 dark:border-white/10 flex flex-col bg-neutral-50 dark:bg-black/20">
        <div className="p-4 border-b border-neutral-200 dark:border-white/10">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Support Tickets</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users or messages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3A5A40] dark:text-white"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length > 0 ? (
            filteredThreads.map(thread => (
              <div 
                key={thread.user_id}
                onClick={() => setActiveUserId(thread.user_id)}
                className={`p-4 border-b border-neutral-200 dark:border-white/10 cursor-pointer transition-colors ${activeUserId === thread.user_id ? "bg-[#3A5A40]/10 dark:bg-[#3A5A40]/30" : "hover:bg-neutral-100 dark:hover:bg-white/5"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#3A5A40] text-white flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden">
                    {thread.avatar_url ? (
                      <img src={thread.avatar_url} alt={thread.user_name} className="h-full w-full object-cover" />
                    ) : (
                      thread.user_name ? thread.user_name.charAt(0).toUpperCase() : "U"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{thread.user_name}</span>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">
                        {new Date(thread.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{thread.last_message}</p>
                    <span className="text-[10px] font-semibold text-[#3A5A40] dark:text-[#E5C583] uppercase tracking-wider mt-1 inline-block bg-[#3A5A40]/10 dark:bg-[#E5C583]/20 px-1.5 py-0.5 rounded">
                      {thread.user_role}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No support tickets found.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Chat Thread */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0B1512]">
        {activeThread ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-white/10 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#3A5A40] text-white flex items-center justify-center font-bold text-lg overflow-hidden">
                {activeThread.avatar_url ? (
                  <img src={activeThread.avatar_url} alt={activeThread.user_name} className="h-full w-full object-cover" />
                ) : (
                  activeThread.user_name ? activeThread.user_name.charAt(0).toUpperCase() : "U"
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{activeThread.user_name}</h3>
                <p className="text-xs text-slate-500">{activeThread.user_email} • {activeThread.user_role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeThread.messages && activeThread.messages.map((msg, idx) => {
                const isAdmin = msg.sender_role === 'admin';
                return (
                  <div key={msg.id || idx} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl ${isAdmin ? "bg-[#3A5A40] text-white rounded-tr-sm" : "bg-neutral-100 dark:bg-white/10 text-slate-900 dark:text-white rounded-tl-sm"}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-neutral-200 dark:border-white/10">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a reply to the user..."
                  className="flex-1 p-3 bg-neutral-100 dark:bg-white/5 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3A5A40] dark:text-white"
                />
                <button type="submit" className="bg-[#3A5A40] hover:bg-[#2C4633] text-white p-3 rounded-xl transition-colors shrink-0">
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-lg font-bold mb-2">Support Center</h3>
            <p className="text-sm max-w-md">Select a user thread from the sidebar to view their complaints and reply to them.</p>
          </div>
        )}
      </div>
    </div>
  );
}
