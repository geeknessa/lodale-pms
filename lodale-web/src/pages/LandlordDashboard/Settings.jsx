import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { User, Lock, Sun, Moon, Calendar, LogOut, Pencil, FileText, CheckCircle2, ShieldCheck, Loader2, Settings as SettingsIcon, Award, Clock, AlertTriangle, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { triggerToast } from "../../context/ToastContext";
import { userService } from "../../services/userService";
import { profileService } from "../../services/profileService";
import { leaseService } from "../../services/leaseService";
import { reminderService } from "../../services/reminderService";
import { rentService } from "../../services/rentService";
import NigerianLocationSelect from "../../components/NigerianLocationSelect";
import "./Settings.css";
import { safeSetItem, safeSetJSON, cacheAvatarUrl } from "../../utils/safeStorage";
import { resolveAvatarUrl } from "../../utils/avatarUtils";

const ToggleSwitch = ({ checked, onChange, label }) => (
  <label className="inline-flex items-center gap-3 cursor-pointer select-none">
    {label && <span className="text-xs font-extrabold text-ink-800 dark:text-cream-100">{label}</span>}
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-emerald-600 dark:bg-[#E5C583]' : 'bg-ink-300 dark:bg-[#FFFFFF]/20'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#FFFFFF] dark:bg-[#07130D] shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </label>
);

const formatDobForDisplay = (val) => {
  if (!val) return "";
  const s = String(val).trim();
  if (!s || s.toLowerCase() === 'dd-mm-yyyy' || s.toLowerCase() === 'yyyy-mm-dd') return "";
  const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[3].padStart(2, '0')}-${isoMatch[2].padStart(2, '0')}-${isoMatch[1]}`;
  }
  const ddmmyyyy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    return `${ddmmyyyy[1].padStart(2, '0')}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[3]}`;
  }
  return s;
};

export default function Settings({ onShowReportModal }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("profile"); // profile | password | lease_settings
  const [gender, setGender] = useState("male"); // male | female

  const [reminderSettings, setReminderSettings] = useState(() => reminderService.getSettings());

  const handleReminderSettingChange = (key, value) => {
    const newSettings = { ...reminderSettings, [key]: value };
    setReminderSettings(newSettings);
    reminderService.saveSettings(newSettings);
    triggerToast("Settings saved successfully.", "success");
  };

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSigningLease, setIsSigningLease] = useState(false);

  // Landlord Name splitting with per-tab sessionStorage priority
  const [userProfile, setUserProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dob: "",
    location: "",
    postalCode: "",
    avatar: ""
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Scoped helper to define landlord fullName cleanly
  const getFullName = () => {
    return `${firstName} ${lastName}`.trim() || sessionStorage.getItem("username") || "Landlord User";
  };
  const fullName = getFullName();
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [location, setLocation] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  // Bank Account State for Rent Payouts
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [paystackSubaccountCode, setPaystackSubaccountCode] = useState("");
  const [banksList, setBanksList] = useState([]);

  const loadStoredProfile = () => {
    const rawStored = sessionStorage.getItem("currentUserProfile") || sessionStorage.getItem("landlordCurrentProfile");
    if (rawStored) {
      try {
        const p = JSON.parse(rawStored);
        if (p.first_name || p.firstName) setFirstName(p.first_name || p.firstName);
        if (p.last_name || p.lastName) setLastName(p.last_name || p.lastName);
        if (p.email) setEmail(p.email);
        if (p.phone_number || p.phone) setPhone(p.phone_number || p.phone);
        if (p.address) setAddress(p.address);
        if (p.location) setLocation(p.location);
        if (p.postal_code || p.postalCode) setPostalCode(p.postal_code || p.postalCode);
        if (p.gender) setGender(p.gender);
        if (p.date_of_birth || p.dob) setDob(formatDobForDisplay(p.date_of_birth || p.dob));
        if (p.bank_name) setBankName(p.bank_name);
        if (p.bank_account_number) setBankAccountNumber(p.bank_account_number);
        if (p.bank_account_name) setBankAccountName(p.bank_account_name);
        const isStoredLinked = Boolean(p.paystackLinked !== false && p.paystack_subaccount_code);
        setPaystackSubaccountCode(isStoredLinked ? p.paystack_subaccount_code : "");
        if (p.avatar_url || p.avatar) setAvatarUrl(p.avatar_url || p.avatar);
      } catch (e) {}
    } else {
      const storedUsername = sessionStorage.getItem("username") || "Landlord User";
      if (storedUsername) {
        const parts = storedUsername.trim().split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
      }
    }
  };

  useEffect(() => {
    loadStoredProfile();

    rentService.getBanks().then((banks) => {
      if (Array.isArray(banks) && banks.length > 0) {
        setBanksList(banks);
      }
    });

    async function fetchProfile() {
      try {
        const [profile, roleProfile] = await Promise.all([
          userService.getProfile(),
          profileService.getMyProfile()
        ]);

        if (profile) {
          setUserProfile(profile);
          if (profile.first_name) setFirstName(profile.first_name);
          if (profile.last_name) setLastName(profile.last_name);
          if (profile.email) setEmail(profile.email);
          if (profile.phone_number || profile.phone) setPhone(profile.phone_number || profile.phone);
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        }

        if (roleProfile) {
          if (roleProfile.address) setAddress(roleProfile.address);
          if (roleProfile.location) setLocation(roleProfile.location);
          if (roleProfile.postal_code || roleProfile.postalCode) setPostalCode(roleProfile.postal_code || roleProfile.postalCode);
          if (roleProfile.gender) setGender(roleProfile.gender);
          if (roleProfile.date_of_birth || roleProfile.dob) setDob(formatDobForDisplay(roleProfile.date_of_birth || roleProfile.dob));
          if (roleProfile.bank_name) setBankName(roleProfile.bank_name);
          if (roleProfile.bank_account_number) setBankAccountNumber(roleProfile.bank_account_number);
          if (roleProfile.bank_account_name) setBankAccountName(roleProfile.bank_account_name);
          const isRoleLinked = Boolean(roleProfile.paystackLinked !== false && roleProfile.paystack_subaccount_code);
          setPaystackSubaccountCode(isRoleLinked ? roleProfile.paystack_subaccount_code : "");
        }

        const merged = {
          ...(profile || {}),
          ...(roleProfile || {}),
          firstName: profile?.first_name || firstName,
          lastName: profile?.last_name || lastName,
          first_name: profile?.first_name || firstName,
          last_name: profile?.last_name || lastName,
          phone: profile?.phone_number || phone,
          phone_number: profile?.phone_number || phone,
          address: roleProfile?.address || profile?.address || address || "",
          location: roleProfile?.location || location || "",
          postalCode: roleProfile?.postal_code || roleProfile?.postalCode || postalCode || "",
          postal_code: roleProfile?.postal_code || roleProfile?.postalCode || postalCode || "",
          gender: roleProfile?.gender || gender || "male",
          dob: formatDobForDisplay(roleProfile?.date_of_birth || roleProfile?.dob || dob),
          date_of_birth: roleProfile?.date_of_birth || roleProfile?.dob || dob,
          bank_name: roleProfile?.bank_name || bankName,
          bank_account_number: roleProfile?.bank_account_number || bankAccountNumber,
          bank_account_name: roleProfile?.bank_account_name || bankAccountName,
          paystack_subaccount_code: roleProfile?.paystack_subaccount_code || null,
          paystackSubaccountCode: roleProfile?.paystack_subaccount_code || null,
          paystackLinked: Boolean(roleProfile?.paystack_subaccount_code),
          avatar: profile?.avatar_url || avatarUrl,
          avatar_url: profile?.avatar_url || avatarUrl,
          role: "landlord",
          primary_role: "landlord"
        };
        safeSetJSON("session", "currentUserProfile", merged);
        safeSetJSON("session", "landlordCurrentProfile", merged);
      } catch (err) {
        console.warn("Failed to fetch landlord profile", err);
      }
    }
    fetchProfile();
  }, []);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        triggerToast("Image file is too large (max 10MB).", "error", "Upload Failed");
        return;
      }
      if (!file.type.startsWith('image/')) {
        triggerToast("Invalid file type. Please select an image.", "error", "Upload Failed");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const base64Data = evt.target.result;
        setAvatarLoadError(false);
        setAvatarUrl(base64Data);

        try {
          const uploadedUrl = await profileService.uploadAvatar(base64Data);
          const finalUrl = uploadedUrl || base64Data;
          setAvatarUrl(finalUrl);

          const updatedProf = { ...userProfile, avatar: finalUrl, avatar_url: finalUrl };
          setUserProfile(updatedProf);

          cacheAvatarUrl("session", "landlordAvatarUrl", finalUrl);
          cacheAvatarUrl("local", "landlordAvatarUrl", finalUrl);

          const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || email || "").toLowerCase();
          if (emailKey) {
            cacheAvatarUrl("local", "landlordAvatar_" + emailKey, finalUrl);
          }

          window.dispatchEvent(new CustomEvent("landlordProfileUpdated", { detail: { avatar: finalUrl } }));
          window.dispatchEvent(new Event("storage"));

          triggerToast("Profile picture uploaded successfully!", "success", "Photo Updated");
        } catch (uploadErr) {
          console.error("Failed to upload avatar:", uploadErr);
          triggerToast(uploadErr.message || "Failed to upload avatar.", "error", "Upload Failed");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Password States
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [returnAction, setReturnAction] = useState("");

  // Leases State
  const [leases, setLeases] = useState([]);
  const [selectedLeaseToSign, setSelectedLeaseToSign] = useState(null);
  const [signatureInput, setSignatureInput] = useState("");
  const [confirmCheck, setConfirmCheck] = useState(false);

  useEffect(() => {
    fetchLeases();
  }, [activeTab]);

  const fetchLeases = async () => {
    try {
      const data = await leaseService.getMyLeases();
      setLeases(data);
    } catch (err) {
      console.error("Failed to fetch leases", err);
    }
  };

  const handleSignLease = async () => {
    if (!signatureInput.trim() || !confirmCheck) {
      triggerToast("Please provide your signature and check the confirmation box.", "warning");
      return;
    }
    if (isSigningLease) return;
    setIsSigningLease(true);
    try {
      await leaseService.signLease(selectedLeaseToSign.id);
      triggerToast("Lease signed successfully!", "success");
      setSelectedLeaseToSign(null);
      setSignatureInput("");
      setConfirmCheck(false);
      fetchLeases();
    } catch (err) {
      triggerToast(err.response?.data?.error || "Failed to sign lease", "error");
    } finally {
      setIsSigningLease(false);
    }
  };


  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (isSavingProfile) return;
    setIsSavingProfile(true);
    try {
      const updatedName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const cleanEmail = (email || sessionStorage.getItem("lastLoggedInEmail") || sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();

      let roleRes = null;
      try {
        const [, rRes] = await Promise.all([
          userService.updateProfile({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone_number: phone.trim(),
            avatar_url: avatarUrl
          }),
          profileService.updateMyProfile({
            bank_name: bankName.trim(),
            bank_account_number: bankAccountNumber.trim(),
            bank_account_name: bankAccountName.trim(),
            address: address.trim(),
            gender: gender || null,
            date_of_birth: dob && dob.trim() !== 'DD-MM-YYYY' ? dob.trim() : null,
            location: (location || '').trim(),
            postal_code: (postalCode || '').trim()
          })
        ]);
        roleRes = rRes;
      } catch (apiErr) {
        console.warn("Backend updateProfile warning:", apiErr);
      }

      const isLinked = Boolean(roleRes?.paystackLinked ?? roleRes?.subaccount_linked);
      const subCode = isLinked ? (roleRes?.paystackSubaccountCode || roleRes?.profile?.paystack_subaccount_code || roleRes?.paystack_subaccount_code) : null;
      const payErr = roleRes?.paystackError || roleRes?.payout_error || roleRes?.profile?.paystackError;

      if (isLinked && subCode) {
        setPaystackSubaccountCode(subCode);
      } else {
        setPaystackSubaccountCode("");
      }

      const hasBankInput = Boolean(bankName.trim() || bankAccountNumber.trim());

      if (hasBankInput && !isLinked) {
        const errorMsg = payErr || "Could not link payout account with Paystack. Please check your bank and 10-digit NUBAN.";
        triggerToast(`Bank saved but payout account could not be linked: ${errorMsg}`, "error", "Payout Setup Notice");
        setSaveSuccess(false);
      } else if (hasBankInput && isLinked) {
        triggerToast("Profile saved and Paystack payout account linked.", "success", "Payout Account Linked");
        setSaveSuccess(true);
      } else {
        triggerToast("Profile updated successfully.", "success", "Profile Saved");
        setSaveSuccess(true);
      }

      const updatedProf = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        phone_number: phone.trim(),
        address: address.trim(),
        dob: dob.trim(),
        location: location,
        postalCode: postalCode.trim(),
        postal_code: postalCode.trim(),
        gender: gender,
        bank_name: bankName.trim(),
        bank_account_number: bankAccountNumber.trim(),
        bank_account_name: bankAccountName.trim(),
        paystack_subaccount_code: isLinked && subCode ? subCode : null,
        paystackSubaccountCode: isLinked && subCode ? subCode : null,
        paystackLinked: isLinked,
        avatar: avatarUrl,
        avatar_url: avatarUrl,
        role: "landlord",
        primary_role: "landlord"
      };

      setUserProfile(updatedProf);
      safeSetJSON("session", "currentUserProfile", updatedProf);
      safeSetJSON("session", "landlordCurrentProfile", updatedProf);
      if (cleanEmail) {
        safeSetJSON("session", "userProfile_" + cleanEmail, updatedProf);
        safeSetJSON("local", `landlordProfile_${cleanEmail}`, updatedProf);
      }
      if (updatedName) {
        safeSetItem("session", "username", updatedName);
      }

      const returnDest = sessionStorage.getItem("returnAfterProfileComplete");
      if (returnDest) {
        setReturnAction(returnDest);
        setShowCompletionModal(true);
      } else {
        if (!hasBankInput || isLinked) {
          setSaveSuccess(true);
          setToastMessage("Landlord profile saved successfully!");
        } else {
          setSaveSuccess(false);
          setToastMessage("");
        }
        if (sessionStorage.getItem("isNewSignUpProfileComplete") === "true") {
          sessionStorage.removeItem("isNewSignUpProfileComplete");
          setTimeout(() => {
            window.dispatchEvent(new Event("startLandlordTour"));
          }, 500);
        }

        setTimeout(() => {
          setSaveSuccess(false);
          setToastMessage("");
        }, 3000);
      }
    } catch (err) {
      triggerToast("Failed to save profile.", "error", "Error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (isSavingPassword) return;
    if (!currPassword) {
      triggerToast("Please enter your current password.", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast("New password and confirmation do not match.", "error", "Password Mismatch");
      return;
    }
    if (newPassword.length < 6) {
      triggerToast("Password must be at least 6 characters long.", "warning");
      return;
    }

    setIsSavingPassword(true);
    try {
      await userService.changePassword(currPassword, newPassword);
      triggerToast("Security password updated successfully!", "success", "Password Changed");
      setCurrPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      triggerToast(err.message || err.error || "Failed to update password", "error");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDiscardProfile = () => {
    loadStoredProfile();
    triggerToast("Unsaved profile changes discarded.", "info", "Form Reset");
  };

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      sessionStorage.removeItem("isAuthenticated");
      sessionStorage.removeItem("sessionExpiresAt");
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("userRole");
      sessionStorage.removeItem("isAuthenticated");
      sessionStorage.removeItem("sessionExpiresAt");
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("userRole");
      window.dispatchEvent(new Event("storage"));
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="set-ref-container">
      {showCompletionModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#192A1F] rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-ink-900 dark:text-white">Profile Complete!</h3>
            <p className="text-sm text-ink-600 dark:text-cream-100/70">Your profile has been saved successfully. You are now ready to continue.</p>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  sessionStorage.removeItem("returnAfterProfileComplete");
                  if (returnAction === "add_property") {
                    navigate("/dashboard/landlord/add-property");
                  }
                }}
                className="w-full py-2.5 bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#d4b574] text-white dark:text-[#09090b] font-bold rounded-xl transition-all cursor-pointer"
              >
                {returnAction === "add_property" ? "Continue to Add Property" : "Continue"}
              </button>
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  sessionStorage.removeItem("returnAfterProfileComplete");
                }}
                className="w-full py-2.5 text-ink-600 dark:text-cream-100/70 font-bold hover:underline cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="set-ref-success-toast">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <span>{toastMessage || "Profile changes saved successfully!"}</span>
        </div>
      )}

      {/* Landlord Profile Completeness Guidance Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/50">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                Landlord Settings & Portfolio Verification
              </h4>
              <p className="text-xs text-amber-700/80 dark:text-amber-200/70 mt-1 leading-relaxed max-w-2xl">
                You can always return to <strong>Settings</strong> anytime to update your account details. 
                Please note: <strong>You must complete your required profile fields to manage listings and receive tenant applications.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="set-ref-layout">

        {/* LEFT COLUMN - USER PROFILE CARD */}
        <div className="set-ref-left">
          <div className="set-ref-profile-box">
            <div className="set-ref-avatar-wrapper" onClick={() => fileInputRef.current?.click()} title="Click to upload a new photo">
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#3A5A40]/10 dark:bg-[#07130D] text-[#2C4633] dark:text-[#E5C583] border-4 border-neutral-200 dark:border-white/10 cursor-pointer font-bold text-xl">
                {avatarUrl && !avatarLoadError ? (
                  <img 
                    src={resolveAvatarUrl(avatarUrl)} 
                    alt="" 
                    className="h-full w-full object-cover" 
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      setAvatarLoadError(true);
                    }} 
                  />
                ) : (firstName || lastName) ? (
                  <span className="select-none tracking-wider font-extrabold text-[#2C4633] dark:text-[#E5C583]">
                    {`${(firstName || "").charAt(0)}${(lastName || "").charAt(0)}`.toUpperCase() || "L"}
                  </span>
                ) : (
                  <User className="h-10 w-10 text-[#2C4633] dark:text-[#E5C583]" />
                )}
              </div>
              <button type="button" className="set-ref-edit-badge" aria-label="Edit Profile Avatar">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
              />
            </div>

            <h2 className="set-ref-profile-name">{fullName}</h2>
            <p className="set-ref-profile-role">Landlord</p>
          </div>

          <div className="set-ref-menu">
            <button
              type="button"
              className={`set-ref-menu-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <User className="h-4.5 w-4.5" />
              <span>Personal Information</span>
            </button>

            <button
              type="button"
              className={`set-ref-menu-item ${activeTab === "password" ? "active" : ""}`}
              onClick={() => setActiveTab("password")}
            >
              <Lock className="h-4.5 w-4.5" />
              <span>Login & Password</span>
            </button>

            <button
              type="button"
              className={`set-ref-menu-item ${activeTab === "document" ? "active" : ""}`}
              onClick={() => setActiveTab("document")}
            >
              <FileText className="h-4.5 w-4.5" />
              <span>Leases & Documents</span>
            </button>

            <button
              type="button"
              className={`set-ref-menu-item ${activeTab === "reports" ? "active" : ""}`}
              onClick={() => setActiveTab("reports")}
            >
              <Calendar className="h-4.5 w-4.5" />
              <span>Portfolio Reports</span>
            </button>

            <button
              type="button"
              className={`set-ref-menu-item ${activeTab === "lease_settings" ? "active" : ""}`}
              onClick={() => setActiveTab("lease_settings")}
            >
              <SettingsIcon className="h-4.5 w-4.5" />
              <span>Lease & Tenant Settings</span>
            </button>

            <button
              type="button"
              className="set-ref-menu-item logout"
              onClick={handleSignOut}
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN - DETAIL FORM CARD */}
        <div className="set-ref-right">
          {activeTab === "reports" ? (
            <div className="set-ref-form space-y-6">
              <div>
                <h1 className="set-ref-title">Portfolio Reports</h1>
                <p className="text-xs text-neutral-500 dark:text-cream-100/70 mt-1">
                  Generate and download printable property summaries, tenant payment tracking reports, and financial performance statements.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-cream-50/60 dark:bg-[#FFFFFF]/5 border border-moss-700/20 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-ink-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-moss-700 dark:text-[#E5C583]" />
                    Export Portfolio Report
                  </h3>
                  <p className="text-xs text-ink-500 dark:text-cream-100/60 max-w-md leading-relaxed">
                    Create customized PDF statements for rent receipts, occupied units, active leases, and overdue payments.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onShowReportModal && onShowReportModal()}
                  className="px-5 py-2.5 bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#d4b371] text-white dark:text-[#09090b] font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2 shrink-0 active:scale-95"
                >
                  <FileText className="h-4 w-4" />
                  <span>Create & Export Report</span>
                </button>
              </div>
            </div>
          ) : activeTab === "profile" ? (
            <form onSubmit={handleSaveProfile} className="set-ref-form">
              <h1 className="set-ref-title">Personal Information</h1>

              {/* Gender radio selectors */}
              <div className="set-ref-gender-row">
                <label className="set-ref-radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === "male"}
                    onChange={() => setGender("male")}
                    className="set-ref-radio-input"
                  />
                  <span className="set-ref-custom-radio" />
                  <span>Male</span>
                </label>

                <label className="set-ref-radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === "female"}
                    onChange={() => setGender("female")}
                    className="set-ref-radio-input"
                  />
                  <span className="set-ref-custom-radio" />
                  <span>Female</span>
                </label>
              </div>

              {/* Form Input fields */}
              <div className="set-ref-grid">

                <div className="set-ref-input-group">
                  <label className="set-ref-lbl">First Name</label>
                  <input
                    type="text"
                    maxLength={50}
                    value={firstName}
                    onInput={(e) => e.target.value = e.target.value.replace(/[0-9]/g, '')}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="set-ref-input"
                    required
                  />
                </div>

                <div className="set-ref-input-group">
                  <label className="set-ref-lbl">Last Name</label>
                  <input
                    type="text"
                    maxLength={50}
                    value={lastName}
                    onInput={(e) => e.target.value = e.target.value.replace(/[0-9]/g, '')}
                    onChange={(e) => setLastName(e.target.value)}
                    className="set-ref-input"
                    required
                  />
                </div>

                <div className="set-ref-input-group full">
                  <label className="set-ref-lbl">Email</label>
                  <div className="set-ref-input-wrapper">
                    <input
                      type="email"
                      maxLength={100}
                      value={email}
                      disabled
                      className="set-ref-input email-disabled"
                    />
                    <div className="set-ref-verified-badge">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>

                <div className="set-ref-input-group full">
                  <label className="set-ref-lbl">Address</label>
                  <textarea
                    rows={2}
                    maxLength={255}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="set-ref-input resize-none py-2.5 min-h-[60px]"
                    style={{ fieldSizing: "content" }}
                  />
                </div>

                <div className="set-ref-input-group">
                  <label className="set-ref-lbl">Postal Code</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="set-ref-input"
                    placeholder="e.g. 100001"
                  />
                </div>

                {/* Banking & Payout Details (Default Account for Rent Invoices) */}
                <div className="set-ref-input-group full pt-6 mt-4 border-t border-neutral-200 dark:border-white/10">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-ink-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-moss-700 dark:text-[#E5C583]" />
                      Paystack Payout & Banking Details
                    </h3>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-cream-100 border border-emerald-500/20">
                      Automated Split Payouts
                    </span>
                  </div>

                  {/* Paystack Subaccount Status State */}
                  {paystackSubaccountCode ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-500/30 flex items-start sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-start sm:items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-[#E5C583] shrink-0 mt-0.5 sm:mt-0">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-950 dark:text-emerald-100">Paystack Payout Account Linked</span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                              Verified Active
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                            Official tenant rent payments will automatically route 96.5% to this account, with the 3.5% Lodale platform fee split seamlessly.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-500/30 flex items-start sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-start sm:items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5 sm:mt-0">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-amber-950 dark:text-amber-100">Payout Account Setup Required</span>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                            Enter your Nigerian bank name and 10-digit NUBAN account number below. Saving will automatically link and verify your account on Paystack so tenants can pay rent online.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                    <div className="set-ref-input-group">
                      <label className="set-ref-lbl">Bank Name</label>
                      <input
                        type="text"
                        list="paystack-banks-list"
                        placeholder="e.g. Guaranty Trust Bank, Access Bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="set-ref-input"
                      />
                      <datalist id="paystack-banks-list">
                        {banksList.map((b) => (
                          <option key={b.code} value={b.name} />
                        ))}
                      </datalist>
                    </div>
                    <div className="set-ref-input-group">
                      <label className="set-ref-lbl">Account Number (10 Digits)</label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="e.g. 0123456789"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className="set-ref-input font-mono"
                      />
                    </div>
                    <div className="set-ref-input-group">
                      <label className="set-ref-lbl">Account Name</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe Enterprises"
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value)}
                        className="set-ref-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="set-ref-input-group">
                  <label className="set-ref-lbl">Phone Number</label>
                  <input
                    type="tel"
                    maxLength={15}
                    value={phone}
                    onInput={(e) => e.target.value = e.target.value.replace(/[^0-9+]/g, '')}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                    className="set-ref-input"
                    placeholder="e.g. +2348012345678"
                  />
                </div>

                <div className="set-ref-input-group">
                  <label className="set-ref-lbl">Date of Birth</label>
                  <div className="set-ref-input-wrapper">
                    <input
                      type="text"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="set-ref-input"
                      placeholder="e.g. 15 Jan 1990"
                    />
                    <Calendar className="set-ref-input-icon right" />
                  </div>
                </div>

                <div className="set-ref-input-group">
                  <label className="set-ref-lbl">Location</label>
                  <NigerianLocationSelect
                    value={location}
                    onChange={(val) => setLocation(val)}
                    placeholder="Select Location"
                  />
                </div>

                <div className="set-ref-input-group">
                  <label className="set-ref-lbl">Postal Code</label>
                  <input
                    type="text"
                    maxLength={20}
                    value={postalCode}
                    onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                    onChange={(e) => setPostalCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="set-ref-input"
                    placeholder="e.g. 100001"
                  />
                </div>

                <div className="set-ref-input-group">
                  <label className="set-ref-lbl">Theme Mode</label>
                  <div className="set-ref-theme-toggle-row">
                    <button
                      type="button"
                      className={`set-ref-theme-toggle-btn ${theme === "light" ? "active" : ""}`}
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </button>
                    <button
                      type="button"
                      className={`set-ref-theme-toggle-btn ${theme === "dark" ? "active" : ""}`}
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Form buttons */}
              <div className="set-ref-buttons-row">
                <button
                  type="button"
                  onClick={handleDiscardProfile}
                  className="set-ref-btn-outline"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="set-ref-btn-filled flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>

            </form>
          ) : activeTab === "password" ? (
            <form onSubmit={handleSavePassword} className="set-ref-form">
              <h1 className="set-ref-title">Login & Password</h1>

              <div className="set-ref-grid password-layout">
                <div className="set-ref-input-group full">
                  <label className="set-ref-lbl">Current Password</label>
                  <input
                    type="password"
                    maxLength={128}
                    placeholder="Enter current account password"
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    className="set-ref-input"
                    required
                  />
                </div>

                <div className="set-ref-input-group full">
                  <label className="set-ref-lbl">New Password</label>
                  <input
                    type="password"
                    maxLength={128}
                    placeholder="Enter secure new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="set-ref-input"
                    required
                  />
                </div>

                <div className="set-ref-input-group full">
                  <label className="set-ref-lbl">Confirm New Password</label>
                  <input
                    type="password"
                    maxLength={128}
                    placeholder="Confirm secure new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="set-ref-input"
                    required
                  />
                </div>
              </div>

              <div className="set-ref-buttons-row">
                <button
                  type="button"
                  onClick={() => {
                    setCurrPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="set-ref-btn-outline"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="set-ref-btn-filled flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          ) : activeTab === "lease_settings" ? (
            <div className="set-ref-form space-y-6">
              <div>
                <h1 className="set-ref-title">Lease & Tenant Settings</h1>
                <p className="text-xs text-neutral-500 dark:text-cream-100/70 mt-1 mb-6">
                  Manage how your leases renew, configure tenant rewards, and set late fee rules.
                </p>
              </div>

              {/* Reward Good Tenants */}
              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-ink-900 dark:text-amber-100">Reward Good Tenants</h3>
                      <p className="text-[11.5px] text-ink-600 dark:text-amber-200/70 mt-1 leading-relaxed max-w-lg">
                        Turning this on will automatically give a <strong>Gold Star</strong> to tenants who always pay their rent on time. It also allows you to easily offer them a discount when their lease is up for renewal.
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch 
                    checked={reminderSettings.loyaltyRewardsEnabled} 
                    onChange={() => handleReminderSettingChange("loyaltyRewardsEnabled", !reminderSettings.loyaltyRewardsEnabled)} 
                  />
                </div>
              </div>

              {/* Lease Renewal Window */}
              <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 mt-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="w-full">
                    <h3 className="font-extrabold text-sm text-ink-900 dark:text-indigo-100">When should we ask the tenant if they are staying?</h3>
                    <p className="text-[11.5px] text-ink-600 dark:text-indigo-200/70 mt-1 leading-relaxed max-w-lg mb-4">
                      Choose how many days before the lease ends that the system should ask the tenant if they plan to renew or move out.
                    </p>
                    <div className="flex items-center gap-3">
                      <select
                        value={[30, 45, 60, 90].includes(reminderSettings.autoNudgeDays) ? reminderSettings.autoNudgeDays : "custom"}
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            handleReminderSettingChange("autoNudgeDays", 15);
                          } else {
                            handleReminderSettingChange("autoNudgeDays", parseInt(e.target.value));
                          }
                        }}
                        className="w-full max-w-[200px] p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-[#FFFFFF] dark:bg-indigo-950/50 text-xs font-bold text-ink-900 dark:text-indigo-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value={30}>30 Days before end</option>
                        <option value={45}>45 Days before end</option>
                        <option value={60}>60 Days before end</option>
                        <option value={90}>90 Days before end</option>
                        <option value="custom">Custom...</option>
                      </select>
                      
                      {![30, 45, 60, 90].includes(reminderSettings.autoNudgeDays) && (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="1"
                            value={reminderSettings.autoNudgeDays}
                            onChange={(e) => handleReminderSettingChange("autoNudgeDays", parseInt(e.target.value) || 0)}
                            className="w-20 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-[#FFFFFF] dark:bg-indigo-950/50 text-xs font-bold text-ink-900 dark:text-indigo-100 focus:outline-none focus:border-indigo-500 text-center"
                          />
                          <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300">Days</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Late Fee Policy */}
              <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 mt-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="w-full">
                    <h3 className="font-extrabold text-sm text-ink-900 dark:text-rose-100">Set Late Fees</h3>
                    <p className="text-[11.5px] text-ink-600 dark:text-rose-200/70 mt-1 leading-relaxed max-w-lg mb-4">
                      Set up automatic penalties for late rent. This creates a new invoice for the tenant if they miss the grace period.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10.5px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider mb-1.5">Grace Period (Days)</label>
                        <input
                          type="number"
                          value={reminderSettings.gracePeriodDays}
                          onChange={(e) => handleReminderSettingChange("gracePeriodDays", parseInt(e.target.value) || 0)}
                          className="w-full p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-[#FFFFFF] dark:bg-rose-950/50 text-xs font-bold text-ink-900 dark:text-rose-100 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider mb-1.5">Late Fee Type</label>
                        <select
                          value={reminderSettings.lateFeeType}
                          onChange={(e) => handleReminderSettingChange("lateFeeType", e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-[#FFFFFF] dark:bg-rose-950/50 text-xs font-bold text-ink-900 dark:text-rose-100 focus:outline-none focus:border-rose-500"
                        >
                          <option value="flat">Flat Amount (₦)</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10.5px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider mb-1.5">Late Fee Amount</label>
                        <input
                          type="number"
                          value={reminderSettings.lateFeeAmount}
                          onChange={(e) => handleReminderSettingChange("lateFeeAmount", parseInt(e.target.value) || 0)}
                          className="w-full p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-[#FFFFFF] dark:bg-rose-950/50 text-xs font-bold text-ink-900 dark:text-rose-100 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="set-ref-form">
              <h1 className="set-ref-title">Leases & Legal Documents</h1>
              <p className="doc-gen-subtitle text-xs text-ink-500 dark:text-cream-100/60 -mt-2.5 mb-4">
                View and sign your generated tenancy agreements.
              </p>

              {leases.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-ink-400">
                  <FileText className="h-12 w-12 mb-3 opacity-50" />
                  <p>No leases found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leases.map(lease => (
                    <div key={lease.id} className="bg-[#FFFFFF] dark:bg-[#07130D] border border-[#E4EAE1] dark:border-white/10 rounded-xl p-5 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-ink-900 dark:text-white">{lease.property_title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${lease.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          lease.landlord_signed_at ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                          {lease.status === 'active' ? 'Active' : lease.landlord_signed_at ? 'Pending Tenant' : 'Needs Your Signature'}
                        </span>
                      </div>
                      <p className="text-xs text-ink-600 mb-1">Tenant: <strong>{lease.tenant_name}</strong></p>
                      <p className="text-xs text-ink-600 mb-3">Rent: <strong>₦{parseFloat(lease.rent_amount).toLocaleString()} {lease.rent_period}</strong></p>

                      {!lease.landlord_signed_at ? (
                        <button
                          onClick={() => setSelectedLeaseToSign(lease)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg"
                        >
                          Sign Lease
                        </button>
                      ) : (
                        <button disabled className="w-full py-2 bg-ink-100 text-ink-500 font-bold text-sm rounded-lg">
                          Signed on {new Date(lease.landlord_signed_at).toLocaleDateString()}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Signing Modal */}
      {selectedLeaseToSign && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#FFFFFF] dark:bg-[#07130D] rounded-2xl w-full max-w-md p-6 shadow-2xl my-8">
            <h3 className="text-xl font-bold text-ink-900 dark:text-white mb-1 flex items-center gap-2">
              <Lock className="h-5 w-5 text-moss-600" /> Sign Lease Agreement
            </h3>
            <p className="text-sm text-ink-500 mb-6">
              You are electronically signing the lease for <strong>{selectedLeaseToSign.property_title}</strong> with <strong>{selectedLeaseToSign.tenant_name}</strong>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-100 mb-1">Digital Signature (Type your full name)</label>
                <input
                  type="text"
                  placeholder="e.g. Engr. Clement Okoro"
                  value={signatureInput}
                  onChange={(e) => setSignatureInput(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 dark:border-white/10 p-2.5 text-sm text-ink-900 dark:text-white bg-cream-50 dark:bg-[#FFFFFF]/5 outline-none focus:border-moss-600 font-serif italic"
                />
              </div>
              <label className="flex items-start gap-2 text-xs text-ink-700 dark:text-cream-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmCheck}
                  onChange={(e) => setConfirmCheck(e.target.checked)}
                  className="mt-0.5 rounded text-moss-600 focus:ring-moss-500"
                />
                <span className="leading-relaxed">I agree to be legally bound by this electronic signature, which carries the same legal weight as a physical signature on a paper document.</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-ink-100 dark:border-white/10 mt-4">
                <button
                  onClick={() => { setSelectedLeaseToSign(null); setSignatureInput(""); setConfirmCheck(false); }}
                  className="px-4 py-2 font-bold text-sm text-ink-600 hover:bg-ink-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignLease}
                  disabled={!signatureInput.trim() || !confirmCheck || isSigningLease}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSigningLease ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      <span>Signing Document...</span>
                    </>
                  ) : (
                    "Sign Document"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
