import { Link } from "react-router-dom";
import { BedDouble, Bath, Star } from "lucide-react";

export default function ListingCard({ listing }) {
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-xl border border-ink-200 bg-white transition-all duration-300 ease-out hover:scale-[1.015] hover:border-moss-500/40 hover:bg-moss-100/10"
    >
      <div className="flex h-40 items-center justify-center bg-cream-100 overflow-hidden">
        <span className="text-[12px] font-medium text-moss-700 group-hover:scale-110 transition-transform duration-300">Photo</span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[16px] font-bold text-ink-900 group-hover:text-moss-700 transition-colors duration-300">
            {listing.title}
          </h3>
          <span className="whitespace-nowrap text-[13px] font-semibold text-ink-900">
            {listing.price}
          </span>
        </div>
        <p className="mt-1 text-[13px] text-ink-400">{listing.location}</p>

        <div className="mt-3 flex items-center gap-4 text-[12px] text-ink-700">
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" /> {listing.beds} Bed
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" /> {listing.baths} Bath
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-moss-100 px-3 py-2 group-hover:bg-moss-700 group-hover:text-white transition-all duration-300">
          <span className="text-[12px] text-moss-700 group-hover:text-cream-50 transition-colors duration-300">
            {listing.landlord.name}
          </span>
          <span className="flex items-center gap-1 text-[13px] font-bold text-moss-700 group-hover:text-white transition-colors duration-300">
            <Star className="h-3.5 w-3.5 fill-moss-600 text-moss-600 group-hover:fill-[#F5C242] group-hover:text-[#F5C242] transition-colors duration-300" />
            {listing.landlord.score}
          </span>
        </div>
      </div>
    </Link>
  );
}
