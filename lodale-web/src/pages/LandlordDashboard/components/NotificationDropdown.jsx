import React from "react";
import {
  Bell,
  BellOff,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Info,
  Wrench,
  MessageSquare,
  FileText,
  Upload,
  Receipt,
  X
} from "lucide-react";

export default function NotificationDropdown({
  isOpen = true,
  notifications = [],
  unreadCount = 0,
  unreadNotifCount = 0,
  onMarkAllRead,
  markAllNotifsRead,
  onClearAll,
  onClose,
  onNotificationClick,
  onOpenReceipt,
  onOpenMaintenance,
  onOpenChat,
  onOpenLease,
  onOpenProofUpload,
  onOpenPayment
}) {
  if (isOpen === false) return null;

  const effectiveUnread = typeof unreadCount === "number" ? unreadCount : unreadNotifCount;
  const handleMarkAll = onMarkAllRead || markAllNotifsRead;

  return (
    <div
      className="absolute right-0 top-12 z-[100] w-80 sm:w-[390px] max-w-[calc(100vw-2rem)] rounded-3xl bg-white/95 dark:bg-[#192A1F]/95 border border-slate-200 dark:border-[#2C4633] shadow-2xl p-5 space-y-4 backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200 ease-out text-left select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#2C4633]">
        <div className="flex items-center gap-2">
          <Bell className="h-4.5 w-4.5 text-emerald-700 dark:text-[#E5C583]" />
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Notifications
          </h3>
          {notifications.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-black bg-[#00875A] text-white rounded-full">
              {notifications.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {effectiveUnread > 0 && handleMarkAll && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="text-[11px] font-bold text-emerald-700 dark:text-[#E5C583] hover:underline cursor-pointer border-none bg-transparent outline-none p-0 transition-colors"
              title="Mark all notifications as read"
            >
              Mark Read
            </button>
          )}

          {notifications.length > 0 && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer border-none bg-transparent outline-none p-0 transition-colors"
              title="Clear all notifications"
            >
              Clear All
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition-colors"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-84 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-emerald-700/20">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
            <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 dark:text-cream-100/30">
              <BellOff className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-[13px] text-slate-900 dark:text-white">
              All caught up!
            </h4>
            <p className="text-[11.5px] text-slate-500 dark:text-cream-100/50 max-w-[200px] leading-normal">
              You have no new notifications right now.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const isSuccess = notif.type === "success";
            const isWarning = notif.type === "warning";
            const isPayment =
              notif.reference_type === "invoice" ||
              notif.reference_type === "payment" ||
              notif.reference_type === "rent_payment" ||
              notif.type === "payment" ||
              notif.type === "receipt" ||
              notif.title?.toLowerCase().includes("payment") ||
              notif.title?.toLowerCase().includes("receipt") ||
              notif.title?.toLowerCase().includes("invoice");
            const isApp = !isPayment && (notif.type === "application" || notif.title?.toLowerCase().includes("application"));
            const isUnread = !notif.is_read && !notif.read;

            const borderClass = isPayment
              ? "border-l-4 border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
              : isSuccess
              ? "border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10"
              : isWarning
              ? "border-l-4 border-l-rose-500 bg-rose-50/30 dark:bg-rose-950/10"
              : isApp
              ? "border-l-4 border-l-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20"
              : "border-l-4 border-l-[#00875A] dark:border-l-[#E5C583] bg-slate-50 dark:bg-white/5";

            const IconComponent = isPayment
              ? (notif.type === "receipt" ? Receipt : CreditCard)
              : isSuccess
              ? CheckCircle2
              : isWarning
              ? AlertTriangle
              : Info;

            const iconColor = isPayment
              ? "text-emerald-600 dark:text-emerald-400"
              : isSuccess
              ? "text-emerald-600 dark:text-emerald-400"
              : isWarning
              ? "text-rose-600 dark:text-rose-400"
              : "text-emerald-700 dark:text-[#E5C583]";

            return (
              <div
                key={notif.id}
                onClick={() => {
                  onNotificationClick && onNotificationClick(notif);
                }}
                className={`p-3.5 rounded-2xl border border-slate-100 dark:border-[#2C4633] transition-all hover:shadow-xs relative group flex items-start gap-3 cursor-pointer ${borderClass}`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${iconColor} bg-white dark:bg-white/5 shadow-2xs`}>
                  <IconComponent className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0 pr-2 text-left">
                  <div className="flex items-center gap-1.5 justify-between">
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                      {notif.title}
                    </h5>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Unread" />
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-cream-100/70 mt-1 leading-relaxed">
                    {notif.message}
                  </p>

                  {/* Context Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {isPayment && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose && onClose();
                          if (onOpenReceipt) {
                            onOpenReceipt(notif.reference_id);
                          } else if (onNotificationClick) {
                            onNotificationClick(notif);
                          }
                        }}
                        className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      >
                        <Receipt className="h-3.5 w-3.5" /> View Receipt
                      </button>
                    )}

                    {(notif.reference_type === "maintenance" ||
                      notif.type === "maintenance" ||
                      notif.title?.toLowerCase().includes("maintenance") ||
                      notif.title?.toLowerCase().includes("repair")) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose && onClose();
                          onOpenMaintenance && onOpenMaintenance();
                        }}
                        className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      >
                        <Wrench className="h-3.5 w-3.5" /> View Maintenance
                      </button>
                    )}

                    {(notif.reference_type === "chat" ||
                      notif.type === "chat" ||
                      notif.title?.toLowerCase().includes("message")) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose && onClose();
                          onOpenChat && onOpenChat(notif.reference_id);
                        }}
                        className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-300 dark:border-indigo-800 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Open Chat
                      </button>
                    )}

                    {(notif.reference_type === "lease" ||
                      notif.type === "lease" ||
                      notif.title?.toLowerCase().includes("lease")) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose && onClose();
                          onOpenLease && onOpenLease();
                        }}
                        className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" /> View Lease
                      </button>
                    )}

                    {(notif.title?.includes("Proof") ||
                      notif.message?.includes("proof") ||
                      notif.title?.includes("Ownership")) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose && onClose();
                          onOpenProofUpload && onOpenProofUpload(notif);
                        }}
                        className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      >
                        <Upload className="h-3.5 w-3.5" /> Upload Document
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] font-semibold text-slate-400 dark:text-cream-100/50 block mt-2">
                    {notif.time ||
                      (notif.created_at
                        ? new Date(notif.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "Just now")}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
