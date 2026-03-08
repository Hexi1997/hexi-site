"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { BlogMetadata } from "@/types/blog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 5;

export function BlogList({ posts }: { posts: BlogMetadata[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>(() => {
    return searchParams.get("tag")?.trim() || "all";
  });
  const [page, setPage] = useState(1);

  const allTags = useMemo(() => {
    return Array.from(new Set(posts.flatMap((post) => post.tags || []))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return posts.filter((p) => {
      const matchesQuery =
        !q.trim() ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.tags || []).some((tag) => tag.toLowerCase().includes(q));
      const matchesTag = selectedTag === "all" || (p.tags || []).includes(selectedTag);
      return matchesQuery && matchesTag;
    });
  }, [posts, query, selectedTag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(1);
  };

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams.toString());
    if (tag === "all") {
      nextParams.delete("tag");
    } else {
      nextParams.set("tag", tag);
    }
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div>
      {/* Search box */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M10.5 10.5L13.5 13.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Search"
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500/20 text-sm transition-all"
          />
        </div>
        {allTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleTagChange("all")}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                selectedTag === "all"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagChange(tag)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  selectedTag === tag
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-gray-200">
        {paginated.length === 0 ? (
          <p className="py-16 text-center text-gray-500 text-sm">No posts found.</p>
        ) : (
          paginated.map((post) => {
            const linkProps = post.source
              ? { href: post.source, target: "_blank", rel: "noopener noreferrer" }
              : { href: `/blog/${post.slug}` };

            return (
              <a
                key={post.slug}
                {...linkProps}
                className="block py-5 -mx-3 px-3 rounded-lg group hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-display font-semibold text-[17px] leading-snug text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <time
                    dateTime={post.date}
                    className="text-xs text-gray-400 shrink-0 mt-1 tabular-nums whitespace-nowrap"
                  >
                    {format(new Date(post.date), "yyyy-MM-dd")}
                  </time>
                </div>
                <p className="mt-1.5 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {post.description}
                </p>
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                    {post.tags.map((tag) => (
                      <span
                        key={`${post.slug}-${tag}`}
                        className="text-xs text-gray-500"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 flex flex-col items-center gap-3">
        {(query.trim() || selectedTag !== "all") && filtered.length > 0 && (
          <p className="text-sm text-gray-500">
            {filtered.length} post{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>

              {pageNumbers.map((p, i) => (
                <PaginationItem key={p === "..." ? `ellipsis-${i}` : p}>
                  {p === "..." ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      isActive={p === currentPage}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
