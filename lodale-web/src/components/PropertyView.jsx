import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyService } from '../services/propertyService';
import { profileService } from '../services/profileService';
import { ratingService } from '../services/ratingService';
import { triggerToast } from '../context/ToastContext';
import Button from './Button';
import { Logo } from './Logo';
import {
  ArrowLeft, MapPin, BedDouble, Bath, CheckCircle2, XCircle, ShieldCheck,
  Building2, Trash2, Edit3, Loader2, ListChecks, Home, DollarSign, AlertTriangle, Shield,
  Maximize2, ChevronLeft, ChevronRight, X, Star, User
} from 'lucide-react';
import PropertyDetailMap from './PropertyDetailMap';
import QuickEditPropertyModal from './QuickEditPropertyModal';
import { useTenantQualification } from '../hooks/useTenantQualification';
import { interactionTracker } from '../utils/interactionTracker';

export function PropertyDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImagesOverride, setLightboxImagesOverride] = useState(null);
  const [selectedUnitForModal, setSelectedUnitForModal] = useState(null);
  const [showUnitSelectorModal, setShowUnitSelectorModal] = useState(false);

  const { 
    meetsIncome, 
    meetsGuarantor, 
    meetsEmployment, 
    requirements, 
    tenantStats 
  } = useTenantQualification(property);


  const requiredIncome = requirements?.income || (property?.minimum_income_required ? `₦${Number(property.minimum_income_required).toLocaleString()}/yr` : "None Stated");
  const employmentReq = requirements?.employment || property?.employment_requirement || "Any Employment Status";

  useEffect(() => {
    async function loadProperty() {
      setLoading(true);
      setError(null);
      try {
        const data = await propertyService.getPropertyById(id);
        if (data) {
          setProperty(data);
        } else {
          // Check per-user session storage fallback
          const currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId");
          const userEmail = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
          const userKey = "landlord_properties_" + (currentUserId || userEmail);
          const landlordProps = JSON.parse(sessionStorage.getItem(userKey) || '[]');
          const found = landlordProps.find(p => String(p.id) === String(id));
          if (found) setProperty(found);
        }
      } catch (err) {
        console.error("Failed to load property details:", err);
        setError(err.message || "The property service could not be reached.");
      } finally {
        setLoading(false);
      }
    }
    loadProperty();

    const handleUpdate = () => loadProperty();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("propertyUpdated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("propertyUpdated", handleUpdate);
    };
  }, [id]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : (property?.images?.length || 1) - 1));
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev < (property?.images?.length || 1) - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, property]);

  useEffect(() => {
    if (property) {
      const landlordId = property.landlord_id || property.landlord?.id || property.landlordId;
      interactionTracker.trackEvent(property.id, landlordId, 'view');
    }
  }, [property]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1715] text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="h-10 w-10 text-[#E5C583] animate-spin mb-3" />
        <p className="text-sm font-semibold text-cream-100/70">Loading Property Details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F1715] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Property details unavailable</h2>
        <p className="text-sm text-cream-100/60 mb-6 max-w-md">
          {error}
        </p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.reload()} className="bg-[#E5C583] text-[#09090b] font-bold px-6 py-2.5 rounded-xl cursor-pointer">
            Retry
          </Button>
          <Button onClick={() => navigate(-1)} variant="outline" className="border-white/20 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#0F1715] text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
        <p className="text-sm text-cream-100/60 mb-6">The property listing you requested could not be located.</p>
        <Button onClick={() => navigate(-1)} className="bg-[#E5C583] text-[#09090b] font-bold px-6 py-2.5 rounded-xl">
          Go Back
        </Button>
      </div>
    );
  }

  const allImages = property.images && property.images.length > 0
    ? property.images
    : (property.cover_image ? [property.cover_image] : ['/src/assets/skyline_apartment.png']);

  const currentImage = allImages[activeImageIndex] || allImages[0];

  const landlordId = property.landlord_id || property.landlord?.id || property.landlordId || "landlord_default";
  const landlordName = property.landlord_name || property.landlord?.name || property.landlordName || (property.landlord?.first_name ? `${property.landlord.first_name} ${property.landlord.last_name || ''}`.trim() : "Landlord");
  const landlordRatingData = ratingService.getLandlordReviews(landlordId);

  const currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId");
  const currentUserRole = (sessionStorage.getItem("userRole") || "").toLowerCase();

  const isOwnerLandlord = currentUserRole === "landlord" && (
    String(property.landlord_id) === String(currentUserId) ||
    String(property.landlord?.id) === String(currentUserId) ||
    String(property.landlordId) === String(currentUserId) ||
    (!property.landlord_id && !property.landlord?.id)
  );

  // Parse House Rules
  const cleanString = (str) => typeof str === 'string' ? str.replace(/^[{"]+|[}"]+$/g, '').trim() : str;
  const houseRulesList = Array.isArray(property?.house_rules)
    ? property.house_rules.map(cleanString)
    : (typeof property?.rules === 'string' && property.rules ? property.rules.split(',').map(cleanString) : []);

  const handleApply = (unitName = null) => {
    const auth = sessionStorage.getItem("isAuthenticated") === "true";
    const role = (sessionStorage.getItem("userRole") || "").toLowerCase();
    if (!auth) {
      triggerToast("Please log in as a tenant to apply for this property.", "info", "Login Required");
      navigate("/login", { state: { fromProtected: true } });
    } else if (role !== "tenant") {
      triggerToast("Only registered tenant accounts can submit rental applications.", "warning", "Tenant Role Required");
    } else if (!meetsIncome) {
      triggerToast(`Your annual income tier (${tenantStats.income || 'Not Provided'}) does not meet the landlord's requirement (${requirements.income}). You cannot apply.`, "error", "Qualification Blocked");
    } else {
      const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
      let userProf = null;
      try {
        const raw = sessionStorage.getItem("tenantCurrentProfile") || sessionStorage.getItem("currentUserProfile") || (emailKey ? localStorage.getItem("tenantProfile_" + emailKey) : null);
        if (raw) userProf = JSON.parse(raw);
      } catch (e) { }

      const completeness = profileService.checkProfileCompleteness(userProf);
      if (!completeness.isComplete) {
        localStorage.setItem("pendingQuickApplyPropertyId", property.id);
        triggerToast(`Profile Incomplete! You must complete all required profile fields (${completeness.missingFields.join(", ")}) in Settings before applying for a property.`, "error", "Profile Incomplete");
        localStorage.setItem("tenantActiveTab", "3");
        navigate("/dashboard/tenant");
        return;
      }

      if (!unitName && property.units && property.units.length > 1) {
        setShowUnitSelectorModal(true);
        return;
      }

      navigate(unitName ? `/apply/${property.id}?unit=${encodeURIComponent(unitName)}` : `/apply/${property.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-[#09090b] text-ink-900 dark:text-white font-sans selection:bg-moss-500 selection:text-white dark:selection:bg-[#E5C583] dark:selection:text-[#09090b] transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#07130D]/80 backdrop-blur-md border-b border-ink-100 dark:border-white/10 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-ink-100 hover:bg-ink-200 dark:bg-white/5 dark:hover:bg-white/10 border border-ink-200 dark:border-white/10 text-ink-900 dark:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="cursor-pointer" onClick={() => navigate('/explore')}>
            <Logo variant="moss" />
          </div>
        </div>

        <div className="flex flex-col gap-3 transition-all hover:shadow-md">
          {!isOwnerLandlord && (
            <button
              type="button"
              title="Save Property"
              onClick={() => {
                const landlordId = property.landlord_id || property.landlord?.id || property.landlordId;
                interactionTracker.trackEvent(property.id, landlordId, 'save');
                triggerToast("Property saved to your favorites!", "success");
              }}
              className="p-2.5 rounded-xl bg-ink-100 hover:bg-rose-100 text-ink-600 hover:text-rose-600 dark:bg-white/5 dark:hover:bg-rose-500/20 dark:text-cream-100/80 dark:hover:text-rose-400 transition-colors cursor-pointer border border-transparent shadow-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
            </button>
          )}
          {isOwnerLandlord && (
            <button
              type="button"
              title="Edit Property"
              onClick={() => setShowQuickEditModal(true)}
              className="p-2.5 rounded-xl bg-moss-600 hover:bg-moss-700 text-white dark:bg-[#E5C583] dark:text-[#09090b] dark:hover:bg-[#d4b371] transition-colors cursor-pointer border border-transparent shadow-xs"
            >
              <Edit3 className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Title & Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#07130D] p-6 rounded-2xl border border-ink-200 dark:border-white/10 shadow-lg">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${property.status === 'occupied' || property.status === 'active_occupied' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                <span className={`text-[11px] font-extrabold uppercase tracking-widest ${property.status === 'occupied' || property.status === 'active_occupied' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {property.status === 'occupied' || property.status === 'active_occupied' ? 'Occupied' : 'Active Listing'}
                </span>
              </div>
              {property.property_type && (
                <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full border bg-moss-100 text-moss-800 border-moss-300 dark:bg-white/10 dark:text-cream-100 dark:border-white/20">
                  {property.property_type.replace(/_/g, ' ')}
                </span>
              )}

              <span className="text-xs text-ink-500 dark:text-cream-100/60 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" />
                {property.location || `${property.address_line1 || ''}, ${property.city || ''}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 dark:text-white tracking-tight">{property.title}</h1>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-left md:text-right">
            <div>
              <span className="text-xs text-ink-500 dark:text-cream-100/60 uppercase tracking-wider block font-semibold mb-1">Rental Term</span>
              <span className="text-2xl sm:text-3xl font-black text-moss-700 dark:text-[#E5C583]">
                {property.price || `₦${Number(property.rent_amount || 0).toLocaleString()}/yr`}
              </span>
            </div>
            {property.status !== 'occupied' && property.status !== 'active_occupied' && (
              <Button
                onClick={() => handleApply()}
                disabled={currentUserRole === "tenant" && !meetsIncome}
                className={`font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md ${currentUserRole === "tenant" && !meetsIncome
                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 cursor-not-allowed'
                    : 'bg-moss-600 hover:bg-moss-700 text-white dark:bg-[#E5C583] dark:hover:bg-[#d4b371] dark:text-[#09090b]'
                  }`}
              >
                {currentUserRole === "tenant" && !meetsIncome ? "Blocked: Income Below Requirement" : "Apply Now"}
              </Button>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        <div className="space-y-3">
          <div
            onClick={() => {
              setLightboxIndex(activeImageIndex);
              setIsLightboxOpen(true);
            }}
            className="group relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden border border-ink-200 dark:border-white/10 bg-ink-100 dark:bg-[#07130D] shadow-xl cursor-zoom-in transition-all hover:shadow-2xl"
            title="Click to view full photo"
          >
            <img
              src={currentImage}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { e.target.onerror = null; e.target.src = '/src/assets/skyline_apartment.png'; }}
            />
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="bg-black/70 text-white backdrop-blur-md text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-xl border border-white/20">
                <Maximize2 className="h-4 w-4 text-[#E5C583]" /> View Full Image
              </span>
            </div>
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/10">
              {activeImageIndex + 1} / {allImages.length}
            </div>
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative h-20 w-28 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${activeImageIndex === idx ? 'border-moss-600 dark:border-[#E5C583] scale-95 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#14221B] p-5 rounded-3xl border border-[#E7E5E0] dark:border-white/10 flex flex-col gap-3 transition-all hover:shadow-md shadow-sm">
            <div className="p-3 rounded-2xl bg-[#FAF8F5] text-[#2C4633] dark:bg-[#E5C583]/10 dark:text-[#E5C583] w-fit text-moss-700 dark:bg-[#E5C583]/15 dark:text-[#E5C583]">
              {property.units && property.units.length > 1 ? <Building2 className="h-6 w-6" /> : <BedDouble className="h-6 w-6" />}
            </div>
            <div>
              <span className="text-[10px] text-[#71717A] tracking-widest mb-1 dark:text-cream-100/60 uppercase font-bold block">{property.units && property.units.length > 1 ? 'Total Units' : 'Bedrooms'}</span>
              <span className="text-base sm:text-lg font-black text-[#1C1917] dark:text-white">{property.units && property.units.length > 1 ? property.units.length + ' Units' : (property.bedrooms || 1) + ' Beds'}</span>
            </div>
          </div>

          {(!property.units || property.units.length <= 1) && (
            <div className="bg-white dark:bg-[#14221B] p-5 rounded-3xl border border-[#E7E5E0] dark:border-white/10 flex flex-col gap-3 transition-all hover:shadow-md shadow-sm">
              <div className="p-3 rounded-2xl bg-[#FAF8F5] text-[#2C4633] dark:bg-[#E5C583]/10 dark:text-[#E5C583] w-fit text-moss-700 dark:bg-[#E5C583]/15 dark:text-[#E5C583]">
                <Bath className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] text-[#71717A] tracking-widest mb-1 dark:text-cream-100/60 uppercase font-bold block">Bathrooms</span>
                <span className="text-base sm:text-lg font-black text-[#1C1917] dark:text-white">{property.bathrooms || 1} Baths</span>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-[#14221B] p-5 rounded-3xl border border-[#E7E5E0] dark:border-white/10 flex flex-col gap-3 transition-all hover:shadow-md shadow-sm">
            <div className="p-3 rounded-2xl bg-[#FAF8F5] text-[#2C4633] dark:bg-[#E5C583]/10 dark:text-[#E5C583] w-fit text-moss-700 dark:bg-[#E5C583]/15 dark:text-[#E5C583]">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-[#71717A] tracking-widest mb-1 dark:text-cream-100/60 uppercase font-bold block">Property Type</span>
              <span className="text-base sm:text-lg font-black text-[#1C1917] dark:text-white capitalize">{property.property_type || 'Apartment'}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#14221B] p-5 rounded-3xl border border-[#E7E5E0] dark:border-white/10 flex flex-col gap-3 transition-all hover:shadow-md shadow-sm">
            <div className="p-3 rounded-2xl bg-[#FAF8F5] text-[#2C4633] dark:bg-[#E5C583]/10 dark:text-[#E5C583] w-fit text-moss-700 dark:bg-[#E5C583]/15 dark:text-[#E5C583]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-[#71717A] tracking-widest mb-1 dark:text-cream-100/60 uppercase font-bold block">Serviced</span>
              <span className="text-base sm:text-lg font-black text-[#1C1917] dark:text-white">{property.is_serviced ? 'Yes (Full Service)' : 'Standard'}</span>
            </div>
          </div>
        </div>

        {/* LANDLORD REQUIREMENTS & AUTOMATED SYSTEM QUALIFICATION CARD */}
        <div className="bg-white dark:bg-[#07130D] p-6 rounded-2xl border border-ink-200 dark:border-white/10 shadow-lg space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-3">
            <h3 className="text-base sm:text-lg font-black text-[#1C1917] dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-moss-600 dark:text-[#E5C583]" /> Landlord Requirements & Qualification
            </h3>
            {currentUserRole === "tenant" && (
              meetsIncome ? (
                <span className="text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> You Meet Property Requirements
                </span>
              ) : (
                <span className="text-xs font-bold bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" /> Does Not Meet Requirements
                </span>
              )
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-cream-50/70 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-1">
              <span className="text-[11px] font-semibold text-ink-400 dark:text-cream-100/50 uppercase tracking-wider block">Minimum Required Income</span>
              <p className="font-bold text-sm text-ink-900 dark:text-white">{requirements?.income || 'Standard Tiers'}</p>
              {currentUserRole === "tenant" && (
                <div className="pt-2">
                  {meetsIncome ? (
                    <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Meets Requirement
                    </span>
                  ) : (
                    <span className="text-[10.5px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Does Not Meet Requirement
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-cream-50/70 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-1">
              <span className="text-[11px] font-semibold text-ink-400 dark:text-cream-100/50 uppercase tracking-wider block">Guarantor Policy</span>
              <p className="font-bold text-sm text-ink-900 dark:text-white">
                {requirements?.guarantor ? 'Mandatory Guarantor Required' : 'No Guarantor Required'}
              </p>
              {currentUserRole === "tenant" && (
                <div className="pt-2">
                  {meetsGuarantor ? (
                    <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Meets Requirement
                    </span>
                  ) : (
                    <span className="text-[10.5px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Guarantor Missing in Profile
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-cream-50/70 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-1">
              <span className="text-[11px] font-semibold text-ink-400 dark:text-cream-100/50 uppercase tracking-wider block">Employment Preference</span>
              <p className="font-bold text-sm text-ink-900 dark:text-white">{requirements?.employment || 'Any Employment'}</p>
              {currentUserRole === "tenant" && (
                <div className="pt-2">
                  {meetsEmployment ? (
                    <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Meets Requirement
                    </span>
                  ) : (
                    <span className="text-[10.5px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Does Not Meet Requirement
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* House Rules List */}
          {houseRulesList.length > 0 && (
            <div className="pt-3 border-t border-ink-100 dark:border-white/10">
              <span className="text-xs font-bold text-ink-900 dark:text-white block mb-2">Landlord House Rules Checklist</span>
              <div className="flex flex-wrap gap-2">
                {houseRulesList.map((rule, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-moss-50 dark:bg-white/5 text-moss-900 dark:text-cream-100 border border-moss-200 dark:border-white/10 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" />
                    {rule}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description Section */}
        <div className="bg-white dark:bg-[#07130D] p-6 rounded-2xl border border-ink-200 dark:border-white/10 shadow-lg space-y-3 text-left">
          <h3 className="text-base sm:text-lg font-black text-[#1C1917] dark:text-white flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-moss-600 dark:text-[#E5C583]" /> Property Description
          </h3>
          <p className="text-sm text-ink-700 dark:text-cream-100/80 leading-relaxed whitespace-pre-line">
            {property.description || 'No detailed description provided for this property listing.'}
          </p>
        </div>

        {/* Amenities Section */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="bg-white dark:bg-[#07130D] p-6 rounded-2xl border border-ink-200 dark:border-white/10 shadow-lg space-y-4 text-left">
            <h3 className="text-base sm:text-lg font-black text-[#1C1917] dark:text-white">Features & Amenities</h3>
            <div className="flex flex-wrap gap-2.5">
              {(Array.isArray(property.amenities) ? property.amenities.map(cleanString) : []).map((amenity, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-xl bg-cream-50 dark:bg-white/5 border border-ink-200 dark:border-white/10 text-xs font-semibold text-ink-800 dark:text-cream-100/90 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" />
                  {typeof amenity === 'string' ? amenity : amenity.name || amenity.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Available Units Section (For Bulk Generated Multi-Unit Properties) */}
        {property.units && property.units.length > 1 && (
          <div className="bg-white dark:bg-[#07130D] p-6 rounded-2xl border border-ink-200 dark:border-white/10 shadow-lg space-y-4 text-left">
            <h3 className="text-base sm:text-lg font-black text-[#1C1917] dark:text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-moss-600 dark:text-[#E5C583]" />
              Available Units in this Property
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {property.units.map((unit, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedUnitForModal(unit)}
                  className="p-4 rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 hover:border-moss-300 dark:hover:border-[#E5C583]/50 transition-colors flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex gap-4 mb-3">
                    {/* Unit Image Thumbnail */}
                    {unit.images && unit.images.length > 0 ? (
                      <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden border border-ink-200 dark:border-white/10">
                        <img src={typeof unit.images[0] === 'object' ? unit.images[0].url : unit.images[0]} alt={unit.unit_name} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden border border-ink-200 dark:border-white/10 bg-ink-100 dark:bg-white/5 flex items-center justify-center">
                        <Home className="h-6 w-6 text-ink-400 dark:text-cream-100/30" />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1.5">
                        <h4 className="font-bold text-ink-900 dark:text-white text-[15px]">{unit.unit_name}</h4>
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${unit.status?.toLowerCase() === 'vacant' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                          {unit.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold text-ink-600 dark:text-cream-100/70">
                        <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {unit.bedrooms || 1} Bed</span>
                        <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {unit.bathrooms || 1} Bath</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-ink-200 dark:border-white/10">
                    <span className="font-bold text-moss-800 dark:text-[#E5C583] text-sm">₦{Number(unit.rent_amount || 0).toLocaleString()} <span className="text-[10px] text-ink-500 dark:text-cream-100/50 font-normal">/{unit.rent_period || 'yr'}</span></span>
                    <span className="text-[11px] font-bold text-moss-600 dark:text-[#E5C583] group-hover:underline">View Details &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Landlord Profile & Verified Ratings / Reviews Section */}
        <div className="bg-white dark:bg-[#07130D] p-6 rounded-2xl border border-ink-200 dark:border-white/10 shadow-lg space-y-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-100 dark:border-white/10 pb-4">
            <div className="flex flex-col gap-3 transition-all hover:shadow-md">
              <div className="h-12 w-12 rounded-full bg-moss-100 dark:bg-[#E5C583]/15 text-moss-700 dark:text-[#E5C583] flex items-center justify-center font-bold text-lg border border-moss-200 dark:border-[#E5C583]/30">
                <User className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-[#1C1917] dark:text-white">
                    {landlordName}
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Verified Landlord
                  </span>
                </div>
                <p className="text-xs text-ink-500 dark:text-cream-100/60 font-medium">Property Manager & Host</p>
              </div>
            </div>

            {/* Rating Summary Badge */}
            <div className="flex flex-col gap-3 transition-all hover:shadow-md bg-cream-50 dark:bg-white/5 p-3 rounded-xl border border-ink-100 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-1.5 text-amber-500 font-extrabold text-xl">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span>{landlordRatingData.rating}</span>
              </div>
              <div className="text-left pl-2 border-l border-ink-200 dark:border-white/10">
                <span className="text-xs font-bold text-ink-900 dark:text-white block">
                  {landlordRatingData.count} {landlordRatingData.count === 1 ? 'Tenant Review' : 'Tenant Reviews'}
                </span>
                <span className="text-[10px] text-ink-500 dark:text-cream-100/50">Verified Tenancy Ratings</span>
              </div>
            </div>
          </div>

          {/* Tenant Reviews */}
          {landlordRatingData.hasReviews ? (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-cream-100/60">
                Tenant Reviews & Ratings ({landlordRatingData.count})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {landlordRatingData.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-cream-50/70 dark:bg-white/5 border border-ink-100 dark:border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink-900 dark:text-white">{rev.tenantName}</span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{rev.rating}.0</span>
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-xs text-ink-700 dark:text-cream-100/80 italic">
                        "{rev.comment}"
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-ink-400 dark:text-cream-100/40 pt-1">
                      <span>{rev.propertyTitle ? `Tenant at ${rev.propertyTitle}` : 'Verified Resident'}</span>
                      <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-cream-50/50 dark:bg-white/5 border border-dashed border-ink-200 dark:border-white/10 text-center">
              <p className="text-xs text-ink-500 dark:text-cream-100/60 font-medium">
                No tenant reviews submitted for this landlord yet. Ratings update automatically when verified tenants submit feedback.
              </p>
            </div>
          )}
        </div>

        {/* Location & Map Section with Open in Google Maps */}
        <PropertyDetailMap
          latitude={property.latitude}
          longitude={property.longitude}
          title={property.title}
          address={property.location || `${property.address_line1 || ''}, ${property.city || ''}`}
        />

      </main>

      {/* Full Screen Image Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none animate-in fade-in duration-200">
          {/* Lightbox Header */}
          <div className="p-4 sm:p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div className="text-white text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span className="font-bold text-[#E5C583] tracking-wide">{property.title}</span>
              <span className="opacity-40">•</span>
              <span className="opacity-80">Photo {lightboxIndex + 1} of {(lightboxImagesOverride || allImages).length}</span>
            </div>
            <button
              onClick={() => {
                setIsLightboxOpen(false);
                setLightboxImagesOverride(null);
              }}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/10 hover:scale-105"
              title="Close (Esc)"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Lightbox Main Image & Navigation Arrows */}
          <div className="relative flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
            {(lightboxImagesOverride || allImages).length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const list = lightboxImagesOverride || allImages;
                  setLightboxIndex((prev) => (prev > 0 ? prev - 1 : list.length - 1));
                }}
                className="absolute left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer shadow-2xl hover:scale-110"
                title="Previous Image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <img
              src={(lightboxImagesOverride || allImages)[lightboxIndex] || (lightboxImagesOverride || allImages)[0]}
              alt={`${property.title} full view`}
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl transition-all duration-300"
              onError={(e) => { e.target.onerror = null; e.target.src = '/src/assets/skyline_apartment.png'; }}
            />

            {(lightboxImagesOverride || allImages).length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const list = lightboxImagesOverride || allImages;
                  setLightboxIndex((prev) => (prev < list.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer shadow-2xl hover:scale-110"
                title="Next Image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Thumbnail Carousel */}
          {(lightboxImagesOverride || allImages).length > 1 && (
            <div className="p-4 bg-black/80 backdrop-blur-md border-t border-white/10 flex justify-center gap-2.5 overflow-x-auto">
              {(lightboxImagesOverride || allImages).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`relative h-14 w-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${lightboxIndex === idx ? 'border-[#E5C583] scale-105 opacity-100 shadow-md' : 'border-transparent opacity-40 hover:opacity-100'
                    }`}
                >
                  <img src={typeof img === 'object' ? img.url : img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Edit Modal */}
      {showQuickEditModal && (
        <QuickEditPropertyModal
          property={property}
          onClose={() => setShowQuickEditModal(false)}
          onSave={(updated) => {
            setProperty(updated);
            setShowQuickEditModal(false);
            triggerToast("Property quick-edited successfully", "success");
          }}
        />
      )}

      {/* Multi-Unit Selection Modal */}
      {showUnitSelectorModal && property.units && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowUnitSelectorModal(false)}>
          <div className="bg-white dark:bg-[#07130D] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-ink-200 dark:border-white/10 text-left space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-ink-100 dark:border-white/10">
              <h3 className="text-base sm:text-lg font-black text-[#1C1917] dark:text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-moss-600 dark:text-[#E5C583]" /> Select Unit to Apply
              </h3>
              <button onClick={() => setShowUnitSelectorModal(false)} className="p-1 rounded-lg text-ink-400 hover:text-ink-900 dark:text-cream-100/50 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-ink-600 dark:text-cream-100/70">
              This property contains multiple units. Please select the specific unit you wish to apply for:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {property.units.map((unit, idx) => {
                const isVacant = unit.status?.toLowerCase() === 'vacant';
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isVacant) {
                        setShowUnitSelectorModal(false);
                        navigate(`/apply/${property.id}?unit=${encodeURIComponent(unit.unit_name)}`);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${isVacant
                      ? 'border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 hover:border-moss-600 dark:hover:border-[#E5C583] cursor-pointer'
                      : 'border-ink-100 dark:border-white/5 bg-ink-50 dark:bg-white/5 opacity-50 cursor-not-allowed'
                      }`}
                  >
                    <div>
                      <h4 className="font-bold text-ink-900 dark:text-white text-sm">{unit.unit_name}</h4>
                      <p className="text-[10px] text-[#71717A] tracking-widest mb-1 dark:text-cream-100/60 font-medium">
                        {unit.bedrooms || 1} Bed • {unit.bathrooms || 1} Bath • ₦{Number(String(unit.rent_amount || '0').replace(/[^\d.]/g, '')).toLocaleString()} / {unit.rent_period || 'yr'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${isVacant ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-800 dark:text-rose-300'}`}>
                      {unit.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Unit Detail Modal */}
      {selectedUnitForModal && (
        <UnitDetailModal
          unit={selectedUnitForModal}
          property={property}
          currentUserRole={currentUserRole}
          onClose={() => setSelectedUnitForModal(null)}
          onApply={(unitName) => {
            setSelectedUnitForModal(null);
            handleApply(unitName);
          }}
          onOpenLightbox={(images, idx) => {
            setLightboxImagesOverride(images);
            setLightboxIndex(idx);
            setIsLightboxOpen(true);
          }}
        />
      )}
    </div>
  );
}

function UnitDetailModal({ unit, property, currentUserRole, onClose, onApply, onOpenLightbox }) {
  const unitImages = Array.isArray(unit.images) && unit.images.length > 0
    ? unit.images.map(img => (typeof img === 'object' ? img.url : img))
    : [];
  const mainUnitImage = unitImages[0] || '/src/assets/skyline_apartment.png';
  const cleanString = (str) => typeof str === 'string' ? str.replace(/^[{"]+|[}"]+$/g, '').trim() : str; const unitFeatures = Array.isArray(unit.features)
    ? unit.features.map(cleanString)
    : (Array.isArray(unit.amenities)
      ? unit.amenities.map(cleanString)
      : (typeof unit.features === 'string' && unit.features ? unit.features.map(cleanString).split(',').map(cleanString) : []));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#07130D] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-ink-200 dark:border-white/10 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header / Main Photo with Lightbox Expand */}
        <div
          onClick={() => {
            if (unitImages.length > 0) {
              onOpenLightbox(unitImages, 0);
            }
          }}
          className="relative h-60 bg-ink-100 dark:bg-white/5 cursor-zoom-in group shrink-0"
          title="Click to expand full photo"
        >
          <img
            src={mainUnitImage}
            alt={unit.unit_name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { e.target.onerror = null; e.target.src = '/src/assets/skyline_apartment.png'; }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="bg-black/70 text-white backdrop-blur-md text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20">
              <Maximize2 className="h-3.5 w-3.5 text-[#E5C583]" /> Expand Photos ({unitImages.length || 1})
            </span>
          </div>

          <div className="absolute bottom-3 left-3 flex gap-2">
            <span className={`text-xs uppercase font-bold px-3 py-1.5 rounded-full shadow-sm ${unit.status?.toLowerCase() === 'vacant' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {unit.status}
            </span>
          </div>
        </div>

        {/* Unit Thumbnails Carousel (If >1 photos) */}
        {unitImages.length > 1 && (
          <div className="p-3 bg-cream-50/80 dark:bg-white/5 border-b border-ink-100 dark:border-white/10 flex gap-2 overflow-x-auto shrink-0">
            {unitImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => onOpenLightbox(unitImages, idx)}
                className="relative h-14 w-20 rounded-lg overflow-hidden border border-ink-200 dark:border-white/20 shrink-0 hover:opacity-100 opacity-75 transition-opacity cursor-pointer"
                title="Click to view full photo"
              >
                <img src={img} alt={`Unit photo ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-black text-ink-900 dark:text-white">{unit.unit_name}</h3>
              <p className="text-xs font-semibold text-ink-500 dark:text-cream-100/60 mt-0.5">{property.title}</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-moss-700 dark:text-[#E5C583]">₦{Number(unit.rent_amount || 0).toLocaleString()}</span>
              <span className="block text-[11px] font-bold text-ink-500 dark:text-cream-100/50 uppercase">/{unit.rent_period || 'yr'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-3 transition-all hover:shadow-md p-3.5 rounded-xl bg-cream-50 dark:bg-white/5 border border-ink-100 dark:border-white/5">
              <div className="p-2 bg-white dark:bg-[#07130D] rounded-lg shadow-sm border border-ink-100 dark:border-white/5">
                <BedDouble className="h-5 w-5 text-moss-600 dark:text-[#E5C583]" />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-ink-500 dark:text-cream-100/50">Bedrooms</span>
                <span className="text-sm font-black text-ink-900 dark:text-white">{unit.bedrooms || 1} Beds</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 transition-all hover:shadow-md p-3.5 rounded-xl bg-cream-50 dark:bg-white/5 border border-ink-100 dark:border-white/5">
              <div className="p-2 bg-white dark:bg-[#07130D] rounded-lg shadow-sm border border-ink-100 dark:border-white/5">
                <Bath className="h-5 w-5 text-moss-600 dark:text-[#E5C583]" />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-ink-500 dark:text-cream-100/50">Bathrooms</span>
                <span className="text-sm font-black text-ink-900 dark:text-white">{unit.bathrooms || 1} Baths</span>
              </div>
            </div>
          </div>

          {/* Unit Features & Amenities */}
          {unitFeatures.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-cream-100 mb-2">Unit Features & Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {unitFeatures.map((feat, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-moss-50 dark:bg-white/5 text-moss-900 dark:text-cream-100 border border-moss-200 dark:border-white/10 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" />
                    {typeof feat === 'string' ? feat : feat.name || feat.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {unit.description && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-cream-100/50 mb-1.5">Unit Description</h4>
              <p className="text-xs text-ink-700 dark:text-cream-100/80 leading-relaxed bg-ink-50 dark:bg-white/5 p-3.5 rounded-xl border border-ink-100 dark:border-transparent whitespace-pre-line">
                {unit.description}
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-ink-200 dark:border-white/10 flex justify-end gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full sm:w-auto font-bold px-6 py-3 rounded-xl"
            >
              Close
            </Button>

            {unit.status?.toLowerCase() === 'vacant' && (!currentUserRole || currentUserRole === 'tenant') && (
              <Button
                onClick={() => onApply(unit.unit_name)}
                className="w-full sm:w-auto font-bold px-6 py-3 rounded-xl bg-moss-600 hover:bg-moss-700 text-white dark:bg-[#E5C583] dark:hover:bg-[#d4b371] dark:text-[#09090b] transition-all shadow-md hover:shadow-lg"
              >
                Apply for this Unit
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListingDetailView() {
  return <PropertyDetailView />;
}
