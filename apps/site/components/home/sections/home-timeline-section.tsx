"use client";

import { motion, useReducedMotion } from "motion/react";
import { homeEase, homeInView } from "../home-motion";
import { timelineSections } from "../home-data";

export function HomeTimelineSection() {
  const shouldReduceMotion = useReducedMotion();
  const ease = homeEase;
  const inView = homeInView;

  return (
    <section className="relative z-10 space-y-10 border-x border-dashed border-neutral-200/80 px-6 py-14 sm:px-8 sm:py-18 sm:pt-12">
      {timelineSections.map((section) => (
        <div
          key={section.label}
          className="grid gap-5 sm:grid-cols-[140px_1fr]"
        >
          <motion.div
            className="space-y-2"
            initial={
              shouldReduceMotion
                ? undefined
                : { opacity: 0, y: 28, scale: 0.985 }
            }
            whileInView={
              shouldReduceMotion
                ? undefined
                : { opacity: 1, y: 0, scale: 1 }
            }
            viewport={inView}
            transition={{ duration: 0.85, ease }}
          >
            <div className="w-fit space-y-3">
              <motion.div
                className="h-px w-full mb-3 max-w-[120px] bg-gradient-to-r from-neutral-300 to-transparent"
                aria-hidden
                style={{ transformOrigin: "left center" }}
                initial={shouldReduceMotion ? undefined : { scaleX: 0 }}
                whileInView={shouldReduceMotion ? undefined : { scaleX: 1 }}
                viewport={inView}
                transition={{ duration: 1, ease }}
              />
              <p className="font-geist-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400">
                {section.label}
              </p>
            </div>
            <p className="text-xs leading-5 text-neutral-400">{section.hint}</p>
          </motion.div>
          <div className="space-y-4">
            {section.items.map((item, index) => (
              <motion.div
                key={`${section.label}-${item.title}`}
                className="border border-neutral-200 p-4"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 32 }}
                whileInView={
                  shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
                }
                viewport={inView}
                transition={{
                  duration: 0.75,
                  delay: shouldReduceMotion ? 0 : index * 0.1,
                  ease,
                }}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                  <h2 className="text-base font-medium text-neutral-950">
                    {item.title}
                  </h2>
                  <p className="font-geist-mono text-[11px] uppercase tracking-[0.24em] text-neutral-400">
                    {item.period}
                  </p>
                </div>
                <p
                  className="mt-3 text-sm leading-7 text-neutral-600"
                  dangerouslySetInnerHTML={{
                    __html: item.description || "",
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
