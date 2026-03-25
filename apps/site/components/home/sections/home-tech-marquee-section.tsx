"use client";

import { Marquee } from "@/components/ui/marquee";
import { techStack } from "../home-data";
import { HomeTechChip } from "../home-tech-chip";

export function HomeTechMarqueeSection() {
  return (
    <section className="relative z-10 border-x border-dashed border-neutral-200/80 pb-10 pt-0 overflow-hidden">
      <div className="relative px-6 sm:px-8">
        <div className="pointer-events-none absolute inset-y-0 left-6 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:left-8 sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-6 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:right-8 sm:w-16" />
        <Marquee
          pauseOnHover
          repeat={2}
          className="cursor-default select-none [--duration:24s]"
        >
          {techStack.map((tech) => (
            <HomeTechChip key={tech.name} tech={tech} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
