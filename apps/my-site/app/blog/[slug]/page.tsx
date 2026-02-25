import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getBlogPostBySlug, getAllBlogSlugs } from "@/lib/blog";
import { format } from "date-fns";
import type { Metadata } from "next";
import authorImg from "@/assets/author.svg";
import { BlogPhotoViewEnhancer } from "@/components/blog/photo-view-enhancer";
import { BlogImageSkeleton } from "@/components/blog/image-skeleton";
import { ShareButtons } from "@/components/blog/share-buttons";
import pinnedImg from "@/assets/pinned.png";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// 生成静态参数（SSG）
export async function generateStaticParams() {
  const slugs = getAllBlogSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

// 生成动态 Metadata（SEO）
export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Blog Not Found",
    };
  }

  // 获取基础 URL
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "";

  // 确保图片 URL 是完整的绝对 URL
  // 如果已经是完整的 URL（http/https），直接使用
  // 如果是相对路径，需要转换为绝对 URL
  let imageUrl = post.cover;
  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    // 确保路径以 / 开头
    if (!imageUrl.startsWith("/")) {
      imageUrl = `/${imageUrl}`;
    }
    // 构建完整的绝对 URL
    imageUrl = `${baseUrl}${imageUrl}`;
  }

  // 在生产环境中，确保不使用开发环境的 API 路由
  if (process.env.NODE_ENV === "production") {
    imageUrl = imageUrl.replace("/api/blog-assets", "/blog-assets");
  }

  return {
    title: `${post.title} | WORLD3 Blogs`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: ["WORLD3"],
      images: [
        {
          url: imageUrl,
          alt: post.title,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // 构建完整的文章 URL
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "";
  const postUrl = `${baseUrl}/blog/${slug}`;

  return (
    <article className="mx-auto max-md:mt-10 max-w-[712px] sm:max-w-[728px] lg:max-w-[860px] px-4 sm:px-6 lg:px-8 pb-12">
      {/* return button */}
      <Link href="/">
        <div className="transition-colors text-sm cursor-pointer gap-2 w-fit mb-7 text-[#a3a3a3] hover:text-white flex items-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          WORLD3 Blog
        </div>
      </Link>

      {/* Title */}
      <h1 className="text-[#E6E6E6] mb-3 text-[26px] font-semibold">
        {post.title}
      </h1>

      {/* author */}
      <div className="flex gap-4 flex-wrap items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src={authorImg} alt="author" width={44} height={44} />
          <div>
            <p className="text-sm">{post.author}</p>
            <time dateTime={post.date} className="text-sm text-[#737373]">
              {format(new Date(post.date), "MMMM dd, yyyy")}
            </time>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.pinned && <Image src={pinnedImg} alt="pinned" width={86} height={28} />}
          <ShareButtons url={postUrl} title={post.title} />
        </div>
      </div>

      {/* Blog Content */}
      <div
        id={`blog-content-${post.slug}`}
        className="prose prose-headings:mb-4 leading-snug mt-6 prose-invert max-w-none
            prose-headings:font-display
            prose-a:text-blue-400 prose-a:wrap-anywhere prose-a:no-underline prose-a:hover:underline
            prose-img:rounded-2xl prose-img:shadow-lg prose-img:w-full"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {post.source && (
        <div className="mt-10 text-sm text-[#a3a3a3]">
          Source:{" "}
          <Link
            href={post.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            {post.source}
          </Link>
        </div>
      )}
      {/* 客户端组件：在客户端挂载后为图片添加预览功能 */}
      <BlogPhotoViewEnhancer
        containerId={`blog-content-${post.slug}`}
      />
      {/* 客户端组件：为图片添加 skeleton 加载效果 */}
      <BlogImageSkeleton
        containerId={`blog-content-${post.slug}`}
      />
    </article>
  );
}
