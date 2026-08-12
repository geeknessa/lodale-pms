import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Heart, MessageCircle, BedDouble, Bath } from "lucide-react";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import { LISTINGS } from "../data/listings";
import { propertyService } from "../services/propertyService";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [listing, setListing] = useState(null);

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated") === "true" || sessionStorage.getItem("isAuthenticated") === "true";
    if (!isAuth) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    async function fetchListing() {
      try {
        const item = await propertyService.getPropertyById(id);
        setListing(item || LISTINGS[0]);
      } catch (err) {
        setListing(LISTINGS[0]);
      }
    }
    fetchListing();
  }, [id]);

  // Save / Message both require an account — send guests to sign up.
  function requireSignup() {
    navigate("/signup", { state: { presetRole: "tenant" } });
  }

  // Apply implies the guest is a tenant — skip the role picker and the
  // generic Welcome screen, land straight on the application after verifying.
  function handleApply() {
    navigate("/signup", {
      state: {
        presetRole: "tenant",
        skipRolePicker: true,
        skipWelcome: true,
        listingId: listing.id,
      },
    });
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <NavBar />
        <div className="flex-1 flex justify-center items-center text-ink-500">
          Loading listing...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex h-72 items-center justify-center rounded-2xl bg-cream-100 overflow-hidden relative">
          {(listing.cover_image || listing.image) ? (
            <img src={listing.cover_image || listing.image} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[13px] font-medium text-moss-700">Photo</span>
          )}
        </div>

        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_320px]">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900">
              {listing.title}
            </h1>
            <p className="mt-1 text-[14px] text-ink-400">{listing.location || listing.address_line1 || ""}</p>

            <div className="mt-4 flex items-center gap-5 text-[13px] text-ink-700">
              <span className="flex items-center gap-1">
                <BedDouble className="h-4 w-4" /> {listing.beds || listing.bedrooms || 0} Bed
              </span>
              <span className="flex items-center gap-1">
                <Bath className="h-4 w-4" /> {listing.baths || listing.bathrooms || 0} Bath
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {(listing.amenities || []).map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-cream-50 px-3 py-1 text-[12px] font-medium text-ink-700"
                >
                  {a}
                </span>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <Button
                variant="secondary"
                onClick={requireSignup}
                className="gap-2"
              >
                <Heart className="h-4 w-4" /> Save
              </Button>
              <Button
                variant="secondary"
                onClick={requireSignup}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" /> Message
              </Button>
            </div>
          </div>

          {/* landlord score — fully visible to guests */}
          <div className="h-fit rounded-2xl border border-ink-200 p-6">
            <span className="text-[11px] font-semibold tracking-wide text-ink-400">
              LANDLORD & PROPERTY SCORE
            </span>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-ink-200" />
              <div>
                <div className="text-[14px] font-semibold text-ink-900">
                  {listing.landlord?.name || "Verified Landlord"}
                </div>
                <div className="text-[12px] text-ink-400">
                  {listing.landlord?.reviews || 0} reviews
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-moss-600">
                {listing.landlord?.score || "4.8"}
              </span>
              <span className="flex text-moss-600">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4"
                    fill={
                      i < Math.round(listing.landlord?.score || 4.8)
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </span>
            </div>
            <p className="mt-2 text-[12px] text-ink-700">
              Verify landlord reliability before you pay.
            </p>

            <div className="mt-6 rounded-xl bg-moss-100 p-3">
              <p className="text-[12px] font-medium text-moss-700">
                {listing.price || (listing.rent_amount ? `₦${Number(listing.rent_amount).toLocaleString()}` : 'N/A')} / year
              </p>
            </div>

            <Button className="mt-4 w-full" onClick={handleApply}>
              Apply for this Property
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
