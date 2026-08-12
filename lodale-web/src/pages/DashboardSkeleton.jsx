import React from "react";
import { Logo } from "../components/Logo";
import { Menu } from "lucide-react";

export default function DashboardSkeleton() {
  return (
    <div className="flex h-screen w-full bg-[#FAF8F6] dark:bg-[#263b33] overflow-hidden">
      {/* Sidebar Skeleton */}
      <div className="hidden lg:flex w-64 flex-col border-r border-[#E8E6E1] dark:border-[#1A2621] bg-white dark:bg-[#111C18]">
        <div className="flex h-20 items-center justify-between px-6 border-b border-[#E8E6E1] dark:border-[#1A2621]">
          <Logo className="w-24 h-auto" />
        </div>
        <div className="flex-1 p-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-full rounded-xl bg-[#E8E6E1] dark:bg-[#1A2621] animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-[#E8E6E1] dark:border-[#1A2621] bg-white dark:bg-[#111C18] px-4 md:px-8">
          <div className="flex items-center gap-4">
            <Menu className="h-6 w-6 lg:hidden text-[#8C8C86] dark:text-[#A3BCA7]" />
            <div className="h-6 w-32 bg-[#E8E6E1] dark:bg-[#1A2621] rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-4">
             <div className="h-8 w-8 rounded-full bg-[#E8E6E1] dark:bg-[#1A2621] animate-pulse"></div>
             <div className="h-8 w-8 rounded-full bg-[#E8E6E1] dark:bg-[#1A2621] animate-pulse"></div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Area */}
            <div className="h-10 w-64 bg-[#E8E6E1] dark:bg-[#1A2621] rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-[#E8E6E1] dark:bg-[#1A2621] rounded animate-pulse"></div>
            
            {/* Widgets Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="h-32 rounded-2xl bg-white dark:bg-[#111C18] border border-[#E8E6E1] dark:border-[#1A2621] p-6 animate-pulse">
                    <div className="h-4 w-1/2 bg-[#E8E6E1] dark:bg-[#1A2621] rounded mb-4"></div>
                    <div className="h-8 w-3/4 bg-[#E8E6E1] dark:bg-[#1A2621] rounded"></div>
                 </div>
               ))}
            </div>

            {/* Big Content Area */}
            <div className="mt-8 h-96 rounded-2xl bg-white dark:bg-[#111C18] border border-[#E8E6E1] dark:border-[#1A2621] p-6 animate-pulse">
               <div className="h-6 w-48 bg-[#E8E6E1] dark:bg-[#1A2621] rounded mb-6"></div>
               <div className="space-y-4">
                 {[1, 2, 3, 4].map((i) => (
                   <div key={i} className="h-12 w-full bg-[#E8E6E1] dark:bg-[#1A2621] rounded"></div>
                 ))}
               </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
