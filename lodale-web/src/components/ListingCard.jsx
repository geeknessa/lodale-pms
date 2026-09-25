import { Link } from "react-router-dom";
import { BedDouble, Bath, Building2 } from "lucide-react";
import { ratingService } from "../services/ratingService";

export default function ListingCard({ listing }) {
  const imgUrl =
    listing.image ||
    listing.cover_image ||
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";

  const landlordId =
    listing.landlord_id || listing.landlord?.id || listing.landlordId;
  const ratingData = ratingService.getLandlordReviews(landlordId);
  const displayScore = ratingData.hasReviews
    ? ratingData.rating
    : listing.landlord?.score || "New";

  const isMultiUnit =
    Number(listing.units_count) > 1 ||
    Number(listing.unitsCount) > 1 ||
    (listing.units && listing.units.length > 1);

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-2xl border border-ink-200 dark:border-white/10 bg-white dark:bg-[#07130D] transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:border-moss-500/50 dark:hover:border-[#E5C583]/50 cursor-pointer text-left"
    >
      {/* Photography — tall, edge-to-edge */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 3",
          overflow: "hidden",
          background: "#e8e4dd",
        }}
      >
        <img
          src={imgUrl}
          alt={listing.title}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
            transition: "transform 0.55s ease",
          }}
          className="group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";
          }}
        />
      </div>

      {/* Metadata — minimal, below the photo */}
      <div style={{ padding: "16px" }}>
        {/* Location */}
        <p
          style={{
            margin: 0,
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "rgba(28,25,23,0.42)",
            marginBottom: "4px",
          }}
          className="dark:!text-white/40"
        >
          {listing.location || listing.address_line1 || "Nigeria"}
        </p>

        {/* Title + Price */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
          <h3
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "16px",
              fontWeight: 600,
              lineHeight: 1.3,
              color: "#1C1917",
            }}
            className="dark:!text-white/90 group-hover:text-moss-700 dark:group-hover:text-[#E5C583] transition-colors duration-200"
          >
            {listing.title}
          </h3>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
            className="text-moss-700 dark:text-[#E5C583]"
          >
            {listing.price ||
              (listing.rent_amount
                ? `₦${Number(listing.rent_amount).toLocaleString()}/yr`
                : "")}
          </span>
        </div>

        {/* Beds / Baths or Units — very quiet */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            fontFamily: "'Inter', sans-serif",
            fontSize: "11.5px",
            color: "rgba(28,25,23,0.45)",
          }}
          className="dark:!text-white/40"
        >
          {isMultiUnit ? (
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Building2 style={{ width: "12px", height: "12px" }} />
              {listing.units_count ||
                listing.unitsCount ||
                (listing.units ? listing.units.length : 1)}{" "}
              Units
            </span>
          ) : (
            <>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <BedDouble style={{ width: "12px", height: "12px" }} />
                {listing.beds || listing.bedrooms || 1} Bed
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Bath style={{ width: "12px", height: "12px" }} />
                {listing.baths || listing.bathrooms || 1} Bath
              </span>
            </>
          )}
          {/* Landlord name — quiet, right-aligned */}
          <span style={{ marginLeft: "auto", opacity: 0.7, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {listing.landlord?.name || "Verified Owner"}
          </span>
        </div>
      </div>
    </Link>
  );
}
