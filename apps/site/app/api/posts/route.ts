import { NextResponse } from "next/server";
import { getAllBlogSlugs, getBlogPostBySlug } from "@/lib/blog";

export const dynamic = "force-static";

export async function GET() {
  try {
    const slugs = getAllBlogSlugs();

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "";

    const posts = await Promise.all(
      slugs.map(async (slug) => {
        const post = await getBlogPostBySlug(slug);
        if (!post) return null;

        const coverIsAbsolute = post.cover.startsWith("http://") || post.cover.startsWith("https://");

        // 强制使用生产静态路径（/blog-assets），避免 /api/blog-assets
        const normalizedPath = post.cover.replace("/api/blog-assets", "/blog-assets");

        const normalizedCover = coverIsAbsolute
          ? normalizedPath
          : `${baseUrl}${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;

        return {
          ...post,
          cover: normalizedCover,
        };
      })
    );

    // 过滤掉 null（理论上不会出现）并按日期降序
    const filtered = posts
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    return NextResponse.json({ posts: filtered });
  } catch (error) {
    console.error("Failed to load posts", error);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}
