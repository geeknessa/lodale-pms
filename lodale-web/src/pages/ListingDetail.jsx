import { useParams, useNavigate } from "react-router-dom";
import { Star, Heart, MessageCircle, BedDouble, Bath } from "lucide-react";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import { LISTINGS } from "../data/listings";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const listing = LISTINGS.find((l) => l.id === id) ?? LISTINGS[0];

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

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text transition-colors duration-250">
      <NavBar />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex h-72 items-center justify-center rounded-2xl bg-theme-bg-offset">
          <span className="text-[13px] font-medium text-moss-700 dark:text-moss-100">Photo</span>
        </div>

        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_320px]">
          <div>
            <h1 className="font-display text-2xl font-bold text-theme-text">
              {listing.title}
            </h1>
            <p className="mt-1 text-[14px] text-theme-text-offset/70">{listing.location}</p>

            <div className="mt-4 flex items-center gap-5 text-[13px] text-theme-text-offset">
              <span className="flex items-center gap-1">
                <BedDouble className="h-4 w-4" /> {listing.beds} Bed
              </span>
              <span className="flex items-center gap-1">
                <Bath className="h-4 w-4" /> {listing.baths} Bath
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {listing.amenities.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-theme-bg-offset px-3 py-1 text-[12px] font-medium text-theme-text-offset"
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
          <div className="h-fit rounded-2xl border border-theme-border p-6 bg-theme-card-bg">
            <span className="text-[11px] font-semibold tracking-wide text-theme-text-offset/70">
              LANDLORD & PROPERTY SCORE
            </span>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-theme-bg-offset" />
              <div>
                <div className="text-[14px] font-semibold text-theme-text">
                  {listing.landlord.name}
                </div>
                <div className="text-[12px] text-theme-text-offset/70">
                  {listing.landlord.reviews} reviews
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-moss-600 dark:text-[#E5C583]">
                {listing.landlord.score}
              </span>
              <span className="flex text-moss-600 dark:text-[#E5C583]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4"
                    fill={
                      i < Math.round(listing.landlord.score)
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </span>
            </div>
            <p className="mt-2 text-[12px] text-theme-text-offset">
              Verify landlord reliability before you pay.
            </p>

            <div className="mt-6 rounded-xl bg-moss-100 dark:bg-moss-700/30 p-3">
              <p className="text-[12px] font-medium text-moss-700 dark:text-moss-100">
                {listing.price} / year
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
