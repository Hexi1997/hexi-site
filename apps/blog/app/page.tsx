import { BlogList } from "@/components/blog/blog-list";
import { TypewriterSlogan } from "@/components/home/typewriter-slogan";
import { getAllBlogPosts } from "@/lib/blog";

export const dynamic = "force-static";

export default function Home() {
  const posts = getAllBlogPosts();

  return (
    <div className="mx-auto max-w-[732px]">
      <section className="mb-8">
        <TypewriterSlogan text="A Git-powered, local-first blogging system" />
        <p className="mt-2 text-sm text-neutral-500">
          Content as code, writing as commit, publishing as push, cloneable and forkable, with no platform lock-in, SEO optimized by default with SSG, and a visual Markdown block editor.
        </p>
      </section>
      <BlogList posts={posts} />
    </div>
  );
}
