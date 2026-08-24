import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyService } from '../services/propertyService';
import { triggerToast } from '../context/ToastContext';
import {
  ArrowLeft, Eye, MapPin, BedDouble, Bath, CheckCircle2, ShieldCheck, PenSquare,
  X, Check, Trash2, PowerOff, Loader2, Image as ImageIcon, AlertCircle, Plus,
  FileText
} from 'lucide-react';
import Button from '../components/Button';

// Reusable Section Component
const SectionCard = ({ title, icon: Icon, isEditing, onEdit, onSave, onCancel, children, disabled }) => {
  return (
    <div className="bg-white dark:bg-[#16241F] rounded-2xl border border-ink-200/50 dark:border-white/10 overflow-hidden shadow-sm transition-all duration-300 mb-6">
      <div className="flex items-center justify-between p-5 border-b border-ink-200/50 dark:border-white/10">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="h-10 w-10 rounded-xl bg-moss-50 dark:bg-white/5 flex items-center justify-center text-moss-600 dark:text-[#E5C583]">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <h3 className="text-lg font-bold text-ink-900 dark:text-white">{title}</h3>
        </div>
        {!disabled && (
          !isEditing ? (
            <button onClick={onEdit} className="p-2 text-ink-500 hover:text-moss-600 dark:text-cream-100/60 dark:hover:text-[#E5C583] hover:bg-moss-50 dark:hover:bg-white/5 rounded-lg transition-colors outline-none">
              <PenSquare className="h-5 w-5" />
            </button>
          ) : (
            <span className="text-[10px] uppercase font-bold tracking-wider text-moss-600 dark:text-[#E5C583] bg-moss-50 dark:bg-[#E5C583]/10 px-2 py-1 rounded">Editing</span>
          )
        )}
      </div>
      <div className="p-5">
        {children}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-ink-200/50 dark:border-white/10">
            <button onClick={onCancel} className="px-4 py-2 text-xs font-bold text-ink-600 dark:text-cream-100/70 hover:bg-ink-100 dark:hover:bg-white/10 rounded-xl transition-all outline-none">Cancel</button>
            <button onClick={onSave} className="px-5 py-2 text-xs font-bold bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#263b33] rounded-xl hover:opacity-90 transition-all outline-none flex items-center gap-1.5">
              <Check className="h-4 w-4" /> Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit States
  const [activeSection, setActiveSection] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newAmenity, setNewAmenity] = useState('');

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      const data = await propertyService.getPropertyById(id);
      setProperty(data);
      if (data) syncEditForm(data);
    } catch (error) {
      triggerToast('Failed to load property details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const syncEditForm = (item) => {
    setEditForm({
      title: item.title || '',
      description: item.description || '',
      property_type: item.property_type || 'single_house',
      beds: item.bedrooms || item.beds || '',
      baths: item.bathrooms || item.baths || '',
      rent_amount: item.rent_amount || '',
      rent_period: item.rent_period || item.rent_cycle || 'annually',
      address_line1: item.address_line1 || '',
      city: item.city || '',
      state: item.state || '',
      amenities: Array.isArray(item.amenities) ? [...item.amenities] : [],
      rules: item.rules || '',
      images: Array.isArray(item.images) && item.images.length > 0
        ? [...item.images]
        : [item.cover_image || '/src/assets/modern_villa.png'],
      ownership_doc_type: item.ownership_doc_type || "Deed of Assignment"
    });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index) => {
    setEditForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSaveSection = async () => {
    try {
      const payload = {
        ...property,
        ...editForm,
        bedrooms: editForm.beds,
        bathrooms: editForm.baths
      };

      // Prevent stale formatted price from overriding rent_amount on the backend
      delete payload.price;

      const updated = await propertyService.updateProperty(id, payload);
      setProperty(updated);
      setActiveSection(null);

      // Sync saved properties in localStorage if tenant has bookmarked this property
      try {
        const savedStr = localStorage.getItem("savedProperties");
        if (savedStr) {
          const currentSaved = JSON.parse(savedStr);
          const idx = currentSaved.findIndex(p => String(p.id) === String(id));
          if (idx !== -1) {
            currentSaved[idx] = {
              ...currentSaved[idx],
              ...updated,
              price: `₦${Number(updated.rent_amount || updated.price || 0).toLocaleString()}${String(updated.rent_period || '').toLowerCase().includes('month') ? '/mo' : '/yr'}`,
              location: `${updated.address_line1 || updated.address || ''}, ${updated.city || ''}`
            };
            localStorage.setItem("savedProperties", JSON.stringify(currentSaved));
            window.dispatchEvent(new Event("propertySavedChanged"));
          }
        }
      } catch (e) {
        console.warn("Could not sync savedProperties in PropertyDetail:", e);
      }

      triggerToast('Changes saved successfully.', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save changes.', 'error');
    }
  };

  const handleAddAmenity = () => {
    if (newAmenity.trim()) {
      setEditForm(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const handleRemoveAmenity = (amenityToRemove) => {
    setEditForm(prev => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== amenityToRemove)
    }));
  };

  // Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [isSubmittingSuspend, setIsSubmittingSuspend] = useState(false);

  const handleRequestSuspension = async () => {
    if (!suspendReason.trim()) {
      return triggerToast('Please provide a reason for suspension.', 'error');
    }
    setIsSubmittingSuspend(true);
    try {
      const updated = await propertyService.requestPropertySuspension(id, suspendReason);
      setProperty(updated);
      setShowSuspendModal(false);
      triggerToast('Suspension request submitted to admins.', 'success');
    } catch (err) {
      triggerToast(err.message || 'Request failed.', 'error');
    } finally {
      setIsSubmittingSuspend(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!deleteReason.trim()) {
      return triggerToast('Please provide a reason.', 'error');
    }
    setIsSubmittingDelete(true);
    try {
      const updated = await propertyService.requestPropertyDeletion(id, deleteReason);
      setProperty(updated);
      setShowDeleteModal(false);
      triggerToast('Deletion request submitted to admins.', 'success');
    } catch (err) {
      triggerToast('Request failed.', 'error');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-[#12221C] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-moss-600 dark:text-[#E5C583]" />
      </div>
    );
  }

  if (!property) return null;

  const isOccupied = property.is_occupied;
  const propertyImages = Array.isArray(property.images) && property.images.length > 0 ? property.images : [property.cover_image || '/src/assets/modern_villa.png'];

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-[#0A1612] font-sans pb-24">
      {/* Dashboard Custom Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#0A1612]/80 backdrop-blur-md border-b border-ink-200/50 dark:border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard/landlord')} className="p-2 bg-cream-50 dark:bg-white/5 rounded-xl hover:bg-ink-100 dark:hover:bg-white/10 transition-colors">
              <ArrowLeft className="h-5 w-5 text-ink-900 dark:text-white" />
            </button>
            <span className="font-bold text-ink-900 dark:text-white text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Lodale Management</span>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative h-[40vh] w-full bg-ink-900 overflow-hidden">
        <img src={propertyImages[0]} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1612] via-transparent to-transparent"></div>
        <div className="absolute inset-0 p-8 flex flex-col justify-end">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex gap-2 mb-3">
              <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg ${property.status === 'active' || property.status === 'live' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                {property.status.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg ${isOccupied ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                {isOccupied ? 'Occupied' : 'Vacant'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 mt-8 relative z-10">
        {isOccupied && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 mb-6 flex items-start gap-3 shadow-sm">
            <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-300">Editing Locked - Property Occupied</h3>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">This property currently has an active tenant. Edits, suspension, and deletion actions are disabled until the lease duration ends to protect tenant records. Please contact support if you need an emergency override.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column */}
          <div className="flex-1 space-y-6">

            {/* Title & Description */}
            <SectionCard title="Description" isEditing={activeSection === 'desc'} onEdit={() => { syncEditForm(property); setActiveSection('desc'); }} onSave={handleSaveSection} onCancel={() => setActiveSection(null)} disabled={isOccupied}>
              {activeSection === 'desc' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Property Title</label>
                    <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="w-full border border-ink-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-transparent dark:text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Full Description</label>
                    <textarea rows={6} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full border border-ink-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-transparent dark:text-white outline-none resize-none" />
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-ink-900 dark:text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>{property.title}</h1>
                  <p className="text-sm text-ink-700 dark:text-cream-100/80 leading-relaxed whitespace-pre-wrap">{property.description || 'No description provided.'}</p>
                </div>
              )}
            </SectionCard>

            {/* Amenities Grid */}
            <SectionCard title="Amenities" icon={CheckCircle2} isEditing={activeSection === 'amenities'} onEdit={() => { syncEditForm(property); setActiveSection('amenities'); }} onSave={handleSaveSection} onCancel={() => setActiveSection(null)} disabled={isOccupied}>
              {activeSection === 'amenities' ? (
                <div className="space-y-6">
                  {/* Categorized Checkboxes */}
                  {[
                    {
                      title: "Power & Utilities",
                      items: ["Prepaid Meter", "24/7 Power Supply", "Solar Inverter", "Water Treatment", "Borehole Water"]
                    },
                    {
                      title: "Security & Access",
                      items: ["24/7 Security Guards", "Gated Estate", "CCTV Surveillance", "Access Control Gate", "Fenced Compound"]
                    },
                    {
                      title: "Comfort & Amenities",
                      items: ["POP Ceiling", "Air Conditioning", "Balcony", "Fully Furnished", "Swimming Pool", "Fitness Gym", "Elevator"]
                    }
                  ].map((cat, idx) => (
                    <div key={idx} className="bg-cream-100/50 dark:bg-[#16241F] rounded-xl p-4 border border-ink-200 dark:border-white/10">
                      <div className="text-xs font-bold text-[#2C4633] dark:text-[#E5C583] uppercase mb-3 flex items-center gap-2">
                        <span>{cat.title}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cat.items.map((amenity) => {
                          const isSelected = editForm.amenities.includes(amenity);
                          return (
                            <button
                              key={amenity}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setEditForm(prev => ({
                                  ...prev,
                                  amenities: isSelected
                                    ? prev.amenities.filter(a => a !== amenity)
                                    : [...prev.amenities, amenity]
                                }));
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${isSelected
                                ? "bg-moss-500 border-moss-500 text-white dark:bg-[#E5C583] dark:border-[#E5C583] dark:text-moss-900"
                                : "bg-white dark:bg-white/5 border-ink-200 dark:border-white/10 text-ink-600 dark:text-cream-100 hover:border-moss-300"
                                }`}
                            >
                              <div className={`flex h-4 w-4 items-center justify-center rounded-md border ${isSelected ? "border-white dark:border-moss-900 bg-transparent" : "border-ink-300 dark:border-white/20 bg-transparent"}`}>
                                {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                              {amenity}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Custom Amenities */}
                  <div className="pt-3 border-t border-ink-200 dark:border-white/10">
                    <div className="text-[11px] font-bold text-[#2C4633] dark:text-[#E5C583] uppercase mb-2 flex items-center justify-between">
                      <span>Custom Amenities</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {editForm.amenities.filter(a => ![
                        "Prepaid Meter", "24/7 Power Supply", "Solar Inverter", "Water Treatment", "Borehole Water",
                        "24/7 Security Guards", "Gated Estate", "CCTV Surveillance", "Access Control Gate", "Fenced Compound",
                        "POP Ceiling", "Air Conditioning", "Balcony", "Fully Furnished", "Swimming Pool", "Fitness Gym", "Elevator"
                      ].includes(a)).map((a, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-moss-50 dark:bg-white/5 border border-moss-200 dark:border-white/10 rounded-xl">
                          <span className="text-xs font-bold text-moss-800 dark:text-white">{a}</span>
                          <button onClick={(e) => { e.preventDefault(); handleRemoveAmenity(a); }} className="text-moss-500 hover:text-rose-500 transition-colors"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input placeholder="Add custom amenity (e.g. Fiber Internet)"
                        value={newAmenity}
                        onChange={(e) => setNewAmenity(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                      />
                      <Button onClick={(e) => { e.preventDefault(); handleAddAmenity(); }} variant="outline" className="shrink-0">Add</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2">
                  {property.amenities && property.amenities.length > 0 ? property.amenities.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-ink-700 dark:text-cream-100/80">
                      <CheckCircle2 className="h-4 w-4 text-moss-500 dark:text-[#E5C583]" />
                      <span className="text-sm">{a}</span>
                    </div>
                  )) : <p className="text-sm text-ink-500 col-span-3">No amenities listed.</p>}
                </div>
              )}
            </SectionCard>

            {/* Location */}
            <SectionCard title="Location" icon={MapPin} isEditing={activeSection === 'location'} onEdit={() => { syncEditForm(property); setActiveSection('location'); }} onSave={handleSaveSection} onCancel={() => setActiveSection(null)} disabled={isOccupied}>
              {activeSection === 'location' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Street Address</label>
                    <input type="text" value={editForm.address_line1} onChange={e => setEditForm({ ...editForm, address_line1: e.target.value })} className="w-full border border-ink-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-transparent dark:text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">City</label>
                    <input type="text" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} className="w-full border border-ink-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-transparent dark:text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">State</label>
                    <input type="text" value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value })} className="w-full border border-ink-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-transparent dark:text-white outline-none" />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-moss-600 dark:text-[#E5C583] mt-0.5" />
                  <div>
                    <p className="text-base font-bold text-ink-900 dark:text-white">{property.address_line1}</p>
                    <p className="text-sm text-ink-500 dark:text-cream-100/60 mt-1">{property.city}, {property.state}</p>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Photos & Media */}
            <SectionCard title="Photos" icon={ImageIcon} isEditing={activeSection === 'photos'} onEdit={() => { syncEditForm(property); setActiveSection('photos'); }} onSave={handleSaveSection} onCancel={() => setActiveSection(null)} disabled={isOccupied}>
              {activeSection === 'photos' ? (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {editForm.images.map((img, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden">
                        <img src={img} alt={`Property ${i}`} className="w-full h-24 object-cover" />
                        <button type="button" onClick={() => handleRemovePhoto(i)} className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="border-2 border-dashed border-ink-200 dark:border-white/20 rounded-2xl flex flex-col items-center justify-center text-center p-8 cursor-pointer hover:bg-ink-50 dark:hover:bg-white/5 transition-colors">
                    <ImageIcon className="h-8 w-8 text-ink-400 mb-2" />
                    <p className="text-sm font-bold text-ink-900 dark:text-white">Upload New Photos</p>
                    <p className="text-xs text-ink-500 mt-1">Click to browse your device files</p>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {propertyImages.map((img, i) => (
                    <img key={i} src={img} alt={`Property ${i}`} className="w-full h-24 object-cover rounded-xl" />
                  ))}
                </div>
              )}
            </SectionCard>

            {/* House Rules */}
            <SectionCard title="House Rules" isEditing={activeSection === 'rules'} onEdit={() => { syncEditForm(property); setActiveSection('rules'); }} onSave={handleSaveSection} onCancel={() => setActiveSection(null)} disabled={isOccupied}>
              {activeSection === 'rules' ? (
                <textarea rows={4} value={editForm.rules} onChange={e => setEditForm({ ...editForm, rules: e.target.value })} className="w-full border border-ink-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-transparent dark:text-white outline-none resize-none" />
              ) : (
                <p className="text-sm text-ink-700 dark:text-cream-100/80 leading-relaxed whitespace-pre-wrap">{property.rules || 'No strict rules provided.'}</p>
              )}
            </SectionCard>
          </div>

          {/* Right Column (Management Panel) */}
          <div className="lg:w-[400px]">
            <div className="sticky top-32 space-y-6">

              {/* Main Control Card (Pricing & Specs) */}
              <div className="bg-white dark:bg-[#16241F] rounded-2xl border border-ink-200/50 dark:border-white/10 shadow-xl shadow-black/5 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-ink-900 dark:text-white">Pricing & Specs</h2>
                  {!isOccupied && (
                    !activeSection || activeSection !== 'specs' ? (
                      <button onClick={() => { syncEditForm(property); setActiveSection('specs'); }} className="p-2 text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5 rounded-lg transition-colors"><PenSquare className="h-4 w-4" /></button>
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-moss-600 dark:text-[#E5C583]">Editing</span>
                    )
                  )}
                </div>

                {activeSection === 'specs' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Rent Amount (₦)</label>
                      <input type="number" value={editForm.rent_amount} onChange={e => setEditForm({ ...editForm, rent_amount: e.target.value })} className="w-full border border-ink-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-transparent dark:text-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Rent Cycle</label>
                      <select value={editForm.rent_period} onChange={e => setEditForm({ ...editForm, rent_period: e.target.value })} className="w-full border border-ink-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-transparent dark:bg-[#16241F] dark:text-white outline-none">
                        <option value="annually">Per Year</option>
                        <option value="monthly">Per Month</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Bedrooms</label>
                        <input type="number" value={editForm.beds} onChange={e => setEditForm({ ...editForm, beds: e.target.value })} className="w-full border border-ink-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-transparent dark:text-white outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Bathrooms</label>
                        <input type="number" value={editForm.baths} onChange={e => setEditForm({ ...editForm, baths: e.target.value })} className="w-full border border-ink-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-transparent dark:text-white outline-none" />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setActiveSection(null)} className="!py-2 !px-4 text-xs">Cancel</Button>
                      <Button onClick={handleSaveSection} className="!py-2 !px-4 text-xs">Save</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <p className="text-3xl font-bold text-moss-700 dark:text-[#E5C583] mb-1">
                        ₦{Number(property.rent_amount).toLocaleString()}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-cream-100/60">
                        {property.rent_period || 'annually'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6 py-6 border-y border-ink-200/50 dark:border-white/10">
                      <div className="text-center">
                        <BedDouble className="h-5 w-5 mx-auto mb-2 text-ink-400 dark:text-cream-100/40" />
                        <p className="text-sm font-bold text-ink-900 dark:text-white">{property.bedrooms || 0}</p>
                        <p className="text-[10px] uppercase text-ink-500">Bedrooms</p>
                      </div>
                      <div className="text-center">
                        <Bath className="h-5 w-5 mx-auto mb-2 text-ink-400 dark:text-cream-100/40" />
                        <p className="text-sm font-bold text-ink-900 dark:text-white">{property.bathrooms || 0}</p>
                        <p className="text-[10px] uppercase text-ink-500">Bathrooms</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Management Actions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-cream-100/50 mb-3">Management</h4>
                  <Button onClick={() => navigate(`/listings/${property.slug || property.id}`, { state: { preview: true } })} className="w-full justify-center !py-3 gap-2 bg-ink-900 text-white dark:bg-white dark:text-ink-900">
                    <Eye className="h-4 w-4" /> Preview Public Listing
                  </Button>
                  <Button
                    onClick={() => setShowSuspendModal(true)}
                    disabled={isOccupied || property.status === 'suspension_requested' || property.status === 'deletion_requested'}
                    variant="outline"
                    className="w-full justify-center !py-3 gap-2"
                  >
                    <PowerOff className="h-4 w-4" />
                    {isOccupied ? 'Locked (Occupied)' : property.status === 'suspension_requested' ? 'Suspension Pending' : property.status === 'suspended' ? 'Suspended' : 'Request Suspension'}
                  </Button>
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={isOccupied || property.status === 'deletion_requested' || property.status === 'suspension_requested'}
                    className="w-full justify-center !py-3 gap-2 bg-rose-50 text-rose-600 border-none hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isOccupied ? 'Locked (Occupied)' : property.status === 'deletion_requested' ? 'Deletion Pending' : 'Request Deletion'}
                  </Button>
                </div>
              </div>

              {/* Ownership Document Card */}
              <div className="bg-white dark:bg-[#16241F] rounded-2xl border border-ink-200/50 dark:border-white/10 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-ink-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Ownership
                  </h3>
                  {!isOccupied && (
                    <button onClick={() => { syncEditForm(property); setActiveSection('doc'); }} className="p-1.5 text-ink-400 hover:bg-ink-50 rounded-md"><PenSquare className="h-3 w-3" /></button>
                  )}
                </div>
                {activeSection === 'doc' ? (
                  <div className="space-y-3">
                    <select value={editForm.ownership_doc_type} onChange={e => setEditForm({ ...editForm, ownership_doc_type: e.target.value })} className="w-full border border-ink-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-transparent dark:bg-[#16241F] dark:text-white outline-none">
                      <option value="Deed of Assignment">Deed of Assignment</option>
                      <option value="C of O">C of O</option>
                    </select>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setActiveSection(null)} className="flex-1 !py-2 text-xs">Cancel</Button>
                      <Button onClick={handleSaveSection} className="flex-1 !py-2 text-xs">Save</Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-cream-50 dark:bg-white/5 p-3 rounded-xl border border-ink-100 dark:border-white/5 flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-white/10 rounded-lg"><FileText className="h-4 w-4 text-emerald-600" /></div>
                    <div>
                      <p className="text-xs font-bold text-ink-900 dark:text-white">{property.ownership_doc_type || 'Verified Document'}</p>
                      <p className="text-[10px] text-emerald-600">Securely stored</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Delete Request Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#16241F] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-ink-900 dark:text-white">Request Deletion</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-ink-400 hover:text-ink-600 dark:hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-ink-600 dark:text-cream-100/70 mb-4">
              Please provide a reason for deleting this property. Since it involves active data, admins must approve the deletion.
            </p>
            <textarea
              rows={3}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Reason for deletion..."
              className="w-full border border-ink-200 dark:border-white/10 rounded-xl p-3 text-sm bg-transparent dark:text-white outline-none resize-none mb-6"
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button onClick={handleRequestDeletion} disabled={isSubmittingDelete} className="bg-rose-500 text-white border-none hover:bg-rose-600">
                {isSubmittingDelete ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Request Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#16241F] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <PowerOff className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-ink-900 dark:text-white">Request Suspension</h3>
              </div>
              <button onClick={() => setShowSuspendModal(false)} className="text-ink-400 hover:text-ink-600 dark:hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-ink-600 dark:text-cream-100/70 mb-4">
              Please provide a reason for suspending this property listing. Admins must review and approve all suspension requests.
            </p>
            <textarea
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension..."
              className="w-full border border-ink-200 dark:border-white/10 rounded-xl p-3 text-sm bg-transparent dark:text-white outline-none resize-none mb-6"
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSuspendModal(false)}>Cancel</Button>
              <Button onClick={handleRequestSuspension} disabled={isSubmittingSuspend} className="bg-amber-600 text-white border-none hover:bg-amber-700">
                {isSubmittingSuspend ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
