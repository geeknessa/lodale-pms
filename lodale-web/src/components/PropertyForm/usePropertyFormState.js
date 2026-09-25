import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { handlePropertySubmit } from "../../utils/propertyUtils";
import { propertyService } from "../../services/propertyService";

export const GENERAL_UNIT_AMENITIES = [
  "24/7 Security",
  "Prepaid Meter",
  "Air Conditioning",
  "Balcony",
  "Water Heater",
  "Parking Space",
  "24/7 Power / Generator",
  "En-suite Bathrooms",
  "Fitted Kitchen",
  "CCTV Camera",
  "Elevator"
];

export const GENERAL_UNIT_RULES = [
  "No Pets Allowed",
  "No Smoking Inside",
  "No Parties / Loud Noise",
  "Quiet Hours (10 PM - 6 AM)",
  "Commercial Use Prohibited",
  "Prompt Rent Payment"
];

export const ADD_PROPERTY_TOUR_STEPS = [
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

export default function usePropertyFormState({ isStandalone = false, initialEditId = null } = {}) {
  const params = useParams();
  const navigate = useNavigate();
  const [id] = useState(initialEditId || params.id);
  const [isEditing] = useState(!!(initialEditId || params.id));
  const [currentStep, setCurrentStep] = useState(1);
  const [occupied, setOccupied] = useState(null); // null | true | false
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "warning") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Tour Guide State
  const [runTour, setRunTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [spotlightStyle, setSpotlightStyle] = useState({});
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [recalcTrigger, setRecalcTrigger] = useState(0);

  // Property Type & Subtype
  const [propertyType, setPropertyType] = useState("");
  const [houseSubtype, setHouseSubtype] = useState("");
  const [isMultiUnit, setIsMultiUnit] = useState(false);

  // GPS Location State
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Specifications
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [rent, setRent] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");

  // Requirements & House Rules
  const [requiredIncomeRange, setRequiredIncomeRange] = useState("No Minimum Income");
  const [requiresGuarantor, setRequiresGuarantor] = useState(false);
  const [employmentRequirement, setEmploymentRequirement] = useState("Any Employment");
  const [selectedHouseRules, setSelectedHouseRules] = useState([]);
  const [customRuleInput, setCustomRuleInput] = useState("");

  const [stateName, setStateName] = useState("Lagos");
  const [cityName, setCityName] = useState("");
  const [address, setAddress] = useState("");

  // Blocks & Units
  const [blocksList, setBlocksList] = useState([]);
  const [newBlockName, setNewBlockName] = useState("");
  const [unitAddTab, setUnitAddTab] = useState("manual");
  const [unitsList, setUnitsList] = useState([]);
  const [wasBulkGenerated, setWasBulkGenerated] = useState(false);
  const [selectedUnitIndices, setSelectedUnitIndices] = useState([]);

  // Manual Unit Entry Form
  const [manualUnitName, setManualUnitName] = useState("");
  const [manualBlockName, setManualBlockName] = useState("");
  const [manualBeds, setManualBeds] = useState("2");
  const [manualBaths, setManualBaths] = useState("2");
  const [manualRent, setManualRent] = useState("");
  const [manualRentPeriod, setManualRentPeriod] = useState("annually");
  const [manualHostelPricingType, setManualHostelPricingType] = useState("per_bedspace");
  const [manualDescription, setManualDescription] = useState("");
  const [manualAmenities, setManualAmenities] = useState("");
  const [manualRules, setManualRules] = useState("");
  const [manualUnitImages, setManualUnitImages] = useState([]);

  // Bulk Generator Form
  const [bulkPrefix, setBulkPrefix] = useState("Flat ");
  const [bulkStartNum, setBulkStartNum] = useState("101");
  const [bulkCount, setBulkCount] = useState("6");
  const [bulkBlockName, setBulkBlockName] = useState("");
  const [bulkBeds, setBulkBeds] = useState("2");
  const [bulkBaths, setBulkBaths] = useState("2");
  const [bulkRent, setBulkRent] = useState("2500000");
  const [bulkRentPeriod, setBulkRentPeriod] = useState("annually");
  const [bulkHostelPricingType, setBulkHostelPricingType] = useState("per_bedspace");
  const [bulkDescription, setBulkDescription] = useState("");
  const [bulkSelectedAmenities, setBulkSelectedAmenities] = useState([]);
  const [bulkCustomAmenityInput, setBulkCustomAmenityInput] = useState("");
  const [bulkSelectedRules, setBulkSelectedRules] = useState([]);
  const [bulkCustomRuleInput, setBulkCustomRuleInput] = useState("");
  const [bulkUnitImagesMap, setBulkUnitImagesMap] = useState({});

  const [singleHostelPricingType, setSingleHostelPricingType] = useState("per_bedspace");

  // Editable Unit Row
  const [editingUnitIndex, setEditingUnitIndex] = useState(null);
  const [editingUnitForm, setEditingUnitForm] = useState({
    unit_name: "",
    bedrooms: 1,
    bathrooms: 1,
    rent_amount: 0,
    rent_period: "annually",
    description: "",
    amenities: "",
    rules: "",
    images: []
  });

  // CSV Unit Upload State
  const [csvFileName, setCsvFileName] = useState("");
  const [csvError, setCsvError] = useState("");
  const csvFileInputRef = useRef(null);

  // Photos & Cover Index
  const [propertyPhotos, setPropertyPhotos] = useState([]);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);

  // Rent cycle
  const [rentCycle, setRentCycle] = useState("annual");

  // Proof of Ownership
  const [docType, setDocType] = useState("");
  const [docName, setDocName] = useState("");
  const [docDataUrl, setDocDataUrl] = useState("");
  const [docUploaded, setDocUploaded] = useState(false);

  // Step 5 Occupancy
  const [tenantName, setTenantName] = useState("");
  const [tenantContact, setTenantContact] = useState("");
  const [leaseStartDate, setLeaseStartDate] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");

  // Draft Auto-Save / Restore
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const DRAFT_KEY = "lodale_add_property_draft";

  // Notifications & User Profile
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

  const [showLandlordProfileModal, setShowLandlordProfileModal] = useState(false);
  const [username] = useState(() => {
    const emailKey = sessionStorage.getItem("lastLoggedInEmail");
    if (emailKey) {
      const savedName = localStorage.getItem("landlordName_" + emailKey.toLowerCase());
      if (savedName) return savedName;
    }
    try {
      const raw = sessionStorage.getItem("currentUserProfile");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.name || parsed.displayName) return parsed.name || parsed.displayName;
      }
    } catch (e) { }
    return "Landlord Account";
  });

  const [landlordAvatar, setLandlordAvatar] = useState(() => {
    const emailKey = sessionStorage.getItem("lastLoggedInEmail");
    if (emailKey) {
      const savedUserAvatar = localStorage.getItem("landlordAvatar_" + emailKey.toLowerCase());
      if (savedUserAvatar && !savedUserAvatar.includes("unsplash.com")) return savedUserAvatar;
    }
    const globalSaved = sessionStorage.getItem("landlordAvatarUrl") || localStorage.getItem("landlordAvatarUrl");
    if (globalSaved && !globalSaved.includes("unsplash.com")) return globalSaved;
    try {
      const raw = sessionStorage.getItem("currentUserProfile");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.avatar && !parsed.avatar.includes("unsplash.com")) return parsed.avatar;
      }
    } catch (e) { }
    return "";
  });

  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const cardRef = useRef(null);
  const successOverlayRef = useRef(null);
  const checkIconRef = useRef(null);
  const textContainerRef = useRef(null);

  // Sync isMultiUnit on property type change
  useEffect(() => {
    if (["apartment_building", "estate", "hostel", "commercial_building"].includes(propertyType)) {
      setIsMultiUnit(true);
    } else {
      setIsMultiUnit(false);
    }
  }, [propertyType]);

  // Load draft on mount (if not editing)
  useEffect(() => {
    if (isEditing) {
      setIsDraftLoaded(true);
      return;
    }
    try {
      const saved = localStorage.getItem(DRAFT_KEY) || sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.currentStep) setCurrentStep(draft.currentStep);
        if (draft.displayName !== undefined) setDisplayName(draft.displayName);
        if (draft.propertyType !== undefined) setPropertyType(draft.propertyType);
        if (draft.houseSubtype !== undefined) setHouseSubtype(draft.houseSubtype);
        if (draft.isMultiUnit !== undefined) setIsMultiUnit(draft.isMultiUnit);
        if (draft.latitude !== undefined) setLatitude(draft.latitude);
        if (draft.longitude !== undefined) setLongitude(draft.longitude);
        if (draft.selectedAmenities !== undefined) setSelectedAmenities(draft.selectedAmenities);
        if (draft.customAmenityInput !== undefined) setCustomAmenityInput(draft.customAmenityInput);
        if (draft.bathrooms !== undefined) setBathrooms(draft.bathrooms);
        if (draft.bedrooms !== undefined) setBedrooms(draft.bedrooms);
        if (draft.rent !== undefined) setRent(draft.rent);
        if (draft.description !== undefined) setDescription(draft.description);
        if (draft.rules !== undefined) setRules(draft.rules);
        if (draft.requiredIncomeRange !== undefined) setRequiredIncomeRange(draft.requiredIncomeRange);
        if (draft.requiresGuarantor !== undefined) setRequiresGuarantor(draft.requiresGuarantor);
        if (draft.employmentRequirement !== undefined) setEmploymentRequirement(draft.employmentRequirement);
        if (draft.selectedHouseRules !== undefined) setSelectedHouseRules(draft.selectedHouseRules);
        if (draft.customRuleInput !== undefined) setCustomRuleInput(draft.customRuleInput);
        if (draft.stateName !== undefined) setStateName(draft.stateName);
        if (draft.cityName !== undefined) setCityName(draft.cityName);
        if (draft.address !== undefined) setAddress(draft.address);
        if (draft.blocksList !== undefined) setBlocksList(draft.blocksList);
        if (draft.newBlockName !== undefined) setNewBlockName(draft.newBlockName);
        if (draft.unitsList !== undefined) setUnitsList(draft.unitsList);
        if (draft.wasBulkGenerated !== undefined) setWasBulkGenerated(draft.wasBulkGenerated);
        if (draft.manualUnitName !== undefined) setManualUnitName(draft.manualUnitName);
        if (draft.manualBlockName !== undefined) setManualBlockName(draft.manualBlockName);
        if (draft.manualBeds !== undefined) setManualBeds(draft.manualBeds);
        if (draft.manualBaths !== undefined) setManualBaths(draft.manualBaths);
        if (draft.manualRent !== undefined) setManualRent(draft.manualRent);
        if (draft.manualRentPeriod !== undefined) setManualRentPeriod(draft.manualRentPeriod);
        if (draft.manualHostelPricingType !== undefined) setManualHostelPricingType(draft.manualHostelPricingType);
        if (draft.manualDescription !== undefined) setManualDescription(draft.manualDescription);
        if (draft.manualAmenities !== undefined) setManualAmenities(draft.manualAmenities);
        if (draft.manualRules !== undefined) setManualRules(draft.manualRules);
        if (draft.bulkPrefix !== undefined) setBulkPrefix(draft.bulkPrefix);
        if (draft.bulkStartNum !== undefined) setBulkStartNum(draft.bulkStartNum);
        if (draft.bulkCount !== undefined) setBulkCount(draft.bulkCount);
        if (draft.bulkBlockName !== undefined) setBulkBlockName(draft.bulkBlockName);
        if (draft.bulkBeds !== undefined) setBulkBeds(draft.bulkBeds);
        if (draft.bulkBaths !== undefined) setBulkBaths(draft.bulkBaths);
        if (draft.bulkRent !== undefined) setBulkRent(draft.bulkRent);
        if (draft.bulkRentPeriod !== undefined) setBulkRentPeriod(draft.bulkRentPeriod);
        if (draft.bulkHostelPricingType !== undefined) setBulkHostelPricingType(draft.bulkHostelPricingType);
        if (draft.bulkDescription !== undefined) setBulkDescription(draft.bulkDescription);
        if (draft.bulkSelectedAmenities !== undefined) setBulkSelectedAmenities(draft.bulkSelectedAmenities);
        if (draft.bulkSelectedRules !== undefined) setBulkSelectedRules(draft.bulkSelectedRules);
        if (draft.singleHostelPricingType !== undefined) setSingleHostelPricingType(draft.singleHostelPricingType);
        if (draft.propertyPhotos !== undefined) setPropertyPhotos(draft.propertyPhotos);
        if (draft.coverPhotoIndex !== undefined) setCoverPhotoIndex(draft.coverPhotoIndex);
        if (draft.rentCycle !== undefined) setRentCycle(draft.rentCycle);
        if (draft.docType !== undefined) setDocType(draft.docType);
        if (draft.docName !== undefined) setDocName(draft.docName);
        if (draft.docDataUrl !== undefined) setDocDataUrl(draft.docDataUrl);
        if (draft.docUploaded !== undefined) setDocUploaded(draft.docUploaded);
        if (draft.tenantName !== undefined) setTenantName(draft.tenantName);
        if (draft.tenantContact !== undefined) setTenantContact(draft.tenantContact);
        if (draft.leaseStartDate !== undefined) setLeaseStartDate(draft.leaseStartDate);
        if (draft.availableFrom !== undefined) setAvailableFrom(draft.availableFrom);
        if (draft.occupied !== undefined) setOccupied(draft.occupied);
      }
    } catch (e) {
      console.warn("Error reading property form draft:", e);
    } finally {
      setIsDraftLoaded(true);
    }
  }, [isEditing]);

  // Save changes to draft
  useEffect(() => {
    if (isEditing || !isDraftLoaded) return;
    const draftObj = {
      currentStep,
      displayName,
      propertyType,
      houseSubtype,
      isMultiUnit,
      latitude,
      longitude,
      selectedAmenities,
      customAmenityInput,
      bathrooms,
      bedrooms,
      rent,
      description,
      rules,
      requiredIncomeRange,
      requiresGuarantor,
      employmentRequirement,
      selectedHouseRules,
      customRuleInput,
      stateName,
      cityName,
      address,
      blocksList,
      newBlockName,
      unitsList,
      wasBulkGenerated,
      manualUnitName,
      manualBlockName,
      manualBeds,
      manualBaths,
      manualRent,
      manualRentPeriod,
      manualHostelPricingType,
      manualDescription,
      manualAmenities,
      manualRules,
      bulkPrefix,
      bulkStartNum,
      bulkCount,
      bulkBlockName,
      bulkBeds,
      bulkBaths,
      bulkRent,
      bulkRentPeriod,
      bulkHostelPricingType,
      bulkDescription,
      bulkSelectedAmenities,
      bulkSelectedRules,
      singleHostelPricingType,
      propertyPhotos,
      coverPhotoIndex,
      rentCycle,
      docType,
      docName,
      docDataUrl,
      docUploaded,
      tenantName,
      tenantContact,
      leaseStartDate,
      availableFrom,
      occupied
    };

    try {
      const jsonStr = JSON.stringify(draftObj);
      localStorage.setItem(DRAFT_KEY, jsonStr);
      sessionStorage.setItem(DRAFT_KEY, jsonStr);
    } catch (e) {
      console.warn("Error saving property form draft:", e);
    }
  }, [
    isEditing,
    isDraftLoaded,
    currentStep,
    displayName,
    propertyType,
    houseSubtype,
    isMultiUnit,
    latitude,
    longitude,
    selectedAmenities,
    customAmenityInput,
    bathrooms,
    bedrooms,
    rent,
    description,
    rules,
    requiredIncomeRange,
    requiresGuarantor,
    employmentRequirement,
    selectedHouseRules,
    customRuleInput,
    stateName,
    cityName,
    address,
    blocksList,
    newBlockName,
    unitsList,
    wasBulkGenerated,
    manualUnitName,
    manualBlockName,
    manualBeds,
    manualBaths,
    manualRent,
    manualRentPeriod,
    manualHostelPricingType,
    manualDescription,
    manualAmenities,
    manualRules,
    bulkPrefix,
    bulkStartNum,
    bulkCount,
    bulkBlockName,
    bulkBeds,
    bulkBaths,
    bulkRent,
    bulkRentPeriod,
    bulkHostelPricingType,
    bulkDescription,
    bulkSelectedAmenities,
    bulkSelectedRules,
    singleHostelPricingType,
    propertyPhotos,
    coverPhotoIndex,
    rentCycle,
    docType,
    docName,
    docDataUrl,
    docUploaded,
    tenantName,
    tenantContact,
    leaseStartDate,
    availableFrom,
    occupied
  ]);

  // Edit Mode Loading
  const [isFetchingEdit, setIsFetchingEdit] = useState(false);
  useEffect(() => {
    if (!isEditing) return;

    const loadEditData = async () => {
      setIsFetchingEdit(true);
      try {
        const item = await propertyService.getPropertyById(id);
        if (item) {
          setDisplayName(item.title || "");
          setAddress(item.address_line1 || item.location || "");
          setCityName(item.city || "");
          setStateName(item.state || "Lagos");

          if (item.property_type) setPropertyType(item.property_type);
          if (item.houseSubtype || item.house_subtype) setHouseSubtype(item.houseSubtype || item.house_subtype);
          setIsMultiUnit(Boolean(item.isMultiUnit || (item.units && item.units.length > 1)));

          if (item.rent_amount || item.price) {
            const rawRent = String(item.rent_amount || item.price).replace(/[^0-9]/g, "");
            setRent(rawRent);
          }
          if (item.rentCycle || item.rent_cycle) setRentCycle(item.rentCycle || item.rent_cycle);
          if (item.bedrooms || item.beds) setBedrooms(String(item.bedrooms || item.beds));
          if (item.bathrooms || item.baths) setBathrooms(String(item.bathrooms || item.baths));

          if (item.latitude) setLatitude(String(item.latitude));
          if (item.longitude) setLongitude(String(item.longitude));

          if (item.description) setDescription(item.description);
          if (item.rules) setRules(item.rules);

          if (item.minimum_income_required || item.minimumIncome) {
            setRequiredIncomeRange(item.minimum_income_required || item.minimumIncome);
          }
          if (item.employment_requirement || item.employmentRequirement) {
            setEmploymentRequirement(item.employment_requirement || item.employmentRequirement);
          }
          if (item.requires_guarantor !== undefined || item.requiresGuarantor !== undefined) {
            setRequiresGuarantor(Boolean(item.requires_guarantor ?? item.requiresGuarantor));
          }
          if (Array.isArray(item.house_rules)) {
            setSelectedHouseRules(item.house_rules);
          } else if (typeof item.rules === "string" && item.rules) {
            setSelectedHouseRules(item.rules.split(",").map(r => r.trim()).filter(Boolean));
          }

          if (item.amenities && Array.isArray(item.amenities)) {
            setSelectedAmenities(item.amenities);
          }

          if (item.blocks && Array.isArray(item.blocks)) setBlocksList(item.blocks);
          if (item.units && Array.isArray(item.units)) setUnitsList(item.units);

          const rawCover = item.cover_image || item.image || (item.images && item.images.length > 0 ? item.images[0] : "");
          let photos = item.images && Array.isArray(item.images) ? [...item.images] : (rawCover ? [rawCover] : []);

          if (photos.length > 0) {
            setPropertyPhotos(photos);
            const coverIdx = photos.findIndex(p => p === rawCover);
            if (coverIdx !== -1) setCoverPhotoIndex(coverIdx);
          }

          if (item.ownership_doc_type || item.docType) setDocType(item.ownership_doc_type || item.docType);
          if (item.ownership_doc) setDocName(item.ownership_doc);
          if (item.ownership_doc_url) setDocDataUrl(item.ownership_doc_url);
        }
      } catch (err) {
        showToast("Failed to load property data for editing.", "error");
      } finally {
        setIsFetchingEdit(false);
      }
    };

    loadEditData();
  }, [id, isEditing]);

  const markAllNotifsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem("landlordNotifications", JSON.stringify(updated));
      return updated;
    });
  };

  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      setFormError("Geolocation service is not supported by your browser.");
      return;
    }
    setIsDetectingGps(true);
    setFormError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setIsDetectingGps(false);
        showToast("GPS location detected successfully!", "info");
      },
      () => {
        setFormError("Unable to retrieve your location. Please check location permissions.");
        setIsDetectingGps(false);
      }
    );
  };

  // Actions
  const toggleSelectUnit = (index) => {
    setSelectedUnitIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
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

  const handleManualUnitImageUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    let hasOversized = false;
    Array.from(files).forEach((file) => {
      if (file.size > 50 * 1024 * 1024) {
        hasOversized = true;
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        setManualUnitImages((prev) => [...prev, evt.target.result]);
      };
      reader.readAsDataURL(file);
    });
    if (hasOversized) {
      showToast("One or more unit photos exceed 50MB limit.", "warning");
    }
  };

  const handleEditingUnitImageUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    let hasOversized = false;
    Array.from(files).forEach((file) => {
      if (file.size > 50 * 1024 * 1024) {
        hasOversized = true;
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        setEditingUnitForm((prev) => ({
          ...prev,
          images: [...(prev.images || []), evt.target.result]
        }));
      };
      reader.readAsDataURL(file);
    });
    if (hasOversized) {
      showToast("One or more unit photos exceed 50MB limit.", "warning");
    }
  };

  const handleDirectUnitImageUpload = (unitIndex, e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    let hasOversized = false;
    Array.from(files).forEach((file) => {
      if (file.size > 50 * 1024 * 1024) {
        hasOversized = true;
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        setUnitsList((prev) =>
          prev.map((u, idx) => {
            if (idx !== unitIndex) return u;
            const currentImgs = u.images || u.photos || [];
            return {
              ...u,
              images: [...currentImgs, evt.target.result]
            };
          })
        );
      };
      reader.readAsDataURL(file);
    });
    if (hasOversized) {
      showToast("One or more unit photos exceed 50MB limit.", "warning");
    }
  };

  const handleDeleteUnitImage = (unitIndex, imageIndex) => {
    setUnitsList((prev) =>
      prev.map((u, idx) => {
        if (idx !== unitIndex) return u;
        const currentImgs = u.images || u.photos || [];
        return {
          ...u,
          images: currentImgs.filter((_, i) => i !== imageIndex)
        };
      })
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
      rent_amount: Number(manualRent.replace(/[^0-9.]/g, "")) || 0,
      rent_period: manualRentPeriod || "annually",
      pricing_type: propertyType === "hostel" ? manualHostelPricingType : "",
      description: manualDescription ? manualDescription.trim().slice(0, 1000) : "",
      amenities: manualAmenities ? manualAmenities.trim().slice(0, 1000) : "",
      rules: manualRules ? manualRules.trim().slice(0, 1000) : "",
      images: manualUnitImages || [],
      status: "vacant"
    };
    setUnitsList((prev) => [...prev, newUnit]);
    setManualUnitName("");
    setManualRent("");
    setManualDescription("");
    setManualAmenities("");
    setManualRules("");
    setManualUnitImages([]);
    setFormError("");
  };

  const handleBulkUnitImageUpload = (unitIndex, e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    let hasOversized = false;
    Array.from(files).forEach((file) => {
      if (file.size > 50 * 1024 * 1024) {
        hasOversized = true;
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        setBulkUnitImagesMap((prev) => {
          const currentList = prev[unitIndex] || [];
          return {
            ...prev,
            [unitIndex]: [...currentList, evt.target.result]
          };
        });
      };
      reader.readAsDataURL(file);
    });
    if (hasOversized) {
      showToast("One or more unit photos exceed 50MB limit.", "warning");
    }
  };

  const handleRemoveBulkUnitImage = (unitIndex, imgIdx) => {
    setBulkUnitImagesMap((prev) => {
      const currentList = prev[unitIndex] || [];
      return {
        ...prev,
        [unitIndex]: currentList.filter((_, i) => i !== imgIdx)
      };
    });
  };

  const handleGenerateBulkUnits = () => {
    const count = Number(bulkCount) || 0;
    const start = Number(bulkStartNum) || 101;
    const prefix = bulkPrefix;
    const rentVal = Number(String(bulkRent).replace(/[^0-9.]/g, "")) || 0;

    if (count <= 0) {
      setFormError("Please enter a valid unit count to generate.");
      return;
    }

    const generated = [];
    for (let i = 0; i < count; i++) {
      const uName = `${prefix}${start + i}`.slice(0, 500);
      const uImgs = bulkUnitImagesMap[i] || [];
      generated.push({
        unit_name: uName,
        block_name: bulkBlockName,
        bedrooms: Number(bulkBeds) || 1,
        bathrooms: Number(bulkBaths) || 1,
        rent_amount: rentVal,
        rent_period: bulkRentPeriod || "annually",
        pricing_type: propertyType === "hostel" ? bulkHostelPricingType : "",
        description: bulkDescription ? bulkDescription.trim().slice(0, 1000) : "",
        amenities: bulkSelectedAmenities.length > 0 ? bulkSelectedAmenities.join(", ") : "",
        rules: bulkSelectedRules.length > 0 ? bulkSelectedRules.join(", ") : "",
        images: uImgs,
        status: "vacant"
      });
    }

    setUnitsList((prev) => [...prev, ...generated]);
    setWasBulkGenerated(true);
    setBulkUnitImagesMap({});
    setFormError("");
  };

  const handleStartEditUnit = (index) => {
    const u = unitsList[index];
    if (!u) return;
    setEditingUnitIndex(index);
    setEditingUnitForm({
      unit_name: u.unit_name || "",
      bedrooms: u.bedrooms || 1,
      bathrooms: u.bathrooms || 1,
      rent_amount: u.rent_amount || 0,
      rent_period: u.rent_period || "annually",
      pricing_type: u.pricing_type || u.hostel_pricing_type || "per_bedspace",
      description: u.description || "",
      amenities: typeof u.amenities === "string" ? u.amenities : (Array.isArray(u.amenities) ? u.amenities.join(", ") : ""),
      rules: typeof u.rules === "string" ? u.rules : (Array.isArray(u.rules) ? u.rules.join(", ") : ""),
      images: u.images || u.photos || []
    });
  };

  const handleSaveEditUnit = (index) => {
    if (!editingUnitForm.unit_name.trim()) {
      setFormError("Unit name cannot be empty.");
      return;
    }
    setUnitsList((prev) =>
      prev.map((u, i) =>
        i === index
          ? {
            ...u,
            unit_name: editingUnitForm.unit_name.trim().slice(0, 500),
            bedrooms: Number(editingUnitForm.bedrooms) || 1,
            bathrooms: Number(editingUnitForm.bathrooms) || 1,
            rent_amount: Number(editingUnitForm.rent_amount) || 0,
            rent_period: editingUnitForm.rent_period || "annually",
            pricing_type: propertyType === "hostel" ? editingUnitForm.pricing_type : "",
            description: editingUnitForm.description ? editingUnitForm.description.trim().slice(0, 1000) : "",
            amenities: editingUnitForm.amenities ? editingUnitForm.amenities.trim().slice(0, 1000) : "",
            rules: editingUnitForm.rules ? editingUnitForm.rules.trim().slice(0, 1000) : "",
            images: editingUnitForm.images || []
          }
          : u
      )
    );
    setEditingUnitIndex(null);
    setFormError("");
  };

  const handleCancelEditUnit = () => {
    setEditingUnitIndex(null);
  };

  const handleCsvFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);
    setCsvError("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

        if (lines.length < 2) {
          setCsvError("CSV file is empty or missing headers.");
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""));
        const nameIdx = headers.findIndex((h) => h.includes("unit") || h.includes("name") || h.includes("title"));
        const rentIdx = headers.findIndex((h) => h.includes("rent") || h.includes("price") || h.includes("cost"));
        const bedIdx = headers.findIndex((h) => h.includes("bed") || h.includes("room"));
        const bathIdx = headers.findIndex((h) => h.includes("bath"));

        if (nameIdx === -1) {
          setCsvError("Could not find a 'Unit Name' or 'Title' column in CSV header.");
          return;
        }

        const imported = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
          const uName = cols[nameIdx] || `Unit ${i}`;
          const uRent = rentIdx !== -1 ? Number(cols[rentIdx].replace(/[^0-9.]/g, "")) || 0 : 0;
          const uBeds = bedIdx !== -1 ? Number(cols[bedIdx]) || 1 : 1;
          const uBaths = bathIdx !== -1 ? Number(cols[bathIdx]) || 1 : 1;

          if (uName) {
            imported.push({
              unit_name: uName.slice(0, 500),
              bedrooms: uBeds,
              bathrooms: uBaths,
              rent_amount: uRent,
              rent_period: "annually",
              status: "vacant"
            });
          }
        }

        if (imported.length === 0) {
          setCsvError("No valid unit rows found in CSV.");
          return;
        }

        setUnitsList((prev) => [...prev, ...imported]);
        showToast(`Successfully imported ${imported.length} units from ${file.name}`, "info");
      } catch (err) {
        setCsvError("Failed to parse CSV file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteCsvUnit = (indexToDelete) => {
    setUnitsList((prev) => prev.filter((_, idx) => idx !== indexToDelete));
  };

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

  const toggleRule = (rule) => {
    setSelectedHouseRules((prev) =>
      prev.includes(rule)
        ? prev.filter((r) => r !== rule)
        : [...prev, rule]
    );
  };

  const handleAddCustomRule = (e) => {
    if (e) e.preventDefault();
    const trimmed = customRuleInput.trim();
    if (trimmed && !selectedHouseRules.includes(trimmed)) {
      setSelectedHouseRules((prev) => [...prev, trimmed.slice(0, 500)]);
      setCustomRuleInput("");
    }
  };

  const handlePhotoUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    let hasOversized = false;

    Array.from(files).forEach((file) => {
      if (file.size > 50 * 1024 * 1024) {
        hasOversized = true;
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPropertyPhotos((prev) => [...prev, evt.target.result]);
      };
      reader.readAsDataURL(file);
    });

    if (hasOversized) {
      showToast("One or more property photos exceed 50MB limit.", "warning");
    }
  };

  const handleDeletePhoto = (indexToDelete, e) => {
    if (e) e.stopPropagation();
    setPropertyPhotos((prev) => prev.filter((_, idx) => idx !== indexToDelete));
    if (coverPhotoIndex === indexToDelete) {
      setCoverPhotoIndex(0);
    } else if (coverPhotoIndex > indexToDelete) {
      setCoverPhotoIndex((prev) => prev - 1);
    }
  };

  const handleDocFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast("Uploaded legal document exceeds the 50MB limit.", "warning");
      return;
    }

    setDocName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      setDocDataUrl(evt.target.result);
      setDocUploaded(true);
      setFormError("");
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDoc = () => {
    setDocName("");
    setDocDataUrl("");
    setDocUploaded(false);
  };

  const isStepValid = (stepNum) => {
    if (stepNum === 1) {
      return !!(propertyType?.trim() && displayName?.trim() && address?.trim() && stateName?.trim() && cityName?.trim());
    }
    if (stepNum === 2) {
      if (isMultiUnit) {
        return !!(unitsList && unitsList.length > 0);
      } else {
        const numericRent = Number(String(rent || "").replace(/[^0-9]/g, ""));
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
      if (occupied === true) {
        return !!(tenantName?.trim() && tenantContact?.trim() && leaseStartDate?.trim());
      }
      if (occupied === false) {
        return !!availableFrom?.trim();
      }
      return false;
    }
    return true;
  };

  const canAccessStep = (stepNum) => {
    if (stepNum === 1) return true;
    if (!isStepValid(1)) return false;
    for (let s = 1; s < stepNum; s++) {
      if (!isStepValid(s)) return false;
    }
    return true;
  };

  const isFormFullyValid =
    isStepValid(1) &&
    isStepValid(2) &&
    isStepValid(3) &&
    isStepValid(4) &&
    isStepValid(5);

  const handleNextStep = () => {
    setFormError("");
    if (currentStep === 1) {
      if (!propertyType) {
        setFormError("Please select a building category (e.g. Single House, Apartment Building) before continuing.");
        return;
      }
      if (!displayName?.trim() || !address?.trim() || !stateName || !cityName) {
        setFormError("Please complete all required fields on Step 1 (Display Name, Street Address, State, City) to unlock the rest of the form.");
        return;
      }
    } else if (currentStep === 2) {
      if (isMultiUnit) {
        if (!unitsList || unitsList.length === 0) {
          setFormError("Please add at least 1 unit to your portfolio or generate units to proceed.");
          return;
        }
      } else {
        const numericRent = Number(String(rent || "").replace(/[^0-9]/g, ""));
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
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

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormError("");

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

    try {
      const submittedOk = await handlePropertySubmit({
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
        propertyPhotos: photoUrls,
        coverPhoto: selectedCoverUrl,
        rules,
        requiredIncomeRange,
        requiresGuarantor,
        employmentRequirement,
        selectedHouseRules,
        rentCycle,
        propertyTypeVal: propertyType,
        latitudeVal: latitude,
        longitudeVal: longitude,
        blocksList,
        unitsList,
        isMultiUnit,
        setFormError,
        setIsSubmitted,
        editId: id,
        occupied,
        tenantName,
        tenantContact,
        leaseStartDate,
        availableFrom
      });

      if (submittedOk) {
        localStorage.removeItem("lodale_add_property_draft");
        sessionStorage.removeItem("lodale_add_property_draft");
        setShowConfirmModal(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    id,
    isEditing,
    currentStep,
    setCurrentStep,
    occupied,
    setOccupied,
    isSubmitted,
    formError,
    setFormError,
    displayName,
    setDisplayName,
    toast,
    showToast,
    runTour,
    setRunTour,
    tourStep,
    setTourStep,
    spotlightStyle,
    tooltipStyle,
    recalcTrigger,
    setRecalcTrigger,
    propertyType,
    setPropertyType,
    houseSubtype,
    setHouseSubtype,
    isMultiUnit,
    setIsMultiUnit,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    isDetectingGps,
    selectedAmenities,
    setSelectedAmenities,
    customAmenityInput,
    setCustomAmenityInput,
    bathrooms,
    setBathrooms,
    bedrooms,
    setBedrooms,
    rent,
    setRent,
    description,
    setDescription,
    rules,
    setRules,
    requiredIncomeRange,
    setRequiredIncomeRange,
    requiresGuarantor,
    setRequiresGuarantor,
    employmentRequirement,
    setEmploymentRequirement,
    selectedHouseRules,
    setSelectedHouseRules,
    customRuleInput,
    setCustomRuleInput,
    stateName,
    setStateName,
    cityName,
    setCityName,
    address,
    setAddress,
    blocksList,
    setBlocksList,
    newBlockName,
    setNewBlockName,
    unitAddTab,
    setUnitAddTab,
    unitsList,
    setUnitsList,
    wasBulkGenerated,
    selectedUnitIndices,
    setSelectedUnitIndices,
    manualUnitName,
    setManualUnitName,
    manualBlockName,
    setManualBlockName,
    manualBeds,
    setManualBeds,
    manualBaths,
    setManualBaths,
    manualRent,
    setManualRent,
    manualRentPeriod,
    setManualRentPeriod,
    manualHostelPricingType,
    setManualHostelPricingType,
    manualDescription,
    setManualDescription,
    manualAmenities,
    setManualAmenities,
    manualRules,
    setManualRules,
    manualUnitImages,
    setManualUnitImages,
    bulkPrefix,
    setBulkPrefix,
    bulkStartNum,
    setBulkStartNum,
    bulkCount,
    setBulkCount,
    bulkBlockName,
    setBulkBlockName,
    bulkBeds,
    setBulkBeds,
    bulkBaths,
    setBulkBaths,
    bulkRent,
    setBulkRent,
    bulkRentPeriod,
    setBulkRentPeriod,
    bulkHostelPricingType,
    setBulkHostelPricingType,
    bulkDescription,
    setBulkDescription,
    bulkSelectedAmenities,
    setBulkSelectedAmenities,
    bulkCustomAmenityInput,
    setBulkCustomAmenityInput,
    bulkSelectedRules,
    setBulkSelectedRules,
    bulkCustomRuleInput,
    setBulkCustomRuleInput,
    bulkUnitImagesMap,
    setBulkUnitImagesMap,
    singleHostelPricingType,
    setSingleHostelPricingType,
    editingUnitIndex,
    setEditingUnitIndex,
    editingUnitForm,
    setEditingUnitForm,
    csvFileName,
    csvError,
    csvFileInputRef,
    propertyPhotos,
    setPropertyPhotos,
    coverPhotoIndex,
    setCoverPhotoIndex,
    rentCycle,
    setRentCycle,
    docType,
    setDocType,
    docName,
    setDocName,
    docDataUrl,
    setDocDataUrl,
    docUploaded,
    setDocUploaded,
    tenantName,
    setTenantName,
    tenantContact,
    setTenantContact,
    leaseStartDate,
    setLeaseStartDate,
    availableFrom,
    setAvailableFrom,
    showNotifDropdown,
    setShowNotifDropdown,
    notifications,
    showLandlordProfileModal,
    setShowLandlordProfileModal,
    username,
    landlordAvatar,
    fileInputRef,
    docInputRef,
    cardRef,
    successOverlayRef,
    checkIconRef,
    textContainerRef,
    isFetchingEdit,
    markAllNotifsRead,
    handleDetectGpsLocation,
    toggleSelectUnit,
    toggleSelectAllUnits,
    handleDeleteSelectedUnits,
    handleDeleteAllUnits,
    handleAddBlock,
    handleRemoveBlock,
    handleManualUnitImageUpload,
    handleEditingUnitImageUpload,
    handleDirectUnitImageUpload,
    handleDeleteUnitImage,
    handleAddSingleUnit,
    handleBulkUnitImageUpload,
    handleRemoveBulkUnitImage,
    handleGenerateBulkUnits,
    handleStartEditUnit,
    handleSaveEditUnit,
    handleCancelEditUnit,
    handleCsvFileUpload,
    handleDeleteCsvUnit,
    toggleAmenity,
    handleAddCustomAmenity,
    toggleRule,
    handleAddCustomRule,
    handlePhotoUpload,
    handleDeletePhoto,
    handleDocFileUpload,
    handleDeleteDoc,
    formError,
    setFormError,
    errors: { general: formError },
    isSubmitting,
    showConfirmModal,
    setShowConfirmModal,
    handleConfirmSubmit,
    showSuccessOverlay: isSubmitted,
    setShowSuccessOverlay: setIsSubmitted,
    showNotificationsDropdown: showNotifDropdown,
    setShowNotificationsDropdown: setShowNotifDropdown,
    notificationsList: notifications,
    unreadCount: notifications ? notifications.filter(n => !n.read).length : 0,
    handleDocUpload: handleDocFileUpload,
    handleFileUpload: handlePhotoUpload,
    isStepValid,
    canAccessStep,
    isFormFullyValid,
    handleNextStep,
    handlePrevStep,
    handleSubmit,
    navigate
  };
}
