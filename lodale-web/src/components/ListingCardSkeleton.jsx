import React from "react";

export default function ListingCardSkeleton() {
  return (
    <div className="group block overflow-hidden rounded-2xl border border-ink-200 dark:border-white/10 bg-white dark:bg-[#16241F]">
      {/* Image Skeleton */}
      <div className="h-48 w-full bg-ink-200 dark:bg-white/10 animate-pulse"></div>
      
      <div className="p-4">
        {/* Title and Price Skeleton */}
        <div className="flex items-start justify-between gap-2">
          <div className="h-5 w-2/3 bg-ink-200 dark:bg-white/10 rounded animate-pulse"></div>
          <div className="h-5 w-1/4 bg-ink-200 dark:bg-white/10 rounded animate-pulse"></div>
        </div>
        
        {/* Location Skeleton */}
        <div className="mt-2 h-4 w-1/2 bg-ink-100 dark:bg-white/5 rounded animate-pulse"></div>

        {/* Beds & Baths Skeleton */}
        <div className="mt-4 flex items-center gap-4">
          <div className="h-4 w-16 bg-ink-100 dark:bg-white/5 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-ink-100 dark:bg-white/5 rounded animate-pulse"></div>
        </div>

        {/* Landlord & Score Skeleton */}
        <div className="mt-5 flex items-center justify-between rounded-xl bg-ink-50 dark:bg-white/5 px-3 py-3 animate-pulse">
          <div className="h-4 w-20 bg-ink-200 dark:bg-white/10 rounded"></div>
          <div className="h-4 w-12 bg-ink-200 dark:bg-white/10 rounded"></div>
        </div>
      </div>
    </div>
  );
}
