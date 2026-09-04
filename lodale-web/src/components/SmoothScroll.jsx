import React, { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }) {
  useEffect(() => {
    // Initialize Lenis smooth scroll with premium dampening
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
      infinite: false,
    });

    // Synchronize Lenis scroll events with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis via GSAP ticker for locked 60/120fps sync and zero jitter
    const updateLenis = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    // Make lenis globally accessible for programmatic smooth scrolling
    window.lenis = lenis;
    window.scrollToSection = (target, offset = -80) => {
      const el = typeof target === "string" ? document.getElementById(target.replace("#", "")) : target;
      if (el) {
        lenis.scrollTo(el, { offset, duration: 1.2 });
      }
    };

    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      window.lenis = null;
      delete window.scrollToSection;
    };
  }, []);

  return <>{children}</>;
}
