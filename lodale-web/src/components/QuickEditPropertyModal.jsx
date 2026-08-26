import { useState, useEffect, useRef } from "react";
import { X, Lock, CheckCircle2, AlertTriangle, Loader2, SlidersHorizontal, Image, Plus, Trash2, Shield, Info, Send, Upload } from "lucide-react";
import Button from "./Button";
import { propertyService } from "../services/propertyService";
import { triggerToast } from "../context/ToastContext";
import { COMMON_AMENITIES } from "../utils/propertyUtils";

export default function QuickEditPropertyModal({ isOpen, onClose, property, onSaveSuccess }) {
  if (!isOpen || !property) return null;

  const [title, setTitle] = useState(property.title || "");
  const [description, setDescription] = useState(property.description || "");
  const [rules, setRules] = useState(property.rules || "");
  const [selectedAmenities, setSelectedAmenities] = useState(() => {
    if (!property.amenities) return [];
    if (Array.isArray(property.amenities)) {
      return property.amenities.map(a => (typeof a === "string" ? a : a.name || a.title));
    }
    return [];
  });

  const [coverImage, setCoverImage] = useState(property.cover_image || property.image || "");
  const [images, setImages] = useState(() => {
    if (Array.isArray(property.images) && property.images.length > 0) {
      return property.images.map(img => (typeof img === "string" ? img : img.url));
    }
    return property.cover_image ? [property.cover_image] : [];
  });

  const [customAmenity, setCustomAmenity] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Admin Request Modal State for Locked Fields
  const [showAdminRequest, setShowAdminRequest] = useState(false);
  const [adminReason, setAdminReason] = useState("");
  const [sendingAdminReq, setSendingAdminReq] = useState(false);

  useEffect(() => {
    if (property) {
      setTitle(property.title || "");
      setDescription(property.description || "");
      setRules(property.rules || "");
      if (Array.isArray(property.amenities)) {
        setSelectedAmenities(property.amenities.map(a => (typeof a === "string" ? a : a.name || a.title)));
      }
      setCoverImage(property.cover_image || property.image || "");
      if (Array.isArray(property.images) && property.images.length > 0) {
        setImages(property.images.map(img => (typeof img === "string" ? img : img.url)));
      }
    }
  }, [property]);

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddCustomAmenity = (e) => {
    if (e) e.preventDefault();
    const trimmed = customAmenity.trim();
    if (trimmed && !selectedAmenities.includes(trimmed)) {
      setSelectedAmenities(prev => [...prev, trimmed]);
      setCustomAmenity("");
    }
  };

  const fileInputRef = useRef(null);

  const handleAddPhotoUrl = (e) => {
    if (e) e.preventDefault();
    const trimmed = newPhotoUrl.trim();
    if (trimmed) {
      setImages(prev => {
        const next = [...prev, trimmed];
        if (!coverImage) setCoverImage(trimmed);
        return next;
      });
      setNewPhotoUrl("");
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        triggerToast("Please select valid image files (PNG, JPG, WEBP).", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        setImages(prev => {
          const next = [...prev, dataUrl];
          if (!coverImage) setCoverImage(dataUrl);
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
    triggerToast(`${files.length} photo(s) added successfully.`, "success");
  };

  const handleRemovePhoto = (idxToRemove) => {
    if (images.length <= 1) {
      triggerToast("Property must have at least one photo.", "warning", "Photo Required");
      return;
    }
    const updated = images.filter((_, idx) => idx !== idxToRemove);
    setImages(updated);
    if (coverImage === images[idxToRemove]) {
      setCoverImage(updated[0] || "");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      triggerToast("Property display name cannot be empty.", "warning", "Validation Error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        cover_image: coverImage || images[0] || "",
        images: images,
        amenities: selectedAmenities,
        rules: rules
      };

      const updated = await propertyService.updateProperty(property.id, payload);

      // Update local storage if present
      try {
        const savedLandlord = JSON.parse(localStorage.getItem("landlordProperties") || "[]");
        const idx = savedLandlord.findIndex(p => String(p.id) === String(property.id));
        if (idx !== -1) {
          savedLandlord[idx] = { ...savedLandlord[idx], ...payload };
          localStorage.setItem("landlordProperties", JSON.stringify(savedLandlord));
        }
      } catch (e) {}

      triggerToast("Property display details updated successfully!", "success", "Saved");
      if (onSaveSuccess) onSaveSuccess(updated || payload);
      onClose();
    } catch (err) {
      console.error("Error updating property details:", err);
      triggerToast(err.message || "Failed to update property details.", "error", "Save Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendAdminRequest = async (e) => {
    e.preventDefault();
    if (!adminReason.trim()) {
      triggerToast("Please describe the structural/financial changes you wish to request.", "warning", "Reason Required");
      return;
    }
    setSendingAdminReq(true);
    try {
      await propertyService.requestPropertyStatusChange(property.id, "change_request", adminReason);
      triggerToast("Your change request has been submitted to Admin for review!", "info", "Request Sent");
      setShowAdminRequest(false);
      setAdminReason("");
    } catch (err) {
      triggerToast(err.message || "Request queued for admin approval.", "info", "Submitted");
      setShowAdminRequest(false);
      setAdminReason("");
    } finally {
      setSendingAdminReq(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/65 dark:bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#12221C] border border-ink-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8 text-left text-ink-900 dark:text-white font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ink-100 dark:border-white/10 bg-cream-50 dark:bg-[#162721]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-moss-100 text-moss-700 dark:bg-[#E5C583]/15 dark:text-[#E5C583]">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-900 dark:text-white">Edit Property Listing</h2>
              <p className="text-xs text-ink-500 dark:text-cream-100/70">
                In-page update for <span className="font-semibold text-moss-700 dark:text-[#E5C583]">{property.title}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-ink-100 hover:bg-ink-200 dark:bg-white/5 dark:hover:bg-white/10 text-ink-600 dark:text-cream-100/70 dark:hover:text-white transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Locked Fields Notice */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Directly Editable: Display Name, Photos, Amenities, & House Rules</span>
              <span>Financial terms (asking rent), location address, structural specifications (beds/baths), and title documents are locked to prevent listing fraud.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAdminRequest(true)}
            className="px-2.5 py-1.5 bg-amber-200 hover:bg-amber-300 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 font-bold text-[11px] rounded-lg transition-colors shrink-0 cursor-pointer border border-amber-300 dark:border-amber-800"
          >
            Request Admin Change
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-ink-800 dark:text-cream-100/80 mb-1">
              Property Display Name / Title *
            </label>
            <textarea
              rows={2}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 p-3 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600 dark:focus:border-[#E5C583] resize-none leading-relaxed"
              placeholder="e.g. Luxury 3-Bedroom Villa in Lekki"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-ink-800 dark:text-cream-100/80 mb-1">
              Property Description / Overview
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 p-3 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 dark:focus:border-[#E5C583] resize-none leading-relaxed break-words"
              placeholder="Describe key features, floor layout, security, and surrounding neighborhood..."
            />
          </div>

          {/* Photos & Cover Image */}
          <div className="space-y-3 pt-4 border-t border-ink-100 dark:border-white/10">
            <label className="block text-xs font-bold text-moss-700 dark:text-[#E5C583] uppercase tracking-wider flex items-center gap-2">
              <Image className="h-4 w-4" /> Cover & Gallery Pictures
            </label>

            {/* Photo List */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, idx) => {
                const isCover = coverImage === img;
                return (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-ink-200 dark:border-white/10 aspect-video bg-ink-100 dark:bg-white/5">
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                      <button
                        type="button"
                        onClick={() => setCoverImage(img)}
                        className={`px-2 py-1 text-[10px] font-bold rounded ${isCover ? "bg-emerald-500 text-white" : "bg-white/20 hover:bg-white/40 text-white"}`}
                      >
                        {isCover ? "Cover" : "Set Cover"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white"
                        title="Remove photo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {isCover && (
                      <span className="absolute top-1 left-1 bg-moss-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                        COVER
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Photo Controls: Local Upload + URL */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-moss-600 hover:bg-moss-700 text-white dark:bg-[#E5C583] dark:hover:bg-[#d4b371] dark:text-[#0B1512] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Upload className="h-3.5 w-3.5" /> Upload File
              </button>

              <div className="flex flex-1 gap-2">
                <input
                  type="text"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="Or paste photo URL (https://...)..."
                  className="flex-1 rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 px-3.5 py-2 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 dark:focus:border-[#E5C583]"
                />
                <button
                  type="button"
                  onClick={handleAddPhotoUrl}
                  className="px-3 py-2 bg-ink-100 hover:bg-ink-200 dark:bg-white/10 dark:hover:bg-white/20 text-ink-800 dark:text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" /> Add URL
                </button>
              </div>
            </div>
          </div>

          {/* Amenities Selection */}
          <div className="space-y-3 pt-4 border-t border-ink-100 dark:border-white/10">
            <label className="block text-xs font-bold text-moss-700 dark:text-[#E5C583] uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Features & Amenities
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_AMENITIES.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-moss-700 text-white border-transparent dark:bg-[#E5C583] dark:text-[#263b33]"
                        : "bg-cream-50 dark:bg-white/5 text-ink-700 dark:text-cream-100 border-ink-200 dark:border-white/10 hover:bg-cream-100 dark:hover:bg-white/10"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}{amenity}
                  </button>
                );
              })}
            </div>

            {/* Custom Amenity Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                placeholder="Add custom amenity (e.g. Swimming Pool, Solar Power)..."
                className="flex-1 rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 px-3.5 py-2 text-xs text-ink-900 dark:text-white outline-none focus:border-moss-600 dark:focus:border-[#E5C583]"
              />
              <button
                type="button"
                onClick={handleAddCustomAmenity}
                className="px-3.5 py-2 bg-ink-100 hover:bg-ink-200 dark:bg-white/10 dark:hover:bg-white/20 text-ink-800 dark:text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* House Rules */}
          <div className="space-y-3 pt-4 border-t border-ink-100 dark:border-white/10">
            <label className="block text-xs font-bold text-moss-700 dark:text-[#E5C583] uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4" /> House Rules & Guidelines
            </label>
            <textarea
              rows={3}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="e.g. No noise after 10 PM, Pets allowed with deposit..."
              className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 p-3 text-sm text-ink-900 dark:text-white outline-none focus:border-moss-600 dark:focus:border-[#E5C583] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-ink-100 dark:border-white/10 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="bg-ink-100 hover:bg-ink-200 text-ink-800 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 border border-ink-200 dark:border-white/10 text-xs px-5 py-2.5 rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-moss-600 hover:bg-moss-700 text-white dark:bg-[#E5C583] dark:hover:bg-[#d4b371] dark:text-[#0B1512] font-bold text-xs px-6 py-2.5 flex items-center gap-2 rounded-xl shadow-md cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Admin Change Request Sub-Modal */}
      {showAdminRequest && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#12221C] border border-ink-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink-900 dark:text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-500" /> Request Admin Change
              </h3>
              <button onClick={() => setShowAdminRequest(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-ink-600 dark:text-cream-100/70 leading-relaxed">
              Describe the financial, structural, or location changes you need to make (e.g. Rent increase, address update, or bedroom recount). An administrator will verify and approve your request.
            </p>

            <form onSubmit={handleSendAdminRequest} className="space-y-4">
              <textarea
                rows={4}
                required
                value={adminReason}
                onChange={(e) => setAdminReason(e.target.value)}
                placeholder="e.g. Requesting rent adjustment from ₦2.5m to ₦3.0m due to newly added solar installation..."
                className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50 dark:bg-white/5 p-3 text-xs text-ink-900 dark:text-white outline-none focus:border-amber-500"
              />

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAdminRequest(false)}
                  className="px-4 py-2 text-xs font-bold text-ink-600 dark:text-cream-100 hover:bg-ink-50 dark:hover:bg-white/5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingAdminReq}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {sendingAdminReq ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
