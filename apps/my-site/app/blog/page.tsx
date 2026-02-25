import { getAllBlogPosts } from "@/lib/blog";
import { format } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import authorImg from "@/assets/author.svg";
import Image from "next/image";
import CategoryTabs from "@/components/blog/category-tabs";
import { BlogList } from "@/components/blog/blog-list";
import { BlogMetadata } from "@/types/blog";
import pinnedIcon from "@/assets/pinned.png";
export const metadata: Metadata = {
  title: "Blog - WORLD3",
  description:
    "Explore the latest product updates, industry insights, and technical articles from WORLD3.",
  openGraph: {
    title: "Blog - WORLD3",
    description:
      "Explore the latest product updates, industry insights, and technical articles from WORLD3.",
    type: "website",
  },
};

// 强制静态生成
export const dynamic = "force-static";

export default function Home() {
  const posts = getAllBlogPosts();
  return (
    <div className="max-w-[1264px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="mt-10 md:-mt-6">
        <div className="flex flex-col items-start">
          {/* Caption Tag */}
          <div
            className="p-px rounded-full"
            style={{
              background: "linear-gradient(to bottom, #3b3b3b, #262626)",
            }}
          >
            <div className="h-6 md:h-8 px-2 flex items-center justify-center gap-1 rounded-full bg-[#262626]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.9987 13.1896V2.20001C13.9987 1.64773 13.551 1.20001 12.9987 1.20001H3C2.44772 1.20001 2 1.64773 2 2.20001V13.1896C2 13.9575 2.82948 14.4388 3.49614 14.0579L4.50354 13.4822C4.81097 13.3065 5.18838 13.3065 5.49581 13.4822L7.50321 14.6293C7.81064 14.805 8.18806 14.805 8.49549 14.6293L10.5029 13.4822C10.8103 13.3065 11.1877 13.3065 11.4952 13.4822L12.5026 14.0579C13.1692 14.4388 13.9987 13.9575 13.9987 13.1896Z"
                  fill="url(#paint0_linear_890_3600)"
                />
                <path
                  d="M5.42578 4.62811H10.5681"
                  stroke="#222222"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M5.42578 9.77045H10.5681"
                  stroke="#222222"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M5.42578 7.19928H10.5681"
                  stroke="#222222"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_890_3600"
                    x1="7.99935"
                    y1="1.20001"
                    x2="7.99935"
                    y2="14.9128"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="white" />
                    <stop offset="1" stopColor="#D4D4D4" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="font-normal text-sm md:text-base uppercase bg-linear-to-b from-white to-[#d4d4d4] bg-clip-text text-transparent">
                BUILDING THE FUTURE OF AI + WEB3
              </span>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="font-display mt-2 font-semibold text-[36px] md:text-[52px] bg-linear-to-b from-white to-[#d4d4d4] bg-clip-text text-transparent whitespace-pre-wrap">
            WORLD3 Blog
          </h1>

          <Link
            href={posts[0].source || `/blog/${posts[0].slug}`}
            target={posts[0].source ? "_blank" : undefined}
            rel={posts[0].source ? "noopener noreferrer" : undefined}
            className="w-full relative mb-6 mt-10"
          >
            <div className="w-full rounded-[24px] p-2 flex flex-wrap md:items-start gap-x-[3.378%] gap-y-4 bg-[#151515] transition-colors hover:bg-[#1e1e1e]">
              <div
                className="w-full lg:w-[49.66%] rounded-[16px] aspect-588/320 bg-top bg-cover bg-no-repeat"
                style={{
                  backgroundImage: `url(${posts[0].cover})`,
                }}
              ></div>
              <div className="lg:pt-[15px] flex-1 max-lg:px-2 max-lg:pb-10">
                <div className="flex text-sm items-center justify-between pr-0 lg:pr-4">
                  <span className="text-[#9780ff]">
                    <span className="capitalize">{posts[0].category}</span> news
                  </span>
                  {posts[0].pinned && <Image src={pinnedIcon} alt="pinned" width={86} height={28} />}
                </div>
                <h2 className="mt-1 line-clamp-2 mb-2 lg:mb-4 font-display text-[22px] lg:text-[28px] font-medium lg:pr-6 text-[#E6E6E6]">
                  {posts[0].title}
                </h2>
                <p className="text-sm lg:text-base line-clamp-3 text-[#a3a3a3] lg:pr-6">
                  {posts[0].description}
                </p>
                <time
                  dateTime={posts[0].date}
                  className="text-[#737373] block text-sm mt-3"
                >
                  {format(new Date(posts[0].date), "MMM dd, yyyy")}
                </time>
              </div>
            </div>
            <div className="absolute right-6 bottom-4 lg:bottom-[22px] flex gap-2 items-center text-base lg:text-lg text-[#d4d4d4]">
              Explore
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.5 12.5L12.5 7.5L7.5 2.5"
                  stroke="#D4D4D4"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2.5 12.5L7.5 7.5L2.5 2.5"
                  stroke="#D4D4D4"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.slice(1, 4).map((post) => {
            const linkProps = post.source
              ? { href: post.source, target: "_blank", rel: "noopener noreferrer" }
              : { href: `/blog/${post.slug}` };

            return (
              <Link {...linkProps} key={post.slug}>
                <div className="p-2 relative h-full pb-4 rounded-[24px] bg-[#171717] transition-colors duration-200 hover:bg-[#1e1e1e]">
                  <div
                    className="aspect-796/448 rounded-[16px] bg-top bg-cover bg-no-repeat"
                    style={{
                      backgroundImage: `url(${post.cover})`,
                    }}
                  ></div>
                  <div className="px-2">
                    <div className="my-2 flex items-center justify-between text-sm">
                      <span className="text-[#9780ff]">
                        <span className="capitalize">{post.category}</span> news
                      </span>
                      {post.pinned && <Image src={pinnedIcon} alt="pinned" width={86} height={28} />}
                    </div>
                    <h2 className="mb-2 text-xl font-display font-medium">
                      {post.title}
                    </h2>
                    <p className="line-clamp-3 mb-12 text-sm text-[#a3a3a3]">
                      {post.description}
                    </p>
                    <div className="absolute bottom-4 inset-x-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Image
                          src={authorImg}
                          alt="author"
                          width={36}
                          height={36}
                        />
                        <span>{post.author}</span>
                      </div>
                      <time
                        dateTime={post.date}
                        className="text-sm text-[#737373] leading-[18px]"
                      >
                        {format(new Date(post.date), "MMM dd, yyyy")}
                      </time>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <CategoryTabs
          categories={Array.from(
            new Set(posts.slice(4).map((post) => post.category))
          )}
        />

        <BlogList
          allPosts={posts.slice(4).map((post) => ({
            post,
            value: <BlogItem post={post} />,
          }))}
        />
      </div>
    </div>
  );
}

function BlogItem({ post }: { post: BlogMetadata }) {
  const linkProps = post.source
    ? { href: post.source, target: "_blank", rel: "noopener noreferrer" }
    : { href: `/blog/${post.slug}` };

  return (
    <Link {...linkProps}>
      <div className="p-4 gap-y-2 flex flex-wrap md:hover:bg-[#171717] transition-colors rounded-[16px] duration-300">
        <div className="flex flex-row items-center lg:flex-col gap-4 lg:items-end">
          <time dateTime={post.date} className="text-sm text-[#737373]">
            {format(new Date(post.date), "MMM dd, yyyy")}
          </time>
          <div className="flex items-center gap-2">
            <Image src={authorImg} alt="author" width={32} height={32} />
            <span>{post.author}</span>
          </div>
        </div>
        <div className="lg:flex-1 lg:pl-[3.68%] lg:-translate-y-0.5 lg:pr-[6.43%] min-w-[300px]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#9780ff]">
              <span className="capitalize">{post.category}</span> news
            </span>
          </div>
          <h2 className="mt-[6px] line-clamp-2 mb-4 font-display font-medium text-2xl text-[#E6E6E6]">
            {post.title}
          </h2>
          <p className="line-clamp-3 text-sm text-[#a3a3a3]">
            {post.description}
          </p>
        </div>

        <div
          className="w-full lg:w-[295px] aspect-295/166 rounded-[16px] shadow bg-top bg-cover bg-no-repeat"
          style={{ backgroundImage: `url(${post.cover})` }}
        ></div>
      </div>
    </Link>
  );
}
