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
    <div className="mx-auto max-w-[734px] relative z-10 border-x border-dashed border-neutral-200/80 bg-white/70 backdrop-blur-md px-6 sm:px-8">
      <div className="max-w-[640px] mx-auto min-h-[calc(100vh-3.5rem)] py-8">
        <BlogList posts={posts} />
      </div>
    </div>
  );
}
