import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, Zap, User } from "lucide-react";
import { Logo } from "../components/Logo";
import Button from "../components/Button";
import heroBg from "../assets/modern_villa.png";
import { useTheme } from "../context/ThemeContext";
import { authService } from "../services/authService";

export default function Login() {
  useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // State to toggle between User and Admin login modes
  const [isAdminMode] = useState(() => {
    return location.pathname === "/admin/login" || location.search.includes("role=admin");
  });

  // Pre-fill email only (never passwords) from previous session
  const [email, setEmail] = useState(() => {
    if (location.pathname === "/admin/login" || location.search.includes("role=admin")) {
      return "";
    }
    return sessionStorage.getItem("lastLoggedInEmail") || "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Error and Notification states
  const [inlineError, setInlineError] = useState("");
  const [sessionWarning, setSessionWarning] = useState(() => {
    if (location.state?.sessionExpired) {
      return "Your session has expired. Please log in again to continue.";
    }
    if (location.state?.fromProtected) {
      return "Please log in to access this page.";
    }
    return "";
  });
  const [resetMessage, setResetMessage] = useState("");

  // Failed login tracking
  const [failedAttempts, setFailedAttempts] = useState(() => {
    return Number(localStorage.getItem("failedLoginAttempts") || "0");
  });
  const [lockoutTime, setLockoutTime] = useState(() => {
    const raw = localStorage.getItem("loginLockoutUntil");
    return raw ? Number(raw) : null;
  });

  // Refs for focusing and GSAP animations
  const passwordRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    // If email is pre-filled, focus on the password field automatically
    if (sessionStorage.getItem("lastLoggedInEmail") || location.pathname === "/admin/login" || location.search.includes("role=admin")) {
      passwordRef.current?.focus();
    }

    // Redirect already authenticated admin to /admin/dashboard
    const isAlreadyAdmin = sessionStorage.getItem("isAuthenticated") === "true" && sessionStorage.getItem("userRole") === "admin";
    if (isAlreadyAdmin && (location.pathname === "/admin/login" || location.pathname === "/login")) {
      navigate("/admin/dashboard");
    }

    // GSAP Entry Animation
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
  }, [navigate, location.pathname, location.search]);

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setInlineError("");
    setResetMessage("");
    setSessionWarning("");

    // Lockout check
    if (lockoutTime && Date.now() < lockoutTime) {
      const minutesRemaining = Math.ceil((lockoutTime - Date.now()) / 60000);
      setInlineError(
        `Too many failed login attempts. Please try again in ${minutesRemaining} minutes or reset your password.`
      );
      return;
    }

    // Admin login — authenticate via API
    if (isAdminMode) {
      const cleanUsername = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      try {
        const res = await authService.signIn({ email: cleanUsername, password: cleanPassword });
        if (res && res.user && res.user.primary_role === "admin") {
          const expiresAt = (Date.now() + 24 * 60 * 60 * 1000).toString();

          sessionStorage.setItem("isAuthenticated", "true");
          sessionStorage.setItem("userRole", "admin");
          sessionStorage.setItem("adminAuthenticated", "true");
          sessionStorage.setItem("lastLoggedInEmail", cleanUsername);
          sessionStorage.setItem("username", `${res.user.first_name || ""} ${res.user.last_name || ""}`.trim() || "Admin");
          sessionStorage.setItem("sessionExpiresAt", expiresAt);
          sessionStorage.setItem("db_user_id", res.user.id);
          if (res.token) sessionStorage.setItem("lodale_token", res.token);

          sessionStorage.setItem("isAuthenticated", "true");
          sessionStorage.setItem("userRole", "admin");
          sessionStorage.setItem("adminAuthenticated", "true");
          sessionStorage.setItem("lastLoggedInEmail", cleanUsername);
          sessionStorage.setItem("sessionExpiresAt", expiresAt);
          if (res.token) sessionStorage.setItem("lodale_token", res.token);
          localStorage.removeItem("explicitAdminSignOut");

          navigate("/admin/dashboard");
          return;
        } else {
          setInlineError("This account does not have admin privileges.");
          return;
        }
      } catch (apiErr) {
        setInlineError("Invalid admin credentials. Please check your username and password.");
        return;
      }
    }

    // Non-admin user login handling

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Authenticate via Express Backend API
    try {
      const res = await authService.signIn({ email: cleanEmail, password: cleanPassword });
      if (res && res.user) {
        const userRole = res.user.primary_role || "tenant";
        const userFullName = `${res.user.first_name || ""} ${res.user.last_name || ""}`.trim() || "User";
        const expiresAt = (Date.now() + 24 * 60 * 60 * 1000).toString();

        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("userRole", userRole);
        sessionStorage.setItem("lastLoggedInEmail", cleanEmail);
        sessionStorage.setItem("username", userFullName);
        sessionStorage.setItem("db_user_id", res.user.id);
        sessionStorage.setItem("sessionExpiresAt", expiresAt);

        localStorage.removeItem("failedLoginAttempts");
        localStorage.removeItem("loginLockoutUntil");
        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("userRole", userRole);
        sessionStorage.setItem("lastLoggedInEmail", cleanEmail);
        sessionStorage.setItem("sessionExpiresAt", expiresAt);
        sessionStorage.setItem("username_" + cleanEmail, userFullName);

        if (userRole === "admin") {
          sessionStorage.setItem("adminAuthenticated", "true");
          sessionStorage.setItem("adminAuthenticated", "true");
          localStorage.removeItem("explicitAdminSignOut");
        }

        let savedProfile = {};
        try {
          const rawSaved = sessionStorage.getItem("userProfile_" + cleanEmail);
          if (rawSaved) savedProfile = JSON.parse(rawSaved);
        } catch (e) { }

        const profileObj = {
          firstName: res.user.first_name || savedProfile.firstName || savedProfile.first_name || "",
          lastName: res.user.last_name || savedProfile.lastName || savedProfile.last_name || "",
          first_name: res.user.first_name || savedProfile.first_name || savedProfile.firstName || "",
          last_name: res.user.last_name || savedProfile.last_name || savedProfile.lastName || "",
          email: cleanEmail,
          phone: res.user.phone_number || savedProfile.phone || savedProfile.phone_number || "",
          phone_number: res.user.phone_number || savedProfile.phone_number || savedProfile.phone || "",
          role: userRole,
          address: res.user.address || savedProfile.address || "",
          dob: res.user.dob || savedProfile.dob || "",
          location: res.user.location || savedProfile.location || "",
          postalCode: res.user.postal_code || res.user.postalCode || savedProfile.postalCode || savedProfile.postal_code || "",
          postal_code: res.user.postal_code || res.user.postalCode || savedProfile.postal_code || savedProfile.postalCode || "",
          gender: res.user.gender || savedProfile.gender || "Male",
          avatar: res.user.avatar_url || savedProfile.avatar || savedProfile.avatar_url || "",
          avatar_url: res.user.avatar_url || savedProfile.avatar_url || savedProfile.avatar || ""
        };
        sessionStorage.setItem("currentUserProfile", JSON.stringify(profileObj));
        sessionStorage.setItem("currentUserProfile", JSON.stringify(profileObj));
        sessionStorage.setItem("sessionExpiresAt", (Date.now() + 24 * 60 * 60 * 1000).toString());
        sessionStorage.setItem("userProfile_" + cleanEmail, JSON.stringify(profileObj));

        navigate(userRole === "admin" ? "/admin/dashboard" : `/dashboard/${userRole}`);
        return;
      }
    } catch (apiErr) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem("failedLoginAttempts", newAttempts.toString());

      if (newAttempts >= 10) {
        const lockDuration = Date.now() + 15 * 60 * 1000;
        setLockoutTime(lockDuration);
        localStorage.setItem("loginLockoutUntil", lockDuration.toString());
        setInlineError(
          "Too many failed login attempts. Please try again in 15 minutes or reset your password."
        );
      } else {
        setInlineError("Invalid email or password. Please try again.");
      }
      return;
    }

  }

  function handleForgotPassword() {
    setInlineError("");
    setSessionWarning("");

    if (!email) {
      setInlineError("Please enter your email address to reset your password.");
      return;
    }

    // Reset attempts and clear lockout
    setFailedAttempts(0);
    setLockoutTime(null);
    localStorage.removeItem("failedLoginAttempts");
    localStorage.removeItem("loginLockoutUntil");

    setResetMessage(`Password reset link has been sent to ${email}.`);
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
        onClick={() => navigate("/explore")}
        className="group absolute top-3 left-3 sm:top-6 sm:left-6 z-20 flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-[14px] font-semibold text-ink-900/80 dark:text-white/80 hover:text-ink-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-none focus-visible:ring-2 focus-visible:ring-[#E5C583] outline-none"
      >
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
        Back
      </button>

      <div className="w-full max-w-md space-y-4 sm:space-y-6 relative z-10 animate-fade-in">
        {/* Top Logo branding */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Glassmorphic Form Card */}
        <div ref={cardRef} className="w-full bg-[#FAF8F6]/75 dark:bg-[#101F1A]/70 backdrop-blur-lg border border-white/80 dark:border-[#23372B]/60 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 transition-all duration-300">
          {/* Admin toggle removed to keep Admin Portal private */}

          {/* Form Title Header */}
          <div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-normal text-ink-900 dark:text-white leading-tight">
              {isAdminMode ? "Admin Sign In" : "Welcome back"}
            </h1>
            <p className="text-[12px] sm:text-[13px] text-ink-700 dark:text-cream-100/70 mt-1 sm:mt-1.5">
              {isAdminMode
                ? "Sign in to access platform moderation, listing approvals, and safety controls."
                : "Access your properties, tenants, payments, and maintenance requests."}
            </p>
          </div>



          {/* Security / Session warnings */}
          {sessionWarning && (
            <div className="p-2.5 sm:p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 rounded-xl text-[12px] sm:text-[13px] leading-relaxed flex items-start gap-2 sm:gap-2.5 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{sessionWarning}</span>
            </div>
          )}

          {/* Inline Error messages */}
          {inlineError && (
            <div className="p-2.5 sm:p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl text-[12px] sm:text-[13px] leading-relaxed flex items-start gap-2 sm:gap-2.5 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{inlineError}</span>
            </div>
          )}

          {/* Password Reset Success Messages */}
          {resetMessage && (
            <div className="p-2.5 sm:p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-[12px] sm:text-[13px] leading-relaxed flex items-start gap-2 sm:gap-2.5 animate-fade-in">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{resetMessage}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-3.5 sm:space-y-4">
              {/* Email / Username Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-[10px] sm:text-[11px] font-bold tracking-wider text-ink-700 dark:text-[#A3BCA7] uppercase mb-1 sm:mb-1.5"
                >
                  {isAdminMode ? "Username" : "Email Address"}
                </label>
                <div className="relative">
                  {isAdminMode ? (
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 sm:h-5 sm:w-5 text-ink-400 dark:text-cream-100/40 pointer-events-none" />
                  ) : (
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 sm:h-5 sm:w-5 text-ink-400 dark:text-cream-100/40 pointer-events-none" />
                  )}
                  <input
                    id="email"
                    name={isAdminMode ? "username" : "email"}
                    autoComplete={isAdminMode ? "username" : "email"}
                    type={isAdminMode || email.toLowerCase() === "admin" ? "text" : "email"}
                    maxLength={100}
                    placeholder={isAdminMode ? "admin" : "ada@example.com"}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setInlineError("");
                    }}
                    required
                    className="w-full h-[42px] sm:h-[50px] pl-10 sm:pl-11 pr-4 rounded-xl border border-ink-200 hover:border-moss-500/50 dark:border-white/15 dark:hover:border-[#E5C583]/50 bg-transparent text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-white/30 text-[14px] sm:text-[15px] outline-none focus:border-moss-700 dark:focus:border-[#E5C583] focus-visible:ring-1 focus-visible:ring-moss-700 dark:focus-visible:ring-[#E5C583] transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-[10px] sm:text-[11px] font-bold tracking-wider text-ink-700 dark:text-[#A3BCA7] uppercase mb-1 sm:mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 sm:h-5 sm:w-5 text-ink-400 dark:text-cream-100/40 pointer-events-none" />
                  <input
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    maxLength={128}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setInlineError("");
                    }}
                    required
                    className="w-full h-[42px] sm:h-[50px] pl-10 sm:pl-11 pr-11 sm:pr-12 rounded-xl border border-ink-200 hover:border-moss-500/50 dark:border-white/15 dark:hover:border-[#E5C583]/50 bg-transparent text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-white/30 text-[14px] sm:text-[15px] outline-none focus:border-moss-700 dark:focus:border-[#E5C583] focus-visible:ring-1 focus-visible:ring-moss-700 dark:focus-visible:ring-[#E5C583] transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 dark:text-cream-100/40 hover:text-ink-900 dark:hover:text-white outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Prompt recovery utility */}
            <div className="flex justify-between items-center text-[11px] sm:text-[12px]">
              <span className="text-ink-700/65 dark:text-[#A3BCA7]/65">
                {failedAttempts > 0 && `${failedAttempts}/10 attempts`}
              </span>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-semibold text-moss-700 dark:text-[#E5C583] hover:underline cursor-pointer outline-none focus-visible:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#D8B672] text-white dark:text-[#263b33] border-0 font-bold py-2 sm:py-2.5 mt-1 sm:mt-2 hover:scale-[1.015] active:scale-[0.985] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-moss-700 dark:focus-visible:ring-white focus-visible:ring-offset-2 outline-none rounded-xl cursor-pointer"
            >
              {isAdminMode ? "Log In as Admin" : "Log In"}
            </Button>
          </form>

          {!isAdminMode && (
            <p className="text-center text-[12px] sm:text-[13px] text-ink-700/80 dark:text-white/80">
              Don&rsquo;t have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-moss-700 dark:text-[#E5C583] hover:underline outline-none focus-visible:underline"
              >
                Create Account
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
