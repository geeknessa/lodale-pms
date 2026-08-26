import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyService } from '../services/propertyService';
import { triggerToast } from '../context/ToastContext';
import Button from './Button';
import { Logo } from './Logo';
import {
  ArrowLeft, MapPin, BedDouble, Bath, CheckCircle2, ShieldCheck,
  Building2, Trash2, Edit3, Loader2, ListChecks, Home, DollarSign
} from 'lucide-react';
import PropertyDetailMap from './PropertyDetailMap';
import QuickEditPropertyModal from './QuickEditPropertyModal';

export function PropertyDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      setLoading(true);
      try {
        const data = await propertyService.getPropertyById(id);
        if (data) {
          setProperty(data);
        } else {
          // Check local storage fallback
          const localProps = JSON.parse(localStorage.getItem('landlordProperties') || '[]');
          const found = localProps.find(p => String(p.id) === String(id));
          if (found) setProperty(found);
        }
      } catch (err) {
        console.error("Failed to load property details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProperty();
  }, [id]);

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
            <Button 
              onClick={() => setShowQuickEditModal(true)}
              className="text-xs px-4 py-2 bg-moss-600 hover:bg-moss-700 text-white dark:bg-[#E5C583] dark:text-[#0B1512] dark:hover:bg-[#d4b371] font-bold flex items-center gap-1.5 shadow-sm rounded-xl"
            >
              <Edit3 className="h-4 w-4" /> Edit Property
            </Button>
          )}
          <Button 
            variant="secondary"
            onClick={() => navigate(-1)}
            className="text-xs px-4 py-2 bg-ink-100 text-ink-800 hover:bg-ink-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 border border-ink-200 dark:border-white/10 rounded-xl font-bold"
          >
            Back to Dashboard
          </Button>
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
                  } else {
                    navigate(`/apply/${property.id}`);
                  }
                }}
                className="bg-moss-600 hover:bg-moss-700 text-white dark:bg-[#E5C583] dark:hover:bg-[#d4b371] dark:text-[#0B1512] font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg"
              >
                Apply Now
              </Button>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden border border-ink-200 dark:border-white/10 bg-ink-100 dark:bg-[#162721] shadow-xl">
            <img 
              src={currentImage} 
              alt={property.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = '/src/assets/skyline_apartment.png'; }}
            />
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative h-20 w-28 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
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
          address={property.address_line1 || property.address}
          city={property.city}
          state={property.state}
        />

      </main>

      {/* In-Page Quick Edit Property Modal */}
      <QuickEditPropertyModal
        isOpen={showQuickEditModal}
        onClose={() => setShowQuickEditModal(false)}
        property={property}
        onSaveSuccess={(updated) => {
          setProperty(prev => ({ ...prev, ...updated }));
        }}
      />
    </div>
  );
}

export function ListingDetailView() {
  return <PropertyDetailView />;
}
