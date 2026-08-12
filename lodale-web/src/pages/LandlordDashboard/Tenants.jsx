import { useState, useEffect } from "react";
import { Search, Plus, MessageSquare, Phone, Mail, Star, X, Info, UserCheck, ShieldAlert, CheckCircle, Trash2 } from "lucide-react";
import { triggerToast } from "../../context/ToastContext";
import { formatCurrency } from "../../utils/formatters";
import { propertyService } from "../../services/propertyService";
import "./Tenants.css";

export default function Tenants({ setSelectedTenantForDetails, setActiveTab }) {
  const [tenantsList, setTenantsList] = useState([]);
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
  const loadData = async () => {
    // Load properties
    let propertyList = [];
    try {
      const currentUserId = sessionStorage.getItem("db_user_id") || localStorage.getItem("db_user_id") || "11111111-1111-1111-1111-111111111111";
      propertyList = await propertyService.getLandlordProperties(currentUserId);
    } catch (e) {
      console.warn("Could not load properties:", e);
    }
    setProperties(propertyList);

    // Load tenants
    const savedTenants = localStorage.getItem("propertyTenants");
    let parsedTenants = {};
    if (savedTenants) {
      try {
        parsedTenants = JSON.parse(savedTenants);
      } catch (e) {
        parsedTenants = {};
      }
    }

    // Flatten tenants map to single array with property context
    const allTenants = [];
    Object.keys(parsedTenants).forEach((propId) => {
      const prop = propertyList.find((p) => p.id === propId);
      const list = parsedTenants[propId] || [];
      list.forEach((t) => {
        allTenants.push({
          ...t,
          propertyId: propId,
          propertyTitle: prop ? prop.title : "Unknown Property",
        });
      });
    });

    setTenantsList(allTenants);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

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
    if (activeFilter === "Past") return tenant.status === "past" || tenant.status === "inactive";

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

    const newTenantObj = {
      id: Date.now(),
      name: formData.name,
      tenantName: formData.name,
      avatar: "",
      email: formData.email,
      phone: formData.phone || "",
      reliabilityScore: (4.5 + Math.random() * 0.5).toFixed(1), // Auto-generate score 4.5-5.0
      occupation: formData.occupation || "Independent Professional",
      income: formData.income ? formatCurrency(formData.income, "/mo") : "₦450,000/mo",
      notes: formData.notes || "NIN verified. Clean background check.",
      leaseStatus: `Active Tenant (${formData.unit ? "Unit " + formData.unit : "Main Unit"})`,
      paymentStatus: formData.paymentStatus,
      dueDate: formData.dueDate,
      status: formData.status,
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
        status: 'Active'
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
        lastMessage: "Tenant added to the portal.",
        time: "Just now",
        type: "tenant",
        messages: [
          {
            id: 1,
            sender: "landlord",
            text: `Welcome to Lodale! I have registered your profile as an active tenant for ${propTitle}. You can manage payments and submit requests here.`,
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
      status: "active"
    });

    setShowAddModal(false);
    loadData();

    // Notify other components/tabs
    window.dispatchEvent(new Event("storage"));
    triggerToast(`Successfully registered ${formData.name} as active tenant!`, "success", "Tenant Registered");
  };

  // Direct contact helper -> goes to chat tab
  const handleMessageTenant = (tenantName, tenantAvatar, tenantObj) => {
    // 1. Check if chat thread exists, if not create it
    const savedChats = localStorage.getItem("landlordChats");
    const chatsList = savedChats ? JSON.parse(savedChats) : [];

    let chat = chatsList.find((c) => c.name === tenantName);
    if (!chat) {
      chat = {
        id: tenantName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
        name: tenantName,
        avatar: tenantAvatar || "",
        email: tenantObj.email,
        phone: tenantObj.phone,
        reliabilityScore: tenantObj.reliabilityScore,
        occupation: tenantObj.occupation,
        income: tenantObj.income,
        notes: tenantObj.notes,
        leaseStatus: tenantObj.leaseStatus,
        lastMessage: "Direct message initiated.",
        time: "Just now",
        type: "tenant",
        messages: [
          {
            id: 1,
            sender: "landlord",
            text: "Hello! Direct message initiated from the Tenants Directory.",
            time: "Just now"
          }
        ]
      };
      chatsList.push(chat);
      localStorage.setItem("landlordChats", JSON.stringify(chatsList));
    }

    // 2. Select this chat thread as active
    // We write to localStorage, and LandlordChat can load it on render
    localStorage.setItem("activeChatTenantName", tenantName);
    window.dispatchEvent(new Event("storage"));

    // 3. Change tab to Chat (Tab index 3)
    setActiveTab(3);
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
            const prevScore = parseFloat(t.reliabilityScore) || 4.7;
            updatedScore = ((prevScore + rating) / 2).toFixed(1);
          }

          // Add review if rating > 0 or comment is filled
          if (rating > 0 || comment.trim()) {
            const newReview = {
              landlord: "You (Current Landlord)",
              rating: rating > 0 ? rating : parseFloat(t.reliabilityScore) || 4.7,
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
      {filteredTenants.length === 0 ? (
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
        <div className="tenants-grid tour-tenants-list">
          {filteredTenants.map((tenant) => (
            <div key={tenant.id} className="tenant-card">

              {/* Card Header */}
              <div className="tenant-card-header">
                <div className="tenant-card-profile">
                  <img
                    src={tenant.avatar}
                    alt={tenant.name}
                    className="tenant-card-avatar cursor-pointer"
                    onClick={() => setSelectedTenantForDetails(tenant)}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="tenant-card-meta">
                    <h4 className="tenant-card-name">{tenant.name}</h4>
                    <span className="tenant-card-lease-status">{tenant.leaseStatus || "Tenant"}</span>
                  </div>
                </div>

                <div className="tenant-card-score" title="Tenant Reliability Score">
                  <Star className="h-3.5 w-3.5 fill-[#D69E2E] text-[#D69E2E]" />
                  <span>{tenant.reliabilityScore || "4.7"}</span>
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
                      onChange={handleInputChange}
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
                      type="number"
                      name="income"
                      min="0"
                      value={formData.income}
                      onChange={handleInputChange}
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
