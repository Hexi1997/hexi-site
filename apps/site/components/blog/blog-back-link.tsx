"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  BLOG_LIST_RETURN_HREF_STORAGE_KEY,
  isBlogListHref,
} from "@/lib/blog-navigation";

export function BlogBackLink() {
  const router = useRouter();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const savedHref = sessionStorage.getItem(BLOG_LIST_RETURN_HREF_STORAGE_KEY);

    if (savedHref && isBlogListHref(savedHref)) {
      router.push(savedHref);
      return;
    }

    router.push("/blog");
  };

  return (
    <Link
      href="/blog"
      onClick={handleClick}
      className="text-sm text-neutral-400 flex items-center hover:text-neutral-900"
    >
      <ArrowLeft className="mr-0 size-[18px]" />
      Back
    </Link>
  );
}
