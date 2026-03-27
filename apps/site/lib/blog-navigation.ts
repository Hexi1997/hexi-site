export const BLOG_LIST_RETURN_HREF_STORAGE_KEY = "blog-list-return-href";

export function isBlogListHref(href: string) {
  return href === "/blog" || href.startsWith("/blog?");
}
