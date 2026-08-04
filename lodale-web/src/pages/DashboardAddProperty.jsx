import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Sparkles, Loader2, User, Key, Building2, Camera, ImagePlus, Upload, Check } from "lucide-react";
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

export default function DashboardAddProperty() {
  const navigate = useNavigate();
  const [occupied, setOccupied] = useState(null); // null | true | false
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Property picture prompt state
  const [propertyPhoto, setPropertyPhoto] = useState(PRESET_PHOTOS[0].url);
  const [photoPreview, setPhotoPreview] = useState(PRESET_PHOTOS[0].url);
  const [photoError, setPhotoError] = useState("");

  const fileInputRef = useRef(null);
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
    const target = e.target;
    const address = target.elements.address.value;
    const rent = target.elements.rent.value;
    const bedrooms = target.elements.bedrooms.value;

    const numericRent = Number(rent.replace(/[^0-9]/g, "")) || 500000;

    const propertyPayload = {
      title: address,
      address_line1: address,
      city: "Lagos",
      state: "Lagos",
      rent_amount: numericRent,
      bedrooms: Number(bedrooms) || 1,
      bathrooms: 2,
      property_type: "apartment",
      amenities: ["Prepaid Meter", "24/7 Security"],
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
      location: "Lagos, Nigeria",
      price: formattedRent + "/mo",
      image: propertyPhoto || PRESET_PHOTOS[0].url,
      beds: Number(bedrooms),
      baths: 2,
      status: "pending_review",
      amenities: ["Prepaid Meter", "24/7 Security"],
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
        gsap.to(checkIconRef.current, {
          scale: 1.05,
          duration: 1,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1
        });
      }

      if (textContainerRef.current) {
        gsap.fromTo(textContainerRef.current.children, 
          { y: 20, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: "power2.out", delay: 0.6 }
        );
      }

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
      <div ref={successOverlayRef} className="dap-success-screen">
        <div className="dap-success-glow-1" />
        <div className="dap-success-glow-2" />

        <div className="dap-success-inner">
          <div ref={checkIconRef} className="dap-success-icon-ring">
            <CheckCircle2 className="check" />
            <div className="dap-success-sparkle">
              <Sparkles style={{ animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" }} />
            </div>
          </div>

          <div ref={textContainerRef} className="dap-success-texts">
            <h1 className="dap-success-heading">Property Added!</h1>
            <p className="dap-success-body">
              Your portfolio list is being updated and details published.
            </p>
            <div className="dap-success-loader-row">
              <Loader2 style={{ animation: "spin 1s linear infinite" }} />
              <span className="dap-success-loader-lbl">Returning to Dashboard...</span>
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
            
            {/* Core Fields */}
            <div className="dap-fields-group animate-form-field">
              <Input
                id="address"
                label="Address / Nickname"
                placeholder="e.g. 2-Bed Flat, Lekki Phase 1"
                light={false}
                required
              />
              <Input
                id="type"
                label="Property Type"
                placeholder="e.g. Apartment, duplex, duplex villa"
                light={false}
                required
              />
              <div className="dap-grid-2">
                <Input
                  id="rent"
                  label="Monthly Rent"
                  placeholder="₦200,000"
                  light={false}
                  required
                />
                <Input
                  id="bedrooms"
                  label="Bedrooms"
                  type="number"
                  placeholder="2"
                  light={false}
                  required
                />
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
                        className={`text-[11.5px] font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer outline-none ${
                          photoPreview === preset.url
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
