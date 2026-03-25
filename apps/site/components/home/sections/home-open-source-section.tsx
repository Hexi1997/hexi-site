"use client";

import { motion, useReducedMotion } from "motion/react";
import { homeEase, homeInView } from "../home-motion";
import { openSourceSections } from "../home-data";

export function HomeOpenSourceSection() {
  const shouldReduceMotion = useReducedMotion();
  const ease = homeEase;
  const inView = homeInView;

  return (
    <section className="relative z-10 space-y-3 border-x border-dashed border-neutral-200/80 px-6 py-14 sm:px-8 sm:py-18 sm:pt-12">
      <div className="space-y-3 mb-8">
        <motion.div
          className="h-px w-full max-w-[240px] bg-gradient-to-r from-neutral-300 to-transparent"
          aria-hidden
          style={{ transformOrigin: "left center" }}
          initial={shouldReduceMotion ? undefined : { scaleX: 0 }}
          whileInView={shouldReduceMotion ? undefined : { scaleX: 1 }}
          viewport={inView}
          transition={{ duration: 1, ease }}
        />
        <motion.div
          className="space-y-2"
          initial={
            shouldReduceMotion
              ? undefined
              : { opacity: 0, y: 28, scale: 0.985 }
          }
          whileInView={
            shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }
          }
          viewport={inView}
          transition={{ duration: 0.85, ease }}
        >
          <p className="font-geist-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400">
            Open Source Contributions
          </p>
        </motion.div>
      </div>
      {openSourceSections.map((section) => (
        <div
          key={section.label}
          className="flex flex-col-reverse sm:flex-row gap-5"
        >
          <div className="space-y-4 flex-1">
            {section.items.map((item, index) => {
              const hasHref = "href" in item && item.href;
              const cardContent = (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                    <h2 className="text-base font-medium text-neutral-950">
                      {item.title}
                    </h2>
                    <p className="font-geist-mono text-[11px] uppercase tracking-[0.24em] text-neutral-400">
                      {item.period}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">
                    {item.description || ""}
                  </p>
                  {"action" in item && item.action ? (
                    <p className="mt-4 font-geist-mono text-[11px] uppercase tracking-[0.24em] text-neutral-400 transition-colors group-hover:text-neutral-950">
                      {item.action as string}
                    </p>
                  ) : null}
                </>
              );
              return (
                <motion.div
                  key={`${section.label}-${item.title}`}
                  initial={
                    shouldReduceMotion ? undefined : { opacity: 0, y: 32 }
                  }
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
                  {hasHref ? (
                    <a
                      href={item.href as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block border border-neutral-200 p-4 transition-colors hover:border-neutral-950"
                    >
                      {cardContent}
                    </a>
                  ) : (
                    <div className="border border-neutral-200 p-4">
                      {cardContent}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          {/* <motion.div
            className="space-y-2 w-full sm:w-[140px]"
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
                whileInView={
                  shouldReduceMotion ? undefined : { scaleX: 1 }
                }
                viewport={inView}
                transition={{ duration: 1, ease }}
              />
              <p className="font-geist-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400">
                {section.label}
              </p>
            </div>
            <p className="text-xs leading-5 text-neutral-400">
              {section.hint}
            </p>
          </motion.div> */}
        </div>
      ))}
    </section>
  );
}
