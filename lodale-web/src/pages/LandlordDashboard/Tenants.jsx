import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, MessageSquare, Star, X, Info, UserCheck, ShieldAlert, AlertTriangle, RotateCcw, Copy, Send, CheckCircle2, FileText } from "lucide-react";
import { triggerToast } from "../../context/ToastContext";
import { propertyService } from "../../services/propertyService";
import { leaseService } from "../../services/leaseService";
import { applicationService } from "../../services/applicationService";
import { rentService } from "../../services/rentService";
import { chatService } from "../../services/chatService";
import { reminderService } from "../../services/reminderService";
import { apiClient } from "../../lib/apiClient";
import Avatar from "../../components/Avatar";
import RenewalOfferModal from "./components/RenewalOfferModal";
import RateTenantModal from "../../components/RateTenantModal";
import InvoiceBuilderModal from "../../components/InvoiceBuilderModal";
import { profileService } from "../../services/profileService";
import { ratingService } from "../../services/ratingService";
import { formatDateOnly } from "../../utils/formatters";
import { parseRentAmount } from "../../utils/landlordMetrics";
import "./Tenants.css";
export const makeTenancyKey = (tenantId, propertyId) => {
  const tId = String(tenantId || "").trim().toLowerCase();
  const pId = String(propertyId || "").trim().toLowerCase();
  return `${tId}::${pId}`;
};

const formatTenantDueDate = (dateVal) => {
  if (!dateVal || dateVal === "—") return "—";
  if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();
    if (trimmed === "—" || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
      return "—";
    }
    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed) || trimmed.includes("T")) {
      const formatted = formatDateOnly(trimmed);
      return formatted !== "—" ? formatted : trimmed;
    }
    return trimmed;
  }
  return formatDateOnly(dateVal);
};

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
  const [invoiceTenant, setInvoiceTenant] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
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

  const isFetchingDataRef = useRef(false);

  // Load properties and tenants
  const loadData = async (isSilent = false) => {
    if (isFetchingDataRef.current) return;
    isFetchingDataRef.current = true;
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

    try {
      // 2. Perform API calls in parallel
      const [propsRes, leasesRes, appsRes, invoicesRes, tenantsRes] = await Promise.allSettled([
        currentUserId ? propertyService.getLandlordProperties(currentUserId).catch(() => []) : propertyService.getProperties().catch(() => []),
        leaseService.getMyLeases().catch(() => []),
        applicationService.getLandlordApplications().catch(() => []),
        rentService.getMyInvoices().catch(() => []),
        apiClient('/users/tenants').catch(() => null)
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

      // Gather all property lookups (including session storage)
      const allPropertiesForLookup = [...propertyList];
      try {
        const userKey = "landlord_properties_" + (currentUserId || userEmail);
        const savedSession = sessionStorage.getItem(userKey);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (Array.isArray(parsed)) {
            parsed.forEach(p => {
              if (p && (!currentUserId || String(p.landlord_id || p.landlordId) === String(currentUserId))) {
                allPropertiesForLookup.push(p);
              }
            });
          }
        }
      } catch (e) {}

      const propertyById = new Map();
      const propertyByTitle = new Map();
      allPropertiesForLookup.forEach(p => {
        if (!p) return;
        if (p.id) propertyById.set(String(p.id).toLowerCase().trim(), p);
        if (p.title) propertyByTitle.set(String(p.title).toLowerCase().trim(), p);
      });

      const leases = leasesRes.status === 'fulfilled' ? (Array.isArray(leasesRes.value) ? leasesRes.value : (leasesRes.value?.leases || [])) : [];
      const apps = appsRes.status === 'fulfilled' ? (Array.isArray(appsRes.value) ? appsRes.value : (appsRes.value?.applications || [])) : [];
      const rawInvoices = invoicesRes.status === 'fulfilled' ? invoicesRes.value : [];
      const invoices = Array.isArray(rawInvoices) ? rawInvoices : (rawInvoices && Array.isArray(rawInvoices.invoices) ? rawInvoices.invoices : []);
      const tenantData = tenantsRes.status === 'fulfilled' ? tenantsRes.value : null;
      const fetchedTenants = Array.isArray(tenantData) ? tenantData : (tenantData && Array.isArray(tenantData.tenants) ? tenantData.tenants : []);

      // Identity cross-reference maps (email <-> tenantId)
      const emailToTenantIdMap = new Map();
      const tenantIdToEmailMap = new Map();

      const registerIdentity = (tId, email) => {
        const cleanTId = tId ? String(tId).trim().toLowerCase() : "";
        const cleanEmail = email ? String(email).trim().toLowerCase() : "";
        if (cleanTId && cleanEmail) {
          emailToTenantIdMap.set(cleanEmail, cleanTId);
          tenantIdToEmailMap.set(cleanTId, cleanEmail);
        }
      };

      fetchedTenants.forEach(t => {
        if (!t) return;
        registerIdentity(t.tenantId || t.id, t.email || t.tenant_email);
      });
      leases.forEach(l => {
        if (!l) return;
        registerIdentity(l.tenant_id || l.tenantId, l.tenant_email);
      });
      apps.forEach(a => {
        if (!a) return;
        registerIdentity(a.tenantId || a.tenant_id || a.tenant?.id, a.tenant?.email || a.email);
      });
      invoices.forEach(inv => {
        if (!inv) return;
        registerIdentity(inv.tenantId || inv.tenant_id, inv.tenantEmail || inv.tenant_email);
      });

      // Canonical Tenancy Key: String(tenant_id) + "::" + String(property_id) (with fallback to email/name + title)
      const getTenancyKey = (tenantId, tenantEmail, tenantName, propertyId, propertyTitle) => {
        let cleanTId = (tenantId && String(tenantId).trim().toLowerCase()) || "";
        let cleanEmail = (tenantEmail && String(tenantEmail).trim().toLowerCase()) || "";
        let cleanPropId = (propertyId && String(propertyId).trim().toLowerCase()) || "";
        const cleanPropTitle = (propertyTitle && String(propertyTitle).trim().toLowerCase()) || "";

        if (!cleanTId && cleanEmail && emailToTenantIdMap.has(cleanEmail)) {
          cleanTId = emailToTenantIdMap.get(cleanEmail);
        }
        if (!cleanEmail && cleanTId && tenantIdToEmailMap.has(cleanTId)) {
          cleanEmail = tenantIdToEmailMap.get(cleanTId);
        }
        if (!cleanPropId && cleanPropTitle && propertyByTitle.has(cleanPropTitle)) {
          cleanPropId = String(propertyByTitle.get(cleanPropTitle).id || "").toLowerCase().trim();
        }

        if (cleanTId && cleanPropId) {
          return `${cleanTId}::${cleanPropId}`;
        }
        if (cleanEmail && cleanPropId) {
          return `${cleanEmail}::${cleanPropId}`;
        }
        if (cleanTId && cleanPropTitle) {
          return `${cleanTId}::${cleanPropTitle}`;
        }
        if (cleanEmail && cleanPropTitle) {
          return `${cleanEmail}::${cleanPropTitle}`;
        }
        const fallbackTenant = cleanTId || cleanEmail || (tenantName && String(tenantName).trim().toLowerCase()) || "tenant";
        const fallbackProp = cleanPropId || cleanPropTitle || "prop";
        return `${fallbackTenant}::${fallbackProp}`;
      };

      const getLeasePriority = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'active') return 100;
        if (s === 'signed') return 80;
        if (s === 'partially_signed' || s === 'pending_tenant') return 60;
        if (s === 'pending' || s === 'draft') return 40;
        return 20; // past, expired, terminated
      };

      const tenancyMap = new Map();

      // 1. Process Backend Tenants Endpoint (Primary source of truth - already grouped by tenant_id::property_id)
      fetchedTenants.forEach(t => {
        if (!t) return;
        const tId = t.tenantId || t.id;
        const key = t.tenancyKey || getTenancyKey(tId, t.email, t.name, t.propertyId, t.propertyTitle);
        tenancyMap.set(key, {
          ...t,
          tenancyKey: key,
          id: String(tId),
          tenantId: String(tId),
          propertyId: String(t.propertyId),
          leaseId: t.leaseId || null,
          leaseIds: new Set(t.leaseIds || (t.leaseId ? [t.leaseId] : [])),
          applicationIds: new Set(t.applicationIds || []),
          unpaidInvoicesCount: t.unpaidInvoicesCount || t.unpaidCount || 0,
          invoices: Array.isArray(t.invoices) ? [...t.invoices] : []
        });
      });

      // 2. Process Leases: Merge into existing tenancies or register new ones
      leases.forEach(l => {
        if (!l) return;
        const isSigned = !!l.tenant_signed_at || l.status === 'signed' || l.status === 'active';
        const isPaid = l.payment_status === 'paid' || l.is_paid || l.status === 'active';
        const isActive = (l.status === 'active' || isSigned) && isPaid;
        const isPending = !isActive && l.status !== 'past' && l.status !== 'expired' && l.status !== 'terminated';

        let tenancyStatus = 'past';
        if (isActive) tenancyStatus = 'active';
        else if (isPending) tenancyStatus = 'pending';

        let badgeLabel = 'Active Tenant';
        if (!isActive) {
          if (!isSigned && !isPaid) badgeLabel = 'Pending Sign & Pay';
          else if (!isSigned) badgeLabel = 'Pending Signature';
          else if (!isPaid) badgeLabel = 'Pending Payment';
          else badgeLabel = 'Pending';
        }

        let propId = l.property_id || l.propertyId;
        let propTitle = l.property_title || l.propertyTitle;
        if (propId && propertyById.has(String(propId).toLowerCase().trim())) {
          propTitle = propertyById.get(String(propId).toLowerCase().trim()).title || propTitle;
        }
        if (!propTitle) propTitle = "Leased Property";

        const tenantId = l.tenant_id || l.tenantId;
        const tenantEmail = l.tenant_email || "";
        const tenantName = l.tenant_name || "Unknown Tenant";
        const tenantPhone = l.tenant_contact || l.phone || "";
        const tenantAvatar = l.tenant_avatar || l.avatar || "";

        const key = getTenancyKey(tenantId, tenantEmail, tenantName, propId, propTitle);

        if (tenancyMap.has(key)) {
          const existing = tenancyMap.get(key);
          if (l.id) existing.leaseIds.add(l.id);
          if (l.application_id) existing.applicationIds.add(l.application_id);

          // If new lease has higher priority (e.g. active vs pending/past), promote it
          if (getLeasePriority(l.status) > getLeasePriority(existing.lease?.status || existing.rawLeaseStatus)) {
            existing.leaseId = l.id;
            existing.lease = l;
            existing.status = tenancyStatus;
            existing.leaseStatus = badgeLabel;
            existing.rentAmount = l.rent_amount;
            existing.rentPeriod = l.rent_period || existing.rentPeriod;
            existing.startDate = l.start_date || l.startDate;
            existing.endDate = l.end_date || l.endDate;
            if (l.start_date) existing.dueDate = l.start_date;
            existing.paymentStatus = isPaid ? "Paid" : "Unpaid";
          }
          if (!existing.phone && tenantPhone) existing.phone = tenantPhone;
          if (!existing.avatar && tenantAvatar) existing.avatar = tenantAvatar;
          if (!existing.email && tenantEmail) existing.email = tenantEmail;
        } else {
          tenancyMap.set(key, {
            tenancyKey: key,
            id: String(tenantId || `tenant-lease-${l.id}`),
            tenantId: String(tenantId || `tenant-lease-${l.id}`),
            leaseId: l.id,
            leaseIds: new Set(l.id ? [l.id] : []),
            applicationIds: new Set(l.application_id ? [l.application_id] : []),
            lease: l,
            name: tenantName,
            avatar: tenantAvatar,
            email: tenantEmail,
            phone: tenantPhone,
            propertyId: propId,
            propertyTitle: propTitle,
            status: tenancyStatus,
            leaseStatus: badgeLabel,
            rentAmount: l.rent_amount || 0,
            rentPeriod: l.rent_period || 'monthly',
            startDate: l.start_date || l.startDate,
            endDate: l.end_date || l.endDate,
            dueDate: l.start_date || "—",
            paymentStatus: isPaid ? "Paid" : "Unpaid",
            unpaidInvoicesCount: 0,
            invoices: []
          });
        }
      });

      // 3. Process Applications (ONLY include if a lease agreement has been generated/sent or fully leased)
      apps.forEach(a => {
        if (!a) return;
        const s = (a.status || '').toLowerCase();
        const isFullyLeased = s === 'leased' || s === 'active';
        const isLeaseSent = s === 'approved' || s === 'lease_generated' || s === 'pending_tenant' || s === 'signed';

        // Strictly skip raw applicants who have not been sent a lease agreement
        if (!isFullyLeased && !isLeaseSent) return;

        const tenantId = a.tenantId || a.tenant_id || a.tenant?.id || '';
        const tenantEmail = a.tenant?.email || a.email || "";
        const tenantName = `${a.tenant?.firstName || a.first_name || ''} ${a.tenant?.lastName || a.last_name || ''}`.trim() || a.tenantName || a.tenant?.name || "Tenant";
        const propId = a.propertyId || a.property_id;
        let propTitle = a.propertyTitle || a.property_title;
        if (propId && propertyById.has(String(propId).toLowerCase().trim())) {
          propTitle = propertyById.get(String(propId).toLowerCase().trim()).title || propTitle;
        }
        if (!propTitle) propTitle = "Leased Property";

        const key = getTenancyKey(tenantId, tenantEmail, tenantName, propId, propTitle);

        if (tenancyMap.has(key)) {
          const existing = tenancyMap.get(key);
          if (a.id) existing.applicationIds.add(a.id);
          if (!existing.phone && (a.tenant?.phone || a.tenantPhone || a.phone)) {
            existing.phone = a.tenant?.phone || a.tenantPhone || a.phone;
          }
          if (!existing.avatar && (a.tenant?.avatar || a.avatar)) {
            existing.avatar = a.tenant?.avatar || a.avatar;
          }
        } else {
          tenancyMap.set(key, {
            tenancyKey: key,
            id: String(tenantId || `tenant-app-${a.id}`),
            tenantId: String(tenantId || `tenant-app-${a.id}`),
            leaseId: null,
            leaseIds: new Set(),
            applicationIds: new Set(a.id ? [a.id] : []),
            lease: null,
            name: tenantName,
            avatar: a.tenant?.avatar || a.avatar || "",
            email: tenantEmail,
            phone: a.tenant?.phone || a.tenantPhone || a.phone || "",
            propertyId: propId,
            propertyTitle: propTitle,
            status: isFullyLeased ? 'active' : 'pending',
            leaseStatus: isFullyLeased ? 'Active Tenant' : 'Pending Sign & Pay',
            rentAmount: a.propertyRentAmount || a.property_rent_amount || 0,
            rentPeriod: a.propertyRentPeriod || a.rent_period || 'monthly',
            startDate: a.lease_start_date || a.startDate || null,
            endDate: a.lease_end_date || a.endDate || null,
            dueDate: "—",
            paymentStatus: isFullyLeased ? "Paid" : "Unpaid",
            unpaidInvoicesCount: 0,
            invoices: []
          });
        }
      });

      // 4. Process Embedded Tenants from Property Listings ONLY if property is not already covered by a tenancy
      const coveredPropertyIds = new Set(
        Array.from(tenancyMap.values()).map(t => String(t.propertyId || '').trim().toLowerCase())
      );
      allPropertiesForLookup.forEach(p => {
        if (!p || !p.id) return;
        const cleanPropId = String(p.id).trim().toLowerCase();
        if (coveredPropertyIds.has(cleanPropId)) {
          return; // Strictly skip: property is already covered by a real active tenancy!
        }

        const embeddedName = (p.tenant_name || p.tenantName || "").trim();
        const embeddedContact = (p.tenant_contact || p.tenantContact || p.tenant_email || p.tenantEmail || "").trim();

        if (embeddedName || embeddedContact) {
          const email = embeddedContact.includes("@") ? embeddedContact : "";
          const phone = !embeddedContact.includes("@") ? embeddedContact : "";
          const name = embeddedName || (email ? email.split("@")[0] : phone) || "Tenant";

          const key = getTenancyKey(null, email, name, p.id, p.title);
          if (!tenancyMap.has(key)) {
            tenancyMap.set(key, {
              tenancyKey: key,
              id: `tenant-prop-${p.id}`,
              tenantId: `tenant-prop-${p.id}`,
              name: name,
              email: email,
              phone: phone,
              propertyId: p.id,
              propertyTitle: p.title || p.name || "Leased Property",
              status: "active",
              leaseStatus: "Active Tenant",
              rentAmount: parseRentAmount(p.rent_amount ?? p.rent ?? p.price),
              rentPeriod: p.rent_period || "monthly",
              dueDate: "—",
              paymentStatus: "Unknown",
              unpaidInvoicesCount: 0,
              leaseIds: new Set(),
              applicationIds: new Set(),
              invoices: []
            });
          }
        }
      });

      // 5. Nest Invoices under Tenancies (Never create one card per invoice!)
      const tenancies = Array.from(tenancyMap.values());

      invoices.forEach(inv => {
        if (!inv) return;

        const invLeaseId = inv.leaseId || inv.lease_id;
        const invAppId = inv.applicationId || inv.application_id;
        const invTenantId = inv.tenantId || inv.tenant_id;
        const invTenantEmail = inv.tenantEmail || inv.tenant_email;
        const invPropId = inv.propertyId || inv.property_id;

        let targetTenancy = null;

        // A. Match by leaseId
        if (invLeaseId) {
          targetTenancy = tenancies.find(t => t.leaseId === invLeaseId || (t.leaseIds && t.leaseIds.has(invLeaseId)));
        }

        // B. Match by applicationId
        if (!targetTenancy && invAppId) {
          targetTenancy = tenancies.find(t => t.applicationIds && t.applicationIds.has(invAppId));
        }

        // C. Match by canonical tenancy key
        if (!targetTenancy && invTenantId && invPropId) {
          targetTenancy = tenancyMap.get(makeTenancyKey(invTenantId, invPropId));
        }

        if (!targetTenancy) {
          const invKey = getTenancyKey(invTenantId, invTenantEmail, null, invPropId, null);
          if (tenancyMap.has(invKey)) {
            targetTenancy = tenancyMap.get(invKey);
          }
        }

        // D. Fallback match by tenantId or email + propertyId
        if (!targetTenancy && invPropId && (invTenantId || invTenantEmail)) {
          targetTenancy = tenancies.find(t => 
            String(t.propertyId).toLowerCase() === String(invPropId).toLowerCase() &&
            ((invTenantId && (String(t.id).toLowerCase() === String(invTenantId).toLowerCase() || String(t.tenantId).toLowerCase() === String(invTenantId).toLowerCase())) ||
             (invTenantEmail && String(t.email).toLowerCase() === String(invTenantEmail).toLowerCase()))
          );
        }

        if (targetTenancy) {
          const invId = inv.id;
          const invNum = inv.invoiceNumber || inv.invoice_number;
          const alreadyExists = targetTenancy.invoices.some(existingInv => 
            (invId && existingInv.id === invId) || (invNum && (existingInv.invoiceNumber || existingInv.invoice_number) === invNum)
          );

          if (!alreadyExists) {
            targetTenancy.invoices.push(inv);

            const invStatus = (inv.status || inv.payment_status || '').toLowerCase();
            const isUnpaid = invStatus === 'unpaid' || invStatus === 'pending_verification' || invStatus === 'overdue' || invStatus === 'pending';

            if (isUnpaid) {
              targetTenancy.unpaidInvoicesCount = (targetTenancy.unpaidInvoicesCount || 0) + 1;
              targetTenancy.hasUnpaidInvoices = true;
              targetTenancy.paymentStatus = (invStatus === 'overdue') ? 'Overdue' : 'Unpaid';
              
              if (inv.dueDate || inv.due_date) {
                targetTenancy.dueDate = inv.dueDate || inv.due_date;
              }
            }
          }
        }
      });

      // 6. Fetch Ratings & Finalize
      const tenantsWithRatings = await Promise.all(
        tenancies.map(async (t) => {
          const tId = t.id || t.tenantId;
          const tEmail = t.email;
          if (!tId && !tEmail) return t;

          try {
            const revData = await ratingService.getTenantReviews(tId, tEmail);
            if (revData && revData.hasReviews) {
              const score = Number(revData.rating) || Number(revData.averageScore) || 0;
              return {
                ...t,
                reliabilityScore: score > 0 ? score.toFixed(1) : t.reliabilityScore,
                ratingCount: revData.count || 0
              };
            }
          } catch (_err) {
            // fallback gracefully
          }
          return t;
        })
      );

      setTenantsList(tenantsWithRatings);
    } catch (e) {
      console.warn("Could not load tenants list:", e);
      setError("Failed to load tenant directory. Please check your network connection.");
    } finally {
      setIsLoading(false);
      isFetchingDataRef.current = false;
    }
  };

  useEffect(() => {
    loadData();

    let lastFocus = 0;
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocus < 10000) return; // 10s throttle
      lastFocus = now;
      loadData(true);
    };
    const handlePropertyUpdated = () => loadData(true);
    const handleTenantRatingUpdated = () => loadData(true);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("propertyUpdated", handlePropertyUpdated);
    window.addEventListener("tenantRatingUpdated", handleTenantRatingUpdated);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("propertyUpdated", handlePropertyUpdated);
      window.removeEventListener("tenantRatingUpdated", handleTenantRatingUpdated);
    };
  }, []);

  // Reset display chunk limit on filter / search changes for smooth lazy rendering
  useEffect(() => {
    setDisplayLimit(8);
  }, [searchQuery, activeFilter]);

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

  // Strict pre-render deduplication ensuring exactly ONE card per active tenancy key: String(tenant_id) + "::" + String(property_id)
  const uniqueTenanciesMap = new Map();
  filteredTenants.forEach((tenant) => {
    const tId = tenant.tenantId || tenant.id || tenant.email || "unknown";
    const pId = tenant.propertyId || tenant.propertyTitle || "unknown";
    const key = tenant.tenancyKey || makeTenancyKey(tId, pId);

    if (uniqueTenanciesMap.has(key)) {
      const existing = uniqueTenanciesMap.get(key);
      // If one is active and the other is pending/past, prefer active
      if (tenant.status === "active" && existing.status !== "active") {
        uniqueTenanciesMap.set(key, { ...existing, ...tenant, tenancyKey: key });
      } else {
        // Merge invoices / unpaid count if needed
        if (tenant.unpaidInvoicesCount > 0 && !existing.unpaidInvoicesCount) {
          existing.unpaidInvoicesCount = tenant.unpaidInvoicesCount;
          existing.paymentStatus = tenant.paymentStatus;
          if (tenant.dueDate && tenant.dueDate !== "—") existing.dueDate = tenant.dueDate;
        }
      }
    } else {
      uniqueTenanciesMap.set(key, { ...tenant, tenancyKey: key });
    }
  });
  const dedupedFilteredTenants = Array.from(uniqueTenanciesMap.values());

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

    try {
      const nameParts = formData.name.trim().split(" ");
      await apiClient.post("/users/invite-tenant", {
        firstName: nameParts[0] || "",
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "",
        email: cleanEmail
      });
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
      ) : dedupedFilteredTenants.length === 0 ? (
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
            {dedupedFilteredTenants.slice(0, displayLimit).map((tenant) => (
              <div key={tenant.tenancyKey || makeTenancyKey(tenant.tenantId || tenant.id, tenant.propertyId)} className="tenant-card">

                {/* Card Header */}
                <div className="tenant-card-header">
                  <div className="tenant-card-profile min-w-0">
                    <div onClick={() => setSelectedTenantForDetails(tenant)} className="cursor-pointer shrink-0">
                      <Avatar 
                        src={tenant.avatar} 
                        name={tenant.name} 
                        className="tenant-card-avatar rounded-full" 
                      />
                    </div>
                    <div className="tenant-card-meta min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="tenant-card-name" title={tenant.name}>{tenant.name}</h4>
                        {settings?.loyaltyRewardsEnabled && tenant.paymentStatus === "Paid" && (
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" title="Perfect Payment History" />
                        )}
                      </div>
                      <span 
                        className={`tenant-card-lease-status ${tenant.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'} px-2 py-0.5 rounded-md text-[11px] font-bold inline-block mt-0.5`}
                        title={tenant.leaseStatus || (tenant.status === 'active' ? "Active Tenant" : "Pending Sign & Pay")}
                      >
                        {tenant.leaseStatus || (tenant.status === 'active' ? "Active Tenant" : "Pending Sign & Pay")}
                      </span>
                    </div>
                  </div>

                  <div className="tenant-card-score shrink-0" title="Tenant Reliability Score">
                    <Star className="h-3.5 w-3.5 fill-[#D69E2E] text-[#D69E2E] shrink-0" />
                    <span>{tenant.reliabilityScore && Number(tenant.reliabilityScore) > 0 ? Number(tenant.reliabilityScore).toFixed(1) : "No rating"}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="tenant-card-body">
                  <div className="tenant-detail-row">
                    <span className="tenant-detail-label">Property</span>
                    <span 
                      className="tenant-detail-value property-link" 
                      onClick={() => setSelectedTenantForDetails(tenant)}
                      title={tenant.propertyTitle}
                    >
                      {tenant.propertyTitle}
                    </span>
                  </div>

                  <div className="tenant-detail-row">
                    <span className="tenant-detail-label">Email</span>
                    <span className="tenant-detail-value" title={tenant.email || "—"}>
                      {tenant.email || "—"}
                    </span>
                  </div>

                  <div className="tenant-detail-row">
                    <span className="tenant-detail-label">Phone</span>
                    <span className="tenant-detail-value" title={tenant.phone || "—"}>
                      {tenant.phone || "—"}
                    </span>
                  </div>

                  <div className="tenant-detail-row">
                    <span className="tenant-detail-label">Due Date</span>
                    <span className="tenant-detail-value" title={formatTenantDueDate(tenant.dueDate)}>
                      {formatTenantDueDate(tenant.dueDate)}
                    </span>
                  </div>

                  <div className="tenant-detail-row">
                    <span className="tenant-detail-label">Rent Status</span>
                    <div className="tenant-status-badges-wrapper">
                      {tenant.unpaidInvoicesCount > 0 && (
                        <span 
                          className="payment-badge unpaid-count" 
                          title={`${tenant.unpaidInvoicesCount} unpaid invoice${tenant.unpaidInvoicesCount > 1 ? 's' : ''}`}
                        >
                          {tenant.unpaidInvoicesCount} Unpaid
                        </span>
                      )}
                      <span className={`payment-badge ${(tenant.paymentStatus || "Unknown").toLowerCase().replace(/\s+/g, "-")}`}>
                        {tenant.paymentStatus || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="tenant-card-actions">
                  <button
                    type="button"
                    className="tenant-action-btn chat-btn"
                    onClick={() => handleMessageTenant(tenant.name, tenant.avatar, tenant)}
                    title="Open Chat"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span>Chat</span>
                  </button>

                  <button
                    type="button"
                    className="tenant-action-btn details-btn"
                    onClick={() => setSelectedTenantForDetails(tenant)}
                    title="View Details"
                  >
                    <Info className="h-4 w-4 shrink-0" />
                    <span>View Details</span>
                  </button>

                  <button
                    type="button"
                    className={`tenant-action-btn invoice-btn ${
                      tenant.leaseId || tenant.status === 'active'
                        ? ''
                        : 'disabled'
                    }`}
                    onClick={() => {
                      if (!tenant.leaseId && tenant.status !== 'active') {
                        triggerToast('No active lease found for this tenant. An active lease is required to issue a renewal invoice.', 'warning', 'No Active Lease');
                        return;
                      }
                      setInvoiceTenant(tenant);
                      setShowInvoiceModal(true);
                    }}
                    title={tenant.leaseId || tenant.status === 'active' ? "Issue Rent or Renewal Invoice" : "Active lease required to issue invoice"}
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span>Invoice</span>
                  </button>

                  <button
                    type="button"
                    className="tenant-action-btn rate-btn"
                    onClick={() => {
                      setSelectedTenantToRate(tenant);
                      setShowRateTenantModal(true);
                    }}
                    title="Rate Tenant"
                  >
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                    <span>Rate</span>
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Load More Button for Pagination / Prevent DOM Flooding */}
          {dedupedFilteredTenants.length > displayLimit && (
            <div className="flex flex-col items-center justify-center pt-8 pb-4">
              <button
                onClick={() => setDisplayLimit((prev) => prev + 8)}
                className="px-6 py-2.5 rounded-xl bg-moss-700 hover:bg-moss-800 dark:bg-[#E5C583] dark:hover:bg-[#d8b46e] text-white dark:text-[#07130D] font-bold text-xs tracking-wide shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                Load More Tenants ({dedupedFilteredTenants.length - displayLimit} remaining)
              </button>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Showing {Math.min(displayLimit, dedupedFilteredTenants.length)} of {dedupedFilteredTenants.length} tenants
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
          tenantId={selectedTenantToRate.tenantId || selectedTenantToRate.id || selectedTenantToRate.email}
          tenantEmail={selectedTenantToRate.email || selectedTenantToRate.tenantEmail || ""}
          tenantName={selectedTenantToRate.name || selectedTenantToRate.tenantName || "Tenant"}
          landlordId={sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId") || "landlord"}
          landlordName="Landlord"
          propertyTitle={selectedTenantToRate.propertyTitle || ""}
          propertyId={selectedTenantToRate.propertyId || null}
          leaseId={selectedTenantToRate.leaseId || null}
          onSuccess={() => loadData(true)}
        />
      )}

      {/* INVOICE BUILDER MODAL */}
      {showInvoiceModal && invoiceTenant && (
        <InvoiceBuilderModal
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setInvoiceTenant(null);
          }}
          mode="lease"
          lease={invoiceTenant.lease || {
            id: invoiceTenant.leaseId,
            rent_amount: invoiceTenant.rentAmount,
            rent_period: invoiceTenant.rentPeriod,
            start_date: invoiceTenant.startDate,
            end_date: invoiceTenant.endDate,
            property_id: invoiceTenant.propertyId,
            tenant_id: invoiceTenant.tenantId || invoiceTenant.id,
            property_title: invoiceTenant.propertyTitle,
            tenant_name: invoiceTenant.name
          }}
          tenant={invoiceTenant}
          property={properties.find(p => String(p.id) === String(invoiceTenant.propertyId)) || {
            id: invoiceTenant.propertyId,
            title: invoiceTenant.propertyTitle,
            rent_amount: invoiceTenant.rentAmount
          }}
          onSuccess={() => {
            loadData(true);
          }}
        />
      )}
    </div>
  );
}
