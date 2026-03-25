"use client";

import { motion, useReducedMotion } from "motion/react";
import { homeEase, homeInView } from "../home-motion";
import { contactLinks } from "../home-data";

export function HomeContactSection() {
  const shouldReduceMotion = useReducedMotion();
  const ease = homeEase;
  const inView = homeInView;

  return (
    <section className="relative z-10 border-x border-b border-dashed border-neutral-200/80 px-6 pb-10 pt-8 sm:px-8 sm:pb-12">
      <motion.div
        className="flex items-center justify-center gap-6 sm:gap-8"
        initial={
          shouldReduceMotion ? undefined : { opacity: 0, y: 28, scale: 0.985 }
        }
        whileInView={
          shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }
        }
        viewport={inView}
        transition={{ duration: 0.85, ease }}
      >
        {contactLinks.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target={item.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={
              item.href.startsWith("mailto:")
                ? undefined
                : "noopener noreferrer"
            }
            aria-label={item.label}
            title={item.label}
            className="inline-flex text-neutral-500 transition-colors hover:text-neutral-950"
          >
            <item.icon className="h-4 w-4" />
          </a>
        ))}
      </motion.div>
    </section>
  );
}
