import { Link } from "react-router-dom";
import { BedDouble, Bath, Star } from "lucide-react";

export default function ListingCard({ listing }) {
  const imgUrl = listing.image || listing.cover_image || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80";

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-2xl border border-ink-200 dark:border-white/10 bg-white dark:bg-[#16241F] transition-all duration-300 ease-out hover:scale-[1.015] hover:border-moss-500/40 shadow-xs hover:shadow-md"
    >
      <div className="flex h-48 w-full items-center justify-center bg-ink-100 dark:bg-white/10 overflow-hidden relative">
        <img
          src={imgUrl}
          alt={listing.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80";
          }}
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[16px] font-bold text-ink-900 dark:text-white group-hover:text-moss-700 dark:group-hover:text-[#E5C583] transition-colors duration-300 truncate">
            {listing.title}
          </h3>
          <span className="whitespace-nowrap text-[14px] font-bold text-moss-700 dark:text-[#E5C583]">
            {listing.price}
          </span>
        </div>
        <p className="mt-1 text-[13px] text-ink-500 dark:text-cream-100/70 truncate">{listing.location}</p>

        <div className="mt-3 flex items-center gap-4 text-[12px] text-ink-700 dark:text-cream-100/80 font-medium">
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" /> {listing.beds || 1} Bed
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" /> {listing.baths || 1} Bath
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-moss-50 dark:bg-white/5 px-3 py-2 group-hover:bg-moss-700 dark:group-hover:bg-[#E5C583] transition-all duration-300">
          <span className="text-[12px] font-semibold text-moss-800 dark:text-cream-100 group-hover:text-white dark:group-hover:text-[#0B1512] transition-colors duration-300">
            {listing.landlord?.name || "Ada K."}
          </span>
          <span className="flex items-center gap-1 text-[12px] font-bold text-moss-800 dark:text-[#E5C583] group-hover:text-white dark:group-hover:text-[#0B1512] transition-colors duration-300">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 group-hover:fill-amber-300 transition-colors duration-300" />
            {listing.landlord?.score || 5.0}
          </span>
        </div>
      </div>
    </Link>
  );
}
