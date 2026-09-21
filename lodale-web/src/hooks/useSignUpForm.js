import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { gsap } from "gsap";
import { signUpSchema } from "../schemas/authSchemas";

const MOCK_NIN_NAMES = [
  "Chukwudi Emmanuel Abubakar",
  "Amina Aisha Bello",
  "Oluwaseun David Adebayo",
  "Chioma Grace Okonkwo",
  "Babajide Funsho Ogundipe",
  "Fatima Zahra Ibrahim",
];

function extractFirstAndLastName(fullName) {
  if (!fullName) return { first: "", last: "" };
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  const first = parts[0];
  const last = parts[parts.length - 1];
  return { first, last };
}

export function useSignUpForm(initialState = {}) {
  const navigate = useNavigate();

  const presetRole = initialState.presetRole ?? "tenant";
  const skipRolePicker = initialState.skipRolePicker ?? false;
  const skipWelcome = initialState.skipWelcome ?? false;
  const listingId = initialState.listingId;

  const [role, setRole] = useState(presetRole);
  const [step, setStep] = useState(skipRolePicker ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2 NIN Verification States
  const [nin, setNin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [pulledFullName, setPulledFullName] = useState("");
  const [showIdentityConfirmation, setShowIdentityConfirmation] = useState(false);
  const [verified, setVerified] = useState(false);

  // Step 3 Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Validation / Error alerts
  const [inlineError, setInlineError] = useState("");

  // Google sign up simulation state
  const [googleLoading, setGoogleLoading] = useState(false);

  // Password validation requirements
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecialChar;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function handleVerify(e) {
    if (e) e.preventDefault();
    setInlineError("");

    if (nin.length !== 11) {
      setInlineError("Invalid NIN: Please enter your complete 11-digit National Identification Number to verify your identity.");
      return;
    }

    setIsVerifying(true);
    setProgress(0);
    setLoadingStep(0);

    const targetObj = { val: 0 };
    gsap.to(targetObj, {
      val: 100,
      duration: 2.5,
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
      onComplete: () => {
        setIsVerifying(false);
        const nameIdx = Math.abs(parseInt(nin.slice(-2) || "0", 10)) % MOCK_NIN_NAMES.length;
        const pulled = MOCK_NIN_NAMES[nameIdx] || "Chukwudi Emmanuel Abubakar";
        setPulledFullName(pulled);
        setShowIdentityConfirmation(true);
      },
    });
  }

  function handleConfirmIdentity() {
    const { first, last } = extractFirstAndLastName(pulledFullName);
    setFirstName(first);
    setLastName(last);
    setVerified(true);
    setShowIdentityConfirmation(false);
    setStep(3);
  }

  function handleRejectIdentity() {
    setShowIdentityConfirmation(false);
    setVerified(false);
    setNin("");
    setInlineError("Verification reset. Please re-enter your 11-digit NIN.");
  }

  function handleGoogleSignUp() {
    setGoogleLoading(true);
    setInlineError("");

    setTimeout(() => {
      setGoogleLoading(false);
      setEmail("google.user@example.com");
      setPassword("Pass@word123!");
    }, 1000);
  }

  async function handleCompleteSignUp(e) {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setInlineError("");

    const validation = signUpSchema.safeParse({ email: email.trim(), password, agreeToTerms });
    if (!validation.success) {
      setInlineError(validation.error.issues[0].message);
      setIsSubmitting(false);
      return;
    }

    if (email.trim().toLowerCase() === "user@example.com") {
      setInlineError('Email Already Registered: An account was previously created using this email address. Please try signing in.');
      setIsSubmitting(false);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      const res = await authService.signUp({
        email: cleanEmail,
        password: cleanPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: role,
        phone: ""
      });

      sessionStorage.setItem("isAuthenticated", "true");
      sessionStorage.setItem("lastLoggedInEmail", cleanEmail);
      sessionStorage.setItem("username", cleanName);
      sessionStorage.setItem("userRole", role);
      sessionStorage.setItem("sessionExpiresAt", (Date.now() + 24 * 60 * 60 * 1000).toString());
      sessionStorage.setItem("username_" + cleanEmail, cleanName);

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
      sessionStorage.setItem("currentUserProfile", JSON.stringify(profileObj));
      sessionStorage.setItem("userProfile_" + cleanEmail, JSON.stringify(profileObj));

      if (res && res.user) {
        sessionStorage.setItem("db_user_id", res.user.id);
      }

      if (skipWelcome && listingId) {
        navigate(`/apply/${listingId}`);
      } else {
        navigate(`/dashboard/${role}`);
      }
    } catch (dbErr) {
      setInlineError(dbErr.message || "Account creation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    state: {
      role, step, isSubmitting, nin, isVerifying, progress, loadingStep,
      pulledFullName, showIdentityConfirmation, verified, firstName, lastName,
      email, password, showPassword, agreeToTerms, inlineError, googleLoading,
      hasMinLength, hasUppercase, hasNumber, hasSpecialChar, isPasswordValid, isEmailValid
    },
    actions: {
      setRole, setStep, setNin, setShowPassword, setFirstName, setLastName,
      setEmail, setPassword, setAgreeToTerms, setInlineError, setShowIdentityConfirmation,
      handleVerify, handleConfirmIdentity, handleRejectIdentity,
      handleGoogleSignUp, handleCompleteSignUp
    }
  };
}
