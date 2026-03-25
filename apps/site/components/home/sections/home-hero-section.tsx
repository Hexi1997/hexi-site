"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type MotionValue } from "motion/react";
import { homeEase, homeInView } from "../home-motion";
import { profileStats } from "../home-data";

export function HomeHeroSection({
  heroForegroundY,
}: {
  heroForegroundY: MotionValue<number>;
}) {
  const shouldReduceMotion = useReducedMotion();
  const ease = homeEase;
  const inView = homeInView;

  return (
    <section className="relative overflow-hidden border-x border-dashed border-neutral-200/80 px-6 pb-14 pt-24 sm:px-8 sm:pb-20 sm:pt-30">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white via-white/92 to-transparent" />

      <motion.div
        className="relative z-10 space-y-8 will-change-transform"
        style={shouldReduceMotion ? undefined : { y: heroForegroundY }}
      >
        <div className="space-y-4">
          <motion.p
            className="font-geist-mono text-[11px] uppercase tracking-[0.28em] text-neutral-500"
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
          >
            Hexi / Personal Site
          </motion.p>
          <div className="flex items-center gap-4 sm:gap-10">
            <motion.h1
              className="flex-1 text-[44px] leading-[1.1] font-medium tracking-[-0.06em] text-neutral-950 sm:text-7xl"
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 28 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.08, ease }}
            >
              Nodejs engineer, builder, writer.
            </motion.h1>
            <motion.div
              className="w-36 shrink-0 will-change-transform sm:w-48"
              initial={shouldReduceMotion ? undefined : { opacity: 0, x: 24 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.1, ease }}
            >
              <Image
                src="/author.png"
                alt="Hexi avatar"
                width={160}
                height={213}
                className="w-full object-cover"
                priority
              />
            </motion.div>
          </div>
        </div>

        <motion.p
          className="text-[15px] leading-7 text-neutral-600 sm:text-base"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.16, ease }}
        >
          你好，我是 <strong>HEXI</strong>， 一名拥有 5 年经验的 Node.js
          Full-Stack Engineer (Frontend-focused)，熟悉前端工程化、SEO
          优化、性能优化、代码规范等。
          <br />
          <br />
          工作中我认真负责，追求设计稿的高度还原和网站动效优化，喜欢探索新技术。工作之外我积极拥抱开源，为一些知名项目贡献过代码，也喜欢构建自己的产品（
          <a
            href="https://blogit-blog.2437951611.workers.dev/"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Blogit
          </a>
          、
          <a
            href="https://github.com/Hexi1997/twinflare"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Twinflare
          </a>{" "}
          等）。
          <br />
          <br />
          我积极拥抱 AI，能够熟练使用 Cursor、Codex 和 Claude Code 进行
          Vibe Coding 并控制输出代码的质量，构建稳定的产品。
          <strong>
            我在寻求新的工作，如果你有合适的机会，欢迎联系我。
          </strong>
        </motion.p>

        <motion.div
          className="flex flex-wrap items-center gap-3"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.24, ease }}
        >
          <Link
            href="/agent"
            className="inline-flex items-center rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Agent
          </Link>
          <Link
            href="https://github.com/Hexi1997"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-950"
          >
            GitHub
          </Link>
        </motion.div>

        <motion.div
          className="grid gap-3 border border-neutral-200 bg-neutral-50/80 p-4 backdrop-blur-sm sm:grid-cols-3"
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
          {profileStats.map(([label, value]) => (
            <div key={label} className="space-y-2">
              <p className="font-geist-mono text-[11px] uppercase tracking-[0.24em] text-neutral-400">
                {label}
              </p>
              <p className="text-sm leading-6 text-neutral-700">{value}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
