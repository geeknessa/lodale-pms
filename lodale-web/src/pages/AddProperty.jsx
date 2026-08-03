import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Sparkles, Loader2, Camera, ImagePlus, Upload, Check } from "lucide-react";
import gsap from "gsap";
import { Logo } from "../components/Logo";
import Input from "../components/Input";
import Button from "../components/Button";
import { LISTINGS } from "../data/listings";

const PRESET_PHOTOS = [
  { label: "Modern Villa", url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" },
  { label: "Luxury Apartment", url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80" },
  { label: "Gated Residency", url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80" },
  { label: "Cozy Studio", url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80" },
];

export default function AddProperty() {
  const navigate = useNavigate();
  const [occupied, setOccupied] = useState(null); // null | true | false
  const [rentCycle, setRentCycle] = useState("annual"); // "annual" | "monthly"
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Property picture prompt state
  const [propertyPhoto, setPropertyPhoto] = useState(PRESET_PHOTOS[0].url);
  const [photoPreview, setPhotoPreview] = useState(PRESET_PHOTOS[0].url);
  const [photoError, setPhotoError] = useState("");

  const fileInputRef = useRef(null);
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

  function handleSubmit(e) {
    e.preventDefault();
    const target = e.target;
    const address = target.elements.address.value;
    const rent = target.elements.rent.value;
    const bedrooms = target.elements.bedrooms.value;

    const formattedRent = rent.startsWith("₦") ? rent : "₦" + Number(rent.replace(/[^0-9]/g, "")).toLocaleString();

    // Create a new listing object
    const newListing = {
      id: address.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(),
      title: address,
      location: "Lagos, Nigeria",
      price: formattedRent + "/mo",
      image: propertyPhoto || PRESET_PHOTOS[0].url,
      beds: Number(bedrooms),
      baths: 2,
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
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B1512] text-white font-sans px-6"
      >
        {/* Background glow animations */}
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-moss-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-cream-50/5 blur-[100px] pointer-events-none" />

        <div className="flex flex-col items-center max-w-sm text-center relative z-10">
          {/* Animated Outer Ring */}
          <div
            ref={checkIconRef}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-moss-800 border-2 border-moss-500/30 mb-8 relative shadow-[0_0_50px_rgba(58,90,64,0.25)]"
          >
            <CheckCircle2 className="h-12 w-12 text-[#E5C583]" />
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-6 w-6 text-amber-300 animate-pulse" />
            </div>
          </div>

          <div ref={textContainerRef} className="space-y-4">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
              Property Registered!
            </h1>
            <p className="text-[14px] leading-relaxed text-[#A3BCA7]">
              Your dashboard ledger is being configured and ownership stamp applied.
            </p>

            <div className="flex items-center justify-center gap-2 pt-6">
              <Loader2 className="h-4 w-4 animate-spin text-[#E5C583]" />
              <span className="text-[12px] font-medium tracking-wide uppercase text-ink-300">
                Opening Landlord Suite...
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

          <div className="mt-6 space-y-5">
            <Input
              id="address"
              label="Address / nickname"
              placeholder="2-Bed Flat, Lekki Phase 1"
              required
            />
            <Input
              id="type"
              label="Property type"
              placeholder="Apartment, duplex, etc."
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="rent"
                    className="block text-[13px] font-medium text-ink-700"
                  >
                    Rent amount ({rentCycle === "annual" ? "per annum" : "per month"})
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
                  placeholder={
                    rentCycle === "annual"
                      ? "₦2,500,000 / year"
                      : "₦200,000 / month"
                  }
                  required
                />
              </div>

              <div>
                <Input
                  id="bedrooms"
                  label="Bedrooms"
                  type="number"
                  placeholder="2"
                  required
                />
              </div>
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
                Add a high-quality picture of your rental unit so prospective tenants can inspect layout details.
              </p>

              {/* Photo Preview */}
              {photoPreview && (
                <div className="relative mb-4 h-44 w-full overflow-hidden rounded-xl border border-ink-200 shadow-sm group">
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
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-moss-700 text-white font-bold text-[12.5px] hover:bg-moss-800 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo from Device
                </button>
              </div>

              {/* Sample Photo Pickers */}
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
                        setPropertyPhoto(preset.url);
                        setPhotoPreview(preset.url);
                      }}
                      className={`text-[11.5px] font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        photoPreview === preset.url
                          ? "bg-moss-700 text-white border-moss-700 shadow-xs"
                          : "bg-white text-ink-700 border-ink-200 hover:border-moss-500"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
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
                required
              />
              <Input
                id="tenantContact"
                label="Tenant's phone or email"
                placeholder="emeka@example.com"
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
