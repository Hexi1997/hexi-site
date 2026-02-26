import { getAllBlogPosts } from "@/lib/blog";
import type { Metadata } from "next";
import { BlogList } from "@/components/blog/blog-list";

export const metadata: Metadata = {
  title: "BLOG - HEXI SPACE",
  description:
    "Explore the latest product updates, industry insights, and technical articles from HEXI SPACE.",
  openGraph: {
    title: "BLOG - HEXI SPACE",
    description:
      "Explore the latest product updates, industry insights, and technical articles from HEXI SPACE.",
    type: "website",
  },
};

export const dynamic = "force-static";

export default function BlogPage() {
  const posts = getAllBlogPosts();
  return (
    <div className="max-w-[732px] mx-auto px-4 py-16">
      <BlogList posts={posts} />
    </div>
  );
}
