import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeExternalLinks from "rehype-external-links";
import rehypeKatex from "rehype-katex";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import type { BlogPost, BlogMetadata } from "@/types/blog";

const BLOG_DIRECTORY = path.join(process.cwd(), "posts");

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function convertImageTitleToCaption(contentHtml: string): string {
  return contentHtml.replace(
    /<img([^>]*?)\s+title="([^"]+)"([^>]*?)>/gi,
    (_match, before, title, after) => {
      const caption = escapeHtml(title.trim());
      const imgWithoutTitle = `<img${before}${after}>`;
      return `<figure>${imgWithoutTitle}<figcaption>${caption}</figcaption></figure>`;
    }
  );
}

/**
 * Extract the first image from markdown content.
 * @param content markdown content
 * @returns image path (relative path or https URL) or null
 */
function extractFirstImage(content: string): string | null {
  // Match markdown image syntax: ![alt](path)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/;
  const match = content.match(imageRegex);

  if (match && match[2]) {
    let imagePath = match[2].trim();

    // Return as-is for external URLs (http/https)
    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // If path starts with "/", strip the leading "/" for internal asset resolution
    if (imagePath.startsWith("/")) {
      imagePath = imagePath.substring(1);
    }

    return imagePath;
  }

  return null;
}

/**
 * Extract plain-text description from markdown.
 * @param content markdown content
 * @param maxLength max length, default 160 chars
 */
function extractPlainTextDescription(
  content: string,
  maxLength: number = 480
): string {
  // Remove frontmatter (if any remains)
  let text = content.replace(/^---[\s\S]*?---/, "").trim();

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/`[^`]+`/g, "");

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Remove markdown heading markers
  text = text.replace(/^#{1,6}\s+/gm, "");

  // Remove images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

  // Remove links but keep link text: [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove bold/italic markers
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");

  // Remove list markers
  text = text.replace(/^[\s]*[-*+]\s+/gm, "");
  text = text.replace(/^[\s]*\d+.\s+/gm, "");

  // Remove blockquote markers
  text = text.replace(/^>\s+/gm, "");

  // Remove emoji
  text = text.replace(/[\u{1F600}-\u{1F64F}]/gu, ""); // Emoticons
  text = text.replace(/[\u{1F300}-\u{1F5FF}]/gu, ""); // Symbols and pictographs
  text = text.replace(/[\u{1F680}-\u{1F6FF}]/gu, ""); // Transport and map symbols
  text = text.replace(/[\u{1F700}-\u{1F77F}]/gu, ""); // Alchemical symbols
  text = text.replace(/[\u{1F780}-\u{1F7FF}]/gu, ""); // Geometric Shapes Extended
  text = text.replace(/[\u{1F800}-\u{1F8FF}]/gu, ""); // Supplemental Arrows-C
  text = text.replace(/[\u{1F900}-\u{1F9FF}]/gu, ""); // Supplemental Symbols and Pictographs
  text = text.replace(/[\u{1FA00}-\u{1FA6F}]/gu, ""); // Symbols and Pictographs Extended-A (part)
  text = text.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ""); // Symbols and Pictographs Extended-A
  text = text.replace(/[\u{2600}-\u{26FF}]/gu, ""); // Misc symbols
  text = text.replace(/[\u{2700}-\u{27BF}]/gu, ""); // Dingbats
  text = text.replace(/[\u{FE00}-\u{FE0F}]/gu, ""); // Variation selectors
  text = text.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ""); // Flags

  // Remove extra whitespace
  text = text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();

  // Truncate to the target length
  if (text.length > maxLength) {
    text = text.substring(0, maxLength);
    // Cut at the last complete word or punctuation
    const lastSpace = text.lastIndexOf(" ");
    const lastPunctuation = Math.max(
      text.lastIndexOf("。"),
      text.lastIndexOf("，"),
      text.lastIndexOf("！"),
      text.lastIndexOf("？"),
      text.lastIndexOf("."),
      text.lastIndexOf(",")
    );

    if (lastPunctuation > maxLength * 0.8) {
      text = text.substring(0, lastPunctuation + 1);
    } else if (lastSpace > maxLength * 0.8) {
      text = text.substring(0, lastSpace);
    }
  }

  return text;
}

function normalizeTags(rawTags: unknown): string[] {
  if (!rawTags) return [];
  if (Array.isArray(rawTags)) {
    return rawTags
      .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
      .filter(Boolean);
  }
  if (typeof rawTags === "string") {
    return rawTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function isPinnedValue(value: unknown): boolean {
  return value === true;
}

/**
 * Get metadata for all blog posts (for list pages).
 */
export function getAllBlogPosts(): BlogMetadata[] {
  // Ensure the posts directory exists
  if (!fs.existsSync(BLOG_DIRECTORY)) {
    console.log("blogsDirectory not found", BLOG_DIRECTORY);
    return [];
  }

  const entries = fs.readdirSync(BLOG_DIRECTORY, { withFileTypes: true });
  const allPostsData = entries
    .filter((entry) => entry.isDirectory() && entry.name !== "images")
    .map((entry) => {
      const slug = entry.name;
      const indexPath = path.join(BLOG_DIRECTORY, slug, "index.md");

      // Skip if index.md does not exist
      if (!fs.existsSync(indexPath)) {
        return null;
      }

      // Read markdown file content
      const fileContents = fs.readFileSync(indexPath, "utf8");

      // Parse frontmatter with gray-matter
      const matterResult = matter(fileContents);

      // Resolve cover image: metadata > first image in content > default image
      let cover = matterResult.data.cover;

      // If cover is missing in metadata, try first image from content
      if (!cover) {
        cover = extractFirstImage(matterResult.content);
      }

      // Fallback to default image
      if (!cover) {
        cover = "/default-cover.png";
      }

      // Only transform relative paths (not absolute or external URLs)
      const isRelativePath =
        !cover.startsWith("/") && !cover.startsWith("http");
      if (isRelativePath) {
        const isDev = process.env.NODE_ENV === "development";
        const prefix = isDev ? "/api/blog-assets" : "/blog-assets";
        cover = `${prefix}/${slug}/${cover}`;
      }

      // Auto-extract description from content
      const description = extractPlainTextDescription(matterResult.content);

      // Pass through external source link (if present)
      const source = matterResult.data.source;
      const tags = normalizeTags(matterResult.data.tags);

      return {
        slug,
        title: matterResult.data.title,
        date: matterResult.data.date || new Date().toISOString(),
        pinned: isPinnedValue(matterResult.data.pinned),
        author: "WORLD3",
        description,
        cover,
        source,
        tags,
      };
    })
    .filter((post) => post !== null) as BlogMetadata[];

  // Sort by date descending
  const sortedPosts = allPostsData.sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });

  return sortedPosts;
}

/**
 * Get all blog slugs (used by generateStaticParams).
 */
export function getAllBlogSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIRECTORY)) {
    return [];
  }

  const entries = fs.readdirSync(BLOG_DIRECTORY, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name !== "images")
    .filter((entry) => {
      const indexPath = path.join(BLOG_DIRECTORY, entry.name, "index.md");
      return fs.existsSync(indexPath);
    })
    .map((entry) => entry.name);
}

/**
 * Get full blog content by slug.
 */
export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  try {
    const indexPath = path.join(BLOG_DIRECTORY, slug, "index.md");
    const fileContents = fs.readFileSync(indexPath, "utf8");

    // Parse frontmatter with gray-matter
    const matterResult = matter(fileContents);

    // Convert markdown to HTML with remark/rehype pipeline
    const processedContent = await remark()
      .use(remarkGfm) // GitHub Flavored Markdown support
      .use(remarkMath) // LaTeX support ($...$ / $$...$$)
      .use(remarkRehype, { allowDangerousHtml: true }) // Convert to rehype (HTML AST)
      .use(rehypeKatex, {
        throwOnError: false,
        strict: false,
      })
      .use(rehypeExternalLinks, {
        target: "_blank",
        rel: ["noopener", "noreferrer"],
      })
      .use(rehypeShiki, {
        theme: "github-light",
      })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(matterResult.content);

    let contentHtml = processedContent.toString();

    // Convert markdown image titles into visible captions:
    // ![alt](url "caption") -> <figure><img ... /><figcaption>caption</figcaption></figure>
    contentHtml = convertImageTitleToCaption(contentHtml);

    // Convert relative image paths in markdown content to absolute paths
    // In development use API routes, in production use static files
    const isDev = process.env.NODE_ENV === "development";
    const prefix = isDev ? "/api/blog-assets" : "/blog-assets";
    contentHtml = contentHtml.replace(
      /src="(?!http|\/)(.*?)"/g,
      `src="${prefix}/${slug}/$1"`
    );

    // Add data-photo-src to each image for client-side photo preview
    // This lets the client read image sources directly without reparsing HTML
    contentHtml = contentHtml.replace(
      /<img([^>]*?)src="([^"]+)"([^>]*?)>/gi,
      (match, before, src, after) => {
        // Skip if data-photo-src already exists
        if (match.includes("data-photo-src")) return match;
        return `<img${before}src="${src}"${after} data-photo-src="${src}">`;
      }
    );

    // Resolve cover image: metadata > first image in content > default image
    let cover = matterResult.data.cover;

    // If cover is missing in metadata, try first image from content
    if (!cover) {
      cover = extractFirstImage(matterResult.content);
    }

    // Fallback to default image
    if (!cover) {
      cover = "/default-cover.png";
    }

    // Only transform relative paths (not absolute or external URLs)
    const isRelativePath = !cover.startsWith("/") && !cover.startsWith("http");
    if (isRelativePath) {
      const isDev = process.env.NODE_ENV === "development";
      const prefix = isDev ? "/api/blog-assets" : "/blog-assets";
      cover = `${prefix}/${slug}/${cover}`;
    }

    // Auto-extract description from content
    const description = extractPlainTextDescription(matterResult.content);

    // Pass through external source link (if present)
    const source = matterResult.data.source;
    const tags = normalizeTags(matterResult.data.tags);

    return {
      slug,
      title: matterResult.data.title || "Untitled",
      date: matterResult.data.date || new Date().toISOString(),
      pinned: isPinnedValue(matterResult.data.pinned),
      author: "WORLD3",
      description,
      cover,
      content: contentHtml,
      source,
      tags,
    };
  } catch (error) {
    console.error(`Error loading blog post: ${slug}`, error);
    return null;
  }
}
