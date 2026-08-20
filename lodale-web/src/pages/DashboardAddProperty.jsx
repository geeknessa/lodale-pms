import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  User,
  Key,
  Building2,
  Camera,
  Upload,
  Check,
  Clock,
  AlertCircle,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  ShieldCheck,
  MapPin,
  Bell,
  BellOff,
  HelpCircle,
  Zap,
  Shield,
  Coffee,
  FileText,
  Plus,
  Trash2,
  Star,
  Compass,
  X
} from "lucide-react";
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

  // Toast Notification State
  const [toast, setToast] = useState(null); // null | { message: string, type: "warning" | "error" | "info" }

  const showToast = (message, type = "warning") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Interactive Tour Guide Moving Spotlight State
  const [runTour, setRunTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [spotlightStyle, setSpotlightStyle] = useState({});
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [recalcTrigger, setRecalcTrigger] = useState(0);

  // 5 Tour Steps strictly tracking the left navigation bar channels
  const ADD_PROPERTY_TOUR_STEPS = [
    {
      stepNum: 1,
      target: ".tour-step-nav-1",
      title: "1. Type & Location",
      content: "Establish building identity, specify category (Single House, Apartment, Estate, Hostel, BQ, Commercial), street address, state, city, and GPS coordinates.",
      placement: "right",
      formStep: 1
    },
    {
      stepNum: 2,
      target: ".tour-step-nav-2",
      title: "2. Units & Specifications",
      content: "Setup unit layout & rental pricing. Add individual flats manually, use the ⚡ Bulk Generator for multi-unit buildings, or import unit spreadsheets via CSV.",
      placement: "right",
      formStep: 2
    },
    {
      stepNum: 3,
      target: ".tour-step-nav-3",
      title: "3. Amenities & Guidelines",
      content: "Select utilities (24/7 Security, Prepaid Meter), type custom amenities, and outline property rules and overview notes.",
      placement: "right",
      formStep: 3
    },
    {
      stepNum: 4,
      target: ".tour-step-nav-4",
      title: "4. Legal Proof & Photos",
      content: "Attach title proof documents (Certificate of Occupancy, Deed of Assignment) and upload high-resolution property gallery photos.",
      placement: "right",
      formStep: 4
    },
    {
      stepNum: 5,
      target: ".tour-step-nav-5",
      title: "5. Occupancy & Submit",
      content: "Configure active tenant invitation credentials or vacant public listing availability, then click Submit Listing to finish!",
      placement: "right",
      formStep: 5
    }
  ];

  // Auto switch step form when tour step changes
  useEffect(() => {
    if (runTour) {
      const stepData = ADD_PROPERTY_TOUR_STEPS[tourStep];
      if (stepData && typeof stepData.formStep === "number" && currentStep !== stepData.formStep) {
        setCurrentStep(stepData.formStep);
        setRecalcTrigger((prev) => prev + 1);
      }
    }
  }, [runTour, tourStep, currentStep]);

  // Tour positioning calculation function targeting navigation channel elements
  const updateTourPosition = () => {
    if (!runTour) return;
    const stepData = ADD_PROPERTY_TOUR_STEPS[tourStep];
    if (!stepData) return;

    const targetEl = document.querySelector(stepData.target);
    if (!targetEl) return;

    const rect = targetEl.getBoundingClientRect();

    setSpotlightStyle({
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      borderRadius: getComputedStyle(targetEl).borderRadius || "12px"
    });

    let tTop = 0;
    let tLeft = 0;
    const gap = 16;
    const tooltipWidth = 340;
    const tooltipHeight = 230;

    let placement = stepData.placement;
    if (placement === "right" && rect.right + tooltipWidth + gap > window.innerWidth) {
      placement = "bottom";
    }

    if (placement === "right") {
      tTop = rect.top + rect.height / 2 - tooltipHeight / 2;
      tLeft = rect.left + rect.width + gap;
    } else if (placement === "left") {
      tTop = rect.top + rect.height / 2 - tooltipHeight / 2;
      tLeft = rect.left - tooltipWidth - gap;
    } else if (placement === "bottom") {
      tTop = rect.top + rect.height + gap;
      tLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    } else {
      tTop = rect.top - tooltipHeight - gap;
      tLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    }

    if (tLeft < 16) tLeft = 16;
    if (tLeft + tooltipWidth > window.innerWidth - 16) {
      tLeft = window.innerWidth - tooltipWidth - 16;
    }
    if (tTop < 16) tTop = 16;
    if (tTop + tooltipHeight > window.innerHeight - 16) {
      tTop = window.innerHeight - tooltipHeight - 16;
    }

    setTooltipStyle({
      top: `${tTop}px`,
      left: `${tLeft}px`
    });
  };

  useEffect(() => {
    if (runTour) {
      const stepData = ADD_PROPERTY_TOUR_STEPS[tourStep];
      const targetEl = document.querySelector(stepData?.target);

      if (!targetEl) {
        const retryTimer = setTimeout(() => {
          setRecalcTrigger((prev) => prev + 1);
        }, 100);
        return () => clearTimeout(retryTimer);
      }

      updateTourPosition();

      let animId;
      let startTime = performance.now();
      const tick = (now) => {
        updateTourPosition();
        if (now - startTime < 350) {
          animId = requestAnimationFrame(tick);
        }
      };
      animId = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(animId);
      };
    }
  }, [runTour, tourStep, recalcTrigger, currentStep]);

  // Notifications State & Dropdown
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("landlordNotifications");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { }
    }
    return [
      {
        id: "n-init-1",
        title: "Welcome to Portfolio Wizard",
        message: "Establish property identity, set up units, attach legal proof, and invite tenants.",
        type: "info",
        time: "Just now",
        read: false
      }
    ];
  });

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const markAllNotifsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem("landlordNotifications", JSON.stringify(updated));
      return updated;
    });
  };

  // Landlord Profile & Avatar Modal State
  const [showLandlordProfileModal, setShowLandlordProfileModal] = useState(false);
  const [username] = useState(() => {
    const emailKey = sessionStorage.getItem("lastLoggedInEmail") || localStorage.getItem("lastLoggedInEmail");
    if (emailKey) {
      const savedName = localStorage.getItem("landlordName_" + emailKey.toLowerCase());
      if (savedName) return savedName;
    }
    try {
      const raw = sessionStorage.getItem("currentUserProfile") || localStorage.getItem("currentUserProfile");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.name || parsed.displayName) return parsed.name || parsed.displayName;
      }
    } catch (e) { }
    return "Landlord Account";
  });

  const [landlordAvatar, setLandlordAvatar] = useState(() => {
    const emailKey = sessionStorage.getItem("lastLoggedInEmail") || localStorage.getItem("lastLoggedInEmail");
    if (emailKey) {
      const savedUserAvatar = localStorage.getItem("landlordAvatar_" + emailKey.toLowerCase());
      if (savedUserAvatar && !savedUserAvatar.includes("unsplash.com")) return savedUserAvatar;
    }
    const globalSaved = sessionStorage.getItem("landlordAvatarUrl") || localStorage.getItem("landlordAvatarUrl");
    if (globalSaved && !globalSaved.includes("unsplash.com")) return globalSaved;
    try {
      const raw = sessionStorage.getItem("currentUserProfile") || localStorage.getItem("currentUserProfile");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.avatar && !parsed.avatar.includes("unsplash.com")) return parsed.avatar;
      }
    } catch (e) { }
    return "";
  });

  useEffect(() => {
    const handleAvatarUpdate = () => {
      const emailKey = localStorage.getItem("lastLoggedInEmail");
      let updated = null;
      if (emailKey) {
        updated = localStorage.getItem("landlordAvatar_" + emailKey.toLowerCase());
      }
      if (!updated) {
        updated = localStorage.getItem("landlordAvatarUrl");
      }
      if (!updated) {
        try {
          const raw = localStorage.getItem("currentUserProfile");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.avatar) updated = parsed.avatar;
          }
        } catch (e) { }
      }
      if (updated && !updated.includes("unsplash.com")) {
        setLandlordAvatar(updated);
      }
    };
    handleAvatarUpdate();
    window.addEventListener("storage", handleAvatarUpdate);
    return () => window.removeEventListener("storage", handleAvatarUpdate);
  }, []);

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
  const [selectedAmenities, setSelectedAmenities] = useState(["Prepaid Meter", "24/7 Security"]);
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [bathrooms, setBathrooms] = useState("2");
  const [bedrooms, setBedrooms] = useState("3");
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
    if (e) e.preventDefault();
    const trimmed = customAmenityInput.trim();
    if (trimmed && !selectedAmenities.includes(trimmed)) {
      setSelectedAmenities((prev) => [...prev, trimmed.slice(0, 500)]);
      setCustomAmenityInput("");
    }
  };

  // Property picture prompt state storing photo url and filename
  const [propertyPhotos, setPropertyPhotos] = useState([
    { url: PRESET_PHOTOS[0].url, name: "modern_villa_facade.jpg" }
  ]);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);

  const handleDeletePhoto = (indexToDelete, e) => {
    if (e) e.stopPropagation();
    if (propertyPhotos.length <= 1) {
      showToast("Cannot delete photo. Your property portfolio requires at least 1 photo attachment.", "warning");
      return;
    }
    setPropertyPhotos((prev) => prev.filter((_, idx) => idx !== indexToDelete));
    if (coverPhotoIndex === indexToDelete) {
      setCoverPhotoIndex(0);
    } else if (coverPhotoIndex > indexToDelete) {
      setCoverPhotoIndex((prev) => prev - 1);
    }
  };

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
    if (trimmed && !blocksList.some((b) => b.name.toLowerCase() === trimmed.toLowerCase())) {
      setBlocksList((prev) => [...prev, { name: trimmed.slice(0, 500), description: "" }]);
      setNewBlockName("");
    }
  };

  const handleRemoveBlock = (blockNameToRemove) => {
    setBlocksList((prev) => prev.filter((b) => b.name !== blockNameToRemove));
    setUnitsList((prev) =>
      prev.map((u) => (u.block_name === blockNameToRemove ? { ...u, block_name: "" } : u))
    );
  };

  const handleAddSingleUnit = () => {
    if (!manualUnitName.trim()) {
      setFormError("Unit name (e.g. Flat 101 or House A1) is required.");
      return;
    }
    const newUnit = {
      unit_name: manualUnitName.trim().slice(0, 500),
      block_name: manualBlockName,
      bedrooms: Number(manualBeds) || 1,
      bathrooms: Number(manualBaths) || 1,
      rent_amount: Number(manualRent.replace(/[^0-9]/g, "")) || 0,
      rent_period: rentCycle === "annual" ? "annually" : "monthly",
      status: "vacant"
    };
    setUnitsList((prev) => [...prev, newUnit]);
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
        unit_name: `${prefix}${start + i}`.slice(0, 500),
        block_name: bulkBlockName,
        bedrooms: Number(bulkBeds) || 1,
        bathrooms: Number(bulkBaths) || 1,
        rent_amount: rentVal,
        rent_period: rentCycle === "annual" ? "annually" : "monthly",
        status: "vacant"
      });
    }

    setUnitsList((prev) => [...prev, ...generated]);
    setFormError("");
  };

  const handleRemoveUnit = (indexToRemove) => {
    setUnitsList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setSelectedUnitIndices((prev) =>
      prev.filter((i) => i !== indexToRemove).map((i) => (i > indexToRemove ? i - 1 : i))
    );
  };

  const handleDownloadCsvTemplate = () => {
    const csvHeader =
      "unit_name,block_name,bedrooms,bathrooms,rent_amount\nFlat 101,Block A,2,2,2500000\nFlat 102,Block A,2,2,2500000\nFlat 201,Block B,3,3,3200000\n";
    const blob = new Blob([csvHeader], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lodale_units_template.csv";
    a.click();
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
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== "");
        if (lines.length <= 1) {
          setCsvError("CSV file appears to be empty or missing data rows.");
          return;
        }

        const parsedUnits = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim());
          if (cols[0]) {
            parsedUnits.push({
              unit_name: cols[0].slice(0, 500),
              block_name: (cols[1] || "").slice(0, 500),
              bedrooms: Number(cols[2]) || 1,
              bathrooms: Number(cols[3]) || 1,
              rent_amount: Number(cols[4]?.replace(/[^0-9]/g, "")) || 0,
              rent_period: rentCycle === "annual" ? "annually" : "monthly",
              status: "vacant"
            });
          }
        }

        if (parsedUnits.length > 0) {
          setUnitsList((prev) => [...prev, ...parsedUnits]);
          setFormError("");
        } else {
          setCsvError("No valid unit records found in CSV file.");
        }
      } catch (err) {
        setCsvError("Failed to parse CSV file. Please check file formatting.");
      }
    };
    reader.readAsText(file);
  };

  function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 5 - propertyPhotos.length;
    if (remainingSlots <= 0) {
      showToast("You can only upload up to 5 photos.", "warning");
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      showToast(`Only the first ${remainingSlots} photo(s) were added. Maximum is 5.`, "warning");
    }

    filesToAdd.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        showToast("Please select valid image files (PNG, JPG, WEBP).", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPropertyPhotos((prev) => [
          ...prev,
          { url: evt.target.result, name: file.name.slice(0, 500) }
        ]);
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
        setDocDataUrl("");
        setDocUploaded(false);
        return;
      }

      setDocName(file.name.slice(0, 500));
      setDocUploaded(true);
      setFormError("");

      const reader = new FileReader();
      reader.onload = (evt) => {
        setDocDataUrl(evt.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleOpenDocPicker = () => {
    if (currentStep !== 4) setCurrentStep(4);
    setTimeout(() => {
      docInputRef.current?.click();
    }, 100);
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
      () => {
        setFormError("Unable to retrieve your location. Please check location permissions.");
        setIsDetectingGps(false);
      }
    );
  };

  const isStepValid = (stepNum) => {
    if (stepNum === 1) {
      return !!(displayName?.trim() && address?.trim() && stateName && cityName);
    }
    if (stepNum === 2) {
      if (isMultiUnit) {
        return !!(unitsList && unitsList.length > 0);
      } else {
        const numericRent = Number(rent?.replace(/[^0-9]/g, ""));
        return !!(rent && !isNaN(numericRent) && numericRent > 0);
      }
    }
    if (stepNum === 3) {
      return true;
    }
    if (stepNum === 4) {
      return !!(docName?.trim() && propertyPhotos && propertyPhotos.length > 0);
    }
    if (stepNum === 5) {
      return occupied !== null;
    }
    return false;
  };

  const handleNextStep = () => {
    setFormError("");
    if (currentStep === 1) {
      if (!displayName?.trim() || !address?.trim() || !stateName || !cityName) {
        setFormError("Please complete all required fields (Display Name, Street Address, State, City) before continuing.");
        return;
      }
    } else if (currentStep === 2) {
      if (isMultiUnit) {
        if (!unitsList || unitsList.length === 0) {
          setFormError("Please add at least 1 unit to your portfolio or generate units to proceed.");
          return;
        }
      } else {
        const numericRent = Number(rent?.replace(/[^0-9]/g, ""));
        if (!rent || isNaN(numericRent) || numericRent <= 0) {
          setFormError("Please enter a valid Asking Rent amount.");
          return;
        }
      }
    } else if (currentStep === 4) {
      if (!docName?.trim()) {
        setFormError("Please attach proof of ownership or legal document before proceeding.");
        return;
      }
      if (!propertyPhotos || propertyPhotos.length === 0) {
        setFormError("Please upload or pick at least one property photo.");
        return;
      }
    }

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setFormError("");
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!displayName?.trim() || !address?.trim() || !stateName || !cityName) {
      setCurrentStep(1);
      setFormError("Step 1: Please fill all required fields (Display Name, Address, State, and City) before submitting.");
      return;
    }

    if (isMultiUnit) {
      if (!unitsList || unitsList.length === 0) {
        setCurrentStep(2);
        setFormError("Step 2: Please add at least one unit to your multi-unit property before submitting.");
        return;
      }
    } else {
      const numericRent = Number(rent?.replace(/[^0-9]/g, ""));
      if (!rent || isNaN(numericRent) || numericRent <= 0) {
        setCurrentStep(2);
        setFormError("Step 2: A valid Asking Rent amount is required for single unit property.");
        return;
      }
    }

    if (!docName?.trim()) {
      setCurrentStep(4);
      setFormError("Step 4: Please upload your proof of ownership or legal management document before submitting.");
      return;
    }
    if (!propertyPhotos || propertyPhotos.length === 0) {
      setCurrentStep(4);
      setFormError("Step 4: Please attach at least one property photo before submitting.");
      return;
    }

    if (occupied === null) {
      setCurrentStep(5);
      setFormError("Step 5: Please select whether the property currently has active tenants or is vacant.");
      return;
    }

    if (occupied === true) {
      if (!tenantName?.trim() || !tenantContact?.trim() || !leaseStartDate?.trim()) {
        setCurrentStep(5);
        setFormError("Step 5: Please fill in all tenant invitation fields (Tenant Name, Email/Phone, and Lease Start Date).");
        return;
      }
    }

    if (occupied === false) {
      if (!availableFrom?.trim()) {
        setCurrentStep(5);
        setFormError("Step 5: Please specify the Available From date.");
        return;
      }
    }

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

    const photoUrls = propertyPhotos.map((p) => (typeof p === "object" ? p.url : p));
    const selectedCoverUrl = typeof propertyPhotos[coverPhotoIndex] === "object"
      ? propertyPhotos[coverPhotoIndex].url
      : propertyPhotos[coverPhotoIndex];

    await handlePropertySubmit({
      e: { preventDefault: () => {}, target: syntheticForm.target },
      displayName,
      stateName,
      cityName,
      bathrooms,
      description,
      selectedAmenities,
      docType,
      docName,
      docDataUrl,
      propertyPhotos: photoUrls,
      coverPhoto: selectedCoverUrl,
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
  };

  useEffect(() => {
    if (isSubmitted && successOverlayRef.current) {
      gsap.fromTo(successOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });

      if (checkIconRef.current) {
        gsap.fromTo(
          checkIconRef.current,
          { scale: 0, rotation: -45, opacity: 0 },
          { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: "back.out(1.7)", delay: 0.3 }
        );
      }

      if (textContainerRef.current) {
        gsap.fromTo(
          textContainerRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: 0.5 }
        );
      }
    }
  }, [isSubmitted]);

  if (isSubmitted) {
    return (
      <div ref={successOverlayRef} className="dap-success-screen">
        <div className="dap-success-glow-1" />
        <div className="dap-success-inner">
          <div className="dap-success-icon-ring">
            <CheckCircle2 className="check" ref={checkIconRef} />
            <div className="dap-success-sparkle">
              <Sparkles />
            </div>
          </div>

          <div ref={textContainerRef} className="dap-success-texts">
            <h2 className="dap-success-heading">Property Portfolio Registered!</h2>
            <p className="dap-success-body">
              Your property listing and proof of ownership legal documents have been queued for administrative review. An administrator will verify your submitted documents shortly.
            </p>

            <div className="dap-success-loader-row">
              <Clock className="animate-spin" />
              <span className="dap-success-loader-lbl">Pending Admin Verification</span>
            </div>

            <Button
              variant="primary"
              onClick={() => navigate("/dashboard/landlord")}
              className="mt-6 w-full py-3 text-xs font-bold rounded-xl cursor-pointer"
            >
              Return to Landlord Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stepsInfo = [
    { step: 1, label: "Type & Location", icon: Building2, desc: "Establish building identity & street address" },
    { step: 2, label: "Units & Specifications", icon: Layers, desc: "Setup unit layout & rental pricing" },
    { step: 3, label: "Amenities & Guidelines", icon: Sparkles, desc: "Select utilities & property rules" },
    { step: 4, label: "Legal Proof & Photos", icon: ShieldCheck, desc: "Attach legal document & picture gallery" },
    { step: 5, label: "Occupancy & Submit", icon: CheckCircle2, desc: "Configure current occupancy status" }
  ];

  const AMENITY_CATEGORIES = [
    {
      title: "Power & Utilities",
      icon: Zap,
      items: ["Prepaid Meter", "24/7 Power Supply", "Solar Inverter", "Water Treatment", "Borehole Water"]
    },
    {
      title: "Security & Access",
      icon: Shield,
      items: ["24/7 Security Guards", "Gated Estate", "CCTV Surveillance", "Access Control Gate", "Fenced Compound"]
    },
    {
      title: "Comfort & Amenities",
      icon: Coffee,
      items: ["POP Ceiling", "Air Conditioning", "Balcony", "Fully Furnished", "Swimming Pool", "Fitness Gym", "Elevator"]
    }
  ];

  const ALL_DEFAULT_AMENITIES = AMENITY_CATEGORIES.flatMap((c) => c.items);
  const customAddedAmenities = selectedAmenities.filter(
    (a) => !ALL_DEFAULT_AMENITIES.includes(a)
  );

  return (
    <div className="dap-saas-page relative">
      {/* FLOATING TOAST NOTIFICATION MESSAGE */}
      {toast && (
        <div className="fixed top-20 right-6 z-[300] flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-900/90 text-amber-100 border border-amber-500/40 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-200 max-w-sm">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-amber-400 hover:text-white font-bold border-none bg-transparent cursor-pointer ml-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. TOPBAR NAV HEADER WITH BRIGHT WHITE LODALE LOGO
         ───────────────────────────────────────────────────────────── */}
      <header className="dap-top-nav">
        <div className="dap-nav-brand">
          <button
            type="button"
            onClick={() => navigate("/dashboard/landlord")}
            className="dap-nav-logo-btn"
          >
            <Logo variant="white" />
          </button>
        </div>

        <div className="dap-nav-actions relative">
          <button
            type="button"
            onClick={() => navigate("/dashboard/landlord")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-all border-none cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </button>

          {/* NOTIFICATIONS BUTTON WITH BADGE & DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              className="dap-nav-icon-btn"
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                if (!showNotifDropdown && unreadNotifCount > 0) {
                  markAllNotifsRead();
                }
              }}
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[9.5px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* NOTIFICATIONS DROPDOWN */}
            {showNotifDropdown && (
              <div className="absolute right-0 top-12 z-[100] w-80 sm:w-[360px] rounded-3xl bg-white dark:bg-[#12221C] border border-slate-200 dark:border-white/10 shadow-2xl p-5 space-y-4 text-left animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#2C4633] dark:text-[#E5C583]" />
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#2C4633] text-[#E5C583] dark:bg-[#E5C583] dark:text-[#0B1512] rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3">
                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          setNotifications([]);
                          localStorage.setItem("landlordNotifications", JSON.stringify([]));
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer border-none bg-transparent"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer border-none bg-transparent"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                      <BellOff className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">All caught up!</h4>
                      <p className="text-[11px] text-slate-400">You have no new notifications.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 relative group"
                      >
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{notif.title}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{notif.message}</div>
                        <div className="text-[9.5px] text-slate-400 mt-1">{notif.time || "Just now"}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* INTERACTIVE PAGE TOUR GUIDE BUTTON */}
          <button
            type="button"
            onClick={() => {
              setTourStep(0);
              setCurrentStep(1);
              setRunTour(true);
            }}
            className="dap-nav-icon-btn"
            title="Start Interactive Channel Tour"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* DASHBOARD USER PROFILE AVATAR CIRCLE */}
          <div
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setShowLandlordProfileModal(true)}
            title="View landlord profile details"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-[#2C4633] dark:bg-[#1E382A] text-[#E5C583] font-extrabold text-sm border-2 border-emerald-400/40 shadow-xs shrink-0">
              {landlordAvatar ? (
                <img src={landlordAvatar} alt="Landlord profile" className="h-full w-full object-cover" />
              ) : (
                <span>{username ? username.charAt(0).toUpperCase() : "L"}</span>
              )}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <div className="text-xs font-bold text-white truncate max-w-[120px]">{username}</div>
              <div className="text-[10px] text-emerald-400 font-semibold">Verified Landlord</div>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN WORKSPACE LAYOUT (STICKY SIDEBARS + INDEPENDENT CENTER SCROLL)
         ───────────────────────────────────────────────────────────── */}
      <div className="dap-workspace-layout">
        {/* STICKY LEFT SIDEBAR NAVIGATION PANEL */}
        <aside className="dap-left-panel">
          <div>
            <div className="mb-6">
              <div className="dap-panel-section-title">PORTFOLIO ONBOARDING</div>
              {stepsInfo.map((sObj) => {
                const isActive = currentStep === sObj.step;
                const isCompleted = isStepValid(sObj.step);
                const StepIcon = sObj.icon;
                return (
                  <button
                    key={sObj.step}
                    type="button"
                    onClick={() => {
                      setFormError("");
                      setCurrentStep(sObj.step);
                    }}
                    className={`dap-step-nav-btn tour-step-nav-${sObj.step} ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                  >
                    <StepIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{sObj.label}</span>
                    <span className="dap-step-nav-badge">
                      {isCompleted ? "✓" : sObj.step}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard/landlord")}
            className="dap-sidebar-exit-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Exit Wizard</span>
          </button>
        </aside>

        {/* INDEPENDENTLY SCROLLABLE CENTER WORKSPACE CONTAINER */}
        <main className="dap-center-content">
          <div ref={cardRef} className="dap-main-card">
            {/* CARD HEADER */}
            <div className="dap-card-header">
              <div className="dap-card-header-left">
                <div className="dap-card-icon-box">
                  {currentStep === 1 && <Building2 className="h-6 w-6" />}
                  {currentStep === 2 && <Layers className="h-6 w-6" />}
                  {currentStep === 3 && <Sparkles className="h-6 w-6" />}
                  {currentStep === 4 && <ShieldCheck className="h-6 w-6" />}
                  {currentStep === 5 && <CheckCircle2 className="h-6 w-6" />}
                </div>
                <div>
                  <h1 className="dap-card-heading">
                    {stepsInfo[currentStep - 1].label}
                  </h1>
                  <p className="dap-card-subheading">
                    {stepsInfo[currentStep - 1].desc}
                  </p>
                </div>
              </div>
            </div>

            {/* STEP PROGRESS BAR */}
            <div className="dap-card-progress-bar">
              <div
                className="dap-card-progress-fill"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {formError && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* STEP 1: PROPERTY TYPE & LOCATION */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white mb-2">
                      Select Building Category *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {[
                        { id: "single_house", label: "Single House", desc: "Bungalow, duplex, terrace, or detached home" },
                        { id: "apartment_building", label: "Apartment Building", desc: "Block of flats or multi-family building" },
                        { id: "estate", label: "Gated Estate", desc: "Housing estate with multiple blocks/houses" },
                        { id: "hostel", label: "Student Hostel", desc: "Student accommodation with rooms/wings" },
                        { id: "boys_quarters", label: "Boys Quarters (BQ)", desc: "Outbuilding / Self-contained BQ unit" },
                        { id: "commercial_building", label: "Commercial Building", desc: "Offices, shops, plazas, or commercial units" }
                      ].map((typeObj) => {
                        const isSelected = propertyType === typeObj.id;
                        return (
                          <button
                            key={typeObj.id}
                            type="button"
                            onClick={() => setPropertyType(typeObj.id)}
                            className={`dap-option-card ${isSelected ? "selected" : ""}`}
                          >
                            <div className="dap-option-icon">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="dap-option-title flex items-center justify-between">
                                <span>{typeObj.label}</span>
                                {isSelected && <Check className="h-4 w-4 text-[#2C4633] dark:text-[#E5C583]" />}
                              </div>
                              <div className="dap-option-desc">{typeObj.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {propertyType === "single_house" && (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 animate-in fade-in mb-4">
                        <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
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
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer outline-none ${
                                houseSubtype === sub.id
                                  ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-transparent font-bold"
                                  : "bg-white dark:bg-[#16241F] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/15"
                              }`}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#E5C583] flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" /> Location & Address Details
                    </h3>

                    <div>
                      <Input
                        id="displayName"
                        label="Property / Estate Display Name *"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Green Valley Estate or Sunshine Apartments"
                        maxLength={500}
                        required
                      />
                      <div className="text-[10px] text-right font-medium text-slate-400 dark:text-slate-500 mt-1">
                        {displayName.length}/500
                      </div>
                    </div>

                    <div>
                      <Input
                        id="address"
                        label="Full Street Address *"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Plot 14, Admiralty Way, Lekki Phase 1"
                        maxLength={500}
                        light={false}
                        required
                      />
                      <div className="text-[10px] text-right font-medium text-slate-400 dark:text-slate-500 mt-1">
                        {address.length}/500
                      </div>
                    </div>

                    <div className="dap-grid-2 z-20">
                      <SearchableDropdown
                        id="state"
                        label="State / Region *"
                        value={stateName}
                        onChange={(selectedState) => {
                          setStateName(selectedState);
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

                    <div className="pt-3 border-t border-slate-200 dark:border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-slate-900 dark:text-white">
                          GPS Coordinates (Optional)
                        </label>
                        <button
                          type="button"
                          onClick={handleDetectGps}
                          disabled={isDetectingGps}
                          className="text-[11px] font-bold text-[#2C4633] dark:text-[#E5C583] hover:underline cursor-pointer flex items-center gap-1 bg-transparent border-none outline-none"
                        >
                          {isDetectingGps ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Auto-detect Current GPS"}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          id="latitude"
                          label="Latitude"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          placeholder="e.g. 6.454066"
                          maxLength={500}
                          light={false}
                        />
                        <Input
                          id="longitude"
                          label="Longitude"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          placeholder="e.g. 3.424583"
                          maxLength={500}
                          light={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: UNIT SETUP & SPECIFICATIONS */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-5">
                    {propertyType === "single_house" && houseSubtype === "duplex" && (
                      <div className="mb-6 pb-4 border-b border-slate-200 dark:border-white/10">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                          <Building2 className="h-4 w-4 text-[#2C4633] dark:text-[#E5C583]" />
                          <span>How is this Duplex managed? *</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          <button
                            type="button"
                            onClick={() => setIsMultiUnit(false)}
                            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left flex items-start gap-3 outline-none ${
                              !isMultiUnit
                                ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-transparent font-bold"
                                : "bg-white dark:bg-[#16241F] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/10"
                            }`}
                          >
                            <div className="font-bold text-sm">1</div>
                            <div>
                              <div className="font-bold text-xs">Single Family Duplex</div>
                              <div className="text-[11px] opacity-80">Entire duplex rented to 1 tenant</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsMultiUnit(true)}
                            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left flex items-start gap-3 outline-none ${
                              isMultiUnit
                                ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-transparent font-bold"
                                : "bg-white dark:bg-[#16241F] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/10"
                            }`}
                          >
                            <div className="font-bold text-sm">2+</div>
                            <div>
                              <div className="font-bold text-xs">Divided Duplex Flats</div>
                              <div className="text-[11px] opacity-80">Split into 2 or more units</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {isMultiUnit ? (
                      <div className="space-y-6">
                        <div className="bg-white dark:bg-[#16241F] p-4 rounded-xl border border-slate-200 dark:border-white/10">
                          <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                            Building Blocks / Floors (Optional)
                          </label>
                          <div className="flex gap-2 items-start mb-3">
                            <div className="flex-1">
                              <DropdownWithOther
                                value={newBlockName}
                                onChange={(val) => setNewBlockName(val)}
                                options={[
                                  "Block A", "Block B", "Block C", "Block D",
                                  "Floor 1", "Floor 2", "Floor 3", "Ground Floor"
                                ]}
                                placeholder="Select or type block name..."
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleAddBlock}
                              className="px-4 py-2.5 h-[42px] text-xs font-bold rounded-xl bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] cursor-pointer border-none outline-none shrink-0"
                            >
                              + Add Block
                            </button>
                          </div>

                          {blocksList.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {blocksList.map((block, bIdx) => (
                                <span
                                  key={bIdx}
                                  className="px-3 py-1 bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-[#E5C583] border border-slate-200 dark:border-white/15 rounded-lg text-xs font-semibold flex items-center gap-2"
                                >
                                  {block.name}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBlock(block.name)}
                                    className="text-rose-600 dark:text-rose-400 font-bold ml-1 cursor-pointer border-none bg-transparent"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Add Units to Portfolio ({unitsList.length} added)
                            </span>
                            <div className="flex gap-1 bg-slate-100 dark:bg-white/10 p-1 rounded-lg">
                              <button
                                type="button"
                                onClick={() => setUnitAddTab("manual")}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer border-none ${
                                  unitAddTab === "manual" ? "bg-white dark:bg-[#16241F] text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                Single Unit
                              </button>
                              <button
                                type="button"
                                onClick={() => setUnitAddTab("generator")}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer border-none ${
                                  unitAddTab === "generator" ? "bg-white dark:bg-[#16241F] text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                Bulk Generator
                              </button>
                              <button
                                type="button"
                                onClick={() => setUnitAddTab("csv")}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer border-none ${
                                  unitAddTab === "csv" ? "bg-white dark:bg-[#16241F] text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                CSV Upload
                              </button>
                            </div>
                          </div>

                          {unitAddTab === "manual" && (
                            <div className="bg-white dark:bg-[#16241F] p-4 rounded-xl border border-slate-200 dark:border-white/10 mb-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Unit Name / Number *
                                  </label>
                                  <input
                                    type="text"
                                    value={manualUnitName}
                                    onChange={(e) => setManualUnitName(e.target.value)}
                                    maxLength={500}
                                    placeholder={getUnitNamePlaceholder()}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Rent Amount (₦)
                                  </label>
                                  <input
                                    type="number"
                                    value={manualRent}
                                    onChange={(e) => setManualRent(e.target.value)}
                                    maxLength={500}
                                    placeholder="e.g. 2500000"
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleAddSingleUnit}
                                className="w-full py-2 rounded-lg bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs cursor-pointer border-none"
                              >
                                + Add Unit to List
                              </button>
                            </div>
                          )}

                          {unitAddTab === "generator" && (
                            <div className="bg-white dark:bg-[#16241F] p-4 rounded-xl border border-slate-200 dark:border-white/10 mb-4">
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                <DropdownWithOther
                                  label="Prefix"
                                  value={bulkPrefix}
                                  onChange={(val) => setBulkPrefix(val)}
                                  options={["Flat ", "House ", "Room ", "Shop ", "Unit "]}
                                />
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Start #</label>
                                  <input
                                    type="number"
                                    value={bulkStartNum}
                                    onChange={(e) => setBulkStartNum(e.target.value)}
                                    placeholder="101"
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Count</label>
                                  <input
                                    type="number"
                                    value={bulkCount}
                                    onChange={(e) => setBulkCount(e.target.value)}
                                    placeholder="6"
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#12221C] text-slate-900 dark:text-white outline-none"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleGenerateBulkUnits}
                                className="w-full py-2 rounded-lg bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs cursor-pointer border-none"
                              >
                                ⚡ Generate Units
                              </button>
                            </div>
                          )}

                          {unitAddTab === "csv" && (
                            <div className="bg-white dark:bg-[#16241F] p-4 rounded-xl border border-slate-200 dark:border-white/10 mb-4 text-center">
                              <input ref={csvFileInputRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                              <button
                                type="button"
                                onClick={() => csvFileInputRef.current?.click()}
                                className="py-2 px-4 rounded-lg bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs cursor-pointer border-none"
                              >
                                Upload CSV Spreadsheet
                              </button>
                            </div>
                          )}

                          {unitsList.length > 0 && (
                            <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#12221C]">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-white/10">
                                    <th className="p-2.5">Unit Name</th>
                                    <th className="p-2.5">Rent</th>
                                    <th className="p-2.5 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                  {unitsList.map((u, i) => (
                                    <tr key={i}>
                                      <td className="p-2.5 font-bold">{u.unit_name}</td>
                                      <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">₦{Number(u.rent_amount).toLocaleString()}</td>
                                      <td className="p-2.5 text-right">
                                        <button type="button" onClick={() => handleRemoveUnit(i)} className="text-rose-600 font-bold border-none bg-transparent cursor-pointer">Delete</button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <DropdownWithOther
                            label="Bedrooms *"
                            value={bedrooms}
                            onChange={(val) => setBedrooms(val)}
                            options={["1 Bedroom", "2 Bedrooms", "3 Bedrooms", "4 Bedrooms", "5 Bedrooms"]}
                          />
                          <DropdownWithOther
                            label="Bathrooms *"
                            value={bathrooms}
                            onChange={(val) => setBathrooms(val)}
                            options={["1 Bathroom", "2 Bathrooms", "3 Bathrooms", "4 Bathrooms"]}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">Asking Rent (₦) *</label>
                          <Input
                            id="rent"
                            type="number"
                            value={rent}
                            onChange={(e) => setRent(e.target.value)}
                            placeholder="e.g. 2,500,000"
                            maxLength={500}
                            light={false}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: AMENITIES & RULES */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-900 dark:text-white">Description & Overview</label>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{description.length}/500</span>
                    </div>
                    <textarea
                      maxLength={500}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe compound highlights, security details, or neighborhood features (max 500 chars)..."
                      className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div className="space-y-4 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                    {AMENITY_CATEGORIES.map((cat) => (
                      <div key={cat.title}>
                        <div className="text-[11px] font-bold text-slate-700 dark:text-[#E5C583] uppercase mb-2">{cat.title}</div>
                        <div className="flex flex-wrap gap-2">
                          {cat.items.map((amenity) => {
                            const isSelected = selectedAmenities.includes(amenity);
                            return (
                              <button
                                key={amenity}
                                type="button"
                                onClick={() => toggleAmenity(amenity)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-[#2C4633] text-white border-transparent dark:bg-[#E5C583] dark:text-[#263b33]"
                                    : "bg-white dark:bg-[#16241F] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/15"
                                }`}
                              >
                                {isSelected ? "✓ " : "+ "}{amenity}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* VISUAL DISPLAY OF CUSTOM ADDED AMENITIES */}
                    {customAddedAmenities.length > 0 && (
                      <div className="pt-3 border-t border-slate-200 dark:border-white/10">
                        <div className="text-[11px] font-bold text-[#2C4633] dark:text-[#E5C583] uppercase mb-2 flex items-center justify-between">
                          <span>Your Custom Amenities ({customAddedAmenities.length})</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Click × to remove</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {customAddedAmenities.map((amenity) => (
                            <span
                              key={amenity}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-[#2C4633] text-white border-transparent dark:bg-[#E5C583] dark:text-[#263b33] flex items-center gap-1.5 shadow-xs"
                            >
                              <span>✓ {amenity}</span>
                              <button
                                type="button"
                                onClick={() => toggleAmenity(amenity)}
                                className="ml-1 text-xs opacity-80 hover:opacity-100 font-bold border-none bg-transparent cursor-pointer text-white dark:text-[#263b33]"
                                title="Remove custom amenity"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CUSTOM AMENITY INPUT SECTION */}
                    <div className="pt-3 border-t border-slate-200 dark:border-white/10">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-[#E5C583] uppercase mb-2">
                        Add Custom Amenity
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customAmenityInput}
                          onChange={(e) => setCustomAmenityInput(e.target.value)}
                          maxLength={500}
                          placeholder="e.g. Smart Door Lock, Private Swimming Pool..."
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white outline-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomAmenity();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomAmenity}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] cursor-pointer border-none outline-none shrink-0 flex items-center gap-1 hover:opacity-90 transition-opacity"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-900 dark:text-white">Property Rules (Optional)</label>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{rules.length}/500</span>
                    </div>
                    <textarea
                      maxLength={500}
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                      placeholder="e.g. No smoking, Quiet hours after 10 PM (max 500 chars)..."
                      className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: LEGAL PROOF & PHOTOS */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                    <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">Proof of Ownership Legal Paper *</label>
                    <DropdownWithOther
                      label="Document Type *"
                      value={docType}
                      onChange={(val) => setDocType(val)}
                      options={["Certificate of Occupancy (C of O)", "Deed of Assignment", "Governor's Consent", "Purchase Document"]}
                    />
                    <input ref={docInputRef} type="file" accept=".pdf,.png,.jpg" onChange={handleDocUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="mt-3 w-full py-2.5 rounded-lg bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs border-none cursor-pointer"
                    >
                      {docName ? `Attached: ${docName}` : "Upload Legal Proof Document (PDF/Image)"}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-900 dark:text-white">Property Photos Gallery *</label>
                      <span className="text-[11px] font-semibold text-slate-400">{propertyPhotos.length}/5 attached</span>
                    </div>

                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 rounded-lg bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs border-none cursor-pointer"
                    >
                      Upload Photos ({propertyPhotos.length}/5 attached)
                    </button>

                    {/* CLEAN TEXT FILE LISTING OF UPLOADED IMAGES */}
                    {propertyPhotos.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {propertyPhotos.map((photo, idx) => {
                          const fileName = typeof photo === "object" ? photo.name : `Property Photo ${idx + 1}.jpg`;
                          const isCover = idx === coverPhotoIndex;

                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                isCover
                                  ? "bg-[#2C4633]/10 dark:bg-[#E5C583]/10 border-[#2C4633] dark:border-[#E5C583]"
                                  : "bg-white dark:bg-[#16241F] border-slate-200 dark:border-white/10"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-2">
                                <Camera className="h-4 w-4 text-[#2C4633] dark:text-[#E5C583] shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                    {fileName}
                                  </div>
                                  {isCover && (
                                    <span className="text-[10px] font-bold text-[#2C4633] dark:text-[#E5C583]">
                                      ★ Primary Cover Image
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {!isCover && (
                                  <button
                                    type="button"
                                    onClick={() => setCoverPhotoIndex(idx)}
                                    className="text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white underline cursor-pointer border-none bg-transparent"
                                  >
                                    Set Cover
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => handleDeletePhoto(idx, e)}
                                  className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer border-none bg-transparent"
                                  title="Delete file"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: OCCUPANCY & SUBMIT */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">Occupancy Status *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOccupied(true)}
                      className={`p-4 rounded-xl border-2 font-bold text-xs text-left transition-all cursor-pointer ${
                        occupied === true ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-transparent" : "bg-white dark:bg-[#16241F] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/15"
                      }`}
                    >
                      Occupied (Invite Current Tenant)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOccupied(false)}
                      className={`p-4 rounded-xl border-2 font-bold text-xs text-left transition-all cursor-pointer ${
                        occupied === false ? "bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#263b33] border-transparent" : "bg-white dark:bg-[#16241F] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/15"
                      }`}
                    >
                      Vacant (Public Listing)
                    </button>
                  </div>

                  {occupied === true && (
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-3">
                      <div>
                        <Input id="tName" label="Tenant Name *" value={tenantName} onChange={(e) => setTenantName(e.target.value)} maxLength={500} required />
                        <div className="text-[10px] text-right font-medium text-slate-400 dark:text-slate-500 mt-1">{tenantName.length}/500</div>
                      </div>
                      <div>
                        <Input id="tContact" label="Tenant Email/Phone *" value={tenantContact} onChange={(e) => setTenantContact(e.target.value)} maxLength={500} required />
                        <div className="text-[10px] text-right font-medium text-slate-400 dark:text-slate-500 mt-1">{tenantContact.length}/500</div>
                      </div>
                      <Input id="lStart" label="Lease Start Date *" type="date" value={leaseStartDate} onChange={(e) => setLeaseStartDate(e.target.value)} required />
                    </div>
                  )}

                  {occupied === false && (
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                      <Input id="avail" label="Available From *" type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} required />
                    </div>
                  )}

                  <Button type="submit" variant="primary" className="w-full py-3 text-xs font-bold cursor-pointer mt-4">
                    Complete Property Submission
                  </Button>
                </div>
              )}
            </form>
          </div>

          {/* FLOATING STEP PAGINATION CAPSULE BAR */}
          <div className="dap-bottom-capsule-bar">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={handlePrevStep}
              className="dap-capsule-nav-btn prev"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>

            <div className="dap-capsule-step-pill">
              Step {currentStep} of 5
            </div>

            <button
              type="button"
              onClick={currentStep < 5 ? handleNextStep : handleSubmit}
              className="dap-capsule-nav-btn next"
            >
              {currentStep < 5 ? (
                <>Next Step <ArrowRight className="h-4 w-4" /></>
              ) : (
                "Submit Listing"
              )}
            </button>
          </div>
        </main>

        {/* ─────────────────────────────────────────────────────────────
            4. STICKY RIGHT GALLERY & RICH LEGAL PROOF SUMMARY PANEL
           ───────────────────────────────────────────────────────────── */}
        <aside className="dap-right-panel">
          <div>
            <div className="dap-gallery-title">
              <span>Attached Media</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold normal-case tracking-normal bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0">
                {propertyPhotos.length} photos
              </span>
            </div>
            <div className="space-y-3">
              {propertyPhotos.map((photo, idx) => {
                const photoUrl = typeof photo === "object" ? photo.url : photo;
                return (
                  <div
                    key={idx}
                    className={`dap-gallery-thumb-card ${idx === coverPhotoIndex ? "cover" : ""} group relative`}
                    onClick={() => setCoverPhotoIndex(idx)}
                  >
                    <img src={photoUrl} alt={`Photo ${idx}`} className="dap-gallery-thumb-img" />
                    {idx === coverPhotoIndex && (
                      <span className="dap-gallery-cover-badge">Cover Image</span>
                    )}
                    {/* TOP-RIGHT IMAGE DELETE BUTTON */}
                    <button
                      type="button"
                      onClick={(e) => handleDeletePhoto(idx, e)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white flex items-center justify-center border-none cursor-pointer shadow-md transition-transform hover:scale-105 z-10"
                      title="Delete photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="dap-gallery-title">
              <span>Legal Proof Document</span>
              {docName ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold normal-case tracking-normal bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-3 w-3" /> Attached
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold normal-case tracking-normal bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                  <Clock className="h-3 w-3" /> Pending
                </span>
              )}
            </div>

            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                docName
                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30 shadow-xs"
                  : "bg-amber-50/30 dark:bg-amber-950/10 border-amber-500/25 border-dashed"
              }`}
            >
              {docName ? (
                /* OCCUPIED / ATTACHED STATE */
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-[#2C4633] text-[#E5C583] dark:bg-[#E5C583] dark:text-[#0B1512] shrink-0 shadow-xs">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#2C4633] dark:text-[#E5C583]">
                        {docType}
                      </div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate mt-0.5">
                        {docName}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 inline" /> Verified Legal Proof
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleOpenDocPicker}
                      className="text-[11px] font-bold text-[#2C4633] dark:text-[#E5C583] hover:underline cursor-pointer border-none bg-transparent p-0"
                    >
                      Replace Paper
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDocName("");
                        setDocDataUrl("");
                        setDocUploaded(false);
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer border-none bg-transparent p-0"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                /* EMPTY STATE */
                <div className="flex flex-col items-center justify-center text-center py-3 space-y-2">
                  <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {docType} Needed
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[200px] leading-tight mt-0.5">
                      Attach proof of ownership document in Step 4 for verification.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenDocPicker}
                    className="mt-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] cursor-pointer border-none transition-opacity hover:opacity-90"
                  >
                    + Upload Legal Document
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. MOVING SPOTLIGHT MASK & FLOATING TOUR TOOLTIP (TARGETING NAVBAR ITEMS)
         ───────────────────────────────────────────────────────────── */}
      {runTour && (
        <div className="tour-portal-backdrop">
          {/* Animated Glowing Spotlight Mask tracking target element in the sidebar */}
          <div className="tour-spotlight-mask" style={spotlightStyle} />

          {/* Floating Tooltip Speech Bubble positioning next to navigation item */}
          <div className="tour-tooltip-card" style={tooltipStyle}>
            <div className="tour-tooltip-header">
              <span className="tour-mascot-badge">Ayla (Lodale Guide)</span>
              <span className="tour-step-indicator">
                {tourStep + 1} / {ADD_PROPERTY_TOUR_STEPS.length}
              </span>
            </div>

            <h4 className="tour-tooltip-title">
              {ADD_PROPERTY_TOUR_STEPS[tourStep]?.title}
            </h4>
            <p className="tour-tooltip-content">
              {ADD_PROPERTY_TOUR_STEPS[tourStep]?.content}
            </p>

            <div className="tour-tooltip-actions">
              <button
                type="button"
                className="tour-btn-skip"
                onClick={() => setRunTour(false)}
              >
                Skip Tour
              </button>

              <div className="tour-nav-buttons">
                {tourStep > 0 && (
                  <button
                    type="button"
                    className="tour-btn-back"
                    onClick={() => setTourStep((prev) => prev - 1)}
                  >
                    Back
                  </button>
                )}

                <button
                  type="button"
                  className="tour-btn-next"
                  onClick={() => {
                    if (tourStep < ADD_PROPERTY_TOUR_STEPS.length - 1) {
                      setTourStep((prev) => prev + 1);
                    } else {
                      setRunTour(false);
                    }
                  }}
                >
                  {tourStep === ADD_PROPERTY_TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. LANDLORD PROFILE DETAILS MODAL (MATCHING DASHBOARD HOMEPAGE)
         ───────────────────────────────────────────────────────────── */}
      {showLandlordProfileModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#12221C] rounded-3xl border border-[#E4EAE1] dark:border-white/10 max-w-sm w-full p-8 shadow-2xl relative text-center">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-slate-400 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xl font-bold p-1 bg-[#FAF8F6] dark:bg-white/5 rounded-full h-8 w-8 flex items-center justify-center cursor-pointer transition-colors border-none outline-none"
              onClick={() => setShowLandlordProfileModal(false)}
            >
              &times;
            </button>

            {/* Profile Avatar */}
            <div className="relative mx-auto w-24 h-24 mb-4">
              <div className="w-full h-full flex items-center justify-center bg-[#2C4633]/10 dark:bg-[#1E382A] rounded-full border-4 border-[#E4EAE1] dark:border-white/10 text-[#2C4633] dark:text-[#E5C583] overflow-hidden text-2xl font-bold">
                {landlordAvatar ? (
                  <img src={landlordAvatar} alt="Landlord profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{username ? username.charAt(0).toUpperCase() : <User className="w-12 h-12" />}</span>
                )}
              </div>
              <span className="absolute bottom-0 right-0 bg-emerald-500 h-5 w-5 rounded-full border-2 border-white dark:border-[#12221C] shadow-sm z-10" />
            </div>

            {/* Name & Role */}
            <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-1">{username}</h3>
            <span className="inline-block bg-[#2C4633]/10 dark:bg-[#E5C583]/10 text-[#2C4633] dark:text-[#E5C583] text-[11px] font-bold px-3 py-1 rounded-full mb-6">
              Verified Landlord
            </span>

            {/* Details List */}
            <div className="space-y-3.5 text-left border-t border-slate-100 dark:border-white/10 pt-5">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-400 dark:text-slate-400 font-medium">Email Address</span>
                <span className="text-slate-900 dark:text-white font-semibold">
                  {localStorage.getItem("lastLoggedInEmail") || "ada.k@lodale.com"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-400 dark:text-slate-400 font-medium">Phone Number</span>
                <span className="text-slate-900 dark:text-white font-semibold">
                  {(() => {
                    try {
                      const p = JSON.parse(localStorage.getItem("currentUserProfile") || "{}");
                      return p.phone || "+234 803 123 4567";
                    } catch (e) {
                      return "+234 803 123 4567";
                    }
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-400 dark:text-slate-400 font-medium">Account Rating</span>
                <span className="text-slate-900 dark:text-white font-semibold flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0 inline" /> 5.0{" "}
                  <span className="text-[11px] text-slate-400 font-normal">(1 review)</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-400 dark:text-slate-400 font-medium">Member Since</span>
                <span className="text-slate-900 dark:text-white font-semibold">
                  Aug 2026
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-400 dark:text-slate-400 font-medium">Portfolio Status</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Active Registration
                </span>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              type="button"
              onClick={() => setShowLandlordProfileModal(false)}
              className="mt-6 w-full py-3 bg-[#2C4633] dark:bg-[#E5C583] text-white dark:text-[#0B1512] font-bold text-[13.5px] rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98] shadow-md border-none outline-none"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
