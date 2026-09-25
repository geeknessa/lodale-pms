import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, ChevronRight, X, Users, Star, Clock, CheckCircle2, AlertTriangle, Info, ChevronDown, User, Edit3, Trash2, Loader2, Upload } from "lucide-react";
import { propertyService } from "../../services/propertyService";
import { leaseService } from "../../services/leaseService";
import { applicationService } from "../../services/applicationService";
import { formatCurrency } from "../../utils/formatters";
import { triggerToast } from "../../context/ToastContext";
import UserInfo from "./components/UserInfo";
import QuickEditPropertyModal from "../../components/QuickEditPropertyModal";
import UploadProofModal from "./components/UploadProofModal";
import Avatar from "../../components/Avatar";
import "./LandlordProperties.css";



function CustomSelect({ value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white dark:bg-[#16241F] border border-ink-100 dark:border-white/10 text-ink-900 dark:text-white rounded-xl text-[12.5px] font-bold cursor-pointer transition-all duration-200 hover:border-ink-400 dark:hover:border-white/30 hover:bg-ink-50/50 dark:hover:bg-white/5 outline-none select-none min-w-[130px]"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-ink-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full min-w-[160px] bg-white dark:bg-[#12221C] border border-[#E4EAE1] dark:border-white/10 rounded-xl shadow-lg z-50 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-[12.5px] cursor-pointer transition-colors duration-150 flex items-center justify-between select-none ${isSelected
                    ? "bg-[#2C4633] text-white dark:bg-[#E5C583] dark:text-[#263b33] font-bold"
                    : "text-ink-700 dark:text-cream-100/80 hover:bg-ink-50 dark:hover:bg-white/5"
                  }`}
              >
                <span>{option.label}</span>
                {isSelected && <span className="text-[10px] font-bold">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const RENT_OPTIONS = [
  { value: "all", label: "Rent (All)" },
  { value: "under-200", label: "< ₦200,000" },
  { value: "200-350", label: "₦200,000 - ₦350,000" },
  { value: "over-350", label: "> ₦350,000" }
];

const LOCATION_OPTIONS = [
  { value: "all", label: "Location (All)" },
  { value: "island", label: "Victoria Island" },
  { value: "yaba", label: "Yaba" },
  { value: "lekki", label: "Lekki" }
];

const TYPE_OPTIONS = [
  { value: "all", label: "Type (All)" },
  { value: "apartment", label: "Apartments" },
  { value: "house", label: "Houses & Estates" }
];

const PropertyCardSkeleton = () => (
  <div className="ap-property-card bg-white dark:bg-[#16241F] border border-ink-200 dark:border-white/10 p-4 rounded-2xl shadow-xs animate-pulse flex flex-col sm:flex-row items-center gap-4">
    <div className="ap-card-visual shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-200 dark:bg-white/10" />
    <div className="ap-card-details flex-1 min-w-0 space-y-3 w-full">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded-md" />
      </div>
      <div className="h-5 w-3/4 bg-slate-200 dark:bg-white/10 rounded-md" />
      <div className="h-3 w-1/2 bg-slate-200 dark:bg-white/10 rounded-md" />
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
        <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded-md" />
        <div className="h-4 w-16 bg-slate-200 dark:bg-white/10 rounded-full" />
      </div>
    </div>
    <div className="ap-card-actions flex items-center gap-2 w-full sm:w-auto shrink-0">
      <div className="h-9 w-16 bg-slate-200 dark:bg-white/10 rounded-xl" />
      <div className="h-9 w-20 bg-slate-200 dark:bg-white/10 rounded-xl" />
    </div>
  </div>
);

export default function LandlordProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(8);
  const [searchQuery, setSearchQuery] = useState("");
  const [rentFilter, setRentFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showTenantsPopupForProperty, setShowTenantsPopupForProperty] = useState(null);
  const [isLoadingPopupTenants, setIsLoadingPopupTenants] = useState(false);
  const [selectedTenantForDetails, setSelectedTenantForDetails] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [selectedProofProperty, setSelectedProofProperty] = useState(null);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [allLeases, setAllLeases] = useState([]);
  const [allApplications, setAllApplications] = useState([]);

  useEffect(() => {
    setDisplayLimit(8);
  }, [searchQuery, rentFilter, locationFilter, typeFilter]);

  const [username] = useState(() => {
    return sessionStorage.getItem("username") || "Ada";
  });

  const [tenantsMap, setTenantsMap] = useState({});

  useEffect(() => {
    const loadTenants = () => {
      const saved = localStorage.getItem("propertyTenants");
      if (saved) {
        try {
          setTenantsMap(JSON.parse(saved));
        } catch (e) {}
      }
    };
    loadTenants();

    async function fetchInitialTenantData() {
      try {
        const [leasesRes, appsRes] = await Promise.allSettled([
          leaseService.getMyLeases().catch(() => []),
          applicationService.getLandlordApplications().catch(() => [])
        ]);
        if (leasesRes.status === 'fulfilled' && Array.isArray(leasesRes.value)) {
          setAllLeases(leasesRes.value);
        }
        if (appsRes.status === 'fulfilled' && Array.isArray(appsRes.value)) {
          setAllApplications(appsRes.value);
        }
      } catch (e) {
        console.warn("Failed fetching initial landlord tenant data:", e);
      }
    }
    fetchInitialTenantData();

    window.addEventListener("storage", loadTenants);
    return () => window.removeEventListener("storage", loadTenants);
  }, []);

  const handleOpenTenantsPopup = async (propertyItem) => {
    setShowTenantsPopupForProperty(propertyItem);
    setIsLoadingPopupTenants(true);

    try {
      const [leasesRes, appsRes] = await Promise.allSettled([
        leaseService.getMyLeases().catch(() => []),
        applicationService.getLandlordApplications().catch(() => [])
      ]);

      if (leasesRes.status === 'fulfilled' && Array.isArray(leasesRes.value)) {
        setAllLeases(leasesRes.value);
      }
      if (appsRes.status === 'fulfilled' && Array.isArray(appsRes.value)) {
        setAllApplications(appsRes.value);
      }
    } catch (e) {
      console.warn("Error loading popup tenant details:", e);
    } finally {
      setTimeout(() => {
        setIsLoadingPopupTenants(false);
      }, 250);
    }
  };

  const getTenantsForProperty = (propertyId, propertyObj = null) => {
    const list = [];
    const seenTenantKeys = new Set();

    const targetId = String(propertyId || propertyObj?.id || "").toLowerCase().trim();
    const targetTitle = String(propertyObj?.title || "").toLowerCase().trim();

    const resolveTenantInfo = (rawName, rawContact) => {
      let name = (rawName || "").trim();
      let contact = (rawContact || "").trim();
      let email = contact.includes("@") ? contact : "";
      let phone = !contact.includes("@") ? contact : "";

      if (email) {
        try {
          const reg = localStorage.getItem("registeredUser_" + email.toLowerCase());
          if (reg) {
            const u = JSON.parse(reg);
            if (u.name) name = u.name;
            if (u.phone && !phone) phone = u.phone;
          }
        } catch (e) { }
      }

      if (!name && email) {
        const part = email.split("@")[0];
        name = part.charAt(0).toUpperCase() + part.slice(1);
      } else if (!name && phone) {
        name = phone;
      }

      return { name, email, phone };
    };

    const addTenantIfUnique = (t) => {
      if (!t) return;
      const rawName = t.name || t.tenantName || t.tenant_name || t.tenant?.name || "";
      const rawContact = t.email || t.tenantEmail || t.tenant_email || t.phone || t.contact || t.tenantContact || t.tenant_contact || t.tenant?.email || t.tenant?.phone || "";
      const resolved = resolveTenantInfo(rawName, rawContact);

      if (!resolved.name && !resolved.email && !resolved.phone) return;

      const key = String(t.id || t.tenant_id || resolved.email || resolved.name || resolved.phone).toLowerCase().trim();

      if (key && key !== "undefined" && !seenTenantKeys.has(key)) {
        seenTenantKeys.add(key);
        const tenantEmail = resolved.email ? resolved.email.toLowerCase() : "";
        const storedAvatar = tenantEmail
          ? (localStorage.getItem("tenantAvatar_" + tenantEmail) || localStorage.getItem("userAvatar_" + tenantEmail))
          : "";

        list.push({
          id: t.id || t.tenant_id || `t-${Date.now()}-${Math.random()}`,
          name: resolved.name || resolved.email || "Tenant",
          tenantName: resolved.name || resolved.email || "Tenant",
          avatar: t.avatar || t.tenantAvatar || t.avatar_url || t.tenant?.avatar || storedAvatar || "",
          email: resolved.email,
          phone: resolved.phone,
          reliabilityScore: t.reliabilityScore || t.score || t.rating || t.tenant_rating || null,
          occupation: t.occupation || t.tenant?.occupation || "Tenant",
          leaseStatus: t.leaseStatus || (t.status === 'active' ? "Active Tenant" : t.status ? `Tenant (${t.status})` : "Active Tenant"),
          status: t.status || "active"
        });
      }
    };

    const matchesProperty = (propIdVal, propTitleVal, mapKey = "") => {
      const pId = String(propIdVal || (mapKey !== targetId ? mapKey : "") || "").toLowerCase().trim();
      const pTitle = String(propTitleVal || (mapKey !== targetId ? mapKey : "") || "").toLowerCase().trim();

      if (targetId && (pId === targetId || mapKey.toLowerCase() === targetId)) return true;
      if (targetTitle && (pTitle === targetTitle || pId === targetTitle || mapKey.toLowerCase() === targetTitle)) return true;
      if (targetTitle && pTitle && (pTitle.includes(targetTitle) || targetTitle.includes(pTitle))) return true;
      return false;
    };

    // 1. Check backend Leases
    (allLeases || []).forEach(l => {
      if (matchesProperty(l.property_id || l.propertyId, l.property_title || l.propertyTitle)) {
        addTenantIfUnique({
          id: l.tenant_id || l.id,
          name: l.tenant_name,
          email: l.tenant_email,
          phone: l.tenant_contact || l.phone,
          status: l.status || "active",
          leaseStatus: l.status === "active" ? "Active Tenant" : `Lease: ${l.status}`
        });
      }
    });

    // 2. Check backend Applications
    (allApplications || []).forEach(a => {
      const s = (a.status || "").toLowerCase();
      const isApprovedOrActive = ["approved", "accepted", "active", "leased", "occupied", "lease_generated", "pending_tenant", "signed"].includes(s);
      if (isApprovedOrActive && matchesProperty(a.propertyId || a.property_id, a.propertyTitle || a.property_title)) {
        addTenantIfUnique({
          id: a.tenantId || a.tenant_id || a.id,
          name: a.tenantName || a.tenant?.name || `${a.tenant?.firstName || ''} ${a.tenant?.lastName || ''}`.trim(),
          email: a.email || a.tenantEmail || a.tenant?.email,
          phone: a.phone || a.tenantPhone || a.tenant?.phone,
          avatar: a.avatar || a.tenantAvatar || a.tenant?.avatar,
          reliabilityScore: a.reliabilityScore,
          occupation: a.occupation,
          leaseStatus: s === 'leased' || s === 'active' ? "Active Tenant" : "Lease Approved",
          status: "active"
        });
      }
    });

    // 3. Process tenantsMap state & localStorage "propertyTenants" (supports both Array & Object structure)
    try {
      const saved = localStorage.getItem("propertyTenants");
      const sourceMap = saved ? JSON.parse(saved) : tenantsMap;
      if (Array.isArray(sourceMap)) {
        sourceMap.forEach(t => {
          if (matchesProperty(t.propertyId || t.property_id, t.propertyTitle || t.property_title)) addTenantIfUnique(t);
        });
      } else if (typeof sourceMap === 'object' && sourceMap !== null) {
        Object.keys(sourceMap).forEach(key => {
          const arr = Array.isArray(sourceMap[key]) ? sourceMap[key] : [sourceMap[key]];
          arr.forEach(t => {
            if (matchesProperty(t.propertyId || t.property_id, t.propertyTitle || t.property_title, key)) addTenantIfUnique(t);
          });
        });
      }
    } catch (e) {}

    // 4. Also check tenantsMap state if populated separately
    if (typeof tenantsMap === 'object' && tenantsMap !== null) {
      if (Array.isArray(tenantsMap)) {
        tenantsMap.forEach(t => {
          if (matchesProperty(t.propertyId || t.property_id, t.propertyTitle || t.property_title)) addTenantIfUnique(t);
        });
      } else {
        Object.keys(tenantsMap).forEach(key => {
          const arr = Array.isArray(tenantsMap[key]) ? tenantsMap[key] : [tenantsMap[key]];
          arr.forEach(t => {
            if (matchesProperty(t.propertyId || t.property_id, t.propertyTitle || t.property_title, key)) addTenantIfUnique(t);
          });
        });
      }
    }

    // 5. Embedded tenant details directly on property object
    if (propertyObj) {
      const embeddedName = (propertyObj.tenant_name || propertyObj.tenantName || "").trim();
      const embeddedContact = (propertyObj.tenant_contact || propertyObj.tenantContact || propertyObj.tenant_email || propertyObj.tenantEmail || "").trim();

      if (embeddedName || embeddedContact) {
        addTenantIfUnique({
          id: `embedded-${propertyObj.id}`,
          name: embeddedName,
          email: embeddedContact.includes("@") ? embeddedContact : "",
          phone: !embeddedContact.includes("@") ? embeddedContact : "",
          reliabilityScore: propertyObj.tenant_rating || propertyObj.reliabilityScore || null,
          leaseStatus: "Active Tenant",
          status: "active"
        });
      }

      // Multi-unit tenants
      if (Array.isArray(propertyObj.units)) {
        propertyObj.units.forEach((u, uIdx) => {
          const uName = (u.tenant_name || u.tenantName || "").trim();
          const uContact = (u.tenant_contact || u.tenantContact || "").trim();
          if (uName || uContact) {
            addTenantIfUnique({
              id: `unit-${propertyObj.id}-${uIdx}`,
              name: uName,
              email: uContact.includes("@") ? uContact : "",
              phone: !uContact.includes("@") ? uContact : "",
              reliabilityScore: u.tenant_rating || u.reliabilityScore || null,
              leaseStatus: `Active Tenant (${u.unit_name || `Unit ${uIdx + 1}`})`,
              status: "active"
            });
          }
        });
      }
    }

    // 6. Check applications stored in localStorage ("applications" or "tenantApplications")
    const appSources = ["applications", "tenantApplications"];
    appSources.forEach(sKey => {
      try {
        const rawApps = localStorage.getItem(sKey);
        if (rawApps) {
          const parsedApps = JSON.parse(rawApps);
          if (Array.isArray(parsedApps)) {
            parsedApps.forEach(app => {
              const status = (app.status || "").toLowerCase();
              const isApproved = status === "approved" || status === "accepted" || status === "active" || status === "leased" || status === "occupied";
              if (isApproved && matchesProperty(app.propertyId || app.property_id, app.propertyTitle || app.property_title)) {
                addTenantIfUnique({
                  id: app.id || app.tenantId,
                  name: app.tenantName || app.name || app.userName,
                  email: app.email || app.tenantEmail,
                  phone: app.phone || app.tenantPhone,
                  avatar: app.avatar || app.tenantAvatar,
                  reliabilityScore: app.reliabilityScore,
                  occupation: app.occupation,
                  leaseStatus: "Active Tenant",
                  status: "active"
                });
              }
            });
          }
        }
      } catch (e) {}
    });

    return list;
  };

  const [selectedFeedbackProperty, setSelectedFeedbackProperty] = useState(null);

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;

    const activeTenants = getTenantsForProperty(propertyToDelete.id, propertyToDelete);
    const pStatus = (propertyToDelete.status || "").toLowerCase();
    const isOccupied = activeTenants.length > 0 || pStatus === 'occupied' || pStatus === 'active_occupied';

    if (isOccupied) {
      triggerToast("Occupied properties cannot be deleted while active tenants reside in them. Please end active leases first.", "warning", "Cannot Delete Occupied Property");
      setPropertyToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      if (propertyToDelete.id) {
        try {
          await propertyService.deleteProperty(propertyToDelete.id);
        } catch (err) {
          console.warn("Backend property delete call warning:", err);
        }
      }

      // Purge from per-user sessionStorage
      try {
        const currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId");
        const userEmail = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
        const userKey = "landlord_properties_" + (currentUserId || userEmail);
        const savedSession = sessionStorage.getItem(userKey);
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession);
          const cleanSession = parsedSession.filter(p =>
            p.id !== propertyToDelete.id &&
            (p.title || "").trim().toLowerCase() !== (propertyToDelete.title || "").trim().toLowerCase()
          );
          sessionStorage.setItem(userKey, JSON.stringify(cleanSession));
        }
      } catch (e) {}

      // Purge legacy global localStorage caches if present
      try { localStorage.removeItem("landlordProperties"); } catch (e) {}
      try { localStorage.removeItem("properties"); } catch (e) {}

      setProperties(prev => prev.filter(p => p.id !== propertyToDelete.id));
      setPropertyToDelete(null);
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error("Failed to delete property:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    async function loadProperties(isSilent = false) {
      if (!isSilent && properties.length === 0) {
        setIsLoading(true);
      }
      try {
        const currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId");
        const currentName = (username || "").toLowerCase();
        const userEmail = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();

        // 1. Immediately read cached per-user session properties so page mounts with ZERO delay
        let localProps = [];
        try {
          const userKey = "landlord_properties_" + (currentUserId || userEmail);
          const savedSessionProps = sessionStorage.getItem(userKey);
          if (savedSessionProps) {
            const parsed = JSON.parse(savedSessionProps);
            if (Array.isArray(parsed) && parsed.length > 0) localProps.push(...parsed);
          }
        } catch (err) {}

        const propMap = new Map();
        const seenSignatures = new Set();

        const addUniqueProp = (p) => {
          if (!p || (!p.id && p.id !== 0)) return;
          const propIdKey = String(p.id);

          // Enforce strict ownership check
          const pLandlordId = String(p.landlord_id || p.landlordId || p.landlord?.id || "").trim();
          if (currentUserId && pLandlordId && pLandlordId !== String(currentUserId).trim()) return;

          const sig = `${(p.title || "").trim().toLowerCase()}|${(p.address_line1 || p.address || p.location || "").trim().toLowerCase()}`;

          if (propMap.has(propIdKey)) {
            const existing = propMap.get(propIdKey);
            const merged = { ...existing, ...p, id: existing.id || p.id };
            const statusLower = (p.status || "").toLowerCase();
            if (statusLower.includes("info") || statusLower.includes("proof") || statusLower.includes("reject") || p.admin_notes || p.adminNotes) {
              merged.status = p.status;
              merged.admin_notes = p.admin_notes || p.adminNotes || merged.admin_notes;
            }
            propMap.set(propIdKey, merged);
            return;
          }

          if (sig.length > 1 && seenSignatures.has(sig)) {
            return;
          }

          propMap.set(propIdKey, {
            ...p,
            price: p.price || formatCurrency(p.rent_amount || p.rent || 2500000, "/yr"),
            location: p.location || `${p.city || "Lagos"}, ${p.state || "Lagos"}`
          });
          if (sig.length > 1) seenSignatures.add(sig);
        };

        // Populate initial local properties
        localProps.forEach((p) => {
          if (!p || !p.id) return;
          const pLandlordId = String(p.landlord_id || p.landlordId || p.landlord?.id || "").trim();
          const pLandlordName = String(p.landlord?.name || p.landlordName || p.landlord || "").trim().toLowerCase();

          if (currentUserId && pLandlordId && pLandlordId !== String(currentUserId).trim()) return;
          if (currentName && pLandlordName && !pLandlordName.includes(currentName) && !currentName.includes(pLandlordName)) return;

          addUniqueProp(p);
        });

        const initialList = Array.from(propMap.values());
        if (initialList.length > 0) {
          setProperties(initialList);
          setIsLoading(false); // Render immediately without waiting for network!
        }

        // 2. Hydrate from backend API asynchronously in background
        if (currentUserId) {
          try {
            const apiProps = await propertyService.getLandlordProperties(currentUserId);
            if (Array.isArray(apiProps)) {
              apiProps.forEach(addUniqueProp);
              const finalList = Array.from(propMap.values());
              setProperties(finalList);
              const userKey = "landlord_properties_" + (currentUserId || userEmail);
              try {
                const lightweightList = finalList.map(p => {
                  if (!p) return p;
                  const clean = { ...p };
                  if (typeof clean.cover_image === 'string' && clean.cover_image.length > 2000) delete clean.cover_image;
                  if (typeof clean.ownership_doc === 'string' && clean.ownership_doc.length > 2000) delete clean.ownership_doc;
                  if (Array.isArray(clean.images)) clean.images = clean.images.filter(img => typeof img === 'string' && img.length <= 2000);
                  return clean;
                });
                sessionStorage.setItem(userKey, JSON.stringify(lightweightList));
              } catch (storageErr) {
                console.warn("Storage quota exceeded for landlord_properties session cache:", storageErr);
              }
            }
          } catch (err) {
            console.warn("Error fetching landlord properties from API:", err);
          }
        }
      } catch (err) {
        console.warn("Error loading landlord properties:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProperties();

    const handleSilentRefresh = () => loadProperties(true);
    window.addEventListener("storage", handleSilentRefresh);
    window.addEventListener("propertyUpdated", handleSilentRefresh);
    window.addEventListener("focus", handleSilentRefresh);
    return () => {
      window.removeEventListener("storage", handleSilentRefresh);
      window.removeEventListener("propertyUpdated", handleSilentRefresh);
      window.removeEventListener("focus", handleSilentRefresh);
    };
  }, [username]);

  // Filter items
  const filteredProperties = properties.filter((item) => {
    // Search filter
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    // Rent price filtering (numeric check)
    const rawPrice = Number(item.price.replace(/[^0-9]/g, ""));
    let matchesRent = true;
    if (rentFilter === "under-200") {
      matchesRent = rawPrice < 200000;
    } else if (rentFilter === "200-350") {
      matchesRent = rawPrice >= 200000 && rawPrice <= 350000;
    } else if (rentFilter === "over-350") {
      matchesRent = rawPrice > 350000;
    }

    // Location filter
    let matchesLocation = true;
    if (locationFilter !== "all") {
      matchesLocation = item.location.toLowerCase().includes(locationFilter.toLowerCase());
    }

    // Type filter
    let matchesType = true;
    if (typeFilter !== "all") {
      const isApartment = item.title.toLowerCase().includes("apartment") || item.title.toLowerCase().includes("flat");
      const isResidency = item.title.toLowerCase().includes("residency") || item.title.toLowerCase().includes("gardens");
      if (typeFilter === "apartment") {
        matchesType = isApartment;
      } else if (typeFilter === "house") {
        matchesType = !isApartment && isResidency;
      }
    }

    return matchesSearch && matchesRent && matchesLocation && matchesType;
  });

  // Dynamic Active Tenants from storage
  const activeTenants = Object.values(tenantsMap).flat();

  // Rotate pastel styles for cards
  const pastelStyles = [
    { bg: "pastel-blue", btn: "pastel-blue-btn" },
    { bg: "pastel-purple", btn: "pastel-purple-btn" },
    { bg: "pastel-pink", btn: "pastel-pink-btn" }
  ];

  return (
    <div className="ap-grid-container">
      {/* LEFT COLUMN: Property List */}
      <div className="ap-main-col">
        {/* Subheader controls */}
        <div className="ap-sub-controls">
          <div className="ap-filter-row">
            <span className="ap-filter-lbl">Filter by:</span>

            <CustomSelect
              value={rentFilter}
              onChange={setRentFilter}
              options={RENT_OPTIONS}
              placeholder="Rent (All)"
            />

            <CustomSelect
              value={locationFilter}
              onChange={setLocationFilter}
              options={LOCATION_OPTIONS}
              placeholder="Location (All)"
            />

            <CustomSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={TYPE_OPTIONS}
              placeholder="Type (All)"
            />
          </div>

          {/* Search Bar */}
          <div className="ap-search-wrapper relative">
            <Search className="ap-search-icon" />
            <input
              type="text"
              placeholder="Search properties…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ap-search-input"
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

        {/* Proof Required Alert Banner */}
        {(() => {
          const needingProof = properties.filter(p => {
            const st = (p.status || "").toLowerCase();
            return st.includes("info") || st.includes("proof");
          });

          if (needingProof.length === 0) return null;

          return (
            <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md mb-6 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-200">
                    Proof of Ownership Required for "{needingProof[0].title}"
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                    {needingProof[0].admin_notes || "Admin requested additional title documents (Certificate of Occupancy, Deed of Assignment, or Land Receipt) to verify property ownership."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProofProperty(needingProof[0])}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer shrink-0 transition-all flex items-center gap-2"
              >
                <Upload className="h-4 w-4" /> Upload Proof Document Now
              </button>
            </div>
          );
        })()}

        {/* Properties list */}
        <div className="ap-list-stack tour-property-results">
          {isLoading ? (
            <>
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
            </>
          ) : filteredProperties.length > 0 ? (
            filteredProperties.slice(0, displayLimit).map((item, idx) => {
              const status = item.status || 'pending_review';
              const imgUrl = item.image || item.cover_image || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80";
              const propertyTenants = getTenantsForProperty(item.id, item);
              const tenantsCount = propertyTenants.length;
              const isOccupiedCard = propertyTenants.length > 0 || status === 'occupied' || status === 'active_occupied';

              return (
                <div
                  key={item.id ? `prop-${item.id}` : `prop-idx-${idx}`}
                  style={{ animationDelay: `${(idx % 8) * 45}ms` }}
                  className="ap-property-card bg-white dark:bg-[#16241F] border border-ink-200 dark:border-white/10 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-backwards"
                >
                  {/* Real Property Photo */}
                  <div className="ap-card-visual flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-ink-100 dark:bg-white/10 relative">
                    <img
                      src={imgUrl}
                      alt={item.title}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                  </div>

                  {/* Center Content */}
                  <div className="ap-card-details flex-1 min-w-0">
                    {/* Tenants avatar stack button on the top left of card details */}
                    <div className="mb-2">
                      <div
                        className="cursor-pointer inline-flex items-center gap-2"
                        onClick={() => handleOpenTenantsPopup(item)}
                        title="View current tenants"
                      >
                        {propertyTenants.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center -space-x-2">
                              {propertyTenants.slice(0, 3).map((t, tIdx) => (
                                <Avatar
                                  key={t.id || tIdx}
                                  src={t.avatar}
                                  name={t.name || t.tenantName}
                                  className="w-7 h-7 rounded-full border-2 border-white dark:border-[#16241F] text-[11px] font-bold text-white shrink-0 shadow-xs"
                                />
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-moss-800 dark:text-[#E5C583]">
                              {propertyTenants.length === 1
                                ? (propertyTenants[0].name || "1 Tenant")
                                : `${propertyTenants.length} Tenants`}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-ink-400 dark:text-cream-100/50">
                            <div className="w-7 h-7 rounded-full bg-moss-700 text-white flex items-center justify-center border border-white dark:border-[#16241F]">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">No tenants</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="ap-property-title text-base font-bold text-ink-900 dark:text-white truncate">{item.title}</h3>
                      {item.property_type && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-moss-100 dark:bg-white/10 text-moss-800 dark:text-[#E5C583] uppercase tracking-wider">
                          {item.property_type.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    <p className="ap-property-desc text-xs text-ink-600 dark:text-cream-100/70 mt-1">
                      {Array.isArray(item.units) && item.units.length > 0 ? (
                        <span className="font-semibold text-moss-700 dark:text-[#E5C583]">
                          {item.units.length} Unit{item.units.length !== 1 ? 's' : ''} total ({item.units.filter(u => u.status === 'vacant').length} Vacant) • {item.bedrooms || 1} Bed / {item.bathrooms || 1} Bath
                        </span>
                      ) : (
                        <span>{item.bedrooms || 1} Bedrooms • {item.bathrooms || 1} Bathrooms</span>
                      )}
                      {Array.isArray(item.blocks) && item.blocks.length > 0 ? ` • Blocks: ${item.blocks.map(b => b.name).join(', ')}` : ""}
                      {Array.isArray(item.amenities) && item.amenities.length > 0 ? ` • ${item.amenities.join(", ")}` : ""}
                    </p>

                    <div className="ap-card-footer-info flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-ink-100 dark:border-white/10">
                      <span className="ap-price-badge font-bold text-moss-700 dark:text-[#E5C583] text-sm">
                        {Array.isArray(item.units) && item.units.length > 1 ? `From ${item.price}` : item.price}
                      </span>

                      {/* Property Review Status Tag */}
                      {(() => {
                        const statusTag = (item.status || "").toLowerCase();
                        const isInfoReq = statusTag === 'info_requested' || statusTag === 'info requested' || statusTag === 'needs_proof' || statusTag === 'more_proof_requested';
                        const hasTenants = isOccupiedCard;
                        const isLive = statusTag === 'active_vacant' || statusTag === 'live' || statusTag === 'approved' || statusTag === 'active';
                        const isRejected = statusTag === 'rejected' || statusTag === 'inactive';
                        const isPending = statusTag === 'pending_review' || statusTag === 'pending approval' || statusTag === 'pending' || !item.status;

                        if (isInfoReq) {
                          return (
                            <button
                              onClick={() => setSelectedProofProperty(item)}
                              className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-0.5 rounded-full border border-amber-600 shadow-xs cursor-pointer animate-pulse"
                              title="Click to upload proof of ownership"
                            >
                              <AlertTriangle className="h-3 w-3" /> Upload Proof Required
                            </button>
                          );
                        }
                        if (hasTenants) {
                          return (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-300">
                              <Users className="h-3 w-3" /> Occupied
                            </span>
                          );
                        }
                        if (isLive) {
                          return (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 className="h-3 w-3" /> Live
                            </span>
                          );
                        }
                        if (isRejected) {
                          return (
                            <button
                              onClick={() => setSelectedFeedbackProperty(item)}
                              className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase bg-rose-100 hover:bg-rose-200 text-rose-900 dark:text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-300 cursor-pointer"
                            >
                              <AlertTriangle className="h-3 w-3" /> Rejected Reason
                            </button>
                          );
                        }
                        if (isPending) {
                          return (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-300">
                              <Clock className="h-3 w-3" /> Pending Review
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="ap-card-actions flex items-center gap-2">
                    <button
                      onClick={() => setEditingProperty(item)}
                      className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-200 dark:border-amber-900/40 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Edit property details"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>

                    <button
                      onClick={() => {
                        if (isOccupiedCard) {
                          triggerToast("Occupied properties cannot be deleted while active tenants reside in them. Please end all active leases first.", "warning", "Cannot Delete Occupied Property");
                          return;
                        }
                        setPropertyToDelete(item);
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1 cursor-pointer ${
                        isOccupiedCard
                          ? "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/10 opacity-70"
                          : "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/40"
                      }`}
                      title={isOccupiedCard ? "Occupied property cannot be deleted" : "Delete property"}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>

                    <button
                      onClick={() => navigate(`/dashboard/landlord/properties/${item.id}`)}
                      className="ap-action-btn btn-primary flex-1"
                      title="View details"
                    >
                      <ChevronRight className="h-4 w-4 mr-0.5" /> Details
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="ap-empty-state">
              <Building2 className="h-12 w-12 text-ink-300 mb-2" />
              <p>No properties match your filters.</p>
            </div>
          )}
        </div>

        {/* Load More Button for Pagination / Anti-Lag */}
        {filteredProperties.length > displayLimit && (
          <div className="flex flex-col items-center justify-center pt-6 pb-4">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 8)}
              className="px-6 py-2.5 rounded-xl bg-moss-700 hover:bg-moss-800 dark:bg-[#E5C583] dark:hover:bg-[#d8b46e] text-white dark:text-[#16241F] font-bold text-xs tracking-wide shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              Load More Properties ({filteredProperties.length - displayLimit} remaining)
            </button>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Showing {Math.min(displayLimit, filteredProperties.length)} of {filteredProperties.length} properties
            </span>
          </div>
        )}
      </div>



      {showTenantsPopupForProperty && (
        <div className="ap-popup-overlay" onClick={() => setShowTenantsPopupForProperty(null)}>
          <div className="ap-popup-card" onClick={(e) => e.stopPropagation()}>
            <div className="ap-popup-header">
              <h3>Current Tenants</h3>
              <p className="ap-popup-property-title">{showTenantsPopupForProperty.title}</p>
              <button
                className="ap-popup-close-btn"
                onClick={() => setShowTenantsPopupForProperty(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="ap-popup-body min-h-[140px] flex flex-col justify-center">
              {isLoadingPopupTenants ? (
                <div className="flex flex-col items-center justify-center py-8 text-moss-700 dark:text-[#E5C583]">
                  <Loader2 className="h-7 w-7 animate-spin mb-2 text-moss-700 dark:text-[#E5C583]" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-cream-100/80">Loading tenant details...</p>
                </div>
              ) : getTenantsForProperty(showTenantsPopupForProperty.id, showTenantsPopupForProperty).length === 0 ? (
                <div className="ap-popup-empty text-center py-6">
                  <User className="h-10 w-10 text-slate-300 dark:text-white/20 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-cream-100/80">No active tenants in this property.</p>
                </div>
              ) : (
                <div className="ap-popup-list space-y-2">
                  {getTenantsForProperty(showTenantsPopupForProperty.id, showTenantsPopupForProperty).map((tenant) => (
                    <div key={tenant.id} className="ap-popup-item flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-moss-300 transition-all">
                      <Avatar
                        src={tenant.avatar}
                        name={tenant.name}
                        className="w-10 h-10 rounded-full cursor-pointer text-sm font-bold text-white shrink-0 shadow-xs"
                        onClick={() => setSelectedTenantForDetails(tenant)}
                      />
                      <div className="ap-popup-info flex-1 min-w-0">
                        <div className="ap-popup-name-row flex items-center justify-between gap-2">
                          <span
                            className="ap-popup-name cursor-pointer hover:underline font-bold text-sm text-ink-900 dark:text-white truncate"
                            onClick={() => setSelectedTenantForDetails(tenant)}
                          >
                            {tenant.name}
                          </span>
                          {tenant.reliabilityScore ? (
                            <span className="ap-popup-score flex items-center gap-1 font-bold text-amber-500 text-xs shrink-0">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0 inline" />
                              <span>{tenant.reliabilityScore}</span>
                            </span>
                          ) : null}
                        </div>
                        <p className="ap-popup-lease text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tenant.leaseStatus || "Active Tenant"}</p>
                        {tenant.email && <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{tenant.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTenantForDetails && (
        <UserInfo
          tenant={selectedTenantForDetails}
          onClose={() => setSelectedTenantForDetails(null)}
        />
      )}

      {/* In-Page Quick Edit Property Modal */}
      <QuickEditPropertyModal
        isOpen={!!editingProperty}
        onClose={() => setEditingProperty(null)}
        property={editingProperty}
        onSaveSuccess={(updated) => {
          setProperties(prev => prev.map(p => p.id === editingProperty.id ? { ...p, ...updated } : p));
        }}
      />

      {/* Delete Property Confirmation Modal */}
      {propertyToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !isDeleting && setPropertyToDelete(null)}
        >
          <div
            className="bg-white dark:bg-[#16241F] border border-ink-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/50 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink-900 dark:text-white">Delete Property?</h3>
                <p className="text-xs text-ink-500 dark:text-cream-100/60">This action cannot be undone.</p>
              </div>
            </div>

            {(() => {
              const activeTenants = getTenantsForProperty(propertyToDelete.id, propertyToDelete);
              const pStatus = (propertyToDelete.status || "").toLowerCase();
              const isOccupied = activeTenants.length > 0 || pStatus === 'occupied' || pStatus === 'active_occupied';

              if (isOccupied) {
                return (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Occupied properties cannot be deleted while active tenants reside in them. Please end all active leases first.</span>
                  </div>
                );
              }

              return (
                <p className="text-sm text-ink-700 dark:text-cream-100/80">
                  Are you sure you want to delete <span className="font-bold text-ink-900 dark:text-white">"{propertyToDelete.title}"</span>? All associated data will be permanently removed.
                </p>
              );
            })()}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPropertyToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-ink-700 dark:text-cream-100/80 hover:bg-ink-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer border border-ink-200 dark:border-white/10"
              >
                Cancel
              </button>
              {(() => {
                const activeTenants = getTenantsForProperty(propertyToDelete.id, propertyToDelete);
                const pStatus = (propertyToDelete.status || "").toLowerCase();
                const isOccupied = activeTenants.length > 0 || pStatus === 'occupied' || pStatus === 'active_occupied';

                return (
                  <button
                    type="button"
                    disabled={isDeleting || isOccupied}
                    onClick={handleDeleteProperty}
                    className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-md ${
                      isOccupied
                        ? "bg-slate-400 dark:bg-white/10 text-slate-200 cursor-not-allowed opacity-60"
                        : "bg-rose-600 hover:bg-rose-700 cursor-pointer"
                    }`}
                    title={isOccupied ? "Occupied property cannot be deleted" : "Delete Property"}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" /> {isOccupied ? "Cannot Delete (Occupied)" : "Delete Property"}
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Upload Proof of Ownership Modal */}
      <UploadProofModal
        isOpen={!!selectedProofProperty}
        onClose={() => setSelectedProofProperty(null)}
        property={selectedProofProperty}
        onSuccess={(updated) => {
          setProperties(prev => prev.map(p => String(p.id) === String(updated.id) ? { ...p, ...updated } : p));
        }}
      />
    </div>
  );
}
