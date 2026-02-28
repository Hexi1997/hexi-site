import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPostBySlug, getAllBlogSlugs } from "@/lib/blog";
import { format } from "date-fns";
import type { Metadata } from "next";
import { BlogPhotoViewEnhancer } from "@/components/blog/photo-view-enhancer";
import { BlogImageSkeleton } from "@/components/blog/image-skeleton";
import { BlogCodeCopyEnhancer } from "@/components/blog/code-copy-enhancer";
import { ShareButtons } from "@/components/blog/share-buttons";
import { GiscusComments } from "@/components/blog/giscus-comments";
import { ArrowLeft } from "lucide-react";

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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

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
    title: `${post.title} | Hexi Blog`,
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const postUrl = `${baseUrl}/blog/${slug}`;

  return (
    <article className="mx-auto mt-10 max-w-[732px] px-4 pb-12">
      <div className="flex justify-between items-center mb-3">
        <Link href="/blog" className="text-sm text-neutral-400 flex items-center hover:text-neutral-900">
          <ArrowLeft className="h-4" />
          Back
        </Link>
      </div>
      {/* Title */}
      <h1 className="text-neutral-900 mb-3 text-[26px] font-bold">
        {post.title}
      </h1>

      <div className="flex gap-4 flex-wrap items-center justify-between">
        <div className="flex items-center gap-2">
          <time dateTime={post.date} className="text-sm text-neutral-400">
            {format(new Date(post.date), "yyyy-MM-dd")}
          </time>
        </div>
        <ShareButtons url={postUrl} title={post.title} />

      </div>

      {/* Blog Content */}
      <div
        id={`blog-content-${post.slug}`}
        className="prose mt-6 max-w-none prose-headings:font-semibold
            prose-img:rounded-2xl prose-img:shadow-lg prose-img:w-full
            prose-pre:bg-[#f9f9f8]! prose-pre:font-geist-mono!
            [&_:not(pre)>code]:bg-[#ececec]! [&_:not(pre)>code]:font-geist-mono!
            prose-pre:p-0 [&_pre.shiki]:p-4 [&_pre.shiki]:rounded-lg [&_pre.shiki]:overflow-x-auto
            [&_:not(pre)>code]:before:content-[''] [&_:not(pre)>code]:after:content-['']
            [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded-[4px]"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {post.source && (
        <div className="mt-10 text-sm text-neutral-400">
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
      <BlogPhotoViewEnhancer containerId={`blog-content-${post.slug}`} />
      {/* 客户端组件：为图片添加 skeleton 加载效果 */}
      <BlogImageSkeleton containerId={`blog-content-${post.slug}`} />
      {/* 客户端组件：为代码块添加复制按钮 */}
      <BlogCodeCopyEnhancer containerId={`blog-content-${post.slug}`} />

      {/* 评论区 */}
      <GiscusComments />
    </article>
  );
}
