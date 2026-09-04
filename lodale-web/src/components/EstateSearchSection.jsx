import React from "react";
import { Search, MapPin, Building2, BedDouble, X, SlidersHorizontal, ArrowDown, ShieldCheck, Sparkles } from "lucide-react";

const ESTATE_CHIPS = [
  "Ikoyi",
  "Banana Island",
  "Victoria Island",
  "Lekki Phase 1",
  "Maitama Abuja",
  "Asokoro",
  "Ikeja GRA",
  "Eko Atlantic",
];

const PROPERTY_TYPES = [
  { value: "all", label: "All Property Types" },
  { value: "apartment", label: "Luxury Apartments" },
  { value: "duplex", label: "Modern Duplexes" },
  { value: "penthouse", label: "Penthouses" },
  { value: "terraced", label: "Terraced Homes" },
  { value: "villa", label: "Private Villas" },
];

const BEDROOM_OPTIONS = [
  { value: "all", label: "Any Bedrooms" },
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "4+", label: "4+ Bedrooms" },
];

const CATEGORY_TABS = ["All Estates", "For Rent", "Shortlet", "For Sale"];

export default function EstateSearchSection({
  searchQuery,
  setSearchQuery,
  propertyType,
  setPropertyType,
  bedsFilter,
  setBedsFilter,
  activeTab,
  setActiveTab,
  totalResults = 0,
  onClearFilters,
}) {
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    propertyType !== "all" ||
    bedsFilter !== "all" ||
    activeTab !== "All Estates"
  );

  const handleChipClick = (chip) => {
    if (searchQuery.toLowerCase() === chip.toLowerCase()) {
      setSearchQuery("");
    } else {
      setSearchQuery(chip);
      if (window.lenis) {
        const el = document.getElementById("listings");
        if (el) window.lenis.scrollTo(el, { offset: -90, duration: 1 });
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (window.lenis) {
      const el = document.getElementById("listings");
      if (el) window.lenis.scrollTo(el, { offset: -90, duration: 1 });
    } else {
      const el = document.getElementById("listings");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="estate-search"
      className="relative z-20 w-full py-12 md:py-16 bg-[#07130D] border-t border-b border-white/10 transition-colors"
      aria-label="Estate Search and Filter Hub"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[350px] opacity-20 filter blur-[90px]"
          style={{
            background: "radial-gradient(circle, #C9963E 0%, #2D6A4F 60%, transparent 80%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 w-full">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-[11px] font-medium tracking-widest uppercase mb-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#C9963E]" />
            Direct Tenant-To-Landlord Search
          </div>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-normal text-white tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Explore Verified Estates
          </h2>
          <p className="text-xs sm:text-sm text-white/60 max-w-xl mt-2 font-sans leading-relaxed">
            Search vetted residential properties across Nigeria’s prime quarters. Zero middleman fees, direct lease contracts, and physical inspection reports.
          </p>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 mt-6 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#C9963E] text-white shadow-md shadow-[#C9963E]/20"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filter Bar Card */}
        <form
          onSubmit={handleSearchSubmit}
          className="p-3 sm:p-4 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-2xl shadow-black/60 transition-all hover:border-white/25"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Location / Keyword Input */}
            <div className="md:col-span-5 relative flex items-center bg-black/30 border border-white/10 rounded-2xl px-3.5 py-3 hover:border-white/20 focus-within:border-[#C9963E]/80 transition-all">
              <MapPin className="w-4 h-4 text-[#C9963E] shrink-0 mr-3" />
              <div className="flex-1 flex flex-col">
                <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 leading-none mb-1">
                  Location or Estate
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Ikoyi, Lekki Phase 1, Banana Island..."
                  className="w-full bg-transparent text-white placeholder:text-white/35 text-xs sm:text-sm font-medium outline-none border-none p-0"
                />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                  title="Clear location"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Property Type Dropdown */}
            <div className="md:col-span-3 relative flex items-center bg-black/30 border border-white/10 rounded-2xl px-3.5 py-3 hover:border-white/20 focus-within:border-[#C9963E]/80 transition-all">
              <Building2 className="w-4 h-4 text-[#C9963E] shrink-0 mr-3" />
              <div className="flex-1 flex flex-col">
                <label
                  htmlFor="estate-type-select"
                  className="text-[10px] uppercase font-mono tracking-wider text-white/40 leading-none mb-1 cursor-pointer"
                >
                  Property Type
                </label>
                <select
                  id="estate-type-select"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full bg-transparent text-white text-xs sm:text-sm font-medium outline-none border-none p-0 cursor-pointer appearance-none"
                  style={{ colorScheme: "dark" }}
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-[#0D1F17] text-white">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bedrooms Dropdown */}
            <div className="md:col-span-2 relative flex items-center bg-black/30 border border-white/10 rounded-2xl px-3.5 py-3 hover:border-white/20 focus-within:border-[#C9963E]/80 transition-all">
              <BedDouble className="w-4 h-4 text-[#C9963E] shrink-0 mr-3" />
              <div className="flex-1 flex flex-col">
                <label
                  htmlFor="estate-beds-select"
                  className="text-[10px] uppercase font-mono tracking-wider text-white/40 leading-none mb-1 cursor-pointer"
                >
                  Bedrooms
                </label>
                <select
                  id="estate-beds-select"
                  value={bedsFilter}
                  onChange={(e) => setBedsFilter(e.target.value)}
                  className="w-full bg-transparent text-white text-xs sm:text-sm font-medium outline-none border-none p-0 cursor-pointer appearance-none"
                  style={{ colorScheme: "dark" }}
                >
                  {BEDROOM_OPTIONS.map((b) => (
                    <option key={b.value} value={b.value} className="bg-[#0D1F17] text-white">
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Button */}
            <div className="md:col-span-2 flex items-center">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-[#C9963E] hover:bg-[#b58332] text-white font-semibold text-xs sm:text-sm tracking-wide transition-all duration-300 shadow-lg shadow-[#C9963E]/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span>Find Estates</span>
              </button>
            </div>
          </div>

          {/* Quick Estate Chips */}
          <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 mr-1 flex items-center gap-1">
              Popular:
            </span>
            {ESTATE_CHIPS.map((chip) => {
              const isSelected = searchQuery.toLowerCase().includes(chip.toLowerCase());
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-[#C9963E]/20 text-[#E5C583] border border-[#C9963E]/60 shadow-sm"
                      : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </form>

        {/* Results summary bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60 px-2 font-sans">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Showing <strong className="text-white font-semibold">{totalResults}</strong> verified{" "}
              {totalResults === 1 ? "estate residence" : "estate residences"}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-1 ml-2 text-xs font-semibold text-[#E5C583] hover:underline cursor-pointer"
              >
                <X className="w-3 h-3" /> Clear all filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-white/50 text-[11px]">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Direct Landlords Only
            </span>
            <span>•</span>
            <span>0% Agency Markup</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                if (window.lenis) {
                  const el = document.getElementById("listings");
                  if (el) window.lenis.scrollTo(el, { offset: -90, duration: 1 });
                } else {
                  const el = document.getElementById("listings");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="inline-flex items-center gap-1 text-[#E5C583] hover:text-white transition-colors cursor-pointer"
            >
              View listings below <ArrowDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
