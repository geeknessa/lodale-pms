import { useState, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { User, Lock, LogOut, Calendar, ChevronDown, CheckCircle2, Camera, Pencil, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NigerianLocationSelect from "../../components/NigerianLocationSelect";
import "./Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("profile"); // profile | password
  const [gender, setGender] = useState("male"); // male | female

  // Landlord Name splitting
  const [userProfile, setUserProfile] = useState(() => {
    const raw = localStorage.getItem("currentUserProfile");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) { }
    }
    const username = localStorage.getItem("username") || "";
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

  const [firstName, setFirstName] = useState(userProfile.firstName || "");
  const [lastName, setLastName] = useState(userProfile.lastName || "");
  const fullName = `${firstName} ${lastName}`.trim() || localStorage.getItem("username") || "Landlord User";
  const [email] = useState(userProfile.email || localStorage.getItem("lastLoggedInEmail") || "");
  const [address, setAddress] = useState(userProfile.address || "");
  const [phone, setPhone] = useState(userProfile.phone || "");
  const [dob, setDob] = useState(userProfile.dob || "");
  const [location, setLocation] = useState(userProfile.location || "");
  const [postalCode, setPostalCode] = useState(userProfile.postalCode || "");

  // Landlord profile avatar states (uses User icon by default until user uploads custom photo)
  const [avatarUrl, setAvatarUrl] = useState(() => {
    const emailKey = localStorage.getItem("lastLoggedInEmail");
    if (emailKey) {
      const savedUserAvatar = localStorage.getItem("landlordAvatar_" + emailKey.toLowerCase());
      if (savedUserAvatar && !savedUserAvatar.includes("unsplash.com")) return savedUserAvatar;
    }
    const globalSaved = localStorage.getItem("landlordAvatarUrl");
    if (globalSaved && !globalSaved.includes("unsplash.com")) return globalSaved;
    return userProfile.avatar && !userProfile.avatar.includes("unsplash.com") ? userProfile.avatar : "";
  });
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64Data = evt.target.result;
        setAvatarUrl(base64Data);
        localStorage.setItem("landlordAvatarUrl", base64Data);
        if (email) {
          localStorage.setItem("landlordAvatar_" + email.toLowerCase(), base64Data);
        }
        const updatedProf = { ...userProfile, avatar: base64Data };
        setUserProfile(updatedProf);
        localStorage.setItem("currentUserProfile", JSON.stringify(updatedProf));
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

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updatedName = `${firstName} ${lastName}`.trim();
    localStorage.setItem("username", updatedName);

    const updatedProfile = {
      ...userProfile,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      address: address.trim(),
      phone: phone.trim(),
      dob: dob.trim(),
      location: location.trim(),
      postalCode: postalCode.trim()
    };
    setUserProfile(updatedProfile);
    localStorage.setItem("currentUserProfile", JSON.stringify(updatedProfile));
    if (email) {
      localStorage.setItem("userProfile_" + email.toLowerCase(), JSON.stringify(updatedProfile));
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match.");
      return;
    }
    alert("Password updated successfully!");
    setCurrPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleDiscardProfile = () => {
    const origName = localStorage.getItem("username") || fullName;
    const origNames = origName.split(" ");
    setFirstName(origNames[0] || "");
    setLastName(origNames.slice(1).join(" ") || "");
    setAddress("3605 Parker Rd.");
    setPhone("(405) 555-0128");
    setDob("1 Feb, 1995");
    setLocation("Atlanta, USA");
    setPostalCode("30301");
  };

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("sessionExpiresAt");
      localStorage.removeItem("username");
      localStorage.removeItem("userRole");
      navigate("/login");
    }
  };

  return (
    <div className="set-ref-container">
      {saveSuccess && (
        <div className="set-ref-success-toast">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <span>Profile changes saved successfully!</span>
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
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="set-ref-input"
                    required
                  />
                </div>

                <div className="set-ref-input-group">
                  <label className="set-ref-lbl">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
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
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="set-ref-input"
                  />
                </div>

                <div className="set-ref-input-group">
                  <label className="set-ref-lbl">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="set-ref-input"
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
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="set-ref-input"
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
          ) : (
            <form onSubmit={handleSavePassword} className="set-ref-form">
              <h1 className="set-ref-title">Login & Password</h1>

              <div className="set-ref-grid password-layout">
                <div className="set-ref-input-group full">
                  <label className="set-ref-lbl">Current Password</label>
                  <input
                    type="password"
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
          )}
        </div>

      </div>
    </div>
  );
}
