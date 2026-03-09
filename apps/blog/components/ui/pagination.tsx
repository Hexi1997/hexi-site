import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & React.ComponentProps<"button">

function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <button
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 w-9",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
        "disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "border border-gray-200 bg-white text-gray-900 shadow-sm"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      aria-label="Go to previous page"
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-3 h-9 text-sm font-medium transition-colors",
        "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        "disabled:pointer-events-none disabled:opacity-30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
        className
      )}
      {...props}
    >
      <ChevronLeft className="size-4" />
      <span>Previous</span>
    </button>
  )
}

function PaginationNext({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      aria-label="Go to next page"
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-3 h-9 text-sm font-medium transition-colors",
        "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        "disabled:pointer-events-none disabled:opacity-30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
        className
      )}
      {...props}
    >
      <span>Next</span>
      <ChevronRight className="size-4" />
    </button>
  )
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn("flex size-9 items-center justify-center text-gray-400", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
