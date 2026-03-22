"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const profileStats = [
  ["Birth", "1996-04"],
  ["Base", "Nanjing, China"],
  ["Email", "niudieyi1996@gmail.com"],
];

const timelineSections = [
  {
    label: "Education",
    hint: "Golden memories of university life",
    items: [
      {
        period: "2014-2018",
        title: "安徽大学（ 211 院校 ）/ 本科",
        description:
          "我的本专业是 <strong>地理信息科学</strong>（地理和计算机的交叉学科），学习过程中发现自己对编程更感兴趣，于是辅修了 <strong>软件工程第二学位</strong>。",
      },
    ],
  },
  {
    label: "Experience",
    hint: "Hard work pays off, but don't forget to enjoy the journey",
    items: [
      {
        period: "2021-2025",
        title: "南京纯白矩阵科技有限公司",
        description:
          "<strong>高级前端工程师</strong>，带领 3-5 人团队参与公司产品 ( <a href='https://chainide.com/' class='underline' target='_blank' rel='noopener noreferrer'>ChainIDE</a>、<a href='https://world3.ai/' class='underline' target='_blank' rel='noopener noreferrer'>WORLD3</a> 等 ) 的开发，主要负责产品的前端架构设计、技术选型、进度管理、代码质量控制等。",
      },
      {
        period: "2018-2020",
        title: "武汉中地数码科技有限公司",
        description:
          "<strong>前端工程师</strong>，负责不动产登记后台管理系统和「衡悦登」APP 开发。",
      },
    ],
  },
];

const staticPages = [
  {
    title: "EthRiyadh",
    link: "https://2023.ethriyadh.com/meta-to-global",
    desc: "ETH Riyadh 是一个专注于以太坊的知名 Web3 峰会，旨在汇聚来自沙特阿拉伯利雅得及中东其他地区的开发者与建设者。大会聚焦以太坊生态系统，致力于分享行业专家的前沿见解，并围绕区块链的未来展开深入探讨。",
  },
  {
    title: "DuraBlade",
    link: "https://durablade-frontend.pages.dev/home",
    desc: "DuraBlade 产品官网，展示产品功能和特点。",
  },
  {
    title: "Mining-Lesson",
    link: "https://mining-process-illustration-vite-dev.whitematrix.workers.dev/",
    desc: "Mining-Lesson 是区块链实训平台的一个交互课程，通过动画展示比特币挖矿的过程。",
  },
  {
    title: "MoveCastle",
    link: "https://movecastle.info/",
    desc: "MoveCastle 产品官网，MoveCastle 是一个教育平台，将学习体验游戏化，帮助开发者掌握 Sui 上的 Move 编程语言",
  },
  {
    title: "NFT-Builder-Competition",
    link: "https://nftbuildcompetition.chainide.com",
    desc: "NFT-Builder-Competition 是 ChainIDE 举办的一个 NFT 构建比赛，旨在鼓励开发者使用 ChainIDE 构建 NFT 项目。",
  },
];

const workProjects = [
  {
    title: "WORLD3（ 2023 - 2025 ）",
    meta: "Nextjs · Tailwind · Zustand",
    description: (
      <ul className="list-disc list-inside">
        <li>
          一个去中心化的 AI Agent
          平台，帮助用户创建并部署智能体，实现任务自动化。
        </li>
        <li>注册用户 60w+，日活用户 2w+，已部署Agent 9.2w+。</li>
        <li>作为项目负责人主导前端从 0 到 1 的搭建。</li>
      </ul>
    ),
    href: "https://world3.ai/",
    action: "Visit site",
  },
  {
    title: "ChainIDE（ 2021 - 2023 ）",
    meta: "Redux · Rxjs · Monaco Editor · FluentUI",
    description: (
      <ul className="list-disc list-inside">
        <li>
          面向区块链开发者的云端 IDE，支持 Solidity
          等多链智能合约的在线编写、编译、部署与调试。
        </li>
        <li>注册用户 2w+，已编译合约 800w+。</li>
        <li>
          主要负责官网开发、Coding
          Assistant接入、模板管理、项目导入、统计模块接入等。
        </li>
      </ul>
    ),
    href: "https://chainide.com/",
    action: "Visit site",
  },
  {
    title: "Phanta Bear NFT ( 2021 - 2022)",
    meta: "Gatsby",
    description: (
      <ul className="list-disc list-inside">
        <li>
          基于以太坊发行的头像类 NFT 项目，由周杰伦潮牌 PHANTACi 和 Matrix Labs
          联合打造。
        </li>
        <li>
          Phanta Bear 上线以后，全系列 1 万枚 NFT 仅用 40
          分钟售罄，总成交额破千万美元。
        </li>
        <li>主要负责官网开发、钱包接入、Mint 功能开发。</li>
      </ul>
    ),
    href: "https://ezek.io",
    action: "Visit site",
  },
  {
    title: "其他项目",
    description: (
      <ul className="list-disc list-inside">
        <li>
          <a
            href="https://edu.chainide.com/"
            target="_blank"
            className="underline"
          >
            ChainIDE Education
          </a>
          ： 一个面向开发者的 Web3
          教育平台，提供区块链课程，帮助用户快速入门并提升智能合约开发能力。负责课程模块开发、Code
          Playground 接入等。
        </li>
        <li>
          <a
            href="https://x.com/0xMatrixMarket/status/1552926959390273537"
            target="_blank"
            className="underline"
          >
            Matrix Market
          </a>
          ： Flow 链上首个面向创作者、收藏者和交易者的全方位 NFT
          市场。作为项目负责人，主导产品前端从 0 到 1 的搭建。
        </li>
        <li>
          <a href="https://playdice.ink" target="_blank" className="underline">
            Dice Inscription
          </a>
          ： 铭文游戏平台，负责官网动效优化、
          <a
            href="https://inscription-combination-preview.pages.dev/"
            target="_blank"
            className="underline"
          >
            棋盘预览页面
          </a>
          开发、2048 游戏接入等。
        </li>
        <li>
          <a
            href="https://volunteer-service-platform-prod.whitematrix.workers.dev/"
            target="_blank"
            className="underline"
          >
            绿发会志愿者管理平台
          </a>
          ： H5 项目，主要负责前端开发框架搭建（React + Vite + Antd Mobile +
          postcss-pxtorem) 和部分功能开发。
        </li>
        <li>
          活动页：
          {staticPages.map((page, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <a href={page.link} target="_blank">
                  <span className="underline">{page.title}</span>
                </a>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-wrap text-start bg-background text-foreground border border-border shadow-sm">
                {page.desc}
              </TooltipContent>
              {index !== staticPages.length - 1 ? "、" : ""}
            </Tooltip>
          ))}{" "}
          等。
        </li>
      </ul>
    ),
    href: "#",
    action: "",
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

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
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

      gsap.utils
        .toArray<HTMLElement>("[data-reveal]")
        .forEach((node, index) => {
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

      ScrollTrigger.batch("[data-work-card]", {
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

            <div
              data-hero-foreground
              className="relative z-10 space-y-8 will-change-transform"
            >
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
                    Nodejs engineer, builder, writer.
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
              </p>

              <div
                data-hero-actions
                className="flex flex-wrap items-center gap-3"
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
                    <p className="text-sm leading-6 text-neutral-700">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="relative z-10 space-y-10 border-x border-dashed border-neutral-200/80 px-6 py-14 sm:px-8 sm:py-18 sm:pt-12">
            {/* <div
          data-scroll-accent
          className="h-px w-full max-w-[120px] bg-gradient-to-r from-neutral-300 to-transparent"
          aria-hidden
        /> */}
            {timelineSections.map((section) => (
              <div
                key={section.label}
                className="grid gap-5 sm:grid-cols-[140px_1fr]"
              >
                <div data-reveal className="space-y-2">
                  <div className="w-fit space-y-3">
                    <div
                      data-scroll-accent
                      className="h-px w-full mb-3 max-w-[120px] bg-gradient-to-r from-neutral-300 to-transparent"
                      aria-hidden
                    />
                    <p className="font-geist-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400">
                      {section.label}
                    </p>
                  </div>
                  <p className="text-xs leading-5 text-neutral-400">
                    {section.hint}
                  </p>
                </div>
                <div className="space-y-4">
                  {section.items.map((item) => (
                    <div
                      key={`${section.label}-${item.title}`}
                      data-timeline-card
                      className="border border-neutral-200 p-4"
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
                      ></p>
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
                className="h-px w-full max-w-[240px] bg-gradient-to-r from-neutral-300 to-transparent"
                aria-hidden
              />
              <div data-reveal className="space-y-2">
                <p className="font-geist-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400">
                  Products built at work
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {workProjects.map((project) => {
                const isExternal = project.href.startsWith("http");
                const isPlaceholder = project.href === "#";
                const CardContent = (
                  <>
                    <div className="flex flex-col gap-0.5 sm:gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <h3 className="text-base font-medium text-neutral-950">
                        {project.title}
                      </h3>
                      <p className="font-geist-mono text-[10px] max-sm:mt-2 tracking-[0.08em] sm:text-[11px] uppercase sm:tracking-[0.12em] text-neutral-400">
                        {project.meta}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-neutral-600">
                      {project.description}
                    </p>
                    <p className="mt-4 font-geist-mono text-[11px] uppercase tracking-[0.24em] text-neutral-400 transition-colors group-hover:text-neutral-950">
                      {project.action}
                    </p>
                  </>
                );
                return isPlaceholder ? (
                  <div
                    key={project.title}
                    data-work-card
                    className="group border border-neutral-200 p-4"
                  >
                    {CardContent}
                  </div>
                ) : (
                  <Link
                    key={project.title}
                    href={project.href}
                    data-work-card
                    {...(isExternal
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="group border border-neutral-200 p-4 transition-colors hover:border-neutral-950"
                  >
                    {CardContent}
                  </Link>
                );
              })}
            </div>
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
                    <h3 className="text-base font-medium text-neutral-950">
                      {project.title}
                    </h3>
                    <p className="font-geist-mono text-[11px] uppercase tracking-[0.24em] text-neutral-400">
                      {project.meta}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">
                    {project.description}
                  </p>
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
                  Education and employer history still need your real content.
                  The structure is ready, but those details should come from you
                  directly rather than from guessed text.
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
