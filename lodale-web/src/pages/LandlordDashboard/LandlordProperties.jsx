import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, ChevronRight, X, Users } from "lucide-react";
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

  useEffect(() => {
    const saved = localStorage.getItem("properties");
    const allList = saved ? JSON.parse(saved) : LISTINGS;
    if (!saved) {
      localStorage.setItem("properties", JSON.stringify(LISTINGS));
    }
    const filtered = allList.filter((l) =>
      l.landlord?.name?.toLowerCase().includes(username.toLowerCase().split(" ")[0])
    );
    setProperties(filtered);
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
            filteredProperties.map((item, idx) => {
              const style = pastelStyles[idx % pastelStyles.length];
              return (
                <div key={item.id} className={`ap-property-card ${style.bg}`}>
                  {/* Top Visual Illustration box */}
                  <div className="ap-card-visual">
                    <svg viewBox="0 0 100 100" className="ap-vector-house">
                      <polygon points="50,20 85,50 85,85 15,85 15,50" fill="none" stroke="currentColor" strokeWidth="2.5" />
                      <rect x="30" y="60" width="15" height="25" fill="none" stroke="currentColor" strokeWidth="2" />
                      <rect x="55" y="55" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="15" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>

                  {/* Center Content */}
                  <div className="ap-card-details">
                    <h3 className="ap-property-title">{item.title}</h3>
                    <p className="ap-property-desc">
                      {item.beds} Bedrooms • {item.baths} Bathrooms • {item.amenities.join(", ")}
                    </p>
                    <div className="ap-card-footer-info">
                      <span className="ap-price-badge">{item.price}</span>
                      <span className="ap-owner-lbl">Managed by {item.landlord.name}</span>
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
                    e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&h=64&q=80";
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
                          e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&h=64&q=80";
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
                          <span className="ap-popup-score">⭐ {tenant.reliabilityScore}</span>
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
