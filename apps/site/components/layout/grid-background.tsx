"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function GridBackground() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-parallax-bg='grid']",
        { y: 0 },
        {
          y: 180,
          ease: "none",
          scrollTrigger: {
            start: 0,
            end: "max",
            scrub: 0.25,
          },
        },
      );
    });

    // Debounced refresh: re-measure whenever the document height changes.
    // This covers route changes, comment pagination, expand/collapse, and
    // any other dynamic content that alters the page's scrollable height.
    let rafId: ReturnType<typeof requestAnimationFrame>;
    let lastHeight = document.body.scrollHeight;

    const observer = new ResizeObserver(() => {
      const newHeight = document.body.scrollHeight;
      if (newHeight === lastHeight) return;
      lastHeight = newHeight;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => ScrollTrigger.refresh());
    });

    observer.observe(document.body);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        data-parallax-bg="grid"
        className="absolute inset-[-20%] opacity-[0.42] bg-size-[24px_24px] bg-[linear-gradient(to_right,rgba(0,0,0,0.048)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.048)_1px,transparent_1px)]"
      />
    </div>
  );
}
