"use client";

import { parseAsString, useQueryState } from "nuqs";
import { ReactNode, useMemo } from "react";
import { BlogMetadata } from "@/types/blog";
import { cn } from "@/lib/utils";

export function BlogList({
  allPosts,
}: {
  allPosts: { post: BlogMetadata; value: ReactNode }[];
}) {
  const [categoryQuery] = useQueryState("category", parseAsString);

  const filteredPosts = useMemo(() => {
    if (!categoryQuery) return allPosts;
    return allPosts.filter((post) => post.post.category === categoryQuery);
  }, [allPosts, categoryQuery]);

  return (
    <div className="space-y-4">
      {filteredPosts.map((post, index) => (
        <div
          key={post.post.slug}
          className={cn(
            index < filteredPosts.length - 1 &&
              "md:hover:border-transparent border-b transition-colors duration-300 border-[#252525]"
          )}
        >
          {post.value}
        </div>
      ))}
    </div>
  );
}
