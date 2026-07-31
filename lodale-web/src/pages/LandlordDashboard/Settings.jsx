import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { User, Lock, LogOut, Calendar, ChevronDown, CheckCircle2, Camera, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("profile"); // profile | password
  const [gender, setGender] = useState("male"); // male | female

  // Landlord Name splitting
  const [fullName, setFullName] = useState(() => {
    return localStorage.getItem("username") || "Ada K.";
  });

  const getNames = () => {
    const parts = fullName.split(" ");
    return {
      first: parts[0] || "",
      last: parts.slice(1).join(" ") || ""
    };
  };

  const names = getNames();
  const [firstName, setFirstName] = useState(names.first);
  const [lastName, setLastName] = useState(names.last);
  const [email] = useState("ada.k@lodale.com");
  const [address, setAddress] = useState("3605 Parker Rd.");
  const [phone, setPhone] = useState("(405) 555-0128");
  const [dob, setDob] = useState("1 Feb, 1995");
  const [location, setLocation] = useState("Atlanta, USA");
  const [postalCode, setPostalCode] = useState("30301");

  // Password States
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updatedName = `${firstName} ${lastName}`.trim();
    setFullName(updatedName);
    localStorage.setItem("username", updatedName);
    
    // Alert or banner
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
    const origNames = fullName.split(" ");
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
            <div className="set-ref-avatar-wrapper">
              <img 
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80" 
                alt="Roland Donald" 
                className="set-ref-avatar"
              />
              <button type="button" className="set-ref-edit-badge" aria-label="Edit Profile Avatar">
                <Camera className="h-3.5 w-3.5" />
              </button>
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
                  <div className="set-ref-input-wrapper">
                    <input 
                      type="text" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="set-ref-input"
                    />
                    <ChevronDown className="set-ref-input-icon right" />
                  </div>
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
