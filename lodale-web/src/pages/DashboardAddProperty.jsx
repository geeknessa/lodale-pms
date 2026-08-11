import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, User, Key, Building2, Camera, ImagePlus, Upload, Check, Clock, AlertCircle } from "lucide-react";
import gsap from "gsap";
import { Logo } from "../components/Logo";
import Input from "../components/Input";
import Button from "../components/Button";
import { formatCurrency } from "../utils/formatters";
import { handlePropertySubmit, PRESET_PHOTOS, COMMON_AMENITIES } from "../utils/propertyUtils";

export default function DashboardAddProperty() {
  const navigate = useNavigate();
  const [occupied, setOccupied] = useState(null); // null | true | false
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  // Dynamic Property Specifications State
  const [selectedAmenities, setSelectedAmenities] = useState(["Prepaid Meter", "24/7 Security"]);
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [bathrooms, setBathrooms] = useState("2");
  const [description, setDescription] = useState("");
  const [stateName, setStateName] = useState("Lagos");

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleAddCustomAmenity = (e) => {
    e.preventDefault();
    const trimmed = customAmenityInput.trim();
    if (trimmed && !selectedAmenities.includes(trimmed)) {
      setSelectedAmenities((prev) => [...prev, trimmed]);
      setCustomAmenityInput("");
    }
  };

  // Property picture prompt state
  const [propertyPhoto, setPropertyPhoto] = useState(PRESET_PHOTOS[0].url);
  const [photoPreview, setPhotoPreview] = useState(PRESET_PHOTOS[0].url);
  const [photoError, setPhotoError] = useState("");

  // Rent cycle state
  const [rentCycle, setRentCycle] = useState("annual"); // "annual" | "monthly"

  // Proof of ownership legal papers state
  const [docType, setDocType] = useState("Deed of Assignment");
  const [docName, setDocName] = useState("");
  const [docDataUrl, setDocDataUrl] = useState("");
  const [docUploaded, setDocUploaded] = useState(false);

  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const cardRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const successOverlayRef = useRef(null);
  const checkIconRef = useRef(null);
  const textContainerRef = useRef(null);

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setPhotoError("Please select a valid image file (PNG, JPG, WEBP).");
        return;
      }
      setPhotoError("");
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target.result;
        setPropertyPhoto(result);
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleDocUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      setDocName(file.name);
      setDocUploaded(true);
      setFormError("");
      const reader = new FileReader();
      reader.onload = (evt) => {
        setDocDataUrl(evt.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  // Mount animation sequence
  useEffect(() => {
    if (!isSubmitted) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(cardRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 }
      );
      tl.fromTo(titleRef.current,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.4"
      );
      tl.fromTo(descRef.current,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.4"
      );
      tl.fromTo(".animate-form-field",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 },
        "-=0.3"
      );
    }
  }, [isSubmitted]);

  async function handleSubmit(e) {
    await handlePropertySubmit({
      e,
      stateName,
      cityName: null,
      bathrooms,
      description,
      selectedAmenities,
      docType,
      docName,
      docDataUrl,
      propertyPhoto,
      rentCycle,
      setFormError,
      setIsSubmitted
    });
  }

  // Success overlay GSAP animation triggers
  useEffect(() => {
    if (isSubmitted && successOverlayRef.current) {
      gsap.fromTo(successOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: "power2.out" }
      );

      if (checkIconRef.current) {
        gsap.fromTo(checkIconRef.current,
          { scale: 0, rotation: -45, opacity: 0 },
          { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: "back.out(1.7)", delay: 0.3 }
        );
      }

      if (textContainerRef.current) {
        gsap.fromTo(textContainerRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: 0.5 }
        );
      }
    }
  }, [isSubmitted]);

  if (isSubmitted) {
    return (
      <div ref={successOverlayRef} className="dap-success-overlay">
        <div className="dap-success-card">
          <div ref={checkIconRef} className="dap-success-icon-wrap">
            <CheckCircle2 style={{ height: 48, width: 48 }} />
          </div>

          <div ref={textContainerRef}>
            <div className="dap-sparkle-tag">
              <CheckCircle2 style={{ height: 14, width: 14 }} />
              Pending Admin Review
            </div>

            <h2 className="dap-success-title">Property Submitted!</h2>
            <p className="dap-success-desc">
              Your property registration has been queued for verification. Once approved by the system admin, it will go live on the tenant search portal.
            </p>

            <div className="dap-success-actions">
              <Button
                variant="primary"
                onClick={() => navigate("/dashboard/landlord")}
                className="w-full flex items-center justify-center gap-2 py-3 cursor-pointer"
              >
                Go to Landlord Control Panel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dap-page">
      <div className="dap-glow-1" />
      <div className="dap-glow-2" />

      <div className="dap-inner">
        {/* Back Link and Logo */}
        <div className="dap-topbar">
          <button
            onClick={() => navigate("/dashboard/landlord")}
            className="dap-back-btn"
          >
            <ArrowLeft style={{ height: 16, width: 16 }} />
            Back to Dashboard
          </button>
          <Logo variant="moss" />
        </div>

        {/* Form Container */}
        <div ref={cardRef} className="dap-card">
          <div className="dap-building-badge">
            <Building2 />
          </div>

          <h1 ref={titleRef} className="dap-card-title">
            Register New Property
          </h1>
          <p ref={descRef} className="dap-card-desc">
            Add a new flat or apartment building unit directly to your active management portfolio.
          </p>

          <form onSubmit={handleSubmit} className="dap-form">

            {formError && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Core Fields */}
            <div className="dap-fields-group animate-form-field">
              <Input
                id="address"
                label="Full Address / Street Location *"
                placeholder="e.g. Admiralty Way, Lekki Phase 1"
                maxLength={255}
                light={false}
                required
              />

              <div className="dap-grid-2">
                <Input
                  id="city"
                  label="City / Area *"
                  placeholder="e.g. Lekki, Victoria Island, Yaba, Ikeja"
                  maxLength={100}
                  light={false}
                  required
                />
                <Input
                  id="state"
                  label="State / Region *"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. Lagos, Abuja, Rivers"
                  maxLength={50}
                  light={false}
                  required
                />
              </div>

              <div className="dap-grid-2">
                <Input
                  id="type"
                  label="Property Type *"
                  placeholder="e.g. Apartment, Duplex, Villa, Studio"
                  maxLength={50}
                  light={false}
                  required
                />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[12px] font-bold text-ink-900 dark:text-white">Asking Rent *</label>
                    <div className="flex items-center gap-1 bg-[#3A5A40]/10 dark:bg-white/10 p-0.5 rounded-md">
                      <button
                        type="button"
                        onClick={() => setRentCycle("annual")}
                        className={`px-2 py-0.5 text-[10.5px] font-bold rounded transition-all cursor-pointer border-none outline-none ${rentCycle === "annual"
                          ? "bg-[#3A5A40] dark:bg-[#E5C583] text-white dark:text-[#263b33] shadow-xs"
                          : "text-ink-700 dark:text-cream-100/70"
                          }`}
                      >
                        Annual
                      </button>
                      <button
                        type="button"
                        onClick={() => setRentCycle("monthly")}
                        className={`px-2 py-0.5 text-[10.5px] font-bold rounded transition-all cursor-pointer border-none outline-none ${rentCycle === "monthly"
                          ? "bg-[#3A5A40] dark:bg-[#E5C583] text-white dark:text-[#263b33] shadow-xs"
                          : "text-ink-700 dark:text-cream-100/70"
                          }`}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>
                  <Input
                    id="rent"
                    type="number"
                    min="0"
                    placeholder={rentCycle === "annual" ? "2500000" : "200000"}
                    light={false}
                    required
                  />
                </div>
              </div>

              <div className="dap-grid-2">
                <Input
                  id="bedrooms"
                  label="Bedrooms *"
                  type="number"
                  min="0"
                  placeholder="e.g. 2"
                  light={false}
                  required
                />
                <Input
                  id="bathrooms"
                  label="Bathrooms *"
                  type="number"
                  min="0"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  placeholder="e.g. 2"
                  light={false}
                  required
                />
              </div>

              {/* Property Description */}
              <div>
                <label className="block text-[12px] font-bold text-ink-900 dark:text-white mb-1">
                  Property Description / Special Details
                </label>
                <textarea
                  id="description"
                  rows={3}
                  maxLength={1000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your property layout, unique features, or rental guidelines..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-[#16241F] border border-ink-200 dark:border-white/15 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-cream-100/40 outline-none focus:border-moss-600 dark:focus:border-[#E5C583] transition-all"
                />
              </div>

              {/* PROPERTY AMENITIES SELECTION SECTION */}
              <div className="rounded-xl border border-[#3A5A40]/30 dark:border-white/10 bg-[#3A5A40]/5 dark:bg-white/5 p-5 animate-form-field">
                <label className="block text-[13px] font-bold text-ink-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
                  <span>Property Amenities & Features *</span>
                </label>
                <p className="text-[12px] text-ink-700 dark:text-cream-100/70 mb-3 leading-relaxed">
                  Select available building utilities or type custom features to highlight for prospective tenants.
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_AMENITIES.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer border ${isSelected
                          ? "bg-[#3A5A40] text-white border-[#3A5A40] dark:bg-[#E5C583] dark:text-[#263b33] dark:border-[#E5C583] shadow-xs"
                          : "bg-white dark:bg-[#16241F] text-ink-800 dark:text-cream-100 border-ink-200 dark:border-white/15 hover:border-moss-600"
                          }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {amenity}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={100}
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    placeholder="Add custom amenity (e.g. Jacuzzi, Smart Lock)"
                    className="flex-1 px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#16241F] border border-ink-200 dark:border-white/15 text-ink-900 dark:text-white outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomAmenity(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="px-4 py-2 rounded-lg bg-[#3A5A40] text-white font-bold text-xs hover:bg-[#344E41] transition-all cursor-pointer"
                  >
                    Add
                  </button>
              </div>
              </div>

              {/* PROOF OF OWNERSHIP LEGAL PAPERS SECTION */}
              <div className="rounded-xl border border-[#3A5A40]/30 dark:border-white/10 bg-[#3A5A40]/5 dark:bg-white/5 p-5 animate-form-field">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[13px] font-bold text-ink-900 dark:text-white flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
                    <span>Proof of Ownership (Legal Papers) *</span>
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Legal Proof Attached
                  </span>
                </div>
                <p className="text-[12px] text-ink-700 dark:text-cream-100/70 mb-3 leading-relaxed">
                  Upload legal title documents (Deed of Assignment, Certificate of Occupancy, or Land Title Receipt) for Admin verification before listing.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-cream-100/60 mb-1">
                      Document Type
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#16241F] border border-ink-200 dark:border-white/15 text-ink-900 dark:text-white outline-none"
                    >
                      <option value="Deed of Assignment">Deed of Assignment</option>
                      <option value="Certificate of Occupancy (C of O)">Certificate of Occupancy (C of O)</option>
                      <option value="Governor's Consent">Governor's Consent</option>
                      <option value="Land Title Receipt / Survey Plan">Land Title Receipt / Survey Plan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-cream-100/60 mb-1">
                      Uploaded File
                    </label>
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#16241F] border border-ink-200 dark:border-white/15 rounded-lg text-xs font-mono text-ink-800 dark:text-[#E5C583] truncate">
                      <span className="truncate">{docName}</span>
                    </div>
                  </div>
                </div>

                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleDocUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#3A5A40] text-white font-bold text-[12px] hover:bg-[#344E41] transition-all cursor-pointer border-none outline-none"
                >
                  <Upload className="h-4 w-4" />
                  Attach Legal Proof File (PDF / Image)
                </button>
              </div>

              {/* PROPERTY PICTURE PROMPT & PHOTO PICKER */}
              <div className="rounded-xl border border-[#3A5A40]/30 dark:border-white/10 bg-[#3A5A40]/5 dark:bg-white/5 p-5 animate-form-field">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[13px] font-bold text-ink-900 dark:text-white flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
                    <span>Property Photos & Pictures *</span>
                  </label>
                  <span className="text-[11px] font-bold text-moss-700 dark:text-[#E5C583] flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Photo Attached
                  </span>
                </div>
                <p className="text-[12px] text-ink-700 dark:text-cream-100/70 mb-4 leading-relaxed">
                  Add a high-quality picture of your rental unit so prospective tenants can inspect layout details.
                </p>

                {/* Photo Preview */}
                {photoPreview && (
                  <div className="relative mb-4 h-44 w-full overflow-hidden rounded-xl border border-ink-200 dark:border-white/15 shadow-sm group">
                    <img
                      src={photoPreview}
                      alt="Property Preview"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Check className="h-3 w-3 text-emerald-400" /> Active Listing Photo
                    </span>
                  </div>
                )}

                {/* File Upload Trigger */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-[12.5px] hover:bg-[#1E382A] dark:hover:bg-[#d8b672] transition-all cursor-pointer shadow-xs active:scale-95 border-none outline-none"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Photo from Device
                  </button>
                </div>

                {/* Sample Photo Pickers */}
                <div className="mt-3">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-400 dark:text-cream-100/50 mb-2">
                    Or pick a recommended sample photo:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_PHOTOS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPropertyPhoto(preset.url);
                          setPhotoPreview(preset.url);
                        }}
                        className={`text-[11.5px] font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer outline-none ${photoPreview === preset.url
                          ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-transparent shadow-xs"
                          : "bg-white dark:bg-[#182C24] text-ink-700 dark:text-cream-100/80 border-ink-200 dark:border-white/10 hover:border-moss-500"
                          }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                {photoError && (
                  <p className="mt-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400">{photoError}</p>
                )}
              </div>
            </div>

            {/* Occupancy Choice Card buttons */}
            <div className="animate-form-field">
              <span className="dap-occupancy-label">
                Does this property already have an active tenant?
              </span>
              <div className="dap-occupancy-grid">
                <button
                  type="button"
                  onClick={() => setOccupied(true)}
                  className={`dap-choice-card${occupied === true ? " selected" : ""}`}
                >
                  <div className="dap-choice-icon">
                    <User style={{ height: 20, width: 20 }} />
                  </div>
                  <div>
                    <div className="dap-choice-title">Yes, occupied</div>
                    <div className="dap-choice-desc">
                      Invite them to link their profiles and ledger logs.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOccupied(false)}
                  className={`dap-choice-card${occupied === false ? " selected" : ""}`}
                >
                  <div className="dap-choice-icon">
                    <Key style={{ height: 20, width: 20 }} />
                  </div>
                  <div>
                    <div className="dap-choice-title">No, it&rsquo;s vacant</div>
                    <div className="dap-choice-desc">
                      Publish listing page to explore applicants page.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Tenant details fields */}
            {occupied === true && (
              <div className="dap-subform animate-form-field">
                <p className="dap-subform-title">Invite your current tenant</p>
                <div className="dap-fields-group">
                  <Input
                    id="tenantName"
                    label="Tenant's Name"
                    placeholder="e.g. Emeka Obi"
                    maxLength={50}
                    onInput={(e) => e.target.value = e.target.value.replace(/[0-9]/g, '')}
                    light={false}
                    required
                  />
                  <Input
                    id="tenantContact"
                    label="Tenant's Email or Phone"
                    placeholder="e.g. emeka@domain.com"
                    maxLength={100}
                    light={false}
                    required
                  />
                  <Input
                    id="leaseStart"
                    label="Lease Start Date"
                    type="date"
                    light={false}
                    required
                  />
                </div>
              </div>
            )}

            {/* Listing details fields */}
            {occupied === false && (
              <div className="dap-subform animate-form-field">
                <p className="dap-subform-title">Public Listing Details</p>
                <div className="dap-fields-group">
                  <Input
                    id="description"
                    label="Short Description"
                    placeholder="e.g. Spacious kitchen, scenic balcony view, high security features..."
                    light={false}
                  />
                  <Input
                    id="availableFrom"
                    label="Available From"
                    type="date"
                    light={false}
                    required
                  />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="animate-form-field">
              <Button
                type="submit"
                disabled={occupied === null}
                className={`dap-submit-btn${occupied !== null ? " active" : " disabled"}`}
              >
                {occupied === true
                  ? "Send Invite & Add Property"
                  : occupied === false
                    ? "Publish Listing"
                    : "Choose Occupancy Status"}
              </Button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
