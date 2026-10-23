import React, { useState, useEffect } from "react";
import { Building2, Users, ChevronLeft, ChevronRight, MapPin, Plus, Home, AlertTriangle, RefreshCw } from "lucide-react";
import { getPropertyStatus, getPropertyVacancyInfo } from "../../../utils/landlordMetrics";

export default function PropertyCarouselCard({
  properties = [],
  leases = [],
  loading = false,
  hasError = false,
  onRetry,
  onAddProperty,
  onViewProperty,
  onViewAll
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Keep index within bounds if properties array changes
  useEffect(() => {
    if (currentIndex >= properties.length && properties.length > 0) {
      setCurrentIndex(properties.length - 1);
    }
  }, [properties.length, currentIndex]);

  // Auto-advance property slides every 5 seconds (pauses on hover)
  useEffect(() => {
    if (properties.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === properties.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [properties.length, isPaused]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? properties.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === properties.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (e, idx) => {
    e.stopPropagation();
    setCurrentIndex(idx);
  };

  // Loading Skeleton State
  if (loading && !hasError) {
    return (
      <div className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full min-h-[380px] animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-slate-200 dark:bg-white/10 rounded-md" />
          <div className="h-4 w-16 bg-slate-200 dark:bg-white/10 rounded-md" />
        </div>
        <div className="w-full h-44 bg-slate-200 dark:bg-white/10 rounded-2xl mb-4" />
        <div className="space-y-2.5">
          <div className="h-5 w-3/4 bg-slate-200 dark:bg-white/10 rounded-md" />
          <div className="h-4 w-1/2 bg-slate-200 dark:bg-white/10 rounded-md" />
          <div className="flex gap-2 pt-1">
            <div className="h-6 w-20 bg-slate-200 dark:bg-white/10 rounded-lg" />
            <div className="h-6 w-24 bg-slate-200 dark:bg-white/10 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Error State: Failed to load properties
  if (hasError && (!properties || properties.length === 0)) {
    return (
      <div className="bg-white dark:bg-[#192A1F] border border-rose-200 dark:border-rose-900/50 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-full min-h-[380px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              My Properties
            </h3>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3.5 border border-rose-100 dark:border-rose-800/30 shadow-xs">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mb-1">
            Failed to Load Properties
          </h4>
          <p className="text-xs text-slate-500 dark:text-cream-100/60 max-w-xs leading-relaxed mb-5">
            Unable to fetch property listings. Please check your connection and retry.
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Loading</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty State: 0 Properties
  if (!properties || properties.length === 0) {
    return (
      <div className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-3xl p-6 shadow-xs flex flex-col justify-between h-full min-h-[380px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#E5C583]">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              My Properties
            </h3>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-[#E5C583] flex items-center justify-center mb-3.5 border border-emerald-100 dark:border-emerald-800/30 shadow-xs">
            <Home className="h-7 w-7" />
          </div>
          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mb-1">
            No properties listed yet
          </h4>
          <p className="text-xs text-slate-500 dark:text-cream-100/60 max-w-xs leading-relaxed mb-5">
            Add your first property to manage rental units, active tenancies, and automated rent collection.
          </p>
          <button
            type="button"
            onClick={onAddProperty}
            className="px-4 py-2.5 bg-[#1B4D35] hover:bg-[#143D2A] dark:bg-[#E5C583] dark:hover:bg-[#D4B371] text-white dark:text-[#09090b] font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Property</span>
          </button>
        </div>
      </div>
    );
  }

  const currentProperty = properties[currentIndex] || properties[0];
  const propStatus = getPropertyStatus(currentProperty, leases);
  const vacancyInfo = getPropertyVacancyInfo(currentProperty, leases);

  const unitCount = vacancyInfo.totalUnits || currentProperty.units || 1;
  const occupiedCount = propStatus.isOccupied
    ? Math.max(1, vacancyInfo.totalUnits - vacancyInfo.vacantUnits)
    : (vacancyInfo.occupiedUnits || 0);

  const propImage = currentProperty.cover_image || currentProperty.images?.[0] || "/skyline_apartment.png";
  const propTitle = currentProperty.title || "Maple Court Apartments";
  const propLocation = currentProperty.location || currentProperty.address || "Lekki Phase 1, Lagos";

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="tour-property-list bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full min-h-[380px] transition-all"
    >
      {/* Header Row: Title on Left, Slide Counter on Right (Matching Mockup Image 2) */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
          My Properties
        </h3>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 dark:text-cream-100/60">
            {properties.length > 0 ? `${currentIndex + 1} / ${properties.length}` : "0 / 0"}
          </span>
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-bold text-[#00875A] dark:text-[#E5C583] hover:underline flex items-center gap-0.5 transition-all cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Property Slide Body */}
      <div
        onClick={() => onViewProperty && onViewProperty(currentProperty)}
        className="flex-1 flex flex-col justify-between group cursor-pointer"
        title="Click to view property details"
      >
        {/* Cover Photo with Floating Carousel Arrows (Matching Mockup Image 1 & 2) */}
        <div className="relative h-44 sm:h-52 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-black/30 border border-slate-200/60 dark:border-white/5 shrink-0">
          <img
            key={currentProperty?.id || currentIndex}
            src={propImage}
            alt={propTitle}
            className="w-full h-full object-cover group-hover:scale-102 transition-all duration-500"
            onError={(e) => {
              e.currentTarget.src = "/skyline_apartment.png";
            }}
          />

          {/* Floating Left Arrow on Photo */}
          {properties.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous property"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer z-10 border border-black/5"
            >
              <ChevronLeft className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
          )}

          {/* Floating Right Arrow on Photo */}
          {properties.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next property"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer z-10 border border-black/5"
            >
              <ChevronRight className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
          )}

          {/* Status Badge */}
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${propStatus.dashboardBadgeClass || "bg-[#00875A] text-white"}`}
          >
            {propStatus.label || "Active"}
          </span>
        </div>

        {/* Dots Pagination Below Photo (Matching Mockup Image 1) */}
        {properties.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-2.5">
            {properties.slice(0, 8).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => handleDotClick(e, idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`rounded-full transition-all cursor-pointer ${
                  currentIndex === idx
                    ? "w-2.5 h-2.5 bg-[#00875A] dark:bg-[#E5C583]"
                    : "w-2 h-2 bg-slate-300 dark:bg-white/20 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        )}

        {/* Title & Location (Matching Mockup Image 2) */}
        <div className="pt-2.5 pb-1 space-y-1 text-left">
          <h4
            className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate group-hover:text-[#00875A] dark:group-hover:text-[#E5C583] transition-colors"
            title={propTitle}
          >
            {propTitle}
          </h4>
          <p
            className="text-xs text-slate-500 dark:text-cream-100/60 truncate flex items-center gap-1"
            title={propLocation}
          >
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{propLocation}</span>
          </p>

          {/* Specs Row: Units and Occupied (Matching Mockup Image 2) */}
          <div className="flex items-center gap-6 pt-2 text-xs font-semibold text-slate-700 dark:text-cream-100">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#00875A] dark:text-[#E5C583] shrink-0" />
              <span>{unitCount} {unitCount === 1 ? "Unit" : "Units"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#00875A] dark:text-[#E5C583] shrink-0" />
              <span>{occupiedCount} Occupied</span>
              <span className="w-2 h-2 rounded-full bg-[#00875A] shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
