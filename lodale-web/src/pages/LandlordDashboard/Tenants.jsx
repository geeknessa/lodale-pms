import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, MessageSquare, Phone, Mail, Star, X, Info, UserCheck, ShieldAlert, CheckCircle, Trash2, Bell, AlertTriangle, RotateCcw, Link2, Copy, Send, ExternalLink, CheckCircle2 } from "lucide-react";
import { triggerToast } from "../../context/ToastContext";
import { formatCurrency } from "../../utils/formatters";
import { propertyService } from "../../services/propertyService";
import { leaseService } from "../../services/leaseService";
import { applicationService } from "../../services/applicationService";
import { chatService } from "../../services/chatService";
import { reminderService } from "../../services/reminderService";
import { apiClient } from "../../lib/apiClient";
import Avatar from "../../components/Avatar";
import RenewalOfferModal from "./components/RenewalOfferModal";
import RateTenantModal from "../../components/RateTenantModal";
import { profileService } from "../../services/profileService";
import "./Tenants.css";

const TenantsSkeleton = () => (
  <div className="tenants-grid">
    {[1, 2, 3, 4, 5, 6].map((n) => (
      <div key={n} className="tenant-card animate-pulse border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-[#FFFFFF]/5 p-5 rounded-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-[#FFFFFF]/10 shrink-0" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-200 dark:bg-[#FFFFFF]/10 rounded-md" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-[#FFFFFF]/10 rounded-md" />
            </div>
          </div>
          <div className="h-4 w-12 bg-slate-200 dark:bg-[#FFFFFF]/10 rounded-md" />
        </div>

        <div className="py-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-16 bg-slate-200 dark:bg-[#FFFFFF]/10 rounded" />
            <div className="h-3.5 w-32 bg-slate-200 dark:bg-[#FFFFFF]/10 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-14 bg-slate-200 dark:bg-[#FFFFFF]/10 rounded" />
            <div className="h-3.5 w-36 bg-slate-200 dark:bg-[#FFFFFF]/10 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-16 bg-slate-200 dark:bg-[#FFFFFF]/10 rounded" />
            <div className="h-3.5 w-24 bg-slate-200 dark:bg-[#FFFFFF]/10 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-20 bg-slate-200 dark:bg-[#FFFFFF]/10 rounded" />
            <div className="h-3.5 w-14 bg-slate-200 dark:bg-[#FFFFFF]/10 rounded" />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex gap-2">
          <div className="h-9 flex-1 bg-slate-200 dark:bg-[#FFFFFF]/10 rounded-xl" />
          <div className="h-9 flex-1 bg-slate-200 dark:bg-[#FFFFFF]/10 rounded-xl" />
          <div className="h-9 flex-1 bg-slate-200 dark:bg-[#FFFFFF]/10 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

export default function Tenants({ setSelectedTenantForDetails, setActiveTab, initialShowAddModal, onResetInitialAddModal }) {
  const navigate = useNavigate();
  const [tenantsList, setTenantsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(8);
  const [properties, setProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All"); // All, Active, Pending, Past
  const [showAddModal, setShowAddModal] = useState(initialShowAddModal || false);
  const [createdInvite, setCreatedInvite] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const autoOpen = sessionStorage.getItem("autoOpenAddTenantModal");
    if (autoOpen === "true") {
      setShowAddModal(true);
      sessionStorage.removeItem("autoOpenAddTenantModal");
      
      try {
        const savedDraft = sessionStorage.getItem("draftTenantFormData");
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          const newlyCreatedId = sessionStorage.getItem("latestCreatedPropertyId");
          if (newlyCreatedId) {
            parsed.propertyId = newlyCreatedId;
            sessionStorage.removeItem("latestCreatedPropertyId");
          }
          setFormData(parsed);
          sessionStorage.removeItem("draftTenantFormData");
        }
      } catch (e) {}
    } else if (initialShowAddModal) {
      setShowAddModal(true);
      if (onResetInitialAddModal) onResetInitialAddModal();
    }
  }, [initialShowAddModal, onResetInitialAddModal]);
  const [tenantToRate, setTenantToRate] = useState(null);
  const [showRateTenantModal, setShowRateTenantModal] = useState(false);
  const [selectedTenantToRate, setSelectedTenantToRate] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [rentAgain, setRentAgain] = useState("yes");
  
  const [renewalTenant, setRenewalTenant] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    setSettings(reminderService.getSettings());
  }, []);

  // Form State for Adding Tenant
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    propertyId: "",
    unit: "",
    occupation: "",
    income: "",
    notes: "",
    paymentStatus: "Paid",
    dueDate: "1st of every month",
    status: "active"
  });

  const [error, setError] = useState(null);

  // Load properties and tenants
  const loadData = async (isSilent = false) => {
    if (!isSilent && tenantsList.length === 0) {
      setIsLoading(true);
    }
    setError(null);
    
    let currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId");
    if (!currentUserId) {
      try {
        const stored = JSON.parse(sessionStorage.getItem("lodale_user") || "{}");
        currentUserId = stored.id || stored.userId || null;
      } catch (e) {}
    }
    const userEmail = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();

    // 1. Read cached properties instantly from session storage
    let propertyList = [];
    try {
      const userKey = "landlord_properties_" + (currentUserId || userEmail);
      const savedProps = sessionStorage.getItem(userKey);
      if (savedProps) {
        const parsed = JSON.parse(savedProps);
        if (Array.isArray(parsed) && parsed.length > 0) {
          propertyList = parsed;
        }
      }
    } catch (e) {}

    let tenantData = null;
    let leases = [];
    let apps = [];

    try {
      // 2. Perform API calls in parallel
      const [propsRes, tenantRes, leasesRes, appsRes] = await Promise.allSettled([
        currentUserId ? propertyService.getLandlordProperties(currentUserId).catch(() => []) : propertyService.getProperties().catch(() => []),
        apiClient('/users/tenants').catch(() => null),
        leaseService.getMyLeases().catch(() => []),
        applicationService.getLandlordApplications().catch(() => [])
      ]);

      const rawProps = propsRes.status === 'fulfilled' ? propsRes.value : [];
      const fetchedProps = Array.isArray(rawProps) ? rawProps : (rawProps && Array.isArray(rawProps.properties) ? rawProps.properties : []);
      if (fetchedProps.length > 0) {
        const propMap = new Map();
        [...propertyList, ...fetchedProps].forEach(p => {
          if (p && (p.id || p.title)) propMap.set(p.id || p.title, p);
        });
        propertyList = Array.from(propMap.values());
      }
      setProperties(propertyList);

      tenantData = tenantRes.status === 'fulfilled' ? tenantRes.value : null;
      leases = leasesRes.status === 'fulfilled' ? (Array.isArray(leasesRes.value) ? leasesRes.value : (leasesRes.value?.leases || [])) : [];
      apps = appsRes.status === 'fulfilled' ? (Array.isArray(appsRes.value) ? appsRes.value : (appsRes.value?.applications || [])) : [];

      const allTenants = [];
      const seenKeys = new Set();

      // 0. Primary Backend Tenants Endpoint
      const fetchedTenants = Array.isArray(tenantData) ? tenantData : (tenantData && Array.isArray(tenantData.tenants) ? tenantData.tenants : []);
      fetchedTenants.forEach(t => {
        if (!t) return;
        const key = String(t.id || t.email || t.name).toLowerCase();
        if (key && !seenKeys.has(key)) {
          seenKeys.add(key);
          allTenants.push(t);
        }
      });

      // 1. Process Leases from Backend API
      (leases || []).forEach(l => {
        const isSigned = !!l.tenant_signed_at || l.status === 'signed' || l.status === 'active';
        const isPaid = l.payment_status === 'paid' || l.is_paid || l.status === 'active';
        const isActive = (l.status === 'active' || isSigned) && isPaid;
        const isPending = !isActive;

        let status = 'past';
        if (isActive) status = 'active';
        else if (isPending) status = 'pending';

        let badgeLabel = 'Active Tenant';
        if (!isActive) {
          if (!isSigned && !isPaid) badgeLabel = 'Pending Sign & Pay';
          else if (!isSigned) badgeLabel = 'Pending Signature';
          else if (!isPaid) badgeLabel = 'Pending Payment';
          else badgeLabel = 'Pending';
        }

        const tenantIdentifier = String(l.tenant_email || l.tenant_name || l.tenant_id).toLowerCase();
        const propIdentifier = String(l.property_title || l.property_id).toLowerCase();
        const compositeKey = `${tenantIdentifier}-${propIdentifier}`;

        if (compositeKey && seenKeys.has(compositeKey)) return;
        seenKeys.add(compositeKey);

        allTenants.push({
          id: l.tenant_id || l.tenantId, // keep tenant's user ID as main ID
          leaseId: l.id, // the actual lease ID for API calls
          name: l.tenant_name || "Unknown Tenant",
          email: l.tenant_email || "",
          phone: l.tenant_contact || l.phone || "",
          propertyId: l.property_id,
          propertyTitle: l.property_title || "Leased Property",
          status: status,
          leaseStatus: badgeLabel,
          rentAmount: l.rent_amount,
          rentPeriod: l.rent_period,
          startDate: l.start_date || l.startDate,
          endDate: l.end_date || l.endDate,
          dueDate: l.start_date ? new Date(l.start_date).toLocaleDateString("en-US", { day: 'numeric', month: 'short' }) : "1st of month",
          paymentStatus: isPaid ? "Paid" : "Unpaid"
        });
      });

      // 2. Process Applications (ONLY include if a lease agreement has been generated/sent or fully leased)
      (apps || []).forEach(a => {
        const tenantId = String(a.tenantId || a.tenant_id || a.tenant?.id || a.id || '');
        const tenantEmail = a.tenant?.email || a.email || "";
        const tenantName = `${a.tenant?.firstName || a.first_name || ''} ${a.tenant?.lastName || a.last_name || ''}`.trim() || a.tenantName || a.tenant?.name || "Tenant";
        const tenantKey = String(tenantId || tenantEmail || tenantName).toLowerCase();
        const propKey = String(a.propertyTitle || a.property_title || a.propertyId || a.property_id).toLowerCase();
        const compositeKey = `${tenantKey}-${propKey}`;

        if (compositeKey && !seenKeys.has(compositeKey)) {
          const s = (a.status || '').toLowerCase();
          const isFullyLeased = s === 'leased' || s === 'active';
          const isLeaseSent = s === 'approved' || s === 'lease_generated' || s === 'pending_tenant' || s === 'signed';

          // Strictly skip raw applicants who have not been sent a lease agreement
          if (!isFullyLeased && !isLeaseSent) return;

          seenKeys.add(compositeKey);

          let status = isFullyLeased ? 'active' : 'pending';
          let badgeLabel = isFullyLeased ? 'Active Tenant' : 'Pending Sign & Pay';

          allTenants.push({
            id: tenantId || `tenant-app-${a.id}`,
            name: tenantName,
            email: tenantEmail,
            phone: a.tenant?.phone || a.tenantPhone || a.phone || "",
            propertyId: a.propertyId || a.property_id,
            propertyTitle: a.propertyTitle || a.property_title || "Leased Property",
            status: status,
            leaseStatus: badgeLabel,
            rentAmount: a.propertyRentAmount || a.property_rent_amount || 0,
            dueDate: "1st of month",
            paymentStatus: isFullyLeased ? "Paid" : "Unpaid"
          });
        }
      });

      // 3. (localStorage propertyTenants logic removed in favor of pure API data)

      // 4. Process Embedded Tenants directly from Property Listings (ONLY if explicit tenant contact info exists)
      const combinedProperties = [...(propertyList || [])];
      try {
        const userKey = "landlord_properties_" + (currentUserId || userEmail);
        const savedSession = sessionStorage.getItem(userKey);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (Array.isArray(parsed)) {
            parsed.forEach(p => {
              if (p && (!currentUserId || String(p.landlord_id || p.landlordId) === String(currentUserId))) {
                combinedProperties.push(p);
              }
            });
          }
        }
      } catch (e) {}

      combinedProperties.forEach(p => {
        if (!p) return;
        const embeddedName = (p.tenant_name || p.tenantName || "").trim();
        const embeddedContact = (p.tenant_contact || p.tenantContact || p.tenant_email || p.tenantEmail || "").trim();

        // ONLY process if explicit tenant name or email/phone contact exists!
        // DO NOT generate synthetic fake placeholder tenants if name and contact are empty.
        if (embeddedName || embeddedContact) {
          let email = embeddedContact.includes("@") ? embeddedContact : "";
          let phone = !embeddedContact.includes("@") ? embeddedContact : "";
          let name = embeddedName;

          if (email) {
            try {
              const reg = localStorage.getItem("registeredUser_" + email.toLowerCase());
              if (reg) {
                const u = JSON.parse(reg);
                if (u.name) name = u.name;
                if (u.phone && !phone) phone = u.phone;
              }
            } catch (e) {}
          }

          if (!name && email) {
            const part = email.split("@")[0];
            name = part.charAt(0).toUpperCase() + part.slice(1);
          } else if (!name && phone) {
            name = phone;
          }

          if (name || email || phone) {
            const tenantKey = String(email || phone || name).toLowerCase();

            // Check if this property already has a real tenant in allTenants
            const alreadyHasTenant = allTenants.some(t => 
              (t.propertyId && p.id && String(t.propertyId).toLowerCase() === String(p.id).toLowerCase()) ||
              (p.title && t.propertyTitle && String(t.propertyTitle).toLowerCase() === String(p.title).toLowerCase())
            );

            if (!seenKeys.has(tenantKey) && (!alreadyHasTenant || embeddedName)) {
              seenKeys.add(tenantKey);
              if (name) seenKeys.add(String(name).toLowerCase());
              if (email) seenKeys.add(String(email).toLowerCase());

              allTenants.push({
                id: `tenant-prop-${p.id || Date.now()}`,
                name: name || email || "Tenant",
                tenantName: name || email || "Tenant",
                email: email,
                phone: phone,
                propertyId: p.id,
                propertyTitle: p.title || p.name || "Leased Property",
                status: "active",
                leaseStatus: "Active Tenant",
                rentAmount: p.rent_amount || p.rent || p.price || 0,
                dueDate: "1st of month",
                paymentStatus: "Paid"
              });
            }
          }
        }

        // Multi-unit tenants embedded in property.units
        if (Array.isArray(p.units)) {
          p.units.forEach((u, uIdx) => {
            const rawUName = (u.tenant_name || u.tenantName || "").trim();
            const uContact = (u.tenant_contact || u.tenantContact || "").trim();
            if (rawUName || uContact) {
              let uEmail = uContact.includes("@") ? uContact : "";
              let uPhone = !uContact.includes("@") ? uContact : "";
              let uName = rawUName;

              if (uEmail) {
                try {
                  const reg = localStorage.getItem("registeredUser_" + uEmail.toLowerCase());
                  if (reg) {
                    const regUser = JSON.parse(reg);
                    if (regUser.name) uName = regUser.name;
                    if (regUser.phone && !uPhone) uPhone = regUser.phone;
                  }
                } catch (e) {}
              }

              if (!uName && uEmail) {
                const part = uEmail.split("@")[0];
                uName = part.charAt(0).toUpperCase() + part.slice(1);
              } else if (!uName && uPhone) {
                uName = uPhone;
              }

              if (uName || uEmail || uPhone) {
                const uTenantKey = String(uEmail || uPhone || uName).toLowerCase();

                if (!seenKeys.has(uTenantKey)) {
                  seenKeys.add(uTenantKey);
                  if (uName) seenKeys.add(String(uName).toLowerCase());
                  if (uEmail) seenKeys.add(String(uEmail).toLowerCase());

                  allTenants.push({
                    id: `tenant-unit-${p.id || Date.now()}-${uIdx}`,
                    name: uName || uEmail || "Tenant",
                    tenantName: uName || uEmail || "Tenant",
                    email: uEmail,
                    phone: uPhone,
                    propertyId: p.id,
                    propertyTitle: p.title || p.name || "Leased Property",
                    status: "active",
                    leaseStatus: `Active Tenant (${u.unit_name || `Unit ${uIdx + 1}`})`,
                    rentAmount: u.rent_amount || p.rent_amount || 0,
                    dueDate: "1st of month",
                    paymentStatus: "Paid"
                  });
                }
              }
            }
          });
        }
      });

      // Merge local storage invited tenants
      try {
        const storedInvites = JSON.parse(localStorage.getItem("lodale_invited_tenants") || "[]");
        if (Array.isArray(storedInvites)) {
          storedInvites.forEach((inv) => allTenants.unshift(inv));
        }
      } catch (err) {}

      // Final Deduplication by Email+Property to prevent duplicates
      const uniqueTenantsMap = new Map();
      allTenants.forEach(t => {
        const tenantKey = String(t.email || t.phone || t.name || "").toLowerCase();
        const propKey = String(t.propertyTitle || t.propertyId || "none").toLowerCase();
        const finalKey = `${tenantKey}-${propKey}`;
        
        // If we already have this tenant for this property, overwrite only if the new one is 'active'
        if (uniqueTenantsMap.has(finalKey)) {
           const existing = uniqueTenantsMap.get(finalKey);
           if (t.status === 'active' && existing.status !== 'active') {
             uniqueTenantsMap.set(finalKey, t);
           }
        } else {
           uniqueTenantsMap.set(finalKey, t);
        }
      });

      setTenantsList(Array.from(uniqueTenantsMap.values()));
    } catch (e) {
      console.warn("Could not load tenants list:", e);
      setError("Failed to load tenant directory. Please check your network connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleSilentRefresh = () => loadData(true);
    window.addEventListener("storage", handleSilentRefresh);
    window.addEventListener("focus", handleSilentRefresh);
    window.addEventListener("propertyUpdated", handleSilentRefresh);
    return () => {
      window.removeEventListener("storage", handleSilentRefresh);
      window.removeEventListener("focus", handleSilentRefresh);
      window.removeEventListener("propertyUpdated", handleSilentRefresh);
    };
  }, []);

  // Reset display chunk limit on filter / search changes for smooth lazy rendering
  useEffect(() => {
    setDisplayLimit(8);
  }, [searchQuery, activeFilter]);

  // Sync when applications approve or other tabs update localStorage
  const handleTenantChange = () => {
    loadData();
  };

  // Search & Filter logic
  const filteredTenants = tenantsList.filter((tenant) => {
    // 1. Search Query filter
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tenant.phone && tenant.phone.includes(searchQuery));

    if (!matchesSearch) return false;

    // 2. Tab Filter
    if (activeFilter === "All") return true;
    if (activeFilter === "Active") return tenant.status === "active";
    if (activeFilter === "Pending") return tenant.status === "pending" || tenant.leaseStatus?.toLowerCase().includes("pending");
    if (activeFilter === "Past") return tenant.status === "past" || tenant.status === "inactive" || tenant.status === "declined";

    return true;
  });

  // Handle Form Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Quick add property handler from Add Tenant modal
  const handleQuickAddProperty = () => {
    const rawProf = sessionStorage.getItem("currentUserProfile") || sessionStorage.getItem("landlordCurrentProfile");
    let userProf = null;
    try {
      if (rawProf) userProf = JSON.parse(rawProf);
    } catch (e) {}

    const completeness = profileService.checkProfileCompleteness(userProf);
    if (!completeness.isComplete) {
      triggerToast(`Profile Incomplete! You must complete all required profile fields (${completeness.missingFields.join(", ")}) in Settings before adding a property.`, "error", "Profile Incomplete");
      if (setActiveTab) setActiveTab(4); // Navigate to Landlord Settings Tab
      return;
    }

    try {
      sessionStorage.setItem("draftTenantFormData", JSON.stringify(formData));
      sessionStorage.setItem("autoOpenAddTenantModal", "true");
    } catch (err) {}
    navigate("/dashboard/landlord/add-property");
  };

  // Add Tenant Submit & Generate Invitation Link
  const handleAddTenant = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.propertyId) {
      triggerToast("Please fill in all required fields (Name, Email, and Property)", "warning", "Missing Fields");
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    const existingTenant = tenantsList.find(
      (t) => (t.email || "").trim().toLowerCase() === cleanEmail && String(t.propertyId || "") === String(formData.propertyId || "")
    );

    if (existingTenant) {
      triggerToast(`A tenant entry with email (${formData.email}) already exists for this property. Each tenant must have a unique email address.`, "warning", "Duplicate Email Blocked");
      return;
    }

    let defaultPassword = "LodaleTenant2026!";
    try {
      const nameParts = formData.name.trim().split(" ");
      const res = await apiClient.post("/users/invite-tenant", {
        firstName: nameParts[0] || "",
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "",
        email: cleanEmail
      });
      if (res && res.defaultPassword) {
        defaultPassword = res.defaultPassword;
      }
    } catch (err) {
      if (err.message && err.message.includes("User already exists")) {
        triggerToast("An account with this email already exists on Lodale. Please ask the tenant to sign in.", "warning", "User Exists");
      } else {
        triggerToast("Failed to provision invited tenant. Please try again.", "error", "Invite Failed");
      }
      return;
    }

    const selectedProp = properties.find((p) => String(p.id) === String(formData.propertyId));
    const onboardingLink = `${window.location.origin}/apply/${formData.propertyId}?invitedEmail=${encodeURIComponent(formData.email)}&tenantName=${encodeURIComponent(formData.name)}`;

    const newTenant = {
      id: `invited-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || "Pending Tenant Entry",
      propertyId: formData.propertyId,
      propertyTitle: selectedProp ? selectedProp.title : "Assigned Property",
      unit: formData.unit || "",
      occupation: formData.occupation || "Pending Tenant Entry",
      income: formData.income || "",
      notes: formData.notes || "",
      status: "pending",
      leaseStatus: "Invited (Pending Onboarding)",
      paymentStatus: formData.paymentStatus || "Grace Period",
      dueDate: formData.dueDate || "1st of every month",
      rentAmount: selectedProp ? (selectedProp.price || 0) : 0,
      invitedAt: new Date().toISOString(),
      onboardingLink: onboardingLink,
      incompleteFields: {
        phone: !formData.phone,
        occupation: !formData.occupation,
        income: !formData.income,
        unit: !formData.unit,
      }
    };

    // Prepend to active directory state
    setTenantsList((prev) => [newTenant, ...prev]);

    // Persist to local storage cache so it remains present
    try {
      const storedInvites = JSON.parse(localStorage.getItem("lodale_invited_tenants") || "[]");
      localStorage.setItem("lodale_invited_tenants", JSON.stringify([newTenant, ...storedInvites]));
    } catch (err) {}

    triggerToast(`Onboarding invitation sent to ${formData.email}! Direct onboarding link ready.`, "success", "Invitation Dispatched");

    // Open Invitation Modal
    setCreatedInvite({
      tenantName: formData.name,
      email: formData.email,
      propertyTitle: selectedProp ? selectedProp.title : "Assigned Property",
      link: onboardingLink
    });

    setShowAddModal(false);
    // Reset form data
    setFormData({
      name: "",
      email: "",
      phone: "",
      propertyId: "",
      unit: "",
      occupation: "",
      income: "",
      notes: "",
      paymentStatus: "Paid",
      dueDate: "1st of every month",
      status: "active"
    });
  };

  // Direct contact helper -> goes to chat tab
  const handleMessageTenant = async (tenantName, tenantAvatar, tenantObj) => {
    const partnerId = tenantObj?.id || tenantObj?.tenant_id || `tenant-${tenantName.toLowerCase().replace(/\s+/g, '-')}`;
    try {
      await chatService.sendMessage(partnerId, `Hello ${tenantName}, direct message initiated from Tenants Directory.`, null, {
        partner_name: tenantName,
        partner_avatar: tenantAvatar || ""
      });
    } catch (e) { }

    sessionStorage.setItem("activeChatPartnerId", partnerId);
    window.dispatchEvent(new Event("storage"));

    // 3. Change tab to Chat (Tab index 3)
    if (setActiveTab) setActiveTab(3);
  };

  // End Lease & Rate Action
  const handleRateAndEndLease = async (e) => {
    e.preventDefault();
    if (!tenantToRate) return;

    if (!tenantToRate.leaseId) {
      triggerToast("Cannot end lease: No active lease found for this tenant.", "error");
      return;
    }

    try {
      await leaseService.endLease(tenantToRate.leaseId);
      triggerToast("Lease agreement successfully ended.", "info", "Lease Ended");
    } catch (error) {
      console.error("Error rating and ending lease:", error);
      triggerToast("Failed to end lease. Please try again.", "error", "Operation Failed");
    } finally {
      setTenantToRate(null);
      setRating(0);
      setComment("");
      setRentAgain("yes");
      loadData();
    }
  };

  // Remove Tenant entirely
  const handleDeleteTenant = async (tenantId) => {
    if (!window.confirm("Are you sure you want to remove this tenant from the system entirely? This action cannot be undone.")) {
      return;
    }

    try {
      triggerToast("To fully remove a tenant from your portfolio, please terminate their lease in the Leases tab.", "warning", "Action Restricted");
    } catch (e) {
      console.error("Error removing tenant:", e);
    }
  };

  return (
    <div className="tenants-container">
      {/* FILTER & SEARCH ROW */}
      <div className="tenants-controls">
        <div className="tenants-left-controls">
          <div className="tenants-tabs">
            {["All", "Active", "Pending", "Past"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`tenants-tab-btn ${activeFilter === tab ? "active" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="tenants-search-box tour-tenants-search relative">
            <Search className="tenants-search-icon h-4 w-4" />
            <input
              type="text"
              maxLength={255}
              placeholder="Search tenants, properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tenants-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-900 dark:hover:text-white cursor-pointer transition-colors p-1 flex items-center justify-center border-none bg-transparent outline-none"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <button
          className="invite-tenant-btn"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-4 w-4" /> Add Tenant
        </button>
      </div>

      {/* CARDS GRID */}
      {isLoading ? (
        <TenantsSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-50/60 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/40 max-w-md mx-auto my-6">
          <AlertTriangle className="h-10 w-10 text-rose-500 mb-3" />
          <h3 className="font-bold text-ink-800 dark:text-white mb-1">Failed to load tenant records</h3>
          <p className="text-sm text-rose-700 dark:text-rose-400 mb-4">{error}</p>
          <button
            onClick={() => loadData(false)}
            className="flex items-center gap-2 px-4 py-2 bg-moss-600 hover:bg-moss-700 dark:bg-[#E5C583] dark:hover:bg-[#D8B672] text-white dark:text-[#263b33] text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" /> Try Again
          </button>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="tenants-empty-state">
          <div className="tenants-empty-icon-wrapper">
            <X className="h-8 w-8" />
          </div>
          <h3 className="tenants-empty-title">No Tenants Found</h3>
          <p className="tenants-empty-desc">
            No tenants match your search query or filter category. Add a new tenant to populate this directory.
          </p>
        </div>
      ) : (
        <>
          <div className="tenants-grid tour-tenants-list">
            {filteredTenants.slice(0, displayLimit).map((tenant) => (
              <div key={tenant.id} className="tenant-card">

                {/* Card Header */}
                <div className="tenant-card-header">
                  <div className="tenant-card-profile">
                    <div onClick={() => setSelectedTenantForDetails(tenant)} className="cursor-pointer">
                      <Avatar 
                        src={tenant.avatar} 
                        name={tenant.name} 
                        className="tenant-card-avatar rounded-full" 
                      />
                    </div>
                    <div className="tenant-card-meta">
                      <div className="flex items-center gap-2">
                        <h4 className="tenant-card-name">{tenant.name}</h4>
                        {settings?.loyaltyRewardsEnabled && tenant.paymentStatus === "Paid" && (
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" title="Perfect Payment History" />
                        )}
                      </div>
                      <span className={`tenant-card-lease-status ${tenant.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'} px-2 py-0.5 rounded-md text-[11px] font-bold inline-block mt-0.5`}>
                        {tenant.leaseStatus || (tenant.status === 'active' ? "Active Tenant" : "Pending Sign & Pay")}
                      </span>
                    </div>
                  </div>

                  <div className="tenant-card-score" title="Tenant Reliability Score">
                    <Star className="h-3.5 w-3.5 fill-[#D69E2E] text-[#D69E2E]" />
                    <span>{tenant.reliabilityScore > 0 ? tenant.reliabilityScore : "No rating"}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="tenant-card-body">
                  <div className="tenant-detail-row">
                    <span className="tenant-detail-label">Property</span>
                    <span className="tenant-detail-value property-link" onClick={() => setSelectedTenantForDetails(tenant)}>
                      {tenant.propertyTitle}
                    </span>
                  </div>

                  <div className="tenant-detail-row">
                    <span className="tenant-detail-label">Email</span>
                    <span className="tenant-detail-value" title={tenant.email}>{tenant.email}</span>
                  </div>

                  <div className="tenant-detail-row">
                    <span className="tenant-detail-label">Phone</span>
                    <span className="tenant-detail-value">{tenant.phone}</span>
                  </div>

                  <div className="tenant-detail-row">
                    <span className="tenant-detail-label">Due Date</span>
                    <span className="tenant-detail-value">{tenant.dueDate || "1st of month"}</span>
                  </div>

                  <div className="tenant-detail-row">
                    <span className="tenant-detail-label">Rent Status</span>
                    <span className={`payment-badge ${(tenant.paymentStatus || "Paid").toLowerCase().replace(" ", "-")}`}>
                      {tenant.paymentStatus || "Paid"}
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="tenant-card-actions">
                  <button
                    className="tenant-action-btn chat-btn w-full"
                    onClick={() => handleMessageTenant(tenant.name, tenant.avatar, tenant)}
                    title="Open Chat"
                  >
                    <MessageSquare className="h-4 w-4" /> Chat
                  </button>

                  <button
                    className="tenant-action-btn w-full hover:bg-moss-50 hover:text-moss-700 dark:hover:bg-moss-950/30"
                    onClick={() => setSelectedTenantForDetails(tenant)}
                    title="View Details"
                  >
                    <Info className="h-4 w-4" /> View Details
                  </button>

                  <button
                    className="tenant-action-btn w-full hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30"
                    onClick={() => {
                      setSelectedTenantToRate(tenant);
                      setShowRateTenantModal(true);
                    }}
                    title="Rate Tenant"
                  >
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Rate
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Load More Button for Pagination / Prevent DOM Flooding */}
          {filteredTenants.length > displayLimit && (
            <div className="flex flex-col items-center justify-center pt-8 pb-4">
              <button
                onClick={() => setDisplayLimit((prev) => prev + 8)}
                className="px-6 py-2.5 rounded-xl bg-moss-700 hover:bg-moss-800 dark:bg-[#E5C583] dark:hover:bg-[#d8b46e] text-white dark:text-[#07130D] font-bold text-xs tracking-wide shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                Load More Tenants ({filteredTenants.length - displayLimit} remaining)
              </button>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Showing {Math.min(displayLimit, filteredTenants.length)} of {filteredTenants.length} tenants
              </span>
            </div>
          )}
        </>
      )}

      {/* ADD TENANT MODAL */}
      {showAddModal && (
        <div className="tenant-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="tenant-modal-card" onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="tenant-modal-header">
              <h3 className="tenant-modal-title">Add New Tenant</h3>
              <button
                className="tenant-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddTenant}>
              <div className="tenant-modal-body">
                <div className="tenant-form-grid">

                  {/* Property Dropdown (Required) */}
                  <div className="tenant-form-group tenant-form-full">
                    <div className="flex items-center justify-between mb-1">
                      <label className="tenant-form-label mb-0">Assign Property *</label>
                      <button
                        type="button"
                        onClick={handleQuickAddProperty}
                        className="text-xs font-bold text-moss-700 hover:text-moss-800 dark:text-[#E5C583] dark:hover:text-amber-300 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Property
                      </button>
                    </div>
                    <select
                      name="propertyId"
                      value={formData.propertyId}
                      onChange={(e) => {
                        if (e.target.value === "__ADD_NEW_PROPERTY__") {
                          handleQuickAddProperty();
                        } else {
                          handleInputChange(e);
                        }
                      }}
                      className="tenant-form-select"
                      required
                    >
                      <option value="">Select property unit...</option>
                      <option value="__ADD_NEW_PROPERTY__" className="font-bold text-moss-700 dark:text-[#E5C583]">
                        + Add New Property...
                      </option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Name (Required) */}
                  <div className="tenant-form-group">
                    <label className="tenant-form-label">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      maxLength={50}
                      value={formData.name}
                      onInput={(e) => e.target.value = e.target.value.replace(/[0-9]/g, '')}
                      onChange={handleInputChange}
                      placeholder="e.g. John Doe"
                      className="tenant-form-input"
                      required
                    />
                  </div>

                  {/* Email (Required) */}
                  <div className="tenant-form-group">
                    <label className="tenant-form-label">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      maxLength={100}
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. john.doe@email.com"
                      className="tenant-form-input"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="tenant-form-group">
                    <label className="tenant-form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      maxLength={15}
                      value={formData.phone}
                      onInput={(e) => e.target.value = e.target.value.replace(/[^0-9+]/g, '')}
                      onChange={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9+]/g, '');
                        handleInputChange(e);
                      }}
                      placeholder="e.g. +234 803 123 4567"
                      className="tenant-form-input"
                    />
                  </div>

                  {/* Unit Number */}
                  <div className="tenant-form-group">
                    <label className="tenant-form-label">Unit / Suite Number</label>
                    <input
                      type="text"
                      name="unit"
                      maxLength={50}
                      value={formData.unit}
                      onChange={handleInputChange}
                      placeholder="e.g. Unit 4B"
                      className="tenant-form-input"
                    />
                  </div>

                  {/* Occupation */}
                  <div className="tenant-form-group">
                    <label className="tenant-form-label">Occupation</label>
                    <input
                      type="text"
                      name="occupation"
                      maxLength={100}
                      value={formData.occupation}
                      onChange={handleInputChange}
                      placeholder="e.g. Software Engineer"
                      className="tenant-form-input"
                    />
                  </div>

                  {/* Income */}
                  <div className="tenant-form-group">
                    <label className="tenant-form-label">Monthly Income (₦)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="income"
                      value={formData.income}
                      onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                      onChange={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                        handleInputChange(e);
                      }}
                      placeholder="e.g. 500000"
                      className="tenant-form-input"
                    />
                  </div>

                  {/* Rent status */}
                  <div className="tenant-form-group">
                    <label className="tenant-form-label">Initial Rent Status</label>
                    <select
                      name="paymentStatus"
                      value={formData.paymentStatus}
                      onChange={handleInputChange}
                      className="tenant-form-select"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Grace Period">Grace Period</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>

                  {/* Rent Due Date */}
                  <div className="tenant-form-group">
                    <label className="tenant-form-label">Rent Due Date</label>
                    <input
                      type="text"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      placeholder="e.g. 1st of every month"
                      className="tenant-form-input"
                    />
                  </div>

                  {/* Notes */}
                  <div className="tenant-form-group tenant-form-full">
                    <label className="tenant-form-label">Verification / Tenant Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="e.g. Credit score verified. Clean background review."
                      className="tenant-form-textarea"
                    />
                  </div>

                </div>
              </div>

              {/* Modal Footer */}
              <div className="tenant-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="tenant-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tenant-submit-btn flex items-center gap-1.5 justify-center"
                >
                  <Send className="h-4 w-4" /> Add Tenant & Send Invite
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ONBOARDING INVITATION DISPATCHED MODAL */}
      {createdInvite && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" onClick={() => setCreatedInvite(null)}>
          <div className="bg-[#FFFFFF] dark:bg-[#07130D] border border-ink-200 dark:border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setCreatedInvite(null)}
              className="absolute top-4 right-4 text-ink-400 hover:text-ink-900 dark:hover:text-white p-1 rounded-full cursor-pointer bg-transparent border-none"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-[#FFFFFF]/5 text-emerald-700 dark:text-cream-100 flex items-center justify-center shadow-inner">
              <Send className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-ink-900 dark:text-white">Onboarding Invitation Sent!</h3>
              <p className="text-xs text-ink-600 dark:text-cream-100/75 leading-relaxed">
                An invitation email has been dispatched to <strong className="text-ink-900 dark:text-white">{createdInvite.email}</strong> for <strong className="text-moss-700 dark:text-[#E5C583]">{createdInvite.propertyTitle}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#FFFFFF]/5 border border-ink-100 dark:border-white/10 text-left space-y-2">
              <span className="text-[11px] font-bold text-ink-500 dark:text-cream-100/60 uppercase tracking-wider block">Direct Shareable Link</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdInvite.link}
                  className="w-full text-xs bg-[#FFFFFF] dark:bg-black/40 border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2.5 text-ink-800 dark:text-cream-100 select-all font-mono truncate"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdInvite.link);
                    setCopiedLink(true);
                    triggerToast("Invitation link copied to clipboard!", "success", "Link Copied");
                    setTimeout(() => setCopiedLink(false), 3000);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-moss-700 hover:bg-moss-800 dark:bg-[#E5C583] dark:hover:bg-[#d8b46e] text-white dark:text-[#07130D] font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer transition-all border-none outline-none shadow-xs"
                >
                  {copiedLink ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedLink ? "Copied" : "Copy Link"}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-left">
              <p className="text-[11.5px] text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                If the tenant does not have a Lodale account, opening this link guides them to sign up and complete any profile details you left blank. If they already have an account, it logs them in directly.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreatedInvite(null)}
              className="w-full py-3 rounded-xl bg-moss-700 hover:bg-moss-800 dark:bg-[#E5C583] dark:hover:bg-[#d8b46e] text-white dark:text-[#07130D] font-bold text-xs cursor-pointer transition-all border-none outline-none shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* END LEASE & RATE TENANT MODAL */}
      {tenantToRate && (
        <div className="tenant-modal-overlay" onClick={() => setTenantToRate(null)}>
          <div className="tenant-modal-card" onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="tenant-modal-header">
              <h3 className="tenant-modal-title">End Lease & Rate Tenant</h3>
              <button
                className="tenant-modal-close"
                onClick={() => setTenantToRate(null)}
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRateAndEndLease}>
              <div className="tenant-modal-body">
                <div className="end-lease-warning-box">
                  <ShieldAlert className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p>
                    Are you sure you want to end the lease for <strong>{tenantToRate.name}</strong>? This action updates their status to past. Please leave a review of your experience.
                  </p>
                </div>

                <div className="tenant-form-grid">
                  {/* Star Rating Selection */}
                  <div className="tenant-form-group tenant-form-full">
                    <label className="tenant-form-label" style={{ textAlign: "center", display: "block" }}>
                      Tenant Reliability Rating (Optional)
                    </label>
                    <div className="star-rating-container">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-rating-btn ${star <= rating ? "selected" : ""}`}
                          onClick={() => setRating(star)}
                        >
                          <Star className="h-8 w-8 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="tenant-form-group tenant-form-full">
                    <label className="tenant-form-label">Review Comment (Optional)</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share details about their payment punctuality, communication, property care, etc..."
                      className="tenant-form-textarea"
                    />
                  </div>

                  {/* Would rent again */}
                  <div className="tenant-form-group tenant-form-full rent-again-group">
                    <label className="tenant-form-label">Would you rent to them again?</label>
                    <div className="rent-again-options">
                      <button
                        type="button"
                        className={`rent-again-option-btn yes ${rentAgain === "yes" ? "selected" : ""}`}
                        onClick={() => setRentAgain("yes")}
                      >
                        <UserCheck className="h-4 w-4" /> Yes, absolutely
                      </button>
                      <button
                        type="button"
                        className={`rent-again-option-btn no ${rentAgain === "no" ? "selected" : ""}`}
                        onClick={() => setRentAgain("no")}
                      >
                        <X className="h-4 w-4" /> No
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="tenant-modal-footer">
                <button
                  type="button"
                  onClick={() => setTenantToRate(null)}
                  className="tenant-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tenant-submit-btn"
                  style={{ backgroundColor: "#2C4633", color: "#ffffff" }}
                >
                  End Lease & Submit Review
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* RENEWAL OFFER MODAL */}
      <RenewalOfferModal
        isOpen={!!renewalTenant}
        onClose={() => setRenewalTenant(null)}
        tenant={renewalTenant}
        onConfirm={(lease, t) => {
          triggerToast(`Renewal lease generated for ${t.name || t.tenantName}!`, "success");
          loadData(true);
        }}
      />

      {/* RATE TENANT MODAL */}
      {showRateTenantModal && selectedTenantToRate && (
        <RateTenantModal
          isOpen={showRateTenantModal}
          onClose={() => setShowRateTenantModal(false)}
          tenantId={selectedTenantToRate.id || selectedTenantToRate.tenantId || selectedTenantToRate.email}
          tenantName={selectedTenantToRate.name || selectedTenantToRate.tenantName || "Tenant"}
          landlordId={sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId") || "landlord"}
          landlordName="Landlord"
          propertyTitle={selectedTenantToRate.propertyTitle || ""}
          onSuccess={() => loadData(true)}
        />
      )}
    </div>
  );
}
