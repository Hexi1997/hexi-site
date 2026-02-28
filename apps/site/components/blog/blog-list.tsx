"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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

const PAGE_SIZE = 10;

export function BlogList({ posts }: { posts: BlogMetadata[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query.trim()) return posts;
    const q = query.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [posts, query]);

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
      <div className="relative mb-6">
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
              <Link
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
              </Link>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 flex flex-col items-center gap-3">
        {query.trim() && filtered.length > 0 && (
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
