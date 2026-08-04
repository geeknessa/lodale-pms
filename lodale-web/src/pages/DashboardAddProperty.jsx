import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Sparkles, Loader2, User, Key, Building2 } from "lucide-react";
import gsap from "gsap";
import { Logo } from "../components/Logo";
import Input from "../components/Input";
import Button from "../components/Button";
import { LISTINGS } from "../data/listings";
import "./DashboardAddProperty.css";

export default function DashboardAddProperty() {
  const navigate = useNavigate();
  const [occupied, setOccupied] = useState(null); // null | true | false
  const [isSubmitted, setIsSubmitted] = useState(false);

  const cardRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const successOverlayRef = useRef(null);
  const checkIconRef = useRef(null);
  const textContainerRef = useRef(null);

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
