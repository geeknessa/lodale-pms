import { formatCurrency } from "./formatters";
import { propertyService } from "../services/propertyService";

export const PRESET_PHOTOS = [
  { label: "Modern Villa", url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" },
  { label: "Luxury Apartment", url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80" },
  { label: "Gated Residency", url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80" },
  { label: "Cozy Studio", url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80" },
];

export const COMMON_AMENITIES = [
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

export async function handlePropertySubmit({
  e,
  stateName,
  cityName,
  bathrooms,
  description,
  selectedAmenities = [],
  docType = "Deed of Assignment",
  docName,
  docDataUrl,
  propertyPhoto, // legacy fallback
  displayName,
  propertyPhotos = [],
  coverPhoto = "",
  rules = "",
  rentCycle,
  propertyTypeVal,
  latitudeVal,
  longitudeVal,
  blocksList = [],
  unitsList = [],
  isMultiUnit = false,
  setFormError,
  setIsSubmitted,
  editId = null,
  occupied = false,
  tenantName = "",
  tenantContact = "",
  leaseStartDate = "",
  availableFrom = ""
}) {
  e.preventDefault();
  setFormError("");

  const target = e.target;
  const address = target.elements.address?.value?.trim() || "";
  const rawType = propertyTypeVal || target.elements.type?.value?.trim() || "single_house";
  const rent = target.elements.rent?.value?.trim() || "0";
  const bedrooms = target.elements.bedrooms?.value?.trim() || "1";
  const bathsVal = target.elements.bathrooms?.value?.trim() || bathrooms || "1";
  
  const cityInput = target.elements.city?.value?.trim();
  const cityVal = cityInput || cityName || "Lagos";
  
  const stateInput = target.elements.state?.value?.trim();
  const stateVal = stateInput || stateName || "Lagos";
  
  const descVal = target.elements.description?.value?.trim() || (description || "").trim();

  const numericRent = Number(rent.replace(/[^0-9]/g, "")) || 0;
  const numericBedrooms = Number(bedrooms) || 1;
  const numericBathrooms = Number(bathsVal) || 1;

  if (!displayName && !address) {
    setFormError("Property Name / Title and Address are required.");
    return false;
  }
  if (!address) {
    setFormError("Property Address / Street Location is required.");
    return false;
  }
  if (!cityInput && !cityName) {
    setFormError("City / Area is required.");
    return false;
  }
  if (!rawType) {
    setFormError("Property Type is required.");
    return false;
  }

  // If single unit property, check rent/bedrooms/bathrooms
  if (!isMultiUnit && (!unitsList || unitsList.length === 0)) {
    if (!rent || isNaN(numericRent) || numericRent <= 0) {
      setFormError("A valid Rent Amount is required.");
      return false;
    }
  }

  if (isMultiUnit && (!unitsList || unitsList.length === 0)) {
    setFormError("Please add at least one unit to your multi-unit property.");
    return false;
  }

  if (!docName || !docName.trim()) {
    setFormError("Please upload your proof of ownership or management legal document (PDF / Image) before submitting.");
    return false;
  }
  if (!propertyPhoto && (!propertyPhotos || propertyPhotos.length === 0)) {
    setFormError("Please attach at least one property photo before submitting.");
    return false;
  }

  const ownershipDocString = `${docType} (${docName})`;
  const dbUserId = sessionStorage.getItem("db_user_id");

  const amenitiesList = selectedAmenities.length > 0 ? selectedAmenities : [];
  const sanitizedType = rawType.toLowerCase().replace(/\s+/g, "_");

  // Calculate starting rent & max bedrooms for multi-unit summaries
  let minRent = numericRent;
  let summaryBeds = numericBedrooms;
  if (unitsList.length > 0) {
    const rents = unitsList.map(u => Number(u.rent_amount) || 0).filter(r => r > 0);
    if (rents.length > 0) minRent = Math.min(...rents);
    const beds = unitsList.map(u => Number(u.bedrooms) || 0);
    if (beds.length > 0) summaryBeds = Math.max(...beds);
  }

  const finalDescription = descVal || `${sanitizedType.replace(/_/g, ' ')} located at ${address}, ${cityVal}. Total units: ${unitsList.length || 1}.`;

  const propertyPayload = {
    title: displayName || address,
    description: finalDescription,
    address_line1: address,
    city: cityVal,
    state: stateVal,
    rent_amount: minRent,
    bedrooms: summaryBeds,
    bathrooms: numericBathrooms,
    property_type: sanitizedType,
    latitude: latitudeVal ? Number(latitudeVal) : null,
    longitude: longitudeVal ? Number(longitudeVal) : null,
    amenities: amenitiesList,
    rules: rules,
    ownership_doc: ownershipDocString,
    ownership_doc_url: docDataUrl,
    ownership_doc_type: docType,
    cover_image: coverPhoto || (propertyPhotos.length > 0 ? propertyPhotos[0] : propertyPhoto) || PRESET_PHOTOS[0].url,
    images: propertyPhotos.length > 0 ? propertyPhotos : (propertyPhoto ? [propertyPhoto] : [PRESET_PHOTOS[0].url]),
    is_occupied: occupied,
    tenant_name: tenantName,
    tenant_contact: tenantContact,
    lease_start_date: leaseStartDate,
    available_from: availableFrom,
    blocks: blocksList,
    units: unitsList.length > 0 ? unitsList : [
      {
        unit_name: "Main Unit",
        bedrooms: numericBedrooms,
        bathrooms: numericBathrooms,
        rent_amount: numericRent,
        rent_period: "annually",
        status: "vacant"
      }
    ],
    ...(dbUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbUserId) ? { landlord_id: dbUserId } : {}),
  };

  const newPropertyObj = {
    id: "prop-" + Date.now(),
    title: displayName || address,
    location: `${address}${cityVal ? ', ' + cityVal : ''}${stateVal ? ', ' + stateVal : ''}`,
    address: address,
    city: cityVal,
    state: stateVal,
    price: formatCurrency(minRent) + "/mo",
    rent_amount: minRent,
    rawPrice: minRent,
    type: sanitizedType,
    property_type: sanitizedType,
    beds: summaryBeds,
    bedrooms: summaryBeds,
    baths: numericBathrooms,
    bathrooms: numericBathrooms,
    unitsCount: unitsList.length || 1,
    status: "Active Listing",
    verificationStatus: docName ? "Verified Listing" : "Under Verification",
    cover_image: coverPhoto || (propertyPhotos.length > 0 ? propertyPhotos[0] : propertyPhoto) || PRESET_PHOTOS[0].url,
    images: propertyPhotos.length > 0 ? propertyPhotos : (propertyPhoto ? [propertyPhoto] : [PRESET_PHOTOS[0].url]),
    description: finalDescription,
    amenities: amenitiesList,
    rules: rules,
    ownershipDoc: ownershipDocString,
    blocks: blocksList,
    units: unitsList.length > 0 ? unitsList : [
      {
        unit_name: "Main Unit",
        bedrooms: numericBedrooms,
        bathrooms: numericBathrooms,
        rent_amount: numericRent,
        rent_period: "annually",
        status: "vacant"
      }
    ],
    createdAt: new Date().toISOString()
  };

  let backendProp = null;
  try {
    if (editId) {
      backendProp = await propertyService.updateProperty(editId, propertyPayload);
    } else {
      backendProp = await propertyService.createProperty(propertyPayload);
    }
    
    if (backendProp && backendProp.id) {
      newPropertyObj.id = backendProp.id;
    }
  } catch (err) {
    console.warn("Backend API property create warning (using local storage fallback):", err);
  }

  try {
    const saved = localStorage.getItem("properties");
    const existing = saved ? JSON.parse(saved) : [];
    
    if (editId) {
      const idx = existing.findIndex(p => p.id === editId);
      if (idx !== -1) existing[idx] = { ...existing[idx], ...newPropertyObj, id: editId };
    } else {
      existing.unshift(newPropertyObj);
    }
    localStorage.setItem("properties", JSON.stringify(existing));

    const savedLandlord = localStorage.getItem("landlordProperties");
    const existingLandlord = savedLandlord ? JSON.parse(savedLandlord) : [];
    
    if (editId) {
      const lIdx = existingLandlord.findIndex(p => p.id === editId);
      if (lIdx !== -1) existingLandlord[lIdx] = { ...existingLandlord[lIdx], ...newPropertyObj, id: editId };
    } else {
      existingLandlord.unshift(newPropertyObj);
    }
    localStorage.setItem("landlordProperties", JSON.stringify(existingLandlord));

    window.dispatchEvent(new Event("storage"));
  } catch (localErr) {
    console.warn("Failed to persist property locally:", localErr);
  }

  setIsSubmitted(true);
  return true;
}
