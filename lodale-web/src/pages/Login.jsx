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

  // Simulated known credentials
  const KNOWN_USER = {
    email: "user@example.com",
    password: "Password123!",
  };

  const KNOWN_ADMIN = {
    username: "admin",
    password: "555555",
  };

  // State to toggle between User and Admin login modes
  const [isAdminMode] = useState(() => {
    return location.pathname === "/admin/login" || location.search.includes("role=admin");
  });

  // Pre-fill email/username from previous session
  const [email, setEmail] = useState(() => {
    if (location.pathname === "/admin/login" || location.search.includes("role=admin")) {
      return "";
    }
    return localStorage.getItem("lastLoggedInEmail") || "";
  });
  const [password, setPassword] = useState(() => {
    if (location.pathname === "/admin/login" || location.search.includes("role=admin")) {
      return "";
    }
    const cleanInitial = (localStorage.getItem("lastLoggedInEmail") || "").trim().toLowerCase();
    if (cleanInitial) {
      const savedPass = localStorage.getItem("userPassword_" + cleanInitial) || localStorage.getItem("lastLoggedInPassword");
      if (savedPass) return savedPass;
    }
    return "";
  });
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
    if (localStorage.getItem("lastLoggedInEmail") || location.pathname === "/admin/login" || location.search.includes("role=admin")) {
      passwordRef.current?.focus();
    }

    // Redirect already authenticated admin to /admin/dashboard
    const isAlreadyAdmin = localStorage.getItem("isAuthenticated") === "true" && localStorage.getItem("userRole") === "admin";
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

  function handleQuickAdminLogin() {
    localStorage.removeItem("failedLoginAttempts");
    localStorage.removeItem("loginLockoutUntil");
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userRole", "admin");
    localStorage.setItem("lastLoggedInEmail", KNOWN_ADMIN.email);
    localStorage.setItem("sessionExpiresAt", (Date.now() + 60 * 60 * 1000).toString());
    navigate("/admin/dashboard");
  }

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

    // Check if logging in as Admin
    if (isAdminMode) {
      const cleanUsername = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      if (cleanUsername === KNOWN_ADMIN.username && cleanPassword === KNOWN_ADMIN.password) {
        localStorage.removeItem("failedLoginAttempts");
        localStorage.removeItem("loginLockoutUntil");
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("adminAuthenticated", "true");
        localStorage.setItem("lastLoggedInEmail", "admin");
        localStorage.setItem("username", "System Admin");
        localStorage.setItem("sessionExpiresAt", (Date.now() + 8 * 60 * 60 * 1000).toString());
        navigate("/admin/dashboard");
        return;
      } else {
        setInlineError("Invalid admin credentials. Please enter username: admin and password: 555555.");
        return;
      }
    }

    // For non-admin logins, clear any leftover admin auth state
    localStorage.removeItem("adminAuthenticated");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Try Express Backend API authentication first
    try {
      const res = await authService.signIn({ email: cleanEmail, password: cleanPassword });
      if (res && res.user) {
        const userRole = res.user.primary_role || "tenant";
        const userFullName = `${res.user.first_name || ""} ${res.user.last_name || ""}`.trim() || "User";

        localStorage.removeItem("failedLoginAttempts");
        localStorage.removeItem("loginLockoutUntil");
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userRole", userRole);
        localStorage.setItem("lastLoggedInEmail", cleanEmail);
        localStorage.setItem("lastLoggedInPassword", cleanPassword);
        localStorage.setItem("userPassword_" + cleanEmail, cleanPassword);
        localStorage.setItem("username", userFullName);
        localStorage.setItem("db_user_id", res.user.id);

        const profileObj = {
          firstName: res.user.first_name || "",
          lastName: res.user.last_name || "",
          email: cleanEmail,
          phone: res.user.phone_number || "",
          role: userRole,
          address: "",
          dob: "",
          location: "",
          postalCode: "",
        };
        localStorage.setItem("currentUserProfile", JSON.stringify(profileObj));
        localStorage.setItem("sessionExpiresAt", (Date.now() + 24 * 60 * 60 * 1000).toString());

        navigate(`/dashboard/${userRole}`);
        return;
      }
    } catch (apiErr) {
      if (apiErr.message && apiErr.message.includes("Invalid email or password")) {
        setInlineError("Invalid email or password.");
        return;
      }
      console.warn("Express backend authentication failed, attempting local fallback:", apiErr.message);
    }

    // 1. Direct user key lookup
    let registeredUser = null;
    const regUserKey = "registeredUser_" + cleanEmail;
    const regUserData = localStorage.getItem(regUserKey);
    if (regUserData) {
      try {
        registeredUser = JSON.parse(regUserData);
      } catch (err) {}
    }

    // 2. Global registeredUsers array lookup fallback
    if (!registeredUser) {
      try {
        const listStr = localStorage.getItem("registeredUsers");
        if (listStr) {
          const list = JSON.parse(listStr);
          registeredUser = list.find(u => u && u.email && u.email.toLowerCase() === cleanEmail);
        }
      } catch (e) {}
    }

    const savedUserPassword = localStorage.getItem("userPassword_" + cleanEmail) || (registeredUser ? registeredUser.password : null);

    // Registered user login logic
    if (registeredUser || savedUserPassword) {
      const expectedPassword = ((registeredUser && registeredUser.password) || savedUserPassword || "").trim();
      
      if (expectedPassword && cleanPassword !== expectedPassword && password !== expectedPassword) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        localStorage.setItem("failedLoginAttempts", newAttempts.toString());
        setInlineError("The password you entered is incorrect. Please try again.");
        return;
      }

      // Login Successful!
      const userRole = registeredUser?.role || localStorage.getItem("userRole") || "tenant";
      const userFullName = registeredUser?.username || localStorage.getItem("username") || "User";

      localStorage.removeItem("failedLoginAttempts");
      localStorage.removeItem("loginLockoutUntil");
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("lastLoggedInEmail", cleanEmail);
      localStorage.setItem("lastLoggedInPassword", expectedPassword || cleanPassword);
      localStorage.setItem("userPassword_" + cleanEmail, expectedPassword || cleanPassword);
      localStorage.setItem("username", userFullName);
      localStorage.setItem("username_" + cleanEmail, userFullName);

      const savedProfile = localStorage.getItem("userProfile_" + cleanEmail);
      if (savedProfile) {
        localStorage.setItem("currentUserProfile", savedProfile);
      } else {
        const fallbackProf = registeredUser?.profile || {
          firstName: userFullName.split(" ")[0] || "",
          lastName: userFullName.split(" ").slice(1).join(" ") || "",
          email: cleanEmail,
          role: userRole,
          phone: "",
          address: "",
          dob: "",
          location: "",
          postalCode: "",
        };
        localStorage.setItem("currentUserProfile", JSON.stringify(fallbackProf));
      }

      localStorage.setItem("sessionExpiresAt", (Date.now() + 24 * 60 * 60 * 1000).toString());
      navigate(`/dashboard/${userRole}`);
      return;
    }

    if (email !== KNOWN_USER.email && email.toLowerCase() !== KNOWN_ADMIN.email) {
      // Email not found
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
        setInlineError("We couldn’t find an account with that email address.");
      }
      return;
    }

    if (email === KNOWN_USER.email && password !== KNOWN_USER.password) {
      // Password incorrect
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
        setInlineError(
          "The password you entered is incorrect. Please try again or reset your password."
        );
      }
      return;
    }

    // Success Known Demo User Login!
    localStorage.removeItem("failedLoginAttempts");
    localStorage.removeItem("loginLockoutUntil");
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userRole", "tenant");
    localStorage.setItem("lastLoggedInEmail", email);
    localStorage.setItem("username", "Tunde Bakare");
    localStorage.setItem("username_" + email.toLowerCase(), "Tunde Bakare");
    const demoProf = {
      firstName: "Tunde",
      lastName: "Bakare",
      email,
      phone: "",
      role: "tenant",
      address: "",
      dob: "",
      location: "Lagos, Nigeria",
      postalCode: ""
    };
    localStorage.setItem("currentUserProfile", JSON.stringify(demoProf));
    localStorage.setItem("sessionExpiresAt", (Date.now() + 60 * 60 * 1000).toString());

    // Redirect to tenant dashboard
    navigate(`/dashboard/tenant`);
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
      <div className="absolute inset-0 bg-[#FAF8F6]/55 dark:bg-[#0B1512]/90 transition-colors duration-200" />

      {/* Floating Back Button */}
      <button
        onClick={() => navigate(-1)}
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
                    type={isAdminMode ? "text" : "email"}
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
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
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
              className="w-full bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#D8B672] text-white dark:text-[#0B1512] border-0 font-bold py-2 sm:py-2.5 mt-1 sm:mt-2 hover:scale-[1.015] active:scale-[0.985] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-moss-700 dark:focus-visible:ring-white focus-visible:ring-offset-2 outline-none rounded-xl cursor-pointer"
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
