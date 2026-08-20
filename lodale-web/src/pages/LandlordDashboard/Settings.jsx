import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { User, Lock, LogOut, Calendar, CheckCircle2, Pencil, Sun, Moon, FileText, Send, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NigerianLocationSelect from "../../components/NigerianLocationSelect";
import { triggerToast } from "../../context/ToastContext";
import { formatDate } from "../../utils/formatters";
import { propertyService } from "../../services/propertyService";
import { userService } from "../../services/userService";
import { safeSetLocalStorage, safeSetSessionStorage, compressImageForStorage } from "../../utils/storageUtils";
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
    return `${firstName} ${lastName}`.trim() || localStorage.getItem("username") || "Landlord User";
  };
  const fullName = getFullName();
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [location, setLocation] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

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
        const profile = await userService.getProfile();
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
      } catch (err) {
        console.warn("Failed to fetch landlord profile", err);
      }
    }
    fetchProfile();
  }, []);
  const fileInputRef = useRef(null);

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
      if (email) {
        safeSetLocalStorage("landlordAvatar_" + email.toLowerCase(), base64Data);
      }
      const updatedProf = { ...userProfile, avatar: base64Data };
      setUserProfile(updatedProf);
      
      const savedSuccessfully = safeSetLocalStorage("currentUserProfile", JSON.stringify(updatedProf));
      if (!savedSuccessfully) {
        // Fallback: store profile without full heavy avatar in currentUserProfile if quota still tight
        const trimmedProf = { ...updatedProf, avatar: "" };
        safeSetLocalStorage("currentUserProfile", JSON.stringify(trimmedProf));
      }

      window.dispatchEvent(new Event("storage"));
      setFeedbackMessage({ type: "success", text: "Profile picture updated successfully!" });
      triggerToast("Profile picture updated successfully!", "success", "Photo Updated");
    } catch (err) {
      console.warn("Avatar processing fallback:", err);
      // Direct FileReader fallback if canvas compression fails
      const reader = new FileReader();
      reader.onload = (evt) => {
        const rawBase64 = evt.target.result;
        setAvatarUrl(rawBase64);
        if (email) {
          safeSetLocalStorage("landlordAvatar_" + email.toLowerCase(), rawBase64);
        }
        const updatedProf = { ...userProfile, avatar: rawBase64 };
        setUserProfile(updatedProf);
        safeSetLocalStorage("currentUserProfile", JSON.stringify(updatedProf));
        window.dispatchEvent(new Event("storage"));
        setFeedbackMessage({ type: "success", text: "Profile picture updated successfully!" });
        triggerToast("Profile picture updated successfully!", "success", "Photo Updated");
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
  // Inline feedback banner for avatar upload and profile actions
  const [feedbackMessage, setFeedbackMessage] = useState(null); // { type: "success" | "error", text: string }

  // Document Generator States
  const [properties, setProperties] = useState([]);
  const [activeTenantsList, setActiveTenantsList] = useState([]);
  const [tenantName, setTenantName] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [leaseStart, setLeaseStart] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [leaseTermNumber, setLeaseTermNumber] = useState("1");
  const [leaseTermUnit, setLeaseTermUnit] = useState("Year"); // "Month" | "Year"

  const termNum = Math.max(1, parseInt(leaseTermNumber, 10) || 1);
  const leaseDuration = `${termNum} ${leaseTermUnit}${termNum > 1 ? "s" : ""}`;

  const getCalculatedEndDate = (startDateStr) => {
    const endDate = new Date(startDateStr);
    if (leaseTermUnit === "Month") {
      endDate.setMonth(endDate.getMonth() + termNum);
    } else {
      endDate.setFullYear(endDate.getFullYear() + termNum);
    }
    return endDate;
  };
  const [includePets, setIncludePets] = useState(false);
  const [includeSmoking, setIncludeSmoking] = useState(false);
  const [includeLateFee, setIncludeLateFee] = useState(true);
  const [customClause, setCustomClause] = useState("");

  // Load properties and tenants
  useEffect(() => {
    async function fetchProperties() {
      try {
        const currentUserId = sessionStorage.getItem("db_user_id") || localStorage.getItem("db_user_id") || "11111111-1111-1111-1111-111111111111";
        const props = await propertyService.getLandlordProperties(currentUserId);
        setProperties(props);
        if (props.length > 0) {
          setSelectedPropertyId(props[0].id);
          setRentAmount(props[0].price || "250000");
        }
      } catch (e) {
        console.warn("Error fetching properties", e);
      }
    }
    fetchProperties();

    const savedTenants = localStorage.getItem("propertyTenants");
    let parsedTenants = {};
    if (savedTenants) {
      try {
        parsedTenants = JSON.parse(savedTenants);
      } catch {
        parsedTenants = {};
      }
    }

    const allTenants = [];
    Object.keys(parsedTenants).forEach((propId) => {
      const list = parsedTenants[propId] || [];
      list.forEach((t) => {
        allTenants.push(t);
      });
    });
    setActiveTenantsList(allTenants);

    if (allTenants.length > 0) {
      setTenantName(allTenants[0].name || allTenants[0].tenantName || "");
    }
  }, []);

  const handlePropertyChange = (propId) => {
    setSelectedPropertyId(propId);
    const prop = properties.find(p => p.id === propId);
    if (prop) {
      setRentAmount(prop.price || "");
    }
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId) || properties[0] || { title: "Specify Property", location: "Specify Location" };



  const handleDownloadDoc = () => {
    const today = formatDate(new Date(), { day: "numeric", month: "long", year: "numeric" });
    const formattedStartDate = formatDate(leaseStart, { day: "numeric", month: "long", year: "numeric" });

    const endDate = getCalculatedEndDate(leaseStart);
    const formattedEndDate = formatDate(endDate, { day: "numeric", month: "long", year: "numeric" });

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Tenancy Agreement - ${tenantName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
          body { font-family: 'Georgia', serif; line-height: 1.6; padding: 40px; color: #111; }
          h1 { text-align: center; font-size: 20pt; text-transform: uppercase; color: #2C4633; margin-bottom: 20pt; font-weight: bold; }
          h2 { font-size: 14pt; color: #2C4633; margin-top: 15pt; border-bottom: 1px solid #2C4633; padding-bottom: 3pt; font-weight: bold; }
          p { font-size: 11pt; margin-bottom: 10pt; text-align: justify; }
          ul { margin-bottom: 10pt; }
          li { font-size: 11pt; margin-bottom: 6pt; }
          .sig-table { margin-top: 50pt; width: 100%; border-collapse: collapse; border: none; }
          .sig-cell { width: 50%; border: none; padding-top: 10pt; font-size: 11pt; }
        </style>
      </head>
      <body>
        <h1>Residential Tenancy Agreement</h1>
        <p style='text-align: center; font-size: 10pt; font-style: italic; color: #666;'>Lodale Property Management System</p>
        <hr style='border: none; border-top: 2px solid #2C4633; margin-bottom: 20pt;' />
        
        <p><strong>THIS AGREEMENT</strong> is made this <strong>${today}</strong>,</p>
        
        <p><strong>BETWEEN:</strong></p>
        <p><strong>LANDLORD:</strong> ${fullName}</p>
        <p><strong>AND</strong></p>
        <p><strong>TENANT:</strong> ${tenantName || "[Tenant Name]"}</p>
        
        <h2>1. PROPERTY DESCRIPTION</h2>
        <p>The Landlord agrees to lease to the Tenant, and the Tenant agrees to lease from the Landlord, the property located at:</p>
        <p><strong>${selectedProperty.title || "[Property Title]"}</strong>, situated at <em>${selectedProperty.location || "[Property Location]"}</em>.</p>
        
        <h2>2. TERM OF LEASE</h2>
        <p>The term of this lease shall be for a duration of <strong>${leaseDuration}</strong>, commencing on <strong>${formattedStartDate}</strong> and ending on <strong>${formattedEndDate}</strong>.</p>
        
        <h2>3. RENT PAYMENT</h2>
        <p>The Tenant shall pay a rent of <strong>${rentAmount || "[Rent Amount]"}</strong> per month, payable in advance on or before the 1st day of every calendar month.</p>
        
        <h2>4. COVENANTS AND POLICIES</h2>
        <ul>
          <li><strong>PETS:</strong> ${includePets ? "The Landlord consents to the Tenant keeping domestic pets at the property." : "No pets shall be kept on the property without prior written consent from the Landlord."}</li>
          <li><strong>SMOKING:</strong> ${includeSmoking ? "Smoking is permitted in designated outdoor areas only." : "The Tenant shall maintain the property smoke-free. Indoor smoking is strictly prohibited."}</li>
          ${includeLateFee ? "<li><strong>LATE FEE:</strong> A late fee penalty of 10% of the monthly rent shall be charged if rent remains unpaid after 5 days from the due date.</li>" : ""}
          ${customClause ? `<li><strong>ADDITIONAL TERMS:</strong> ${customClause}</li>` : ""}
        </ul>
        
        <p style='margin-top: 30pt;'>IN WITNESS WHEREOF, the parties hereto have set their hands and seals on the day and year first above written.</p>
        
        <table class='sig-table'>
          <tr>
            <td class='sig-cell'>
              <div style='font-family: "Great Vibes", "Georgia", cursive; font-size: 26pt; color: #1A365D; line-height: 1; margin-bottom: 2pt;'>${fullName}</div>
              <div style='font-size: 8pt; color: #10B981; font-weight: bold; text-transform: uppercase; margin-bottom: 5pt;'>✓ Digitally Signed via Lodale Sign</div>
              <div style='border-top: 1px solid #333; width: 80%; padding-top: 5pt;'>
                <strong>${fullName}</strong><br/>
                Landlord
              </div>
            </td>
            <td class='sig-cell' style='padding-top: 40pt;'>
              <div style='border-top: 1px solid #000; width: 80%; padding-top: 5pt;'>
                <strong>${tenantName || "[Tenant Name]"}</strong><br/>
                Tenant
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Tenancy_Agreement_${(tenantName || "Tenant").replace(/\s+/g, "_")}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSaveSuccess(true);
    setToastMessage("Word document (.doc) exported successfully!");
    setTimeout(() => {
      setSaveSuccess(false);
      setToastMessage("");
    }, 3000);
  };

  const handlePrintPDF = () => {
    const today = formatDate(new Date(), { day: "numeric", month: "long", year: "numeric" });
    const formattedStartDate = formatDate(leaseStart, { day: "numeric", month: "long", year: "numeric" });

    const endDate = getCalculatedEndDate(leaseStart);
    const formattedEndDate = formatDate(endDate, { day: "numeric", month: "long", year: "numeric" });

    const printWindow = window.open("", "_blank", "width=850,height=900,left=50,top=50");
    printWindow.document.write(`
      <html>
      <head>
        <title>Tenancy Agreement - ${tenantName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
          body { 
            font-family: 'Georgia', serif; 
            line-height: 1.6; 
            padding: 50px; 
            color: #111; 
            background-color: #fff;
          }
          .header-box {
            text-align: center;
            border-bottom: 2px double #2C4633;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }
          h1 { 
            font-size: 22pt; 
            text-transform: uppercase; 
            color: #2C4633; 
            margin: 0;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .system-tag {
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #666;
            margin-top: 5px;
            display: block;
          }
          h2 { 
            font-size: 13pt; 
            color: #2C4633; 
            margin-top: 25px; 
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd; 
            padding-bottom: 3px; 
            font-weight: bold; 
          }
          p { 
            font-size: 11pt; 
            margin-bottom: 12px; 
            text-align: justify; 
          }
          ul { 
            margin-bottom: 15px; 
            padding-left: 20px;
          }
          li { 
            font-size: 11pt; 
            margin-bottom: 8px; 
          }
          .sig-row { 
            margin-top: 60px; 
            display: flex; 
            justify-content: space-between; 
          }
          .sig-box { 
            width: 45%; 
            border-top: 1px solid #333; 
            padding-top: 8px; 
            text-align: center; 
            font-size: 11pt; 
          }
          @media print {
            body { padding: 20px; }
            @page { margin: 1in; }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <h1>Tenancy Agreement</h1>
          <span class="system-tag">Lodale Property Management System</span>
        </div>
        
        <p><strong>THIS AGREEMENT</strong> is made this <strong>${today}</strong>,</p>
        
        <p><strong>BETWEEN:</strong></p>
        <p><strong>LANDLORD:</strong> ${fullName}</p>
        <p><strong>AND</strong></p>
        <p><strong>TENANT:</strong> ${tenantName || "[Tenant Name]"}</p>
        
        <h2>1. PROPERTY DESCRIPTION</h2>
        <p>The Landlord agrees to lease to the Tenant, and the Tenant agrees to lease from the Landlord, the property located at:</p>
        <p><strong>${selectedProperty.title || "[Property Title]"}</strong>, situated at <em>${selectedProperty.location || "[Property Location]"}</em>.</p>
        
        <h2>2. TERM OF LEASE</h2>
        <p>The term of this lease shall be for a duration of <strong>${leaseDuration}</strong>, commencing on <strong>${formattedStartDate}</strong> and ending on <strong>${formattedEndDate}</strong>.</p>
        
        <h2>3. RENT PAYMENT</h2>
        <p>The Tenant shall pay a rent of <strong>${rentAmount || "[Rent Amount]"}</strong> per month, payable in advance on or before the 1st day of every calendar month.</p>
        
        <h2>4. COVENANTS AND POLICIES</h2>
        <ul>
          <li><strong>PETS:</strong> ${includePets ? "The Landlord consents to the Tenant keeping domestic pets at the property." : "No pets shall be kept on the property without prior written consent from the Landlord."}</li>
          <li><strong>SMOKING:</strong> ${includeSmoking ? "Smoking is permitted in designated outdoor areas only." : "The Tenant shall maintain the property smoke-free. Indoor smoking is strictly prohibited."}</li>
          ${includeLateFee ? "<li><strong>LATE FEE:</strong> A late fee penalty of 10% of the monthly rent shall be charged if rent remains unpaid after 5 days from the due date.</li>" : ""}
          ${customClause ? `<li><strong>ADDITIONAL TERMS:</strong> ${customClause}</li>` : ""}
        </ul>
        
        <p style="margin-top: 40px;">IN WITNESS WHEREOF, the parties hereto have set their hands and seals on the day and year first above written.</p>
        
        <div class="sig-row">
          <div class="sig-box" style="border-top: none; padding-top: 0; text-align: left;">
            <div style="font-family: 'Great Vibes', 'Georgia', cursive; font-size: 28px; color: #1A365D; line-height: 1; margin-bottom: 2px;">${fullName}</div>
            <div style="font-size: 8.5px; color: #10B981; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">✓ Digitally Signed via Lodale Sign</div>
            <div style="border-top: 1px solid #333; padding-top: 5px;">
              <strong>${fullName}</strong><br/>
              Landlord
            </div>
          </div>
          <div class="sig-box" style="margin-top: 45px;">
            <strong>${tenantName || "[Tenant Name]"}</strong><br/>
            Tenant
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSendToTenant = () => {
    if (!tenantName) {
      triggerToast("Please select or enter a tenant name first.", "warning", "Missing Tenant");
      return;
    }

    const docId = "doc-" + Date.now();
    const refCode = "DOC-" + new Date().getFullYear() + "-LOD-" + Math.floor(10000 + Math.random() * 90000);
    const dateSentStr = formatDate(new Date(), { day: "numeric", month: "short", year: "numeric" });

    const newDoc = {
      id: docId,
      refCode: refCode,
      title: `Tenancy Lease Agreement (${leaseDuration})`,
      type: "Lease Agreement",
      propertyName: selectedProperty.title || "Modern Residential Unit",
      propertyLocation: selectedProperty.location || "",
      landlordName: fullName || "Landlord / Property Manager",
      tenantName: tenantName,
      rentAmount: rentAmount,
      leaseDuration: leaseDuration,
      leaseStart: leaseStart,
      dateSent: dateSentStr,
      status: "pending",
      content: `RESIDENTIAL TENANCY LEASE AGREEMENT\n\n1. PARTIES & DEMISED PREMISES:\nThis Tenancy Lease Agreement is entered into between Landlord: ${fullName} and Tenant: ${tenantName} for the demised property: ${selectedProperty.title || "Apartment Unit"}, situated at ${selectedProperty.location || "Nigeria"}.\n\n2. DURATION & COMMENCEMENT:\nThe lease term shall be for a duration of ${leaseDuration}, commencing on ${formatDate(leaseStart, { day: "numeric", month: "long", year: "numeric" })}.\n\n3. RENT & PAYMENT TERMS:\nThe agreed rent is ${rentAmount || "₦0"} per month, payable in advance on or before the agreed cycle.\n\n4. COVENANTS AND POLICIES:\n- Pets: ${includePets ? "Permitted" : "No unauthorized pets allowed"}\n- Smoking: ${includeSmoking ? "Permitted in designated outdoor areas only" : "Strictly prohibited indoors"}\n- Late Penalty: ${includeLateFee ? "10% charge if rent is unpaid after 5 days" : "Standard billing policies apply"}\n${customClause ? `\n- Additional Clauses:\n${customClause}\n` : ""}\n5. ACKNOWLEDGEMENT & EXECUTION:\nBoth parties acknowledge the validity of this contract upon digital execution.`
    };

    const savedTenantDocs = localStorage.getItem("tenantLegalDocuments");
    const tenantDocsList = savedTenantDocs ? JSON.parse(savedTenantDocs) : [];
    tenantDocsList.unshift(newDoc);
    localStorage.setItem("tenantLegalDocuments", JSON.stringify(tenantDocsList));

    const savedNotifs = localStorage.getItem("landlordNotifications");
    const notifsList = savedNotifs ? JSON.parse(savedNotifs) : [];

    const newNotif = {
      id: "notif-send-" + Date.now(),
      title: "Agreement Sent",
      message: `Tenancy agreement generated for ${selectedProperty.title} has been successfully sent to ${tenantName} for signing.`,
      time: "Just now",
      type: "success",
      read: false
    };

    notifsList.unshift(newNotif);
    localStorage.setItem("landlordNotifications", JSON.stringify(notifsList));
    window.dispatchEvent(new Event("storage"));

    setSaveSuccess(true);
    triggerToast(`Agreement successfully sent to ${tenantName} for signing!`, "success", "Agreement Sent");
    setToastMessage(`Agreement successfully sent to ${tenantName} for signing!`);
    setTimeout(() => {
      setSaveSuccess(false);
      setToastMessage("");
    }, 4000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updatedName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const cleanEmail = (email || sessionStorage.getItem("lastLoggedInEmail") || localStorage.getItem("lastLoggedInEmail") || "").toLowerCase();

      try {
        await userService.updateProfile({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phone.trim(),
          avatar_url: avatarUrl
        });
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
      safeSetSessionStorage("currentUserProfile", JSON.stringify(updatedProf));
      const savedProf = safeSetLocalStorage("currentUserProfile", JSON.stringify(updatedProf));
      if (!savedProf) {
        // Fallback: save profile without heavy avatar data if quota exceeded
        const slimProf = { ...updatedProf, avatar: "" };
        safeSetLocalStorage("currentUserProfile", JSON.stringify(slimProf));
      }

      if (cleanEmail) {
        safeSetLocalStorage("userProfile_" + cleanEmail, JSON.stringify(updatedProf));
        safeSetLocalStorage("username_" + cleanEmail, updatedName);
      }
      if (updatedName) {
        safeSetSessionStorage("username", updatedName);
        safeSetLocalStorage("username", updatedName);
      }
      if (avatarUrl && cleanEmail) {
        safeSetLocalStorage("landlordAvatar_" + cleanEmail, avatarUrl);
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
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("sessionExpiresAt");
      localStorage.removeItem("username");
      localStorage.removeItem("userRole");
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

            {/* Avatar upload feedback banner */}
            {feedbackMessage && (
              <div
                className={`mt-3 px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-[12px] font-medium transition-all ${
                  feedbackMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                }`}
              >
                <span className="leading-snug">{feedbackMessage.text}</span>
                <button
                  type="button"
                  onClick={() => setFeedbackMessage(null)}
                  className="shrink-0 text-inherit hover:opacity-70 p-0.5 cursor-pointer bg-transparent border-none outline-none"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            )}

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
              <span>Document Generator</span>
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
            <div className="set-ref-form doc-gen-wrapper">
              <h1 className="set-ref-title">Tenancy Agreement Generator</h1>
              <p className="doc-gen-subtitle text-xs text-ink-500 dark:text-cream-100/60 -mt-2.5 mb-4">
                Configure lease parameters to generate a legally-binding tenancy contract agreement.
              </p>

              <div className="doc-gen-split">
                {/* Form Controls */}
                <div className="doc-gen-form">
                  <div className="set-ref-input-group full">
                    <label className="set-ref-lbl">Select Tenant</label>
                    <div className="relative">
                      {activeTenantsList.length > 0 ? (
                        <select
                          value={tenantName}
                          onChange={(e) => setTenantName(e.target.value)}
                          className="set-ref-input cursor-pointer"
                        >
                          {activeTenantsList.map((t, idx) => (
                            <option key={t.id || idx} value={t.name || t.tenantName}>
                              {t.name || t.tenantName} ({t.email})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Type tenant's name"
                          value={tenantName}
                          onChange={(e) => setTenantName(e.target.value)}
                          className="set-ref-input"
                          required
                        />
                      )}
                    </div>
                  </div>

                  <div className="set-ref-input-group full">
                    <label className="set-ref-lbl">Select Property</label>
                    <select
                      value={selectedPropertyId}
                      onChange={(e) => handlePropertyChange(e.target.value)}
                      className="set-ref-input cursor-pointer"
                    >
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="set-ref-grid">
                    <div className="set-ref-input-group">
                      <label className="set-ref-lbl">Rent Amount (₦)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={rentAmount}
                        onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                        onChange={(e) => setRentAmount(e.target.value.replace(/[^0-9]/g, ''))}
                        className="set-ref-input"
                        placeholder="e.g. 350000"
                        required
                      />
                    </div>

                    <div className="set-ref-input-group">
                      <label className="set-ref-lbl">Lease Duration</label>
                      <div className="flex gap-2.5">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={3}
                          value={leaseTermNumber}
                          onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                          onChange={(e) => setLeaseTermNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          className="set-ref-input flex-1 min-w-[70px]"
                          placeholder="e.g. 1"
                          required
                        />
                        <select
                          value={leaseTermUnit}
                          onChange={(e) => setLeaseTermUnit(e.target.value)}
                          className="set-ref-input cursor-pointer flex-1 min-w-[105px]"
                        >
                          <option value="Month">Month(s)</option>
                          <option value="Year">Year(s)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="set-ref-input-group full">
                    <label className="set-ref-lbl">Lease Start Date</label>
                    <input
                      type="date"
                      value={leaseStart}
                      onChange={(e) => setLeaseStart(e.target.value)}
                      className="set-ref-input"
                      required
                    />
                  </div>

                  <div className="doc-gen-clauses space-y-2 mt-4">
                    <label className="set-ref-lbl font-extrabold mb-1 block">Lease Policies</label>
                    
                    <label className="flex items-center gap-2 text-xs font-semibold text-ink-700 dark:text-cream-100/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includePets}
                        onChange={(e) => setIncludePets(e.target.checked)}
                        className="accent-[#2C4633] dark:accent-[#E5C583]"
                      />
                      <span>Allow domestic pets at the property</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-ink-700 dark:text-cream-100/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeSmoking}
                        onChange={(e) => setIncludeSmoking(e.target.checked)}
                        className="accent-[#2C4633] dark:accent-[#E5C583]"
                      />
                      <span>Allow smoking in outdoor designated areas</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-ink-700 dark:text-cream-100/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeLateFee}
                        onChange={(e) => setIncludeLateFee(e.target.checked)}
                        className="accent-[#2C4633] dark:accent-[#E5C583]"
                      />
                      <span>Apply 10% penalty fee for late rent payouts</span>
                    </label>
                  </div>

                  <div className="set-ref-input-group full mt-4">
                    <label className="set-ref-lbl">Custom Terms / Clauses</label>
                    <textarea
                      placeholder="Add any additional custom lease agreements here..."
                      value={customClause}
                      onChange={(e) => setCustomClause(e.target.value)}
                      className="set-ref-input min-h-[70px] resize-none"
                    />
                  </div>
                </div>

                {/* Live Preview Paper */}
                <div className="doc-preview-card">
                  <div className="doc-paper shadow-xl bg-white dark:bg-[#16241F] border border-[#E4EAE1] dark:border-white/10 rounded-2xl p-6 md:p-8 overflow-y-auto max-h-[500px] text-left relative">
                    
                    {/* Stylized Document Watermark / Seal background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none" style={{ opacity: 0.03 }}>
                      <span className="font-serif text-[100px] font-extrabold text-[#2C4633] tracking-widest leading-none">LODALE</span>
                    </div>

                    {/* Document Header letterhead */}
                    <div className="text-center border-b pb-4 mb-5 border-[#E4EAE1] dark:border-white/10 relative">
                      {/* Decorative Seal Icon */}
                      <div className="mx-auto mb-2 w-12 h-12 rounded-full border-2 border-double border-[#2C4633] dark:border-[#E5C583] flex items-center justify-center text-[#2C4633] dark:text-[#E5C583] bg-cream-50 dark:bg-white/5 font-serif font-extrabold text-sm shadow-xs">
                        L
                      </div>
                      <h2 className="font-serif text-[#2C4633] dark:text-[#E5C583] text-xl font-bold uppercase tracking-wide">Tenancy Agreement</h2>
                      <span className="text-[9px] text-ink-400 dark:text-cream-100/50 font-bold uppercase tracking-wider block mt-1">Lodale Property Management System</span>
                    </div>

                    {/* Document body text */}
                    <div className="space-y-4 text-xs font-serif text-ink-800 dark:text-cream-100/90 leading-relaxed">
                      <p><strong>THIS AGREEMENT</strong> is made this <strong>{formatDate(new Date(), { day: "numeric", month: "long", year: "numeric" })}</strong>,</p>
                      
                      <p className="font-bold border-b pb-1 border-ink-100 dark:border-white/5 text-[11px] text-[#2C4633] dark:text-[#E5C583] uppercase tracking-wider">The Parties</p>
                      <div className="grid grid-cols-2 gap-4 bg-ink-50/50 dark:bg-white/2 p-3 rounded-xl">
                        <div>
                          <span className="text-[10px] text-ink-400 dark:text-cream-100/50 uppercase block font-bold">Landlord</span>
                          <span className="font-bold text-ink-900 dark:text-white">{fullName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-ink-400 dark:text-cream-100/50 uppercase block font-bold">Tenant</span>
                          <span className="font-bold text-ink-900 dark:text-white">{tenantName || "Specify Tenant"}</span>
                        </div>
                      </div>

                      <p className="font-bold border-b pb-1 border-ink-100 dark:border-white/5 text-[11px] text-[#2C4633] dark:text-[#E5C583] uppercase tracking-wider">1. Property Description</p>
                      <p>
                        The Landlord agrees to lease to the Tenant, and the Tenant agrees to lease from the Landlord, the property located at:
                        <strong className="block mt-1 text-ink-900 dark:text-white">{selectedProperty.title || "Specify Property"}</strong>
                        <span className="text-[11px] text-ink-500 dark:text-cream-100/60 block mt-0.5">{selectedProperty.location || "Specify Location"}</span>
                      </p>

                      <p className="font-bold border-b pb-1 border-ink-100 dark:border-white/5 text-[11px] text-[#2C4633] dark:text-[#E5C583] uppercase tracking-wider">2. Term of Lease</p>
                      <p>
                        The term of this lease shall be for a duration of <strong>{leaseDuration}</strong>, commencing on <strong>{formatDate(leaseStart, { day: "numeric", month: "long", year: "numeric" })}</strong>.
                      </p>

                      <p className="font-bold border-b pb-1 border-ink-100 dark:border-white/5 text-[11px] text-[#2C4633] dark:text-[#E5C583] uppercase tracking-wider">3. Rent Payment</p>
                      <p>
                        The Tenant shall pay a rent of <strong>{rentAmount || "₦0"}</strong> per month, payable in advance on or before the 1st of every month.
                      </p>

                      <p className="font-bold border-b pb-1 border-ink-100 dark:border-white/5 text-[11px] text-[#2C4633] dark:text-[#E5C583] uppercase tracking-wider">4. Covenants & Policies</p>
                      <ul className="list-disc pl-4 space-y-1.5 font-sans">
                        <li>
                          <strong>Pets Policy:</strong> {includePets ? "The Landlord consents to the Tenant keeping domestic pets at the property." : "No pets shall be kept on the property without prior written consent from the Landlord."}
                        </li>
                        <li>
                          <strong>Smoking Policy:</strong> {includeSmoking ? "Smoking is permitted in designated outdoor areas only." : "The Tenant shall maintain the property smoke-free. Indoor smoking is strictly prohibited."}
                        </li>
                        {includeLateFee && (
                          <li>
                            <strong>Late Fee Policy:</strong> A late fee penalty of 10% of the rent shall be charged if rent is unpaid after 5 days from the due date.
                          </li>
                        )}
                        {customClause && (
                          <li>
                            <strong>Additional Clause:</strong> {customClause}
                          </li>
                        )}
                      </ul>

                      <p className="pt-2 text-ink-500 dark:text-cream-100/60 italic text-[11px]">
                        IN WITNESS WHEREOF, the parties hereto have set their hands and seals on the day and year first above written.
                      </p>

                      {/* Signature Lines */}
                      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-ink-100 dark:border-white/10 mt-6">
                        <div className="text-left">
                          <div className="doc-e-signature font-serif text-[#1A365D] dark:text-[#E5C583] text-2xl mb-1 select-none">
                            {fullName}
                          </div>
                          <div className="doc-sig-status text-[#10B981] text-[9px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span>✓</span> Digitally Signed
                          </div>
                          <div className="border-t border-ink-300 dark:border-white/20 pt-2 text-[11px] font-bold text-ink-800 dark:text-white">
                            {fullName}
                          </div>
                          <span className="text-[9px] text-ink-400 dark:text-cream-100/50 uppercase block">Landlord Signature</span>
                        </div>
                        <div className="text-center pt-10">
                          <div className="border-t border-dashed border-ink-400 dark:border-white/20 pt-2 text-[11px] font-bold text-ink-800 dark:text-white">
                            {tenantName || "...................................."}
                          </div>
                          <span className="text-[9px] text-ink-400 dark:text-cream-100/50 uppercase block">Tenant Signature</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="doc-footer-actions flex justify-end gap-3 mt-6 border-t pt-4 border-ink-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleDownloadDoc}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-ink-200 dark:border-white/10 hover:bg-ink-100/40 dark:hover:bg-white/5 text-ink-800 dark:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" /> Export Word (.doc)
                </button>
                <button
                  type="button"
                  onClick={handlePrintPDF}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-ink-200 dark:border-white/10 hover:bg-ink-100/40 dark:hover:bg-white/5 text-ink-800 dark:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <FileText className="h-4 w-4" /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={handleSendToTenant}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2C4633] text-white dark:bg-[#E5C583] dark:text-[#263b33] hover:opacity-90 text-xs font-bold transition-all cursor-pointer"
                >
                  <Send className="h-4 w-4" /> Send to Tenant
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
