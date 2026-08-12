import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { triggerToast } from "../context/ToastContext";
import { ArrowLeft, Building2, BedDouble, Bath, Wrench, User, Wallet, Calendar, Sliders, PenSquare, FileText, Download, Upload, X, Plus } from "lucide-react";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import { LISTINGS } from "../data/listings";
import { propertyService } from "../services/propertyService";

function formatDistanceToNow(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);

  // State to simulate management toggles
  const [isAcceptingApps, setIsAcceptingApps] = useState(true);
  const [tenantsMap, setTenantsMap] = useState({});
  const [propertyApplications, setPropertyApplications] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    async function loadProperty() {
      try {
        const item = await propertyService.getPropertyById(id);
        setProperty(item);
        if (item && !editForm) {
          const parseNum = (val) => {
            if (!val && val !== 0) return "";
            const n = Number(String(val).replace(/[^0-9]/g, ""));
            return n || "";
          };
          
          setEditForm({
            title: item.title || "",
            price: item.price || item.rent_amount || "",
            rent_amount: parseNum(item.rent_amount || item.price),
            location: item.location || "",
            beds: parseNum(item.beds || item.bedrooms),
            baths: parseNum(item.baths || item.bathrooms),
            description: item.description || "",
            images: item.images ? [...item.images] : (item.cover_image || item.image ? [item.cover_image || item.image] : []),
            cover_image: item.cover_image || item.image || (item.images && item.images.length > 0 ? item.images[0] : ""),
            address_line1: item.address_line1 || item.location || "",
            city: item.city || "",
            state: item.state || "",
            property_type: item.property_type || "apartment",
            amenities: Array.isArray(item.amenities) ? item.amenities.join(", ") : (item.amenities || ""),
            rules: item.rules || ""
          });
        }
      } catch (err) {
        console.warn("Failed to load property details:", err);
      }
    }
    loadProperty();
  }, [id]);

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

  const handleDelete = async () => {
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

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      // Process amenities from comma-separated string to array
      const processedAmenities = typeof editForm.amenities === 'string' 
        ? editForm.amenities.split(',').map(a => a.trim()).filter(Boolean)
        : editForm.amenities;
        
      const updatedPayload = { 
        ...editForm,
        amenities: processedAmenities,
        location: `${editForm.address_line1}, ${editForm.city}, ${editForm.state}`
      };
      
      // Fallback for cover_image if none selected
      if (!updatedPayload.cover_image && updatedPayload.images && updatedPayload.images.length > 0) {
        updatedPayload.cover_image = updatedPayload.images[0];
      }
      
      const updatedProperty = await propertyService.updateProperty(property.id, updatedPayload);
      setProperty(updatedProperty);
      setIsEditing(false);
      triggerToast("Property details updated successfully.", "success", "Updated");
    } catch (err) {
      triggerToast("Failed to update property details.", "error", "Error");
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-cream-50 pb-16">
        <div className="bg-[#12221C] border-b border-[#23372B] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#E5C583] text-[#12221C] flex items-center justify-center font-bold">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-white font-bold text-[15px]">Property Management</span>
          </div>
        </div>
        
        <div className="mx-auto max-w-5xl px-6 py-8 mt-4 animate-pulse">
          {/* Skeleton Hero */}
          <div className="h-64 w-full bg-ink-200/40 rounded-2xl mb-8"></div>
          
          <div className="grid gap-8 md:grid-cols-[1fr_360px]">
            {/* Skeleton Left Column */}
            <div className="space-y-8">
              <div className="rounded-2xl border border-ink-200/50 bg-white p-6 h-64"></div>
              <div className="rounded-2xl border border-ink-200/50 bg-white p-6 h-48"></div>
            </div>
            
            {/* Skeleton Right Column */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-ink-200/50 bg-white p-6 h-48"></div>
              <div className="rounded-2xl border border-ink-200/50 bg-white p-6 h-40"></div>
              <div className="rounded-2xl border border-ink-200/50 bg-white p-6 h-48"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine dynamic occupancy and maintenance details based on property ID
  const isSkyline = property.id.includes("skyline");
  const isOakwood = property.id.includes("oakwood");
  const isLekki = property.id.includes("lekki");

  const propertyTenants = tenantsMap[property.id] || [];
  const hasTenant = propertyTenants.length > 0;
  const tenantInfo = hasTenant ? {
    name: propertyTenants[0].name,
    avatar: propertyTenants[0].avatar,
    lease: propertyTenants[0].leaseStatus,
    score: propertyTenants[0].reliabilityScore,
  } : null;

  const occupancyStatus = hasTenant ? "Occupied" : "Vacant";
  
  // Calculate Time Listed
  const dateAddedStr = property.dateAdded || property.createdAt;
  const listingDate = dateAddedStr ? new Date(dateAddedStr) : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  let timeListed = "";
  try {
    timeListed = formatDistanceToNow(listingDate);
  } catch (err) {
    timeListed = "Listed recently";
  }

  // Admin Status Formatting
  const adminStatus = property.status || "pending_review";
  const formatStatus = (s) => {
    if (s === "pending_review") return { label: "Pending Review", color: "bg-amber-100 text-amber-800 border-amber-300" };
    if (s === "approved" || s === "active") return { label: "Active/Live", color: "bg-moss-100 text-moss-800 border-moss-300" };
    if (s === "info_requested") return { label: "Info Needed", color: "bg-blue-100 text-blue-800 border-blue-300" };
    if (s === "rejected") return { label: "Rejected", color: "bg-rose-100 text-rose-800 border-rose-300" };
    return { label: s, color: "bg-ink-100 text-ink-800 border-ink-300" };
  };
  const statusInfo = formatStatus(adminStatus);

  let maintenanceLogs = [];

  if (isSkyline) {
    maintenanceLogs = [
      {
        id: 1,
        type: "Repair",
        details: "Fix bedroom AC unit blowing warm air",
        status: "Pending",
        date: "Today, 09:30 AM",
      },
    ];
  } else if (isOakwood) {
    maintenanceLogs = [
      {
        id: 2,
        type: "Upgrade",
        details: "Upgrade kitchen plumbing & sink setup",
        status: "In Progress",
        date: "Yesterday, 02:15 PM",
      },
    ];
  } else if (isLekki) {
    maintenanceLogs = [
      {
        id: 3,
        type: "Repair",
        details: "Fix master bedroom window lock",
        status: "Completed",
        date: "July 18, 2026",
      },
    ];
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-16">
      {/* Landlord Property Management Header */}
      <div className="bg-[#12221C] border-b border-[#23372B] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#E5C583] text-[#12221C] flex items-center justify-center font-bold">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="text-white font-bold text-[15px]">Property Management</span>
        </div>
        <button 
          onClick={() => navigate("/dashboard/landlord")} 
          className="text-[#A3BCA7] hover:text-white transition-colors text-[13px] font-semibold flex items-center gap-2 bg-[#1B2F26] px-4 py-2 rounded-lg border border-[#23372B]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 mt-4">

        {/* Hero Visual Panel */}
        <div className="flex h-64 items-center justify-center rounded-2xl bg-[#E4EAE1] border border-ink-200/40 relative overflow-hidden">
          {property.image || property.cover_image || (property.images && property.images.length > 0) ? (
            <img
              src={property.image || property.cover_image || property.images[0]}
              alt={property.title}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <Building2 className="h-16 w-16 text-[#2C4633]/25" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          <span className="absolute bottom-4 left-6 rounded-full bg-[#2C4633] px-3.5 py-1.5 text-[11px] font-bold text-white uppercase tracking-wider z-10">
            {occupancyStatus}
          </span>
          <span className={`absolute top-4 right-6 rounded-full px-3.5 py-1.5 text-[11px] font-bold border uppercase tracking-wider shadow-sm z-10 ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Additional Images Gallery */}
        {property.images && Array.isArray(property.images) && property.images.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-4">
            {property.images.slice(0, 4).map((img, index) => (
              <div key={index} className="h-24 md:h-32 rounded-xl overflow-hidden relative group">
                <img src={img} alt={`${property.title} - ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        )}

        {/* Grid Layout */}
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_360px]">
          {/* LEFT COLUMN: Property Spec Details */}
          <div className="space-y-8">
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="rounded-2xl border border-ink-200/50 bg-white p-6 shadow-sm text-left">
                <h3 className="font-display text-xl font-bold text-ink-900 mb-4">Edit Property Details</h3>
                
                {/* Images Manager */}
                <div className="mb-6 border-b border-ink-200/50 pb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-[13px] font-bold text-ink-900">Property Photos</label>
                    <span className="text-[11px] text-ink-500 font-medium">{editForm?.images?.length || 0} / 5 photos</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    {editForm?.images?.map((img, idx) => (
                      <div key={idx} className={`relative group h-24 rounded-lg overflow-hidden border-2 ${editForm?.cover_image === img ? 'border-moss-600' : 'border-transparent'}`}>
                        <img src={img} alt={`Property ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                          <button 
                            type="button"
                            onClick={() => {
                              const newImages = editForm.images.filter((_, i) => i !== idx);
                              setEditForm({...editForm, images: newImages, cover_image: editForm.cover_image === img ? (newImages[0] || "") : editForm.cover_image});
                            }}
                            className="self-end bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {editForm?.cover_image !== img && (
                            <button 
                              type="button"
                              onClick={() => setEditForm({...editForm, cover_image: img})}
                              className="text-[9px] font-bold bg-white text-ink-900 px-1 py-0.5 rounded shadow"
                            >
                              Set Cover
                            </button>
                          )}
                        </div>
                        {editForm?.cover_image === img && (
                          <div className="absolute bottom-0 left-0 right-0 bg-moss-600 text-white text-[10px] font-bold text-center py-0.5">
                            COVER
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Add Image Button */}
                    {(editForm?.images?.length || 0) < 5 && (
                      <label className="h-24 border-2 border-dashed border-ink-200 hover:border-moss-500 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors bg-cream-50/50 hover:bg-moss-50/50">
                        <Plus className="w-6 h-6 text-ink-400" />
                        <span className="text-[10px] font-semibold text-ink-500 mt-1">Add Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          multiple 
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const currentImages = editForm?.images || [];
                            const remaining = 5 - currentImages.length;
                            
                            files.slice(0, remaining).forEach(file => {
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
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-bold text-ink-900 mb-1">Display Name / Title</label>
                    <input type="text" className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[13px]" value={editForm?.title || ""} onChange={(e) => setEditForm({...editForm, title: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-ink-900 mb-1">Rent Amount (₦/yr)</label>
                      <input type="number" className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[13px]" value={editForm?.rent_amount || ""} onChange={(e) => setEditForm({...editForm, rent_amount: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-ink-900 mb-1">Property Type</label>
                      <select className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[13px]" value={editForm?.property_type || "apartment"} onChange={(e) => setEditForm({...editForm, property_type: e.target.value})}>
                        <option value="apartment">Apartment</option>
                        <option value="detached">Detached House</option>
                        <option value="semi_detached">Semi-Detached</option>
                        <option value="terrace">Terrace</option>
                        <option value="commercial">Commercial</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-ink-900 mb-1">Address Line 1</label>
                    <input type="text" className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[13px]" value={editForm?.address_line1 || ""} onChange={(e) => setEditForm({...editForm, address_line1: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-ink-900 mb-1">City / Area</label>
                      <input type="text" className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[13px]" value={editForm?.city || ""} onChange={(e) => setEditForm({...editForm, city: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-ink-900 mb-1">State</label>
                      <input type="text" className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[13px]" value={editForm?.state || ""} onChange={(e) => setEditForm({...editForm, state: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-ink-900 mb-1">Bedrooms</label>
                      <input type="number" className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[13px]" value={editForm?.beds || ""} onChange={(e) => setEditForm({...editForm, beds: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-ink-900 mb-1">Bathrooms</label>
                      <input type="number" className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[13px]" value={editForm?.baths || ""} onChange={(e) => setEditForm({...editForm, baths: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-ink-900 mb-1">Amenities (comma separated)</label>
                    <input type="text" className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[13px]" placeholder="e.g. WiFi, Pool, Gym" value={editForm?.amenities || ""} onChange={(e) => setEditForm({...editForm, amenities: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-ink-900 mb-1">House Rules & Policies</label>
                    <textarea rows="3" className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[13px]" placeholder="List any specific rules..." value={editForm?.rules || ""} onChange={(e) => setEditForm({...editForm, rules: e.target.value})}></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-[12px] font-bold text-ink-900 mb-1">Description</label>
                    <textarea rows="4" className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[13px]" value={editForm?.description || ""} onChange={(e) => setEditForm({...editForm, description: e.target.value})}></textarea>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mt-6">
                  <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Save Changes</Button>
                </div>
              </form>
            ) : (
              <div className="rounded-2xl border border-ink-200/50 bg-white p-6 shadow-sm text-left relative">
                <div className="absolute top-6 right-6 text-right">
                  <span className="block text-[11px] font-bold text-ink-400 uppercase tracking-wider mb-1">Time Listed</span>
                  <span className="text-[13px] font-bold text-moss-700 bg-moss-50 px-2.5 py-1 rounded-md border border-moss-200">{timeListed}</span>
                </div>
                <h1 className="font-display text-2xl font-bold text-ink-900 pr-32">
                  {property.title}
                </h1>
                <p className="mt-1.5 text-[14.5px] text-ink-700 pr-32">{property.location}</p>

                <div className="mt-6 flex items-center gap-5 border-t border-b border-ink-200/30 py-4 text-[13.5px] text-ink-700">
                  <span className="flex items-center gap-1.5 font-medium">
                    <BedDouble className="h-4.5 w-4.5 text-moss-600" /> {property.beds} Bedrooms
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Bath className="h-4.5 w-4.5 text-moss-600" /> {property.baths} Bathrooms
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-ink-400 mb-3">
                    Property Amenities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities && property.amenities.length > 0 ? (
                      property.amenities.map((a) => (
                        <span
                          key={a}
                          className="rounded-lg bg-cream-50 border border-ink-200/40 px-3.5 py-1.5 text-[12px] font-semibold text-ink-700"
                        >
                          {a}
                        </span>
                      ))
                    ) : (
                      <span className="text-[12px] text-ink-500 italic">No specific features listed</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Work Logs */}
            <div className="rounded-2xl border border-ink-200/50 bg-white p-6 shadow-sm text-left">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-ink-400">
                  Maintenance History
                </h3>
                <span className="text-[12px] font-semibold text-[#2C4633] bg-[#E4EAE1] px-2.5 py-1 rounded-full">
                  {maintenanceLogs.length} total
                </span>
              </div>

              {maintenanceLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink-200/70 p-8 text-center text-ink-700">
                  <Wrench className="mx-auto h-8 w-8 text-ink-400/55 mb-2" />
                  <p className="text-[13px]">No maintenance requests filed for this property.</p>
                </div>
              ) : (
                <div className="divide-y divide-ink-200/30">
                  {maintenanceLogs.map((log) => (
                    <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-bold text-ink-900">{log.type}</span>
                          <span className="text-[11px] text-ink-400">• {log.date}</span>
                        </div>
                        <p className="text-[12.5px] text-ink-750">{log.details}</p>
                      </div>
                      <span className={`request-status-badge ${log.status.toLowerCase().replace(" ", "-")}`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Legal Documents Card (Moved here) */}
            <div className="rounded-2xl border border-ink-200/50 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-ink-400">
                Legal Documents
              </h3>
              
              <div className="rounded-xl border border-ink-200/50 p-4">
                {(property.status === "info_requested" || property.status === "Info Requested") ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                      <p className="text-[12px] text-amber-800 dark:text-amber-300 font-bold mb-1">
                        Review Needed
                      </p>
                      <p className="text-[11.5px] text-amber-700 dark:text-amber-400/80 leading-relaxed mb-3">
                        Your proof of ownership document was rejected by the admin. Please upload a clearer version or an alternative valid document (Max 2MB).
                      </p>
                      <Button variant="primary" className="w-full py-2 text-[12px] gap-2">
                        <Upload className="h-3.5 w-3.5" /> Re-upload Document
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-cream-50 dark:bg-white/5 rounded-lg border border-ink-200/50 dark:border-white/10 group-hover:border-[#E5C583] transition-colors">
                        <FileText className="h-4.5 w-4.5 text-moss-600 dark:text-[#A3BCA7]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-ink-900">Proof of Ownership</p>
                        <p className="text-[11px] text-ink-400">Submitted • {timeListed}</p>
                      </div>
                    </div>
                    <button className="p-2 text-ink-400 hover:text-moss-600 hover:bg-moss-50 rounded-lg transition-all" title="Download Document">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Landlord Administration Panel */}
          <div className="space-y-6 text-left">
            {/* Rental Applications Card */}
            <div className="rounded-2xl border border-ink-200/50 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-ink-400">
                  Rental Applications
                </h3>
                <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 rounded-full">{propertyApplications.length} New</span>
              </div>
              
              {propertyApplications.length > 0 ? (
                <div className="space-y-3">
                  {propertyApplications.map((app, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-ink-100 pb-3 last:border-0 last:pb-0">
                      <div>
                        <div className="text-[13px] font-bold text-ink-900">{app.applicantName}</div>
                        <div className="text-[11px] text-ink-500">{app.date || "Recently"}</div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        {app.status || "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <User className="h-6 w-6 text-ink-300 mb-2" />
                  <p className="text-[12px] text-ink-500">No applications yet.</p>
                </div>
              )}
            </div>

            {/* Occupancy Card */}
            <div className="rounded-2xl border border-ink-200/50 bg-white p-6 shadow-sm">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-ink-400">
                Occupancy & Tenants
              </h3>

              {propertyTenants.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {propertyTenants.map((tenant, idx) => (
                    <div key={idx} className="flex items-center gap-3.5 border-b border-ink-100 pb-3 last:border-0 last:pb-0">
                      <img
                        src={tenant.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                        alt={tenant.name}
                        className="h-10 w-10 rounded-full object-cover border border-ink-200"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div>
                        <div className="text-[13px] font-bold text-ink-900">
                          {tenant.name}
                        </div>
                        <div className="text-[11px] text-ink-400">
                          {tenant.leaseStatus || "Active Lease"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-ink-700">
                    <User className="h-5 w-5 text-ink-400" />
                    <span className="text-[13px]">No active lease on this unit.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Overview Card */}
            <div className="rounded-2xl border border-ink-200/50 bg-white p-6 shadow-sm">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-ink-400 mb-4">
                Financial Performance
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-moss-100 text-moss-700">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-ink-400 font-semibold uppercase">
                      Expected Rent
                    </span>
                    <span className="text-[16px] font-bold text-ink-900">
                      {String(property.price || property.rent_amount || "").includes("/mo") ? String(property.price || property.rent_amount).split("/mo")[0] : (property.price || property.rent_amount || "N/A")}
                      <span className="text-[11px] text-ink-400 font-medium"> / Month</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-ink-200/30 pt-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-moss-100 text-moss-700">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-ink-400 font-semibold uppercase">
                      Payout Cycle
                    </span>
                    <span className="text-[13.5px] font-bold text-ink-900">
                      Auto-Transfer (24h)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Management Controls */}
            <div className="rounded-2xl border border-ink-200/50 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-ink-400">
                Management Actions
              </h3>

              <div className="flex flex-col gap-2.5">
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="primary"
                  className="w-full text-[12.5px] py-2.5 gap-2 cursor-pointer"
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
                  className="w-full text-[12.5px] py-2.5 cursor-pointer"
                >
                  {isAcceptingApps ? "Pause Applications" : "Activate Applications"}
                </Button>

                <Button
                  onClick={handleDelete}
                  variant="secondary"
                  className="w-full text-[12.5px] py-2.5 gap-2 cursor-pointer text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  Delete Property
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Property Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between bg-cream-50/50 sticky top-0">
              <h3 className="text-[15px] font-bold text-ink-900">Edit Property Specs</h3>
              <button onClick={() => setIsEditing(false)} className="text-ink-400 hover:text-ink-900 transition-colors">
                <Wrench className="h-4 w-4 rotate-45" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="edit-form" onSubmit={handleSaveEdit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-ink-700">Display Name / Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-[13px] font-medium text-ink-900 outline-none focus:border-moss-600"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-ink-700">Rent Price</label>
                    <input
                      type="text"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className="w-full rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-[13px] font-medium text-ink-900 outline-none focus:border-moss-600"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-ink-700">Property Type</label>
                    <select
                      value={editForm.property_type}
                      onChange={(e) => setEditForm({ ...editForm, property_type: e.target.value })}
                      className="w-full rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-[13px] font-medium text-ink-900 outline-none focus:border-moss-600"
                    >
                      <option value="apartment">Apartment</option>
                      <option value="duplex">Duplex</option>
                      <option value="villa">Villa</option>
                      <option value="studio">Studio</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-ink-700">Address Line 1</label>
                  <input
                    type="text"
                    value={editForm.address_line1}
                    onChange={(e) => setEditForm({ ...editForm, address_line1: e.target.value })}
                    className="w-full rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-[13px] font-medium text-ink-900 outline-none focus:border-moss-600"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-ink-700">City</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-[13px] font-medium text-ink-900 outline-none focus:border-moss-600"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-ink-700">State</label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className="w-full rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-[13px] font-medium text-ink-900 outline-none focus:border-moss-600"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-ink-700">Bedrooms</label>
                    <input
                      type="number"
                      value={editForm.beds}
                      onChange={(e) => setEditForm({ ...editForm, beds: e.target.value })}
                      className="w-full rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-[13px] font-medium text-ink-900 outline-none focus:border-moss-600"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-ink-700">Bathrooms</label>
                    <input
                      type="number"
                      value={editForm.baths}
                      onChange={(e) => setEditForm({ ...editForm, baths: e.target.value })}
                      className="w-full rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-[13px] font-medium text-ink-900 outline-none focus:border-moss-600"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-ink-700">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-[13px] font-medium text-ink-900 outline-none focus:border-moss-600 min-h-[100px] resize-y"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-ink-700">Amenities (comma-separated)</label>
                  <input
                    type="text"
                    value={editForm.amenities}
                    onChange={(e) => setEditForm({ ...editForm, amenities: e.target.value })}
                    className="w-full rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-[13px] font-medium text-ink-900 outline-none focus:border-moss-600"
                    placeholder="e.g. WiFi, Pool, Gym"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-ink-700">Property Rules</label>
                  <textarea
                    value={editForm.rules}
                    onChange={(e) => setEditForm({ ...editForm, rules: e.target.value })}
                    className="w-full rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-[13px] font-medium text-ink-900 outline-none focus:border-moss-600 min-h-[80px] resize-y"
                    placeholder="e.g. No smoking, No pets"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-ink-700">Property Images</label>
                  <p className="text-[11px] text-ink-400">Manage your property gallery (max 5 photos).</p>
                  
                  {editForm.images && editForm.images.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {editForm.images.map((img, idx) => {
                        const isCover = editForm.cover_image === img;
                        return (
                          <div key={idx} className={`relative h-20 rounded-md overflow-hidden border-2 group ${isCover ? 'border-moss-500' : 'border-ink-200'}`}>
                            <img src={img} alt="Property" className="w-full h-full object-cover" />
                            
                            {/* Set as Cover button */}
                            <button
                              type="button"
                              onClick={() => setEditForm({ ...editForm, cover_image: img })}
                              className={`absolute bottom-0 inset-x-0 text-[9px] font-bold py-0.5 text-center transition-colors ${isCover ? 'bg-moss-500 text-white' : 'bg-black/60 text-white opacity-0 group-hover:opacity-100'}`}
                            >
                              {isCover ? "COVER" : "SET COVER"}
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = [...editForm.images];
                                newImages.splice(idx, 1);
                                setEditForm({ 
                                  ...editForm, 
                                  images: newImages,
                                  // If we deleted the cover image, fallback to first available
                                  cover_image: (isCover && newImages.length > 0) ? newImages[0] : (isCover ? "" : editForm.cover_image)
                                });
                              }}
                              className="absolute top-1 right-1 h-5 w-5 bg-black/60 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {(!editForm.images || editForm.images.length < 5) && (
                    <label className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-ink-200 hover:border-moss-500 bg-cream-50 hover:bg-moss-50 px-4 py-4 cursor-pointer transition-colors">
                      <Upload className="h-4 w-4 text-ink-400" />
                      <span className="text-[11px] font-semibold text-ink-600">Upload More Images</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (!files.length) return;
                          
                          const currentImages = editForm.images || [];
                          const remainingSlots = 5 - currentImages.length;
                          if (remainingSlots <= 0) return;
                          
                          const filesToAdd = files.slice(0, remainingSlots);
                          filesToAdd.forEach((file) => {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              setEditForm(prev => ({
                                ...prev,
                                images: [...(prev.images || []), evt.target.result]
                              }));
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                      />
                    </label>
                  )}
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-ink-100 bg-cream-50/30 flex justify-end gap-3 sticky bottom-0">
              <Button type="button" onClick={() => setIsEditing(false)} variant="secondary" className="px-4 py-2 text-[12.5px]">
                Cancel
              </Button>
              <Button form="edit-form" type="submit" variant="primary" className="px-6 py-2 text-[12.5px]">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
