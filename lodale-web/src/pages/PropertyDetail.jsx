import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { triggerToast } from "../context/ToastContext";
import {
  ArrowLeft,
  Building2,
  BedDouble,
  Bath,
  Wrench,
  User,
  Wallet,
  Calendar,
  PenSquare,
  FileText,
  Upload,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  Layers,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  Star
} from "lucide-react";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import { propertyService } from "../services/propertyService";
import { formatDistanceToNow } from "../utils/formatters";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);

  // Carousel state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Section-based editing state
  const [activeSectionEdit, setActiveSectionEdit] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Landlord management states
  const [isAcceptingApps, setIsAcceptingApps] = useState(true);
  const [tenantsMap, setTenantsMap] = useState({});
  const [propertyApplications, setPropertyApplications] = useState([]);

  // Legal Document re-upload state
  const [reuploadFile, setReuploadFile] = useState(null);
  const [isReuploading, setIsReuploading] = useState(false);

  // New Block/Unit temporary edit state for units section modal
  const [tempNewBlock, setTempNewBlock] = useState("");
  const [tempUnitName, setTempUnitName] = useState("");
  const [tempUnitBeds, setTempUnitBeds] = useState("");
  const [tempUnitBaths, setTempUnitBaths] = useState("");
  const [tempUnitRent, setTempUnitRent] = useState("");
  const [tempUnitBlock, setTempUnitBlock] = useState("");

  useEffect(() => {
    async function loadProperty() {
      try {
        const item = await propertyService.getPropertyById(id);
        setProperty(item);
        if (item) {
          syncEditForm(item);
        }
      } catch (err) {
        console.warn("Failed to load property details:", err);
      }
    }
    loadProperty();
  }, [id]);

  const syncEditForm = (item) => {
    const parseNum = (val) => {
      if (!val && val !== 0) return "";
      const n = Number(String(val).replace(/[^0-9]/g, ""));
      return n || "";
    };

    const rawCover = item.cover_image || item.image || (item.images && item.images.length > 0 ? item.images[0] : "");

    setEditForm({
      title: item.title || "",
      price: item.price || item.rent_amount || "",
      rent_amount: parseNum(item.rent_amount || item.price),
      rent_cycle: item.rent_cycle || item.rentCycle || "annual",
      location: item.location || "",
      address_line1: item.address_line1 || item.location || "",
      city: item.city || "",
      state: item.state || "",
      latitude: item.latitude || "",
      longitude: item.longitude || "",
      beds: parseNum(item.beds || item.bedrooms),
      baths: parseNum(item.baths || item.bathrooms),
      property_type: item.property_type || "single_house",
      houseSubtype: item.houseSubtype || item.house_subtype || "",
      isMultiUnit: item.isMultiUnit || false,
      blocks: Array.isArray(item.blocks) ? [...item.blocks] : [],
      units: Array.isArray(item.units) ? [...item.units] : [],
      description: item.description || "",
      images: item.images ? [...item.images] : (rawCover ? [rawCover] : []),
      cover_image: rawCover,
      amenities: Array.isArray(item.amenities) ? item.amenities.join(", ") : (item.amenities || ""),
      rules: item.rules || "",
      docType: item.docType || "Deed of Assignment"
    });
  };

  useEffect(() => {
    const savedTenants = localStorage.getItem("propertyTenants");
    if (savedTenants) {
      setTenantsMap(JSON.parse(savedTenants));
    }
    const savedApps = localStorage.getItem("propertyApplications");
    if (savedApps) {
      const allApps = JSON.parse(savedApps);
      setPropertyApplications(allApps.filter(app => app.propertyId === id || app.propertyId === property?.id));
    }
  }, [id, property]);

  const openSectionEdit = (sectionName) => {
    if (property) syncEditForm(property);
    setActiveSectionEdit(sectionName);
  };

  const closeSectionEdit = () => {
    setActiveSectionEdit(null);
  };

  const handleSetCoverPhoto = async (photoUrl) => {
    try {
      const updated = {
        ...property,
        cover_image: photoUrl,
        image: photoUrl
      };
      setProperty(updated);
      if (editForm) {
        setEditForm({ ...editForm, cover_image: photoUrl });
      }
      await propertyService.updateProperty(property.id, updated);
      const msg = "Cover photo updated successfully!";
      setSaveSuccessMsg(msg);
      triggerToast(msg, "success", "Cover Photo Set");
    } catch (err) {
      triggerToast("Failed to set cover photo.", "error", "Error");
    }
  };

  const handleSaveSection = async (sectionName) => {
    try {
      const sectionTitles = {
        photos: "Photos & Media",
        specs: "Basic Specifications",
        location: "Location & Address",
        units: "Units & Portfolio",
        amenities: "Amenities & House Rules",
        legal: "Legal Document"
      };

      const processedAmenities = typeof editForm.amenities === 'string'
        ? editForm.amenities.split(',').map(a => a.trim()).filter(Boolean)
        : editForm.amenities;

      const updatedPayload = {
        ...property,
        ...editForm,
        amenities: processedAmenities,
        location: `${editForm.address_line1 || ""}, ${editForm.city || ""}, ${editForm.state || ""}`.replace(/^, /, "").replace(/, , /g, ", ")
      };

      if (!updatedPayload.cover_image && updatedPayload.images && updatedPayload.images.length > 0) {
        updatedPayload.cover_image = updatedPayload.images[0];
      }

      const updatedProperty = await propertyService.updateProperty(property.id, updatedPayload);
      setProperty(updatedProperty);
      closeSectionEdit();

      const label = sectionTitles[sectionName] || "Property specs";
      const successMsg = `Property ${label} updated successfully!`;
      setSaveSuccessMsg(successMsg);
      triggerToast(successMsg, "success", "Update Saved");
    } catch (err) {
      triggerToast(`Failed to update property details.`, "error", "Error");
    }
  };

  const handleDeleteProperty = async () => {
    if (window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      try {
        await propertyService.deleteProperty(property.id);
        triggerToast("Property listing deleted.", "success", "Deleted");
        navigate("/dashboard/landlord");
      } catch (err) {
        triggerToast("Failed to delete property.", "error", "Error");
      }
    }
  };

  const handleReuploadDocSubmit = (e) => {
    e.preventDefault();
    if (!reuploadFile) {
      triggerToast("Please select a document file to upload.", "error", "File Required");
      return;
    }
    setIsReuploading(true);

    setTimeout(() => {
      setIsReuploading(false);
      setReuploadFile(null);
      const updated = {
        ...property,
        status: "pending_review",
        docUploaded: true,
        docName: reuploadFile.name
      };
      setProperty(updated);
      propertyService.updateProperty(property.id, updated);
      closeSectionEdit();
      triggerToast("New proof of ownership uploaded! Status updated to Pending Review.", "success", "Document Uploaded");
    }, 1200);
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-[#12221C] pb-16">
        <div className="bg-[#12221C] border-b border-[#23372B] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#E5C583] text-[#12221C] flex items-center justify-center font-bold">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-white font-bold text-[15px]">Property Management</span>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-6 py-8 mt-4 animate-pulse">
          <div className="h-64 w-full bg-ink-200/40 dark:bg-white/10 rounded-2xl mb-8"></div>
        </div>
      </div>
    );
  }

  // Cover image prioritizing logic
  const currentCoverPhoto = property.cover_image || property.image || (property.images && property.images.length > 0 ? property.images[0] : "");

  let allImages = Array.isArray(property.images) && property.images.length > 0
    ? [...property.images]
    : [currentCoverPhoto || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"];

  // Put cover photo at index 0
  if (currentCoverPhoto && allImages.includes(currentCoverPhoto)) {
    allImages = [currentCoverPhoto, ...allImages.filter(img => img !== currentCoverPhoto)];
  }

  const activePhoto = allImages[activeImageIndex] || currentCoverPhoto;
  const isCurrentActiveCover = activePhoto === currentCoverPhoto;

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const propertyTenants = tenantsMap[property.id] || [];
  const hasTenant = propertyTenants.length > 0;
  const occupancyStatus = hasTenant ? "Occupied" : "Vacant";

  // Calculate Time Listed accurately
  const timeListed = formatDistanceToNow(property.createdAt || property.dateAdded || property.created_at || property.created);

  // Admin status formatting
  const rawStatus = (property.status || "").toLowerCase();
  const isInfoReq = rawStatus === "info_requested" || rawStatus === "info requested" || rawStatus === "needs_proof" || rawStatus === "more_proof_requested";
  const isLive = rawStatus === "approved" || rawStatus === "active" || rawStatus === "live";
  const isRejected = rawStatus === "rejected";

  const getStatusBadge = () => {
    if (isInfoReq) {
      return {
        label: "Needs More Proof",
        color: "bg-amber-500 text-white font-bold border-amber-600 shadow-xs animate-pulse"
      };
    }
    if (isLive) {
      return {
        label: "Active / Live",
        color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300"
      };
    }
    if (isRejected) {
      return {
        label: "Rejected",
        color: "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300"
      };
    }
    return {
      label: "Pending Review",
      color: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300"
    };
  };

  const statusBadge = getStatusBadge();

  const propertyTypeDisplay = property.property_type
    ? property.property_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "House";

  const houseSubtypeDisplay = property.houseSubtype || property.house_subtype;

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#12221C] text-ink-900 dark:text-cream-100 pb-16 transition-colors">
      {/* Landlord Top Bar */}
      <div className="bg-[#12221C] border-b border-[#23372B] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#E5C583] text-[#12221C] flex items-center justify-center font-bold">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="text-white font-bold text-[15px]">Property Management</span>
        </div>
        <button
          onClick={() => navigate("/dashboard/landlord")}
          className="text-[#A3BCA7] hover:text-white transition-colors text-[13px] font-semibold flex items-center gap-2 bg-[#1B2F26] px-4 py-2 rounded-lg border border-[#23372B] cursor-pointer outline-none"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">

        {/* EDIT SUCCESS BANNER */}
        {saveSuccessMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  Changes Saved Successfully!
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300/90 font-medium mt-0.5">
                  {saveSuccessMsg}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSaveSuccessMsg("")}
              className="p-1 text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 cursor-pointer bg-transparent border-none outline-none"
              title="Close Banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* PROOF REQUIRED WARNING BANNER */}
        {isInfoReq && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                  Action Required: Needs More Proof of Ownership
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed mt-0.5">
                  The admin has requested additional verification documents for this property before it can go live. Please upload your document below.
                </p>
              </div>
            </div>
            <button
              onClick={() => openSectionEdit("legal")}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all shrink-0 cursor-pointer border-none outline-none"
            >
              Re-upload Proof Now ↓
            </button>
          </div>
        )}

        {/* SECTION 1: HERO PHOTOS CAROUSEL WITH COVER PHOTO CONTROLS */}
        <div className="relative rounded-2xl overflow-hidden bg-ink-900 aspect-[16/9] max-h-[420px] shadow-lg group">
          <img
            src={activePhoto}
            alt={`${property.title} - Photo ${activeImageIndex + 1}`}
            className="w-full h-full object-cover transition-all duration-300"
          />

          {/* Edit Photos Overlay Button */}
          <button
            onClick={() => openSectionEdit("photos")}
            className="absolute top-4 left-4 bg-white/90 dark:bg-[#16241F]/90 text-ink-900 dark:text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-white dark:hover:bg-[#16241F] cursor-pointer border-none outline-none z-20"
          >
            <ImageIcon className="h-3.5 w-3.5 text-moss-700 dark:text-[#E5C583]" />
            <span>Edit Photos</span>
          </button>

          {/* COVER PHOTO BADGE / SET COVER BUTTON */}
          {isCurrentActiveCover ? (
            <span className="absolute top-4 left-36 bg-[#E5C583] text-[#263b33] px-3 py-1.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 shadow-md z-20">
              <Star className="h-3.5 w-3.5 fill-[#263b33]" />
              <span>MAIN COVER PHOTO</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => handleSetCoverPhoto(activePhoto)}
              className="absolute top-4 left-36 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-md cursor-pointer border-none outline-none z-20 transition-all"
            >
              <Star className="h-3.5 w-3.5" />
              <span>Set as Main Cover Photo</span>
            </button>
          )}

          {/* Status Badges */}
          <span className="absolute bottom-4 left-4 rounded-full bg-[#2C4633] px-3.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider z-10 shadow-sm">
            {occupancyStatus}
          </span>
          <span className={`absolute top-4 right-4 rounded-full px-3.5 py-1 text-[11px] font-bold border uppercase tracking-wider shadow-sm z-10 ${statusBadge.color}`}>
            {statusBadge.label}
          </span>

          {/* Swipe Controls */}
          {allImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 dark:bg-[#16241F]/90 text-ink-900 dark:text-white shadow-md flex items-center justify-center hover:scale-105 transition-all cursor-pointer border-none outline-none z-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 dark:bg-[#16241F]/90 text-ink-900 dark:text-white shadow-md flex items-center justify-center hover:scale-105 transition-all cursor-pointer border-none outline-none z-10"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20 select-none z-10">
            {activeImageIndex + 1} / {allImages.length}
          </div>
        </div>

        {/* THUMBNAILS ROW WITH COVER PHOTO TAG */}
        {allImages.length > 1 && (
          <div className="flex gap-3 mt-3 overflow-x-auto pb-2 scrollbar-none">
            {allImages.map((imgUrl, idx) => {
              const isCover = imgUrl === currentCoverPhoto;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-16 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer p-0 outline-none relative ${activeImageIndex === idx
                    ? "border-moss-600 dark:border-[#E5C583] ring-2 ring-moss-600/30 scale-[1.02]"
                    : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  {isCover && (
                    <span className="absolute bottom-0 inset-x-0 bg-[#E5C583] text-[#263b33] text-[9px] font-bold text-center py-0.5">
                      COVER
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* MAIN CONTENT GRID */}
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_360px] items-start">

          {/* LEFT COLUMN SECTIONS */}
          <div className="space-y-8">

            {/* SECTION 2: BASIC SPECS & OVERVIEW */}
            <div className="rounded-2xl border border-ink-200/50 dark:border-white/10 bg-white dark:bg-[#16241F] p-6 shadow-sm text-left relative space-y-5">
              <div className="flex items-center justify-between border-b border-ink-200/50 dark:border-white/10 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-moss-100 text-moss-800 dark:bg-moss-900/60 dark:text-[#E5C583] border border-moss-200 dark:border-moss-800 uppercase tracking-wider">
                    {propertyTypeDisplay} {houseSubtypeDisplay ? `(${houseSubtypeDisplay})` : ""}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-cream-100 text-ink-800 dark:bg-white/10 dark:text-cream-100 border border-ink-200 dark:border-white/10">
                    {property.isMultiUnit || (property.units && property.units.length > 1) ? `Multi-Unit (${property.units?.length || 0} units)` : "Single Unit"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openSectionEdit("specs")}
                  className="px-3 py-1.5 text-xs font-bold text-moss-700 dark:text-[#E5C583] bg-moss-50 dark:bg-white/10 rounded-xl hover:bg-moss-100 dark:hover:bg-white/15 transition-all flex items-center gap-1.5 cursor-pointer border-none outline-none"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  <span>Edit Specs</span>
                </button>
              </div>

              <div>
                <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-white">
                  {property.title}
                </h1>
                <p className="text-xs text-ink-500 dark:text-cream-100/60 mt-1">Listed {timeListed}</p>
              </div>

              {/* Specs Box */}
              <div className="p-4 rounded-xl bg-[#EAF0E8] dark:bg-white/5 border border-moss-200/60 dark:border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2.5">
                  <BedDouble className="h-4.5 w-4.5 text-moss-700 dark:text-[#E5C583]" />
                  <div>
                    <div className="font-bold text-xs text-ink-900 dark:text-white">{property.bedrooms || property.beds || 1} Bedrooms</div>
                    <div className="text-[10.5px] text-ink-500 dark:text-cream-100/60">Bedrooms</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Bath className="h-4.5 w-4.5 text-moss-700 dark:text-[#E5C583]" />
                  <div>
                    <div className="font-bold text-xs text-ink-900 dark:text-white">{property.bathrooms || property.baths || 1} Bathrooms</div>
                    <div className="text-[10.5px] text-ink-500 dark:text-cream-100/60">Bathrooms</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
                  <Wallet className="h-4.5 w-4.5 text-moss-700 dark:text-[#E5C583]" />
                  <div>
                    <div className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
                      ₦{Number(property.rent_amount || property.price || 0).toLocaleString()}
                      <span className="text-[10px] text-ink-400 font-normal"> / {property.rent_cycle === "monthly" ? "month" : "year"}</span>
                    </div>
                    <div className="text-[10.5px] text-ink-500 dark:text-cream-100/60 font-medium">Asking Rent</div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: LOCATION & GPS */}
            <div className="rounded-2xl border border-ink-200/50 dark:border-white/10 bg-white dark:bg-[#16241F] p-6 shadow-sm text-left space-y-4">
              <div className="flex items-center justify-between border-b border-ink-200/50 dark:border-white/10 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-cream-100/60 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
                  <span>Location & GPS Address</span>
                </h3>

                <button
                  type="button"
                  onClick={() => openSectionEdit("location")}
                  className="px-3 py-1.5 text-xs font-bold text-moss-700 dark:text-[#E5C583] bg-moss-50 dark:bg-white/10 rounded-xl hover:bg-moss-100 dark:hover:bg-white/15 transition-all flex items-center gap-1.5 cursor-pointer border-none outline-none"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  <span>Edit Location</span>
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-ink-800 dark:text-white font-medium flex items-center gap-1">
                  <span>📍 {property.location || `${property.address_line1 || ""}, ${property.city || ""}, ${property.state || ""}`.replace(/^, /, "")}</span>
                </p>
                {(property.latitude || property.longitude) && (
                  <p className="text-[11px] font-mono text-ink-500 dark:text-cream-100/60">
                    GPS Coordinates: Lat {property.latitude || "N/A"} • Long {property.longitude || "N/A"}
                  </p>
                )}
              </div>
            </div>

            {/* SECTION 4: PORTFOLIO STRUCTURE & UNITS */}
            <div className="rounded-2xl border border-ink-200/50 dark:border-white/10 bg-white dark:bg-[#16241F] p-6 shadow-sm text-left space-y-4">
              <div className="flex items-center justify-between border-b border-ink-200/50 dark:border-white/10 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-cream-100/60 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
                  <span>Building Blocks & Portfolio Units</span>
                </h3>

                <button
                  type="button"
                  onClick={() => openSectionEdit("units")}
                  className="px-3 py-1.5 text-xs font-bold text-moss-700 dark:text-[#E5C583] bg-moss-50 dark:bg-white/10 rounded-xl hover:bg-moss-100 dark:hover:bg-white/15 transition-all flex items-center gap-1.5 cursor-pointer border-none outline-none"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  <span>Edit Units & Blocks</span>
                </button>
              </div>

              {/* Building Blocks / Floors List */}
              {Array.isArray(property.blocks) && property.blocks.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-ink-500 dark:text-cream-100/60 block mb-2">Building Blocks / Floors:</span>
                  <div className="flex flex-wrap gap-2">
                    {property.blocks.map((b, idx) => (
                      <span key={idx} className="px-3 py-1 bg-cream-100 dark:bg-white/10 text-xs font-semibold rounded-lg border border-ink-200 dark:border-white/15 text-ink-800 dark:text-cream-100">
                        {b.name || b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-Units List Table */}
              {Array.isArray(property.units) && property.units.length > 0 ? (
                <div>
                  <div className="max-h-56 overflow-y-auto border border-ink-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#12221C]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-cream-100/80 dark:bg-white/5 border-b border-ink-200 dark:border-white/10 text-ink-700 dark:text-cream-100/80 font-bold">
                          <th className="p-2.5">Unit Name</th>
                          <th className="p-2.5">Block</th>
                          <th className="p-2.5">Beds/Baths</th>
                          <th className="p-2.5">Rent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-100 dark:divide-white/5">
                        {property.units.map((unit, uIdx) => (
                          <tr key={uIdx} className="hover:bg-cream-50/50 dark:hover:bg-white/5 text-ink-900 dark:text-white">
                            <td className="p-2.5 font-bold">{unit.unit_name}</td>
                            <td className="p-2.5 text-ink-500 dark:text-cream-100/60">{unit.block_name || "-"}</td>
                            <td className="p-2.5">{unit.bedrooms} bed / {unit.bathrooms} bath</td>
                            <td className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400">
                              ₦{Number(unit.rent_amount).toLocaleString()}/yr
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-500 dark:text-cream-100/60 italic p-3 bg-cream-50 dark:bg-white/5 rounded-xl border border-dashed border-ink-200 dark:border-white/10">
                  Single unit property (no multi-unit breakdown).
                </p>
              )}
            </div>

            {/* SECTION 5: AMENITIES & HOUSE RULES */}
            <div className="rounded-2xl border border-ink-200/50 dark:border-white/10 bg-white dark:bg-[#16241F] p-6 shadow-sm text-left space-y-4">
              <div className="flex items-center justify-between border-b border-ink-200/50 dark:border-white/10 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-cream-100/60 flex items-center gap-1.5">
                  <Wrench className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
                  <span>Amenities & House Rules</span>
                </h3>

                <button
                  type="button"
                  onClick={() => openSectionEdit("amenities")}
                  className="px-3 py-1.5 text-xs font-bold text-moss-700 dark:text-[#E5C583] bg-moss-50 dark:bg-white/10 rounded-xl hover:bg-moss-100 dark:hover:bg-white/15 transition-all flex items-center gap-1.5 cursor-pointer border-none outline-none"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  <span>Edit Amenities & Rules</span>
                </button>
              </div>

              {/* Amenities Tags */}
              <div>
                <span className="text-[11px] font-semibold text-ink-500 dark:text-cream-100/60 block mb-2">Amenities:</span>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(property.amenities) && property.amenities.length > 0 ? (
                    property.amenities.map((a) => (
                      <span key={a} className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-ink-400 italic">No amenities specified</span>
                  )}
                </div>
              </div>

              {/* House Rules */}
              {property.rules && (
                <div>
                  <span className="text-[11px] font-semibold text-ink-500 dark:text-cream-100/60 block mb-1">House Rules:</span>
                  <p className="text-xs text-ink-700 dark:text-cream-100/80 leading-relaxed bg-cream-50/70 dark:bg-white/5 p-3 rounded-xl border border-ink-200/40 dark:border-white/10 whitespace-pre-line">
                    {property.rules}
                  </p>
                </div>
              )}
            </div>

            {/* SECTION 6: LEGAL PROOF OF OWNERSHIP */}
            <div id="legal-documents-section" className="rounded-2xl border border-ink-200/50 dark:border-white/10 bg-white dark:bg-[#16241F] p-6 shadow-sm text-left space-y-4">
              <div className="flex items-center justify-between border-b border-ink-200/50 dark:border-white/10 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-cream-100/60 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-moss-600 dark:text-[#E5C583]" />
                  <span>Legal Proof of Ownership</span>
                </h3>

                <button
                  type="button"
                  onClick={() => openSectionEdit("legal")}
                  className="px-3 py-1.5 text-xs font-bold text-moss-700 dark:text-[#E5C583] bg-moss-50 dark:bg-white/10 rounded-xl hover:bg-moss-100 dark:hover:bg-white/15 transition-all flex items-center gap-1.5 cursor-pointer border-none outline-none"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  <span>Edit Legal Paper</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-ink-200/50 dark:border-white/10 bg-cream-50/50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-white/10 rounded-lg border border-ink-200/50 dark:border-white/10 text-moss-700 dark:text-[#E5C583]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-900 dark:text-white">
                      {property.docName || property.docType || "Proof of Ownership Document"}
                    </p>
                    <p className="text-[11px] text-ink-500 dark:text-cream-100/60">
                      {isLive ? "Verified by Admin" : "Submitted for Review"} • {timeListed}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: LANDLORD ACTION CONTROLS */}
          <div className="space-y-6 text-left">
            <div className="rounded-2xl border border-ink-200/50 dark:border-white/10 bg-white dark:bg-[#16241F] p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-cream-100/60">
                Management Actions
              </h3>

              <div className="flex flex-col gap-2.5">
                <Button
                  onClick={() => openSectionEdit("specs")}
                  variant="primary"
                  className="w-full text-xs py-2.5 gap-2 cursor-pointer"
                >
                  <PenSquare className="h-4 w-4" /> Edit Property Specs
                </Button>

                <Button
                  onClick={() => {
                    const statusMsg = isAcceptingApps ? "Applications paused for this property." : "Applications active for this property.";
                    setIsAcceptingApps(!isAcceptingApps);
                    triggerToast(statusMsg, "info", "Property Status");
                  }}
                  variant="secondary"
                  className="w-full text-xs py-2.5 cursor-pointer"
                >
                  {isAcceptingApps ? "Pause Applications" : "Activate Applications"}
                </Button>

                <Button
                  onClick={handleDeleteProperty}
                  variant="secondary"
                  className="w-full text-xs py-2.5 gap-2 cursor-pointer text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  Delete Property
                </Button>
              </div>
            </div>

            {/* Applications Card */}
            <div className="rounded-2xl border border-ink-200/50 dark:border-white/10 bg-white dark:bg-[#16241F] p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-cream-100/60 mb-3">
                Rental Applications ({propertyApplications.length})
              </h3>
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <User className="h-6 w-6 text-ink-300 dark:text-cream-100/40 mb-2" />
                <p className="text-xs text-ink-500 dark:text-cream-100/60">No pending tenant applications.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          INLINE SECTION EDIT MODAL / DRAWER
         ────────────────────────────────────────────────────────────────── */}
      {activeSectionEdit && editForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#12221C] rounded-2xl shadow-2xl border border-ink-200 dark:border-white/10 overflow-hidden max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="p-4 bg-[#2C4633] dark:bg-[#16241F] text-white flex items-center justify-between border-b border-white/10">
              <h3 className="font-bold text-sm text-white capitalize flex items-center gap-2">
                <PenSquare className="h-4 w-4 text-[#E5C583]" />
                <span>Edit {activeSectionEdit === "specs" ? "Basic Specifications" : activeSectionEdit === "photos" ? "Photos & Cover Image" : activeSectionEdit === "location" ? "Location Address" : activeSectionEdit === "units" ? "Units & Portfolio" : activeSectionEdit === "amenities" ? "Amenities & Rules" : "Legal Document"}</span>
              </h3>
              <button
                type="button"
                onClick={closeSectionEdit}
                className="text-white/70 hover:text-white p-1 rounded-lg cursor-pointer bg-transparent border-none outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-left flex-1">

              {/* SECTION: PHOTOS & COVER IMAGE EDITING */}
              {activeSectionEdit === "photos" && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300">
                    <span className="font-bold">Cover Photo Tip:</span> Click <strong>"Set Cover"</strong> on any uploaded image to make it the primary hero photo shown to prospective tenants.
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {editForm.images.map((img, idx) => {
                      const isCover = editForm.cover_image === img;
                      return (
                        <div key={idx} className={`relative group h-28 rounded-xl overflow-hidden border-2 ${isCover ? 'border-moss-600 dark:border-[#E5C583] ring-2 ring-moss-600/30' : 'border-transparent'}`}>
                          <img src={img} alt={`Photo ${idx}`} className="w-full h-full object-cover" />

                          {isCover ? (
                            <div className="absolute top-1 left-1 bg-[#E5C583] text-[#263b33] text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow">
                              ★ COVER PHOTO
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditForm({ ...editForm, cover_image: img })}
                              className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-white/90 dark:bg-[#16241F]/90 text-ink-900 dark:text-white px-2 py-0.5 rounded shadow hover:bg-white cursor-pointer border-none outline-none z-10"
                            >
                              Set Cover
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const newImgs = editForm.images.filter((_, i) => i !== idx);
                              setEditForm({
                                ...editForm,
                                images: newImgs,
                                cover_image: editForm.cover_image === img ? (newImgs[0] || "") : editForm.cover_image
                              });
                            }}
                            className="absolute top-1.5 right-1.5 bg-rose-500 text-white rounded-full p-1 cursor-pointer border-none outline-none shadow hover:bg-rose-600"
                            title="Remove Photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    <label className="h-28 border-2 border-dashed border-ink-200 dark:border-white/20 hover:border-moss-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-cream-50 dark:bg-white/5">
                      <Plus className="w-6 h-6 text-ink-400 dark:text-cream-100/60" />
                      <span className="text-[10px] font-semibold text-ink-500 dark:text-cream-100/70 mt-1">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          files.forEach(file => {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              setEditForm(prev => {
                                const newImages = [...(prev.images || []), evt.target.result];
                                return {
                                  ...prev,
                                  images: newImages,
                                  cover_image: prev.cover_image || newImages[0]
                                };
                              });
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* SECTION: BASIC SPECS EDITING */}
              {activeSectionEdit === "specs" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Property Title *</label>
                    <input
                      type="text"
                      className="w-full border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Property Type</label>
                      <select
                        className="w-full border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                        value={editForm.property_type}
                        onChange={(e) => setEditForm({ ...editForm, property_type: e.target.value })}
                      >
                        <option value="single_house">Single House / Villa</option>
                        <option value="apartment_building">Apartment Building</option>
                        <option value="estate">Gated Estate</option>
                        <option value="hostel">Student Hostel</option>
                        <option value="boys_quarters">Boys Quarters (BQ)</option>
                        <option value="commercial_building">Commercial Building</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">House Subtype</label>
                      <select
                        className="w-full border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                        value={editForm.houseSubtype}
                        onChange={(e) => setEditForm({ ...editForm, houseSubtype: e.target.value })}
                      >
                        <option value="">None / Not Applicable</option>
                        <option value="duplex">Duplex</option>
                        <option value="bungalow">Bungalow</option>
                        <option value="terrace">Terrace House</option>
                        <option value="detached">Detached House</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Bedrooms</label>
                      <input
                        type="number"
                        className="w-full border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                        value={editForm.beds}
                        onChange={(e) => setEditForm({ ...editForm, beds: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Bathrooms</label>
                      <input
                        type="number"
                        className="w-full border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                        value={editForm.baths}
                        onChange={(e) => setEditForm({ ...editForm, baths: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Asking Rent (₦)</label>
                      <input
                        type="number"
                        className="w-full border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                        value={editForm.rent_amount}
                        onChange={(e) => setEditForm({ ...editForm, rent_amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Rent Cycle</label>
                      <select
                        className="w-full border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                        value={editForm.rent_cycle}
                        onChange={(e) => setEditForm({ ...editForm, rent_cycle: e.target.value })}
                      >
                        <option value="annual">Per Year (Annual)</option>
                        <option value="monthly">Per Month (Monthly)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: LOCATION EDITING */}
              {activeSectionEdit === "location" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Address Line 1 *</label>
                    <input
                      type="text"
                      className="w-full border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                      value={editForm.address_line1}
                      onChange={(e) => setEditForm({ ...editForm, address_line1: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">City / Area *</label>
                      <input
                        type="text"
                        className="w-full border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">State *</label>
                      <input
                        type="text"
                        className="w-full border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                        value={editForm.state}
                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Latitude (GPS Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 6.454066"
                        className="w-full border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                        value={editForm.latitude}
                        onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Longitude (GPS Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 3.424583"
                        className="w-full border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                        value={editForm.longitude}
                        onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: UNITS & BLOCKS EDITING */}
              {activeSectionEdit === "units" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Building Blocks / Floors</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="e.g. Block A, Floor 1"
                        value={tempNewBlock}
                        onChange={(e) => setTempNewBlock(e.target.value)}
                        className="flex-1 border border-ink-200 dark:border-white/15 rounded-xl px-3 py-1.5 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (tempNewBlock.trim()) {
                            setEditForm({
                              ...editForm,
                              blocks: [...editForm.blocks, { name: tempNewBlock.trim() }]
                            });
                            setTempNewBlock("");
                          }
                        }}
                        className="px-3 py-1.5 bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs rounded-xl cursor-pointer border-none outline-none"
                      >
                        + Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {editForm.blocks.map((b, bIdx) => (
                        <span key={bIdx} className="px-2.5 py-1 bg-cream-100 dark:bg-white/10 text-xs font-semibold rounded-lg flex items-center gap-1 text-ink-900 dark:text-white">
                          {b.name || b}
                          <button
                            type="button"
                            onClick={() => {
                              setEditForm({
                                ...editForm,
                                blocks: editForm.blocks.filter((_, i) => i !== bIdx)
                              });
                            }}
                            className="text-rose-500 font-bold ml-1 cursor-pointer bg-transparent border-none outline-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Add New Unit to Portfolio</label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Unit Name (Flat 101)"
                        value={tempUnitName}
                        onChange={(e) => setTempUnitName(e.target.value)}
                        className="border border-ink-200 dark:border-white/15 rounded-xl px-2.5 py-1.5 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Rent (₦)"
                        value={tempUnitRent}
                        onChange={(e) => setTempUnitRent(e.target.value)}
                        className="border border-ink-200 dark:border-white/15 rounded-xl px-2.5 py-1.5 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (tempUnitName.trim()) {
                          const newU = {
                            unit_name: tempUnitName.trim(),
                            block_name: tempUnitBlock || "",
                            bedrooms: tempUnitBeds || 1,
                            bathrooms: tempUnitBaths || 1,
                            rent_amount: tempUnitRent || editForm.rent_amount || 0
                          };
                          setEditForm({
                            ...editForm,
                            isMultiUnit: true,
                            units: [...editForm.units, newU]
                          });
                          setTempUnitName("");
                          setTempUnitRent("");
                        }
                      }}
                      className="w-full py-1.5 bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs rounded-xl cursor-pointer border-none outline-none"
                    >
                      + Add Unit to List
                    </button>
                  </div>

                  {editForm.units.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border border-ink-200 dark:border-white/10 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-cream-100 dark:bg-white/5 border-b font-bold">
                            <th className="p-2">Name</th>
                            <th className="p-2">Rent</th>
                            <th className="p-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {editForm.units.map((u, uIdx) => (
                            <tr key={uIdx}>
                              <td className="p-2 font-bold">{u.unit_name}</td>
                              <td className="p-2">₦{Number(u.rent_amount).toLocaleString()}</td>
                              <td className="p-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditForm({
                                      ...editForm,
                                      units: editForm.units.filter((_, i) => i !== uIdx)
                                    });
                                  }}
                                  className="text-rose-500 font-bold cursor-pointer bg-transparent border-none outline-none"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: AMENITIES & RULES EDITING */}
              {activeSectionEdit === "amenities" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Amenities (comma separated)</label>
                    <input
                      type="text"
                      className="w-full border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                      placeholder="Swimming Pool, Generator, Security, WiFi"
                      value={editForm.amenities}
                      onChange={(e) => setEditForm({ ...editForm, amenities: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">House Rules & Guidelines</label>
                    <textarea
                      rows="4"
                      className="w-full border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                      placeholder="List any house rules for prospective tenants..."
                      value={editForm.rules}
                      onChange={(e) => setEditForm({ ...editForm, rules: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              )}

              {/* SECTION: LEGAL DOCUMENT EDITING */}
              {activeSectionEdit === "legal" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Document Type</label>
                    <select
                      className="w-full border border-ink-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#12221C] text-ink-900 dark:text-white outline-none"
                      value={editForm.docType}
                      onChange={(e) => setEditForm({ ...editForm, docType: e.target.value })}
                    >
                      <option value="Deed of Assignment">Deed of Assignment</option>
                      <option value="Certificate of Occupancy">Certificate of Occupancy (C of O)</option>
                      <option value="Governor's Consent">Governor's Consent</option>
                      <option value="Purchase Receipt & Survey Plan">Purchase Receipt & Survey Plan</option>
                    </select>
                  </div>

                  <form onSubmit={handleReuploadDocSubmit} className="pt-2">
                    <label className="block text-xs font-bold text-ink-900 dark:text-white mb-1">Upload New Document File</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setReuploadFile(e.target.files[0])}
                      className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-moss-700 file:text-white cursor-pointer"
                    />

                    {reuploadFile && (
                      <button
                        type="submit"
                        disabled={isReuploading}
                        className="w-full mt-3 py-2 rounded-xl bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#263b33] font-bold text-xs cursor-pointer border-none outline-none"
                      >
                        {isReuploading ? "Uploading..." : "Upload New File Now"}
                      </button>
                    )}
                  </form>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-cream-50 dark:bg-[#16241F] border-t border-ink-200 dark:border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeSectionEdit}
                className="px-4 py-2 text-xs font-bold text-ink-700 dark:text-cream-100 hover:bg-ink-100 dark:hover:bg-white/10 rounded-xl cursor-pointer transition-all border-none outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveSection(activeSectionEdit)}
                className="px-5 py-2 text-xs font-bold bg-moss-700 dark:bg-[#E5C583] text-white dark:text-[#263b33] rounded-xl hover:opacity-90 cursor-pointer transition-all border-none outline-none flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Save {activeSectionEdit}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
