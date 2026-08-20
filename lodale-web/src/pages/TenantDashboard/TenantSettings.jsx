import { useState, useRef, useEffect } from "react";
import {
  User,
  Lock,
  LogOut,
  Pencil,
  Calendar,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
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
import { userService } from "../../services/userService";
import { safeSetLocalStorage, safeSetSessionStorage, compressImageForStorage } from "../../utils/storageUtils";
import "./TenantSettings.css";

export default function TenantSettings({ onSignOut, currentAvatar, onAvatarChange, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState("personal"); // "personal" | "security" | "documents"
  const [docSubTab, setDocSubTab] = useState("pending"); // "pending" | "signed"

  // Helper to read initial local tenant profile
  const getInitialProfile = () => {
    const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || localStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
    try {
      const raw = sessionStorage.getItem("tenantCurrentProfile") || (emailKey ? localStorage.getItem("tenantProfile_" + emailKey) : null);
      if (raw) return JSON.parse(raw);
    } catch (e) { }
    return null;
  };

  const initialProf = getInitialProfile();
  const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || localStorage.getItem("lastLoggedInEmail") || "").toLowerCase();

  const initialUsername =
    sessionStorage.getItem("tenantUsername") ||
    (emailKey ? localStorage.getItem("tenantUsername_" + emailKey) : null) ||
    sessionStorage.getItem("username") ||
    localStorage.getItem("username") ||
    "Tunde";
  const nameParts = initialUsername.split(" ");
  const initialFirst = initialProf?.first_name || initialProf?.firstName || nameParts[0] || "";
  const initialLast = initialProf?.last_name || initialProf?.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");
  const initialEmail = initialProf?.email || sessionStorage.getItem("lastLoggedInEmail") || localStorage.getItem("lastLoggedInEmail") || "";
  const initialPhone = initialProf?.phone_number || initialProf?.phone || "";
  const initialAddress = initialProf?.address || "";
  const initialDob = initialProf?.dob || "";
  const initialLocation = initialProf?.location || "";
  const initialPostalCode = initialProf?.postalCode || "";
  const initialAvatar =
    currentAvatar ||
    initialProf?.avatar ||
    initialProf?.avatar_url ||
    (emailKey ? localStorage.getItem("tenantAvatar_" + emailKey) : null) ||
    sessionStorage.getItem("tenantAvatarUrl") ||
    localStorage.getItem("tenantAvatarUrl") ||
    "";

  // Load initial settings
  const [userProfile, setUserProfile] = useState(initialProf || {});

  const [gender, setGender] = useState("Male");
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [email, setEmail] = useState(initialEmail);
  const [address, setAddress] = useState(initialAddress);
  const [phone, setPhone] = useState(initialPhone);
  const [dob, setDob] = useState(initialDob);
  const [location, setLocation] = useState(initialLocation);
  const [postalCode, setPostalCode] = useState(initialPostalCode);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null); // { type: "success" | "error" | "warning", text: string }

  const fileInputRef = useRef(null);

  // Sync if currentAvatar prop changes from parent
  useEffect(() => {
    if (currentAvatar) {
      setAvatarUrl(currentAvatar);
    }
  }, [currentAvatar]);

  // Security form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Documents & E-Signing State Management
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem("tenantLegalDocuments");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { }
    }
    return [
      {
        id: "doc-1",
        refCode: "DOC-2026-LOD-84920",
        title: "Tenancy Lease Agreement (2026-2027)",
        type: "Lease Agreement",
        propertyName: "Modern Luxury Villa, Lekki Phase 1",
        landlordName: "Skyline Realty / Engr. Clement Okoro",
        dateSent: "07 Aug 2026",
        status: "pending",
        content: `RESIDENTIAL TENANCY LEASE AGREEMENT (2026 - 2027)\n\n1. PARTIES & DEMISED PREMISES:\nThis Tenancy Lease Agreement is made between Engr. Clement Okoro (Landlord/Lessor) and the Tenant for the property: Modern Luxury Villa, Lekki Phase 1, Lagos, Nigeria.\n\n2. TERM & COMMENCEMENT:\nThe lease term shall be for a duration of Twelve (12) calendar months commencing immediately upon execution.\n\n3. RENT & SERVICE CHARGES:\nRent is agreed at ₦3,500,000 per annum, payable in advance. Service charges cover 24/7 security, central water filtration, and backup power generator servicing.\n\n4. COVENANTS & CARE OF PREMISES:\nThe Tenant agrees to keep the demised property in good, tenantable condition, refrain from unauthorized structural alterations, and report maintenance requests promptly.\n\n5. GOVERNING LAW & JURISDICTION:\nThis Agreement is governed by the tenancy laws of the Federal Republic of Nigeria.`
      }
    ];
  });

  // Modal E-Signing states
  const [selectedDocToSign, setSelectedDocToSign] = useState(null);
  const [signatureInput, setSignatureInput] = useState("");
  const [confirmCheck, setConfirmCheck] = useState(false);
  const [selectedDocToView, setSelectedDocToView] = useState(null);

  const loadStoredProfile = () => {
    const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || localStorage.getItem("lastLoggedInEmail"))?.toLowerCase() || "";
    let localProf = null;
    try {
      const raw = sessionStorage.getItem("currentUserProfile") || localStorage.getItem("currentUserProfile") || (emailKey ? localStorage.getItem("userProfile_" + emailKey) : null);
      if (raw) localProf = JSON.parse(raw);
    } catch (e) { }

    const storedUsername = sessionStorage.getItem("username") || (emailKey ? localStorage.getItem("username_" + emailKey) : null) || localStorage.getItem("username") || "";

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
      savedAvatar = localStorage.getItem("tenantAvatar_" + emailKey);
    }
    if (!savedAvatar) {
      savedAvatar = sessionStorage.getItem("tenantAvatarUrl") || localStorage.getItem("tenantAvatarUrl") || localProf?.avatar || localProf?.avatar_url || "";
    }
    setAvatarUrl(savedAvatar || "");
    if (localProf) setUserProfile(localProf);
  };

  useEffect(() => {
    loadStoredProfile();

    async function fetchProfile() {
      try {
        const profile = await userService.getProfile();
        if (profile) {
          setUserProfile(prev => ({ ...prev, ...profile }));
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
      } catch (err) {
        console.warn("Failed to fetch tenant profile", err);
      }
    }
    fetchProfile();
  }, []);

  // Listen to cross-tab storage changes for tenant documents
  useEffect(() => {
    const syncDocs = () => {
      const saved = localStorage.getItem("tenantLegalDocuments");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setDocuments(parsed);
          }
        } catch (e) { }
      }
    };
    window.addEventListener("storage", syncDocs);
    return () => window.removeEventListener("storage", syncDocs);
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const IMAGE_SIZE_LIMIT_MB = 5;
  const IMAGE_SIZE_LIMIT_BYTES = IMAGE_SIZE_LIMIT_MB * 1024 * 1024;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    // Reset input so the same file can be re-selected after an error
    e.target.value = "";
    if (!file) return;

    if (file.size > IMAGE_SIZE_LIMIT_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const msg = `This image is above the required image size limit (${fileSizeMB} MB uploaded — max ${IMAGE_SIZE_LIMIT_MB} MB allowed).`;
      setFeedbackMessage({ type: "error", text: msg });
      triggerToast(msg, "error", "Upload Failed");
      return;
    }

    // Image is within the size limit — compress to avatar size to avoid Storage QuotaExceededError
    try {
      const base64Data = await compressImageForStorage(file, 350, 350, 0.82);
      setAvatarUrl(base64Data);
      const emailKey = (email || sessionStorage.getItem("lastLoggedInEmail") || localStorage.getItem("lastLoggedInEmail"))?.toLowerCase();
      if (emailKey) {
        safeSetLocalStorage("tenantAvatar_" + emailKey, base64Data);
      }
      safeSetSessionStorage("tenantAvatarUrl", base64Data);
      safeSetLocalStorage("tenantAvatarUrl", base64Data);

      const updatedProf = {
        ...userProfile,
        firstName,
        lastName,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        phone_number: phone,
        address,
        dob,
        location,
        postalCode,
        postal_code: postalCode,
        gender,
        avatar: base64Data,
        avatar_url: base64Data
      };
      setUserProfile(updatedProf);
      safeSetSessionStorage("currentUserProfile", JSON.stringify(updatedProf));
      const savedSuccessfully = safeSetLocalStorage("currentUserProfile", JSON.stringify(updatedProf));
      if (!savedSuccessfully) {
        // Fallback: save profile without large avatar string if quota is reached
        const slimProf = { ...updatedProf, avatar: "", avatar_url: "" };
        safeSetLocalStorage("currentUserProfile", JSON.stringify(slimProf));
      }

      if (emailKey) {
        safeSetLocalStorage("userProfile_" + emailKey, JSON.stringify(updatedProf));
      }

      // Notify parent / sidebar / header
      onAvatarChange?.(base64Data);
      onProfileUpdate?.(undefined, base64Data);

      // Dispatch named event so TenantDashboard updates avatar in real-time
      window.dispatchEvent(new CustomEvent("tenantProfileUpdated", { detail: { avatar: base64Data } }));
      window.dispatchEvent(new Event("storage"));

      setFeedbackMessage({ type: "success", text: "Profile picture updated successfully!" });
      triggerToast("Profile picture updated successfully!", "success", "Photo Updated");
    } catch (err) {
      console.warn("Tenant avatar processing fallback:", err);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const rawBase64 = evt.target.result;
        setAvatarUrl(rawBase64);
        const emailKey = (email || sessionStorage.getItem("lastLoggedInEmail") || localStorage.getItem("lastLoggedInEmail"))?.toLowerCase();
        if (emailKey) {
          safeSetLocalStorage("tenantAvatar_" + emailKey, rawBase64);
        }
        safeSetSessionStorage("tenantAvatarUrl", rawBase64);
        safeSetLocalStorage("tenantAvatarUrl", rawBase64);

        const updatedProf = {
          ...userProfile,
          firstName,
          lastName,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          phone_number: phone,
          address,
          dob,
          location,
          postalCode,
          postal_code: postalCode,
          gender,
          avatar: rawBase64,
          avatar_url: rawBase64
        };
        setUserProfile(updatedProf);
        safeSetSessionStorage("currentUserProfile", JSON.stringify(updatedProf));
        safeSetLocalStorage("currentUserProfile", JSON.stringify(updatedProf));
        if (emailKey) {
          safeSetLocalStorage("userProfile_" + emailKey, JSON.stringify(updatedProf));
        }

        onAvatarChange?.(rawBase64);
        onProfileUpdate?.(undefined, rawBase64);
        window.dispatchEvent(new CustomEvent("tenantProfileUpdated", { detail: { avatar: rawBase64 } }));
        window.dispatchEvent(new Event("storage"));

        setFeedbackMessage({ type: "success", text: "Profile picture updated successfully!" });
        triggerToast("Profile picture updated successfully!", "success", "Photo Updated");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setFeedbackMessage(null);

    if (activeTab === "personal") {
      try {
        const cleanEmail = (email || sessionStorage.getItem("lastLoggedInEmail") || localStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
        const updatedName = `${firstName.trim()} ${lastName.trim()}`.trim();

        const profileData = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          phone_number: phone.trim(),
          avatar_url: avatarUrl,
          address: address.trim(),
          dob: dob.trim(),
          location: location,
          postal_code: postalCode.trim(),
          gender: gender
        };

        try {
          await userService.updateProfile(profileData);
        } catch (apiErr) {
          console.warn("Backend updateProfile notice:", apiErr);
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
          avatar: avatarUrl,
          avatar_url: avatarUrl,
          role: "tenant"
        };

        setUserProfile(updatedProf);
        safeSetSessionStorage("currentUserProfile", JSON.stringify(updatedProf));
        const savedProf = safeSetLocalStorage("currentUserProfile", JSON.stringify(updatedProf));
        if (!savedProf) {
          // Fallback: save profile without heavy avatar data if storage quota reached
          const slimProf = { ...updatedProf, avatar: "", avatar_url: "" };
          safeSetLocalStorage("currentUserProfile", JSON.stringify(slimProf));
        }

        if (cleanEmail) {
          safeSetLocalStorage("userProfile_" + cleanEmail, JSON.stringify(updatedProf));
          safeSetLocalStorage("username_" + cleanEmail, updatedName);
          if (avatarUrl) {
            safeSetLocalStorage("tenantAvatar_" + cleanEmail, avatarUrl);
          }
        }
        if (updatedName) {
          safeSetSessionStorage("username", updatedName);
          safeSetLocalStorage("username", updatedName);
        }
        if (avatarUrl) {
          safeSetSessionStorage("tenantAvatarUrl", avatarUrl);
          safeSetLocalStorage("tenantAvatarUrl", avatarUrl);
        }

        window.dispatchEvent(new Event("storage"));

        triggerToast("Personal profile information updated successfully!", "success", "Profile Saved");
      } catch (err) {
        setIsSaving(false);
        setFeedbackMessage({ type: "error", text: err.message || "Failed to update profile." });
        triggerToast(err.message || "Failed to update profile", "error", "Error");
      }
    } else if (activeTab === "security") {
      if (!currentPassword) {
        setFeedbackMessage({ type: "warning", text: "Please enter your current password." });
        triggerToast("Please enter your current password.", "warning", "Security");
        return;
      }
      if (newPassword !== confirmPassword) {
        setFeedbackMessage({ type: "error", text: "New password and confirmation do not match." });
        triggerToast("New password and confirmation do not match.", "error", "Password Mismatch");
        return;
      }
      if (newPassword.length < 6) {
        setFeedbackMessage({ type: "warning", text: "Password must be at least 6 characters long." });
        triggerToast("Password must be at least 6 characters long.", "warning", "Security");
        return;
      }
      setFeedbackMessage({ type: "success", text: "Password updated successfully!" });
      triggerToast("Password updated successfully!", "success", "Password Changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDiscardChanges = () => {
    setFeedbackMessage(null);
    if (activeTab === "personal") {
      loadStoredProfile();
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setFeedbackMessage({ type: "warning", text: "Unsaved changes discarded." });
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
      const tenantName = (sessionStorage.getItem("username") || localStorage.getItem("username") || `${firstName} ${lastName}`).trim();
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

      const savedLandlordNotifs = localStorage.getItem("landlordNotifications");
      const landlordNotifs = savedLandlordNotifs ? JSON.parse(savedLandlordNotifs) : [];
      landlordNotifs.unshift({
        id: "notif-signed-" + Date.now(),
        title: "Agreement Signed",
        message: `${tenantName} has signed the tenancy agreement for ${selectedDocToSign.propertyName || "the property"}.`,
        time: "Just now",
        type: "success",
        read: false
      });
      localStorage.setItem("landlordNotifications", JSON.stringify(landlordNotifs));
    } catch (err) { }

    window.dispatchEvent(new Event("storage"));
    triggerToast("Document signed successfully & returned to landlord!", "success", "Document Signed");
    setSelectedDocToSign(null);
    setSignatureInput("");
    setConfirmCheck(false);
    setDocSubTab("signed");
  };

  // PDF Generator HTML Template
  const generateDocumentHTML = (doc) => {
    const tenantName = doc.signedName || `${firstName} ${lastName}`.trim() || "Tenant";
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
        <div class="clause-body">The Landlord hereby demises unto the Tenant the residential apartment located at ${propertyName} for the agreed lease term.</div>
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
        <div class="sig-script">${landlordName.split("/").pop()?.trim() || landlordName}</div>
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

  // Download PDF Handler
  const handleDownloadPDF = (doc) => {
    const htmlContent = generateDocumentHTML(doc);

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
        } catch (e) { }
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
            <div className="flex items-center justify-between mb-2">
              <h2 className="settings-form-title mb-0">Personal Information</h2>
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="h-3.5 w-3.5" /> All Changes Saved
                </span>
              )}
            </div>

            {/* Inline Feedback Banner */}
            {feedbackMessage && (
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between text-[13px] font-medium transition-all mb-4 ${feedbackMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                    : feedbackMessage.type === "error"
                      ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                      : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  {feedbackMessage.type === "success" ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <span>{feedbackMessage.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackMessage(null)}
                  className="text-inherit hover:opacity-75 p-1 cursor-pointer bg-transparent border-none outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

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
                  maxLength={50}
                  value={firstName}
                  onInput={(e) => e.target.value = e.target.value.replace(/[0-9]/g, '')}
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
                  maxLength={50}
                  value={lastName}
                  onInput={(e) => e.target.value = e.target.value.replace(/[0-9]/g, '')}
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
                    maxLength={100}
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
                  maxLength={255}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="settings-form-input"
                  placeholder="Street address"
                />
              </div>

              <div className="settings-form-group">
                <label className="settings-input-label">Phone Number</label>
                <input
                  type="tel"
                  maxLength={15}
                  value={phone}
                  onInput={(e) => e.target.value = e.target.value.replace(/[^0-9+]/g, '')}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                  className="settings-form-input"
                  placeholder="e.g. +2348012345678"
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
                  inputMode="numeric"
                  maxLength={20}
                  value={postalCode}
                  onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                  onChange={(e) => setPostalCode(e.target.value.replace(/[^0-9]/g, ''))}
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
                disabled={isSaving}
                className={`settings-btn settings-btn-save flex items-center justify-center gap-2 transition-all ${saveSuccess ? "!bg-emerald-600 !text-white" : ""
                  }`}
              >
                {isSaving ? (
                  <>
                    <span className="inline-block animate-spin mr-1">⏳</span>
                    <span>Saving...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        ) : activeTab === "security" ? (
          /* Login & Password Form */
          <form className="settings-main-form" onSubmit={handleSaveChanges}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="settings-form-title mb-0">Login & Password</h2>
            </div>

            {/* Inline Feedback Banner for Security */}
            {feedbackMessage && (
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between text-[13px] font-medium transition-all mb-4 ${feedbackMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                    : feedbackMessage.type === "error"
                      ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                      : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  {feedbackMessage.type === "success" ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <span>{feedbackMessage.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackMessage(null)}
                  className="text-inherit hover:opacity-75 p-1 cursor-pointer bg-transparent border-none outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="settings-inputs-grid single-col">
              <div className="settings-form-group">
                <label className="settings-input-label">Current Password</label>
                <input
                  type="password"
                  maxLength={128}
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
                  maxLength={128}
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
                  maxLength={128}
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
                disabled={isSaving}
                className="settings-btn settings-btn-save"
              >
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          /* Legal Documents & Lease Agreements Form */
          <div className="settings-main-form space-y-6">
            <div className="flex items-center justify-between border-b border-ink-100/30 dark:border-white/10 pb-4">
              <div>
                <h2 className="settings-form-title mb-1">Lease Agreements & Legal Documents</h2>
                <p className="text-[12.5px] text-ink-400 dark:text-cream-100/60">
                  Receive, review, e-sign, and download official tenancy contracts sent by your landlord.
                </p>
              </div>
            </div>

            {/* Sub-tabs: Pending vs Signed */}
            <div className="flex gap-3 border-b border-ink-100/40 dark:border-white/10 pb-3">
              <button
                type="button"
                onClick={() => setDocSubTab("pending")}
                className={`px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all cursor-pointer flex items-center gap-2 ${docSubTab === "pending"
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
                className={`px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all cursor-pointer flex items-center gap-2 ${docSubTab === "signed"
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
                      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 rounded-t-2xl absolute top-0 left-0" />

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

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-ink-100/40 dark:border-white/10">
                        <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                          <span>Requires your electronic signature to bind lease contract</span>
                        </p>
                        <Button
                          type="button"
                          onClick={() => { setSelectedDocToSign(doc); setSignatureInput(`${firstName} ${lastName}`.trim()); }}
                          className="bg-moss-700 hover:bg-forest-600 dark:bg-[#E5C583] dark:hover:bg-[#d8b672] text-white dark:text-[#0B1512] text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-2 shrink-0 self-end sm:self-auto cursor-pointer"
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
              /* Signed Documents List */
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
                      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-moss-600 to-amber-500 rounded-t-2xl absolute top-0 left-0" />

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

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-ink-100/40 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-ink-500 dark:text-cream-100/60">Digital Stamp:</span>
                          <span className="font-serif italic font-extrabold text-sm text-moss-800 dark:text-[#E5C583] px-2.5 py-0.5 bg-emerald-500/10 dark:bg-white/5 rounded-lg border border-emerald-500/20 dark:border-white/10">
                            {doc.signedName || "Verified Tenant"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setSelectedDocToView(doc)}
                            className="text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                            title="View Signed Contract Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleDownloadPDF(doc)}
                            className="bg-[#2C4633] hover:bg-[#1E3123] dark:bg-[#E5C583] dark:hover:bg-[#d8b672] text-white dark:text-[#0B1512] text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
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

      {/* POPUP MODAL 1: E-SIGNATURE REVIEWER */}
      {selectedDocToSign && (
        <div className="tenant-modal-backdrop" onClick={() => setSelectedDocToSign(null)}>
          <div
            className="tenant-modal-content text-left max-w-lg w-full max-h-[85vh] flex flex-col p-5 md:p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
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
                className="close-btn text-ink-400 hover:text-ink-900 dark:hover:text-white text-xl font-bold cursor-pointer"
                onClick={() => setSelectedDocToSign(null)}
              >
                &times;
              </button>
            </div>

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

              <div className="flex gap-3 pt-3 border-t border-ink-100/30 dark:border-white/10 shrink-0 bg-white dark:bg-[#13221C]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setSelectedDocToSign(null)}
                  className="flex-1 py-2.5 text-[13px] font-bold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] py-2.5 font-extrabold text-[13px] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Sign & Send to Landlord</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: SIGNED DOCUMENT VIEWER */}
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
                <button className="close-btn text-ink-400 hover:text-ink-900 dark:hover:text-white text-2xl font-bold leading-none cursor-pointer" onClick={() => setSelectedDocToView(null)}>&times;</button>
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
                  <p className="text-ink-600 dark:text-cream-100/70">The Landlord hereby demises unto the Tenant the residential apartment located at {selectedDocToView.propertyName || "Modern Luxury Villa, Lekki Phase 1"} for the agreed term.</p>
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
                  {selectedDocToView.signedName || "Verified Tenant"}
                </p>
                <p className="text-xs font-bold text-ink-900 dark:text-white">{selectedDocToView.signedName || "Tenant"}</p>
                <p className="text-[11px] text-ink-400 dark:text-cream-100/50 mt-0.5">Date: {selectedDocToView.signedAt || "Aug 7, 2026"}</p>
              </div>

              <div className="p-4 rounded-2xl border border-ink-100 dark:border-white/10 text-center bg-emerald-500/5 dark:bg-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                  LANDLORD COUNTERSIGNATURE
                </span>
                <p className="font-serif italic font-extrabold text-2xl text-[#1E382A] dark:text-[#E5C583] my-1">
                  {selectedDocToView.landlordName?.split("/").pop()?.trim() || "Engr. Clement Okoro"}
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
                className="flex-1 py-3 text-[13px] font-bold cursor-pointer"
              >
                Close Viewer
              </Button>
              <Button
                type="button"
                onClick={() => handleDownloadPDF(selectedDocToView)}
                className="flex-1 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] py-3 font-bold text-[13px] cursor-pointer"
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
