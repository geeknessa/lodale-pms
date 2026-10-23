import React, { useState, useMemo } from "react";
import { TrendingUp, ChevronDown } from "lucide-react";
import { parsePaymentDateYearMonth } from "../../../utils/landlordMetrics";

export default function RentalIncomeChart({
  invoices = [],
  leases = [],
  loading = false
}) {
  const [filter, setFilter] = useState("year"); // "year" (default) | "6m"
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Compute monthly data series based on the chosen filter
  const chartData = useMemo(() => {
    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    const safeLeases = Array.isArray(leases) ? leases : [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const months = [];

    if (filter === "year") {
      // 12 months of the current year (Jan - Dec)
      for (let m = 0; m < 12; m++) {
        const d = new Date(currentYear, m, 1);
        months.push({
          label: d.toLocaleDateString("en-US", { month: "short" }),
          month: m,
          year: currentYear,
          isCurrent: m === currentMonth && currentYear === now.getFullYear()
        });
      }
    } else {
      // Last 6 rolling months ending on current month
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        months.push({
          label: d.toLocaleDateString("en-US", { month: "short" }),
          month: d.getMonth(),
          year: d.getFullYear(),
          isCurrent: i === 0
        });
      }
    }

    return months.map((mObj) => {
      // 1. COLLECTED: Sum of paid invoices where paid_at was in this month and year
      const paidInMonth = safeInvoices.filter((inv) => {
        const st = (inv.status || "").toLowerCase().trim();
        if (st !== "paid" && st !== "completed") return false;
        const rawDate = inv.paid_at || inv.paidAt || inv.payment_date || inv.paymentDate;
        if (!rawDate) return false;
        const ym = parsePaymentDateYearMonth(rawDate);
        return ym && ym.year === mObj.year && ym.month === mObj.month;
      });

      const collected = paidInMonth.reduce((sum, inv) => {
        const amt = parseFloat(inv.grandTotal || inv.grand_total || inv.amount || 0);
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);

      // 2. EXPECTED: Invoices issued/due in this month (or lease rent schedule)
      const invoicesInMonth = safeInvoices.filter((inv) => {
        const rawDate = inv.due_date || inv.dueDate || inv.issue_date || inv.issueDate || inv.created_at;
        if (!rawDate) return false;
        const ym = parsePaymentDateYearMonth(rawDate);
        return ym && ym.year === mObj.year && ym.month === mObj.month;
      });

      let invoiceExpected = invoicesInMonth.reduce((sum, inv) => {
        const amt = parseFloat(inv.grandTotal || inv.grand_total || inv.amount || 0);
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);

      // Add scheduled rent from active leases if no invoice exists for that month
      safeLeases.forEach((lease) => {
        const lStatus = (lease.status || "").toLowerCase().trim();
        if (lStatus !== "active" && lStatus !== "leased") return;

        const startRaw = lease.start_date || lease.startDate;
        const endRaw = lease.end_date || lease.endDate;
        const startYm = parsePaymentDateYearMonth(startRaw);
        const endYm = parsePaymentDateYearMonth(endRaw);

        const currentMonthTimestamp = new Date(mObj.year, mObj.month, 1).getTime();
        const startTimestamp = startYm ? new Date(startYm.year, startYm.month, 1).getTime() : 0;
        const endTimestamp = endYm ? new Date(endYm.year, endYm.month, 28).getTime() : Infinity;

        if (currentMonthTimestamp >= startTimestamp && currentMonthTimestamp <= endTimestamp) {
          const hasInv = invoicesInMonth.some((inv) => String(inv.lease_id || "") === String(lease.id || ""));
          if (!hasInv) {
            const rawRent = parseFloat(lease.rent_amount || lease.rentAmount || lease.rent || 0);
            if (!isNaN(rawRent) && rawRent > 0) {
              const period = (lease.rent_period || lease.rentPeriod || "annually").toLowerCase();
              const monthlyRent = period.includes("year") || period.includes("annual") ? rawRent / 12 : rawRent;
              invoiceExpected += monthlyRent;
            }
          }
        }
      });

      // Expected is always at least equal to collected
      const expected = Math.max(invoiceExpected, collected);

      return {
        ...mObj,
        collected,
        expected
      };
    });
  }, [invoices, leases, filter]);

  // Calculate SVG scales
  const svgWidth = 840;
  const svgHeight = 240;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const maxVal = useMemo(() => {
    const highest = Math.max(
      1000000,
      ...chartData.map((d) => Math.max(d.collected, d.expected))
    );
    // Add 15% headroom for clean visual presentation
    return highest * 1.15;
  }, [chartData]);

  const getY = (val) => {
    const ratio = Math.min(1, Math.max(0, val / maxVal));
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  const getX = (index) => {
    if (chartData.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (chartData.length - 1)) * chartWidth;
  };

  // Generate smooth cubic bezier spline through data points (Matching Mockup Image 2)
  const buildSmoothSplinePath = (key) => {
    if (chartData.length === 0) return "";
    const points = chartData.map((point, idx) => ({
      x: getX(idx),
      y: getY(point[key])
    }));

    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return path;
  };

  // Area fill under collected spline curve
  const buildAreaPath = () => {
    if (chartData.length === 0) return "";
    const spline = buildSmoothSplinePath("collected");
    const lastX = getX(chartData.length - 1);
    const firstX = getX(0);
    const bottomY = paddingTop + chartHeight;
    return `${spline} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const formatYAxis = (amt) => {
    if (amt <= 0) return "₦0";
    if (amt >= 1000000) {
      const mVal = amt / 1000000;
      return mVal % 1 === 0 ? `₦${mVal}M` : `₦${mVal.toFixed(1)}M`;
    }
    if (amt >= 1000) return `₦${Math.round(amt / 1000)}k`;
    return `₦${Math.round(amt)}`;
  };

  // Y-axis ticks (6 evenly spaced divisions)
  const yTicks = useMemo(() => {
    const steps = 6;
    const ticks = [];
    for (let i = steps; i >= 0; i--) {
      const pct = i / steps;
      const val = pct * maxVal;
      ticks.push({ pct, val });
    }
    return ticks;
  }, [maxVal]);

  // SKELETON LOADING STATE
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-3xl p-6 shadow-xs min-h-[340px] flex flex-col justify-between animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-44 bg-slate-200 dark:bg-white/10 rounded-md" />
          <div className="h-8 w-28 bg-slate-200 dark:bg-white/10 rounded-xl" />
        </div>
        <div className="w-full h-56 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center">
          <div className="h-6 w-32 bg-slate-200 dark:bg-white/10 rounded-md" />
        </div>
      </div>
    );
  }

  const activeHover = hoveredIndex !== null && chartData[hoveredIndex] ? chartData[hoveredIndex] : null;

  return (
    <div className="bg-white dark:bg-[#192A1F] border border-slate-200/80 dark:border-[#2C4633] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[340px] transition-all">
      {/* Top Header & Legend matching Mockup Image 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
            Rental Income Overview
          </h3>
          {/* Legend directly matching Mockup Image 2: "— Collected (₦)   --- Expected (₦)" */}
          <div className="flex items-center gap-6 text-xs font-semibold mt-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 bg-[#00875A] rounded-full inline-block" />
              <span className="text-slate-700 dark:text-cream-100/90 font-bold">Collected (₦)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 border-t-2 border-dashed border-[#00875A] inline-block" />
              <span className="text-slate-500 dark:text-cream-100/60 font-semibold">Expected (₦)</span>
            </div>
          </div>
        </div>

        {/* Dropdown Selector matching Mockup Image 2: "This Year v" */}
        <div className="relative self-start sm:self-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none bg-white dark:bg-[#142319] border border-slate-200/90 dark:border-[#2C4633] text-slate-800 dark:text-white text-xs font-bold py-2 pl-3.5 pr-8 rounded-xl shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00875A]/20 transition-all"
          >
            <option value="year">This Year</option>
            <option value="6m">Last 6 Months</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Interactive SVG Chart matching Mockup Image 2 */}
      <div className="relative w-full h-64 select-none pt-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="rentalSplineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00875A" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#00875A" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#00875A" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels matching Mockup */}
          {yTicks.map((tick, idx) => {
            const y = paddingTop + chartHeight - tick.pct * chartHeight;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="4 4"
                  className="text-slate-400 dark:text-white"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[10px] font-bold fill-slate-500 dark:fill-cream-100/50"
                >
                  {formatYAxis(tick.val)}
                </text>
              </g>
            );
          })}

          {/* Soft Green Gradient Fill under Collected Curve */}
          <path d={buildAreaPath()} fill="url(#rentalSplineGradient)" />

          {/* Expected Line (Dashed Green Spline Curve) */}
          <path
            d={buildSmoothSplinePath("expected")}
            fill="none"
            stroke="#00875A"
            strokeWidth="2"
            strokeDasharray="5 5"
            strokeLinecap="round"
            className="opacity-80"
          />

          {/* Collected Line (Solid Smooth Spline Curve) */}
          <path
            d={buildSmoothSplinePath("collected")}
            fill="none"
            stroke="#00875A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover Column Crosshair */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={paddingTop}
              x2={getX(hoveredIndex)}
              y2={paddingTop + chartHeight}
              stroke="#00875A"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.5"
            />
          )}

          {/* Data Points on Curves & X-Axis Labels */}
          {chartData.map((d, idx) => {
            const x = getX(idx);
            const yCollected = getY(d.collected);
            const yExpected = getY(d.expected);
            const isHovered = hoveredIndex === idx;

            return (
              <g key={idx}>
                {/* Expected Point Dot */}
                <circle
                  cx={x}
                  cy={yExpected}
                  r={isHovered ? 4.5 : 3.5}
                  fill="#00875A"
                  className="transition-all"
                />

                {/* Collected Point Dot */}
                <circle
                  cx={x}
                  cy={yCollected}
                  r={isHovered ? 5.5 : 4}
                  fill="#00875A"
                  className="transition-all"
                />

                {/* X-Axis Month Label */}
                <text
                  x={x}
                  y={paddingTop + chartHeight + 22}
                  textAnchor="middle"
                  className={`text-[11px] font-bold ${
                    d.isCurrent || isHovered
                      ? "fill-[#00875A] dark:fill-[#E5C583]"
                      : "fill-slate-500 dark:fill-cream-100/60"
                  }`}
                >
                  {d.label}
                </text>

                {/* Invisible hover trigger column */}
                <rect
                  x={x - chartWidth / (chartData.length * 2)}
                  y={0}
                  width={chartWidth / chartData.length}
                  height={svgHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {activeHover && (
          <div
            className="absolute z-20 pointer-events-none p-3 rounded-2xl bg-slate-900/95 dark:bg-black/90 text-white shadow-xl backdrop-blur-md border border-white/15 text-xs transition-transform duration-75 space-y-1.5"
            style={{
              left: `${Math.min(
                Math.max(10, (getX(hoveredIndex) / svgWidth) * 100),
                80
              )}%`,
              top: "10px",
              transform: "translateX(-50%)"
            }}
          >
            <div className="font-extrabold text-[11.5px] pb-1 border-b border-white/10 text-slate-200">
              {activeHover.label} {activeHover.year}
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#00875A]" />
                Collected:
              </span>
              <strong className="text-emerald-400 font-extrabold">
                ₦{activeHover.collected.toLocaleString()}
              </strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Expected:
              </span>
              <strong className="text-white font-extrabold">
                ₦{activeHover.expected.toLocaleString()}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
