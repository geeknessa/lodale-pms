import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, ChevronRight, X, Users, Star, Clock, CheckCircle2, AlertTriangle, Info, ChevronDown, User } from "lucide-react";
import { propertyService } from "../../services/propertyService";
import { LISTINGS } from "../../data/listings";
import UserInfo from "./components/UserInfo";
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
                className={`w-full text-left px-4 py-2 text-[12.5px] cursor-pointer transition-colors duration-150 flex items-center justify-between select-none ${
                  isSelected
                    ? "bg-[#2C4633] text-white dark:bg-[#E5C583] dark:text-[#0B1512] font-bold"
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

export default function LandlordProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rentFilter, setRentFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showTenantsPopupForProperty, setShowTenantsPopupForProperty] = useState(null);
  const [selectedTenantForDetails, setSelectedTenantForDetails] = useState(null);

  const [username] = useState(() => {
    return localStorage.getItem("username") || "Ada";
  });

  const [tenantsMap, setTenantsMap] = useState({
    "skyline-block4": [],
    "oakwood-unit12b": [],
    "lekki-gardens-14": []
  });

  useEffect(() => {
    const loadTenants = () => {
      const saved = localStorage.getItem("propertyTenants");
      if (saved) {
        setTenantsMap(JSON.parse(saved));
      }
    };
    loadTenants();
    window.addEventListener("storage", loadTenants);
    return () => window.removeEventListener("storage", loadTenants);
  }, []);

  const getTenantsForProperty = (propertyId) => {
    return tenantsMap[propertyId] || [];
  };

  const [selectedFeedbackProperty, setSelectedFeedbackProperty] = useState(null);

  useEffect(() => {
    async function loadProperties() {
      const apiProps = await propertyService.getLandlordProperties("11111111-1111-1111-1111-111111111111");
      const saved = localStorage.getItem("properties");
      const localProps = saved ? JSON.parse(saved) : [];

      const apiIds = new Set(apiProps.map(p => p.id));
      const combined = [
        ...apiProps,
        ...localProps.filter(l => !apiIds.has(l.id))
      ];

      setProperties(combined);
    }

    loadProperties();
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

        {/* Properties list */}
        <div className="ap-list-stack tour-property-results">
          {filteredProperties.length > 0 ? (
            filteredProperties.map((item) => {
              const status = item.status || 'pending_review';
              const imgUrl = item.image || item.cover_image || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80";
              const propertyTenants = getTenantsForProperty(item.id);
              const tenantsCount = propertyTenants.length;

              return (
                <div key={item.id} className="ap-property-card bg-white dark:bg-[#16241F] border border-ink-200 dark:border-white/10 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-center gap-4">
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
                        className="db-avatar-group cursor-pointer flex items-center -space-x-1.5"
                        onClick={() => setShowTenantsPopupForProperty(item)}
                        title="View current tenants"
                      >
                        {propertyTenants.slice(0, 2).map((t, idx) => (
                          <img
                            key={t.id || idx}
                            src={t.avatar}
                            alt={t.name}
                            className="w-7 h-7 rounded-full object-cover border border-white dark:border-[#16241F]"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ))}
                        {tenantsCount === 0 && (
                          <div className="w-7 h-7 rounded-full bg-moss-700 text-white flex items-center justify-center text-xs font-bold border border-white dark:border-[#16241F]">
                            <User className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div
                          className="db-avatar-plus font-bold text-[10px]"
                          style={{ height: '28px', width: '28px', minWidth: '28px', border: '1px solid var(--border-light)' }}
                        >
                          {tenantsCount}
                        </div>
                      </div>
                    </div>

                    <h3 className="ap-property-title text-base font-bold text-ink-900 dark:text-white truncate">{item.title}</h3>
                    <p className="ap-property-desc text-xs text-ink-600 dark:text-cream-100/70 mt-1">
                      {item.beds || 1} Bedrooms • {item.baths || 1} Bathrooms • {Array.isArray(item.amenities) ? item.amenities.join(", ") : "Prepaid Meter, 24/7 Security"}
                    </p>
                    <div className="ap-card-footer-info flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-ink-100 dark:border-white/10">
                      <span className="ap-price-badge font-bold text-moss-700 dark:text-[#E5C583] text-sm">{item.price}</span>
                      
                      {/* Property Review Status Tag */}
                      {(() => {
                        const hasTenants = getTenantsForProperty(item.id).length > 0 || status === 'occupied' || status === 'active_occupied';
                        const isLive = status === 'active_vacant' || status === 'Live' || status === 'approved' || status === 'active';
                        const isPending = status === 'pending_review' || status === 'Pending Approval' || !item.status;
                        const isRejected = status === 'rejected' || status === 'inactive' || status === 'Rejected';
                        const isInfoReq = status === 'info_requested' || status === 'Info Requested';

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
                        if (isPending) {
                          return (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-300">
                              <Clock className="h-3 w-3" /> Pending Review
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
                        if (isInfoReq) {
                          return (
                            <button
                              onClick={() => setSelectedFeedbackProperty(item)}
                              className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase bg-blue-100 hover:bg-blue-200 text-blue-900 dark:text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-300 cursor-pointer"
                            >
                              <Info className="h-3 w-3" /> Info Needed
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Action button spanning full width */}
                  <div className="ap-card-actions">
                    <button
                      onClick={() => navigate(`/dashboard/landlord/properties/${item.id}`)}
                      className="ap-action-btn btn-primary w-full"
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

            <div className="ap-popup-body">
              {getTenantsForProperty(showTenantsPopupForProperty.id).length === 0 ? (
                <div className="ap-popup-empty">
                  <p>No active tenants in this property.</p>
                </div>
              ) : (
                <div className="ap-popup-list">
                  {getTenantsForProperty(showTenantsPopupForProperty.id).map((tenant) => (
                    <div key={tenant.id} className="ap-popup-item">
                      <img
                        src={tenant.avatar}
                        alt={tenant.name}
                        className="ap-popup-avatar cursor-pointer"
                        onClick={() => setSelectedTenantForDetails(tenant)}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="ap-popup-info">
                        <div className="ap-popup-name-row">
                          <span
                            className="ap-popup-name cursor-pointer hover:underline"
                            onClick={() => setSelectedTenantForDetails(tenant)}
                          >
                            {tenant.name}
                          </span>
                          <span className="ap-popup-score flex items-center gap-1 font-bold text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0 inline" />
                            <span>{tenant.reliabilityScore}</span>
                          </span>
                        </div>
                        <p className="ap-popup-lease">{tenant.leaseStatus}</p>
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
    </div>
  );
}
