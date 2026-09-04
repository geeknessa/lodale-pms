/**
 * LodaleHero.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Interactive Scrollytelling Hero Section for "Lodale"
 * Faithfully recreating the scroll-driven transition inspired by findrealestate.com:
 *
 * 1. Initial State (Scroll 0%):
 *    - Prominent initial hero headline ("Find Where You Belong") with subtitle & CTA button.
 *    - Foreground subject (man with binoculars) is anchored low in the viewport.
 * 2. Phase 1 (Scroll 0% → 30%):
 *    - As user scrolls, the initial hero text glides up and fades out.
 *    - The man with binoculars glides upward into the center of the viewport.
 *    - Bold vector wireframe stroke outlines of "Lodale" and "REAL ESTATE" draw in
 *      with strokeDashoffset over the man.
 * 3. Phase 2 (Scroll 25% → 55%):
 *    - The outer subject outside the typography dissolves smoothly away.
 *    - The subject INSIDE the typography stays 100% visible, masked inside the letters!
 * 4. Phase 3 (Scroll 50% → 85%):
 *    - Inside the letters, we push forward into the binocular lenses (3.5x zoom).
 *    - The neighborhood houses scenery (neighborhood-bg.jpg) dissolves in through
 *      the lenses, filling the typography with the rich architectural vista.
 * 5. Phase 4 (Scroll 80% → 100%):
 *    - The letters are fully filled with the houses vista.
 *    - White strokes dissolve into a subtle golden rim glow.
 *    - Final exploration callouts emerge as the scroll seamlessly unlocks to #listings.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, ArrowDown, Search, Compass, ShieldCheck } from "lucide-react";

import defaultBinoculars from "../assets/hero-binoculars.png";
import defaultNeighborhood from "../assets/neighborhood-bg.jpg";
import cloudMist1 from "../assets/cloud_mist_1.png";
import cloudMist2 from "../assets/cloud_mist_2.png";

gsap.registerPlugin(ScrollTrigger);

export default function LodaleHero({
  binocularsSrc = defaultBinoculars || "/hero-binoculars.png",
  neighborhoodSrc = defaultNeighborhood || "/neighborhood-bg.jpg",
  onExploreClick,
  className = "",
}) {
  const containerRef = useRef(null);
  const pinnedRef = useRef(null);

  // Initial hero text (fades out on scroll, just like findrealestate.com)
  const initialHeroTextRef = useRef(null);

  // Outer full-screen binoculars subject (anchored low, glides up, dissolves outside the letters)
  const outerSubjectRef = useRef(null);

  // Clouds / mist layers
  const cloudsRef = useRef(null);

  // SVG stroke wireframes
  const strokeLodaleRef = useRef(null);
  const strokeSubtitleRef = useRef(null);
  const strokeGoldRef = useRef(null);

  // Inside-mask elements
  const maskedLayerRef = useRef(null);
  const maskedBinocularsRef = useRef(null);
  const maskedNeighborhoodRef = useRef(null);

  // Final brand reveal elements
  const finalRevealUIRef = useRef(null);
  const scrollIndicatorRef = useRef(null);

  const [pathLength, setPathLength] = useState(3400);
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    if (document.fonts) {
      document.fonts.ready.then(() => {
        setFontLoaded(true);
        if (strokeLodaleRef.current) {
          try {
            if (typeof strokeLodaleRef.current.getComputedTextLength === "function") {
              const len = strokeLodaleRef.current.getComputedTextLength();
              setPathLength(Math.max(2800, Math.round(len * 3.5)));
            }
          } catch {
            setPathLength(3400);
          }
        }
        ScrollTrigger.refresh();
      });
    } else {
      setFontLoaded(true);
    }
  }, []);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      // ── Initial Setup ─────────────────────────────────────────────────────
      // Initial headline: prominent at top of page
      gsap.set(initialHeroTextRef.current, {
        opacity: 1,
        y: 0,
      });

      // Outer subject: anchored low (binoculars lenses in lower third of screen)
      gsap.set(outerSubjectRef.current, {
        yPercent: 24,
        scale: 1,
        opacity: 1,
        transformOrigin: "50% 45%",
      });

      // Clouds / atmosphere
      gsap.set(cloudsRef.current, {
        opacity: 0.55,
        y: 0,
      });

      // Stroke wireframes: hidden initially, ready to trace
      gsap.set(strokeLodaleRef.current, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength,
        opacity: 0,
      });

      gsap.set(strokeSubtitleRef.current, {
        strokeDasharray: 1200,
        strokeDashoffset: 1200,
        opacity: 0,
      });

      gsap.set(strokeGoldRef.current, { opacity: 0 });

      // Inside-the-mask group: starts hidden, ready for seamless mask capture
      gsap.set(maskedLayerRef.current, {
        opacity: 0,
      });

      gsap.set(maskedBinocularsRef.current, {
        scale: 1,
        yPercent: 0,
        opacity: 1,
        transformOrigin: "50% 45%", // Pivot centered on binocular lenses
      });

      gsap.set(maskedNeighborhoodRef.current, {
        opacity: 0,
        scale: 1.25,
        transformOrigin: "50% 50%",
      });

      // Final UI
      gsap.set(finalRevealUIRef.current, {
        opacity: 0,
        y: 35,
        pointerEvents: "none",
      });

      /* ─────────────────────────────────────────────────────────────────────
         PHASE 1 (Scroll 0% → 32%):
         - Initial headline fades out and drifts slightly up.
         - The man with binoculars translates upward toward the center.
         - White stroke outlines of "Lodale" and "REAL ESTATE" trace in.
         ───────────────────────────────────────────────────────────────────── */
      tl.to(
        initialHeroTextRef.current,
        {
          opacity: 0,
          y: -45,
          duration: 25,
          ease: "power1.in",
        },
        0
      );

      tl.to(
        outerSubjectRef.current,
        {
          yPercent: 0,
          scale: 1.08,
          duration: 32,
          ease: "power1.out",
        },
        0
      );

      tl.fromTo(
        maskedBinocularsRef.current,
        { yPercent: 24, scale: 1 },
        {
          yPercent: 0,
          scale: 1.08,
          duration: 32,
          ease: "power1.out",
        },
        0
      );

      tl.to(
        strokeLodaleRef.current,
        {
          opacity: 1,
          strokeDashoffset: 0,
          duration: 30,
          ease: "power2.inOut",
        },
        5
      );

      tl.to(
        strokeSubtitleRef.current,
        {
          opacity: 0.85,
          strokeDashoffset: 0,
          duration: 25,
          ease: "power2.inOut",
        },
        10
      );

      /* ─────────────────────────────────────────────────────────────────────
         PHASE 2 (Scroll 28% → 55%): THE MASK DISSOLVE (findrealestate.com magic)
         - The masked version of the man activates inside the letters.
         - The outer man outside the letters dissolves into the background.
         - Result: The man is now smoothly MASKED inside the typography!
         ───────────────────────────────────────────────────────────────────── */
      tl.to(
        maskedLayerRef.current,
        {
          opacity: 1,
          duration: 15,
          ease: "power2.out",
        },
        28
      );

      tl.to(
        outerSubjectRef.current,
        {
          opacity: 0,
          scale: 1.35,
          duration: 24,
          ease: "power2.inOut",
        },
        32
      );

      tl.to(
        cloudsRef.current,
        {
          opacity: 0.85,
          y: -30,
          duration: 30,
          ease: "none",
        },
        25
      );

      /* ─────────────────────────────────────────────────────────────────────
         PHASE 3 (Scroll 50% → 85%): ZOOMING INTO THE BINOCULAR HOUSES
         - Inside the letters, we push deeply into the binocular lenses (3.5x).
         - The neighborhood houses scenery cross-fades into the lenses and
           fills the entire "Lodale REAL ESTATE" typography.
         ───────────────────────────────────────────────────────────────────── */
      tl.to(
        maskedBinocularsRef.current,
        {
          scale: 3.5,
          yPercent: -8,
          opacity: 0,
          duration: 35,
          ease: "power2.inOut",
        },
        50
      );

      tl.to(
        maskedNeighborhoodRef.current,
        {
          opacity: 1,
          scale: 1,
          duration: 35,
          ease: "power2.out",
        },
        52
      );

      // White stroke dissolves into subtle golden rim
      tl.to(
        strokeLodaleRef.current,
        {
          opacity: 0,
          duration: 22,
          ease: "power1.out",
        },
        58
      );

      tl.to(
        strokeSubtitleRef.current,
        {
          opacity: 0.25,
          duration: 22,
          ease: "power1.out",
        },
        58
      );

      tl.to(
        strokeGoldRef.current,
        {
          opacity: 0.65,
          duration: 25,
          ease: "power1.out",
        },
        58
      );

      /* ─────────────────────────────────────────────────────────────────────
         PHASE 4 (Scroll 80% → 100%): REVEAL & PAGE UNLOCK
         - Typography is fully filled with the rich neighborhood houses.
         - Warm golden rim highlights the cursive curves.
         - Exploration search bar and district tags glide in smoothly.
         ───────────────────────────────────────────────────────────────────── */
      tl.to(
        finalRevealUIRef.current,
        {
          opacity: 1,
          y: 0,
          pointerEvents: "auto",
          duration: 20,
          ease: "power3.out",
        },
        80
      );

      tl.to(
        scrollIndicatorRef.current,
        {
          opacity: 0,
          duration: 15,
          ease: "power1.out",
        },
        84
      );
    },
    { scope: containerRef, dependencies: [fontLoaded, pathLength] }
  );

  return (
    <section
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: "300vh", background: "#0b0b0b" }}
      aria-label="Lodale Scrollytelling Interactive Hero"
    >
      {/* ── PINNED INNER VIEWPORT ────────────────────────────────────────── */}
      <div
        ref={pinnedRef}
        className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center select-none"
        style={{ background: "#0b0b0b" }}
      >
        {/* ── BACKGROUND ATMOSPHERE: SOFT SKY & MIST ───────────────────────── */}
        <div className="absolute inset-0 pointer-events-none z-5 overflow-hidden">
          {/* Ambient Warm Golden-Hour Sky Gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 30%, rgba(201, 150, 62, 0.14) 0%, rgba(45, 106, 79, 0.08) 45%, #0b0b0b 85%)",
            }}
          />

          {/* Soft drifting clouds/mist matching findrealestate.com */}
          <div ref={cloudsRef} className="absolute inset-0 will-change-transform pointer-events-none">
            {cloudMist1 && (
              <img
                src={cloudMist1}
                alt=""
                className="absolute -bottom-10 -left-20 w-[80vw] max-w-[1200px] opacity-40 mix-blend-screen pointer-events-none filter blur-[2px]"
              />
            )}
            {cloudMist2 && (
              <img
                src={cloudMist2}
                alt=""
                className="absolute -bottom-10 -right-20 w-[80vw] max-w-[1200px] opacity-40 mix-blend-screen pointer-events-none filter blur-[2px]"
              />
            )}
          </div>

          {/* Contrast vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, transparent 45%, rgba(11, 11, 11, 0.6) 80%, #0b0b0b 100%)",
            }}
          />
        </div>

        {/* ── INITIAL HERO HEADLINE (VISIBLE ON LOAD, FADES OUT ON SCROLL) ─── */}
        {/* Directly inspired by "Find What Moves You" on findrealestate.com */}
        <div
          ref={initialHeroTextRef}
          className="absolute top-[18vh] sm:top-[20vh] z-25 flex flex-col items-center justify-center px-4 text-center max-w-3xl pointer-events-auto will-change-transform"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-[12px] font-medium tracking-widest uppercase mb-4 shadow-lg shadow-black/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9963E] animate-pulse" />
            Verified Property Management &amp; Residencies
          </div>

          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-normal text-white tracking-tight leading-[1.08] mb-4 drop-shadow-md"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Find What Moves You.
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-white/75 font-normal leading-relaxed max-w-xl mb-7 font-sans">
            Expert guidance. Real landlords. A seamless path to verified luxury living across Nigeria.
          </p>

          <button
            onClick={() => {
              if (window.lenis) {
                const el = document.getElementById("estate-search") || document.getElementById("listings");
                if (el) window.lenis.scrollTo(el, { offset: -80, duration: 1.2 });
              } else {
                const el = document.getElementById("estate-search") || document.getElementById("listings");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-ink-950 font-semibold text-sm transition-all duration-300 hover:bg-cream-100 hover:scale-[1.03] active:scale-[0.98] shadow-xl shadow-black/40 cursor-pointer"
          >
            <span>Explore Properties</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* ── FOREGROUND SUBJECT: MAN WITH BINOCULARS (INITIAL & MORPH) ───── */}
        {/* Full-bleed DOM element: anchored low on load, glides up, dissolves in Phase 2 */}
        <div
          ref={outerSubjectRef}
          className="absolute inset-0 z-15 pointer-events-none will-change-transform overflow-hidden"
        >
          <img
            src={binocularsSrc}
            alt="Man overlooking estates with binoculars"
            className="w-full h-full object-cover object-[50%_35%]"
            style={{
              filter: "brightness(0.98) contrast(1.08)",
            }}
          />
        </div>

        {/* ── MASKED SUBJECT: SECOND STACKED COPY OF IDENTICAL DOM ELEMENT ─── */}
        {/* Rendered as a full-viewport DOM element with identical object-fit/position */}
        {/* Clipped to the exact wordmark text geometry */}
        <div
          ref={maskedLayerRef}
          className="absolute inset-0 z-20 pointer-events-none will-change-transform overflow-hidden"
          style={{
            clipPath: "url(#lodale-scrollytelling-clip)",
            WebkitClipPath: "url(#lodale-scrollytelling-clip)",
          }}
        >
          {/* Layer A: Binoculars Subject (Captures man inside the letters with exact same scale/crop) */}
          <div
            ref={maskedBinocularsRef}
            className="absolute inset-0 w-full h-full will-change-transform"
            style={{ transformOrigin: "50% 45%" }}
          >
            <img
              src={binocularsSrc}
              alt=""
              className="w-full h-full object-cover object-[50%_35%]"
              style={{
                filter: "brightness(1.05) contrast(1.1)",
              }}
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          {/* Layer B: Neighborhood Houses (Expands & fills through the lenses) */}
          <div
            ref={maskedNeighborhoodRef}
            className="absolute inset-0 w-full h-full will-change-transform"
            style={{ transformOrigin: "50% 50%" }}
          >
            <img
              src={neighborhoodSrc}
              alt=""
              className="w-full h-full object-cover object-[50%_35%]"
              style={{
                filter: "brightness(1.08) contrast(1.12) saturate(1.15)",
              }}
            />
            {/* Warm sunset sheen overlay in plain CSS (fixes invalid SVG gradient fill) */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(201, 150, 62, 0.12) 0%, rgba(0, 0, 0, 0.25) 100%)",
                mixBlendMode: "overlay",
              }}
            />
          </div>
        </div>

        {/* ── SVG LAYER: STROKE WIREFRAME TRACES & CLIP-PATH DEFINITION ────── */}
        {/* Renders at true viewport scale across all aspect ratios */}
        <div className="absolute inset-0 z-25 pointer-events-none flex items-center justify-center">
          <svg
            className="w-full h-full pointer-events-none overflow-visible"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            <defs>
              {/* SVG CLIPPATH: Shapes the text mask for maskedLayerRef */}
              <clipPath id="lodale-scrollytelling-clip" clipPathUnits="userSpaceOnUse">
                {/* Brandmark: Lodale cursive font */}
                <text
                  x="50%"
                  y="45%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="clamp(90px, 14vw, 220px)"
                  fontWeight="400"
                  fontFamily="'Playball', cursive"
                  letterSpacing="2px"
                >
                  Lodale
                </text>
                {/* Architectural subtitle */}
                <text
                  x="50%"
                  y="63%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="clamp(16px, 2.5vw, 38px)"
                  fontWeight="800"
                  fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
                  letterSpacing="clamp(6px, 1.2vw, 16px)"
                >
                  REAL ESTATE
                </text>
              </clipPath>
            </defs>

            {/* ── LAYER C: WHITE STROKE WIREFRAME TRACE (PHASE 1 → 2) ───────── */}
            {/* Cursive Brandmark Stroke */}
            <text
              ref={strokeLodaleRef}
              x="50%"
              y="45%"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="clamp(90px, 14vw, 220px)"
              fontWeight="400"
              fontFamily="'Playball', cursive"
              letterSpacing="2px"
              fill="none"
              stroke="rgba(255, 255, 255, 0.95)"
              strokeWidth="2.2"
              className="vector-stroke-lodale"
              style={{
                strokeLinecap: "round",
                strokeLinejoin: "round",
                filter: "drop-shadow(0 0 4px rgba(255,255,255,0.45))",
              }}
            >
              Lodale
            </text>

            {/* "REAL ESTATE" Subtitle Stroke */}
            <text
              ref={strokeSubtitleRef}
              x="50%"
              y="63%"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="clamp(16px, 2.5vw, 38px)"
              fontWeight="800"
              fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
              letterSpacing="clamp(6px, 1.2vw, 16px)"
              fill="none"
              stroke="rgba(255, 255, 255, 0.85)"
              strokeWidth="1.6"
              style={{
                strokeLinecap: "round",
                strokeLinejoin: "round",
              }}
            >
              REAL ESTATE
            </text>

            {/* ── LAYER D: GOLDEN RIM OUTLINE (PHASE 3 → 4) ─────────────────── */}
            <text
              ref={strokeGoldRef}
              x="50%"
              y="45%"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="clamp(90px, 14vw, 220px)"
              fontWeight="400"
              fontFamily="'Playball', cursive"
              letterSpacing="2px"
              fill="none"
              stroke="#C9963E"
              strokeWidth="1.6"
              style={{
                strokeLinecap: "round",
                strokeLinejoin: "round",
                filter: "drop-shadow(0 0 6px rgba(201, 150, 62, 0.5))",
              }}
            >
              Lodale
            </text>
          </svg>
        </div>

        {/* ── PHASE 4: FINAL REVEAL BRAND NARRATIVE (SEARCH BAR REMOVED FROM HERO) ── */}
        <div
          ref={finalRevealUIRef}
          className="absolute bottom-10 sm:bottom-14 left-0 right-0 z-30 flex flex-col items-center justify-center px-4 pointer-events-none text-center"
        >
          <p className="max-w-xl text-sm sm:text-base md:text-lg text-white/85 font-normal leading-relaxed mb-6 font-sans drop-shadow-md">
            From visionary perspectives to tangible addresses. Explore verified residences engineered with architectural distinction across Nigeria&apos;s premier locations.
          </p>

          <div className="flex items-center justify-center pointer-events-auto">
            <button
              onClick={() => {
                if (window.lenis) {
                  const el = document.getElementById("estate-search") || document.getElementById("listings");
                  if (el) window.lenis.scrollTo(el, { offset: -80, duration: 1.2 });
                } else {
                  const el = document.getElementById("estate-search") || document.getElementById("listings");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="group inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-[#C9963E]/60 text-white text-sm font-medium backdrop-blur-md transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-xl cursor-pointer"
            >
              <span>Explore Verified Estates Below</span>
              <ArrowDown className="w-4 h-4 text-[#C9963E] transition-transform group-hover:translate-y-1" />
            </button>
          </div>
        </div>

        {/* ── FLOATING SCROLL CUE ─────────────────────────────────────────── */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-25 flex flex-col items-center gap-1.5 text-white/50 text-[11px] tracking-widest uppercase font-mono pointer-events-none transition-opacity duration-300"
        >
          <span>Scroll to Discover</span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce text-[#C9963E]" />
        </div>
      </div>
    </section>
  );
}
