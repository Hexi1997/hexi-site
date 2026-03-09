import { notFound } from "next/navigation";
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

// Generate static params (SSG)
export async function generateStaticParams() {
  const slugs = getAllBlogSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

// Generate dynamic metadata (SEO)
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

  // Get base URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  // Ensure image URL is absolute
  // If already absolute (http/https), keep it
  // If relative, convert to absolute URL
  let imageUrl = post.cover;
  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    // Ensure leading slash
    if (!imageUrl.startsWith("/")) {
      imageUrl = `/${imageUrl}`;
    }
    // Build full absolute URL
    imageUrl = `${baseUrl}${imageUrl}`;
  }

  // In production, ensure dev API route is not used
  if (process.env.NODE_ENV === "production") {
    imageUrl = imageUrl.replace("/api/blog-assets", "/blog-assets");
  }

  return {
    title: `${post.title}`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
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

  // Build full post URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const postUrl = `${baseUrl}/blog/${slug}`;

  return (
    <article className="mx-auto mt-10 max-w-[732px] px-4 pb-12">
      <div className="flex justify-between items-center mb-3">
        <a href="/" className="text-sm text-neutral-400 flex items-center hover:text-neutral-900">
          <ArrowLeft className="mr-0 size-[18px]" />
          Back
        </a>
      </div>
      {/* Title */}
      <h1 className="text-neutral-900 mb-3 text-[26px] font-bold">
        {post.title}
      </h1>

      <div className="flex gap-4 flex-wrap items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <time dateTime={post.date} className="text-sm text-neutral-400">
            {format(new Date(post.date), "yyyy-MM-dd")}
          </time>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {post.tags.map((tag) => (
                <a
                  key={`${post.slug}-${tag}`}
                  href={`/?tag=${encodeURIComponent(tag)}`}
                  className="text-xs text-neutral-500"
                >
                  #{tag}
                </a>
              ))}
            </div>
          )}
        </div>
        <ShareButtons url={postUrl} title={post.title} />

      </div>

      {/* Blog Content */}
      <div
        id={`blog-content-${post.slug}`}
        className="prose mt-6 max-w-none prose-headings:font-semibold
            prose-img:rounded-2xl prose-img:shadow-lg prose-img:w-full
            prose-figcaption:text-center
            prose-figcaption:mt-[-24px]
            prose-pre:bg-[#f9f9f8]! prose-pre:font-geist-mono!
            [&_:not(pre)>code]:bg-[#ececec]! [&_:not(pre)>code]:font-geist-mono!
            [&_pre.shiki]:p-4 [&_pre.shiki]:rounded-lg [&_pre.shiki]:overflow-x-auto
            [&_table]:border-collapse [&_table]:border [&_table]:border-neutral-300 dark:[&_table]:border-neutral-700
            [&_th]:border [&_th]:border-neutral-300 dark:[&_th]:border-neutral-700 [&_th]:text-left [&_th]:px-3
            [&_td]:border [&_td]:border-neutral-300 dark:[&_td]:border-neutral-700 [&_td]:text-left [&_td]:px-3
            [&_thead_th]:pt-2!
            [&_thead>tr:first-child>th]:bg-gray-100 dark:[&_thead>tr:first-child>th]:bg-gray-800
            [&_table:not(:has(thead))>tbody>tr:first-child>td]:bg-gray-100 dark:[&_table:not(:has(thead))>tbody>tr:first-child>td]:bg-gray-800
            [&_:not(pre)>code]:before:content-[''] [&_:not(pre)>code]:after:content-['']
            [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded-[4px]"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {post.source && (
        <div className="mt-10 text-sm text-neutral-400">
          Source:{" "}
          <a
            href={post.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            {post.source}
          </a>
        </div>
      )}
      {/* Client-only: add image preview interactions after hydration */}
      <BlogPhotoViewEnhancer containerId={`blog-content-${post.slug}`} />
      {/* Client-only: add skeleton loading for images */}
      <BlogImageSkeleton containerId={`blog-content-${post.slug}`} />
      {/* Client-only: add copy buttons for code blocks */}
      <BlogCodeCopyEnhancer containerId={`blog-content-${post.slug}`} />

      {/* Comment section */}
      <GiscusComments />
    </article>
  );
}
