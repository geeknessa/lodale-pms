import { useState, useEffect } from "react";
import { Mail, CheckCircle2, AlertCircle, Loader2, X, RefreshCw } from "lucide-react";
import Button from "./Button";
import { triggerToast } from "../context/ToastContext";
import { userService } from "../services/userService";

export default function EmailVerificationModal({ isOpen, onClose, newEmail, demoCode, onVerified }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [activeDemoCode, setActiveDemoCode] = useState(demoCode || "");

  useEffect(() => {
    if (demoCode) setActiveDemoCode(demoCode);
  }, [demoCode]);

  useEffect(() => {
    let timer;
    if (isOpen && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, resendTimer]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.trim().length < 4) {
      setErrorMsg("Please enter the verification code sent to your email.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await userService.verifyEmailChange(newEmail, code.trim());
      if (res && res.success) {
        triggerToast("Email address verified and updated successfully!", "success");
        if (onVerified) onVerified(newEmail);
        onClose();
      }
    } catch (err) {
      console.error("Email verification error:", err);
      setErrorMsg(err.message || err.error || "Invalid verification code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setResendLoading(true);
      setErrorMsg("");
      const res = await userService.requestEmailChange(newEmail);
      if (res && res.success) {
        if (res.demoCode) setActiveDemoCode(res.demoCode);
        setResendTimer(60);
        triggerToast(`Verification code re-sent to ${newEmail}`, "info");
      }
    } catch (err) {
      triggerToast(err.message || "Failed to resend verification code", "error");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0B1512] rounded-3xl shadow-2xl border border-ink-100 dark:border-white/10 p-6 sm:p-8 overflow-hidden text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-ink-400 hover:text-ink-900 dark:text-cream-100/60 dark:hover:text-white rounded-full hover:bg-ink-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Heading */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-moss-50 dark:bg-moss-950/60 text-moss-700 dark:text-[#E5C583] flex items-center justify-center shrink-0 border border-moss-200 dark:border-moss-800/40">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink-900 dark:text-white">Verify New Email</h3>
            <p className="text-xs text-ink-500 dark:text-cream-100/70">
              Code sent to <span className="font-semibold text-moss-700 dark:text-[#E5C583]">{newEmail}</span>
            </p>
          </div>
        </div>

        {/* Demo Code Info Badge */}
        {activeDemoCode && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
            <span>Demo Verification Code:</span>
            <span className="font-mono font-bold tracking-widest text-sm bg-amber-200 dark:bg-amber-900/60 px-2.5 py-0.5 rounded-lg text-amber-950 dark:text-amber-100">
              {activeDemoCode}
            </span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1.5 uppercase tracking-wider">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 123456"
              className="w-full px-4 py-3 text-center text-xl font-mono tracking-[0.3em] font-bold rounded-2xl bg-ink-50 dark:bg-white/5 border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-moss-600 dark:focus:ring-[#E5C583]"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            disabled={loading || code.trim().length < 4}
            className="w-full py-3 text-sm font-bold justify-center"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Confirm & Update Email
              </span>
            )}
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t border-ink-100 dark:border-white/10 flex items-center justify-between text-xs text-ink-500 dark:text-cream-100/70">
          <span>Didn't receive code?</span>
          {resendTimer > 0 ? (
            <span className="font-semibold text-ink-400">Resend in {resendTimer}s</span>
          ) : (
            <button
              onClick={handleResendCode}
              disabled={resendLoading}
              className="font-bold text-moss-700 dark:text-[#E5C583] hover:underline flex items-center gap-1 cursor-pointer"
            >
              {resendLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Resend Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
