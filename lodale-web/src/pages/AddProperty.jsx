import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Camera, ImagePlus, Upload, Check, Clock, AlertCircle } from "lucide-react";
import gsap from "gsap";
import { Logo } from "../components/Logo";
import Input from "../components/Input";
import Button from "../components/Button";
import { formatCurrency } from "../utils/formatters";
import { handlePropertySubmit, PRESET_PHOTOS, COMMON_AMENITIES } from "../utils/propertyUtils";

export default function AddProperty() {
  const navigate = useNavigate();
  const [occupied, setOccupied] = useState(null); // null | true | false
  const [rentCycle, setRentCycle] = useState("annual"); // "annual" | "monthly"
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const [displayName, setDisplayName] = useState("");
  
  // Dynamic Property Specifications State
  const [selectedAmenities, setSelectedAmenities] = useState(["Prepaid Meter", "24/7 Security"]);
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [bathrooms, setBathrooms] = useState("2");
  const [description, setDescription] = useState("");
  const [stateName, setStateName] = useState("Lagos");
  const [cityName, setCityName] = useState("Lagos");

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
  const [propertyPhotos, setPropertyPhotos] = useState([PRESET_PHOTOS[0].url]);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);
  const [photoError, setPhotoError] = useState("");
  
  // Property Rules
  const [rules, setRules] = useState("");

  // Proof of ownership legal papers state
  const [docType, setDocType] = useState("Deed of Assignment");
  const [docName, setDocName] = useState("");
  const [docDataUrl, setDocDataUrl] = useState("");
  const [docUploaded, setDocUploaded] = useState(false);

  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const successOverlayRef = useRef(null);
  const checkIconRef = useRef(null);
  const textContainerRef = useRef(null);

  function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 5 - propertyPhotos.length;
    if (remainingSlots <= 0) {
      setPhotoError("You can only upload up to 5 photos.");
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setPhotoError(`Only the first ${remainingSlots} photo(s) were added. Maximum is 5.`);
    } else {
      setPhotoError("");
    }

    filesToAdd.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setPhotoError("Please select valid image files (PNG, JPG, WEBP).");
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPropertyPhotos((prev) => [...prev, evt.target.result]);
      };
      reader.readAsDataURL(file);
    });
  }

  function handleDocUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormError("Proof of Ownership document exceeds 2MB limit.");
        setDocName("");
        setDocUploaded(false);
        setDocDataUrl("");
        return;
      }
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

  async function handleSubmit(e) {
    await handlePropertySubmit({
      e,
      displayName,
      stateName,
      cityName,
      bathrooms,
      description,
      selectedAmenities,
      docType,
      docName,
      docDataUrl,
      propertyPhotos,
      coverPhoto: propertyPhotos[coverPhotoIndex],
      rules,
      rentCycle,
      setFormError,
      setIsSubmitted
    });
  };

  useEffect(() => {
    if (isSubmitted && successOverlayRef.current) {
      // 1. Initial fade-in of overlay
      gsap.fromTo(successOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: "power2.out" }
      );

      // 2. Pop the check icon
      if (checkIconRef.current) {
        gsap.fromTo(checkIconRef.current,
          { scale: 0, rotation: -45, opacity: 0 },
          { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: "back.out(1.7)", delay: 0.3 }
        );
        // Subtle loop pulse on check mark
        gsap.to(checkIconRef.current, {
          scale: 1.05,
          duration: 1,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1
        });
      }

      // 3. Slide up the text container
      if (textContainerRef.current) {
        gsap.fromTo(textContainerRef.current.children,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: "power2.out", delay: 0.6 }
        );
      }

      // 4. Smooth redirect after 3.2 seconds
      const timer = setTimeout(() => {
        gsap.to(successOverlayRef.current, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.inOut",
          onComplete: () => {
            navigate("/dashboard/landlord");
          }
        });
      }, 3200);

      return () => clearTimeout(timer);
    }
  }, [isSubmitted, navigate]);

  if (isSubmitted) {
    return (
      <div
        ref={successOverlayRef}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#263b33] text-white font-sans px-6"
      >
        {/* Background glow animations */}
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-moss-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-cream-50/5 blur-[100px] pointer-events-none" />

        <div className="flex flex-col items-center max-w-sm text-center relative z-10">
          <div
            ref={checkIconRef}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-moss-800 border-2 border-moss-500/30 mb-8 relative shadow-[0_0_50px_rgba(58,90,64,0.25)]"
          >
            <CheckCircle2 className="h-12 w-12 text-[#E5C583]" />
          </div>

          <div ref={textContainerRef} className="space-y-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
              Sent for Admin Review!
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full font-bold text-xs">
              <Clock className="h-3.5 w-3.5 text-amber-300" />
              <span>Status: Pending Review</span>
            </div>
            <p className="text-[13px] leading-relaxed text-[#A3BCA7] max-w-sm mx-auto">
              Your property and proof of ownership legal documents have been submitted to Admin. Your listing status will update to <strong>Approved &amp; Live</strong>, <strong>Rejected</strong> (with reason), or <strong>Info Requested</strong> once reviewed.
            </p>

            <div className="flex items-center justify-center gap-2 pt-4">
              <Loader2 className="h-4 w-4 animate-spin text-[#E5C583]" />
              <span className="text-[12px] font-medium tracking-wide uppercase text-ink-300">
                Opening Landlord Dashboard...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Logo className="mb-10" />

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-ink-200 bg-white p-8 shadow-sm"
        >
          <h1 className="font-display text-2xl font-bold text-ink-900">
            Add your first property
          </h1>
          <p className="mt-2 text-[14px] text-ink-700">
            No agency needed — list it yourself, whether it&rsquo;s vacant or
            already has a tenant.
          </p>

          {formError && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="mt-6 space-y-5">
            <Input
              id="displayName"
              label="Property Display Name *"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Luxury 3-Bed Lekki Phase 1"
              maxLength={255}
              required
            />
            <Input
              id="address"
              label="Full Address / Street Location *"
              placeholder="e.g. Admiralty Way, Lekki Phase 1"
              maxLength={255}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="city"
                label="City / Area *"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="e.g. Lekki, Victoria Island, Yaba, Ikeja"
                maxLength={100}
                required
              />
              <Input
                id="state"
                label="State / Region *"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="e.g. Lagos, Abuja, Rivers"
                maxLength={50}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="type"
                label="Property Type *"
                placeholder="Apartment, duplex, villa, studio"
                maxLength={50}
                required
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="rent"
                    className="block text-[13px] font-medium text-ink-700"
                  >
                    Asking Rent * ({rentCycle === "annual" ? "per annum" : "per month"})
                  </label>
                  <div className="inline-flex p-0.5 bg-cream-100 border border-ink-200 rounded-md">
                    <button
                      type="button"
                      onClick={() => setRentCycle("annual")}
                      className={`px-2 py-0.5 text-[10.5px] font-bold rounded transition-all cursor-pointer ${rentCycle === "annual"
                          ? "bg-moss-700 text-white shadow-xs"
                          : "text-ink-700 hover:text-ink-900"
                        }`}
                    >
                      Annual
                    </button>
                    <button
                      type="button"
                      onClick={() => setRentCycle("monthly")}
                      className={`px-2 py-0.5 text-[10.5px] font-bold rounded transition-all cursor-pointer ${rentCycle === "monthly"
                          ? "bg-moss-700 text-white shadow-xs"
                          : "text-ink-700 hover:text-ink-900"
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
                  placeholder={
                    rentCycle === "annual"
                      ? "2500000"
                      : "200000"
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="bedrooms"
                label="Bedrooms *"
                type="number"
                min="0"
                placeholder="e.g. 2"
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
                required
              />
            </div>

            {/* Property Description */}
            <div>
              <label className="block text-[13px] font-medium text-ink-700 mb-1">
                Property Description / Special Details
              </label>
              <textarea
                id="description"
                rows={3}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your property layout, unique features, or rental guidelines..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-ink-200 text-ink-900 placeholder-ink-400 outline-none focus:border-moss-700 transition-all"
              />
            </div>

            {/* PROPERTY AMENITIES SELECTION SECTION */}
            <div className="rounded-xl border border-moss-700/20 bg-moss-700/[0.03] p-5">
              <label className="block text-[13px] font-bold text-ink-900 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-moss-700" />
                <span>Property Amenities & Features *</span>
              </label>
              <p className="text-[12px] text-ink-700 mb-3 leading-relaxed">
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
                        ? "bg-moss-700 text-white border-moss-700 shadow-xs"
                        : "bg-white text-ink-800 border-ink-200 hover:border-moss-700"
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
                  className="flex-1 px-3 py-2 text-xs rounded-lg bg-white border border-ink-200 text-ink-900 outline-none"
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
                  className="px-4 py-2 rounded-lg bg-moss-700 text-white font-bold text-xs hover:bg-moss-800 transition-all cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Property Rules */}
            <div className="mb-6">
              <label className="block text-[13px] font-bold text-ink-900 mb-2">
                Property Rules (Optional)
              </label>
              <textarea
                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-[13px] text-ink-900 placeholder-ink-400 focus:border-moss-600 focus:outline-none focus:ring-1 focus:ring-moss-600 min-h-[100px] resize-y"
                placeholder="e.g., No smoking, No pets, Max 4 occupants, Quiet hours after 10 PM"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
              />
            </div>

            {/* PROOF OF OWNERSHIP LEGAL PAPERS SECTION */}
            <div className="rounded-xl border border-moss-700/20 bg-moss-700/[0.03] p-5 mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[13px] font-bold text-ink-900 flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-moss-700" />
                  <span>Proof of Ownership (Legal Papers) *</span>
                </label>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Legal Proof Attached
                </span>
              </div>
              <p className="text-[12px] text-ink-700 mb-3 leading-relaxed">
                Upload legal title documents (Deed of Assignment, Certificate of Occupancy, or Land Title Receipt) for Admin verification before listing.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1">
                    Document Type
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-ink-200 text-ink-900 outline-none"
                  >
                    <option value="Deed of Assignment">Deed of Assignment</option>
                    <option value="Certificate of Occupancy (C of O)">Certificate of Occupancy (C of O)</option>
                    <option value="Governor's Consent">Governor's Consent</option>
                    <option value="Land Title Receipt / Survey Plan">Land Title Receipt / Survey Plan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1">
                    Uploaded File
                  </label>
                  <div className="flex items-center gap-2 p-2 bg-white border border-ink-200 rounded-lg text-xs font-mono text-ink-800 truncate">
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
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-moss-700 text-white font-bold text-[12px] hover:bg-moss-800 transition-all cursor-pointer border-none outline-none"
              >
                <Upload className="h-4 w-4" />
                Attach Legal Proof File (PDF / Image)
              </button>
            </div>

            {/* PROPERTY PICTURE PROMPT & PHOTO PICKER */}
            <div className="rounded-xl border border-moss-700/20 bg-moss-700/[0.03] p-5">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[13px] font-bold text-ink-900 flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-moss-700" />
                  <span>Property Photos & Pictures *</span>
                </label>
                <span className="text-[11px] font-bold text-moss-700 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Photo Attached
                </span>
              </div>
              <p className="text-[12px] text-ink-700 mb-4 leading-relaxed">
                Add up to 5 high-quality pictures of your rental unit (rooms, compound, bathroom, etc.). You can select which one will be the cover image.
              </p>

              {/* Photo Previews */}
              {propertyPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {propertyPhotos.map((photoUrl, idx) => (
                    <div key={idx} className={`relative h-28 w-full overflow-hidden rounded-xl border-2 transition-all ${idx === coverPhotoIndex ? 'border-emerald-500 shadow-md' : 'border-ink-200'}`}>
                      <img
                        src={photoUrl}
                        alt={`Property Preview ${idx}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      
                      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => setCoverPhotoIndex(idx)}
                          className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 transition-colors ${idx === coverPhotoIndex ? 'bg-emerald-500 text-white' : 'bg-black/50 text-white hover:bg-black/80'}`}
                        >
                          {idx === coverPhotoIndex ? (
                            <><Check className="h-3 w-3" /> Cover</>
                          ) : "Set Cover"}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setPropertyPhotos(prev => prev.filter((_, i) => i !== idx));
                            if (coverPhotoIndex === idx) setCoverPhotoIndex(0);
                            else if (coverPhotoIndex > idx) setCoverPhotoIndex(coverPhotoIndex - 1);
                          }}
                          className="bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* File Upload Trigger */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              {propertyPhotos.length < 5 && (
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-moss-700 text-white font-bold text-[12.5px] hover:bg-moss-800 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Photos from Device (Max 5)
                  </button>
                </div>
              )}

              {/* Sample Photo Pickers */}
              {propertyPhotos.length < 5 && (
                <div className="mt-3">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-2">
                    Or pick a recommended sample photo:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_PHOTOS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!propertyPhotos.includes(preset.url)) {
                            setPropertyPhotos(prev => [...prev, preset.url]);
                          }
                        }}
                        className={`text-[11.5px] font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          propertyPhotos.includes(preset.url)
                            ? "bg-moss-700 text-white border-moss-700 shadow-xs"
                            : "bg-white text-ink-700 border-ink-200 hover:border-moss-500"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {photoError && (
                <p className="mt-2 text-[12px] font-semibold text-rose-600">{photoError}</p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <span className="mb-3 block text-[13px] font-medium text-ink-700">
              Does this property already have a tenant?
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOccupied(true)}
                className={`rounded-lg border p-4 text-left transition-colors ${occupied === true
                  ? "border-moss-600 bg-moss-600/[0.04]"
                  : "border-ink-200 hover:border-ink-400"
                  }`}
              >
                <div className="font-semibold text-ink-900">Yes</div>
                <div className="mt-1 text-[12px] text-ink-700">
                  Invite them to link their profile
                </div>
              </button>
              <button
                type="button"
                onClick={() => setOccupied(false)}
                className={`rounded-lg border p-4 text-left transition-colors ${occupied === false
                  ? "border-moss-600 bg-moss-600/[0.04]"
                  : "border-ink-200 hover:border-ink-400"
                  }`}
              >
                <div className="font-semibold text-ink-900">
                  No, it&rsquo;s vacant
                </div>
                <div className="mt-1 text-[12px] text-ink-700">
                  List it publicly to find a tenant
                </div>
              </button>
            </div>
          </div>

          {occupied === true && (
            <div className="mt-6 space-y-5 rounded-xl bg-cream-50 p-5">
              <p className="text-[13px] font-medium text-ink-900">
                Invite your current tenant
              </p>
              <Input
                id="tenantName"
                label="Tenant's name"
                placeholder="Emeka O."
                maxLength={50}
                onInput={(e) => e.target.value = e.target.value.replace(/[0-9]/g, '')}
                required
              />
              <Input
                id="tenantContact"
                label="Tenant's phone or email"
                placeholder="emeka@example.com"
                maxLength={100}
                required
              />
              <Input
                id="leaseStart"
                label="Lease start date"
                type="date"
                required
              />
            </div>
          )}

          {occupied === false && (
            <div className="mt-6 space-y-5 rounded-xl bg-cream-50 p-5">
              <p className="text-[13px] font-medium text-ink-900">
                Listing details
              </p>
              <Input
                id="description"
                label="Short description"
                placeholder="What makes this place great?"
              />
              <Input
                id="availableFrom"
                label="Available from"
                type="date"
                required
              />
            </div>
          )}

          <Button
            type="submit"
            className="mt-8 w-full"
            disabled={occupied === null}
          >
            {occupied === true
              ? "Send Invite & Add Property"
              : occupied === false
                ? "Publish Listing"
                : "Add Property"}
          </Button>
        </form>
      </div>
    </div>
  );
}
