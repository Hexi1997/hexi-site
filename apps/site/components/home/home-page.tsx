"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import type { IconType } from "react-icons";
import { FaGithub, FaXTwitter } from "react-icons/fa6";
import { MdOutlineEmail } from "react-icons/md";
import { SiXiaohongshu } from "react-icons/si";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Marquee } from "@/components/ui/marquee";

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
            className="underline text-neutral-700 font-medium"
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
            className="underline text-neutral-700 font-medium"
          >
            Matrix Market
          </a>
          ： Flow 链上首个面向创作者、收藏者和交易者的全方位 NFT
          市场。作为项目负责人，主导产品前端从 0 到 1 的搭建。
        </li>
        <li>
          <a
            href="https://playdice.ink"
            target="_blank"
            className="underline text-neutral-700 font-medium"
          >
            Dice Inscription
          </a>
          ： 铭文游戏平台，负责官网动效优化、
          <a
            href="https://inscription-combination-preview.pages.dev/"
            target="_blank"
            className="underline text-neutral-700 font-medium"
          >
            棋盘预览页面
          </a>
          开发、2048 游戏接入等。
        </li>
        <li>
          <a
            href="https://volunteer-service-platform-prod.whitematrix.workers.dev/"
            target="_blank"
            className="underline text-neutral-700 font-medium"
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
              <TooltipContent
                side="bottom"
                sideOffset={6}
                className="max-w-[200px] text-wrap text-start bg-background text-foreground border border-border shadow-sm"
              >
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

type TechItem = {
  name: string;
  path: string;
};

const techStack: TechItem[] = [
  { name: "React", path: "/tech-stacks/react.svg" },
  { name: "Node.js", path: "/tech-stacks/nodedotjs.svg" },
  { name: "TypeScript", path: "/tech-stacks/typescript.svg" },
  { name: "Next.js", path: "/tech-stacks/nextdotjs.svg" },
  { name: "TailwindCSS", path: "/tech-stacks/tailwindcss.svg" },
  { name: "Vite", path: "/tech-stacks/vite.svg" },
  { name: "React Query", path: "/tech-stacks/reactquery.svg" },
  { name: "Axios", path: "/tech-stacks/axios.svg" },
  { name: "Zustand", path: "/tech-stacks/zustand.png" },
  { name: "Cloudflare", path: "/tech-stacks/cloudflare.svg" },
  { name: "Shadcn/UI", path: "/tech-stacks/shadcnui.svg" },
  { name: "GSAP", path: "/tech-stacks/gsap.svg" },
  { name: "Motion", path: "/tech-stacks/motion.svg" },
  { name: "Pnpm", path: "/tech-stacks/pnpm.svg" },
];

const openSourceCommitItems = [
  {
    name: "MagicUI",
    repoUrl: "https://github.com/magicuidesign/magicui",
    changes: [
      {
        text: "新增圆弧时间线组件",
        prUrl: "https://github.com/magicuidesign/magicui/pull/739",
        prNumber: "#739",
      },
      {
        text: "修复按钮内容溢出问题",
        prUrl: "https://github.com/magicuidesign/magicui/pull/746",
        prNumber: "#746",
      },
      {
        text: "修复深色模式下按钮文本可见性问题",
        prUrl: "https://github.com/magicuidesign/magicui/pull/772",
        prNumber: "#772",
      },
    ],
  },
  {
    name: "CC-Switch",
    repoUrl: "https://github.com/farion1231/cc-switch",
    changes: [
      {
        text: "修复快速点击按钮导致重复添加 Provider 问题",
        prUrl: "https://github.com/farion1231/cc-switch/pull/1352",
        prNumber: "#1352",
      },
    ],
  },
  {
    name: "Ant Design",
    repoUrl: "https://github.com/ant-design",
    changes: [
      {
        text: "支持切换代码拉取源",
        prUrl: "https://github.com/ant-design/ant-design-pro-cli/pull/114",
        prNumber: "#114",
      },
      {
        text: "修复 @types/react 版本不匹配问题",
        prUrl: "https://github.com/ant-design/ant-design-pro/pull/10478",
        prNumber: "#10478",
      },
      {
        text: "更新约定式路由参数描述",
        prUrl: "https://github.com/ant-design/ant-design-pro/pull/10404",
        prNumber: "#10404",
      },
      {
        text: "移除 query-filter 中不必要的字段定义",
        prUrl: "https://github.com/ant-design/pro-components/pull/6517",
        prNumber: "#6517",
      },
    ],
  },
  {
    name: "next-export-i18n",
    repoUrl: "https://github.com/martinkr/next-export-i18n",
    changes: [
      {
        text: "新增 LinkWithLocale 组件",
        prUrl: "https://github.com/martinkr/next-export-i18n/pull/52",
        prNumber: "#52",
      },
    ],
  },
  {
    name: "swagger-axios-codegen",
    repoUrl: "https://github.com/Manweill/swagger-axios-codegen",
    changes: [
      {
        text: "支持 URL 模糊匹配",
        prUrl: "https://github.com/Manweill/swagger-axios-codegen/pull/195",
        prNumber: "#195",
      },
    ],
  },
];

const openSourceSections = [
  {
    label: "Projects",
    hint: "Open source products",
    items: [
      {
        period: "",
        title: "Blogit",
        action: "Visit site",
        href: "https://github.com/Hexi1997/Blogit",
        description: (
          <ul className="list-disc list-inside">
            <li>
              Git 驱动的本地优先博客系统，文章即 Markdown 文件，发布即 Git
              Push，<strong>百分百拥有数据自主权</strong>。
            </li>
            <li>基于 SSG 静态生成，默认内置 SEO。</li>
            <li>
              图片资源随仓库一起托管，无第三方图床依赖，整套系统可
              Fork、可迁移、可复现。
            </li>
          </ul>
        ),
      },
      {
        period: "",
        title: "Twinflare",
        action: "Visit site",
        href: "https://github.com/Hexi1997/twinflare",
        description: (
          <ul className="list-disc list-inside">
            <li>
              Cloudflare-native 个人 AI 数字分身平台，将 Markdown 知识文档放入
              GitHub 仓库，push 后自动向量化并部署。
            </li>
            <li>
              采用 RAG 架构：向量检索（bge-m3）+ Rerank
              精排（bge-reranker-base）+ LLM 生成回答。
            </li>
            <li>
              以 API 形式对外提供服务，支持聊天、语义检索、Persona
              查询等接口，可无缝接入{" "}
              <a
                href="https://github.com/vercel/ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-neutral-700 font-medium"
              >
                Vercel AI SDK
              </a>
              。
            </li>
          </ul>
        ),
      },
      {
        period: "",
        title: "HEXI SPACE",
        action: "Visit site",
        href: "https://github.com/Hexi1997/hexi-site",
        description: (
          <ul className="list-disc list-inside">
            <p className="mb-1">
              一个 Node.js 全栈个人网站，包含用户系统、Agent 聊天、Space
              动态广场、博客等模块，主要特点如下：
            </p>
            <li>
              基于{" "}
              <a
                href="https://better-auth.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-neutral-700 font-medium"
              >
                Better Auth
              </a>{" "}
              实现 GitHub + Google + 邮箱登录。
            </li>
            <li>
              基于{" "}
              <a
                href="https://sdk.vercel.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-neutral-700 font-medium"
              >
                Vercel AI SDK
              </a>{" "}
              接入流式响应（SSE），结合{" "}
              <a
                href="https://github.com/vercel/streamdown"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-neutral-700 font-medium"
              >
                Streamdown
              </a>{" "}
              实现 Agent 聊天的打字机效果。
            </li>
            <li>
              Space 模块仿 Twitter Timeline 交互设计，帖子中的 URL 自动抓取 OG
              元数据并渲染为预览卡片。发帖时图片上传至 Cloudflare
              R2，图片上传接口做了<strong>滑动窗口限流</strong>处理。
            </li>
            <li>
              以 Drizzle Schema 为<strong>唯一数据模型来源</strong>：drizzle-zod
              从表定义自动派生 Zod Schema 用于请求校验与响应序列化；API 层将
              Hono app 的路由类型导出为 <code>AppType</code>，通过{" "}
              <code>@workspace/api-rpc</code> workspace 包共享给前端，前端用{" "}
              <code>hc&lt;AppType&gt;</code> 实例化类型安全的 RPC
              客户端，请求参数与响应结构均由编译器推断，杜绝接口字段不一致问题。
            </li>
          </ul>
        ),
      },
    ],
  },
  {
    label: "Contributions",
    hint: "Open source commits",
    items: [
      {
        period: "",
        title: "Commits",
        description: (
          <ul className="list-disc list-inside">
            {openSourceCommitItems.map((item) => (
              <li key={item.name}>
                <a
                  href={item.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-neutral-700 font-medium"
                >
                  {item.name}
                </a>
                :{" "}
                {item.changes.map((change, index) => (
                  <span key={change.prUrl}>
                    {index > 0 ? "、" : ""}
                    {change.text}{" "}
                    <a
                      href={change.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {change.prNumber}
                    </a>
                  </span>
                ))}
                。
              </li>
            ))}
          </ul>
        ),
      },
    ],
  },
];

const contactLinks = [
  {
    label: "Twitter",
    href: "https://x.com/Hexi1997",
    icon: FaXTwitter,
  },
  {
    label: "GitHub",
    href: "https://github.com/Hexi1997",
    icon: FaGithub,
  },
  {
    label: "Email",
    href: "mailto:niudieyi1996@gmail.com",
    icon: MdOutlineEmail,
  },
  {
    label: "小红书",
    href: "https://www.xiaohongshu.com/",
    icon: SiXiaohongshu,
  },
] satisfies { label: string; href: string; icon: IconType }[];

function TechChip({ tech }: { tech: TechItem }) {
  return (
    <div className="group flex shrink-0 items-center gap-2 border border-neutral-200 px-3.5 py-2 transition-colors hover:border-neutral-400">
      <img
        src={tech.path}
        alt={tech.name}
        className="opacity-50 h-4 w-auto group-hover:opacity-100 transition-opacity"
      />
      <span className="font-geist-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500 whitespace-nowrap transition-colors group-hover:text-neutral-700">
        {tech.name}
      </span>
    </div>
  );
}

export function HomePage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: pageRef,
    offset: ["start start", "end end"],
  });
  const heroForegroundY = useTransform(scrollYProgress, [0, 1], [0, -88]);
  const inView = { once: true, amount: 0.2 } as const;
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <>
      <div
        ref={pageRef}
        className="relative mx-auto min-h-[calc(100vh-3.5rem)] max-w-[734px] px-0"
      >
        <div className="relative z-10 min-h-[calc(100vh-3.5rem)] bg-white">
          <section className="relative overflow-hidden border-x border-dashed border-neutral-200/80 px-6 pb-14 pt-24 sm:px-8 sm:pb-20 sm:pt-30">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white via-white/92 to-transparent" />

            <motion.div
              className="relative z-10 space-y-8 will-change-transform"
              style={shouldReduceMotion ? undefined : { y: heroForegroundY }}
            >
              <div className="space-y-4">
                <motion.p
                  className="font-geist-mono text-[11px] uppercase tracking-[0.28em] text-neutral-500"
                  initial={
                    shouldReduceMotion ? undefined : { opacity: 0, y: 16 }
                  }
                  animate={
                    shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
                  }
                  transition={{ duration: 0.7, ease }}
                >
                  Hexi / Personal Site
                </motion.p>
                <div className="flex items-center gap-4 sm:gap-10">
                  <motion.h1
                    className="flex-1 text-[44px] leading-[1.1] font-medium tracking-[-0.06em] text-neutral-950 sm:text-7xl"
                    initial={
                      shouldReduceMotion ? undefined : { opacity: 0, y: 28 }
                    }
                    animate={
                      shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
                    }
                    transition={{ duration: 0.9, delay: 0.08, ease }}
                  >
                    Nodejs engineer, builder, writer.
                  </motion.h1>
                  <motion.div
                    className="w-36 shrink-0 will-change-transform sm:w-48"
                    initial={
                      shouldReduceMotion ? undefined : { opacity: 0, x: 24 }
                    }
                    animate={
                      shouldReduceMotion ? undefined : { opacity: 1, x: 0 }
                    }
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
                  shouldReduceMotion
                    ? undefined
                    : { opacity: 1, y: 0, scale: 1 }
                }
                viewport={inView}
                transition={{ duration: 0.85, ease }}
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
              </motion.div>
            </motion.div>
          </section>

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
                  <TechChip key={tech.name} tech={tech} />
                ))}
              </Marquee>
            </div>
          </section>

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
                </motion.div>
                <div className="space-y-4">
                  {section.items.map((item, index) => (
                    <motion.div
                      key={`${section.label}-${item.title}`}
                      className="border border-neutral-200 p-4"
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
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </section>

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
                  shouldReduceMotion
                    ? undefined
                    : { opacity: 1, y: 0, scale: 1 }
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
                  <motion.div
                    key={project.title}
                    className="group border border-neutral-200 p-4"
                    initial={
                      shouldReduceMotion ? undefined : { opacity: 0, x: -18 }
                    }
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
                    initial={
                      shouldReduceMotion ? undefined : { opacity: 0, x: -18 }
                    }
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
                  shouldReduceMotion
                    ? undefined
                    : { opacity: 1, y: 0, scale: 1 }
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

          <section className="relative z-10 border-x border-b border-dashed border-neutral-200/80 px-6 pb-10 pt-8 sm:px-8 sm:pb-12">
            <motion.div
              className="flex items-center justify-center gap-6 sm:gap-8"
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
        </div>
      </div>
    </>
  );
}
