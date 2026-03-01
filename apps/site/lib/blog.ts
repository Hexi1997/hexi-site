import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeExternalLinks from "rehype-external-links";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import type { BlogPost, BlogMetadata } from "@/types/blog";

const BLOG_DIRECTORY = path.join(process.cwd(), "posts");

/**
 * 从 markdown 内容中提取第一张图片
 * @param content markdown 内容
 * @returns 图片路径（可以是相对路径或 https URL）或 null
 */
function extractFirstImage(content: string): string | null {
  // 匹配 markdown 图片语法：![alt](path)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/;
  const match = content.match(imageRegex);

  if (match && match[2]) {
    let imagePath = match[2].trim();

    // 如果是外部 URL（http/https），直接返回
    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // 如果是以 / 开头的路径，去掉开头的 /（在博客内部，/assets 应该指向博客文件夹内的 assets）
    if (imagePath.startsWith("/")) {
      imagePath = imagePath.substring(1);
    }

    return imagePath;
  }

  return null;
}

/**
 * 从 markdown 内容中提取纯文本描述
 * @param content markdown 内容
 * @param maxLength 最大长度，默认 160 字符
 */
function extractPlainTextDescription(
  content: string,
  maxLength: number = 480
): string {
  // 移除 frontmatter（如果有残留）
  let text = content.replace(/^---[\s\S]*?---/, "").trim();

  // 移除代码块
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/`[^`]+`/g, "");

  // 移除 HTML 标签
  text = text.replace(/<[^>]+>/g, "");

  // 移除 markdown 标题符号
  text = text.replace(/^#{1,6}\s+/gm, "");

  // 移除图片 ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

  // 移除链接，保留文本 [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 移除加粗和斜体标记
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");

  // 移除列表标记
  text = text.replace(/^[\s]*[-*+]\s+/gm, "");
  text = text.replace(/^[\s]*\d+.\s+/gm, "");

  // 移除引用标记
  text = text.replace(/^>\s+/gm, "");

  // 移除 emoji
  text = text.replace(/[\u{1F600}-\u{1F64F}]/gu, ""); // 表情符号
  text = text.replace(/[\u{1F300}-\u{1F5FF}]/gu, ""); // 符号和象形文字
  text = text.replace(/[\u{1F680}-\u{1F6FF}]/gu, ""); // 交通和地图符号
  text = text.replace(/[\u{1F700}-\u{1F77F}]/gu, ""); // 炼金术符号
  text = text.replace(/[\u{1F780}-\u{1F7FF}]/gu, ""); // 几何形状扩展
  text = text.replace(/[\u{1F800}-\u{1F8FF}]/gu, ""); // 补充箭头-C
  text = text.replace(/[\u{1F900}-\u{1F9FF}]/gu, ""); // 补充符号和象形文字
  text = text.replace(/[\u{1FA00}-\u{1FA6F}]/gu, ""); // 扩展-A
  text = text.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ""); // 符号和象形文字扩展-A
  text = text.replace(/[\u{2600}-\u{26FF}]/gu, ""); // 杂项符号
  text = text.replace(/[\u{2700}-\u{27BF}]/gu, ""); // 装饰符号
  text = text.replace(/[\u{FE00}-\u{FE0F}]/gu, ""); // 变体选择器
  text = text.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ""); // 旗帜（国旗）

  // 移除多余的空白字符
  text = text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();

  // 截取指定长度
  if (text.length > maxLength) {
    text = text.substring(0, maxLength);
    // 在最后一个完整单词或标点处截断
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

/**
 * 获取所有博客文章的元数据（用于列表页）
 */
export function getAllBlogPosts(): BlogMetadata[] {
  // 确保目录存在
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

      // 如果没有 index.md，跳过
      if (!fs.existsSync(indexPath)) {
        return null;
      }

      // 读取 markdown 文件内容
      const fileContents = fs.readFileSync(indexPath, "utf8");

      // 使用 gray-matter 解析 frontmatter
      const matterResult = matter(fileContents);

      // 处理 cover 图片：优先级为 metadata > 内容第一张图片 > 默认图片
      let cover = matterResult.data.cover;

      // 如果 metadata 中没有 cover，尝试从内容中提取第一张图片
      if (!cover) {
        cover = extractFirstImage(matterResult.content);
      }

      // 如果还是没有，使用默认图片
      if (!cover) {
        cover = "/default-og-image.webp";
      }

      // 只处理相对路径（不是绝对路径也不是外部 URL）
      const isRelativePath =
        !cover.startsWith("/") && !cover.startsWith("http");
      if (isRelativePath) {
        const isDev = process.env.NODE_ENV === "development";
        const prefix = isDev ? "/api/blog-assets" : "/blog-assets";
        cover = `${prefix}/${slug}/${cover}`;
      }

      // 自动从内容中提取 description
      const description = extractPlainTextDescription(matterResult.content);

      // 透传外部来源链接（如果有）
      const source = matterResult.data.source;

      return {
        slug,
        title: matterResult.data.title,
        date: matterResult.data.date || new Date().toISOString(),
        author: "WORLD3",
        description,
        cover,
        sortIndex: matterResult.data.sortIndex ?? 0,
        source,
      };
    })
    .filter((post) => post !== null) as BlogMetadata[];

  // 先按 sortIndex 降序排序（值越大越靠前），然后按日期降序排序
  const sortedPosts = allPostsData.sort((a, b) => {
    // 首先比较 sortIndex
    const sortIndexDiff = (b.sortIndex ?? 0) - (a.sortIndex ?? 0);
    if (sortIndexDiff !== 0) {
      return sortIndexDiff;
    }
    // sortIndex 相同时，按日期降序排序
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });

  // 给排序后的前四名添加 pinned 标记
  return sortedPosts.map((post, index) => ({
    ...post,
    pinned: index < 4,
  }));
}

/**
 * 获取所有博客的 slug（用于 generateStaticParams）
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
 * 根据 slug 获取博客文章完整内容
 */
export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  try {
    const indexPath = path.join(BLOG_DIRECTORY, slug, "index.md");
    const fileContents = fs.readFileSync(indexPath, "utf8");

    // 使用 gray-matter 解析 frontmatter
    const matterResult = matter(fileContents);

    // 使用 remark 将 markdown 转换为 HTML
    const processedContent = await remark()
      .use(remarkGfm) // 支持 GitHub Flavored Markdown
      .use(remarkRehype, { allowDangerousHtml: true }) // 转换为 rehype (HTML AST)
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

    // 将 Markdown 内容中的相对路径图片转换为绝对路径
    // 开发模式使用 API 路由，生产模式使用静态文件
    const isDev = process.env.NODE_ENV === "development";
    const prefix = isDev ? "/api/blog-assets" : "/blog-assets";
    contentHtml = contentHtml.replace(
      /src="(?!http|\/)(.*?)"/g,
      `src="${prefix}/${slug}/$1"`
    );

    // 为每个图片添加 data-photo-src 属性，用于客户端图片预览功能
    // 这样客户端可以直接通过 data 属性获取图片源，无需再次解析 HTML
    contentHtml = contentHtml.replace(
      /<img([^>]*?)src="([^"]+)"([^>]*?)>/gi,
      (match, before, src, after) => {
        // 如果已经有 data-photo-src，跳过
        if (match.includes("data-photo-src")) return match;
        return `<img${before}src="${src}"${after} data-photo-src="${src}">`;
      }
    );

    // 处理 cover 图片：优先级为 metadata > 内容第一张图片 > 默认图片
    let cover = matterResult.data.cover;

    // 如果 metadata 中没有 cover，尝试从内容中提取第一张图片
    if (!cover) {
      cover = extractFirstImage(matterResult.content);
    }

    // 如果还是没有，使用默认图片
    if (!cover) {
      cover = "/default-og-image.webp";
    }

    // 只处理相对路径（不是绝对路径也不是外部 URL）
    const isRelativePath = !cover.startsWith("/") && !cover.startsWith("http");
    if (isRelativePath) {
      const isDev = process.env.NODE_ENV === "development";
      const prefix = isDev ? "/api/blog-assets" : "/blog-assets";
      cover = `${prefix}/${slug}/${cover}`;
    }

    // 自动从内容中提取 description
    const description = extractPlainTextDescription(matterResult.content);

    // 透传外部来源链接（如果有）
    const source = matterResult.data.source;

    // 判断是否为置顶文章（需要获取所有文章并排序）
    const allPosts = getAllBlogPosts();
    const postIndex = allPosts.findIndex((post) => post.slug === slug);
    const pinned = postIndex !== -1 && postIndex < 4;

    return {
      slug,
      title: matterResult.data.title || "Untitled",
      date: matterResult.data.date || new Date().toISOString(),
      author: "WORLD3",
      description,
      cover,
      content: contentHtml,
      sortIndex: matterResult.data.sortIndex ?? 0,
      source,
      pinned,
    };
  } catch (error) {
    console.error(`Error loading blog post: ${slug}`, error);
    return null;
  }
}
