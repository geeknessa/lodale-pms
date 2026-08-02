import { useState, useRef } from "react";
import { Search as SearchIcon, User } from "lucide-react";
import Button from "../../components/Button";
import "./TenantSearch.css";

// Rich Mock Dataset for search and recommendation swipers
const SEARCH_LISTINGS = [
  {
    id: "skyline-block4",
    title: "Skyline Apartments, Block 4",
    location: "Victoria Island, Lagos",
    price: 375000,
    beds: 3,
    baths: 3,
    type: "apartment",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["Prepaid Meter", "Borehole", "24/7 Security"],
    landlord: { name: "Ada K.", score: 4.8, reviews: 12 },
    recommendationCategory: "Popular properties"
  },
  {
    id: "oakwood-unit12b",
    title: "Oakwood Residency, Unit 12B",
    location: "Yaba, Lagos",
    price: 150000,
    beds: 2,
    baths: 2,
    type: "apartment",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["Prepaid Meter", "Gated Estate"],
    landlord: { name: "Chidi O.", score: 4.5, reviews: 8 },
    recommendationCategory: "Last visited"
  },
  {
    id: "lekki-gardens-14",
    title: "Lekki Gardens, Plot 14",
    location: "Lekki Phase 1, Lagos",
    price: 200000,
    beds: 2,
    baths: 2,
    type: "selfcontained",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["Borehole", "Generator", "24/7 Security"],
    landlord: { name: "Funke A.", score: 4.9, reviews: 21 },
    recommendationCategory: "properties close to you"
  },
  {
    id: "maryland-duplex",
    title: "Maryland Heights Duplex",
    location: "Maryland, Lagos",
    price: 450000,
    beds: 4,
    baths: 4,
    type: "duplex",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["Prepaid Meter", "Borehole", "24/7 Security", "Boys Quarters"],
    landlord: { name: "Emeka Obi", score: 4.7, reviews: 10 },
    recommendationCategory: "Popular properties"
  },
  {
    id: "ikeja-selfcontained",
    title: "Ikeja GRA Studio Self-Contained",
    location: "Ikeja, Lagos",
    price: 80000,
    beds: 1,
    baths: 1,
    type: "selfcontained",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["Prepaid Meter", "24/7 Security"],
    landlord: { name: "Maren Maureen", score: 4.6, reviews: 5 },
    recommendationCategory: "properties close to you"
  },
  {
    id: "surulere-apartment",
    title: "Adeniran Ogunsanya Flat",
    location: "Surulere, Lagos",
    price: 250000,
    beds: 3,
    baths: 2,
    type: "apartment",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["Prepaid Meter", "Water Treatment"],
    landlord: { name: "Ryan Herwinds", score: 4.8, reviews: 18 },
    recommendationCategory: "Last visited"
  },
  {
    id: "ikoyi-penthouse",
    title: "Grand Orchard Penthouse",
    location: "Ikoyi, Lagos",
    price: 600000,
    beds: 4,
    baths: 4,
    type: "apartment",
    image: "https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["Elevator", "24/7 Security", "Swimming Pool", "Prepaid Meter"],
    landlord: { name: "Ada K.", score: 4.8, reviews: 12 },
    recommendationCategory: "Popular properties"
  },
  {
    id: "sunset-haven",
    title: "Sunset Haven Duplex",
    location: "Lekki Phase 2, Lagos",
    price: 350000,
    beds: 3,
    baths: 3,
    type: "duplex",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["Prepaid Meter", "Borehole", "24/7 Security", "Gated Estate"],
    landlord: { name: "Funke A.", score: 4.9, reviews: 21 },
    recommendationCategory: "Last visited"
  },
  {
    id: "yaba-studio",
    title: "Standard Studio Yaba",
    location: "Alagomeji, Yaba, Lagos",
    price: 95000,
    beds: 1,
    baths: 1,
    type: "selfcontained",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["Prepaid Meter", "Borehole"],
    landlord: { name: "Chidi O.", score: 4.5, reviews: 8 },
    recommendationCategory: "properties close to you"
  },
  {
    id: "maryland-flat",
    title: "Maryland Executive Flat",
    location: "Maryland, Lagos",
    price: 300000,
    beds: 3,
    baths: 3,
    type: "apartment",
    image: "https://images.unsplash.com/photo-1502672090437-048b7a216e54?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["Prepaid Meter", "Borehole", "24/7 Security", "Car Port"],
    landlord: { name: "Emeka Obi", score: 4.7, reviews: 10 },
    recommendationCategory: "Popular properties"
  },
  {
    id: "gra-mansion",
    title: "GRA Luxury Mansion",
    location: "Ikeja GRA, Lagos",
    price: 800000,
    beds: 5,
    baths: 6,
    type: "duplex",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["Swimming Pool", "24/7 Security", "Prepaid Meter", "Water Treatment"],
    landlord: { name: "Maren Maureen", score: 4.6, reviews: 5 },
    recommendationCategory: "Popular properties"
  },
  {
    id: "surulere-studio",
    title: "Surulere Cozy Studio",
    location: "Surulere, Lagos",
    price: 110000,
    beds: 1,
    baths: 1,
    type: "selfcontained",
    image: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["Prepaid Meter", "Water Treatment", "24/7 Security"],
    landlord: { name: "Ryan Herwinds", score: 4.8, reviews: 18 },
    recommendationCategory: "properties close to you"
  },
  {
    id: "abuja-maitama-royal",
    title: "Maitama Royal Residency",
    location: "FCT - Abuja (Maitama)",
    price: 550000,
    beds: 3,
    baths: 3,
    type: "apartment",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["24/7 Power", "Prepaid Meter", "Security Detail"],
    landlord: { name: "Fatima B.", score: 4.9, reviews: 14 },
    recommendationCategory: "properties close to you"
  },
  {
    id: "ph-gra-suite",
    title: "GRA Phase 2 Executive Suite",
    location: "Rivers - Port Harcourt",
    price: 320000,
    beds: 2,
    baths: 2,
    type: "apartment",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["Water Treatment", "24/7 Security"],
    landlord: { name: "Tari E.", score: 4.7, reviews: 9 },
    recommendationCategory: "properties close to you"
  },
  {
    id: "ibadan-bodija-flat",
    title: "Bodija Garden Estate Flat",
    location: "Oyo - Ibadan",
    price: 180000,
    beds: 3,
    baths: 2,
    type: "apartment",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["Borehole", "Prepaid Meter", "Car Park"],
    landlord: { name: "Akanbi O.", score: 4.6, reviews: 11 },
    recommendationCategory: "properties close to you"
  },
  {
    id: "enugu-independence-layout",
    title: "Independence Layout Suite",
    location: "Enugu - Enugu",
    price: 160000,
    beds: 2,
    baths: 2,
    type: "apartment",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&h=250&q=80",
    amenities: ["Paved Road", "Prepaid Meter"],
    landlord: { name: "Nnamdi K.", score: 4.8, reviews: 7 },
    recommendationCategory: "properties close to you"
  }
];

// Rich Mock Dataset for landlords
const LANDLORDS = [
  {
    id: "landlord-ada",
    name: "Ada K.",
    score: 4.8,
    reviews: 12,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80",
    location: "Victoria Island, Lagos",
    properties: ["Skyline Apartments, Block 4", "Grand Orchard Penthouse"],
    category: "Top Rated Landlords",
    joinedStatus: "old"
  },
  {
    id: "landlord-chidi",
    name: "Chidi O.",
    score: 4.5,
    reviews: 8,
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80",
    location: "Yaba, Lagos",
    properties: ["Oakwood Residency, Unit 12B", "Standard Studio Yaba"],
    category: "Landlords near you",
    joinedStatus: "old"
  },
  {
    id: "landlord-funke",
    name: "Funke A.",
    score: 4.9,
    reviews: 21,
    avatar: "https://images.unsplash.com/photo-1580894732444-8fecef2601de?auto=format&fit=crop&w=150&h=150&q=80",
    location: "Lekki Phase 1, Lagos",
    properties: ["Lekki Gardens, Plot 14", "Sunset Haven Duplex"],
    category: "Top Rated Landlords",
    joinedStatus: "old"
  },
  {
    id: "landlord-emeka",
    name: "Emeka Obi",
    score: 4.7,
    reviews: 10,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80",
    location: "Maryland, Lagos",
    properties: ["Maryland Heights Duplex", "Maryland Executive Flat"],
    category: "Top Rated Landlords",
    joinedStatus: "new"
  },
  {
    id: "landlord-maren",
    name: "Maren Maureen",
    score: 4.6,
    reviews: 5,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
    location: "Ikeja, Lagos",
    properties: ["Ikeja GRA Studio Self-Contained", "GRA Luxury Mansion"],
    category: "Landlords near you",
    joinedStatus: "new"
  },
  {
    id: "landlord-ryan",
    name: "Ryan Herwinds",
    score: 4.8,
    reviews: 18,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    location: "Surulere, Lagos",
    properties: ["Adeniran Ogunsanya Flat", "Surulere Cozy Studio"],
    category: "Top Rated Landlords",
    joinedStatus: "old"
  }
];

const formatPrice = (priceVal) => {
  if (priceVal === null || priceVal === undefined) return "₦0/mo";
  let str = String(priceVal).trim();
  str = str.replace(/^[₦N\s]+/, "").replace(/\/mo.*$/i, "").trim();
  const numeric = parseFloat(str.replace(/,/g, ""));
  if (!isNaN(numeric)) {
    return `₦${numeric.toLocaleString()}/mo`;
  }
  return `₦${str}/mo`;
};

// Helper Property Card Component
function PropertyCard({ property, onInspect }) {
  return (
    <div className="search-property-card">
      <div className="property-card-image-wrapper">
        <img src={property.image} alt={property.title} className="property-card-image" />
        <span className="property-card-price-tag">
          {formatPrice(property.price)}
        </span>
      </div>

      <div className="property-card-body text-left">
        <h4 className="property-card-title-text">{property.title}</h4>
        <p className="property-card-location">📍 {property.location}</p>

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
          <span className="landlord-verification-tick">✓</span>
        </div>
        <h4 className="landlord-name-text">{landlord.name}</h4>
        <span className="landlord-badge">Verified Partner</span>
      </div>

      <div className="landlord-card-body text-left">
        <div className="landlord-metric flex justify-between items-center text-[12.5px] mb-2">
          <span className="text-[#6C6E73] dark:text-[#A3BCA7]">Rating Score</span>
          <span className="font-bold text-amber-500">★ {landlord.score} ({landlord.reviews} reviews)</span>
        </div>
        <div className="landlord-metric flex justify-between items-center text-[12.5px] mb-3">
          <span className="text-[#6C6E73] dark:text-[#A3BCA7]">Base Location</span>
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">📍 {landlord.location.split(",")[0]}</span>
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

export default function TenantSearch({ setShowProfileModal, onStartChat }) {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("property"); // "property" | "landlord"
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Filter Fields
  const [filterPrice, setFilterPrice] = useState(""); // Max price limit
  const [filterBeds, setFilterBeds] = useState(""); // Number of bedrooms
  const [filterType, setFilterType] = useState(""); // "apartment" | "duplex" | "selfcontained" | ""
  const [filterLandlordTenure, setFilterLandlordTenure] = useState(""); // "" | "new" | "old"

  // Property Details modal states
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyDetailsModal, setShowPropertyDetailsModal] = useState(false);

  const handleInspectProperty = (property) => {
    setSelectedProperty(property);
    setShowPropertyDetailsModal(true);
  };

  // Landlord Details modal states
  const [selectedLandlord, setSelectedLandlord] = useState(null);
  const [showLandlordDetailsModal, setShowLandlordDetailsModal] = useState(false);

  const handleInspectLandlord = (landlord) => {
    setSelectedLandlord(landlord);
    setShowLandlordDetailsModal(true);
  };

  // Landlord Filtering & Search matching logic
  const filteredLandlords = LANDLORDS.filter(landlord => {
    // 1. Text Search matching
    if (searchQuery.trim() !== "") {
      if (!landlord.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
    }

    // 2. Filter match on any of the landlord's properties
    if (filterPrice !== "" || filterBeds !== "" || filterType !== "") {
      const landlordProperties = SEARCH_LISTINGS.filter(p => p.landlord.name === landlord.name);
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

  const topRatedLandlords = LANDLORDS.filter(l => l.category === "Top Rated Landlords");
  const nearYouLandlords = LANDLORDS.filter(l => l.category === "Landlords near you");

  // Helper to check if any filters are active
  const hasActiveFilters = searchQuery.trim() !== "" || filterPrice !== "" || filterBeds !== "" || filterType !== "" || filterLandlordTenure !== "";

  // Perform search filtering
  const filteredListings = SEARCH_LISTINGS.filter(listing => {
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
      const raw = localStorage.getItem("currentUserProfile");
      if (raw) {
        const prof = JSON.parse(raw);
        return prof.location || "";
      }
    } catch (e) { }
    return "";
  })();

  const allAvailableProperties = (() => {
    const saved = localStorage.getItem("properties");
    const addedProps = saved ? JSON.parse(saved) : [];
    const combined = [...addedProps, ...SEARCH_LISTINGS];
    const seen = new Set();
    return combined.filter(p => {
      if (!p) return false;
      const key = (p.id || p.title || "").toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  const lastVisitedProperties = allAvailableProperties.filter(l => l.recommendationCategory === "Last visited");
  const lastVisitedIds = new Set(lastVisitedProperties.map(p => p.id));

  const closeToYouProperties = (() => {
    const locLower = userLocationStr.toLowerCase().trim();
    if (locLower) {
      const allTokens = locLower
        .split(/[\s,\-\(\)]+/)
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
              <span>Home Page</span>
              <span>→</span>
              <span className="db-breadcrumb-active">Search Properties</span>
            </div>
            <h1 className="db-title">Find Your Next Home</h1>
          </div>

          <div className="db-controls-group">
            <div className="db-profile-avatar-wrapper" onClick={() => setShowProfileModal(true)} title="Profile settings">
              <div className="db-avatar">
                <User className="h-4 w-4 text-[#1E382A] dark:text-[#E5C583]" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar & Toggles */}
        <div className="search-bar-row mb-6">
          <div className="search-input-wrapper tour-search-bar">
            <SearchIcon className="search-bar-icon h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
            <input
              type="text"
              className="search-bar-input"
              placeholder={searchType === "property" ? "Search by name, location, state..." : "Search by landlord..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery("")}>&times;</button>
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
                <span>Max: ₦{parseFloat(filterPrice).toLocaleString()}</span>
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
        {!hasActiveFilters ? (
          searchType === "property" ? (
            <div className="recommendations-container text-left tour-search-results">
              {/* Section 1: Last Visited */}
              <div className="recommendation-row mb-8">
                <h3 className="recommendation-section-title">Last visited</h3>
                <div className="recommendation-cards-scroller">
                  {lastVisitedProperties.map(p => (
                    <PropertyCard key={p.id} property={p} onInspect={handleInspectProperty} />
                  ))}
                </div>
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
                    <div className="text-2xl mb-2">📍</div>
                    <h4 className="font-bold text-[14.5px] text-ink-900 dark:text-white mb-1">
                      No properties currently available close to {userLocationStr || "your location"}
                    </h4>
                    <p className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7] max-w-md mx-auto mb-4 leading-relaxed">
                      We don&apos;t have active listings in this location yet. You can explore all available listings across Nigeria below.
                    </p>
                    <Button
                      onClick={() => {
                        const el = document.getElementById("popular-properties-section");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] text-[12.5px] font-bold px-5 py-2.5 rounded-xl"
                    >
                      View Available Listings
                    </Button>
                  </div>
                )}
              </div>

              {/* Section 3: Popular */}
              <div className="recommendation-row" id="popular-properties-section">
                <h3 className="recommendation-section-title">Popular properties</h3>
                <div className="recommendation-cards-scroller">
                  {popularProperties.map(p => (
                    <PropertyCard key={p.id} property={p} onInspect={handleInspectProperty} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="recommendations-container text-left tour-search-results">
              {/* Section 1: Top Rated Landlords */}
              <div className="recommendation-row mb-8">
                <h3 className="recommendation-section-title">Top Rated Landlords</h3>
                <div className="recommendation-cards-scroller">
                  {topRatedLandlords.map(l => (
                    <LandlordCard key={l.id} landlord={l} onInspect={handleInspectLandlord} />
                  ))}
                </div>
              </div>

              {/* Section 2: Landlords near you */}
              <div className="recommendation-row">
                <h3 className="recommendation-section-title">Landlords near you</h3>
                <div className="recommendation-cards-scroller">
                  {nearYouLandlords.map(l => (
                    <LandlordCard key={l.id} landlord={l} onInspect={handleInspectLandlord} />
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (
          /* Search Results State */
          <div className="search-results-container text-left">
            <h3 className="recommendation-section-title mb-4">Search Results ({searchType === "property" ? filteredListings.length : filteredLandlords.length})</h3>
            {((searchType === "property" ? filteredListings.length : filteredLandlords.length) === 0) ? (
              <div className="search-empty-state py-12 text-center">
                <div className="search-empty-icon text-3xl mb-3">🔍</div>
                <h4 className="font-bold text-[16px]">No Match Matched Your Criteria</h4>
                <p className="text-[12.5px] text-[#6C6E73] dark:text-[#A3BCA7] mt-1 max-w-sm mx-auto">
                  Try clearing some active filters or modifying your query keywords.
                </p>
              </div>
            ) : (
              <div className="search-results-grid">
                {searchType === "property" ? (
                  filteredListings.map(p => (
                    <PropertyCard key={p.id} property={p} onInspect={handleInspectProperty} />
                  ))
                ) : (
                  filteredLandlords.map(l => (
                    <LandlordCard key={l.id} landlord={l} onInspect={handleInspectLandlord} />
                  ))
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
                className="flex-1 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] font-bold py-3.5 text-[13px] rounded-xl"
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
                  {formatPrice(selectedProperty.price)}
                </span>
              </div>

              {/* Title & Location */}
              <h4 className="font-bold text-[18px] text-ink-900 dark:text-white leading-snug mb-1">
                {selectedProperty.title}
              </h4>
              <p className="text-[12px] text-[#6C6E73] dark:text-[#A3BCA7] mb-4">
                📍 {selectedProperty.location}
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
                  {selectedProperty.amenities.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 bg-neutral-50 dark:bg-[#0E1714] text-[11.5px] font-semibold rounded-md border border-neutral-100 dark:border-neutral-800/40">
                      ✓ {a}
                    </span>
                  ))}
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

            <div className="flex gap-3 mt-6">
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
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-3.5 text-[13px] rounded-xl dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white"
              >
                Landlord Profile
              </Button>
              <Button
                onClick={() => {
                  alert("Application submitted! Pre-verified NIN profile shared with landlord.");
                  setShowPropertyDetailsModal(false);
                }}
                className="flex-1 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] py-3.5 font-bold text-[13px] rounded-xl"
              >
                Apply to Rent
              </Button>
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
                  <span className="landlord-verification-tick" style={{ position: "absolute", bottom: "0", right: "0", width: "22px", height: "22px", fontSize: "12px" }}>✓</span>
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
                className="flex-1 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] py-3.5 font-bold text-[13px] rounded-xl"
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
