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
  selectedAmenities,
  docType,
  docName,
  docDataUrl,
  propertyPhoto,
  rentCycle,
  setFormError,
  setIsSubmitted
}) {
  e.preventDefault();
  setFormError("");

  const target = e.target;
  const address = target.elements.address?.value?.trim() || "";
  const type = target.elements.type?.value?.trim() || "";
  const rent = target.elements.rent?.value?.trim() || "";
  const bedrooms = target.elements.bedrooms?.value?.trim() || "";
  const bathsVal = target.elements.bathrooms?.value?.trim() || bathrooms || "1";
  
  const cityInput = target.elements.city?.value?.trim();
  const cityVal = cityInput || cityName || "Lagos";
  
  const stateInput = target.elements.state?.value?.trim();
  const stateVal = stateInput || stateName || "Lagos";
  
  const descVal = target.elements.description?.value?.trim() || description.trim() || "";

  const numericRent = Number(rent.replace(/[^0-9]/g, ""));
  const numericBedrooms = Number(bedrooms);
  const numericBathrooms = Number(bathsVal);

  if (!address) {
    setFormError("Property Address / Street Location is required.");
    return false;
  }
  if (!cityInput && !cityName) {
    setFormError("City / Area is required.");
    return false;
  }
  if (!type) {
    setFormError("Property Type is required.");
    return false;
  }
  if (!rent || isNaN(numericRent) || numericRent <= 0) {
    setFormError("A valid Rent Amount is required.");
    return false;
  }
  if (!bedrooms || isNaN(numericBedrooms) || numericBedrooms <= 0) {
    setFormError("Number of Bedrooms is required.");
    return false;
  }
  if (!bathsVal || isNaN(numericBathrooms) || numericBathrooms <= 0) {
    setFormError("Number of Bathrooms is required.");
    return false;
  }
  if (!docName || !docName.trim()) {
    setFormError("Please upload your proof of ownership legal document (PDF / Image) before submitting.");
    return false;
  }
  if (!propertyPhoto) {
    setFormError("Please attach a property photo before submitting.");
    return false;
  }

  const ownershipDocString = `${docType} (${docName})`;
  const dbUserId = localStorage.getItem("db_user_id");

  const amenitiesList = selectedAmenities.length > 0 ? selectedAmenities : ["Basic Amenities"];
  const finalDescription = descVal || `${numericBedrooms} Bedroom, ${numericBathrooms} Bathroom ${type} located at ${address}, ${cityVal}.`;

  const propertyPayload = {
    title: address,
    description: finalDescription,
    address_line1: address,
    city: cityVal,
    state: stateVal,
    rent_amount: numericRent,
    bedrooms: numericBedrooms,
    bathrooms: numericBathrooms,
    property_type: type.toLowerCase().replace(/\s+/g, "_"),
    amenities: amenitiesList,
    ownership_doc: ownershipDocString,
    ownership_doc_url: docDataUrl,
    cover_image: propertyPhoto || PRESET_PHOTOS[0].url,
    ...(dbUserId ? { landlord_id: dbUserId } : {}),
  };

  try {
    await propertyService.createProperty(propertyPayload);
  } catch (err) {
    console.warn("Backend API error, storing locally fallback:", err);
  }

  const newListing = {
    id: address.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(),
    title: address,
    description: finalDescription,
    location: `${cityVal}, ${stateVal}`,
    price: formatCurrency(numericRent, rentCycle === "annual" ? "/yr" : "/mo"),
    image: propertyPhoto || PRESET_PHOTOS[0].url,
    beds: numericBedrooms,
    baths: numericBathrooms,
    status: "pending_review",
    ownership_doc: ownershipDocString,
    ownership_doc_url: docDataUrl,
    docType: docType,
    docName: docName,
    docDataUrl: docDataUrl,
    amenities: amenitiesList,
    landlord: {
      name: (() => {
        const sessName = sessionStorage.getItem("username");
        if (sessName) return sessName;
        const emailKey = (sessionStorage.getItem("lastLoggedInEmail") || localStorage.getItem("lastLoggedInEmail"))?.toLowerCase();
        const storedName = emailKey ? localStorage.getItem("username_" + emailKey) : null;
        return storedName || localStorage.getItem("username") || "Verified Landlord";
      })(),
      score: 5.0,
      reviews: 1,
    },
  };

  const saved = localStorage.getItem("properties");
  const currentListings = saved ? JSON.parse(saved) : [];
  const updatedListings = [newListing, ...currentListings];
  localStorage.setItem("properties", JSON.stringify(updatedListings));

  setIsSubmitted(true);
  return true;
}
