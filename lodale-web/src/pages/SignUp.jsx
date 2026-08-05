import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Shield,
  Home,
  Key,
  AlertCircle,
  Check,
  Minus,
} from "lucide-react";
import { Logo, VerifiedBadge } from "../components/Logo";
import Button from "../components/Button";
import { authService } from "../services/authService";
import heroBg from "../assets/modern_villa.png";
import { useTheme } from "../context/ThemeContext";

const ROLES = [
  {
    id: "tenant",
    title: "Tenant",
    description: "I rent or am looking to rent",
  },
  {
    id: "landlord",
    title: "Landlord",
    description: "I own or manage rental property",
  },
];

const LOADING_MESSAGES = [
  "Connecting to NIMC identity registry portal...",
  "Validating 11-digit NIN security payload...",
  "Synchronizing digital identity trace profile...",
];

export default function SignUp() {
  useTheme();
  const { state } = useLocation();


  const cardRef = useRef(null);
  const logoRef = useRef(null);
  const stepContainerRef = useRef(null);

  useEffect(() => {
    // GSAP entry animations for card and logo branding
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );
    gsap.fromTo(
      logoRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.6, delay: 0.15, ease: "power2.out" }
    );
  }, []);
  const presetRole = state?.presetRole ?? "tenant";
  const skipRolePicker = state?.skipRolePicker ?? false;
  const skipWelcome = state?.skipWelcome ?? false;
  const listingId = state?.listingId;

  const [role, setRole] = useState(presetRole);
  const [step, setStep] = useState(skipRolePicker ? 2 : 1);

  // Step 2 Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 3 Verification States
  const [nin, setNin] = useState("");
  const [verified, setVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);

  // Validation / Error alerts
  const [inlineError, setInlineError] = useState("");


  // Google sign up simulation
  const [googleLoading, setGoogleLoading] = useState(false);

  // GSAP slide transition when step changes
  useEffect(() => {
    if (stepContainerRef.current) {
      gsap.killTweensOf(stepContainerRef.current);
      gsap.fromTo(
        stepContainerRef.current,
        { opacity: 0, x: 15 },
        { opacity: 1, x: 0, duration: 0.45, ease: "power2.out" }
      );
    }
  }, [step]);

  function handleGoogleSignUp() {
    setGoogleLoading(true);
    setInlineError("");

    setTimeout(() => {
      setGoogleLoading(false);
      const rng = Math.random();

      if (rng < 0.25) {
        setInlineError("Google sign-up was cancelled.");
      } else if (rng < 0.4) {
        setInlineError("Google authentication failed. Please try again.");
      } else {
        // Pre-fill fields from Google account
        setFirstName("Google");
        setLastName("User");
        setEmail("google.user@example.com");
        // Automatically jump to Step 3 for NIN verification
        setStep(3);
      }
    }, 1200);
  }

  const navigate = useNavigate();

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid =
    hasMinLength && hasUppercase && hasNumber && hasSpecialChar;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function handleGoToStep3() {
    setInlineError("");

    // Validate inputs in step 2
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setInlineError(
        "Missing Information: Please ensure all fields are completely filled out before proceeding.",
      );
      return;
    }

    if (!isEmailValid) {
      setInlineError(
        "Invalid Email Address: Please enter a valid email address (e.g. name@example.com) before proceeding.",
      );
      return;
    }

    if (!isPasswordValid) {
      setInlineError(
        "Password Not Secure Enough: It needs to include at least 8 characters, an uppercase letter, a number, and a special symbol.",
      );
      return;
    }

    if (email.trim().toLowerCase() === "user@example.com") {
      setInlineError(
        'Email Already Registered: An account was previously created using this email address. Please try signing in with this email, or click the "Log In" toggle at the top of the form.',
      );
      return;
    }

    // All checks passed, proceed to step 3 (Verify ID)
    setStep(3);
  }

  function handleVerify(e) {
    e.preventDefault();
    setInlineError("");

    if (nin.length !== 11) {
      setInlineError(
        "Invalid NIN: Please enter your complete 11-digit National Identification Number to verify your identity.",
      );
      return;
    }

    setIsVerifying(true);
    setProgress(0);
    setLoadingStep(0);

    const targetObj = { val: 0 };
    gsap.to(targetObj, {
      val: 100,
      duration: 2.8,
      ease: "power1.inOut",
      onUpdate: () => {
        const currentProgress = Math.round(targetObj.val);
        setProgress(currentProgress);

        if (currentProgress > 72) {
          setLoadingStep(2);
        } else if (currentProgress > 36) {
          setLoadingStep(1);
        } else {
          setLoadingStep(0);
        }
      },
      onComplete: async () => {
        setIsVerifying(false);
        setVerified(true);

        const cleanEmail = email.trim().toLowerCase();
        const cleanPassword = password.trim();
        const cleanName = `${firstName.trim()} ${lastName.trim()}`;

        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("lastLoggedInEmail", cleanEmail);
        localStorage.setItem("lastLoggedInPassword", cleanPassword);
        localStorage.setItem("username", cleanName);
        localStorage.setItem("userRole", role);
        localStorage.setItem("isNewSignUp", "true");
        localStorage.setItem("userPassword_" + cleanEmail, cleanPassword);

        const profileObj = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: cleanEmail,
          phone: "",
          role,
          address: "",
          dob: "",
          location: "",
          postalCode: "",
          nin: nin || ""
        };
        localStorage.setItem("userProfile_" + cleanEmail, JSON.stringify(profileObj));
        localStorage.setItem("currentUserProfile", JSON.stringify(profileObj));

        const userRecord = {
          email: cleanEmail,
          role,
          username: cleanName,
          password: cleanPassword,
          profile: profileObj
        };

        localStorage.setItem("registeredUser_" + cleanEmail, JSON.stringify(userRecord));

        // Store in global registeredUsers array for cross-page lookup
        try {
          const existingStr = localStorage.getItem("registeredUsers");
          let existing = existingStr ? JSON.parse(existingStr) : [];
          existing = existing.filter(u => u && u.email && u.email.toLowerCase() !== cleanEmail);
          existing.push(userRecord);
          localStorage.setItem("registeredUsers", JSON.stringify(existing));
        } catch (e) {}

        // Persist user to PostgreSQL Database via authService
        try {
          const res = await authService.signUp({
            email: cleanEmail,
            password: cleanPassword,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role: role,
            phone: ""
          });
          if (res && res.user) {
            localStorage.setItem("db_user_id", res.user.id);
          }
        } catch (dbErr) {
          console.warn("Database user persist warning:", dbErr);
        }

        localStorage.setItem(
          "sessionExpiresAt",
          (Date.now() + 24 * 60 * 60 * 1000).toString(),
        );
      },
    });
  }

  function handleCompleteSignUp() {
    if (skipWelcome && listingId) {
      navigate(`/apply/${listingId}`);
    } else {
      navigate(`/dashboard/${role}`);
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
      <div className="absolute inset-0 bg-[#FAF8F6]/55 dark:bg-[#0B1512]/90 transition-colors duration-200" />
      {/* Floating Back Button */}
      <button
        onClick={() => {
          if (step > 1) {
            setStep(step - 1);
          } else {
            navigate(-1);
          }
        }}
        className="absolute top-3 left-3 sm:top-6 sm:left-6 z-20 flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-[14px] font-semibold text-ink-900/80 dark:text-white/80 hover:text-ink-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-none focus-visible:ring-2 focus-visible:ring-[#E5C583] outline-none"
      >
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        Back
      </button>

      <div className="w-full max-w-md space-y-4 sm:space-y-6 relative z-10 animate-fade-in">
        {/* Top Logo branding */}
        <div ref={logoRef} className="flex justify-center">
          <Logo />
        </div>

        {/* Glassmorphic Form Card */}
        <div ref={cardRef} className="w-full bg-[#FAF8F6]/75 dark:bg-[#101F1A]/70 backdrop-blur-lg border border-white/80 dark:border-[#23372B]/60 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 transition-all duration-300">
          {/* Segmented Control Pill Toggle - Only visible on Step 1 */}
          {step === 1 && (
            <div className="flex justify-center animate-fade-in">
              <div className="inline-flex p-1 bg-moss-100 dark:bg-[#101F1A] border border-ink-200 dark:border-[#23372B]/60 rounded-xl w-full">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="flex-1 py-1.5 sm:py-2 text-[11px] sm:text-[12px] font-bold tracking-wider rounded-lg uppercase text-ink-700/60 dark:text-[#D0D7D5]/60 hover:text-ink-900 dark:hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer outline-none focus-visible:text-ink-900 dark:focus-visible:text-white"
                >
                  Log In
                </button>
                <button
                  type="button"
                  className="flex-1 py-1.5 sm:py-2 text-[11px] sm:text-[12px] font-bold tracking-wider rounded-lg uppercase bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#0B1512] shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer outline-none"
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}

          {/* Steps Progress Tracker */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-[13px] tracking-wide text-ink-700 dark:text-cream-100/70 mb-4 sm:mb-6 w-full">
            {/* Step 1 */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span
                className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold shrink-0 ${step === 1
                  ? "bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#0B1512]"
                  : "border border-ink-200 dark:border-white/15 text-ink-700 dark:text-cream-100/70"
                  }`}
              >
                1
              </span>
              <span
                className={`whitespace-nowrap ${step === 1
                  ? "text-moss-700 dark:text-[#E5C583] font-semibold"
                  : "text-ink-700 dark:text-cream-100/70"
                  }`}
              >
                <span className="hidden sm:inline">Who are you?</span>
                <span className="inline sm:hidden">Role</span>
              </span>
            </div>

            <div className="flex-1 h-px bg-auth-divider-line min-w-[8px] sm:min-w-[12px]" />

            {/* Step 2 */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span
                className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold shrink-0 ${step === 2
                  ? "bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#0B1512]"
                  : "border border-ink-200 dark:border-white/15 text-ink-700 dark:text-cream-100/70"
                  }`}
              >
                2
              </span>
              <span
                className={`whitespace-nowrap ${step === 2
                  ? "text-moss-700 dark:text-[#E5C583] font-semibold"
                  : "text-ink-700 dark:text-cream-100/70"
                  }`}
              >
                <span className="hidden sm:inline">Your details</span>
                <span className="inline sm:hidden">Details</span>
              </span>
            </div>

            <div className="flex-1 h-px bg-auth-divider-line min-w-[8px] sm:min-w-[12px]" />

            {/* Step 3 */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span
                className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold shrink-0 ${step === 3
                  ? "bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#0B1512]"
                  : "border border-ink-200 dark:border-white/15 text-ink-700 dark:text-cream-100/70"
                  }`}
              >
                3
              </span>
              <span
                className={`whitespace-nowrap ${step === 3
                  ? "text-moss-700 dark:text-[#E5C583] font-semibold"
                  : "text-ink-700 dark:text-cream-100/70"
                  }`}
              >
                <span className="hidden sm:inline">Verify ID</span>
                <span className="inline sm:hidden">Verify</span>
              </span>
            </div>
          </div>

          {/* Form Step Content Container */}
          <div ref={stepContainerRef} className="w-full relative">
            {step === 1 && (
              <div className="space-y-4 sm:space-y-6 animate-fade-in">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-normal text-ink-900 dark:text-white leading-tight">
                    You are a...
                  </h1>
                  <p className="text-[12px] sm:text-[13px] text-ink-700 dark:text-cream-100/70 mt-1 sm:mt-2">
                    Your role shapes what you see and how your record is
                    built.
                  </p>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  {ROLES.map(({ id, title, description }) => {
                    const selected = role === id;
                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => setRole(id)}
                        className={`w-full rounded-xl border p-3.5 sm:p-4.5 text-left transition-all duration-200 cursor-pointer flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-moss-700 dark:focus-visible:ring-[#E5C583] hover:-translate-y-0.5 hover:scale-[1.015] active:scale-[0.985] ${selected
                          ? "border-moss-700 dark:border-[#E5C583] bg-moss-100/40 dark:bg-[#1C3328]/40"
                          : "border-ink-200 dark:border-[#23372B] bg-white/60 dark:bg-[#13221C]/60 hover:border-moss-600/30"
                          }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${selected
                            ? "bg-moss-700/10 text-moss-700 dark:text-[#E5C583]"
                            : "bg-ink-100 text-ink-600 dark:text-cream-100/40"
                            }`}>
                            {id === "landlord" ? (
                              <Home className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                            ) : (
                              <Key className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-[13px] sm:text-[14px] text-ink-900 dark:text-white block">
                              {title}
                            </span>
                            <span className="text-[11px] sm:text-[12px] text-ink-700 dark:text-cream-100/70 block mt-0.5 leading-relaxed">
                              {description}
                            </span>
                          </div>
                        </div>

                        {/* Radio Checkmark */}
                        <div
                          className={`h-4 w-4 sm:h-4.5 sm:w-4.5 rounded-full flex items-center justify-center shrink-0 ml-3 sm:ml-4 transition-all duration-200 ${selected
                            ? "border-[3px] sm:border-4 border-moss-700 dark:border-[#E5C583] bg-transparent"
                            : "border border-ink-300 dark:border-moss-600"
                            }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1 sm:pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#D8B672] text-white dark:text-[#0B1512] border-0 font-bold py-2.5 sm:py-3.5 mt-2 focus-visible:ring-2 focus-visible:ring-moss-700 dark:focus-visible:ring-white focus-visible:ring-offset-2 outline-none rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <p className="text-center text-[12px] sm:text-[13px] text-ink-700 dark:text-cream-100/70/85 animate-fade-in mt-3 sm:mt-4">
                Are you a returning visitor?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-moss-700 dark:text-[#E5C583] inline-block hover:underline hover:scale-[1.01] transition-all duration-200 outline-none focus-visible:underline"
                >
                  Click here to log in
                </Link>
              </p>
            )}
            {step === 2 && (
              <div className="space-y-4 sm:space-y-6 animate-fade-in">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-normal text-ink-900 dark:text-white leading-tight">
                    Build your{" "}
                    <span className="italic text-moss-700 dark:text-[#E5C583]">
                      record
                    </span>
                  </h1>
                  <p className="text-[12px] sm:text-[13px] text-ink-700 dark:text-cream-100/70 mt-1 sm:mt-2">
                    Signing up as{" "}
                    <span className="text-moss-700 dark:text-[#E5C583] font-medium">
                      {role}
                    </span>
                    .{" "}
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="underline font-semibold text-ink-900 dark:text-white hover:text-moss-700 dark:text-[#E5C583] transition-colors cursor-pointer outline-none"
                    >
                      Change
                    </button>
                  </p>
                </div>

                {inlineError && (
                  <div className="p-2.5 sm:p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl text-[12px] sm:text-[13px] leading-relaxed flex items-start gap-2 sm:gap-2.5 animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{inlineError}</span>
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4">
                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-[10px] sm:text-[11px] font-bold tracking-wider text-ink-700 dark:text-[#A3BCA7] uppercase mb-1 sm:mb-1.5"
                      >
                        First Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 sm:h-5 sm:w-5 text-ink-400 dark:text-cream-100/40 pointer-events-none" />
                        <input
                          id="firstName"
                          type="text"
                          placeholder="Jane"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full h-[42px] sm:h-[50px] pl-10 sm:pl-11 pr-4 rounded-xl border border-ink-200 hover:border-ink-400 dark:border-white/15 dark:hover:border-white/25 bg-transparent text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-white/30 text-[14px] sm:text-[15px] outline-none focus:border-moss-700 dark:focus:border-[#E5C583] focus-visible:ring-1 focus-visible:ring-moss-700 dark:focus-visible:ring-[#E5C583] transition-all duration-200 hover:scale-[1.005]"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-[10px] sm:text-[11px] font-bold tracking-wider text-ink-700 dark:text-[#A3BCA7] uppercase mb-1 sm:mb-1.5"
                      >
                        Last Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 sm:h-5 sm:w-5 text-ink-400 dark:text-cream-100/40 pointer-events-none" />
                        <input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full h-[42px] sm:h-[50px] pl-10 sm:pl-11 pr-4 rounded-xl border border-ink-200 hover:border-ink-400 dark:border-white/15 dark:hover:border-white/25 bg-transparent text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-white/30 text-[14px] sm:text-[15px] outline-none focus:border-moss-700 dark:focus:border-[#E5C583] focus-visible:ring-1 focus-visible:ring-moss-700 dark:focus-visible:ring-[#E5C583] transition-all duration-200 hover:scale-[1.005]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email address */}
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
                        type="email"
                        placeholder="janedoe@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setInlineError("");
                        }}
                        className="w-full h-[42px] sm:h-[50px] pl-10 sm:pl-11 pr-4 rounded-xl border border-ink-200 hover:border-ink-400 dark:border-white/15 dark:hover:border-white/25 bg-transparent text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-white/30 text-[14px] sm:text-[15px] outline-none focus:border-moss-700 dark:focus:border-[#E5C583] focus-visible:ring-1 focus-visible:ring-moss-700 dark:focus-visible:ring-[#E5C583] transition-all duration-200 hover:scale-[1.005]"
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
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPassword(val);
                          setInlineError("");
                        }}
                        className="w-full h-[42px] sm:h-[50px] pl-10 sm:pl-11 pr-11 sm:pr-12 rounded-xl border border-ink-200 hover:border-ink-400 dark:border-white/15 dark:hover:border-white/25 bg-transparent text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-white/30 text-[14px] sm:text-[15px] outline-none focus:border-moss-700 dark:focus:border-[#E5C583] focus-visible:ring-1 focus-visible:ring-moss-700 dark:focus-visible:ring-[#E5C583] transition-all duration-200 hover:scale-[1.005]"
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

                    {/* Live Password Validation Requirements List */}
                    {password.length > 0 && (
                      <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-1.5 bg-moss-100 dark:bg-[#101F1A] border border-ink-200 dark:border-[#23372B]/60 p-2.5 sm:p-3.5 rounded-xl text-[11px] sm:text-[12px] animate-fade-in">
                        <p className="text-[10px] sm:text-[11px] font-bold text-ink-700 dark:text-[#A3BCA7] uppercase mb-1">
                          Password Requirements:
                        </p>
                        <div className="flex items-center gap-2 text-left">
                          {hasMinLength ? (
                            <Check className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <Minus className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-ink-400 dark:text-cream-100/40 shrink-0" />
                          )}
                          <span
                            className={
                              hasMinLength
                                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                : "text-ink-400 dark:text-cream-100/40"
                            }
                          >
                            At least 8 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-left">
                          {hasUppercase ? (
                            <Check className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <Minus className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-ink-400 dark:text-cream-100/40 shrink-0" />
                          )}
                          <span
                            className={
                              hasUppercase
                                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                : "text-ink-400 dark:text-cream-100/40"
                            }
                          >
                            At least 1 uppercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-left">
                          {hasNumber ? (
                            <Check className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <Minus className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-ink-400 dark:text-cream-100/40 shrink-0" />
                          )}
                          <span
                            className={
                              hasNumber
                                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                : "text-ink-400 dark:text-cream-100/40"
                            }
                          >
                            At least 1 number
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-left">
                          {hasSpecialChar ? (
                            <Check className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <Minus className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-ink-400 dark:text-cream-100/40 shrink-0" />
                          )}
                          <span
                            className={
                              hasSpecialChar
                                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                : "text-ink-400 dark:text-cream-100/40"
                            }
                          >
                            At least 1 special character
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleGoToStep3}
                  className="w-full bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#D8B672] text-white dark:text-[#0B1512] border-0 font-bold py-2 sm:py-2.5 mt-1 sm:mt-2 focus-visible:ring-2 focus-visible:ring-moss-700 dark:focus-visible:ring-white focus-visible:ring-offset-2 outline-none rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99]"
                >
                  Continue
                </Button>

                {/* Separator */}
                <div className="flex items-center gap-3 py-1.5 sm:py-3 animate-fade-in">
                  <div className="flex-1 h-px bg-auth-divider-line" />
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-ink-700 dark:text-[#A3BCA7]/50 uppercase">
                    or continue with
                  </span>
                  <div className="flex-1 h-px bg-auth-divider-line" />
                </div>

                {/* Google Authentication Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={googleLoading}
                  className="w-full h-[42px] sm:h-[50px] border border-ink-200 dark:border-white/15 bg-[#FAF8F6]/75 hover:bg-moss-100 dark:bg-[#101F1A]/30 dark:hover:bg-[#101F1A]/60 text-ink-900 dark:text-white rounded-xl flex items-center justify-center gap-3 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-moss-700 dark:focus-visible:ring-[#E5C583] disabled:opacity-50 animate-fade-in"
                >
                  {googleLoading ? (
                    <div className="h-4.5 w-4.5 sm:h-5 sm:w-5 border-2 border-auth-pill-active-bg border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="h-4.5 w-4.5 sm:h-5 sm:w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  <span className="text-[13px] sm:text-[14px] font-bold">
                    Sign up with Google
                  </span>
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 sm:space-y-6 animate-fade-in">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-normal text-ink-900 dark:text-white leading-tight flex items-center gap-2 sm:gap-3">
                    <ShieldCheck className="h-6 w-6 sm:h-8 sm:w-8 text-moss-700 dark:text-[#E5C583]" />
                    Verify ID
                  </h1>
                  <p className="text-[12px] sm:text-[13px] text-ink-700 dark:text-cream-100/70 mt-1.5 sm:mt-2">
                    We check your National Identification Number automatically in the background to ensure security and trust.
                  </p>
                </div>

                {inlineError && (
                  <div className="p-2.5 sm:p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl text-[12px] sm:text-[13px] leading-relaxed flex items-start gap-2 sm:gap-2.5 animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{inlineError}</span>
                  </div>
                )}

                {isVerifying ? (
                  <div className="space-y-3 sm:space-y-4 py-2 sm:py-4 animate-fade-in">
                    <div className="flex justify-between items-center text-[12px] sm:text-[13px] text-ink-700 dark:text-cream-100/70">
                      <span className="animate-pulse">
                        {LOADING_MESSAGES[loadingStep]}
                      </span>
                      <span className="font-bold text-moss-700 dark:text-[#E5C583]">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-moss-100 dark:bg-[#101F1A] border border-ink-200 dark:border-[#23372B]/60 h-2 sm:h-2.5 rounded-full overflow-hidden relative">
                      <div
                        className="bg-moss-700 dark:bg-[#E5C583] h-full rounded-full transition-all duration-75"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : !verified ? (
                  <form onSubmit={handleVerify} className="space-y-3 sm:space-y-4">
                    <div>
                      <label
                        htmlFor="signup-nin"
                        className="block text-[10px] sm:text-[11px] font-bold tracking-wider text-ink-700 dark:text-[#A3BCA7] uppercase mb-1 sm:mb-1.5"
                      >
                        11-Digit National Identification Number (NIN)
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 sm:h-5 sm:w-5 text-ink-400 dark:text-cream-100/40 pointer-events-none" />
                        <input
                          id="signup-nin"
                          type="text"
                          maxLength={11}
                          placeholder="12345678901"
                          value={nin}
                          onChange={(e) => {
                            setNin(e.target.value);
                            setInlineError("");
                          }}
                          required
                          className="w-full h-[42px] sm:h-[50px] pl-10 sm:pl-11 pr-4 rounded-xl border border-ink-200 hover:border-ink-400 dark:border-white/15 dark:hover:border-white/25 bg-transparent text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-white/30 text-[14px] sm:text-[15px] outline-none focus:border-moss-700 dark:focus:border-[#E5C583] focus-visible:ring-1 focus-visible:ring-moss-700 dark:focus-visible:ring-[#E5C583] transition-all duration-200 hover:scale-[1.005]"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#D8B672] text-white dark:text-[#0B1512] border-0 font-bold py-2 sm:py-2.5 mt-1 sm:mt-2 focus-visible:ring-2 focus-visible:ring-moss-700 dark:focus-visible:ring-white focus-visible:ring-offset-2 outline-none rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      Verify Now
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4 sm:space-y-6 animate-fade-in">
                    <div className="rounded-xl border border-ink-200 dark:border-[#23372B]/60 bg-[#FAF8F6]/75 dark:bg-[#101F1A]/70 p-4 sm:p-5">
                      <span className="text-[10px] sm:text-[11px] font-medium text-ink-700 dark:text-[#A3BCA7]/60">
                        DIGITAL LEDGER PREVIEW
                      </span>
                      <div className="mt-2.5 sm:mt-3 flex items-center gap-3">
                        <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-moss-100 dark:bg-[#101F1A] border border-ink-200 dark:border-[#23372B]/60 flex items-center justify-center">
                          <User className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-moss-700 dark:text-[#E5C583]" />
                        </div>
                        <div>
                          <div className="font-bold text-ink-900 dark:text-white text-[14px] sm:text-[15px]">
                            {firstName} {lastName}
                          </div>
                          <VerifiedBadge className="mt-0.5 sm:mt-1 bg-moss-100 dark:bg-[#101F1A] text-moss-700 dark:text-[#E5C583] border border-ink-200 dark:border-[#23372B]/60" />
                        </div>
                      </div>
                      <p className="mt-2.5 sm:mt-3.5 text-[11.5px] sm:text-[12.5px] text-ink-700 dark:text-cream-100/70 leading-relaxed">
                        ID verified securely. Profile record successfully
                        initialized on Lodale.
                      </p>
                    </div>

                    <Button
                      onClick={handleCompleteSignUp}
                      className="w-full bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#D8B672] text-white dark:text-[#0B1512] border-0 font-bold py-2 sm:py-2.5 mt-1 sm:mt-2 focus-visible:ring-2 focus-visible:ring-moss-700 dark:focus-visible:ring-white focus-visible:ring-offset-2 outline-none rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      Continue
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
