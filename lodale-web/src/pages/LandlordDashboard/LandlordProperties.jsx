import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, ChevronRight, X, Users, Star, Clock, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { propertyService } from "../../services/propertyService";
import { LISTINGS } from "../../data/listings";
import UserInfo from "./components/UserInfo";
import "./LandlordProperties.css";



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

            <div className="ap-select-wrapper">
              <select
                value={rentFilter}
                onChange={(e) => setRentFilter(e.target.value)}
                className="ap-filter-select"
              >
                <option value="all">Rent (All)</option>
                <option value="under-200">&lt; ₦200,000</option>
                <option value="200-350">₦200,000 - ₦350,000</option>
                <option value="over-350">&gt; ₦350,000</option>
              </select>
            </div>

            <div className="ap-select-wrapper">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="ap-filter-select"
              >
                <option value="all">Location (All)</option>
                <option value="island">Victoria Island</option>
                <option value="yaba">Yaba</option>
                <option value="lekki">Lekki</option>
              </select>
            </div>

            <div className="ap-select-wrapper">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="ap-filter-select"
              >
                <option value="all">Type (All)</option>
                <option value="apartment">Apartments</option>
                <option value="house">Houses & Estates</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="ap-search-wrapper">
            <Search className="ap-search-icon" />
            <input
              type="text"
              placeholder="Search properties…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ap-search-input"
            />
          </div>
        </div>

        {/* Properties list */}
        <div className="ap-list-stack tour-property-results">
          {filteredProperties.length > 0 ? (
            filteredProperties.map((item) => {
              const status = item.status || 'pending_review';
              const imgUrl = item.image || item.cover_image || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80";

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

                  {/* Side-by-side action buttons */}
                  <div className="ap-card-actions">
                    <button
                      onClick={() => navigate(`/dashboard/landlord/properties/${item.id}`)}
                      className="ap-action-btn btn-primary"
                      title="View details"
                    >
                      <ChevronRight className="h-4 w-4 mr-0.5" /> Details
                    </button>
                    <button
                      onClick={() => setShowTenantsPopupForProperty(item)}
                      className="ap-action-btn btn-secondary"
                      title="View current tenants"
                    >
                      <Users className="h-4 w-4 mr-1" /> Tenants
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

      {/* RIGHT COLUMN: Active Tenants list (matches Online Users) */}
      <div className="ap-sidebar-col">
        <div className="ap-sidebar-header">
          <h3 className="ap-sidebar-title">Active Tenants</h3>
          <button onClick={() => alert("Loading all clients...")} className="ap-see-all-btn">See all</button>
        </div>

        <div className="ap-tenants-list">
          {activeTenants.length > 0 ? (
            activeTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="ap-tenant-row cursor-pointer hover:bg-cream-100/40 p-1.5 rounded-xl transition-colors"
                onClick={() => setSelectedTenantForDetails(tenant)}
              >
                <img
                  src={tenant.avatar}
                  alt={tenant.name}
                  className="ap-tenant-avatar"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="ap-tenant-info">
                  <p className="ap-tenant-name hover:underline">{tenant.name}</p>
                  <p className="ap-tenant-code">{tenant.email}</p>
                </div>
                <span className={`ap-status-dot ${tenant.status}`} />
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-[12px] text-ink-300 font-semibold leading-relaxed">
              No active tenants yet.<br />Approve applications to add them!
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
