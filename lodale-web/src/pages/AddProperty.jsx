import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import gsap from "gsap";
import { Logo } from "../components/Logo";
import Input from "../components/Input";
import Button from "../components/Button";
import { LISTINGS } from "../data/listings";

export default function AddProperty() {
  const navigate = useNavigate();
  const [occupied, setOccupied] = useState(null); // null | true | false
  const [rentCycle, setRentCycle] = useState("annual"); // "annual" | "monthly"
  const [isSubmitted, setIsSubmitted] = useState(false);

  const successOverlayRef = useRef(null);
  const checkIconRef = useRef(null);
  const textContainerRef = useRef(null);

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
    const currentListings = saved ? JSON.parse(saved) : LISTINGS;
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
