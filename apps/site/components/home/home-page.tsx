"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const profileStats = [
  ["Role", "Frontend engineer / builder"],
  ["Base", "Hexi Space"],
  ["Focus", "Next.js, Cloudflare, UI systems"],
];

const timelineSections = [
  {
    label: "Education",
    hint: "Replace with your real school and degree details.",
    items: [
      {
        period: "Add years",
        title: "School / Degree",
        description:
          "Use this slot for your university, major, degree level, and anything worth keeping on the front page.",
      },
    ],
  },
  {
    label: "Work",
    hint: "Current repo does not include verifiable employer history.",
    items: [
      {
        period: "Now",
        title: "Frontend engineering",
        description:
          "Working on product interfaces, interaction detail, and engineering quality across Next.js, Cloudflare, and local-first workflows.",
      },
      {
        period: "Recent",
        title: "Personal platform building",
        description:
          "Building and iterating on Hexi Space as a writing, experimentation, and distribution surface for technical work.",
      },
    ],
  },
];

const openSourceProjects = [
  {
    title: "Hexi Space",
    meta: "Personal site / writing platform",
    description:
      "A minimal, light-mode personal site with blog, agent, profile, auth, and broadcast features built around a narrow and readable interface.",
    href: "/blog",
    action: "Explore site",
  },
  {
    title: "lark-quote-converter",
    meta: "Open source utility",
    description:
      "A converter for Lark/Feishu quote content. Mentioned in the blog as one of the projects already published under your GitHub account.",
    href: "https://github.com/Hexi1997/lark-quote-converter",
    action: "View repo",
  },
  {
    title: "Frontend writing",
    meta: "Technical articles",
    description:
      "Posts covering Better Auth on Cloudflare Workers, countdown design, Zustand internals, skeleton rendering, and UI customization.",
    href: "/blog",
    action: "Read posts",
  },
];

export function HomePage() {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-hero-kicker]", {
        opacity: 0,
        y: 16,
        duration: 0.7,
        ease: "power2.out",
      });

      gsap.from("[data-hero-title]", {
        opacity: 0,
        y: 28,
        duration: 0.9,
        delay: 0.08,
        ease: "power3.out",
      });

      gsap.from("[data-hero-copy]", {
        opacity: 0,
        y: 18,
        duration: 0.8,
        delay: 0.16,
        ease: "power2.out",
      });

      gsap.from("[data-hero-actions]", {
        opacity: 0,
        y: 18,
        duration: 0.8,
        delay: 0.24,
        ease: "power2.out",
      });

      gsap.from("[data-hero-avatar]", {
        opacity: 0,
        x: 24,
        duration: 1,
        delay: 0.1,
        ease: "power3.out",
      });

      const pageScroll = {
        trigger: page,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.35,
      } as const;

      gsap.fromTo(
        "[data-hero-foreground]",
        { y: 0 },
        {
          y: -88,
          ease: "none",
          scrollTrigger: pageScroll,
        },
      );

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((node, index) => {
        gsap.from(node, {
          opacity: 0,
          y: 28,
          scale: 0.985,
          duration: 0.85,
          delay: index * 0.04,
          ease: "power3.out",
          scrollTrigger: {
            trigger: node,
            start: "top 84%",
            toggleActions: "play none none none",
          },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-scroll-accent]").forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          },
        );
      });

      ScrollTrigger.batch("[data-timeline-card]", {
        start: "top 88%",
        once: true,
        onEnter: (batch) => {
          gsap.from(batch, {
            opacity: 0,
            y: 32,
            duration: 0.75,
            stagger: 0.1,
            ease: "power3.out",
          });
        },
      });

      ScrollTrigger.batch("[data-project-card]", {
        start: "top 90%",
        once: true,
        onEnter: (batch) => {
          gsap.from(batch, {
            opacity: 0,
            x: -18,
            duration: 0.7,
            stagger: 0.12,
            ease: "power3.out",
          });
        },
      });
    }, page);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <div
        ref={pageRef}
        className="relative mx-auto min-h-[calc(100vh-3.5rem)] max-w-[734px] px-0"
      >
        <div className="relative z-10 min-h-[calc(100vh-3.5rem)] bg-white">
      <section className="relative overflow-hidden border-x border-dashed border-neutral-200/80 px-6 pb-14 pt-24 sm:px-8 sm:pb-20 sm:pt-30">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white via-white/92 to-transparent" />

        <div data-hero-foreground className="relative z-10 space-y-8 will-change-transform">
          <div className="space-y-4">
            <p
              data-hero-kicker
              className="font-geist-mono text-[11px] uppercase tracking-[0.28em] text-neutral-500"
            >
              Hexi / Personal Site
            </p>
            <div className="flex items-center gap-4 sm:gap-10">
              <h1
                data-hero-title
                className="flex-1 text-[44px] leading-[1.1] font-medium tracking-[-0.06em] text-neutral-950 sm:text-7xl"
              >
                Frontend engineer, builder, writer.
              </h1>
              <div
                data-hero-avatar
                className="w-36 shrink-0 will-change-transform sm:w-48"
              >
                <Image
                  src="/author.png"
                  alt="Hexi avatar"
                  width={160}
                  height={213}
                  className="w-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>

          <p
            data-hero-copy
            className="text-[15px] leading-7 text-neutral-600 sm:text-base"
          >
            This page should read like a compact personal index: who you are, what you work on,
            what you have built, and where people can continue reading. I only filled in the
            parts already supported by the repository and left explicit placeholders where your
            private background is still missing.
          </p>

          <div data-hero-actions className="flex flex-wrap items-center gap-3">
            <Link
              href="/blog"
              className="inline-flex items-center rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Read writing
            </Link>
            <Link
              href="https://github.com/Hexi1997"
              className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-950"
            >
              GitHub
            </Link>
          </div>

          <div
            data-reveal
            className="grid gap-3 border border-neutral-200 bg-neutral-50/80 p-4 backdrop-blur-sm sm:grid-cols-3"
          >
            {profileStats.map(([label, value]) => (
              <div key={label} className="space-y-2">
                <p className="font-geist-mono text-[11px] uppercase tracking-[0.24em] text-neutral-400">
                  {label}
                </p>
                <p className="text-sm leading-6 text-neutral-700">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 space-y-10 border-x border-dashed border-neutral-200/80 px-6 py-14 sm:px-8 sm:py-18">
        <div
          data-scroll-accent
          className="h-px w-full max-w-[120px] bg-gradient-to-r from-neutral-300 to-transparent"
          aria-hidden
        />
        {timelineSections.map((section) => (
          <div key={section.label} className="grid gap-5 sm:grid-cols-[140px_1fr]">
            <div data-reveal className="space-y-2">
              <p className="font-geist-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400">
                {section.label}
              </p>
              <p className="text-xs leading-5 text-neutral-400">{section.hint}</p>
            </div>

            <div className="space-y-4">
              {section.items.map((item) => (
                <div
                  key={`${section.label}-${item.title}`}
                  data-timeline-card
                  className="border border-neutral-200 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                    <h2 className="text-base font-medium text-neutral-950">{item.title}</h2>
                    <p className="font-geist-mono text-[11px] uppercase tracking-[0.24em] text-neutral-400">
                      {item.period}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="relative z-10 space-y-8 border-x border-dashed border-neutral-200/80 px-6 py-14 sm:px-8 sm:py-18">
        <div className="space-y-3">
          <div
            data-scroll-accent
            className="h-px w-full max-w-[120px] bg-gradient-to-r from-neutral-300 to-transparent"
            aria-hidden
          />
          <div data-reveal className="space-y-2">
            <p className="font-geist-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400">
              Open Source
            </p>
            <h2 className="text-2xl font-medium tracking-[-0.04em] text-neutral-950">
              Projects and public work already visible in this repo.
            </h2>
          </div>
        </div>

        <div className="grid gap-3">
          {openSourceProjects.map((project) => (
            <Link
              key={project.title}
              href={project.href}
              data-project-card
              className="group border border-neutral-200 p-4 transition-colors hover:border-neutral-950"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="text-base font-medium text-neutral-950">{project.title}</h3>
                <p className="font-geist-mono text-[11px] uppercase tracking-[0.24em] text-neutral-400">
                  {project.meta}
                </p>
              </div>
              <p className="mt-3 text-sm leading-7 text-neutral-600">{project.description}</p>
              <p className="mt-4 font-geist-mono text-[11px] uppercase tracking-[0.24em] text-neutral-400 transition-colors group-hover:text-neutral-950">
                {project.action}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative z-10 border-x border-b border-dashed border-neutral-200/80 px-6 pb-20 pt-10 sm:px-8 sm:pb-28">
        <div
          data-reveal
          className="grid gap-6 border border-neutral-200 bg-white p-5 shadow-[0_8px_30px_-24px_rgba(0,0,0,0.24)] sm:grid-cols-[1fr_220px]"
        >
          <div className="space-y-3">
            <p className="font-geist-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400">
              Notes
            </p>
            <p className="text-sm leading-7 text-neutral-600">
              Education and employer history still need your real content. The structure is ready,
              but those details should come from you directly rather than from guessed text.
            </p>
          </div>

          <div className="space-y-1 font-geist-mono text-[12px] text-neutral-500">
            <p>layout: 734px</p>
            <p>theme: light only</p>
            <p>motion: gsap</p>
            <p>content: personal index</p>
          </div>
        </div>
      </section>
        </div>
    </div>
    </>
  );
}
