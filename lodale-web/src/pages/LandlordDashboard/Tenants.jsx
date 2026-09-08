import { useState, useEffect } from "react";
import { Search, Plus, MessageSquare, Phone, Mail, Star, X, Info, UserCheck, ShieldAlert, CheckCircle, Trash2, Bell } from "lucide-react";
import { triggerToast } from "../../context/ToastContext";
import { formatCurrency } from "../../utils/formatters";
import { propertyService } from "../../services/propertyService";
import { leaseService } from "../../services/leaseService";
import { applicationService } from "../../services/applicationService";
import { chatService } from "../../services/chatService";
import { reminderService } from "../../services/reminderService";
import { apiClient } from "../../lib/apiClient";
import Avatar from "../../components/Avatar";
import "./Tenants.css";

const TenantsSkeleton = () => (
  <div className="tenants-grid">
    {[1, 2, 3, 4, 5, 6].map((n) => (
      <div key={n} className="tenant-card animate-pulse border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-5 rounded-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-white/10 shrink-0" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded-md" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-white/10 rounded-md" />
            </div>
          </div>
          <div className="h-4 w-12 bg-slate-200 dark:bg-white/10 rounded-md" />
        </div>

        <div className="py-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-16 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-3.5 w-32 bg-slate-200 dark:bg-white/10 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-14 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-3.5 w-36 bg-slate-200 dark:bg-white/10 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-16 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-3.5 w-24 bg-slate-200 dark:bg-white/10 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-20 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-3.5 w-14 bg-slate-200 dark:bg-white/10 rounded" />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex gap-2">
          <div className="h-9 flex-1 bg-slate-200 dark:bg-white/10 rounded-xl" />
          <div className="h-9 flex-1 bg-slate-200 dark:bg-white/10 rounded-xl" />
          <div className="h-9 flex-1 bg-slate-200 dark:bg-white/10 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

export default function Tenants({ setSelectedTenantForDetails, setActiveTab }) {
  const [tenantsList, setTenantsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(8);
  const [properties, setProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All"); // All, Active, Pending, Past
  const [showAddModal, setShowAddModal] = useState(false);
  const [tenantToRate, setTenantToRate] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [rentAgain, setRentAgain] = useState("yes");

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

  // Load properties and tenants
  const loadData = async (isSilent = false) => {
    if (!isSilent && tenantsList.length === 0) {
      setIsLoading(true);
    }
    
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

        const key = String(l.tenant_id || l.id || l.tenant_email || l.tenant_name).toLowerCase();
        if (key) seenKeys.add(key);

        allTenants.push({
          id: l.tenant_id || l.id,
          name: l.tenant_name || "Unknown Tenant",
          email: l.tenant_email || "",
          phone: l.tenant_contact || l.phone || "",
          propertyId: l.property_id,
          propertyTitle: l.property_title || "Leased Property",
          status: status,
          leaseStatus: badgeLabel,
          rentAmount: l.rent_amount,
          rentPeriod: l.rent_period,
          dueDate: l.start_date ? new Date(l.start_date).toLocaleDateString("en-US", { day: 'numeric', month: 'short' }) : "1st of month",
          paymentStatus: isPaid ? "Paid" : "Unpaid"
        });
      });

      // 2. Process Applications (ONLY include if a lease agreement has been generated/sent or fully leased)
      (apps || []).forEach(a => {
        const tenantId = String(a.tenantId || a.tenant_id || a.tenant?.id || a.id || '');
        const tenantEmail = a.tenant?.email || a.email || "";
        const tenantName = `${a.tenant?.firstName || a.first_name || ''} ${a.tenant?.lastName || a.last_name || ''}`.trim() || a.tenantName || a.tenant?.name || "Tenant";
        const key = String(tenantId || tenantEmail || tenantName).toLowerCase();

        if (key && !seenKeys.has(key)) {
          const s = (a.status || '').toLowerCase();
          const isFullyLeased = s === 'leased' || s === 'active';
          const isLeaseSent = s === 'approved' || s === 'lease_generated' || s === 'pending_tenant' || s === 'signed';

          // Strictly skip raw applicants who have not been sent a lease agreement
          if (!isFullyLeased && !isLeaseSent) return;

          seenKeys.add(key);

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

      // 3. Process Local Storage Property Tenants
      try {
        const rawLocal = localStorage.getItem("propertyTenants");
        if (rawLocal) {
          const localMap = JSON.parse(rawLocal);
          if (Array.isArray(localMap)) {
            localMap.forEach(t => {
              const key = String(t.id || t.email || t.name).toLowerCase();
              if (key && !seenKeys.has(key)) {
                seenKeys.add(key);
                allTenants.push(t);
              }
            });
          } else if (typeof localMap === 'object') {
            Object.keys(localMap).forEach(propId => {
              const list = Array.isArray(localMap[propId]) ? localMap[propId] : [localMap[propId]];
              list.forEach(t => {
                if (!t) return;
                const key = String(t.id || t.email || t.name).toLowerCase();
                if (key && !seenKeys.has(key)) {
                  seenKeys.add(key);
                  allTenants.push({
                    id: t.id || Date.now(),
                    name: t.name || t.tenantName || "Tenant",
                    email: t.email || "",
                    phone: t.phone || "",
                    propertyId: propId,
                    propertyTitle: t.propertyTitle || "Property",
                    status: (t.status || 'active').toLowerCase(),
                    leaseStatus: t.leaseStatus || "Active Tenant",
                    rentAmount: t.rentAmount || 0,
                    dueDate: t.dueDate || "1st of month",
                    paymentStatus: t.paymentStatus || "Paid"
                  });
                }
              });
            });
          }
        }
      } catch (err) {
        console.warn("Error reading local propertyTenants:", err);
      }

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

      setTenantsList(allTenants);
    } catch (e) {
      console.warn("Could not load tenants list:", e);
      setTenantsList([]);
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

  // Add Tenant Submit
  const handleAddTenant = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.propertyId) {
      triggerToast("Please fill in all required fields (Name, Email, and Property)", "warning", "Missing Fields");
      return;
    }

    // Get selected property details
    const selectedProp = properties.find((p) => p.id === formData.propertyId);
    const propTitle = selectedProp ? selectedProp.title : "Property";

    const isPendingStatus = (formData.status || "pending") === "pending";
    const newTenantObj = {
      id: Date.now(),
      name: formData.name,
      tenantName: formData.name,
      avatar: "",
      email: formData.email,
      phone: formData.phone || "",
      reliabilityScore: 0,
      occupation: formData.occupation || "Independent Professional",
      income: formData.income ? formatCurrency(formData.income, "/mo") : "₦450,000/mo",
      notes: formData.notes || "Invitation sent via Lodale portal.",
      leaseStatus: isPendingStatus ? "Pending Invitation" : `Active Tenant (${formData.unit ? "Unit " + formData.unit : "Main Unit"})`,
      paymentStatus: formData.paymentStatus || "Unpaid",
      dueDate: formData.dueDate,
      status: formData.status || "pending",
      propertyId: formData.propertyId,
      propertyTitle: propTitle
    };

    // Load current tenants list map from localStorage
    const savedTenants = localStorage.getItem("propertyTenants");
    const tenantsMap = savedTenants ? JSON.parse(savedTenants) : {};

    if (!tenantsMap[formData.propertyId]) {
      tenantsMap[formData.propertyId] = [];
    }

    tenantsMap[formData.propertyId].push(newTenantObj);
    localStorage.setItem("propertyTenants", JSON.stringify(tenantsMap));

    // Register tenant into global users list for Admin visibility
    try {
      const tenantEmail = (formData.email || `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@tenant.lodale.com`).toLowerCase();
      const tenantRecord = {
        id: newTenantObj.id,
        name: formData.name,
        email: tenantEmail,
        phone: formData.phone || '',
        role: 'Tenant',
        status: isPendingStatus ? 'Pending' : 'Active'
      };
      localStorage.setItem("registeredUser_" + tenantEmail, JSON.stringify(tenantRecord));
      const existingStr = localStorage.getItem("registeredUsers");
      let existing = existingStr ? JSON.parse(existingStr) : [];
      existing = existing.filter(u => u && u.email && u.email.toLowerCase() !== tenantEmail);
      existing.push(tenantRecord);
      localStorage.setItem("registeredUsers", JSON.stringify(existing));
    } catch (e) {}

    // Seed chat thread for this tenant
    const savedChats = localStorage.getItem("landlordChats");
    const chatsList = savedChats ? JSON.parse(savedChats) : [];
    const chatExists = chatsList.some((c) => c.name === formData.name);

    if (!chatExists) {
      const newChat = {
        id: formData.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
        name: formData.name,
        avatar: newTenantObj.avatar,
        email: formData.email,
        phone: newTenantObj.phone,
        reliabilityScore: newTenantObj.reliabilityScore,
        occupation: newTenantObj.occupation,
        income: newTenantObj.income,
        notes: newTenantObj.notes,
        leaseStatus: newTenantObj.leaseStatus,
        lastMessage: "Tenant invitation sent.",
        time: "Just now",
        type: "tenant",
        messages: [
          {
            id: 1,
            sender: "landlord",
            text: `Welcome to Lodale! I have registered your profile for ${propTitle}. You can accept your invite, manage payments, and submit requests here once onboarded.`,
            time: "Just now"
          }
        ]
      };
      chatsList.push(newChat);
      localStorage.setItem("landlordChats", JSON.stringify(chatsList));
    }

    // Reset Form
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
      status: "pending"
    });

    setShowAddModal(false);
    loadData();

    // Notify other components/tabs
    window.dispatchEvent(new Event("storage"));
    triggerToast(`Invitation sent to ${formData.name}! They will show as Pending Invitation until onboarded.`, "success", "Invitation Sent");
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
    localStorage.setItem("activeChatPartnerId", partnerId);
    localStorage.setItem("activeChatTenantName", tenantName);
    window.dispatchEvent(new Event("storage"));

    // 3. Change tab to Chat (Tab index 3)
    if (setActiveTab) setActiveTab(3);
  };

  // End Lease & Rate Action
  const handleRateAndEndLease = (e) => {
    e.preventDefault();

    const { id: tenantId, propertyId } = tenantToRate;
    const savedTenants = localStorage.getItem("propertyTenants");
    if (!savedTenants) return;

    try {
      const tenantsMap = JSON.parse(savedTenants);
      const list = tenantsMap[propertyId] || [];
      const updatedList = list.map((t) => {
        if (t.id === tenantId) {
          let updatedScore = t.reliabilityScore;
          let customReviews = t.customReviews || [];

          // Only update score if rating is selected (> 0)
          if (rating > 0) {
            const prevScore = parseFloat(t.reliabilityScore) || 0;
            updatedScore = prevScore > 0 ? ((prevScore + rating) / 2).toFixed(1) : rating.toFixed(1);
          }

          // Add review if rating > 0 or comment is filled
          if (rating > 0 || comment.trim()) {
            const newReview = {
              landlord: "You (Current Landlord)",
              rating: rating > 0 ? rating : parseFloat(t.reliabilityScore) || 0,
              text: comment.trim() || "Lease ended. No written review comment provided.",
              rentAgain: rentAgain === "yes" ? "Yes" : "No"
            };
            customReviews = [newReview, ...customReviews];
          }

          return {
            ...t,
            status: "past",
            leaseStatus: "Lease Ended / Past Tenant",
            reliabilityScore: updatedScore,
            customReviews: customReviews
          };
        }
        return t;
      });

      tenantsMap[propertyId] = updatedList;
      localStorage.setItem("propertyTenants", JSON.stringify(tenantsMap));

      // Close modal & reset fields
      setTenantToRate(null);
      setRating(0);
      setComment("");
      setRentAgain("yes");

      loadData();
      window.dispatchEvent(new Event("storage"));
      triggerToast("Lease agreement successfully ended.", "info", "Lease Ended");
    } catch (error) {
      console.error("Error rating and ending lease:", error);
    }
  };

  // Remove Tenant entirely
  const handleDeleteTenant = (tenantId, propertyId) => {
    if (!window.confirm("Are you sure you want to remove this tenant from the system entirely? This action cannot be undone.")) {
      return;
    }

    const savedTenants = localStorage.getItem("propertyTenants");
    if (!savedTenants) return;

    try {
      const tenantsMap = JSON.parse(savedTenants);
      const list = tenantsMap[propertyId] || [];
      const updatedList = list.filter((t) => t.id !== tenantId);

      tenantsMap[propertyId] = updatedList;
      localStorage.setItem("propertyTenants", JSON.stringify(tenantsMap));
      loadData();
      window.dispatchEvent(new Event("storage"));
      triggerToast("Tenant record removed successfully.", "success", "Tenant Removed");
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
                      <h4 className="tenant-card-name">{tenant.name}</h4>
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
                    className="tenant-action-btn chat-btn"
                    onClick={() => handleMessageTenant(tenant.name, tenant.avatar, tenant)}
                    title="Open Chat"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Chat
                  </button>

                  <button
                    className="tenant-action-btn hover:text-emerald-600 hover:border-emerald-600 dark:hover:text-emerald-400"
                    onClick={() => {
                      reminderService.dispatchRentReminder(tenant, "Manual Request", true);
                      triggerToast(`Rent reminder sent to ${tenant.name || "tenant"}!`, "info");
                    }}
                    title="Send Rent Due Reminder"
                  >
                    <Bell className="h-3.5 w-3.5 text-emerald-500" /> Remind
                  </button>

                  <button
                    className="tenant-action-btn"
                    onClick={() => setSelectedTenantForDetails(tenant)}
                    title="View Details"
                  >
                    <Info className="h-3.5 w-3.5" /> Details
                  </button>

                  {tenant.status !== "past" ? (
                    <button
                      className="tenant-action-btn hover:text-red-500 hover:border-red-500"
                      onClick={() => {
                        setTenantToRate({
                          id: tenant.id,
                          propertyId: tenant.propertyId,
                          name: tenant.name
                        });
                        setRating(0);
                        setComment("");
                        setRentAgain("yes");
                      }}
                      title="End Lease"
                    >
                      <X className="h-3.5 w-3.5" /> End Lease
                    </button>
                  ) : (
                    <button
                      className="tenant-action-btn hover:text-red-600 hover:border-red-600"
                      onClick={() => handleDeleteTenant(tenant.id, tenant.propertyId)}
                      title="Delete Record"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>

          {/* Load More Button for Pagination / Prevent DOM Flooding */}
          {filteredTenants.length > displayLimit && (
            <div className="flex flex-col items-center justify-center pt-8 pb-4">
              <button
                onClick={() => setDisplayLimit((prev) => prev + 8)}
                className="px-6 py-2.5 rounded-xl bg-moss-700 hover:bg-moss-800 dark:bg-[#E5C583] dark:hover:bg-[#d8b46e] text-white dark:text-[#16241F] font-bold text-xs tracking-wide shadow-md transition-all flex items-center gap-2 cursor-pointer"
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
                    <label className="tenant-form-label">Assign Property *</label>
                    <select
                      name="propertyId"
                      value={formData.propertyId}
                      onChange={handleInputChange}
                      className="tenant-form-select"
                      required
                    >
                      <option value="">Select property unit...</option>
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
                  className="tenant-submit-btn"
                >
                  Register Tenant
                </button>
              </div>
            </form>

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

    </div>
  );
}
