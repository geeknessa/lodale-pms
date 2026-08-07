import { useState, useRef } from "react";
import {
  User,
  Lock,
  LogOut,
  Pencil,
  Calendar,
  ChevronDown,
  CheckCircle2,
  FileText,
  Download,
  Eye,
  ShieldCheck,
  FileCheck,
  PenTool,
  Clock,
  Send,
  X
} from "lucide-react";
import Button from "../../components/Button";
import NigerianLocationSelect from "../../components/NigerianLocationSelect";
import { triggerToast } from "../../context/ToastContext";
import "./TenantSettings.css";

export default function TenantSettings({ onSignOut }) {
  const [activeTab, setActiveTab] = useState("personal"); // "personal" | "security" | "documents"
  const [docSubTab, setDocSubTab] = useState("pending"); // "pending" | "signed"

  // Load initial settings
  const [userProfile, setUserProfile] = useState(() => {
    const raw = localStorage.getItem("currentUserProfile");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) { }
    }
    const emailKey = localStorage.getItem("lastLoggedInEmail")?.toLowerCase();
    const storedName = emailKey ? localStorage.getItem("username_" + emailKey) : null;
    const username = storedName || localStorage.getItem("username") || "";
    const parts = username.split(" ");
    return {
      firstName: parts[0] || "Roland",
      lastName: parts.slice(1).join(" ") || "Donald",
      email: localStorage.getItem("lastLoggedInEmail") || "",
      phone: "",
      address: "",
      dob: "",
      location: "",
      postalCode: ""
    };
  });

  const [gender, setGender] = useState("Male");
  const [firstName, setFirstName] = useState(userProfile.firstName || "Roland");
  const [lastName, setLastName] = useState(userProfile.lastName || "Donald");
  const [email, setEmail] = useState(userProfile.email || localStorage.getItem("lastLoggedInEmail") || "");
  const [address, setAddress] = useState(userProfile.address || "");
  const [phone, setPhone] = useState(userProfile.phone || "");
  const [dob, setDob] = useState(userProfile.dob || "");
  const [location, setLocation] = useState(userProfile.location || "");
  const [postalCode, setPostalCode] = useState(userProfile.postalCode || "");

  // Profile avatar states
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

  // Documents & E-Signing State Management
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem("tenantLegalDocuments");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return [];
  });

  // Modal E-Signing states
  const [selectedDocToSign, setSelectedDocToSign] = useState(null);
  const [signatureInput, setSignatureInput] = useState("");
  const [confirmCheck, setConfirmCheck] = useState(false);
  const [selectedDocToView, setSelectedDocToView] = useState(null);

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

      window.dispatchEvent(new Event("storage"));
      triggerToast("Personal profile information updated successfully!", "success", "Profile Saved");
    } else if (activeTab === "security") {
      if (!currentPassword) {
        triggerToast("Please enter your current password.", "warning", "Security");
        return;
      }
      if (newPassword !== confirmPassword) {
        triggerToast("New password and confirmation do not match.", "error", "Password Mismatch");
        return;
      }
      if (newPassword.length < 6) {
        triggerToast("Password must be at least 6 characters long.", "warning", "Security");
        return;
      }
      triggerToast("Password updated successfully!", "success", "Password Changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDiscardChanges = () => {
    if (activeTab === "personal") {
      const storedName = localStorage.getItem("username") || "";
      const parts = storedName.split(" ");
      if (parts.length > 0 && parts[0]) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(" "));
      } else {
        setFirstName("Roland");
        setLastName("Donald");
      }
      setEmail(localStorage.getItem("lastLoggedInEmail") || "rolandDonald@mail.com");
      setGender("Male");
      setAddress("");
      setPhone("");
      setDob("");
      setLocation("");
      setPostalCode("");
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    triggerToast("Unsaved changes discarded.", "info", "Form Reset");
  };

  // Submit E-Signature Handler
  const handleSignDocument = (e) => {
    e.preventDefault();
    if (!signatureInput.trim()) {
      triggerToast("Please enter your full name as your digital signature.", "warning", "Signature Required");
      return;
    }
    if (!confirmCheck) {
      triggerToast("Please check the box to confirm legal agreement.", "warning", "Confirmation Required");
      return;
    }

    const nowStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }) + ", " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = documents.map((doc) => {
      if (doc.id === selectedDocToSign.id) {
        return {
          ...doc,
          status: "signed",
          signedAt: nowStr,
          signedName: signatureInput.trim()
        };
      }
      return doc;
    });

    setDocuments(updated);
    localStorage.setItem("tenantLegalDocuments", JSON.stringify(updated));

    try {
      const savedLandlordDocs = localStorage.getItem("landlordDocuments");
      const landlordDocs = savedLandlordDocs ? JSON.parse(savedLandlordDocs) : [];
      const tenantName = (localStorage.getItem("username") || `${firstName} ${lastName}`).trim();
      const updatedLandlord = [
        ...landlordDocs.filter(d => d.id !== selectedDocToSign.id),
        {
          id: selectedDocToSign.id,
          title: selectedDocToSign.title,
          tenantName: tenantName,
          landlordName: selectedDocToSign.landlordName,
          dateSigned: nowStr,
          signedName: signatureInput.trim(),
          status: "Signed"
        }
      ];
      localStorage.setItem("landlordDocuments", JSON.stringify(updatedLandlord));
    } catch (err) { }

    window.dispatchEvent(new Event("storage"));
    triggerToast("Document signed successfully & returned to landlord!", "success", "Document Signed");
    setSelectedDocToSign(null);
    setSignatureInput("");
    setConfirmCheck(false);
    setDocSubTab("signed");
  };

  // PDF Generator HTML Template - Matching User Screenshot Design with @media print support
  const generateDocumentHTML = (doc) => {
    const tenantName = doc.signedName || `${firstName} ${lastName}`.trim() || "Jergins Math";
    const refCode = doc.refCode || "DOC-2026-LOD-84920";
    const propertyName = doc.propertyName || "Modern Luxury Villa, Lekki Phase 1";
    const landlordName = doc.landlordName || "Skyline Realty / Engr. Clement Okoro";
    const signedDate = doc.signedAt || "Aug 7, 2026";

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${doc.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Inter:wght@400;500;600;700;800&display=swap');
    body {
      font-family: 'Inter', sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 30px;
    }
    .document-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 10px;
    }
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 12px;
    }
    .logo-title {
      font-size: 24px;
      font-weight: 800;
      color: #1E382A;
      letter-spacing: -0.01em;
      margin: 0;
    }
    .logo-subtitle {
      font-size: 11.5px;
      color: #64748b;
      margin-top: 3px;
    }
    .verified-pill {
      border: 1.5px solid #cbd5e1;
      color: #1E382A;
      font-size: 10.5px;
      font-weight: 800;
      padding: 6px 18px;
      border-radius: 9999px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .green-bar {
      height: 3.5px;
      background: #1E382A;
      width: 100%;
      margin-bottom: 30px;
      border-radius: 2px;
    }
    .title-block {
      text-align: center;
      margin-bottom: 24px;
    }
    .doc-main-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
      letter-spacing: -0.01em;
    }
    .doc-ref {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
    .meta-box {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px 22px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
      background: #ffffff;
    }
    .meta-label {
      font-size: 10px;
      font-weight: 800;
      color: #475569;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .meta-val {
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .contract-box {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 24px 28px;
      margin-bottom: 28px;
      background: #ffffff;
    }
    .contract-header {
      font-size: 11.5px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
      text-transform: uppercase;
    }
    .clause {
      margin-bottom: 16px;
    }
    .clause:last-child {
      margin-bottom: 0;
    }
    .clause-title {
      font-size: 11.5px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 3px;
      text-transform: uppercase;
    }
    .clause-body {
      font-size: 12.5px;
      line-height: 1.6;
      color: #475569;
    }
    .dashed-divider {
      border-bottom: 2px dashed #e2e8f0;
      margin-bottom: 28px;
    }
    .sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    .sig-card {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      text-align: center;
      background: #ffffff;
    }
    .sig-badge {
      font-size: 9.5px;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .sig-script {
      font-family: 'Dancing Script', cursive, sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: #1E382A;
      margin: 6px 0 10px 0;
    }
    .sig-name {
      font-size: 11.5px;
      font-weight: 700;
      color: #1e293b;
    }
    .sig-detail {
      font-size: 10.5px;
      color: #64748b;
      margin-top: 2px;
    }
    .footer-text {
      font-size: 10.5px;
      color: #64748b;
      text-align: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
      font-weight: 500;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .document-card { max-width: 100%; border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="document-card">
    <div class="top-header">
      <div>
        <h1 class="logo-title">LODALE PMS</h1>
        <div class="logo-subtitle">Legal Vault & Encrypted Execution</div>
      </div>
      <div class="verified-pill">VERIFIED & EXECUTED</div>
    </div>
    <div class="green-bar"></div>

    <div class="title-block">
      <h2 class="doc-main-title">${doc.title || "Tenancy Lease Agreement (2026-2027)"}</h2>
      <div class="doc-ref">Official Ref: ${refCode}</div>
    </div>

    <div class="meta-box">
      <div>
        <div class="meta-label">DEMISED PROPERTY</div>
        <div class="meta-val">${propertyName}</div>
      </div>
      <div>
        <div class="meta-label">LESSOR / PROPERTY MANAGER</div>
        <div class="meta-val">${landlordName}</div>
      </div>
    </div>

    <div class="contract-box">
      <div class="contract-header">TENANCY AGREEMENT CONTRACT</div>
      <div class="clause">
        <div class="clause-title">1. PROPERTY & TENANCY TERMS</div>
        <div class="clause-body">The Landlord hereby demises unto the Tenant the residential apartment located at ${propertyName} for a term of 12 calendar months.</div>
      </div>
      <div class="clause">
        <div class="clause-title">2. RENT & SERVICE CHARGES</div>
        <div class="clause-body">Rent is payable in advance according to the agreed schedule. Service charges cover 24/7 estate security, water treatment, central generator power, and facility maintenance.</div>
      </div>
      <div class="clause">
        <div class="clause-title">3. TENANT OBLIGATIONS</div>
        <div class="clause-body">The Tenant agrees to maintain the demised premises in good tenantable order, refrain from unauthorized structural alterations, and log all maintenance tickets through the Lodale PMS Tenant Portal.</div>
      </div>
    </div>

    <div class="dashed-divider"></div>

    <div class="sig-grid">
      <div class="sig-card">
        <div class="sig-badge">VERIFIED TENANT SIGNATURE</div>
        <div class="sig-script">${tenantName}</div>
        <div class="sig-name">${tenantName} (Tenant)</div>
        <div class="sig-detail">Date: ${signedDate}</div>
      </div>
      <div class="sig-card">
        <div class="sig-badge">LANDLORD COUNTERSIGNATURE</div>
        <div class="sig-script">Engr. Clement Okoro</div>
        <div class="sig-name">${landlordName}</div>
        <div class="sig-detail">Verified & Countersigned</div>
      </div>
    </div>

    <div class="footer-text">
      Official Legal Contract • Digitally Authenticated & Vaulted by Lodale Property Management Systems (PMS)
    </div>
  </div>
</body>
</html>`;
  };

  // Download PDF Handler - Uses Print Dialog / Frame to Save Native Vector PDF
  const handleDownloadPDF = (doc) => {
    const htmlContent = generateDocumentHTML(doc);
    
    // Create an invisible iframe for printing cleanly
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const docObj = iframe.contentWindow.document;
    docObj.open();
    docObj.write(htmlContent);
    docObj.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch (e) {}
      }, 1000);
    }, 300);

    triggerToast(`Opening PDF save dialog for ${doc.title}...`, "success", "PDF Dialog Ready");
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
          <button
            type="button"
            className={`settings-menu-btn ${activeTab === "documents" ? "active" : ""}`}
            onClick={() => setActiveTab("documents")}
          >
            <FileText className="h-4.5 w-4.5" />
            <div className="flex items-center justify-between w-full">
              <span>Legal Documents</span>
              {documents.filter(d => d.status === "pending").length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-amber-500 text-black rounded-full animate-pulse ml-1">
                  {documents.filter(d => d.status === "pending").length}
                </span>
              )}
            </div>
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
            <div className="gender-selection-row">
              <span className="gender-label">Gender</span>
              <div className="gender-options">
                <label className="gender-option">
                  <input type="radio" name="gender" value="Male" checked={gender === "Male"} onChange={(e) => setGender(e.target.value)} className="gender-radio-input" />
                  <span className="custom-radio" />
                  <span>Male</span>
                </label>
                <label className="gender-option">
                  <input type="radio" name="gender" value="Female" checked={gender === "Female"} onChange={(e) => setGender(e.target.value)} className="gender-radio-input" />
                  <span className="custom-radio" />
                  <span>Female</span>
                </label>
              </div>
            </div>
            <div className="settings-inputs-grid">
              <div className="settings-form-group">
                <label className="settings-input-label">First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="settings-form-input" placeholder="First Name" required />
              </div>
              <div className="settings-form-group">
                <label className="settings-input-label">Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="settings-form-input" placeholder="Last Name" required />
              </div>
              <div className="settings-form-group full-width">
                <label className="settings-input-label">Email</label>
                <div className="settings-input-with-icon">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="settings-form-input email-input" placeholder="email@example.com" required />
                  <div className="email-verified-badge"><CheckCircle2 className="h-3.5 w-3.5" /><span>Verified</span></div>
                </div>
              </div>
              <div className="settings-form-group full-width">
                <label className="settings-input-label">Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="settings-form-input" placeholder="Street address" />
              </div>
              <div className="settings-form-group">
                <label className="settings-input-label">Phone Number</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="settings-form-input" placeholder="Phone Number" />
              </div>
              <div className="settings-form-group">
                <label className="settings-input-label">Date of Birth</label>
                <div className="settings-input-with-icon">
                  <input type="text" value={dob} onChange={(e) => setDob(e.target.value)} className="settings-form-input" placeholder="DD-MM-YYYY" />
                  <Calendar className="input-right-icon text-ink-400" />
                </div>
              </div>
              <div className="settings-form-group">
                <label className="settings-input-label">Location</label>
                <NigerianLocationSelect value={location} onChange={(val) => setLocation(val)} placeholder="Select Location" />
              </div>
              <div className="settings-form-group">
                <label className="settings-input-label">Postal Code</label>
                <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="settings-form-input" placeholder="Postal Code" />
              </div>
            </div>
            <div className="settings-form-actions">
              <Button type="button" onClick={handleDiscardChanges} className="settings-btn settings-btn-discard">Discard Changes</Button>
              <Button type="submit" className="settings-btn settings-btn-save">Save Changes</Button>
            </div>
          </form>
        ) : activeTab === "security" ? (
          <form className="settings-main-form" onSubmit={handleSaveChanges}>
            <h2 className="settings-form-title">Login & Password</h2>
            <div className="settings-inputs-grid single-col">
              <div className="settings-form-group">
                <label className="settings-input-label">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="settings-form-input" placeholder="••••••••" required />
              </div>
              <div className="settings-form-group">
                <label className="settings-input-label">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="settings-form-input" placeholder="Min 6 characters" required />
              </div>
              <div className="settings-form-group">
                <label className="settings-input-label">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="settings-form-input" placeholder="Confirm new password" required />
              </div>
            </div>
            <div className="settings-form-actions">
              <Button type="button" onClick={handleDiscardChanges} className="settings-btn settings-btn-discard">Discard Changes</Button>
              <Button type="submit" className="settings-btn settings-btn-save">Save Changes</Button>
            </div>
          </form>
        ) : (
          <div className="settings-main-form space-y-6">
            <div className="flex items-center justify-between border-b border-ink-100/30 dark:border-white/10 pb-4">
              <div>
                <h2 className="settings-form-title mb-1">Lease Agreements & Legal Documents</h2>
                <p className="text-[12.5px] text-ink-400 dark:text-cream-100/60">Receive, review, e-sign, and download official tenancy contracts sent by your landlord.</p>
              </div>
            </div>

            {/* Sub-tabs: Pending vs Signed */}
            <div className="flex gap-3 border-b border-ink-100/40 dark:border-white/10 pb-3">
              <button
                type="button"
                onClick={() => setDocSubTab("pending")}
                className={`px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  docSubTab === "pending"
                    ? "bg-[#2C4633] text-white dark:bg-[#E5C583] dark:text-[#0B1512] shadow-sm"
                    : "text-ink-600 dark:text-cream-100/70 hover:bg-ink-50 dark:hover:bg-white/5"
                }`}
              >
                <PenTool className="h-4 w-4" />
                <span>Pending Signature</span>
                {documents.filter(d => d.status === "pending").length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black bg-amber-500 text-black rounded-full">
                    {documents.filter(d => d.status === "pending").length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setDocSubTab("signed")}
                className={`px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  docSubTab === "signed"
                    ? "bg-[#2C4633] text-white dark:bg-[#E5C583] dark:text-[#0B1512] shadow-sm"
                    : "text-ink-600 dark:text-cream-100/70 hover:bg-ink-50 dark:hover:bg-white/5"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Signed Documents</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-moss-100 text-moss-800 dark:bg-white/10 dark:text-white rounded-full">
                  {documents.filter(d => d.status === "signed").length}
                </span>
              </button>
            </div>

            {/* Document Card Lists */}
            {docSubTab === "pending" ? (
              <div className="space-y-4">
                {documents.filter(d => d.status === "pending").length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 px-4 text-center border-2 border-dashed border-ink-100 dark:border-white/10 rounded-2xl bg-ink-50/30 dark:bg-white/[0.02]">
                    <div className="p-3.5 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 rounded-2xl mb-3 border border-amber-500/20">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <h4 className="font-extrabold text-base text-ink-900 dark:text-white">No Documents Awaiting Signature</h4>
                    <p className="text-xs text-ink-400 dark:text-cream-100/50 max-w-sm mt-1 leading-relaxed">
                      When your landlord or property manager sends a lease agreement or policy document for you to sign, it will appear right here for your review and e-signature.
                    </p>
                  </div>
                ) : (
                  documents.filter(d => d.status === "pending").map((doc) => (
                    <div
                      key={doc.id}
                      className="p-5 rounded-2xl border border-amber-500/30 dark:border-white/10 bg-white dark:bg-[#13221C]/80 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group space-y-4"
                    >
                      {/* Top Accent Gradient Line */}
                      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 rounded-t-2xl absolute top-0 left-0" />

                      {/* Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 shrink-0 border border-amber-500/20">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-base text-ink-900 dark:text-white leading-snug">{doc.title}</h4>
                            <p className="text-[11.5px] text-ink-400 dark:text-cream-100/60 font-semibold">
                              Received {doc.dateSent} • From <span className="text-ink-700 dark:text-cream-100/90 font-bold">{doc.landlordName}</span>
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 text-[10.5px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded-full border border-amber-500/25 shrink-0 uppercase tracking-wider flex items-center gap-1.5 w-fit animate-pulse">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Signature Awaited</span>
                        </span>
                      </div>

                      {/* Detail Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-ink-50/60 dark:bg-white/5 border border-ink-100/60 dark:border-white/10 text-xs">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-ink-400 dark:text-cream-100/50 block mb-0.5">Demised Property</span>
                          <p className="font-bold text-ink-900 dark:text-white truncate">{doc.propertyName || "Modern Luxury Villa, Lekki Phase 1"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-ink-400 dark:text-cream-100/50 block mb-0.5">Document Type</span>
                          <p className="font-bold text-ink-900 dark:text-white">{doc.type || "Lease Agreement"}</p>
                        </div>
                      </div>

                      {/* Action Footer */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-ink-100/40 dark:border-white/10">
                        <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                          <span>Requires your electronic signature to bind lease contract</span>
                        </p>
                        <Button
                          type="button"
                          onClick={() => { setSelectedDocToSign(doc); setSignatureInput(`${firstName} ${lastName}`.trim()); }}
                          className="bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#d8b672] text-white dark:text-[#0B1512] text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-2 shrink-0 self-end sm:self-auto"
                        >
                          <PenTool className="h-3.5 w-3.5" />
                          <span>Review & E-Sign</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Signed Documents List - Redesigned Executive Card Style */
              <div className="space-y-4">
                {documents.filter(d => d.status === "signed").length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 px-4 text-center border-2 border-dashed border-ink-100 dark:border-white/10 rounded-2xl bg-ink-50/30 dark:bg-white/[0.02]">
                    <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-2xl mb-3 border border-emerald-500/20">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h4 className="font-extrabold text-base text-ink-900 dark:text-white">No Signed Documents Archived</h4>
                    <p className="text-xs text-ink-400 dark:text-cream-100/50 max-w-sm mt-1 leading-relaxed">
                      Your executed legal contracts, tenancy agreements, and countersigned forms will be stored in this vault for viewing and downloading.
                    </p>
                  </div>
                ) : (
                  documents.filter(d => d.status === "signed").map((doc) => (
                    <div
                      key={doc.id}
                      className="p-5 rounded-2xl border border-ink-100/80 dark:border-white/10 bg-white dark:bg-[#13221C]/80 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group space-y-4"
                    >
                      {/* Top Accent Gradient Line */}
                      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-moss-600 to-amber-500 rounded-t-2xl absolute top-0 left-0" />

                      {/* Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-base text-ink-900 dark:text-white leading-snug">{doc.title}</h4>
                            <p className="text-[11.5px] text-ink-400 dark:text-cream-100/60 font-semibold">
                              Ref Code: <span className="text-ink-700 dark:text-cream-100/90">{doc.refCode || "DOC-2026-LOD-84920"}</span>
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 text-[10.5px] font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-500/25 shrink-0 uppercase tracking-wider flex items-center gap-1.5 w-fit">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Signed & Vaulted</span>
                        </span>
                      </div>

                      {/* Detail Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-ink-50/60 dark:bg-white/5 border border-ink-100/60 dark:border-white/10 text-xs">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-ink-400 dark:text-cream-100/50 block mb-0.5">Demised Property</span>
                          <p className="font-bold text-ink-900 dark:text-white truncate">{doc.propertyName || "Modern Luxury Villa, Lekki Phase 1"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-ink-400 dark:text-cream-100/50 block mb-0.5">Lessor / Owner</span>
                          <p className="font-bold text-ink-900 dark:text-white truncate">{doc.landlordName || "Skyline Realty / Engr. Clement Okoro"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-ink-400 dark:text-cream-100/50 block mb-0.5">Execution Date</span>
                          <p className="font-bold text-ink-900 dark:text-white">{doc.signedAt || "Aug 7, 2026"}</p>
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-ink-100/40 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-ink-500 dark:text-cream-100/60">Digital Stamp:</span>
                          <span className="font-serif italic font-extrabold text-sm text-moss-800 dark:text-[#E5C583] px-2.5 py-0.5 bg-emerald-500/10 dark:bg-white/5 rounded-lg border border-emerald-500/20 dark:border-white/10">
                            {doc.signedName || "Jergins Math"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setSelectedDocToView(doc)}
                            className="text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
                            title="View Signed Contract Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleDownloadPDF(doc)}
                            className="bg-[#2C4633] hover:bg-[#1E3123] dark:bg-[#E5C583] dark:hover:bg-[#d8b672] text-white dark:text-[#0B1512] text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                            title="Export Print-Ready PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download PDF</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* POPUP MODAL 1: E-SIGNATURE REVIEWER - Compact & Viewport Safe */}
      {selectedDocToSign && (
        <div className="tenant-modal-backdrop" onClick={() => setSelectedDocToSign(null)}>
          <div
            className="tenant-modal-content text-left max-w-lg w-full max-h-[85vh] flex flex-col p-5 md:p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header flex items-center justify-between pb-3 border-b border-ink-100/30 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/25 dark:text-amber-300">
                  <PenTool className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink-900 dark:text-white">Review & E-Sign Document</h3>
                  <p className="text-[11px] text-ink-400 dark:text-cream-100/50">{selectedDocToSign.title}</p>
                </div>
              </div>
              <button
                className="close-btn text-ink-400 hover:text-ink-900 dark:hover:text-white text-xl font-bold"
                onClick={() => setSelectedDocToSign(null)}
              >
                &times;
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleSignDocument} className="flex flex-col flex-1 overflow-hidden pt-3">
              <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 pb-2">
                <div className="p-3.5 rounded-xl bg-ink-50/50 dark:bg-white/5 border border-ink-100/60 dark:border-white/10 max-h-36 overflow-y-auto font-mono text-[11.5px] leading-relaxed text-ink-700 dark:text-cream-100/80 whitespace-pre-wrap">
                  {selectedDocToSign.content}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink-900 dark:text-white flex items-center justify-between">
                    <span>Type Your Full Name to Sign</span>
                    <span className="text-[10.5px] font-normal text-ink-400 dark:text-cream-100/50">Official E-Signature</span>
                  </label>
                  <input
                    type="text"
                    value={signatureInput}
                    onChange={(e) => setSignatureInput(e.target.value)}
                    placeholder="e.g. Roland Donald"
                    className="w-full px-3.5 py-2 rounded-xl border border-ink-200/60 dark:border-white/10 bg-white dark:bg-[#13221C] text-sm font-bold text-ink-900 dark:text-white outline-none focus:ring-2 focus:ring-moss-600"
                    required
                  />

                  {signatureInput.trim() && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-center">
                      <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 block mb-0.5">
                        Digital Signature Stamp Preview
                      </span>
                      <span className="font-serif italic font-extrabold text-lg text-moss-800 dark:text-[#E5C583] tracking-wide border-b-2 border-amber-500/40 pb-0.5 px-3 inline-block">
                        {signatureInput.trim()}
                      </span>
                    </div>
                  )}
                </div>

                <label className="flex items-start gap-2.5 pt-0.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmCheck}
                    onChange={(e) => setConfirmCheck(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-ink-300 text-moss-700 focus:ring-moss-600 cursor-pointer"
                    required
                  />
                  <span className="text-[11.5px] text-ink-600 dark:text-cream-100/70 leading-snug">
                    I confirm that I have reviewed the full document and hereby execute this legal contract with my electronic signature, binding myself to all agreed terms.
                  </span>
                </label>
              </div>

              {/* Sticky Modal Action Buttons Footer */}
              <div className="flex gap-3 pt-3 border-t border-ink-100/30 dark:border-white/10 shrink-0 bg-white dark:bg-[#13221C]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setSelectedDocToSign(null)}
                  className="flex-1 py-2.5 text-[13px] font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] py-2.5 font-extrabold text-[13px] shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Sign & Send to Landlord</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: SIGNED DOCUMENT VIEWER - Screenshot Perfect Preview */}
      {selectedDocToView && (
        <div className="tenant-modal-backdrop" onClick={() => setSelectedDocToView(null)}>
          <div className="tenant-modal-content text-left max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-ink-100/40 dark:border-white/10 mb-5">
              <div>
                <h3 className="text-xl font-extrabold text-[#1E382A] dark:text-[#E5C583] tracking-tight">LODALE PMS</h3>
                <p className="text-xs text-ink-400 dark:text-cream-100/50">Legal Vault & Encrypted Execution</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 text-[10.5px] font-extrabold border border-ink-200/80 dark:border-white/20 text-[#1E382A] dark:text-[#E5C583] rounded-full uppercase tracking-wider">
                  VERIFIED & EXECUTED
                </span>
                <button className="close-btn text-ink-400 hover:text-ink-900 dark:hover:text-white text-2xl font-bold leading-none" onClick={() => setSelectedDocToView(null)}>&times;</button>
              </div>
            </div>

            <div className="w-full h-1 bg-[#1E382A] dark:bg-[#E5C583] rounded-full mb-6"></div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-black text-ink-900 dark:text-white">{selectedDocToView.title || "Tenancy Lease Agreement (2026-2027)"}</h2>
              <p className="text-xs text-ink-400 dark:text-cream-100/60 font-semibold mt-1">Official Ref: {selectedDocToView.refCode || "DOC-2026-LOD-84920"}</p>
            </div>

            {/* Demised Property & Lessor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl border border-ink-100 dark:border-white/10 bg-ink-50/40 dark:bg-white/5 mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-ink-400 dark:text-cream-100/50 block mb-0.5">DEMISED PROPERTY</span>
                <p className="text-sm font-bold text-ink-900 dark:text-white">{selectedDocToView.propertyName || "Modern Luxury Villa, Lekki Phase 1"}</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-ink-400 dark:text-cream-100/50 block mb-0.5">LESSOR / PROPERTY MANAGER</span>
                <p className="text-sm font-bold text-ink-900 dark:text-white">{selectedDocToView.landlordName || "Skyline Realty / Engr. Clement Okoro"}</p>
              </div>
            </div>

            {/* Contract Clauses Container */}
            <div className="p-5 rounded-2xl border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 space-y-4 mb-6">
              <span className="text-xs font-extrabold text-ink-400 dark:text-cream-100/60 tracking-wider uppercase block border-b border-ink-100/50 dark:border-white/10 pb-2">
                TENANCY AGREEMENT CONTRACT
              </span>
              <div className="space-y-3 text-xs leading-relaxed text-ink-700 dark:text-cream-100/80">
                <div>
                  <h5 className="font-extrabold text-ink-900 dark:text-white uppercase mb-0.5">1. PROPERTY & TENANCY TERMS</h5>
                  <p className="text-ink-600 dark:text-cream-100/70">The Landlord hereby demises unto the Tenant the residential apartment located at {selectedDocToView.propertyName || "Modern Luxury Villa, Lekki Phase 1"} for a term of 12 calendar months.</p>
                </div>
                <div>
                  <h5 className="font-extrabold text-ink-900 dark:text-white uppercase mb-0.5">2. RENT & SERVICE CHARGES</h5>
                  <p className="text-ink-600 dark:text-cream-100/70">Rent is payable in advance according to the agreed schedule. Service charges cover 24/7 estate security, water treatment, central generator power, and facility maintenance.</p>
                </div>
                <div>
                  <h5 className="font-extrabold text-ink-900 dark:text-white uppercase mb-0.5">3. TENANT OBLIGATIONS</h5>
                  <p className="text-ink-600 dark:text-cream-100/70">The Tenant agrees to maintain the demised premises in good tenantable order, refrain from unauthorized structural alterations, and log all maintenance tickets through the Lodale PMS Tenant Portal.</p>
                </div>
              </div>
            </div>

            {/* Dashed Separator */}
            <div className="border-b-2 border-dashed border-ink-100 dark:border-white/10 mb-6"></div>

            {/* Dual Signature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl border border-ink-100 dark:border-white/10 text-center bg-emerald-500/5 dark:bg-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                  VERIFIED TENANT SIGNATURE
                </span>
                <p className="font-serif italic font-extrabold text-2xl text-[#1E382A] dark:text-[#E5C583] my-1">
                  {selectedDocToView.signedName || "Jergins Math"}
                </p>
                <p className="text-xs font-bold text-ink-900 dark:text-white">{selectedDocToView.signedName || "Jergins Math"} (Tenant)</p>
                <p className="text-[11px] text-ink-400 dark:text-cream-100/50 mt-0.5">Date: {selectedDocToView.signedAt || "Aug 7, 2026"}</p>
              </div>

              <div className="p-4 rounded-2xl border border-ink-100 dark:border-white/10 text-center bg-emerald-500/5 dark:bg-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                  LANDLORD COUNTERSIGNATURE
                </span>
                <p className="font-serif italic font-extrabold text-2xl text-[#1E382A] dark:text-[#E5C583] my-1">
                  Engr. Clement Okoro
                </p>
                <p className="text-xs font-bold text-ink-900 dark:text-white">{selectedDocToView.landlordName || "Skyline Realty / Engr. Clement Okoro"}</p>
                <p className="text-[11px] text-ink-400 dark:text-cream-100/50 mt-0.5">Verified & Countersigned</p>
              </div>
            </div>

            <p className="text-center text-[11px] text-ink-400 dark:text-cream-100/50 pt-2 border-t border-ink-100/40 dark:border-white/10 mb-6">
              Official Legal Contract • Digitally Authenticated & Vaulted by Lodale Property Management Systems (PMS)
            </p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedDocToView(null)}
                className="flex-1 py-3 text-[13px] font-bold"
              >
                Close Viewer
              </Button>
              <Button
                type="button"
                onClick={() => handleDownloadPDF(selectedDocToView)}
                className="flex-1 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] py-3 font-bold text-[13px]"
              >
                <Download className="h-3.5 w-3.5 mr-1.5 inline" /> Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
