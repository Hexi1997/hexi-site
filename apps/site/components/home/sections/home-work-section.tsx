"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { homeEase, homeInView } from "../home-motion";
import { workProjects } from "../home-data";

export function HomeWorkSection() {
  const shouldReduceMotion = useReducedMotion();
  const ease = homeEase;
  const inView = homeInView;

  return (
    <section className="relative z-10 space-y-8 border-x border-dashed border-neutral-200/80 px-6 py-14 sm:px-8 sm:py-18">
      <div className="space-y-3">
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
            Products built at work
          </p>
        </motion.div>
      </div>

      <div className="grid gap-3">
        {workProjects.map((project, index) => {
          const isExternal = project.href.startsWith("http");
          const isPlaceholder = project.href === "#";
          const CardContent = (
            <>
              <div className="flex flex-col gap-0.5 sm:gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="text-base font-medium text-neutral-950">
                  {project.title}
                </h3>
                <p className="font-geist-mono text-[10px] max-sm:mt-2 tracking-[0.08em] sm:text-[11px] uppercase sm:tracking-[0.12em] text-neutral-400">
                  {"meta" in project ? project.meta : undefined}
                </p>
              </div>
              <div className="mt-3 text-sm leading-7 text-neutral-600">
                {project.description}
              </div>
              <p className="mt-4 font-geist-mono text-[11px] uppercase tracking-[0.24em] text-neutral-400 transition-colors group-hover:text-neutral-950">
                {project.action}
              </p>
            </>
          );
          return isPlaceholder ? (
            <motion.div
              key={project.title}
              className="group border border-neutral-200 p-4"
              initial={shouldReduceMotion ? undefined : { opacity: 0, x: -18 }}
              whileInView={
                shouldReduceMotion ? undefined : { opacity: 1, x: 0 }
              }
              viewport={inView}
              transition={{
                duration: 0.7,
                delay: shouldReduceMotion ? 0 : index * 0.12,
                ease,
              }}
            >
              {CardContent}
            </motion.div>
          ) : (
            <motion.div
              key={project.title}
              initial={shouldReduceMotion ? undefined : { opacity: 0, x: -18 }}
              whileInView={
                shouldReduceMotion ? undefined : { opacity: 1, x: 0 }
              }
              viewport={inView}
              transition={{
                duration: 0.7,
                delay: shouldReduceMotion ? 0 : index * 0.12,
                ease,
              }}
            >
              <Link
                href={project.href}
                {...(isExternal
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group block border border-neutral-200 p-4 transition-colors hover:border-neutral-950"
              >
                {CardContent}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
