import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyService } from '../services/propertyService';
import { profileService } from '../services/profileService';
import { triggerToast } from '../context/ToastContext';
import Button from './Button';
import { Logo } from './Logo';
import {
  ArrowLeft, MapPin, BedDouble, Bath, CheckCircle2, XCircle, ShieldCheck,
  Building2, Trash2, Edit3, Loader2, ListChecks, Home, DollarSign, AlertTriangle, Shield,
  Maximize2, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import PropertyDetailMap from './PropertyDetailMap';
import QuickEditPropertyModal from './QuickEditPropertyModal';
import { INCOME_RANGES, doesIncomeMeetRequirement } from '../utils/incomeRanges';

export function PropertyDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    async function loadProperty() {
      setLoading(true);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1715] text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="h-10 w-10 text-[#E5C583] animate-spin mb-3" />
        <p className="text-sm font-semibold text-cream-100/70">Loading Property Details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#0F1715] text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
        <p className="text-sm text-cream-100/60 mb-6">The property listing you requested could not be located.</p>
        <Button onClick={() => navigate(-1)} className="bg-[#E5C583] text-[#0B1512] font-bold px-6 py-2.5 rounded-xl">
          Go Back
        </Button>
      </div>
    );
  }

  const allImages = property.images && property.images.length > 0 
    ? property.images 
    : (property.cover_image ? [property.cover_image] : ['/src/assets/skyline_apartment.png']);

  const currentImage = allImages[activeImageIndex] || allImages[0];

  const currentUserId = sessionStorage.getItem("db_user_id") || sessionStorage.getItem("userId");
  const currentUserRole = (sessionStorage.getItem("userRole") || "").toLowerCase();

  const isOwnerLandlord = currentUserRole === "landlord" && (
    String(property.landlord_id) === String(currentUserId) ||
    String(property.landlord?.id) === String(currentUserId) ||
    String(property.landlordId) === String(currentUserId) ||
    (!property.landlord_id && !property.landlord?.id)
  );

  // AUTOMATED QUALIFICATION SYSTEM FILTERING
  const userEmail = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
  const rawTenantProf = sessionStorage.getItem("tenantCurrentProfile") || sessionStorage.getItem("currentUserProfile") || (userEmail ? localStorage.getItem("tenantProfile_" + userEmail) : null);
  const tenantProf = rawTenantProf ? JSON.parse(rawTenantProf) : {};

  const requiredIncome = property.minimum_income_required || property.minimumIncome || "No Minimum Income";
  const tenantIncome = tenantProf.income || tenantProf.incomeRange || tenantProf.annualIncome || tenantProf.monthlyIncome || tenantProf.monthly_income || "";
  const meetsIncome = doesIncomeMeetRequirement(tenantIncome, requiredIncome);

  const reqGuarantor = property.requires_guarantor ?? property.requiresGuarantor ?? true;
  const hasGuarantor = Boolean(tenantProf.guarantorName || tenantProf.guarantor_name);
  const meetsGuarantor = !reqGuarantor || hasGuarantor;

  const employmentReq = property.employment_requirement || property.employmentRequirement || "Any Employment";
  const tenantEmp = tenantProf.employmentStatus || tenantProf.employment_status || "";
  const meetsEmployment = employmentReq === "Any Employment" || tenantEmp.includes("Employed");

  // Parse House Rules
  const houseRulesList = Array.isArray(property.house_rules) 
    ? property.house_rules 
    : (typeof property.rules === 'string' && property.rules ? property.rules.split(',').map(r => r.trim()) : []);

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-[#0B1512] text-ink-900 dark:text-white font-sans selection:bg-moss-500 selection:text-white dark:selection:bg-[#E5C583] dark:selection:text-[#0B1512] transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#12221C]/80 backdrop-blur-md border-b border-ink-100 dark:border-white/10 px-6 py-4 flex items-center justify-between shadow-xs">
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

        <div className="flex items-center gap-3">
          {isOwnerLandlord && (
            <button 
              type="button"
              title="Edit Property"
              onClick={() => setShowQuickEditModal(true)}
              className="p-2.5 rounded-xl bg-moss-600 hover:bg-moss-700 text-white dark:bg-[#E5C583] dark:text-[#0B1512] dark:hover:bg-[#d4b371] transition-colors cursor-pointer border border-transparent shadow-xs"
            >
              <Edit3 className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Title & Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#12221C] p-6 rounded-2xl border border-ink-200 dark:border-white/10 shadow-lg">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-full border ${
                property.status === 'occupied' || property.status === 'active_occupied'
                  ? 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
              }`}>
                {property.status === 'occupied' || property.status === 'active_occupied' ? 'Occupied' : 'Active Listing'}
              </span>
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
                onClick={() => {
                  const auth = sessionStorage.getItem("isAuthenticated") === "true";
                  const role = (sessionStorage.getItem("userRole") || "").toLowerCase();
                  if (!auth) {
                    triggerToast("Please log in as a tenant to apply for this property.", "info", "Login Required");
                    navigate("/login", { state: { fromProtected: true } });
                  } else if (role !== "tenant") {
                    triggerToast("Only registered tenant accounts can submit rental applications.", "warning", "Tenant Role Required");
                  } else if (!meetsIncome) {
                    triggerToast(`Your annual income tier (${tenantIncome || 'Not Provided'}) does not meet the landlord's requirement (${requiredIncome}). You cannot apply.`, "error", "Qualification Blocked");
                  } else {
                    const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || "").toLowerCase();
                    let userProf = null;
                    try {
                      const raw = sessionStorage.getItem("tenantCurrentProfile") || sessionStorage.getItem("currentUserProfile") || (emailKey ? localStorage.getItem("tenantProfile_" + emailKey) : null);
                      if (raw) userProf = JSON.parse(raw);
                    } catch (e) { }

                    const completeness = profileService.checkProfileCompleteness(userProf);
                    if (!completeness.isComplete) {
                      triggerToast(`Profile Incomplete! You must complete all required profile fields (${completeness.missingFields.join(", ")}) in Settings before applying for a property.`, "error", "Profile Incomplete");
                      localStorage.setItem("tenantActiveTab", "3");
                      navigate("/dashboard/tenant");
                      return;
                    }
                    navigate(`/apply/${property.id}`);
                  }
                }}
                disabled={currentUserRole === "tenant" && !meetsIncome}
                className={`font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md ${
                  currentUserRole === "tenant" && !meetsIncome
                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 cursor-not-allowed'
                    : 'bg-moss-600 hover:bg-moss-700 text-white dark:bg-[#E5C583] dark:hover:bg-[#d4b371] dark:text-[#0B1512]'
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
            className="group relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden border border-ink-200 dark:border-white/10 bg-ink-100 dark:bg-[#162721] shadow-xl cursor-zoom-in transition-all hover:shadow-2xl"
            title="Click to view full photo"
          >
            <img 
              src={currentImage} 
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { e.target.src = '/src/assets/skyline_apartment.png'; }}
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
                  className={`relative h-20 w-28 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    activeImageIndex === idx ? 'border-moss-600 dark:border-[#E5C583] scale-95 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#12221C] p-4 rounded-2xl border border-ink-200 dark:border-white/10 flex items-center gap-3 shadow-sm">
            <div className="p-3 rounded-xl bg-moss-100 text-moss-700 dark:bg-[#E5C583]/15 dark:text-[#E5C583]">
              <BedDouble className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] text-ink-500 dark:text-cream-100/60 uppercase font-bold block">Bedrooms</span>
              <span className="text-lg font-bold text-ink-900 dark:text-white">{property.bedrooms || 1} Beds</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#12221C] p-4 rounded-2xl border border-ink-200 dark:border-white/10 flex items-center gap-3 shadow-sm">
            <div className="p-3 rounded-xl bg-moss-100 text-moss-700 dark:bg-[#E5C583]/15 dark:text-[#E5C583]">
              <Bath className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] text-ink-500 dark:text-cream-100/60 uppercase font-bold block">Bathrooms</span>
              <span className="text-lg font-bold text-ink-900 dark:text-white">{property.bathrooms || 1} Baths</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#12221C] p-4 rounded-2xl border border-ink-200 dark:border-white/10 flex items-center gap-3 shadow-sm">
            <div className="p-3 rounded-xl bg-moss-100 text-moss-700 dark:bg-[#E5C583]/15 dark:text-[#E5C583]">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] text-ink-500 dark:text-cream-100/60 uppercase font-bold block">Property Type</span>
              <span className="text-lg font-bold text-ink-900 dark:text-white capitalize">{property.property_type || 'Apartment'}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#12221C] p-4 rounded-2xl border border-ink-200 dark:border-white/10 flex items-center gap-3 shadow-sm">
            <div className="p-3 rounded-xl bg-moss-100 text-moss-700 dark:bg-[#E5C583]/15 dark:text-[#E5C583]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] text-ink-500 dark:text-cream-100/60 uppercase font-bold block">Serviced</span>
              <span className="text-lg font-bold text-ink-900 dark:text-white">{property.is_serviced ? 'Yes (Full Service)' : 'Standard'}</span>
            </div>
          </div>
        </div>

        {/* LANDLORD REQUIREMENTS & AUTOMATED SYSTEM QUALIFICATION CARD */}
        <div className="bg-white dark:bg-[#12221C] p-6 rounded-2xl border border-ink-200 dark:border-white/10 shadow-lg space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-3">
            <h3 className="text-lg font-bold text-ink-900 dark:text-white flex items-center gap-2">
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
              <p className="font-bold text-sm text-ink-900 dark:text-white">{requiredIncome}</p>
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
              <p className="font-bold text-sm text-ink-900 dark:text-white">{reqGuarantor ? 'Mandatory Guarantor Required' : 'Optional'}</p>
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
              <p className="font-bold text-sm text-ink-900 dark:text-white">{employmentReq}</p>
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
                  <span key={idx} className="px-3 py-1 rounded-lg bg-moss-50 dark:bg-moss-950/40 text-moss-900 dark:text-cream-100 border border-moss-200 dark:border-moss-800 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" />
                    {rule}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description Section */}
        <div className="bg-white dark:bg-[#12221C] p-6 rounded-2xl border border-ink-200 dark:border-white/10 shadow-lg space-y-3 text-left">
          <h3 className="text-lg font-bold text-ink-900 dark:text-white flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-moss-600 dark:text-[#E5C583]" /> Property Description
          </h3>
          <p className="text-sm text-ink-700 dark:text-cream-100/80 leading-relaxed whitespace-pre-line">
            {property.description || 'No detailed description provided for this property listing.'}
          </p>
        </div>

        {/* Amenities Section */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="bg-white dark:bg-[#12221C] p-6 rounded-2xl border border-ink-200 dark:border-white/10 shadow-lg space-y-4 text-left">
            <h3 className="text-lg font-bold text-ink-900 dark:text-white">Features & Amenities</h3>
            <div className="flex flex-wrap gap-2.5">
              {(Array.isArray(property.amenities) ? property.amenities : []).map((amenity, idx) => (
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
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none animate-in fade-in duration-200">
          {/* Lightbox Header */}
          <div className="p-4 sm:p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div className="text-white text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span className="font-bold text-[#E5C583] tracking-wide">{property.title}</span>
              <span className="opacity-40">•</span>
              <span className="opacity-80">Photo {lightboxIndex + 1} of {allImages.length}</span>
            </div>
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/10 hover:scale-105"
              title="Close (Esc)"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Lightbox Main Image & Navigation Arrows */}
          <div className="relative flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
            {allImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
                }}
                className="absolute left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer shadow-2xl hover:scale-110"
                title="Previous Image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <img 
              src={allImages[lightboxIndex] || allImages[0]} 
              alt={`${property.title} full view`}
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl transition-all duration-300"
              onError={(e) => { e.target.src = '/src/assets/skyline_apartment.png'; }}
            />

            {allImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer shadow-2xl hover:scale-110"
                title="Next Image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Thumbnail Carousel */}
          {allImages.length > 1 && (
            <div className="p-4 bg-black/80 backdrop-blur-md border-t border-white/10 flex justify-center gap-2.5 overflow-x-auto">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`relative h-14 w-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    lightboxIndex === idx ? 'border-[#E5C583] scale-105 opacity-100 shadow-md' : 'border-transparent opacity-40 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Edit Property Modal */}
      {showQuickEditModal && (
        <QuickEditPropertyModal
          property={property}
          isOpen={showQuickEditModal}
          onClose={() => setShowQuickEditModal(false)}
          onSaved={(updated) => setProperty(updated)}
        />
      )}
    </div>
  );
}

export function ListingDetailView() {
  return <PropertyDetailView />;
}
