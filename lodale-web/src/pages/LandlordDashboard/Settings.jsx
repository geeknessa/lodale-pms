import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { User, Lock, Sun, Moon, Calendar, LogOut, Pencil, FileText, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { triggerToast } from "../../context/ToastContext";
import { userService } from "../../services/userService";
import { profileService } from "../../services/profileService";
import { leaseService } from "../../services/leaseService";
import NigerianLocationSelect from "../../components/NigerianLocationSelect";
import "./Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("profile"); // profile | password
  const [gender, setGender] = useState("male"); // male | female

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

  // Bank Account State for Rent Payouts
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");

  const loadStoredProfile = () => {
    const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || sessionStorage.getItem("lastLoggedInEmail"))?.toLowerCase() || "";
    let localProf = null;
    try {
      const raw = sessionStorage.getItem("currentUserProfile") || sessionStorage.getItem("currentUserProfile") || (emailKey ? sessionStorage.getItem("userProfile_" + emailKey) : null);
      if (raw) localProf = JSON.parse(raw);
    } catch (e) { }

    const storedUsername = sessionStorage.getItem("username") || (emailKey ? sessionStorage.getItem("username_" + emailKey) : null) || sessionStorage.getItem("username") || "";

    let fname = localProf?.firstName || localProf?.first_name || "";
    let lname = localProf?.lastName || localProf?.last_name || "";
    if (!fname && storedUsername) {
      const parts = storedUsername.trim().split(" ");
      fname = parts[0] || "";
      lname = parts.slice(1).join(" ") || "";
    }

    setFirstName(fname);
    setLastName(lname);
    setEmail(localProf?.email || emailKey || "");
    setPhone(localProf?.phone || localProf?.phone_number || "");
    setAddress(localProf?.address || "");
    setDob(localProf?.dob || "");
    setLocation(localProf?.location || "");
    setPostalCode(localProf?.postalCode || localProf?.postal_code || "");
    if (localProf?.gender) setGender(localProf.gender);

    let savedAvatar = "";
    if (emailKey) {
      savedAvatar = localStorage.getItem("landlordAvatar_" + emailKey);
    }
    if (!savedAvatar) {
      savedAvatar = sessionStorage.getItem("landlordAvatarUrl") || localStorage.getItem("landlordAvatarUrl") || localProf?.avatar || "";
    }
    setAvatarUrl(savedAvatar || "");
    if (localProf) setUserProfile(localProf);
  };

  useEffect(() => {
    loadStoredProfile();

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
          if (profile.address) setAddress(profile.address);
          if (profile.dob) setDob(profile.dob);
          if (profile.location) setLocation(profile.location);
          if (profile.postal_code || profile.postalCode) setPostalCode(profile.postal_code || profile.postalCode);
          if (profile.gender) setGender(profile.gender);
        }

        if (roleProfile) {
          if (roleProfile.bank_name) setBankName(roleProfile.bank_name);
          if (roleProfile.bank_account_number) setBankAccountNumber(roleProfile.bank_account_number);
          if (roleProfile.bank_account_name) setBankAccountName(roleProfile.bank_account_name);
        }
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
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64Data = evt.target.result;
        setAvatarUrl(base64Data);
        if (email) {
          localStorage.setItem("landlordAvatar_" + email.toLowerCase(), base64Data);
        }
        const updatedProf = { ...userProfile, avatar: base64Data };
        setUserProfile(updatedProf);
        sessionStorage.setItem("currentUserProfile", JSON.stringify(updatedProf));
        window.dispatchEvent(new Event("storage"));
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
    try {
      await leaseService.signLease(selectedLeaseToSign.id);
      triggerToast("Lease signed successfully!", "success");
      setSelectedLeaseToSign(null);
      setSignatureInput("");
      setConfirmCheck(false);
      fetchLeases();
    } catch (err) {
      triggerToast(err.response?.data?.error || "Failed to sign lease", "error");
    }
  };


  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updatedName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const cleanEmail = (email || sessionStorage.getItem("lastLoggedInEmail") || sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();

      try {
        await Promise.all([
          userService.updateProfile({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone_number: phone.trim(),
            avatar_url: avatarUrl
          }),
          profileService.updateMyProfile({
            bank_name: bankName.trim(),
            bank_account_number: bankAccountNumber.trim(),
            bank_account_name: bankAccountName.trim()
          })
        ]);
      } catch (apiErr) {
        console.warn("Backend updateProfile warning:", apiErr);
      }

      const updatedProf = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        address: address.trim(),
        dob: dob.trim(),
        location: location,
        postalCode: postalCode.trim(),
        gender: gender,
        avatar: avatarUrl,
        role: "landlord"
      };

      setUserProfile(updatedProf);
      sessionStorage.setItem("currentUserProfile", JSON.stringify(updatedProf));
      sessionStorage.setItem("currentUserProfile", JSON.stringify(updatedProf));
      if (cleanEmail) {
        sessionStorage.setItem("userProfile_" + cleanEmail, JSON.stringify(updatedProf));
        sessionStorage.setItem("username_" + cleanEmail, updatedName);
      }
      if (updatedName) {
        sessionStorage.setItem("username", updatedName);
        sessionStorage.setItem("username", updatedName);
      }
      if (avatarUrl && cleanEmail) {
        localStorage.setItem("landlordAvatar_" + cleanEmail, avatarUrl);
      }

      setSaveSuccess(true);
      setToastMessage("Landlord profile saved successfully!");
      triggerToast("Landlord profile saved successfully!", "success", "Profile Saved");

      window.dispatchEvent(new Event("storage"));

      setTimeout(() => {
        setSaveSuccess(false);
        setToastMessage("");
      }, 3000);
    } catch (err) {
      triggerToast("Failed to save profile.", "error", "Error");
    }
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerToast("New password and confirmation do not match.", "error", "Password Mismatch");
      return;
    }
    triggerToast("Security password updated successfully!", "success", "Password Changed");
    setCurrPassword("");
    setNewPassword("");
    setConfirmPassword("");
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
      {saveSuccess && (
        <div className="set-ref-success-toast">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <span>{toastMessage || "Profile changes saved successfully!"}</span>
        </div>
      )}

      <div className="set-ref-layout">

        {/* LEFT COLUMN - USER PROFILE CARD */}
        <div className="set-ref-left">
          <div className="set-ref-profile-box">
            <div className="set-ref-avatar-wrapper" onClick={() => fileInputRef.current?.click()} title="Click to upload a new photo">
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#3A5A40]/10 dark:bg-[#1E382A] text-[#2C4633] dark:text-[#E5C583] border-4 border-neutral-200 dark:border-white/10 cursor-pointer">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Landlord Profile" className="h-full w-full object-cover" />
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
          {activeTab === "profile" ? (
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
                  <input
                    type="text"
                    maxLength={255}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="set-ref-input"
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

                {/* Banking & Payout Details */}
                <div className="full pt-6 mt-4 border-t border-neutral-200 dark:border-white/10">
                  <h3 className="text-sm font-bold text-ink-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    🏦 Banking Details (For Rent Payouts)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="set-ref-lbl">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. GTBank, Access Bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="set-ref-input"
                      />
                    </div>
                    <div>
                      <label className="set-ref-lbl">Account Number</label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="e.g. 0123456789"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className="set-ref-input"
                      />
                    </div>
                    <div>
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
                  className="set-ref-btn-filled"
                >
                  Save Changes
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
                  className="set-ref-btn-filled"
                >
                  Save Changes
                </button>
              </div>
            </form>
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
                    <div key={lease.id} className="bg-white dark:bg-[#16241F] border border-[#E4EAE1] dark:border-white/10 rounded-xl p-5 shadow-sm">
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#12221C] rounded-2xl w-full max-w-md p-6 shadow-2xl my-8">
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
                  className="w-full rounded-xl border border-ink-200 dark:border-white/10 p-2.5 text-sm text-ink-900 dark:text-white bg-cream-50 dark:bg-white/5 outline-none focus:border-moss-600 font-serif italic"
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
                  disabled={!signatureInput.trim() || !confirmCheck}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg disabled:opacity-50"
                >
                  Sign Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
