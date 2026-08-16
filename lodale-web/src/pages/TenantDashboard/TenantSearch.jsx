import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, User, MapPin, Home, Check, Star, CheckCircle2 } from "lucide-react";
import Button from "../../components/Button";
import { propertyService } from "../../services/propertyService";
import { triggerToast } from "../../context/ToastContext";
import { formatCurrency } from "../../utils/formatters";
import "./TenantSearch.css";

// formatCurrency imported from formatters.js

// Helper Property Card Component
function PropertyCard({ property, onInspect }) {
  return (
    <div className="search-property-card">
      <div className="property-card-image-wrapper">
        <img src={property.image} alt={property.title} className="property-card-image" />
        <span className="property-card-price-tag">
          {formatCurrency(property.price, "/mo")}
        </span>
      </div>

      <div className="property-card-body text-left">
        <h4 className="property-card-title-text">{property.title}</h4>
        <p className="property-card-location flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-moss-600 dark:text-[#E5C583]" />
          <span>{property.location}</span>
        </p>

        <div className="property-card-specs">
          <span className="spec-tag">{property.beds} Bed{property.beds > 1 ? "s" : ""}</span>
          <span className="spec-tag">{property.baths} Bath{property.baths > 1 ? "s" : ""}</span>
          <span className="spec-tag capitalize">{property.type}</span>
        </div>

        <button
          className="property-card-cta-btn"
          onClick={() => onInspect(property)}
        >
          Inspect Details
        </button>
      </div>
    </div>
  );
}

// Helper Landlord Card Component
function LandlordCard({ landlord, onInspect }) {
  return (
    <div className="search-landlord-card">
      <div className="landlord-card-header text-center">
        <div className="landlord-avatar-wrapper">
          <img src={landlord.avatar} alt={landlord.name} className="landlord-avatar-img" />
          <span className="landlord-verification-tick"><Check className="h-3 w-3" /></span>
        </div>
        <h4 className="landlord-name-text">{landlord.name}</h4>
        <span className="landlord-badge">Verified Partner</span>
      </div>

      <div className="landlord-card-body text-left">
        <div className="landlord-metric flex justify-between items-center text-[12.5px] mb-2">
          <span className="text-[#6C6E73] dark:text-[#A3BCA7]">Rating Score</span>
          <span className="font-bold text-amber-500 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{landlord.score} ({landlord.reviews} reviews)</span>
          </span>
        </div>
        <div className="landlord-metric flex justify-between items-center text-[12.5px] mb-3">
          <span className="text-[#6C6E73] dark:text-[#A3BCA7]">Base Location</span>
          <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583] shrink-0" />
            <span>{landlord.location.split(",")[0]}</span>
          </span>
        </div>

        <div className="landlord-properties-list mb-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#6C6E73] dark:text-[#A3BCA7]">Managed Units</span>
          <div className="flex flex-col gap-1 mt-1">
            {landlord.properties.map((p, idx) => (
              <span key={idx} className="text-[11.5px] truncate text-neutral-700 dark:text-neutral-300">• {p}</span>
            ))}
          </div>
        </div>

        <button
          className="property-card-cta-btn w-full mt-auto"
          onClick={() => onInspect(landlord)}
        >
          Inspect Landlord
        </button>
      </div>
    </div>
  );
}

export default function TenantSearch({ setShowProfileModal, onStartChat, tenantAvatar }) {
  const navigate = useNavigate();
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("property"); // "property" | "landlord"
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Filter Fields
  const [filterPrice, setFilterPrice] = useState(""); // Max price limit
  const [filterBeds, setFilterBeds] = useState(""); // Number of bedrooms
  const [filterType, setFilterType] = useState(""); // "apartment" | "duplex" | "selfcontained" | ""
  const [filterLandlordTenure, setFilterLandlordTenure] = useState(""); // "" | "new" | "old"

  // View mode & search suggestion states
  const [viewAllListings, setViewAllListings] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // Dynamic approved listings loaded from backend API & localStorage
  const [allListings, setAllListings] = useState([]);

  useEffect(() => {
    async function loadTenantProperties() {
      try {
        let apiProps = [];
        try {
          const apiRes = await propertyService.getProperties();
          if (Array.isArray(apiRes)) {
            apiProps = apiRes;
          } else if (apiRes && Array.isArray(apiRes.properties)) {
            apiProps = apiRes.properties;
          }
        } catch (e) { }

        const formatted = apiProps.map((item) => {
          if (!item) return null;
          const key = String(item.id || item.title);
          // Normalise landlord object from either API shape
          let landlordObj;
          if (item.landlord && typeof item.landlord === "object" && (item.landlord.first_name || item.landlord.name)) {
            const l = item.landlord;
            landlordObj = {
              id: l.id || null,
              name: l.name || `${l.first_name || ""} ${l.last_name || ""}`.trim() || "Verified Landlord",
              score: l.score ?? 5.0,
              reviews: l.reviews ?? 1,
              phone_number: l.phone_number || null
            };
          } else {
            landlordObj = { id: null, name: typeof item.landlord === "string" ? item.landlord : "Verified Landlord", score: 5.0, reviews: 1, phone_number: null };
          }
          return {
            id: item.id || key,
            title: item.title || item.address_line1 || "Property",
            location: item.location || item.city || "Lagos, Nigeria",
            price: typeof item.price === "number" ? item.price : Number(String(item.price || item.rent_amount || "0").replace(/[^0-9]/g, "")) || 0,
            beds: item.beds || item.bedrooms || 1,
            baths: item.baths || item.bathrooms || 1,
            type: item.type || item.property_type || "apartment",
            image: item.image || item.cover_image || item.cover_photo || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&h=250&q=80",
            amenities: item.amenities || [],
            landlord: landlordObj,
            status: item.status,
            isPending: item.isPending,
            recommendationCategory: item.recommendationCategory || "Popular properties"
          };
        }).filter(Boolean);

        // STRICT FILTER: Only approved/live properties go to tenant search
        const approvedOnly = formatted.filter((p) => {
          if (!p) return false;
          const status = (p.status || "").toLowerCase();
          if (status === "pending_review" || status === "pending approval" || status === "pending" || status === "rejected" || status === "info_requested" || status === "info requested") {
            return false;
          }
          return status === "active_vacant" || status === "approved" || status === "live" || status === "active" || (!p.status && !p.isPending);
        });

        setAllListings(approvedOnly);
      } catch (err) {
        console.warn("Failed to load tenant search listings:", err);
      }
    }

    loadTenantProperties();
  }, []);

  // Derive unique landlords dynamically from loaded listings
  const dynamicLandlords = useMemo(() => {
    const seen = new Map(); // landlordName -> landlord entry
    allListings.forEach((p) => {
      const l = p.landlord;
      if (!l || !l.name) return;
      const key = l.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, {
          id: l.id || key,
          name: l.name,
          score: l.score ?? 5.0,
          reviews: l.reviews ?? 1,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(l.name)}&background=2C4633&color=E5C583&size=96`,
          location: p.location || "Lagos, Nigeria",
          properties: [p.title],
          category: "Top Rated Landlords",
          joinedStatus: "new"
        });
      } else {
        // Accumulate managed properties
        const existing = seen.get(key);
        if (!existing.properties.includes(p.title)) {
          existing.properties.push(p.title);
        }
      }
    });
    return Array.from(seen.values());
  }, [allListings]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Property Details modal states
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyDetailsModal, setShowPropertyDetailsModal] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);

  // Dynamic Last Visited State loaded from localStorage
  const [lastVisitedListings, setLastVisitedListings] = useState(() => {
    try {
      const saved = localStorage.getItem("lastVisitedListings");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleInspectProperty = (property) => {
    setSelectedProperty(property);
    setShowPropertyDetailsModal(true);

    // Dynamic Last Visited update on tap
    setLastVisitedListings(prev => {
      const filtered = prev.filter(p => p && p.id !== property.id);
      const updated = [property, ...filtered].slice(0, 10);
      try {
        localStorage.setItem("lastVisitedListings", JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
  };

  // Landlord Details modal states
  const [selectedLandlord, setSelectedLandlord] = useState(null);
  const [showLandlordDetailsModal, setShowLandlordDetailsModal] = useState(false);

  const handleInspectLandlord = (landlord) => {
    setSelectedLandlord(landlord);
    setShowLandlordDetailsModal(true);
  };

  // Landlord Filtering & Search matching logic (against dynamic landlords derived from listings)
  const filteredLandlords = dynamicLandlords.filter(landlord => {
    // 1. Text Search matching
    if (searchQuery.trim() !== "") {
      if (!landlord.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
    }

    // 2. Filter match on any of the landlord's properties
    if (filterPrice !== "" || filterBeds !== "" || filterType !== "") {
      const landlordProperties = allListings.filter(p => p.landlord?.name === landlord.name);
      const hasMatchingProperty = landlordProperties.some(listing => {
        if (filterPrice !== "") {
          const maxPrice = parseFloat(filterPrice);
          if (listing.price > maxPrice) return false;
        }
        if (filterBeds !== "") {
          const beds = parseInt(filterBeds);
          if (listing.beds !== beds) return false;
        }
        if (filterType !== "") {
          if (listing.type !== filterType) return false;
        }
        return true;
      });
      if (!hasMatchingProperty) return false;
    }

    // 3. Landlord Tenure Filter
    if (filterLandlordTenure !== "") {
      if (landlord.joinedStatus !== filterLandlordTenure) return false;
    }

    return true;
  });

  // All dynamic landlords shown in default swimlanes
  const topRatedLandlords = dynamicLandlords;
  const nearYouLandlords = [];

  // Helper to check if any filters are active
  const hasActiveFilters = searchQuery.trim() !== "" || filterPrice !== "" || filterBeds !== "" || filterType !== "" || filterLandlordTenure !== "";

  // Perform search filtering
  const filteredListings = allListings.filter(listing => {
    // 1. Text Search matching
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      if (searchType === "property") {
        const matchesTitle = listing.title.toLowerCase().includes(query);
        const matchesLocation = listing.location.toLowerCase().includes(query);
        const matchesLandlord = listing.landlord.name.toLowerCase().includes(query);
        if (!matchesTitle && !matchesLocation && !matchesLandlord) return false;
      } else {
        const matchesLandlord = listing.landlord.name.toLowerCase().includes(query);
        if (!matchesLandlord) return false;
      }
    }

    // 2. Rent Price Filter
    if (filterPrice !== "") {
      const maxPrice = parseFloat(filterPrice);
      if (listing.price > maxPrice) return false;
    }

    // 3. Beds Filter
    if (filterBeds !== "") {
      const beds = parseInt(filterBeds);
      if (listing.beds !== beds) return false;
    }

    // 4. Property Type Filter
    if (filterType !== "") {
      if (listing.type !== filterType) return false;
    }

    // 5. Landlord Tenure Filter
    if (filterLandlordTenure !== "") {
      const landlordObj = LANDLORDS.find(l => l.name === listing.landlord.name);
      if (!landlordObj || landlordObj.joinedStatus !== filterLandlordTenure) return false;
    }

    return true;
  });

  const userLocationStr = (() => {
    try {
      const raw = sessionStorage.getItem("currentUserProfile") || localStorage.getItem("currentUserProfile");
      if (raw) {
        const prof = JSON.parse(raw);
        return prof.location || "";
      }
    } catch { }
    return "";
  })();

  const allAvailableProperties = (() => {
    const seen = new Set();
    return allListings.filter(p => {
      if (!p) return false;
      const key = (p.id || p.title || "").toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  const searchSuggestions = (() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    const suggestions = [];
    const addedKeys = new Set();

    // 1. Match Property Titles
    allAvailableProperties.forEach(p => {
      if (p.title && p.title.toLowerCase().includes(q)) {
        const key = `prop-${p.title}`;
        if (!addedKeys.has(key)) {
          addedKeys.add(key);
          suggestions.push({
            icon: <Home className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />,
            text: p.title,
            subtitle: p.location,
            category: "Property",
            filterVal: p.title
          });
        }
      }
    });

    // 2. Match Locations
    allAvailableProperties.forEach(p => {
      if (p.location && p.location.toLowerCase().includes(q)) {
        const key = `loc-${p.location}`;
        if (!addedKeys.has(key)) {
          addedKeys.add(key);
          suggestions.push({
            icon: <MapPin className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />,
            text: p.location,
            subtitle: `Listings in ${p.location}`,
            category: "Location",
            filterVal: p.location
          });
        }
      }
    });

    // 3. Match Landlords from dynamic list
    dynamicLandlords.forEach(l => {
      if (l.name && l.name.toLowerCase().includes(q)) {
        const key = `land-${l.name}`;
        if (!addedKeys.has(key)) {
          addedKeys.add(key);
          suggestions.push({
            icon: <User className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />,
            text: l.name,
            subtitle: `Verified Partner (${l.score}★)`,
            category: "Landlord",
            filterVal: l.name
          });
        }
      }
    });

    return suggestions.slice(0, 6);
  })();

  const lastVisitedProperties = lastVisitedListings;
  const lastVisitedIds = new Set(lastVisitedProperties.map(p => p && p.id).filter(Boolean));

  const closeToYouProperties = (() => {
    const locLower = userLocationStr.toLowerCase().trim();
    if (locLower) {
      const allTokens = locLower
        .split(/[\s,\-()]+/)
        .filter(k => k.length > 2 && !["usa", "states", "united", "atlanta", "london", "york"].includes(k));

      // Prefer specific area tokens over generic "lagos", "fct", "state"
      const specificTokens = allTokens.filter(k => !["lagos", "fct", "state"].includes(k));
      const searchTokens = specificTokens.length > 0 ? specificTokens : allTokens;

      if (searchTokens.length > 0) {
        return allAvailableProperties.filter(l => {
          if (lastVisitedIds.has(l.id)) return false;
          const propLoc = (l.location || "").toLowerCase();
          return searchTokens.every(k => propLoc.includes(k));
        });
      }
      return [];
    }

    return allAvailableProperties.filter(l =>
      !lastVisitedIds.has(l.id) && l.recommendationCategory === "properties close to you"
    );
  })();

  const closeToYouIds = new Set(closeToYouProperties.map(p => p.id));

  const popularProperties = allAvailableProperties.filter(l =>
    !lastVisitedIds.has(l.id) &&
    !closeToYouIds.has(l.id) &&
    l.recommendationCategory === "Popular properties"
  );

  return (
    <>
      <main className="db-main-content search-main-content">
        {/* Main Area Sub-Header */}
        <div className="db-sub-header-row">
          <div className="db-page-header tour-search-header">
            <div className="db-breadcrumb">
              <span
                className="cursor-pointer hover:underline hover:opacity-80 transition-all text-moss-700 dark:text-[#E5C583]"
                onClick={() => navigate("/explore")}
                title="Go to Public Guest Dashboard"
              >
                Home Page
              </span>
              <span>→</span>
              <span className="db-breadcrumb-active">Search Properties</span>
            </div>
            <h1 className="db-title">Find Your Next Home</h1>
          </div>

          <div className="db-controls-group">
            <div className="db-profile-avatar-wrapper" onClick={() => setShowProfileModal(true)} title="Profile settings">
              <div className="db-avatar flex items-center justify-center bg-moss-100/70 dark:bg-[#1E382A] text-moss-700 dark:text-[#E5C583] overflow-hidden rounded-full border border-[#1E382A]/20 dark:border-[#E5C583]/30">
                {tenantAvatar ? (
                  <img src={tenantAvatar} alt="Tenant Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-[#1E382A] dark:text-[#E5C583]" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar & Toggles */}
        <div className="search-bar-row mb-6 relative" ref={searchContainerRef}>
          <div className="search-input-wrapper tour-search-bar relative">
            <SearchIcon className="search-bar-icon h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
            <input
              type="text"
              className="search-bar-input"
              placeholder={searchType === "property" ? "Search by name, location, state..." : "Search by landlord..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => {
                  setSearchQuery("");
                  setShowSuggestions(false);
                }}
              >
                &times;
              </button>
            )}

            {/* Live Recommended Autocomplete Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-[250] mt-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#12221C] shadow-2xl overflow-hidden py-1 text-left">
                <div className="px-3.5 py-2 text-[10.5px] font-bold uppercase tracking-wider text-[#6C6E73] dark:text-[#A3BCA7] border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <span>Recommended Suggestions</span>
                  <span className="text-[10px] text-moss-600 dark:text-[#E5C583] lowercase font-normal">matching &quot;{searchQuery}&quot;</span>
                </div>
                {searchSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSearchQuery(item.filterVal);
                      setShowSuggestions(false);
                      setViewAllListings(true);
                    }}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-[#1A2E26] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-base shrink-0">{item.icon}</span>
                      <div className="overflow-hidden">
                        <p className="text-[13px] font-semibold text-ink-900 dark:text-white leading-tight truncate">
                          {item.text}
                        </p>
                        <p className="text-[11px] text-[#6C6E73] dark:text-[#A3BCA7] truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10.5px] font-bold text-moss-700 dark:text-[#E5C583] uppercase tracking-wide px-2 py-0.5 rounded bg-moss-50 dark:bg-[#1E382A] shrink-0 ml-2">
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="search-scope-toggles tour-search-scope">
            <button
              className={`scope-toggle-btn ${searchType === "property" ? "active" : ""}`}
              onClick={() => { setSearchType("property"); setSearchQuery(""); }}
            >
              Property Details
            </button>
            <button
              className={`scope-toggle-btn ${searchType === "landlord" ? "active" : ""}`}
              onClick={() => { setSearchType("landlord"); setSearchQuery(""); }}
            >
              Landlord
            </button>
          </div>

          <button
            className={`search-filter-trigger-btn tour-search-filter ${filterPrice || filterBeds || filterType || filterLandlordTenure ? "active" : ""}`}
            onClick={() => setShowFilterModal(true)}
          >
            Filter
          </button>
        </div>

        {/* Active Filter Chips */}
        {(filterPrice || filterBeds || filterType || filterLandlordTenure || searchQuery) && (
          <div className="active-filter-chips mb-6">
            {searchQuery && (
              <div className="filter-chip">
                <span>{searchType === "property" ? "Query" : "Landlord"}: "{searchQuery}"</span>
                <button className="chip-remove" onClick={() => setSearchQuery("")}>&times;</button>
              </div>
            )}
            {filterPrice && (
              <div className="filter-chip">
                <span>Max: {formatCurrency(parseFloat(filterPrice), "/mo")}</span>
                <button className="chip-remove" onClick={() => setFilterPrice("")}>&times;</button>
              </div>
            )}
            {filterBeds && (
              <div className="filter-chip">
                <span>{filterBeds} Bed{parseInt(filterBeds) > 1 ? "s" : ""}</span>
                <button className="chip-remove" onClick={() => setFilterBeds("")}>&times;</button>
              </div>
            )}
            {filterType && (
              <div className="filter-chip">
                <span className="capitalize">{filterType}</span>
                <button className="chip-remove" onClick={() => setFilterType("")}>&times;</button>
              </div>
            )}
            {filterLandlordTenure && (
              <div className="filter-chip">
                <span>Tenure: {filterLandlordTenure === "new" ? "New Landlord" : "Established Landlord"}</span>
                <button className="chip-remove" onClick={() => setFilterLandlordTenure("")}>&times;</button>
              </div>
            )}
            <button
              className="clear-all-filters-btn"
              onClick={() => {
                setSearchQuery("");
                setFilterPrice("");
                setFilterBeds("");
                setFilterType("");
                setFilterLandlordTenure("");
              }}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Initial State / Recommendation Swimlanes */}
        {!hasActiveFilters && !viewAllListings ? (
          searchType === "property" ? (
            <div className="recommendations-container text-left tour-search-results">
              {/* Section 1: Last Visited */}
              <div className="recommendation-row mb-8">
                <h3 className="recommendation-section-title">Last visited</h3>
                {lastVisitedProperties.length > 0 ? (
                  <div className="recommendation-cards-scroller">
                    {lastVisitedProperties.map(p => (
                      <PropertyCard key={p.id} property={p} onInspect={handleInspectProperty} />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-[#12221C]/50 my-2">
                    <p className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7]">
                      No recently visited properties yet. Tap any property listing to inspect details and view specs.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 2: Close to You */}
              <div className="recommendation-row mb-8">
                <h3 className="recommendation-section-title">
                  Properties close to you {userLocationStr ? `(${userLocationStr})` : ""}
                </h3>
                {closeToYouProperties.length > 0 ? (
                  <div className="recommendation-cards-scroller">
                    {closeToYouProperties.map(p => (
                      <PropertyCard key={p.id} property={p} onInspect={handleInspectProperty} />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#12221C] my-2">
                    <div className="mb-2 flex justify-center"><MapPin className="h-7 w-7 text-moss-600 dark:text-[#E5C583]" /></div>
                    <h4 className="font-bold text-[14.5px] text-ink-900 dark:text-white mb-1">
                      No properties currently available close to {userLocationStr || "your location"}
                    </h4>
                    <p className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7] max-w-md mx-auto mb-4 leading-relaxed">
                      We don&apos;t have active listings in this location yet. You can explore all available listings across Nigeria below.
                    </p>
                    <Button
                      onClick={() => {
                        setViewAllListings(true);
                      }}
                      className="bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] text-[12.5px] font-bold px-5 py-2.5 rounded-xl"
                    >
                      View Available Listings
                    </Button>
                  </div>
                )}
              </div>

              {/* Section 3: Popular Properties */}
              <div className="recommendation-row mb-8" id="popular-properties-section">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="recommendation-section-title">Popular properties</h3>
                  <button
                    type="button"
                    onClick={() => setViewAllListings(true)}
                    className="text-[12.5px] font-bold text-moss-700 dark:text-[#E5C583] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    View All Listings →
                  </button>
                </div>

                {showAllPopular ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                    {popularProperties.map(p => (
                      <PropertyCard key={p.id} property={p} onInspect={handleInspectProperty} />
                    ))}
                  </div>
                ) : (
                  <div className="recommendation-cards-scroller">
                    {popularProperties.map(p => (
                      <PropertyCard key={p.id} property={p} onInspect={handleInspectProperty} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="recommendations-container text-left tour-search-results">
              {/* All Landlords derived from listings */}
              <div className="recommendation-row mb-8">
                <h3 className="recommendation-section-title">Verified Landlords</h3>
                {topRatedLandlords.length > 0 ? (
                  <div className="recommendation-cards-scroller">
                    {topRatedLandlords.map(l => (
                      <LandlordCard key={l.id} landlord={l} onInspect={handleInspectLandlord} />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#12221C] my-2">
                    <div className="mb-2 flex justify-center"><User className="h-7 w-7 text-moss-600 dark:text-[#E5C583]" /></div>
                    <h4 className="font-bold text-[14.5px] text-ink-900 dark:text-white mb-1">No landlords yet</h4>
                    <p className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7] max-w-md mx-auto leading-relaxed">
                      Landlord profiles will appear here once properties are listed and approved on Lodale.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          /* Search Results & All Listings State */
          <div className="search-results-container text-left">
            <div className="flex justify-between items-center mb-4">
              <h3 className="recommendation-section-title">
                {searchQuery || filterPrice || filterBeds || filterType || filterLandlordTenure
                  ? `Search Results (${searchType === "property" ? filteredListings.length : filteredLandlords.length})`
                  : `All Available Listings (${filteredListings.length})`
                }
              </h3>
              {viewAllListings && (
                <button
                  onClick={() => {
                    setViewAllListings(false);
                    setSearchQuery("");
                  }}
                  className="text-[12.5px] font-bold text-moss-700 dark:text-[#E5C583] hover:underline cursor-pointer flex items-center gap-1"
                >
                  ← Recommendation Swimlanes
                </button>
              )}
            </div>
            {((searchType === "property" ? filteredListings.length : filteredLandlords.length) === 0) ? (
              <div className="search-empty-state py-16 text-center flex flex-col items-center justify-center max-w-sm mx-auto">
                <div className="h-16 w-16 rounded-2xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center mb-4 text-neutral-400 dark:text-cream-100/40">
                  <SearchIcon className="h-7 w-7" />
                </div>
                {hasActiveFilters ? (
                  <>
                    <h3 className="font-bold text-lg text-ink-900 dark:text-white mb-1">
                      No matching listings found
                    </h3>
                    <p className="text-xs text-ink-500 dark:text-cream-100/60 max-w-xs leading-relaxed mb-4">
                      No properties match your active search criteria. Try modifying your filters or query keywords.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setFilterPrice("");
                        setFilterBeds("");
                        setFilterType("");
                        setFilterLandlordTenure("");
                      }}
                      className="px-4 py-2 rounded-xl bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs cursor-pointer border-none outline-none"
                    >
                      Clear Search & Filters
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-lg text-ink-900 dark:text-white mb-1">
                      No listings yet
                    </h3>
                    <p className="text-xs text-ink-500 dark:text-cream-100/60 max-w-xs leading-relaxed">
                      Be the first to list a property on Lodale!
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="search-results-grid">
                {searchType === "property" ? (
                  filteredListings.map(p => (
                    <PropertyCard key={p.id} property={p} onInspect={handleInspectProperty} />
                  ))
                ) : filteredLandlords.length > 0 ? (
                  filteredLandlords.map(l => (
                    <LandlordCard key={l.id} landlord={l} onInspect={handleInspectLandlord} />
                  ))
                ) : (
                  <div className="col-span-full p-8 text-center rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#12221C]">
                    <User className="h-8 w-8 text-moss-600 dark:text-[#E5C583] mx-auto mb-3" />
                    <h4 className="font-bold text-[14.5px] text-ink-900 dark:text-white mb-1">No landlords match your search</h4>
                    <p className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7]">Try a different name or clear your filters.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FILTER POPUP MODAL */}
      {showFilterModal && (
        <div className="tenant-modal-backdrop" onClick={() => setShowFilterModal(false)}>
          <div className="tenant-modal-content text-left" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Search Filters</h3>
              <button className="close-btn" onClick={() => setShowFilterModal(false)}>&times;</button>
            </div>

            <div className="modal-scroll-area">
              <div style={{ gap: "18px", display: "flex", flexDirection: "column" }}>
                {/* Rent Price Filter */}
                <div>
                  <label className="form-lbl">Maximum Rent Price (Monthly)</label>
                  <select
                    className="form-input"
                    value={filterPrice}
                    onChange={(e) => setFilterPrice(e.target.value)}
                  >
                    <option value="">Any price</option>
                    <option value="100000">Under ₦100,000</option>
                    <option value="200000">Under ₦200,000</option>
                    <option value="300000">Under ₦300,000</option>
                    <option value="400000">Under ₦400,000</option>
                  </select>
                </div>

                {/* Number of Bedrooms */}
                <div>
                  <label className="form-lbl">Number of Bedrooms</label>
                  <div className="beds-filter-buttons flex gap-2">
                    {["", "1", "2", "3", "4"].map((bedNum) => (
                      <button
                        key={bedNum}
                        type="button"
                        className={`beds-option-btn ${filterBeds === bedNum ? "active" : ""}`}
                        onClick={() => setFilterBeds(bedNum)}
                      >
                        {bedNum === "" ? "Any" : `${bedNum} Bed`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Type */}
                <div>
                  <label className="form-lbl">Property Type</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { val: "apartment", label: "Apartment / Flat" },
                      { val: "duplex", label: "Duplex / Townhouse" },
                      { val: "selfcontained", label: "Self-Contained / Studio" }
                    ].map((t) => (
                      <label key={t.val} className="flex items-center gap-3 cursor-pointer text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                        <input
                          type="radio"
                          name="property-type-filter"
                          value={t.val}
                          checked={filterType === t.val}
                          onChange={() => setFilterType(t.val)}
                          className="w-4 h-4 accent-[#2C4633] dark:accent-[#E5C583]"
                        />
                        <span>{t.label}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-3 cursor-pointer text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                      <input
                        type="radio"
                        name="property-type-filter"
                        value=""
                        checked={filterType === ""}
                        onChange={() => setFilterType("")}
                        className="w-4 h-4 accent-[#2C4633] dark:accent-[#E5C583]"
                      />
                      <span>Any Type</span>
                    </label>
                  </div>
                </div>

                {/* Landlord Tenure (New vs Established) */}
                <div>
                  <label className="form-lbl">Landlord Tenure</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { val: "new", label: "New Landlord (Recently Joined)" },
                      { val: "old", label: "Established Landlord" }
                    ].map((ten) => (
                      <label key={ten.val} className="flex items-center gap-3 cursor-pointer text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                        <input
                          type="radio"
                          name="landlord-tenure-filter"
                          value={ten.val}
                          checked={filterLandlordTenure === ten.val}
                          onChange={() => setFilterLandlordTenure(ten.val)}
                          className="w-4 h-4 accent-[#2C4633] dark:accent-[#E5C583]"
                        />
                        <span>{ten.label}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-3 cursor-pointer text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                      <input
                        type="radio"
                        name="landlord-tenure-filter"
                        value=""
                        checked={filterLandlordTenure === ""}
                        onChange={() => setFilterLandlordTenure("")}
                        className="w-4 h-4 accent-[#2C4633] dark:accent-[#E5C583]"
                      />
                      <span>Any Registration</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setFilterPrice("");
                  setFilterBeds("");
                  setFilterType("");
                  setFilterLandlordTenure("");
                }}
                variant="secondary"
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-3.5 text-[13px] rounded-xl dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white"
              >
                Reset Filters
              </Button>
              <Button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold py-3.5 text-[13px] rounded-xl"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PROPERTY DETAILS POPUP */}
      {showPropertyDetailsModal && selectedProperty && (
        <div className="tenant-modal-backdrop" onClick={() => { setShowPropertyDetailsModal(false); setSelectedProperty(null); }}>
          <div className="tenant-modal-content text-left" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Property Specs</h3>
              <button className="close-btn" onClick={() => { setShowPropertyDetailsModal(false); setSelectedProperty(null); }}>&times;</button>
            </div>

            <div className="modal-scroll-area">
              {/* Image banner */}
              <div className="property-banner-overlay" style={{ height: "180px", borderRadius: "18px", overflow: "hidden", position: "relative", marginBottom: "16px" }}>
                <img src={selectedProperty.image} alt={selectedProperty.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <span className="property-card-price-tag" style={{ position: "absolute", bottom: "12px", right: "12px" }}>
                  {formatCurrency(selectedProperty.price, "/mo")}
                </span>
              </div>

              {/* Title & Location */}
              <h4 className="font-bold text-[18px] text-ink-900 dark:text-white leading-snug mb-1">
                {selectedProperty.title}
              </h4>
              <p className="text-[12px] text-[#6C6E73] dark:text-[#A3BCA7] mb-4 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583] shrink-0" />
                <span>{selectedProperty.location}</span>
              </p>

              {/* Specifications pills */}
              <div className="flex gap-2 mb-5">
                <span className="px-3 py-1 bg-neutral-100 dark:bg-[#1D2D26] text-[11px] font-bold rounded-lg uppercase">
                  {selectedProperty.beds} Bed{selectedProperty.beds > 1 ? "s" : ""}
                </span>
                <span className="px-3 py-1 bg-neutral-100 dark:bg-[#1D2D26] text-[11px] font-bold rounded-lg uppercase">
                  {selectedProperty.baths} Bath{selectedProperty.baths > 1 ? "s" : ""}
                </span>
                <span className="px-3 py-1 bg-neutral-100 dark:bg-[#1D2D26] text-[11px] font-bold rounded-lg uppercase">
                  {selectedProperty.type}
                </span>
              </div>

              {/* Amenities details list */}
              <div className="invoice-summary mb-5" style={{ gap: "8px" }}>
                <span className="summary-lbl">Included Amenities</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedProperty.amenities && selectedProperty.amenities.length > 0 ? (
                    selectedProperty.amenities.map((a, i) => (
                      <span key={i} className="px-2.5 py-1 bg-neutral-50 dark:bg-[#0E1714] text-[11.5px] font-semibold rounded-md border border-neutral-100 dark:border-neutral-800/40 flex items-center gap-1">
                        <Check className="h-3 w-3 text-moss-600 dark:text-[#E5C583]" />
                        <span>{a}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11.5px] text-[#6C6E73] italic">No specific amenities listed</span>
                  )}
                </div>
              </div>

              {/* Landlord validation details */}
              <div className="flex flex-col gap-3 border-t border-neutral-100 dark:border-neutral-800/60 pt-4 mb-2">
                <div className="flex justify-between items-center">
                  <span className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7]">Verified Landlord</span>
                  <span className="text-[13px] font-bold">{selectedProperty.landlord.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7]">Landlord Rating Score</span>
                  <span className="text-[13px] font-bold text-amber-500">★ {selectedProperty.landlord.score} ({selectedProperty.landlord.reviews} reviews)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7]">Ownership Status</span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10.5px] font-bold rounded">
                    Verified Title
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Button
                onClick={() => {
                  navigate(`/listings/${selectedProperty.id}`);
                }}
                className="w-full bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] py-3.5 font-bold text-[13px] rounded-xl"
              >
                View Full Listing & Photos
              </Button>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    const landlordObj = LANDLORDS.find(l => l.name === selectedProperty.landlord.name);
                    if (landlordObj) {
                      setSelectedLandlord(landlordObj);
                      setShowLandlordDetailsModal(true);
                    }
                    setShowPropertyDetailsModal(false);
                  }}
                  variant="secondary"
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-3 text-[12.5px] rounded-xl dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white"
                >
                  Landlord Profile
                </Button>
                <Button
                  onClick={() => {
                    triggerToast("Application submitted successfully! Your pre-verified NIN profile has been shared with the landlord.", "success", "Application Sent");
                    setShowPropertyDetailsModal(false);
                  }}
                  variant="secondary"
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-3 text-[12.5px] rounded-xl dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white border border-neutral-200 dark:border-neutral-700"
                >
                  Quick Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LANDLORD DETAILS POPUP */}
      {showLandlordDetailsModal && selectedLandlord && (
        <div className="tenant-modal-backdrop" onClick={() => { setShowLandlordDetailsModal(false); setSelectedLandlord(null); }}>
          <div className="tenant-modal-content text-left" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Landlord profile specs</h3>
              <button className="close-btn" onClick={() => { setShowLandlordDetailsModal(false); setSelectedLandlord(null); }}>&times;</button>
            </div>

            <div className="modal-scroll-area">
              {/* Landlord profile header */}
              <div className="flex flex-col items-center py-4 mb-4 border-b border-neutral-100 dark:border-neutral-800/40">
                <div className="landlord-avatar-wrapper" style={{ width: "80px", height: "80px", position: "relative" }}>
                  <img src={selectedLandlord.avatar} alt={selectedLandlord.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "2px solid #E5C583" }} />
                  <span className="landlord-verification-tick flex items-center justify-center" style={{ position: "absolute", bottom: "0", right: "0", width: "22px", height: "22px" }}><Check className="h-3 w-3" /></span>
                </div>
                <h4 className="font-bold text-[20px] text-ink-900 dark:text-white mt-3 mb-1">
                  {selectedLandlord.name}
                </h4>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10.5px] font-bold rounded-full uppercase">
                  Verified title partner
                </span>
              </div>

              {/* Ratings and stats */}
              <div className="invoice-summary mb-5" style={{ padding: "16px", gap: "12px" }}>
                <span className="summary-lbl">Reliability Breakdown</span>

                <div className="flex justify-between items-center text-[12.5px]">
                  <span>Overall Rating</span>
                  <span className="font-bold text-amber-500">★ {selectedLandlord.score} / 5.0 ({selectedLandlord.reviews} Reviews)</span>
                </div>

                <div className="flex justify-between items-center text-[12.5px] mt-1">
                  <span>Base Location</span>
                  <span className="font-semibold">{selectedLandlord.location}</span>
                </div>
              </div>

              {/* Managed properties units */}
              <div className="mb-5">
                <span className="summary-lbl">Managed properties ({selectedLandlord.properties.length})</span>
                <div className="flex flex-col gap-2 mt-2">
                  {selectedLandlord.properties.map((p, idx) => (
                    <div key={idx} className="p-3 bg-neutral-50 dark:bg-[#1D2D26]/40 border border-neutral-100 dark:border-neutral-800/40 rounded-xl flex justify-between items-center">
                      <span className="text-[12.5px] font-bold">{p}</span>
                      <span className="text-[11px] text-moss-700 dark:text-[#E5C583] font-bold">Active unit</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent tenant review */}
              <div>
                <span className="summary-lbl">Tenant reviews</span>
                <div className="p-3 bg-neutral-50 dark:bg-[#1D2D26]/40 border border-neutral-100 dark:border-neutral-800/40 rounded-xl mt-2">
                  <p className="text-[12px] text-[#6C6E73] dark:text-[#A3BCA7] italic leading-relaxed">
                    "Excellent landlord experience. Maintenance issues are solved within 24 hours of reporting on the dashboard ledger."
                  </p>
                  <span className="text-[10px] block text-right mt-1 font-bold">— Tenant Verification July 2026</span>
                </div>
              </div>

            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  if (onStartChat) {
                    onStartChat(selectedLandlord.name);
                  }
                  setShowLandlordDetailsModal(false);
                }}
                variant="secondary"
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-3.5 text-[13px] rounded-xl dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white"
              >
                Send Message
              </Button>
              <Button
                onClick={() => {
                  setSearchType("property");
                  setSearchQuery(selectedLandlord.name);
                  setShowLandlordDetailsModal(false);
                }}
                className="flex-1 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] py-3.5 font-bold text-[13px] rounded-xl"
              >
                View Properties
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
