import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Helper to retrieve current logged in user name
  const getUserName = () => {
    try {
      const raw = sessionStorage.getItem("currentUserProfile");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.firstName) return parsed.firstName;
      }
    } catch (e) {}
    const full = sessionStorage.getItem("username");
    if (full) return full.split(" ")[0];
    return "User";
  };

  const showToast = useCallback((message, type = "success", title = "") => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const userName = getUserName();

    let finalMsg = message;
    if (userName && userName !== "User" && typeof message === "string" && !message.toLowerCase().includes(userName.toLowerCase())) {
      if (type === "success") {
        finalMsg = `Hi ${userName}, ${message.charAt(0).toLowerCase() + message.slice(1)}`;
      }
    }

    const newToast = {
      id,
      message: finalMsg,
      type,
      title: title || (type === "success" ? "Success" : type === "error" ? "Action Failed" : type === "warning" ? "Notice" : "Update"),
      createdAt: Date.now()
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 5));
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleGlobalToast = (e) => {
      if (e.detail) {
        const { message, type, title } = e.detail;
        showToast(message, type, title);
      }
    };
    window.addEventListener("lodale-toast", handleGlobalToast);
    return () => window.removeEventListener("lodale-toast", handleGlobalToast);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-40px)] pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  // Auto-dismiss after 4 seconds (3-5 seconds range)
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";
  const isWarning = toast.type === "warning";

  const IconComponent = isSuccess
    ? CheckCircle2
    : isError
    ? AlertCircle
    : isWarning
    ? AlertTriangle
    : Info;

  const bgClasses = isSuccess
    ? "bg-[#0E2018] border-emerald-500/50 text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.25)]"
    : isError
    ? "bg-[#200E12] border-rose-500/50 text-rose-100 shadow-[0_10px_30px_rgba(244,63,94,0.25)]"
    : isWarning
    ? "bg-[#20180E] border-amber-500/50 text-amber-100 shadow-[0_10px_30px_rgba(245,158,11,0.25)]"
    : "bg-[#16241F] border-[#E5C583]/50 text-[#E5C583] shadow-[0_10px_30px_rgba(229,197,131,0.2)]";

  const iconColorClasses = isSuccess
    ? "text-emerald-400 bg-emerald-500/20"
    : isError
    ? "text-rose-400 bg-rose-500/20"
    : isWarning
    ? "text-amber-400 bg-amber-500/20"
    : "text-[#E5C583] bg-[#E5C583]/20";

  return (
    <div
      className={`pointer-events-auto p-4 rounded-2xl border flex items-start gap-3 transition-all duration-300 transform translate-y-0 opacity-100 ${bgClasses}`}
    >
      <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${iconColorClasses}`}>
        <IconComponent className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <h4 className="font-bold text-[13px] tracking-tight text-white mb-0.5">{toast.title}</h4>
        <p className="text-[12px] leading-snug opacity-90 break-words font-medium">{toast.message}</p>
      </div>

      <button
        onClick={onClose}
        className="text-white/60 hover:text-white transition-colors p-1 rounded-full cursor-pointer border-none bg-transparent outline-none shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: (message, type = "success", title = "") => {
        window.dispatchEvent(
          new CustomEvent("lodale-toast", { detail: { message, type, title } })
        );
      }
    };
  }
  return ctx;
}

export function triggerToast(message, type = "success", title = "") {
  window.dispatchEvent(
    new CustomEvent("lodale-toast", { detail: { message, type, title } })
  );
}
