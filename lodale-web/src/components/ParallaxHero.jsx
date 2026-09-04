/**
 * ParallaxHero.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Scroll-driven animation sequence:
 *
 *  Phase 0  : Fullscreen binoculars image covers viewport.
 *             Geometric "TRUST" SVG paths draw in sync with scroll.
 *             Image simultaneously fades out.
 *
 *  Phase 1  : Geometric TRUST outline fully drawn.
 *
 *  Phase 2  : (~2s after phase 1) Geometric outline fades out.
 *
 *  Phase 3  : Real "TRUST" heading + search UI fades in.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { Search, MapPin, ArrowRight } from "lucide-react";
import binocularsImg from "../assets/hero_binoculars_transparent.png";

// ── Constants ─────────────────────────────────────────────────────────────────
const SEARCH_TABS = ["Rent", "Buy", "Shortlet"];
const POPULAR_LOCATIONS = ["Ikoyi", "Lekki", "Victoria Island", "Ikeja"];

// ── SVG letter definitions (geometric / constructed style, 100x120 viewBox) ──
// Each letter path is designed to look like architectural/engineering line art
const TRUST_LETTERS = [
  // T
  { w: 90, paths: ["M 5 10 L 85 10", "M 45 10 L 45 110"] },
  // R
  {
    w: 90,
    paths: [
      "M 10 10 L 10 110",
      "M 10 10 L 60 10 Q 85 10 85 35 Q 85 65 55 65 L 10 65",
      "M 50 65 L 85 110",
    ],
  },
  // U
  { w: 90, paths: ["M 10 10 L 10 80 Q 10 110 45 110 Q 80 110 80 80 L 80 10"] },
  // S
  {
    w: 90,
    paths: [
      "M 78 28 Q 78 10 55 10 L 35 10 Q 10 10 10 32 Q 10 60 45 60 Q 80 60 80 88 Q 80 110 55 110 L 35 110 Q 12 110 12 92",
    ],
  },
  // T (same as first)
  { w: 90, paths: ["M 5 10 L 85 10", "M 45 10 L 45 110"] },
];

const LETTER_GAP = 18;
const LETTER_H = 120;
const TOTAL_W = TRUST_LETTERS.reduce((s, l) => s + l.w, 0) + LETTER_GAP * (TRUST_LETTERS.length - 1);

// Flatten to array of { d, xOffset }
const ALL_SEGS = (() => {
  const out = [];
  let x = 0;
  TRUST_LETTERS.forEach((letter) => {
    letter.paths.forEach((d) => out.push({ d, x }));
    x += letter.w + LETTER_GAP;
  });
  return out;
})();

// ── Component ─────────────────────────────────────────────────────────────────
export default function ParallaxHero({ onExploreClick }) {
  const containerRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Rent");
  const [searchValue, setSearchValue] = useState("");

  // 0=image shown, 1=geo complete, 2=geo fading, 3=text revealed
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);
  const timerRef = useRef(null);

  const prefersReducedMotion = useReducedMotion();
  const isMobileRef = useRef(false);
  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768;
  }, []);

  // ── Scroll tracking ───────────────────────────────────────────────────────
  // Section is 200vh; sticky inner div is 100vh
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // ── Motion values ─────────────────────────────────────────────────────────
  // Binoculars fade: 1 at scroll=0, 0 at scroll=0.45
  const binOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);

  // Geo draw progress: 0 at scroll=0.05, 1 at scroll=0.6
  const geoProgress = useTransform(scrollYProgress, [0.05, 0.6], [0, 1]);

  // Geo fade-in (opacity 0→1 between 0.05→0.18 of scroll)
  const geoScrollOpacity = useTransform(scrollYProgress, [0.05, 0.18], [0, 1]);

  // Background parallax
  const bgY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion || isMobileRef.current ? ["0%", "0%"] : ["0%", "14%"]
  );
  const textY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion || isMobileRef.current ? ["0%", "0%"] : ["0%", "22%"]
  );
  const heroOpacity = useTransform(
    scrollYProgress,
    [0, 0.85],
    prefersReducedMotion ? [1, 1] : [1, 0.08]
  );

  // ── Phase state machine ───────────────────────────────────────────────────
  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase(3);
      phaseRef.current = 3;
      return;
    }

    const unsub = geoProgress.on("change", (v) => {
      // Drawing complete → trigger fade-out timer
      if (phaseRef.current === 0 && v >= 0.98) {
        phaseRef.current = 1;
        setPhase(1);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          phaseRef.current = 2;
          setPhase(2);
          setTimeout(() => {
            phaseRef.current = 3;
            setPhase(3);
          }, 850);
        }, 2000);
      }
      // User scrolled back up — reset
      if (phaseRef.current >= 1 && v < 0.85) {
        clearTimeout(timerRef.current);
        phaseRef.current = 0;
        setPhase(0);
      }
    });

    return () => {
      unsub();
      clearTimeout(timerRef.current);
    };
  }, [geoProgress, prefersReducedMotion]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleScrollTo = (id) => {
    if (window.lenis) window.lenis.scrollTo(`#${id}`);
    else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onExploreClick) onExploreClick(searchValue, activeTab);
    else handleScrollTo("listings");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section
      ref={containerRef}
      id="hero"
      aria-label="Lodale hero section"
      className="relative w-full bg-[#133123] select-none"
      style={{ minHeight: "200vh" }}
    >
      {/* Sticky viewport — all animation happens here */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">

        {/* ── BG Layer (z-0) ─────────────────────────────────────────────── */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ y: bgY, willChange: "transform" }}
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(circle at 50% 45%, rgba(58,90,64,0.65) 0%, rgba(19,49,35,0.95) 70%, #0d2218 100%)",
            }}
          />
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <pattern id="hero-geo-grid" width="70" height="70" patternUnits="userSpaceOnUse">
                <path d="M 70 0 L 0 0 0 70" fill="none" stroke="#DAD7CD" strokeWidth="0.75" opacity="0.55" />
                <circle cx="70" cy="0" r="1.5" fill="#DAD7CD" opacity="0.7" />
                <circle cx="0" cy="70" r="1.5" fill="#DAD7CD" opacity="0.7" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-geo-grid)" />
          </svg>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.1,
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 140px, rgba(218,215,205,0.06) 140px, rgba(218,215,205,0.06) 141px)",
            }}
          />
        </motion.div>

        {/* ── Real TRUST heading + badge (z-10) — visible ONLY in phase 3 ──────── */}
        <motion.div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-2 sm:px-4"
          style={{ y: textY, willChange: "transform, opacity" }}
          animate={{ opacity: phase >= 3 ? 1 : 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.94 }}
            animate={phase >= 3 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -14, scale: 0.94 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            role="note"
            className="
              z-30 pointer-events-auto
              inline-flex items-center gap-2 sm:gap-2.5
              px-3 sm:px-4 py-1 sm:py-1.5 rounded-full
              bg-[#0d2218]/85 border border-[#DAD7CD]/20
              backdrop-blur-md shadow-sm
              mb-2 sm:mb-3 md:mb-4
              -translate-y-8 sm:-translate-y-12 md:-translate-y-16 lg:-translate-y-20
            "
          >
            <span aria-hidden="true" className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#4A7C59] shadow-[0_0_6px_#4A7C59] animate-pulse shrink-0" />
            <span className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold tracking-[0.2em] sm:tracking-[0.22em] uppercase text-[#DAD7CD] whitespace-nowrap">
              DIRECT&nbsp;•&nbsp;TRANSPARENT&nbsp;•&nbsp;VERIFIED
            </span>
          </motion.div>

          <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={phase >= 3 ? { scale: 1, opacity: 0.9 } : { scale: 0.9, opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="
              text-[22vw] sm:text-[18vw] md:text-[15vw] lg:text-[14vw]
              font-bold text-[#DAD7CD]
              tracking-normal sm:tracking-wider md:tracking-widest
              uppercase leading-none text-center select-none
              drop-shadow-[0_10px_25px_rgba(0,0,0,0.55)]
              -translate-y-8 sm:-translate-y-12 md:-translate-y-16 lg:-translate-y-20
            "
            style={{ fontFamily: "'Inria Serif', ui-serif, Georgia, serif" }}
          >
            TRUST
          </motion.h1>
        </motion.div>

        {/* ── Geometric TRUST SVG draw-in (z-25) ──────────────────────────── */}
        {!prefersReducedMotion && (
          <GeometricTrust
            geoProgress={geoProgress}
            geoScrollOpacity={geoScrollOpacity}
            phase={phase}
          />
        )}

        {/* ── Fullscreen binoculars image (z-40) ───────────────────────────── */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 z-40 pointer-events-none"
          style={{ opacity: prefersReducedMotion ? 0 : binOpacity }}
        >
          <img
            src={binocularsImg}
            alt=""
            role="presentation"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-center"
            style={{
              maskImage:
                "linear-gradient(to bottom, black 60%, rgba(0,0,0,0.85) 82%, rgba(0,0,0,0.3) 95%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 60%, rgba(0,0,0,0.85) 82%, rgba(0,0,0,0.3) 95%, transparent 100%)",
            }}
          />
          {/* Subtle dark vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 30%, transparent 25%, rgba(13,34,24,0.4) 100%)",
            }}
          />
        </motion.div>

        {/* ── Search widget (z-50) — visible in phase 3 ───────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="
            absolute bottom-3 sm:bottom-5 md:bottom-7 z-50
            pointer-events-auto
            w-full max-w-[96%] sm:max-w-xl md:max-w-2xl
            left-0 right-0 mx-auto
            flex flex-col items-center
          "
        >
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            aria-label="Property search"
            className="
              w-full
              backdrop-blur-xl bg-white/10 dark:bg-[#07130d]/80
              border border-white/20 dark:border-white/15
              rounded-full
              shadow-[0_16px_40px_rgba(0,0,0,0.45)]
              p-1 sm:p-1.5 md:p-2
              flex items-center gap-1 sm:gap-1.5 md:gap-2
              transition-colors duration-300
              hover:border-white/35 focus-within:border-white/40
            "
          >
            <div
              role="tablist"
              aria-label="Search intent"
              className="flex items-center bg-black/25 rounded-full p-0.5 border border-white/10 shrink-0"
            >
              {SEARCH_TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      relative px-2 sm:px-2.5 md:px-3.5 py-0.5 sm:py-1
                      text-[10px] sm:text-[11px] md:text-xs font-semibold rounded-full
                      transition-colors cursor-pointer
                      outline-none focus-visible:ring-1 focus-visible:ring-white/60
                      ${isActive ? "text-[#133123]" : "text-[#DAD7CD]/75 hover:text-white"}
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeSearchTab"
                        aria-hidden="true"
                        className="absolute inset-0 bg-[#DAD7CD] rounded-full shadow-sm"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{tab}</span>
                  </button>
                );
              })}
            </div>

            <label htmlFor="hero-search-input" className="sr-only">
              Search by location, district or landmark
            </label>
            <div className="flex-1 flex items-center min-w-0 px-1.5 sm:px-2 md:px-3">
              <MapPin aria-hidden="true" className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-[#DAD7CD]/55 shrink-0 mr-1 sm:mr-1.5 md:mr-2" />
              <input
                id="hero-search-input"
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={
                  typeof window !== "undefined" && window.innerWidth < 480
                    ? "Location or district…"
                    : "Search location, district, landmark…"
                }
                autoComplete="off"
                className="
                  w-full bg-transparent
                  text-white text-[11px] sm:text-xs md:text-sm
                  placeholder:text-[#DAD7CD]/40
                  outline-none border-none shadow-none font-sans
                "
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Search properties"
              className="
                inline-flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2
                px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5
                rounded-full text-[10px] sm:text-xs md:text-sm
                font-bold tracking-wide uppercase
                bg-[#DAD7CD] text-[#133123]
                hover:bg-white transition-colors duration-200 shadow-md
                cursor-pointer shrink-0
                outline-none focus-visible:ring-2 focus-visible:ring-white
              "
            >
              <Search aria-hidden="true" className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-[#133123]" />
              <span className="hidden sm:inline">Search</span>
            </motion.button>
          </form>

          <div className="mt-1.5 sm:mt-2 flex items-center flex-wrap justify-center gap-x-2 gap-y-1 text-[10px] sm:text-[11px] text-[#DAD7CD]/65 font-sans px-1">
            <span className="whitespace-nowrap opacity-60 text-[9px] sm:text-[10px] uppercase tracking-widest">
              Popular:
            </span>
            <div className="flex items-center gap-1.5">
              {POPULAR_LOCATIONS.map((loc, i) => (
                <span key={loc} className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setSearchValue(loc); handleScrollTo("listings"); }}
                    className="hover:text-white transition-colors cursor-pointer hover:underline underline-offset-2 whitespace-nowrap"
                  >
                    {loc}
                  </button>
                  {i < POPULAR_LOCATIONS.length - 1 && (
                    <span aria-hidden="true" className="opacity-30">•</span>
                  )}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleScrollTo("for-landlords")}
              className="hidden md:inline-flex items-center gap-1 text-[#E5C583] hover:text-white font-medium transition-colors cursor-pointer border-l border-white/20 pl-2 ml-1"
            >
              Listing a home?
              <ArrowRight aria-hidden="true" className="w-3 h-3" />
            </button>
          </div>
        </motion.div>

        {/* ── Scroll nudge (z-50, phase 0 only) ───────────────────────────── */}
        <motion.div
          animate={{ opacity: phase === 0 ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-1"
          aria-hidden="true"
        >
          <span className="text-[#DAD7CD]/50 text-[10px] tracking-widest uppercase font-sans">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-[#DAD7CD]/50 to-transparent"
          />
        </motion.div>

      </div>{/* end sticky */}
    </section>
  );
}

// ── GeometricTrust ─────────────────────────────────────────────────────────────
// SVG that draws "TRUST" stroke paths in sync with scroll progress
function GeometricTrust({ geoProgress, geoScrollOpacity, phase }) {
  const pathRefs = useRef([]);
  const [lengths, setLengths] = useState([]);

  // Measure actual SVG path lengths after mount
  useEffect(() => {
    const measured = pathRefs.current.map((el) =>
      el ? el.getTotalLength() : 300
    );
    setLengths(measured);
  }, []);

  // Drive stroke-dashoffset imperatively via the motion value subscription
  useEffect(() => {
    if (lengths.length === 0) return;
    const total = ALL_SEGS.length;

    const unsub = geoProgress.on("change", (progress) => {
      pathRefs.current.forEach((el, i) => {
        if (!el) return;
        const len = lengths[i] || 300;
        // Slightly stagger each segment
        const stagger = (i / total) * 0.12;
        const p = Math.min(1, Math.max(0, (progress - stagger) / (1 - 0.12)));
        el.style.strokeDashoffset = String(len * (1 - p));
      });
    });

    return unsub;
  }, [geoProgress, lengths]);

  // Compute opacity: scroll-driven fade-in for phase 0-1, animate out for phase 2+
  const baseOpacity = phase >= 2 ? 0 : geoScrollOpacity;

  return (
    <motion.div
      className="absolute inset-0 z-[25] pointer-events-none flex items-center justify-center -translate-y-8 sm:-translate-y-12 md:-translate-y-16 lg:-translate-y-20"
      style={{ opacity: baseOpacity }}
      animate={phase >= 2 ? { opacity: 0 } : undefined}
      transition={phase === 2 ? { duration: 0.85, ease: "easeOut" } : undefined}
    >
      <svg
        viewBox={`0 0 ${TOTAL_W} ${LETTER_H}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{
          width: "min(88vw, 720px)",
          height: "auto",
          overflow: "visible",
          filter: "drop-shadow(0 0 20px rgba(218,215,205,0.5))",
        }}
      >
        <defs>
          <filter id="trust-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Faint guide lines */}
        {[10, 60, 110].map((y) => (
          <line key={y} x1="0" y1={y} x2={TOTAL_W} y2={y} stroke="#DAD7CD" strokeWidth="0.4" opacity="0.12" strokeDasharray="4 8" />
        ))}

        {/* Corner registration crosses */}
        {[[0, 0], [TOTAL_W, 0], [0, LETTER_H], [TOTAL_W, LETTER_H]].map(([cx, cy]) => (
          <g key={`${cx}-${cy}`} transform={`translate(${cx}, ${cy})`}>
            <line x1="-10" y1="0" x2="10" y2="0" stroke="#DAD7CD" strokeWidth="0.7" opacity="0.35" />
            <line x1="0" y1="-10" x2="0" y2="10" stroke="#DAD7CD" strokeWidth="0.7" opacity="0.35" />
          </g>
        ))}

        {/* Letter paths */}
        {ALL_SEGS.map(({ d, x }, i) => {
          const len = lengths[i] || 300;
          return (
            <path
              key={i}
              ref={(el) => (pathRefs.current[i] = el)}
              d={d}
              transform={`translate(${x}, 0)`}
              fill="none"
              stroke="#DAD7CD"
              strokeWidth="3.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={len}
              strokeDashoffset={len}
              style={{ filter: "url(#trust-glow)" }}
            />
          );
        })}

        {/* Scan-line sweep accent */}
        <ScanLine geoProgress={geoProgress} totalH={LETTER_H} totalW={TOTAL_W} />
      </svg>
    </motion.div>
  );
}

// ── ScanLine ───────────────────────────────────────────────────────────────────
function ScanLine({ geoProgress, totalH, totalW }) {
  const ref = useRef(null);

  useEffect(() => {
    const unsub = geoProgress.on("change", (v) => {
      if (!ref.current) return;
      const y = v * totalH;
      ref.current.setAttribute("y1", y);
      ref.current.setAttribute("y2", y);
      ref.current.style.opacity = v > 0.03 && v < 0.97 ? "0.55" : "0";
    });
    return unsub;
  }, [geoProgress, totalH]);

  return (
    <line
      ref={ref}
      x1="0" y1="0" x2={totalW} y2="0"
      stroke="#DAD7CD"
      strokeWidth="0.6"
      opacity="0"
      strokeDasharray="3 5"
      style={{ transition: "opacity 0.2s" }}
    />
  );
}
