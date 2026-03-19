import type { Metadata } from "next";
import { BlogList } from "@/components/blog/blog-list";
import { getAllBlogPosts } from "@/lib/blog";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Articles, notes, and tutorials about building, writing, and shipping.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog",
    description:
      "Articles, notes, and tutorials about building, writing, and shipping.",
    url: "/blog",
    type: "website",
    images: [
      {
        url: "/default-cover.png",
      },
    ],
  },
  twitter: {
    title: "Blog",
    description:
      "Articles, notes, and tutorials about building, writing, and shipping.",
    card: "summary_large_image",
    images: ["/default-cover.png"],
  },
};

export default function BlogListPage() {
  const posts = getAllBlogPosts();

  return (
    <div className="mx-auto max-w-[640px] py-8">
      {/* <section className="mb-8">
        <TypewriterSlogan text="A Git-powered, local-first blogging system" />
        <p className="mt-2 text-sm text-neutral-500">
          Content as code, writing as commit, publishing as push, cloneable and forkable, with no platform lock-in, SEO optimized by default with SSG, and a visual Markdown block editor.
        </p>
      </section> */}
      <BlogList posts={posts} />
    </div>
  );
}
