"use client";

import { useRef } from "react";
import { useScroll, useTransform } from "motion/react";
import { HomeHeroSection } from "./sections/home-hero-section";
import { HomeTechMarqueeSection } from "./sections/home-tech-marquee-section";
import { HomeTimelineSection } from "./sections/home-timeline-section";
import { HomeWorkSection } from "./sections/home-work-section";
import { HomeOpenSourceSection } from "./sections/home-open-source-section";
import { HomeContactSection } from "./sections/home-contact-section";

export function HomePage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: pageRef,
    offset: ["start start", "end end"],
  });
  const heroForegroundY = useTransform(scrollYProgress, [0, 1], [0, -88]);

  return (
    <>
      <div
        ref={pageRef}
        className="relative mx-auto min-h-[calc(100vh-3.5rem)] max-w-[734px] px-0"
      >
        <div className="relative z-10 min-h-[calc(100vh-3.5rem)] bg-white">
          <HomeHeroSection heroForegroundY={heroForegroundY} />
          <HomeTechMarqueeSection />
          <HomeTimelineSection />
          <HomeWorkSection />
          <HomeOpenSourceSection />
          <HomeContactSection />
        </div>
      </div>
    </>
  );
}
