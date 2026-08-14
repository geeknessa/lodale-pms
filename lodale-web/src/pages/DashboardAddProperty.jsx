import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, User, Key, Building2, Camera, Upload, Check, Clock, AlertCircle } from "lucide-react";
import gsap from "gsap";
import { Logo } from "../components/Logo";
import Input from "../components/Input";
import Button from "../components/Button";
import SearchableDropdown from "../components/SearchableDropdown";
import DropdownWithOther from "../components/DropdownWithOther";
import { ALL_NIGERIAN_STATES, NIGERIAN_STATES_CITIES } from "../utils/nigerianStatesCities";
import { handlePropertySubmit, PRESET_PHOTOS, COMMON_AMENITIES } from "../utils/propertyUtils";
import "./DashboardAddProperty.css";

export default function DashboardAddProperty() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [occupied, setOccupied] = useState(null); // null | true | false
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const [displayName, setDisplayName] = useState("");

  // Property Type Selection State
  const [propertyType, setPropertyType] = useState("single_house"); // single_house, apartment_building, estate, hostel, commercial_building, boys_quarters
  const [houseSubtype, setHouseSubtype] = useState("duplex"); // bungalow, duplex, terrace, detached, other
  const [isMultiUnit, setIsMultiUnit] = useState(false);

  const getUnitNamePlaceholder = () => {
    if (propertyType === "single_house") {
      return houseSubtype === "duplex" ? "e.g. House A1 or Main Duplex" : "e.g. House A1";
    }
    if (propertyType === "apartment_building" || propertyType === "estate") {
      return "e.g. Flat 101";
    }
    if (propertyType === "hostel") {
      return "e.g. Room 12";
    }
    if (propertyType === "commercial_building") {
      return "e.g. Shop 4 or Suite 201";
    }
    if (propertyType === "boys_quarters") {
      return "e.g. BQ Unit 1";
    }
    return "e.g. Flat 101";
  };

  // GPS Location State
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Dynamic Property Specifications State
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [rent, setRent] = useState("");
  const [description, setDescription] = useState("");
  const [stateName, setStateName] = useState("Lagos");
  const [cityName, setCityName] = useState("");
  const [address, setAddress] = useState("");

  // Optional Blocks / Buildings State
  const [blocksList, setBlocksList] = useState([]);
  const [newBlockName, setNewBlockName] = useState("");

  // Units State & Entry Mode
  const [unitAddTab, setUnitAddTab] = useState("manual"); // "manual" | "generator" | "csv"
  const [unitsList, setUnitsList] = useState([]);
  const [selectedUnitIndices, setSelectedUnitIndices] = useState([]);

  const toggleSelectUnit = (index) => {
    setSelectedUnitIndices((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const toggleSelectAllUnits = () => {
    if (selectedUnitIndices.length === unitsList.length) {
      setSelectedUnitIndices([]);
    } else {
      setSelectedUnitIndices(unitsList.map((_, idx) => idx));
    }
  };

  const handleDeleteSelectedUnits = () => {
    if (selectedUnitIndices.length === 0) return;
    setUnitsList((prev) => prev.filter((_, idx) => !selectedUnitIndices.includes(idx)));
    setSelectedUnitIndices([]);
  };

  const handleDeleteAllUnits = () => {
    setUnitsList([]);
    setSelectedUnitIndices([]);
  };

  // Manual Unit Entry Form
  const [manualUnitName, setManualUnitName] = useState("");
  const [manualBlockName, setManualBlockName] = useState("");
  const [manualBeds, setManualBeds] = useState("");
  const [manualBaths, setManualBaths] = useState("");
  const [manualRent, setManualRent] = useState("");

  // Bulk Generator Form
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [bulkStartNum, setBulkStartNum] = useState("");
  const [bulkCount, setBulkCount] = useState("");
  const [bulkBlockName, setBulkBlockName] = useState("");
  const [bulkBeds, setBulkBeds] = useState("");
  const [bulkBaths, setBulkBaths] = useState("");
  const [bulkRent, setBulkRent] = useState("");

  // CSV Unit Upload State
  const [csvFileName, setCsvFileName] = useState("");
  const [csvError, setCsvError] = useState("");
  const csvFileInputRef = useRef(null);

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
  const [propertyPhotos, setPropertyPhotos] = useState([]);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);
  const [photoError, setPhotoError] = useState("");

  // Property Rules
  const [rules, setRules] = useState("");

  // Rent cycle state
  const [rentCycle, setRentCycle] = useState("annual"); // "annual" | "monthly"

  // Proof of ownership legal papers state
  const [docType, setDocType] = useState("Deed of Assignment");
  const [docName, setDocName] = useState("");
  const [docDataUrl, setDocDataUrl] = useState("");
  const [docUploaded, setDocUploaded] = useState(false);

  // Step 5 Occupancy Subform States
  const [tenantName, setTenantName] = useState("");
  const [tenantContact, setTenantContact] = useState("");
  const [leaseStartDate, setLeaseStartDate] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");

  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const cardRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const successOverlayRef = useRef(null);
  const checkIconRef = useRef(null);
  const textContainerRef = useRef(null);

  // Sync isMultiUnit when property type changes
  useEffect(() => {
    if (["apartment_building", "estate", "hostel", "commercial_building"].includes(propertyType)) {
      setIsMultiUnit(true);
    } else {
      setIsMultiUnit(false);
    }
  }, [propertyType]);

  const handleAddBlock = () => {
    const trimmed = newBlockName.trim();
    if (trimmed && !blocksList.some(b => b.name.toLowerCase() === trimmed.toLowerCase())) {
      setBlocksList(prev => [...prev, { name: trimmed, description: "" }]);
      setNewBlockName("");
    }
  };

  const handleRemoveBlock = (blockNameToRemove) => {
    setBlocksList(prev => prev.filter(b => b.name !== blockNameToRemove));
    setUnitsList(prev => prev.map(u => u.block_name === blockNameToRemove ? { ...u, block_name: "" } : u));
  };

  const handleAddSingleUnit = () => {
    if (!manualUnitName.trim()) {
      setFormError("Unit name (e.g. Flat 101 or House A1) is required.");
      return;
    }
    const newUnit = {
      unit_name: manualUnitName.trim(),
      block_name: manualBlockName,
      bedrooms: Number(manualBeds) || 1,
      bathrooms: Number(manualBaths) || 1,
      rent_amount: Number(manualRent.replace(/[^0-9]/g, "")) || 0,
      rent_period: rentCycle === "annual" ? "annually" : "monthly",
      status: "vacant"
    };
    setUnitsList(prev => [...prev, newUnit]);
    setManualUnitName("");
    setManualRent("");
    setFormError("");
  };

  const handleGenerateBulkUnits = () => {
    const count = Number(bulkCount) || 0;
    const start = Number(bulkStartNum) || 101;
    const prefix = bulkPrefix;
    const rentVal = Number(bulkRent.replace(/[^0-9]/g, "")) || 0;

    if (count <= 0) {
      setFormError("Please enter a valid unit count to generate.");
      return;
    }

    const generated = [];
    for (let i = 0; i < count; i++) {
      generated.push({
        unit_name: `${prefix}${start + i}`,
        block_name: bulkBlockName,
        bedrooms: Number(bulkBeds) || 1,
        bathrooms: Number(bulkBaths) || 1,
        rent_amount: rentVal,
        rent_period: rentCycle === "annual" ? "annually" : "monthly",
        status: "vacant"
      });
    }

    setUnitsList(prev => [...prev, ...generated]);
    setFormError("");
  };

  const handleRemoveUnit = (indexToRemove) => {
    setUnitsList(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setSelectedUnitIndices((prev) =>
      prev.filter((i) => i !== indexToRemove).map((i) => (i > indexToRemove ? i - 1 : i))
    );
  };

  const handleDownloadCsvTemplate = () => {
    const csvHeader = "unit_name,block_name,bedrooms,bathrooms,rent_amount\nFlat 101,Block A,2,2,2500000\nFlat 102,Block A,2,2,2500000\nFlat 201,Block B,3,3,3200000\n";
    const blob = new Blob([csvHeader], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Lodale_Units_Upload_Template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setCsvError("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
          setCsvError("CSV file appears to be empty or missing data rows.");
          return;
        }

        const parsedUnits = [];
        const startIdx = lines[0].toLowerCase().includes("unit_name") ? 1 : 0;

        for (let i = startIdx; i < lines.length; i++) {
          const parts = lines[i].split(",").map(p => p.trim().replace(/^["']|["']$/g, ''));
          if (parts.length >= 1 && parts[0]) {
            parsedUnits.push({
              unit_name: parts[0],
              block_name: parts[1] || "",
              bedrooms: Number(parts[2]) || 1,
              bathrooms: Number(parts[3]) || 1,
              rent_amount: Number(parts[4]) || 0,
              rent_period: rentCycle === "annual" ? "annually" : "monthly",
              status: "vacant"
            });
          }
        }

        if (parsedUnits.length > 0) {
          setUnitsList(prev => [...prev, ...parsedUnits]);
          setCsvError("");
        } else {
          setCsvError("Could not parse any valid units from CSV.");
        }
      } catch (err) {
        setCsvError("Failed to parse CSV file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setFormError("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setIsDetectingGps(false);
        setFormError("");
      },
      (error) => {
        setIsDetectingGps(false);
        setFormError("Could not fetch GPS coordinates. Please type them manually.");
      }
    );
  };

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
      if (file.size > 5 * 1024 * 1024) {
        setFormError("Proof of Ownership document exceeds 5MB limit.");
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

  // Step Validation logic before navigating forward
  const validateStep = (stepNumber) => {
    setFormError("");
    if (stepNumber === 1) {
      if (!displayName.trim()) {
        setFormError("Property / Estate Name is required.");
        return false;
      }
      if (!address.trim()) {
        setFormError("Property Address / Street Location is required.");
        return false;
      }
      if (!cityName.trim()) {
        setFormError("City / Area is required.");
        return false;
      }
      return true;
    }

    if (stepNumber === 2) {
      if (isMultiUnit && unitsList.length === 0) {
        setFormError("Please add at least one unit to your multi-unit property (via Single Unit entry, Generator, or CSV Upload).");
        return false;
      }
      if (!isMultiUnit) {
        const numericRent = Number(rent.replace(/[^0-9]/g, ""));
        if (!rent || isNaN(numericRent) || numericRent <= 0) {
          setFormError("A valid Asking Rent amount is required for single unit property.");
          return false;
        }
      }
      return true;
    }

    if (stepNumber === 3) {
      // Step 3 (Amenities & Rules) is optional!
      return true;
    }

    if (stepNumber === 4) {
      if (!docName || !docName.trim()) {
        setFormError("Please upload your proof of ownership or management legal document (PDF / Image) before proceeding.");
        return false;
      }
      if (!propertyPhotos || propertyPhotos.length === 0) {
        setFormError("Please attach at least one property photo before proceeding.");
        return false;
      }
      return true;
    }

    return true;
  };

  const getIncompleteSteps = () => {
    const incomplete = [];
    if (!displayName?.trim() || !address?.trim() || !stateName?.trim() || !cityName?.trim()) {
      incomplete.push(1);
    }
    if (isMultiUnit) {
      if (!unitsList || unitsList.length === 0) incomplete.push(2);
    } else {
      const numericRent = Number(rent?.replace(/[^0-9]/g, ""));
      if (!rent || isNaN(numericRent) || numericRent <= 0) incomplete.push(2);
    }
    if (!docName?.trim() || !propertyPhotos || propertyPhotos.length === 0) {
      incomplete.push(4);
    }
    if (occupied === null) {
      incomplete.push(5);
    } else if (occupied === true) {
      if (!tenantName?.trim() || !tenantContact?.trim() || !leaseStartDate?.trim()) incomplete.push(5);
    } else if (occupied === false) {
      if (!availableFrom?.trim()) incomplete.push(5);
    }
    return incomplete;
  };

  const handleNextStep = () => {
    setFormError("");
    setCurrentStep(prev => Math.min(prev + 1, 5));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevStep = () => {
    setFormError("");
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSkipStep = () => {
    setFormError("");
    setCurrentStep(prev => Math.min(prev + 1, 5));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Mount animation sequence
  useEffect(() => {
    if (!isSubmitted) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(cardRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 }
      );
    }
  }, [isSubmitted]);

  // Animate step content on currentStep change
  useEffect(() => {
    gsap.fromTo(".dap-step-content",
      { y: 15, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
    );
  }, [currentStep]);

  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    setFormError("");

    // 1. Cross-Step Required Validation
    if (!displayName?.trim() || !address?.trim() || !stateName?.trim() || !cityName?.trim()) {
      setCurrentStep(1);
      setFormError("Step 1: Please fill all required fields (Display Name, Address, State, and City) before submitting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (isMultiUnit) {
      if (!unitsList || unitsList.length === 0) {
        setCurrentStep(2);
        setFormError("Step 2: Please add at least one unit to your multi-unit property before submitting.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    } else {
      const numericRent = Number(rent?.replace(/[^0-9]/g, ""));
      if (!rent || isNaN(numericRent) || numericRent <= 0) {
        setCurrentStep(2);
        setFormError("Step 2: A valid Asking Rent amount is required for single unit property.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    if (!docName?.trim()) {
      setCurrentStep(4);
      setFormError("Step 4: Please upload your proof of ownership or legal management document before submitting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!propertyPhotos || propertyPhotos.length === 0) {
      setCurrentStep(4);
      setFormError("Step 4: Please attach at least one property photo before submitting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (occupied === null) {
      setCurrentStep(5);
      setFormError("Step 5: Please select whether the property currently has active tenants or is vacant.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (occupied === true) {
      if (!tenantName?.trim() || !tenantContact?.trim() || !leaseStartDate?.trim()) {
        setCurrentStep(5);
        setFormError("Step 5: Please fill in all tenant invitation fields (Tenant Name, Email/Phone, and Lease Start Date).");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    if (occupied === false) {
      if (!availableFrom?.trim()) {
        setCurrentStep(5);
        setFormError("Step 5: Please specify the Available From date.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    // Build synthetic target elements for handlePropertySubmit compatibility
    const syntheticForm = {
      target: {
        elements: {
          address: { value: address },
          type: { value: propertyType },
          rent: { value: rent },
          bedrooms: { value: bedrooms },
          bathrooms: { value: bathrooms },
          city: { value: cityName },
          state: { value: stateName },
          description: { value: description }
        }
      }
    };

    await handlePropertySubmit({
      e: { preventDefault: () => { }, target: syntheticForm.target },
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
      propertyTypeVal: propertyType,
      latitudeVal: latitude,
      longitudeVal: longitude,
      blocksList,
      unitsList,
      isMultiUnit,
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
              <Clock style={{ height: 14, width: 14 }} />
              Pending Admin Review & Verification
            </div>

            <h2 className="dap-success-title">Property Submitted for Review!</h2>
            <p className="dap-success-desc">
              Your property registration and proof of ownership legal documents have been queued for administrative review. Before your listing is published, an administrator will verify your submitted documents.
            </p>

            <div className="dap-success-actions">
              <Button
                variant="primary"
                onClick={() => navigate("/dashboard/landlord")}
                className="w-full flex items-center justify-center gap-2 py-3 cursor-pointer"
              >
                Return to Landlord Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stepsInfo = [
    { step: 1, label: "Basic Info & GPS" },
    { step: 2, label: "Unit Setup" },
    { step: 3, label: "Amenities & Rules" },
    { step: 4, label: "Legal Proof & Media" },
    { step: 5, label: "Occupancy & Submit" }
  ];

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
            Register Property Portfolio
          </h1>
          <p ref={descRef} className="dap-card-desc">
            Step {currentStep} of 5 — {stepsInfo[currentStep - 1].label}
          </p>

          {/* STEPPER PROGRESS BAR & BADGES */}
          <div className="mt-6 mb-2">
            <div className="dap-stepper-progress-track">
              <div
                className="dap-stepper-progress-fill"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
            <div className="dap-stepper-container">
              {stepsInfo.map((sObj) => {
                const isActive = currentStep === sObj.step;
                const isCompleted = currentStep > sObj.step;
                return (
                  <button
                    key={sObj.step}
                    type="button"
                    onClick={() => {
                      setFormError("");
                      setCurrentStep(sObj.step);
                    }}
                    className={`dap-stepper-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                  >
                    <div className="dap-stepper-badge">
                      {isCompleted ? <Check className="h-4 w-4" /> : sObj.step}
                    </div>
                    <span className="dap-stepper-label hidden sm:block">{sObj.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="dap-form mt-6">

            {formError && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-start gap-2.5 mb-6 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="dap-step-content">

              {/* ────────────────────────────────────────────────────────────────
                  STEP 1: PROPERTY TYPE & BASIC INFO & GPS LOCATION
                 ──────────────────────────────────────────────────────────────── */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="mb-1 text-base font-bold text-ink-900 dark:text-white flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-moss-600 dark:text-[#E5C583]" /> Select Property Type *
                    </h2>
                    <p className="text-xs text-ink-600 dark:text-cream-100/70 mb-4">
                      Choose the building category that best describes your property structure.
                    </p>

                    {/* RESIDENTIAL CATEGORY */}
                    <div className="mb-4">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-moss-800 dark:text-[#E5C583] mb-2">
                        Residential Properties
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { id: "single_house", label: "House", desc: "Single house, bungalow, duplex, terrace, or detached house" },
                          { id: "apartment_building", label: "Apartment Building", desc: "Block of flats or multi-family building" },
                          { id: "estate", label: "Gated Estate", desc: "Housing estate with multiple blocks/houses" },
                          { id: "hostel", label: "Student Hostel", desc: "Student accommodation with rooms/wings" },
                          { id: "boys_quarters", label: "Boys Quarters (BQ)", desc: "Outbuilding / Self-contained BQ unit" }
                        ].map((typeObj) => {
                          const isSelected = propertyType === typeObj.id;
                          return (
                            <button
                              key={typeObj.id}
                              type="button"
                              onClick={() => setPropertyType(typeObj.id)}
                              className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer outline-none flex flex-col justify-between select-none ${isSelected
                                ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-[#2C4633] dark:border-[#E5C583] shadow-md scale-[1.02]"
                                : "bg-white dark:bg-[#16241F] text-ink-800 dark:text-cream-100/90 border-ink-200 dark:border-white/10 hover:border-moss-500"
                                }`}
                            >
                              <div>
                                <div className="font-bold text-xs mb-1 flex items-center justify-between">
                                  <span>{typeObj.label}</span>
                                  {isSelected && <Check className="h-3.5 w-3.5" />}
                                </div>
                                <div className={`text-[10.5px] leading-tight ${isSelected ? "text-cream-100/90 dark:text-[#1a2d26]" : "text-ink-500 dark:text-cream-100/60"}`}>
                                  {typeObj.desc}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* COMMERCIAL CATEGORY */}
                    <div className="mb-4">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-moss-800 dark:text-[#E5C583] mb-2">
                        Commercial Properties
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { id: "commercial_building", label: "Commercial Building", desc: "Offices, shops, plazas, or commercial spaces" }
                        ].map((typeObj) => {
                          const isSelected = propertyType === typeObj.id;
                          return (
                            <button
                              key={typeObj.id}
                              type="button"
                              onClick={() => setPropertyType(typeObj.id)}
                              className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer outline-none flex flex-col justify-between select-none ${isSelected
                                ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-[#2C4633] dark:border-[#E5C583] shadow-md scale-[1.02]"
                                : "bg-white dark:bg-[#16241F] text-ink-800 dark:text-cream-100/90 border-ink-200 dark:border-white/10 hover:border-moss-500"
                                }`}
                            >
                              <div>
                                <div className="font-bold text-xs mb-1 flex items-center justify-between">
                                  <span>{typeObj.label}</span>
                                  {isSelected && <Check className="h-3.5 w-3.5" />}
                                </div>
                                <div className={`text-[10.5px] leading-tight ${isSelected ? "text-cream-100/90 dark:text-[#1a2d26]" : "text-ink-500 dark:text-cream-100/60"}`}>
                                  {typeObj.desc}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* HOUSE SUBTYPE SELECTOR (WHEN HOUSE IS SELECTED) */}
                    {propertyType === "single_house" && (
                      <div className="p-4 rounded-xl border border-moss-200 dark:border-white/10 bg-moss-50/50 dark:bg-white/5 animate-in fade-in">
                        <label className="block text-[12px] font-bold text-ink-900 dark:text-white mb-1.5">
                          Specify House Type (Optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: "duplex", label: "Duplex" },
                            { id: "bungalow", label: "Bungalow" },
                            { id: "terrace", label: "Terrace / Semi-Detached" },
                            { id: "detached", label: "Detached House" },
                            { id: "other", label: "Other House" }
                          ].map((sub) => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => setHouseSubtype(sub.id)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer outline-none ${houseSubtype === sub.id
                                ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-[#2C4633] dark:border-[#E5C583] font-bold shadow-xs"
                                : "bg-white dark:bg-[#16241F] text-ink-700 dark:text-cream-100/80 border-ink-200 dark:border-white/15 hover:border-moss-500"
                                }`}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] text-ink-500 dark:text-cream-100/60 mt-2">
                          Note: You can manage your house as 1 single home or divide it into multiple units in the next step.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 rounded-xl border border-ink-200/60 dark:border-white/10 bg-cream-50/50 dark:bg-white/5 p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-moss-800 dark:text-[#E5C583]">
                      Location & Address Details
                    </h3>

                    <Input
                      id="displayName"
                      label="Property / Estate Display Name *"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Green Valley Estate or Sunshine Apartments"
                      maxLength={255}
                      required
                    />

                    <Input
                      id="address"
                      label="Full Street Address *"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Plot 14, Admiralty Way, Lekki Phase 1"
                      maxLength={255}
                      light={false}
                      required
                    />

                    <div className="dap-grid-2 z-20">
                      <SearchableDropdown
                        id="state"
                        label="State / Region *"
                        value={stateName}
                        onChange={(selectedState) => {
                          setStateName(selectedState);
                          // Reset city if state changes and current city is not in new state
                          const newCities = NIGERIAN_STATES_CITIES[selectedState] || [];
                          if (!newCities.includes(cityName)) {
                            setCityName("");
                          }
                        }}
                        options={ALL_NIGERIAN_STATES}
                        placeholder="Select or search state..."
                        required
                      />

                      <SearchableDropdown
                        id="city"
                        label="City / Area *"
                        value={cityName}
                        onChange={(selectedCity) => setCityName(selectedCity)}
                        options={NIGERIAN_STATES_CITIES[stateName] || []}
                        placeholder={stateName ? `Select area in ${stateName}...` : "Select state first..."}
                        required
                      />
                    </div>

                    {/* GPS Coordinates Section */}
                    <div className="pt-2 border-t border-ink-200/50 dark:border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-[12px] font-bold text-ink-900 dark:text-white">
                          GPS / Map Coordinates (Optional)
                        </label>
                        <button
                          type="button"
                          onClick={handleDetectGps}
                          disabled={isDetectingGps}
                          className="text-[11px] font-bold text-moss-700 dark:text-[#E5C583] hover:underline cursor-pointer flex items-center gap-1 bg-transparent border-none outline-none"
                        >
                          {isDetectingGps ? <Loader2 className="h-3 w-3 animate-spin" /> : "Auto-detect Current GPS"}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          id="latitude"
                          label="Latitude"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          placeholder="e.g. 6.454066"
                          light={false}
                        />
                        <Input
                          id="longitude"
                          label="Longitude"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          placeholder="e.g. 3.424583"
                          light={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────────
                  STEP 2: UNIT SETUP & PORTFOLIO STRUCTURE (PROPERTY-TYPE ADAPTIVE)
                 ──────────────────────────────────────────────────────────────── */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-[#3A5A40]/30 dark:border-white/10 bg-[#3A5A40]/5 dark:bg-white/5 p-5">

                    {/* CASE 1: DUPLEX (Ask clarifying question if 1 home or 2 flats) */}
                    {propertyType === "single_house" && houseSubtype === "duplex" && (
                      <div className="mb-6 pb-4 border-b border-[#3A5A40]/20 dark:border-white/10">
                        <h3 className="text-sm font-bold text-ink-900 dark:text-white flex items-center gap-2 mb-1">
                          <Building2 className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
                          <span>How is this Duplex managed? *</span>
                        </h3>
                        <p className="text-[12px] text-ink-600 dark:text-cream-100/70 mb-3">
                          Select whether this duplex is rented as one single home or divided into separate flats.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setIsMultiUnit(false)}
                            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left flex items-start gap-3 outline-none select-none ${!isMultiUnit
                              ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-[#2C4633] dark:border-[#E5C583] shadow-md"
                              : "bg-white dark:bg-[#16241F] text-ink-800 dark:text-cream-100/90 border-ink-200 dark:border-white/10 hover:border-moss-500"
                              }`}
                          >
                            <div className="mt-0.5 font-bold text-sm">1</div>
                            <div>
                              <div className="font-bold text-xs mb-0.5">Single Family Duplex</div>
                              <div className={`text-[11px] leading-tight ${!isMultiUnit ? "text-cream-100/90 dark:text-[#1a2d26]" : "text-ink-500 dark:text-cream-100/60"}`}>
                                Entire duplex rented to 1 tenant / family
                              </div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsMultiUnit(true)}
                            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left flex items-start gap-3 outline-none select-none ${isMultiUnit
                              ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-[#2C4633] dark:border-[#E5C583] shadow-md"
                              : "bg-white dark:bg-[#16241F] text-ink-800 dark:text-cream-100/90 border-ink-200 dark:border-white/10 hover:border-moss-500"
                              }`}
                          >
                            <div className="mt-0.5 font-bold text-sm">2+</div>
                            <div>
                              <div className="font-bold text-xs mb-0.5">Divided Duplex Flats</div>
                              <div className={`text-[11px] leading-tight ${isMultiUnit ? "text-cream-100/90 dark:text-[#1a2d26]" : "text-ink-500 dark:text-cream-100/60"}`}>
                                Duplex split into 2 or more separate units/flats
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CASE 2: MULTI-UNIT BUILDINGS (Apartment, Estate, Hostel, Commercial, or Divided Duplex) */}
                    {isMultiUnit ? (
                      <div className="space-y-6">

                        {/* Optional Blocks Section */}
                        <div className="bg-white dark:bg-[#16241F] p-4 rounded-xl border border-ink-200 dark:border-white/10">
                          <label className="block text-[12px] font-bold text-ink-900 dark:text-white mb-1">
                            Building Blocks / Floors (Optional)
                          </label>
                          <p className="text-[11px] text-ink-500 dark:text-cream-100/60 mb-3">
                            If your property has separate buildings, blocks, or floors (e.g. Block A, Block B, Floor 1), create them here.
                          </p>

                          <div className="flex gap-2 items-start mb-3">
                            <div className="flex-1">
                              <DropdownWithOther
                                value={newBlockName}
                                onChange={(val) => setNewBlockName(val)}
                                options={[
                                  "Block A", "Block B", "Block C", "Block D",
                                  "Floor 1", "Floor 2", "Floor 3", "Ground Floor",
                                  "Wing A", "Wing B", "East Wing", "West Wing"
                                ]}
                                placeholder="Select or type block/floor name..."
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleAddBlock}
                              className="px-4 py-2.5 h-[42px] text-xs font-bold rounded-xl bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#263b33] cursor-pointer border-none outline-none shrink-0"
                            >
                              + Add Block
                            </button>
                          </div>

                          {blocksList.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {blocksList.map((block, bIdx) => (
                                <span
                                  key={bIdx}
                                  className="px-3 py-1 bg-moss-50 dark:bg-white/10 text-moss-800 dark:text-[#E5C583] border border-moss-200 dark:border-white/15 rounded-lg text-xs font-semibold flex items-center gap-2"
                                >
                                  {block.name}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBlock(block.name)}
                                    className="text-rose-600 dark:text-rose-400 hover:text-rose-800 cursor-pointer font-bold ml-1"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Units Entry Tools */}
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div>
                              <span className="text-xs font-bold text-ink-900 dark:text-white">
                                How would you like to add your units? *
                              </span>
                              <p className="text-[11px] text-ink-500 dark:text-cream-100/60">
                                {unitsList.length} unit{unitsList.length !== 1 ? "s" : ""} currently added to portfolio
                              </p>
                            </div>

                            {/* Unit Entry Method Tabs */}
                            <div className="flex gap-1 bg-cream-100 dark:bg-white/10 p-1 rounded-lg">
                              <button
                                type="button"
                                onClick={() => setUnitAddTab("manual")}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer border-none outline-none ${unitAddTab === "manual" ? "bg-white dark:bg-[#16241F] text-ink-900 dark:text-white shadow-xs" : "text-ink-600 dark:text-cream-100/70"
                                  }`}
                              >
                                Add one at a time
                              </button>
                              <button
                                type="button"
                                onClick={() => setUnitAddTab("generator")}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer border-none outline-none ${unitAddTab === "generator" ? "bg-white dark:bg-[#16241F] text-ink-900 dark:text-white shadow-xs" : "text-ink-600 dark:text-cream-100/70"
                                  }`}
                              >
                                Generate many units
                              </button>
                              <button
                                type="button"
                                onClick={() => setUnitAddTab("csv")}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer border-none outline-none ${unitAddTab === "csv" ? "bg-white dark:bg-[#16241F] text-ink-900 dark:text-white shadow-xs" : "text-ink-600 dark:text-cream-100/70"
                                  }`}
                              >
                                Upload CSV/Excel
                              </button>
                            </div>
                          </div>

                          {/* TAB 1: MANUAL SINGLE UNIT ENTRY */}
                          {unitAddTab === "manual" && (
                            <div className="bg-white dark:bg-[#16241F] p-4 rounded-xl border border-ink-200 dark:border-white/10 mb-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-ink-700 dark:text-cream-100/80 mb-1">
                                    Unit Name or Number *
                                  </label>
                                  <input
                                    type="text"
                                    value={manualUnitName}
                                    onChange={(e) => setManualUnitName(e.target.value)}
                                    placeholder={getUnitNamePlaceholder()}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none placeholder:text-ink-400 dark:placeholder:text-cream-100/40"
                                  />
                                </div>

                                {blocksList.length > 0 && (
                                  <div>
                                    <label className="block text-[11px] font-bold text-ink-700 dark:text-cream-100/80 mb-1">
                                      Block / Building
                                    </label>
                                    <select
                                      value={manualBlockName}
                                      onChange={(e) => setManualBlockName(e.target.value)}
                                      className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                                    >
                                      <option value="">No Block</option>
                                      {blocksList.map((b, idx) => (
                                        <option key={idx} value={b.name}>{b.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                <div>
                                  <label className="block text-[11px] font-bold text-ink-700 dark:text-cream-100/80 mb-1">
                                    Bedrooms / Bathrooms
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      value={manualBeds}
                                      onChange={(e) => setManualBeds(e.target.value)}
                                      placeholder="Beds (e.g. 2)"
                                      className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none placeholder:text-ink-400 dark:placeholder:text-cream-100/40"
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      value={manualBaths}
                                      onChange={(e) => setManualBaths(e.target.value)}
                                      placeholder="Baths (e.g. 2)"
                                      className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none placeholder:text-ink-400 dark:placeholder:text-cream-100/40"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-ink-700 dark:text-cream-100/80 mb-1">
                                    Rent Amount (₦)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={manualRent}
                                    onChange={(e) => setManualRent(e.target.value)}
                                    placeholder="e.g. 2500000"
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none placeholder:text-ink-400 dark:placeholder:text-cream-100/40"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleAddSingleUnit}
                                className="w-full py-2.5 rounded-lg bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs cursor-pointer border-none outline-none hover:opacity-90 transition-all"
                              >
                                + Add Unit to List
                              </button>
                            </div>
                          )}

                          {/* TAB 2: BULK UNIT GENERATOR */}
                          {unitAddTab === "generator" && (
                            <div className="bg-white dark:bg-[#16241F] p-4 rounded-xl border border-ink-200 dark:border-white/10 mb-4">
                              <p className="text-[11px] text-ink-600 dark:text-cream-100/70 mb-3">
                                Quickly generate a series of sequential units (e.g. Flat 101 to Flat 110) in one click.
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                <div>
                                  <DropdownWithOther
                                    label="Name Prefix *"
                                    value={bulkPrefix}
                                    onChange={(val) => setBulkPrefix(val)}
                                    options={[
                                      "Flat ", "House ", "Room ", "Shop ",
                                      "Suite ", "Block ", "Floor ", "Unit ",
                                      "Apartment ", "Office ", "Villa "
                                    ]}
                                    placeholder="Select prefix..."
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-ink-700 dark:text-cream-100/80 mb-1">
                                    Start Number
                                  </label>
                                  <input
                                    type="number"
                                    value={bulkStartNum}
                                    onChange={(e) => setBulkStartNum(e.target.value)}
                                    placeholder="e.g. 101"
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none placeholder:text-ink-400 dark:placeholder:text-cream-100/40"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-ink-700 dark:text-cream-100/80 mb-1">
                                    Unit Count
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={bulkCount}
                                    onChange={(e) => setBulkCount(e.target.value)}
                                    placeholder="e.g. 6"
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none placeholder:text-ink-400 dark:placeholder:text-cream-100/40"
                                  />
                                </div>

                                {blocksList.length > 0 && (
                                  <div>
                                    <label className="block text-[11px] font-bold text-ink-700 dark:text-cream-100/80 mb-1">
                                      Block
                                    </label>
                                    <select
                                      value={bulkBlockName}
                                      onChange={(e) => setBulkBlockName(e.target.value)}
                                      className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                                    >
                                      <option value="">No Block</option>
                                      {blocksList.map((b, idx) => (
                                        <option key={idx} value={b.name}>{b.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-ink-700 dark:text-cream-100/80 mb-1">
                                    Bedrooms
                                  </label>
                                  <input
                                    type="number"
                                    value={bulkBeds}
                                    onChange={(e) => setBulkBeds(e.target.value)}
                                    placeholder="e.g. 2"
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none placeholder:text-ink-400 dark:placeholder:text-cream-100/40"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-ink-700 dark:text-cream-100/80 mb-1">
                                    Bathrooms
                                  </label>
                                  <input
                                    type="number"
                                    value={bulkBaths}
                                    onChange={(e) => setBulkBaths(e.target.value)}
                                    placeholder="e.g. 2"
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none placeholder:text-ink-400 dark:placeholder:text-cream-100/40"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-ink-700 dark:text-cream-100/80 mb-1">
                                    Rent / Unit (₦)
                                  </label>
                                  <input
                                    type="number"
                                    value={bulkRent}
                                    onChange={(e) => setBulkRent(e.target.value)}
                                    placeholder="e.g. 2500000"
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none placeholder:text-ink-400 dark:placeholder:text-cream-100/40"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleGenerateBulkUnits}
                                className="w-full py-2.5 rounded-lg bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs cursor-pointer border-none outline-none hover:opacity-90 transition-all"
                              >
                                ⚡ Generate {bulkCount || 0} Units Now
                              </button>
                            </div>
                          )}

                          {/* TAB 3: CSV FILE UPLOAD */}
                          {unitAddTab === "csv" && (
                            <div className="bg-white dark:bg-[#16241F] p-4 rounded-xl border border-ink-200 dark:border-white/10 mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-ink-700 dark:text-cream-100/80">
                                  Upload CSV spreadsheet of units
                                </span>
                                <button
                                  type="button"
                                  onClick={handleDownloadCsvTemplate}
                                  className="text-[11px] font-bold text-moss-700 dark:text-[#E5C583] hover:underline cursor-pointer bg-transparent border-none outline-none"
                                >
                                  Download Sample CSV Template
                                </button>
                              </div>

                              <input
                                ref={csvFileInputRef}
                                type="file"
                                accept=".csv,.txt"
                                onChange={handleCsvUpload}
                                className="hidden"
                              />

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => csvFileInputRef.current?.click()}
                                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs cursor-pointer flex items-center justify-center gap-2 border-none outline-none"
                                >
                                  <Upload className="h-4 w-4" />
                                  {csvFileName ? `File Selected: ${csvFileName}` : "Upload CSV File"}
                                </button>
                              </div>

                              {csvError && (
                                <p className="mt-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">{csvError}</p>
                              )}
                            </div>
                          )}

                          {/* DISPLAYED UNITS PREVIEW TABLE & BULK ACTIONS */}
                          {unitsList.length > 0 ? (
                            <div className="space-y-2">
                              {/* BULK ACTION BAR */}
                              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white dark:bg-[#16241F] rounded-xl border border-ink-200 dark:border-white/10 text-xs">
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-2 cursor-pointer font-bold text-ink-800 dark:text-cream-100 select-none">
                                    <input
                                      type="checkbox"
                                      checked={unitsList.length > 0 && selectedUnitIndices.length === unitsList.length}
                                      onChange={toggleSelectAllUnits}
                                      className="rounded border-ink-300 dark:border-white/20 text-moss-600 focus:ring-moss-500 cursor-pointer h-4 w-4"
                                    />
                                    <span>Select All ({unitsList.length})</span>
                                  </label>

                                  {selectedUnitIndices.length > 0 && (
                                    <span className="text-[11px] font-semibold text-ink-500 dark:text-cream-100/60">
                                      • {selectedUnitIndices.length} selected
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {selectedUnitIndices.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={handleDeleteSelectedUnits}
                                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-200 cursor-pointer transition-all border-none outline-none"
                                    >
                                      Delete Selected ({selectedUnitIndices.length})
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={handleDeleteAllUnits}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 dark:bg-rose-700 text-white hover:bg-rose-700 dark:hover:bg-rose-800 cursor-pointer transition-all border-none outline-none"
                                  >
                                    Delete All Units
                                  </button>
                                </div>
                              </div>

                              {/* TABLE */}
                              <div className="max-h-60 overflow-y-auto border border-ink-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#12221C]">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-cream-100/80 dark:bg-white/5 border-b border-ink-200 dark:border-white/10 text-ink-700 dark:text-cream-100/80 font-bold">
                                      <th className="p-2.5 w-8">
                                        <input
                                          type="checkbox"
                                          checked={unitsList.length > 0 && selectedUnitIndices.length === unitsList.length}
                                          onChange={toggleSelectAllUnits}
                                          className="rounded border-ink-300 dark:border-white/20 text-moss-600 focus:ring-moss-500 cursor-pointer h-4 w-4"
                                        />
                                      </th>
                                      <th className="p-2.5">Unit Name</th>
                                      <th className="p-2.5">Block</th>
                                      <th className="p-2.5">Beds/Baths</th>
                                      <th className="p-2.5">Rent</th>
                                      <th className="p-2.5 text-right">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-ink-100 dark:divide-white/5">
                                    {unitsList.map((unit, uIdx) => {
                                      const isChecked = selectedUnitIndices.includes(uIdx);
                                      return (
                                        <tr key={uIdx} className={`transition-colors text-ink-900 dark:text-white ${isChecked ? "bg-moss-50/70 dark:bg-moss-900/30" : "hover:bg-cream-50/50 dark:hover:bg-white/5"}`}>
                                          <td className="p-2.5 w-8">
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => toggleSelectUnit(uIdx)}
                                              className="rounded border-ink-300 dark:border-white/20 text-moss-600 focus:ring-moss-500 cursor-pointer h-4 w-4"
                                            />
                                          </td>
                                          <td className="p-2.5 font-bold">{unit.unit_name}</td>
                                          <td className="p-2.5 text-ink-500 dark:text-cream-100/60">{unit.block_name || "-"}</td>
                                          <td className="p-2.5">{unit.bedrooms} bed / {unit.bathrooms} bath</td>
                                          <td className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400">
                                            ₦{Number(unit.rent_amount).toLocaleString()}/yr
                                          </td>
                                          <td className="p-2.5 text-right">
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveUnit(uIdx)}
                                              className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer bg-transparent border-none outline-none"
                                            >
                                              Delete
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-ink-500 dark:text-cream-100/60 italic p-3 bg-white dark:bg-[#12221C] rounded-lg border border-dashed border-ink-200 dark:border-white/10 text-center">
                              No units added yet. Fill in the form fields above and click "+ Add Unit to List".
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* CASE 3: STANDALONE SINGLE HOUSE / BQ (Direct 3-input Specs Form) */
                      <div className="space-y-4">
                        <div className="border-b border-[#3A5A40]/20 dark:border-white/10 pb-3">
                          <h3 className="text-sm font-bold text-ink-900 dark:text-white flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
                            <span>Property Specifications & Asking Rent</span>
                          </h3>
                          <p className="text-[12px] text-ink-600 dark:text-cream-100/70">
                            Enter the specifications and rent amount for this property.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <DropdownWithOther
                            label="Bedrooms *"
                            value={bedrooms}
                            onChange={(val) => setBedrooms(val)}
                            options={["1 Bedroom", "2 Bedrooms", "3 Bedrooms", "4 Bedrooms", "5 Bedrooms", "6+ Bedrooms"]}
                            placeholder="Select bedrooms..."
                            required={!isMultiUnit}
                          />
                          <DropdownWithOther
                            label="Bathrooms *"
                            value={bathrooms}
                            onChange={(val) => setBathrooms(val)}
                            options={["1 Bathroom", "2 Bathrooms", "3 Bathrooms", "4 Bathrooms", "5 Bathrooms", "6+ Bathrooms"]}
                            placeholder="Select bathrooms..."
                            required={!isMultiUnit}
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-[12px] font-bold text-ink-900 dark:text-white">Asking Rent (₦) *</label>
                            <div className="flex items-center gap-1 bg-[#3A5A40]/10 dark:bg-white/10 p-0.5 rounded-md">
                              <button
                                type="button"
                                onClick={() => setRentCycle("annual")}
                                className={`px-2.5 py-0.5 text-[11px] font-bold rounded transition-all cursor-pointer border-none outline-none ${rentCycle === "annual"
                                  ? "bg-[#3A5A40] dark:bg-[#E5C583] text-white dark:text-[#263b33] shadow-xs"
                                  : "text-ink-700 dark:text-cream-100/70"
                                  }`}
                              >
                                Annual
                              </button>
                              <button
                                type="button"
                                onClick={() => setRentCycle("monthly")}
                                className={`px-2.5 py-0.5 text-[11px] font-bold rounded transition-all cursor-pointer border-none outline-none ${rentCycle === "monthly"
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
                            value={rent}
                            onChange={(e) => setRent(e.target.value)}
                            placeholder={rentCycle === "annual" ? "e.g. 2,500,000" : "e.g. 200,000"}
                            light={false}
                            required={!isMultiUnit}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────────
                  STEP 3: AMENITIES & PROPERTY GUIDELINES (OPTIONAL / CAN SKIP)
                 ──────────────────────────────────────────────────────────────── */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-ink-900 dark:text-white flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-moss-600 dark:text-[#E5C583]" /> Amenities & Property Features
                    </h2>
                    <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 rounded-full">
                      Optional Step
                    </span>
                  </div>

                  {/* Property Description */}
                  <div>
                    <label className="block text-[12px] font-bold text-ink-900 dark:text-white mb-1">
                      Property Description / Special Features (Optional)
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      maxLength={1000}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your property layout, unique compound amenities, security detail, or tenant guidelines..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-[#16241F] border border-ink-200 dark:border-white/15 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-cream-100/40 outline-none focus:border-moss-600 dark:focus:border-[#E5C583] transition-all"
                    />
                  </div>

                  {/* PROPERTY AMENITIES SELECTION SECTION */}
                  <div className="rounded-xl border border-[#3A5A40]/30 dark:border-white/10 bg-[#3A5A40]/5 dark:bg-white/5 p-5">
                    <label className="block text-[13px] font-bold text-ink-900 dark:text-white mb-2 flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
                      <span>Property Amenities & Facilities</span>
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

                    {/* Custom Amenity Adder */}
                    <div className="flex gap-2 mt-4 items-center">
                      <Input
                        id="customAmenity"
                        placeholder="E.g., Solar Inverter system"
                        value={customAmenityInput}
                        onChange={(e) => setCustomAmenityInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomAmenity(e);
                          }
                        }}
                        className="flex-1 m-0 mb-0"
                        light={false}
                      />
                      <Button
                        type="button"
                        onClick={handleAddCustomAmenity}
                        className="bg-moss-700 hover:bg-moss-800 text-white dark:bg-[#E5C583] dark:text-[#263b33] dark:hover:bg-[#d8b672] font-bold py-[11px] px-4 rounded-xl shrink-0"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Property Rules */}
                  <div>
                    <label className="block text-[13px] font-bold text-ink-900 dark:text-white mb-2">
                      Property Rules (Optional)
                    </label>
                    <textarea
                      className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-white dark:bg-[#16241F] px-4 py-3 text-[13px] text-ink-900 dark:text-white placeholder-ink-400 focus:border-moss-600 focus:outline-none focus:ring-1 focus:ring-moss-600 dark:focus:border-[#E5C583] dark:focus:ring-[#E5C583] min-h-[90px] resize-y"
                      placeholder="e.g., No smoking, No pets, Max 4 occupants, Quiet hours after 10 PM"
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────────
                  STEP 4: PROOF OF OWNERSHIP & MEDIA
                 ──────────────────────────────────────────────────────────────── */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {/* PROOF OF OWNERSHIP LEGAL PAPERS SECTION */}
                  <div className="rounded-xl border border-[#3A5A40]/30 dark:border-white/10 bg-[#3A5A40]/5 dark:bg-white/5 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[13px] font-bold text-ink-900 dark:text-white flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
                        <span>Proof of Ownership / Management Document *</span>
                      </label>
                      {docUploaded && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> File Attached
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-ink-700 dark:text-cream-100/70 mb-3 leading-relaxed">
                      Upload legal proof of ownership or management authority (Certificate of Occupancy, Deed of Assignment, Purchase document, or Management agreement) for Admin review.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <DropdownWithOther
                          label="Document Type *"
                          value={docType}
                          onChange={(val) => setDocType(val)}
                          options={[
                            "Certificate of Occupancy (C of O)",
                            "Deed of Assignment",
                            "Governor's Consent",
                            "Purchase Document / Agreement",
                            "Right of Occupancy (R of O)",
                            "Management Agreement / Power of Attorney"
                          ]}
                          placeholder="Select legal document type..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-cream-100/60 mb-1">
                          Attached File
                        </label>
                        <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#16241F] border border-ink-200 dark:border-white/15 rounded-lg text-xs font-mono text-ink-800 dark:text-[#E5C583] truncate">
                          <span className="truncate">{docName || "No document attached"}</span>
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
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#3A5A40] text-white font-bold text-[12px] hover:bg-[#344E41] transition-all cursor-pointer border-none outline-none"
                    >
                      <Upload className="h-4 w-4" />
                      {docName ? "Change Legal Proof File" : "Attach Legal Ownership Document (PDF / Image)"}
                    </button>
                  </div>

                  {/* PROPERTY PICTURE PROMPT & PHOTO PICKER */}
                  <div className="rounded-xl border border-[#3A5A40]/30 dark:border-white/10 bg-[#3A5A40]/5 dark:bg-white/5 p-5">
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
                      Add up to 5 pictures of your property. Select which image serves as the main cover photo.
                    </p>

                    {/* Photo Previews */}
                    {propertyPhotos.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {propertyPhotos.map((photoUrl, idx) => (
                          <div key={idx} className={`relative h-28 w-full overflow-hidden rounded-xl border-2 transition-all ${idx === coverPhotoIndex ? 'border-emerald-500 shadow-md' : 'border-ink-200 dark:border-white/15'}`}>
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
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-[12.5px] hover:bg-[#1E382A] dark:hover:bg-[#d8b672] transition-all cursor-pointer shadow-xs active:scale-95 border-none outline-none"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Photos from Device (Max 5)
                        </button>
                      </div>
                    )}

                    {propertyPhotos.length < 5 && (
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
                                if (!propertyPhotos.includes(preset.url)) {
                                  setPropertyPhotos(prev => [...prev, preset.url]);
                                }
                              }}
                              className={`text-[11.5px] font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer outline-none ${propertyPhotos.includes(preset.url)
                                ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-transparent shadow-xs"
                                : "bg-white dark:bg-[#182C24] text-ink-700 dark:text-cream-100/80 border-ink-200 dark:border-white/10 hover:border-moss-500"
                                }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {photoError && (
                      <p className="mt-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400">{photoError}</p>
                    )}
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────────
                  STEP 5: OCCUPANCY STATUS & TENANT DETAILS / FINAL SUBMIT
                 ──────────────────────────────────────────────────────────────── */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  {/* Occupancy Choice Card buttons */}
                  <div>
                    <span className="dap-occupancy-label">
                      Does this property currently have active tenants? *
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
                            Invite active tenants and link ledger logs to your portfolio.
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
                            List vacant units to accept prospective tenant applications.
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Tenant details fields */}
                  {occupied === true && (
                    <div className="dap-subform animate-in fade-in">
                      <p className="dap-subform-title">Invite your current tenant</p>
                      <div className="dap-fields-group">
                        <Input
                          id="tenantName"
                          label="Tenant's Name *"
                          value={tenantName}
                          onChange={(e) => setTenantName(e.target.value.replace(/[0-9]/g, ''))}
                          placeholder="e.g. Emeka Obi"
                          maxLength={50}
                          light={false}
                          required
                        />
                        <Input
                          id="tenantContact"
                          label="Tenant's Email or Phone *"
                          value={tenantContact}
                          onChange={(e) => setTenantContact(e.target.value)}
                          placeholder="e.g. emeka@domain.com"
                          maxLength={100}
                          light={false}
                          required
                        />
                        <Input
                          id="leaseStart"
                          label="Lease Start Date *"
                          type="date"
                          value={leaseStartDate}
                          onChange={(e) => setLeaseStartDate(e.target.value)}
                          light={false}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Listing details fields */}
                  {occupied === false && (
                    <div className="dap-subform animate-in fade-in">
                      <p className="dap-subform-title">Public Listing Details</p>
                      <div className="dap-fields-group">
                        <Input
                          id="availableFrom"
                          label="Available From *"
                          type="date"
                          value={availableFrom}
                          onChange={(e) => setAvailableFrom(e.target.value)}
                          light={false}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Incomplete steps warning helper on Step 5 */}
            {currentStep === 5 && getIncompleteSteps().length > 0 && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    Missing required fields in: <strong>{getIncompleteSteps().map(s => `Step ${s}`).join(", ")}</strong>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(getIncompleteSteps()[0])}
                  className="text-xs font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-white cursor-pointer bg-transparent border-none outline-none shrink-0"
                >
                  Go to Step {getIncompleteSteps()[0]} →
                </button>
              </div>
            )}

            {/* ────────────────────────────────────────────────────────────────
                WIZARD STEP NAVIGATION CONTROLS (PREVIOUS / SKIP / NEXT / SUBMIT)
               ──────────────────────────────────────────────────────────────── */}
            <div className="dap-wizard-nav">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border border-ink-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-ink-800 dark:text-cream-100 hover:bg-cream-100 dark:hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1.5 outline-none"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {currentStep === 3 && (
                  <button
                    type="button"
                    onClick={handleSkipStep}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl text-ink-600 dark:text-cream-100/70 hover:bg-cream-100 dark:hover:bg-white/10 transition-all cursor-pointer border-none bg-transparent outline-none"
                  >
                    Skip Step →
                  </button>
                )}

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 text-xs font-bold rounded-xl bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] hover:bg-[#1E382A] dark:hover:bg-[#d8b672] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm outline-none border-none"
                  >
                    Next Step →
                  </button>
                ) : (
                  <Button
                    type="submit"
                    className="dap-submit-btn active"
                  >
                    {occupied === true
                      ? "Send Invite & Submit Property for Verification"
                      : occupied === false
                        ? "Submit Property for Verification"
                        : "Choose Occupancy Status"}
                  </Button>
                )}
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
