import React from "react";
import { Activity, ArrowLeft } from "lucide-react";

export default function PerformanceOverviewPlaceholder({
  onBackToHome,
  title = "Performance Overview",
  subtitle = "Comprehensive portfolio yield, occupancy projections, and financial performance metrics.",
  description = "The dedicated Performance Overview module will feature portfolio yield benchmarks, tenant retention curves, and tax-ready annual statements.",
  icon: CustomIcon
}) {
  const IconComponent = CustomIcon || Activity;

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-[#2C4633]">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onBackToHome}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-emerald-800 dark:text-[#E5C583] hover:text-emerald-950 dark:hover:text-[#f3dc9e] cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md py-0.5"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Dashboard Home</span>
          </button>

          <div className="flex items-center gap-3.5 pt-1">
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-[#E5C583] border border-emerald-100/90 dark:border-emerald-800/40 flex items-center justify-center shrink-0 shadow-xs">
              <IconComponent className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-cream-100/70 font-medium mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Under Construction Notice Card */}
      <div className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-2xl p-8 sm:p-12 shadow-sm text-center max-w-2xl mx-auto space-y-5 my-8">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-[#E5C583] flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-800/40 shadow-xs">
          <IconComponent className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {title} Coming Soon
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-cream-100/70 max-w-md mx-auto leading-relaxed font-normal">
            {description}
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3 text-left">
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.05]">
            <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight block">
              Rental Yield
            </span>
            <span className="text-xs text-slate-500 dark:text-cream-100/60 leading-snug block">
              Annualized portfolio returns & performance
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.05]">
            <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight block">
              Turnover Rate
            </span>
            <span className="text-xs text-slate-500 dark:text-cream-100/60 leading-snug block">
              Tenancy churn & vacancy duration gaps
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.05]">
            <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight block">
              Tax Schedules
            </span>
            <span className="text-xs text-slate-500 dark:text-cream-100/60 leading-snug block">
              Exportable revenue reports & summaries
            </span>
          </div>
        </div>

        <div className="pt-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B4D35] hover:bg-[#143D2A] dark:bg-[#E5C583] dark:hover:bg-[#D4B371] text-white dark:text-[#09090b] font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <span>Return to Dashboard Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}