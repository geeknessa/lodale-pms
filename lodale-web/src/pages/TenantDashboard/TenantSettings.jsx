import { useState, useRef } from "react";
import { User, Lock, LogOut, Pencil, Calendar, ChevronDown, CheckCircle2 } from "lucide-react";
import Button from "../../components/Button";
import NigerianLocationSelect from "../../components/NigerianLocationSelect";
import "./TenantSettings.css";

export default function TenantSettings({ onSignOut }) {
  const [activeTab, setActiveTab] = useState("personal"); // "personal" | "security"

  // Load initial settings
  const [userProfile, setUserProfile] = useState(() => {
    const raw = localStorage.getItem("currentUserProfile");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    const emailKey = localStorage.getItem("lastLoggedInEmail")?.toLowerCase();
    const storedName = emailKey ? localStorage.getItem("username_" + emailKey) : null;
    const username = storedName || localStorage.getItem("username") || "";
    const parts = username.split(" ");
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
      email: localStorage.getItem("lastLoggedInEmail") || "",
      phone: "",
      address: "",
      dob: "",
      location: "",
      postalCode: ""
    };
  });

  const [gender, setGender] = useState("Male");
  const [firstName, setFirstName] = useState(userProfile.firstName || "");
  const [lastName, setLastName] = useState(userProfile.lastName || "");
  const [email, setEmail] = useState(userProfile.email || localStorage.getItem("lastLoggedInEmail") || "");
  const [address, setAddress] = useState(userProfile.address || "");
  const [phone, setPhone] = useState(userProfile.phone || "");
  const [dob, setDob] = useState(userProfile.dob || "");
  const [location, setLocation] = useState(userProfile.location || "");
  const [postalCode, setPostalCode] = useState(userProfile.postalCode || "");

  // Profile avatar states (uses User vector icon until user uploads their custom photo)
  const [avatarUrl, setAvatarUrl] = useState(() => {
    const emailKey = localStorage.getItem("lastLoggedInEmail");
    if (emailKey) {
      const savedUserAvatar = localStorage.getItem("tenantAvatar_" + emailKey.toLowerCase());
      if (savedUserAvatar && !savedUserAvatar.includes("unsplash.com")) return savedUserAvatar;
    }
    const globalSaved = localStorage.getItem("tenantAvatarUrl");
    if (globalSaved && !globalSaved.includes("unsplash.com")) return globalSaved;
    return userProfile.avatar && !userProfile.avatar.includes("unsplash.com") ? userProfile.avatar : "";
  });
  const fileInputRef = useRef(null);

  // Security form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64Data = evt.target.result;
        setAvatarUrl(base64Data);
        localStorage.setItem("tenantAvatarUrl", base64Data);
        const emailKey = email || localStorage.getItem("lastLoggedInEmail");
        if (emailKey) {
          localStorage.setItem("tenantAvatar_" + emailKey.toLowerCase(), base64Data);
        }

        const updatedProf = { ...userProfile, avatar: base64Data };
        setUserProfile(updatedProf);
        localStorage.setItem("currentUserProfile", JSON.stringify(updatedProf));

        window.dispatchEvent(new Event("storage"));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    if (activeTab === "personal") {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      localStorage.setItem("username", fullName);
      localStorage.setItem("username_" + email.trim().toLowerCase(), fullName);
      localStorage.setItem("lastLoggedInEmail", email.trim());
      localStorage.setItem("tenantAvatarUrl", avatarUrl);
      if (email) {
        localStorage.setItem("tenantAvatar_" + email.trim().toLowerCase(), avatarUrl);
      }

      const updatedProfile = {
        ...userProfile,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        address: address.trim(),
        phone: phone.trim(),
        dob: dob.trim(),
        location: location.trim(),
        postalCode: postalCode.trim(),
        avatar: avatarUrl
      };
      setUserProfile(updatedProfile);
      localStorage.setItem("currentUserProfile", JSON.stringify(updatedProfile));
      if (email) {
        localStorage.setItem("userProfile_" + email.toLowerCase(), JSON.stringify(updatedProfile));
      }
      
      // Dispatch storage event so layout header/sidebar updates
      window.dispatchEvent(new Event("storage"));
      alert("Personal information saved successfully!");
    } else {
      if (!currentPassword) {
        alert("Please enter your current password.");
        return;
      }
      if (newPassword !== confirmPassword) {
        alert("New password and confirm password do not match.");
        return;
      }
      if (newPassword.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
      }
      alert("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDiscardChanges = () => {
    if (activeTab === "personal") {
      const name = localStorage.getItem("username");
      if (name) {
        const parts = name.split(" ");
        setFirstName(parts[0]);
        setLastName(parts.length > 1 ? parts.slice(1).join(" ") : "");
      } else {
        setFirstName("Roland");
        setLastName("Donald");
      }
      setEmail(localStorage.getItem("lastLoggedInEmail") || "rolandDonald@mail.com");
      setGender("Male");
      setAddress("3605 Parker Rd.");
      setPhone("(405) 555-0128");
      setDob("1 Feb, 1995");
      setLocation("Atlanta, USA");
      setPostalCode("30301");
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    alert("Changes discarded.");
  };

  return (
    <div className="settings-page-wrapper">
      {/* 1. LEFT PANEL: Profile Summary & Section Nav */}
      <div className="settings-sidebar-card">
        <div className="settings-profile-section">
          <div className="settings-avatar-container" onClick={handleAvatarClick} title="Click to upload a new photo">
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-moss-100/70 dark:bg-[#1E382A] text-moss-700 dark:text-[#E5C583] border-4 border-neutral-200 dark:border-white/10">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-moss-700 dark:text-[#E5C583]" />
              )}
            </div>
            <div className="settings-avatar-edit-badge">
              <Pencil className="h-3 w-3" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: "none" }}
            />
          </div>
          <h3 className="settings-profile-name">{firstName} {lastName}</h3>
          <p className="settings-profile-role">Tenant</p>
        </div>

        <nav className="settings-navigation-menu">
          <button
            type="button"
            className={`settings-menu-btn ${activeTab === "personal" ? "active" : ""}`}
            onClick={() => setActiveTab("personal")}
          >
            <User className="h-4.5 w-4.5" />
            <span>Personal Information</span>
          </button>
          <button
            type="button"
            className={`settings-menu-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <Lock className="h-4.5 w-4.5" />
            <span>Login & Password</span>
          </button>
          <button type="button" className="settings-menu-btn logout-btn" onClick={onSignOut}>
            <LogOut className="h-4.5 w-4.5" />
            <span>Log Out</span>
          </button>
        </nav>
      </div>

      {/* 2. RIGHT PANEL: Active Tab Form content */}
      <div className="settings-form-panel">
        {activeTab === "personal" ? (
          <form className="settings-main-form" onSubmit={handleSaveChanges}>
            <h2 className="settings-form-title">Personal Information</h2>

            {/* Gender Selection */}
            <div className="gender-selection-row">
              <span className="gender-label">Gender</span>
              <div className="gender-options">
                <label className="gender-option">
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={gender === "Male"}
                    onChange={(e) => setGender(e.target.value)}
                    className="gender-radio-input"
                  />
                  <span className="custom-radio" />
                  <span>Male</span>
                </label>
                <label className="gender-option">
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={gender === "Female"}
                    onChange={(e) => setGender(e.target.value)}
                    className="gender-radio-input"
                  />
                  <span className="custom-radio" />
                  <span>Female</span>
                </label>
              </div>
            </div>

            {/* Input fields grid */}
            <div className="settings-inputs-grid">
              <div className="settings-form-group">
                <label className="settings-input-label">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="settings-form-input"
                  placeholder="First Name"
                  required
                />
              </div>

              <div className="settings-form-group">
                <label className="settings-input-label">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="settings-form-input"
                  placeholder="Last Name"
                  required
                />
              </div>

              <div className="settings-form-group full-width">
                <label className="settings-input-label">Email</label>
                <div className="settings-input-with-icon">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="settings-form-input email-input"
                    placeholder="email@example.com"
                    required
                  />
                  <div className="email-verified-badge">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>

              <div className="settings-form-group full-width">
                <label className="settings-input-label">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="settings-form-input"
                  placeholder="Street address"
                />
              </div>

              <div className="settings-form-group">
                <label className="settings-input-label">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="settings-form-input"
                  placeholder="Phone Number"
                />
              </div>

              <div className="settings-form-group">
                <label className="settings-input-label">Date of Birth</label>
                <div className="settings-input-with-icon">
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="settings-form-input"
                    placeholder="DD-MM-YYYY"
                  />
                  <Calendar className="input-right-icon text-ink-400" />
                </div>
              </div>

              <div className="settings-form-group">
                <label className="settings-input-label">Location</label>
                <NigerianLocationSelect
                  value={location}
                  onChange={(val) => setLocation(val)}
                  placeholder="Select Location"
                />
              </div>

              <div className="settings-form-group">
                <label className="settings-input-label">Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="settings-form-input"
                  placeholder="Postal Code"
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="settings-form-actions">
              <Button
                type="button"
                onClick={handleDiscardChanges}
                className="settings-btn settings-btn-discard"
              >
                Discard Changes
              </Button>
              <Button
                type="submit"
                className="settings-btn settings-btn-save"
              >
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          /* Login & Password Form */
          <form className="settings-main-form" onSubmit={handleSaveChanges}>
            <h2 className="settings-form-title">Login & Password</h2>

            <div className="settings-inputs-grid single-col">
              <div className="settings-form-group">
                <label className="settings-input-label">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="settings-form-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="settings-form-group">
                <label className="settings-input-label">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="settings-form-input"
                  placeholder="Min 6 characters"
                  required
                />
              </div>

              <div className="settings-form-group">
                <label className="settings-input-label">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="settings-form-input"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="settings-form-actions">
              <Button
                type="button"
                onClick={handleDiscardChanges}
                className="settings-btn settings-btn-discard"
              >
                Discard Changes
              </Button>
              <Button
                type="submit"
                className="settings-btn settings-btn-save"
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
