import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Mail, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Logo } from "../components/Logo";
import Button from "../components/Button";
import heroBg from "../assets/modern_villa.png";
import { useTheme } from "../context/ThemeContext";
import { authService } from "../services/authService";
import { triggerToast } from "../context/ToastContext";

export default function ForgotPassword() {
  useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(() => {
    return location.state?.email || "";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const cardRef = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (!email && emailInputRef.current) {
      emailInputRef.current.focus();
    }

    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 25, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: "power3.out" }
      );

      const children = cardRef.current.children;
      gsap.fromTo(
        children,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out", delay: 0.1 }
      );
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    setInlineError("");

    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) {
      setInlineError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setInlineError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authService.forgotPassword({ email: cleanEmail });
      const msg = res?.message || "If an account exists with this email, password reset instructions have been sent.";
      setSuccessMessage(msg);
      setIsSuccess(true);
      triggerToast(msg, "success", "Reset Instructions Sent");
    } catch (err) {
      // Even if there is an error, generic error feedback or fallback
      const errorMsg = err?.response?.data?.error || err?.message || "An unexpected error occurred. Please try again later.";
      setInlineError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full text-ink-900 dark:text-white flex flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-12 relative font-sans select-none text-left transition-colors duration-200"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[#FAF8F6]/55 dark:bg-[#263b33]/90 transition-colors duration-200" />

      {/* Floating Back Button */}
      <button
        onClick={() => navigate("/login")}
        className="group absolute top-3 left-3 sm:top-6 sm:left-6 z-20 flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-[14px] font-semibold text-ink-900/80 dark:text-white/80 hover:text-ink-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-none focus-visible:ring-2 focus-visible:ring-[#E5C583] outline-none"
      >
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
        Back to Sign In
      </button>

      <div className="w-full max-w-md space-y-4 sm:space-y-6 relative z-10 animate-fade-in">
        {/* Top Logo branding */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Glassmorphic Form Card */}
        <div
          ref={cardRef}
          className="w-full bg-[#FAF8F6]/75 dark:bg-[#07130D]/70 backdrop-blur-lg border border-white/80 dark:border-[#3f3f46]/60 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 transition-all duration-300"
        >
          {/* Header */}
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink-900 dark:text-white leading-tight">
              Forgot Password
            </h1>
            <p className="text-[12px] sm:text-[13px] text-ink-700 dark:text-cream-100/70 mt-1 sm:mt-1.5">
              Enter the email associated with your account and we will send reset instructions.
            </p>
          </div>

          {/* Inline Error */}
          {inlineError && (
            <div className="p-2.5 sm:p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl text-[12px] sm:text-[13px] leading-relaxed flex items-start gap-2 sm:gap-2.5 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{inlineError}</span>
            </div>
          )}

          {/* Success State */}
          {isSuccess ? (
            <div className="space-y-5 animate-fade-in">
              <div className="p-3.5 sm:p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-[13px] leading-relaxed flex items-start gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink-900 dark:text-white mb-1">Check your inbox</p>
                  <p>{successMessage}</p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#D8B672] text-white dark:text-[#263b33] border-0 font-bold py-2 sm:py-2.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-moss-700 dark:focus-visible:ring-white outline-none rounded-xl cursor-pointer flex items-center justify-center"
                >
                  Return to Sign In
                </Button>
              </div>
            </div>
          ) : (
            /* Request Form */
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[10px] sm:text-[11px] font-bold tracking-wider text-ink-700 dark:text-[#A3BCA7] uppercase mb-1 sm:mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 sm:h-5 sm:w-5 text-ink-400 dark:text-cream-100/40 pointer-events-none" />
                  <input
                    id="email"
                    name="email"
                    ref={emailInputRef}
                    autoComplete="email"
                    type="email"
                    inputMode="email"
                    maxLength={100}
                    placeholder="jane@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setInlineError("");
                    }}
                    required
                    disabled={isSubmitting}
                    className="w-full h-[42px] sm:h-[50px] pl-10 sm:pl-11 pr-4 rounded-xl border border-ink-200 hover:border-moss-500/50 dark:border-white/15 dark:hover:border-[#E5C583]/50 bg-transparent text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-white/30 text-[14px] sm:text-[15px] outline-none focus:border-moss-700 dark:focus:border-[#E5C583] focus-visible:ring-1 focus-visible:ring-moss-700 dark:focus-visible:ring-[#E5C583] transition-all duration-200 disabled:opacity-50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#D8B672] text-white dark:text-[#263b33] border-0 font-bold py-2 sm:py-2.5 mt-1 sm:mt-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-moss-700 dark:focus-visible:ring-white focus-visible:ring-offset-2 outline-none rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <span>Sending Instructions...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </Button>
            </form>
          )}

          {/* Links back to login/signup */}
          <div className="pt-2 text-center text-[12px] sm:text-[13px] text-ink-700 dark:text-cream-100/70 border-t border-ink-100 dark:border-white/10">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-semibold text-moss-700 dark:text-[#E5C583] hover:underline cursor-pointer outline-none"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
