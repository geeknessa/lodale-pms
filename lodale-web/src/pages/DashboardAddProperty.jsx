import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Sparkles, Loader2, User, Key, Building2, Camera, ImagePlus, Upload, Check, Clock, AlertCircle } from "lucide-react";
import gsap from "gsap";
import { Logo } from "../components/Logo";
import Input from "../components/Input";
import Button from "../components/Button";
import { LISTINGS } from "../data/listings";
import { propertyService } from "../services/propertyService";
import "./DashboardAddProperty.css";

const PRESET_PHOTOS = [
  { label: "Modern Villa", url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" },
  { label: "Luxury Apartment", url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80" },
  { label: "Gated Residency", url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80" },
  { label: "Cozy Studio", url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80" },
];

const COMMON_AMENITIES = [
  "Prepaid Meter",
  "24/7 Security",
  "24/7 Power / Generator",
  "Clean Water / Borehole",
  "Air Conditioning",
  "Parking Space",
  "Fitted Kitchen",
  "POP Ceiling",
  "Swimming Pool",
  "Gym / Fitness Facility",
  "Balcony",
  "CCTV Surveillance",
];

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
    e.preventDefault();
    setFormError("");

    const target = e.target;
    const address = target.elements.address?.value?.trim() || "";
    const city = target.elements.city?.value?.trim() || "";
    const stateVal = target.elements.state?.value?.trim() || stateName || "Lagos";
    const type = target.elements.type?.value?.trim() || "";
    const rent = target.elements.rent?.value?.trim() || "";
    const bedrooms = target.elements.bedrooms?.value?.trim() || "";
    const bathsVal = target.elements.bathrooms?.value?.trim() || bathrooms || "1";
    const descVal = target.elements.description?.value?.trim() || description.trim() || "";

    const numericRent = Number(rent.replace(/[^0-9]/g, ""));
    const numericBedrooms = Number(bedrooms);
    const numericBathrooms = Number(bathsVal);

    if (!address) {
      setFormError("Property Address / Street Location is required.");
      return;
    }
    if (!city) {
      setFormError("City / Area is required.");
      return;
    }
    if (!type) {
      setFormError("Property Type is required.");
      return;
    }
    if (!rent || isNaN(numericRent) || numericRent <= 0) {
      setFormError("A valid Rent Amount is required.");
      return;
    }
    if (!bedrooms || isNaN(numericBedrooms) || numericBedrooms <= 0) {
      setFormError("Number of Bedrooms is required.");
      return;
    }
    if (!bathsVal || isNaN(numericBathrooms) || numericBathrooms <= 0) {
      setFormError("Number of Bathrooms is required.");
      return;
    }
    if (!docName || !docName.trim()) {
      setFormError("Please upload your proof of ownership legal document (PDF / Image) before submitting.");
      return;
    }
    if (!propertyPhoto) {
      setFormError("Please attach a property photo before submitting.");
      return;
    }

    const ownershipDocString = `${docType} (${docName})`;
    const dbUserId = localStorage.getItem("db_user_id");

    const amenitiesList = selectedAmenities.length > 0 ? selectedAmenities : ["Basic Amenities"];
    const finalDescription = descVal || `${numericBedrooms} Bedroom, ${numericBathrooms} Bathroom ${type} located at ${address}, ${city}.`;

    const propertyPayload = {
      title: address,
      description: finalDescription,
      address_line1: address,
      city: city,
      state: stateVal,
      rent_amount: numericRent,
      bedrooms: numericBedrooms,
      bathrooms: numericBathrooms,
      property_type: type.toLowerCase().replace(/\s+/g, '_'),
      amenities: amenitiesList,
      ownership_doc: ownershipDocString,
      ownership_doc_url: docDataUrl,
      cover_image: propertyPhoto || PRESET_PHOTOS[0].url,
      ...(dbUserId ? { landlord_id: dbUserId } : {}),
    };

    try {
      await propertyService.createProperty(propertyPayload);
    } catch (err) {
      console.warn("Backend API error, storing locally fallback:", err);
    }

    const formattedRent = rent.startsWith("₦") ? rent : "₦" + numericRent.toLocaleString();

    // Create a new listing object for local cache
    const newListing = {
      id: address.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(),
      title: address,
      description: finalDescription,
      location: `${city}, ${stateVal}`,
      price: formattedRent + (rentCycle === "annual" ? "/yr" : "/mo"),
      image: propertyPhoto || PRESET_PHOTOS[0].url,
      beds: numericBedrooms,
      baths: numericBathrooms,
      status: "pending_review",
      ownership_doc: ownershipDocString,
      ownership_doc_url: docDataUrl,
      docType: docType,
      docName: docName,
      docDataUrl: docDataUrl,
      amenities: amenitiesList,
      landlord: {
        name: localStorage.getItem("username") || "Ada K.",
        score: 5.0,
        reviews: 1,
      },
    };

    // Load existing list, append and save back to localStorage
    const saved = localStorage.getItem("properties");
    const currentListings = saved ? JSON.parse(saved) : [];
    const updatedListings = [newListing, ...currentListings];
    localStorage.setItem("properties", JSON.stringify(updatedListings));

    setIsSubmitted(true);
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
              <Sparkles style={{ height: 14, width: 14 }} />
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
                light={false}
                required
              />

              <div className="dap-grid-2">
                <Input
                  id="city"
                  label="City / Area *"
                  placeholder="e.g. Lekki, Victoria Island, Yaba, Ikeja"
                  light={false}
                  required
                />
                <Input
                  id="state"
                  label="State / Region *"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. Lagos, Abuja, Rivers"
                  light={false}
                  required
                />
              </div>

              <div className="dap-grid-2">
                <Input
                  id="type"
                  label="Property Type *"
                  placeholder="e.g. Apartment, Duplex, Villa, Studio"
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
                          ? "bg-[#3A5A40] dark:bg-[#E5C583] text-white dark:text-[#0B1512] shadow-xs"
                          : "text-ink-700 dark:text-cream-100/70"
                          }`}
                      >
                        Annual
                      </button>
                      <button
                        type="button"
                        onClick={() => setRentCycle("monthly")}
                        className={`px-2 py-0.5 text-[10.5px] font-bold rounded transition-all cursor-pointer border-none outline-none ${rentCycle === "monthly"
                          ? "bg-[#3A5A40] dark:bg-[#E5C583] text-white dark:text-[#0B1512] shadow-xs"
                          : "text-ink-700 dark:text-cream-100/70"
                          }`}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>
                  <Input
                    id="rent"
                    placeholder={rentCycle === "annual" ? "₦2,500,000 / year" : "₦200,000 / month"}
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
                  placeholder="e.g. 2"
                  light={false}
                  required
                />
                <Input
                  id="bathrooms"
                  label="Bathrooms *"
                  type="number"
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your property layout, unique features, or rental guidelines..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-[#16241F] border border-ink-200 dark:border-white/15 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-cream-100/40 outline-none focus:border-moss-600 dark:focus:border-[#E5C583] transition-all"
                />
              </div>

              {/* PROPERTY AMENITIES SELECTION SECTION */}
              <div className="rounded-xl border border-[#3A5A40]/30 dark:border-white/10 bg-[#3A5A40]/5 dark:bg-white/5 p-5 animate-form-field">
                <label className="block text-[13px] font-bold text-ink-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
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
                          ? "bg-[#3A5A40] text-white border-[#3A5A40] dark:bg-[#E5C583] dark:text-[#0B1512] dark:border-[#E5C583] shadow-xs"
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
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] font-bold text-[12.5px] hover:bg-[#1E382A] dark:hover:bg-[#d8b672] transition-all cursor-pointer shadow-xs active:scale-95 border-none outline-none"
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
                          ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] border-transparent shadow-xs"
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
                    light={false}
                    required
                  />
                  <Input
                    id="tenantContact"
                    label="Tenant's Email or Phone"
                    placeholder="e.g. emeka@domain.com"
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
