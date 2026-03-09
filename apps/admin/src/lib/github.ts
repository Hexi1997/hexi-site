import { Octokit } from "octokit";
import type { BlogFrontmatter, PostItem, PendingImage } from "@/types";
import { BLOG_REPO_CONFIG } from "./config";

interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
  sha?: string;
}

interface BlogIndexPost {
  slug: string;
  title: string;
  date: string;
  pinned?: boolean;
  tags?: string[];
  source?: string;
  cover?: string;
}

interface BlogIndexFile {
  count?: number;
  posts?: BlogIndexPost[];
}

function decodeBase64UTF8(base64: string): string {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeUTF8Base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}


const OWNER = BLOG_REPO_CONFIG.owner;
const REPO = BLOG_REPO_CONFIG.repo;
const BLOG_PATH = BLOG_REPO_CONFIG.blogPath;
const BRANCH = BLOG_REPO_CONFIG.branch;

/** Custom fetch that bypasses browser cache - avoids stale ref when remote moved */
const noCacheFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });

function createOctokit(token: string) {
  return new Octokit({
    auth: token,
    request: { fetch: noCacheFetch },
  });
}

// Detect owner/repo from the authenticated user's token by reading the remote
export async function detectRepo(token: string): Promise<{ owner: string; repo: string }> {
  const octokit = createOctokit(token);
  // Try to get the repo info - use a simple search to find repos matching our name
  // For now, return configured values. The user can override via configureRepo.
  try {
    await octokit.rest.repos.get({ owner: OWNER, repo: REPO });
    return { owner: OWNER, repo: REPO };
  } catch {
    return { owner: OWNER, repo: REPO };
  }
}

function parseFrontmatter(raw: string): { frontmatter: BlogFrontmatter; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return {
      frontmatter: { title: "Untitled", date: new Date().toISOString().slice(0, 10), tags: [] },
      content: raw,
    };
  }

  const yamlBlock = match[1];
  const content = match[2].trim();

  const fm: Record<string, string> = {};
  const yamlLines = yamlBlock.split("\n");

  for (let i = 0; i < yamlLines.length; i += 1) {
    const line = yamlLines[i];
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();

    if (key === "tags") {
      if (!val) {
        const tagValues: string[] = [];
        for (let j = i + 1; j < yamlLines.length; j += 1) {
          const tagMatch = yamlLines[j].match(/^\s*-\s*(.+)$/);
          if (!tagMatch) break;
          let tag = tagMatch[1].trim();
          if ((tag.startsWith('"') && tag.endsWith('"')) || (tag.startsWith("'") && tag.endsWith("'"))) {
            tag = tag.slice(1, -1);
          }
          if (tag) tagValues.push(tag);
          i = j;
        }
        fm.tags = tagValues.join(",");
        continue;
      }

      if (val.startsWith("[") && val.endsWith("]")) {
        val = val.slice(1, -1);
      }
    }

    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    fm[key] = val;
  }

  const tags = (fm.tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    frontmatter: {
      title: fm.title || "Untitled",
      date: fm.date || new Date().toISOString().slice(0, 10),
      pinned: fm.pinned === "true",
      cover: fm.cover,
      source: fm.source,
      tags,
    },
    content,
  };
}

/** Escape string for YAML frontmatter - handles ", ', :, #, \, etc. */
function escapeYamlString(s: string): string {
  return "'" + s.replace(/'/g, "''") + "'";
}

export function safeYamlTitle(input: string): string {
  if (!input) return "title: ''";

  const title = input
    .replace(/^\uFEFF/, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/---/g, '')
    .replace(/\.\.\./g, '')
    .trim()
    .replace(/'/g, "''");

  return `title: '${title}'`;
}

function serializeFrontmatter(fm: BlogFrontmatter): string {
  const lines = ["---"];
  lines.push(safeYamlTitle(fm.title));
  lines.push(`date: ${escapeYamlString(fm.date)}`);
  if (fm.pinned) lines.push("pinned: true");
  if (fm.cover) lines.push(`cover: ${escapeYamlString(fm.cover)}`);
  if (fm.source) lines.push(`source: ${escapeYamlString(fm.source)}`);
  if (fm.tags && fm.tags.length > 0) {
    lines.push("tags:");
    for (const tag of fm.tags) {
      lines.push(`  - ${escapeYamlString(tag)}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

function extractReferencedAssetPaths(markdown: string): Set<string> {
  const referenced = new Set<string>();
  const re = /(?:\.\/)?assets\/([^\s)"'`>\]]+)/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(markdown)) !== null) {
    referenced.add(`assets/${match[1]}`);
  }

  return referenced;
}

async function listBlogAssetFilePaths(token: string, slug: string): Promise<string[]> {
  const octokit = createOctokit(token);
  const basePath = `${BLOG_PATH}/${slug}/assets`;

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: basePath,
      ref: BRANCH,
    });

    if (!Array.isArray(data)) return [];
    return data.filter((item) => item.type === "file").map((item) => item.path);
  } catch (err) {
    // Assets folder may not exist yet.
    if ((err as { status?: number }).status === 404) return [];
    throw err;
  }
}

function sortBlogIndexPosts(posts: BlogIndexPost[]): BlogIndexPost[] {
  return [...posts].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }
    const dateDiff = Date.parse(b.date) - Date.parse(a.date);
    if (!Number.isNaN(dateDiff) && dateDiff !== 0) return dateDiff;
    return 0;
  });
}

function normalizeBlogIndexPosts(indexFile: BlogIndexFile): BlogIndexPost[] {
  if (!Array.isArray(indexFile.posts)) return [];

  return indexFile.posts
    .filter(
      (post): post is BlogIndexPost =>
        Boolean(
          post &&
          typeof post.slug === "string" &&
          typeof post.title === "string" &&
          typeof post.date === "string"
        )
    )
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
      pinned: post.pinned === true,
      tags: Array.isArray(post.tags) ? post.tags.filter((tag) => typeof tag === "string") : [],
      source: typeof post.source === "string" ? post.source : undefined,
      cover: typeof post.cover === "string" ? post.cover : undefined,
    }));
}

function serializeBlogIndex(posts: BlogIndexPost[]): string {
  const sortedPosts = sortBlogIndexPosts(posts);
  const payload: BlogIndexFile = {
    count: sortedPosts.length,
    posts: sortedPosts,
  };

  return `${JSON.stringify(payload, null, 2)}\n`;
}

function toBlogIndexPost(slug: string, frontmatter: BlogFrontmatter): BlogIndexPost {
  return {
    slug,
    title: frontmatter.title,
    date: frontmatter.date,
    pinned: frontmatter.pinned === true,
    tags: frontmatter.tags || [],
    source: frontmatter.source,
    cover: frontmatter.cover,
  };
}

async function buildBlogIndexFromRepo(octokit: Octokit): Promise<BlogIndexPost[]> {
  const { data } = await octokit.rest.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path: BLOG_PATH,
    ref: BRANCH,
  });

  if (!Array.isArray(data)) return [];

  const dirs = data.filter((item) => item.type === "dir");

  const results = await Promise.allSettled(
    dirs.map(async (dir) => {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: `${BLOG_PATH}/${dir.name}/index.md`,
        ref: BRANCH,
      });

      if (Array.isArray(fileData) || fileData.type !== "file") return null;

      const raw = decodeBase64UTF8(fileData.content);
      const { frontmatter } = parseFrontmatter(raw);
      return toBlogIndexPost(dir.name, frontmatter);
    })
  );

  const posts: BlogIndexPost[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      posts.push(result.value);
    }
  }

  return sortBlogIndexPosts(posts);
}

async function getIndexPostsForMutation(octokit: Octokit): Promise<BlogIndexPost[]> {
  try {
    const { data: indexData } = await octokit.rest.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: `${BLOG_PATH}/_index.json`,
      ref: BRANCH,
    });

    if (!Array.isArray(indexData) && indexData.type === "file") {
      const parsed = JSON.parse(decodeBase64UTF8(indexData.content)) as BlogIndexFile;
      return sortBlogIndexPosts(normalizeBlogIndexPosts(parsed));
    }
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status !== 404) {
      console.warn("Failed to parse posts _index.json, fallback to repo scan.", error);
    }
  }

  return buildBlogIndexFromRepo(octokit);
}

function normalizeIndexPosts(indexFile: BlogIndexFile): PostItem[] {
  return normalizeBlogIndexPosts(indexFile).map((post) => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
      pinned: post.pinned === true,
      tags: Array.isArray(post.tags) ? post.tags.filter((tag) => typeof tag === "string") : [],
    }));
}

export async function listBlogs(token: string): Promise<PostItem[]> {
  const octokit = createOctokit(token);

  try {
    const { data: indexData } = await octokit.rest.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: `${BLOG_PATH}/_index.json`,
      ref: BRANCH,
    });

    if (!Array.isArray(indexData) && indexData.type === "file") {
      const parsed = JSON.parse(decodeBase64UTF8(indexData.content)) as BlogIndexFile;
      return normalizeIndexPosts(parsed);
    }
  } catch (error) {
    // Fallback to legacy mode when index is missing or malformed.
    const status = (error as { status?: number }).status;
    if (status !== 404) {
      console.warn("Failed to read posts _index.json, fallback to per-post fetch.", error);
    }
  }

  const { data } = await octokit.rest.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path: BLOG_PATH,
    ref: BRANCH,
  });

  if (!Array.isArray(data)) return [];

  const dirs = data.filter((item) => item.type === "dir");
  const posts: PostItem[] = [];

  // Fetch frontmatter for each blog to get title/date
  const results = await Promise.allSettled(
    dirs.map(async (dir) => {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: `${BLOG_PATH}/${dir.name}/index.md`,
        ref: BRANCH,
      });

      if (Array.isArray(fileData) || fileData.type !== "file") return null;

      const raw = decodeBase64UTF8(fileData.content);
      const { frontmatter } = parseFrontmatter(raw);

      return {
        slug: dir.name,
        title: frontmatter.title,
        date: frontmatter.date,
        pinned: frontmatter.pinned === true,
        tags: frontmatter.tags || [],
      };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      posts.push(result.value);
    }
  }

  return posts.sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }
    return a.date < b.date ? 1 : -1;
  });
}

export async function getBlog(token: string, slug: string): Promise<BlogPost> {
  const octokit = createOctokit(token);

  const { data } = await octokit.rest.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path: `${BLOG_PATH}/${slug}/index.md`,
    ref: BRANCH,
  });

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error("Blog not found");
  }

  const raw = decodeBase64UTF8(data.content);
  const { frontmatter, content } = parseFrontmatter(raw);

  return { slug, frontmatter, content, sha: data.sha };
}

export async function setBlogPinned(
  token: string,
  slug: string,
  pinned: boolean
): Promise<void> {
  const blog = await getBlog(token, slug);
  await saveBlog(
    token,
    slug,
    { ...blog.frontmatter, pinned },
    blog.content,
    [],
    false
  );
}

/**
 * Read a file as base64 from a File/Blob
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g., "data:image/png;base64,")
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Create or update a blog with images using Git Data API (single atomic commit)
 */
export async function saveBlog(
  token: string,
  slug: string,
  frontmatter: BlogFrontmatter,
  markdownContent: string,
  images: PendingImage[],
  isNew: boolean
): Promise<void> {
  const octokit = createOctokit(token);
  const referencedAssets = extractReferencedAssetPaths(markdownContent);
  const usedPendingImages = images.filter((img) =>
    referencedAssets.has(`assets/${img.filename}`)
  );

  // 1. Get current HEAD ref
  const { data: refData } = await octokit.rest.git.getRef({
    owner: OWNER,
    repo: REPO,
    ref: `heads/${BRANCH}`,
  });
  const baseSha = refData.object.sha;

  // 2. Get the base tree
  const { data: commitData } = await octokit.rest.git.getCommit({
    owner: OWNER,
    repo: REPO,
    commit_sha: baseSha,
  });
  const baseTreeSha = commitData.tree.sha;

  // 3. Create blob for index.md
  const fullMarkdown = `${serializeFrontmatter(frontmatter)}\n\n${markdownContent}\n`;
  const { data: mdBlob } = await octokit.rest.git.createBlob({
    owner: OWNER,
    repo: REPO,
    content: encodeUTF8Base64(fullMarkdown),
    encoding: "base64",
  });

  // 4. Create blobs for referenced pending images only
  const treeItems: Array<{
    path: string;
    mode: "100644";
    type: "blob";
    sha: string | null;
  }> = [
    {
      path: `${BLOG_PATH}/${slug}/index.md`,
      mode: "100644",
      type: "blob",
      sha: mdBlob.sha,
    },
  ];

  for (const img of usedPendingImages) {
    const base64 = await fileToBase64(img.file);
    const { data: imgBlob } = await octokit.rest.git.createBlob({
      owner: OWNER,
      repo: REPO,
      content: base64,
      encoding: "base64",
    });
    treeItems.push({
      path: `${BLOG_PATH}/${slug}/assets/${img.filename}`,
      mode: "100644",
      type: "blob",
      sha: imgBlob.sha,
    });
  }

  // 4.1 Delete orphaned assets that are no longer referenced in markdown
  const existingAssetPaths = await listBlogAssetFilePaths(token, slug);
  const keepAssetPaths = new Set(
    Array.from(referencedAssets, (relativePath) => `${BLOG_PATH}/${slug}/${relativePath}`)
  );
  for (const path of existingAssetPaths) {
    if (!keepAssetPaths.has(path)) {
      treeItems.push({
        path,
        mode: "100644",
        type: "blob",
        sha: null,
      });
    }
  }

  // 4.2 Keep posts/_index.json in sync in the same commit
  const indexPosts = await getIndexPostsForMutation(octokit);
  const updatedIndexPosts = sortBlogIndexPosts([
    ...indexPosts.filter((post) => post.slug !== slug),
    toBlogIndexPost(slug, frontmatter),
  ]);
  const { data: indexBlob } = await octokit.rest.git.createBlob({
    owner: OWNER,
    repo: REPO,
    content: encodeUTF8Base64(serializeBlogIndex(updatedIndexPosts)),
    encoding: "base64",
  });
  treeItems.push({
    path: `${BLOG_PATH}/_index.json`,
    mode: "100644",
    type: "blob",
    sha: indexBlob.sha,
  });

  // 5. Create new tree
  const { data: newTree } = await octokit.rest.git.createTree({
    owner: OWNER,
    repo: REPO,
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  // 6. Create commit
  const message = isNew
    ? `feat(blog): add blog post`
    : `feat(blog): update blog post`;

  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner: OWNER,
    repo: REPO,
    message,
    tree: newTree.sha,
    parents: [baseSha],
  });

  // 7. Update ref
  await octokit.rest.git.updateRef({
    owner: OWNER,
    repo: REPO,
    ref: `heads/${BRANCH}`,
    sha: newCommit.sha,
  });
}

export async function deleteBlog(token: string, slug: string): Promise<void> {
  const octokit = createOctokit(token);

  // List all files in the blog directory
  const { data } = await octokit.rest.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path: `${BLOG_PATH}/${slug}`,
    ref: BRANCH,
  });

  if (!Array.isArray(data)) throw new Error("Expected directory");

  // Recursively collect all file paths
  const filePaths: string[] = [];

  type ContentItem = { type: string; path: string; name: string };
  async function collectFiles(items: ContentItem[]) {
    for (const item of items) {
      if (item.type === "file") {
        filePaths.push(item.path);
      } else if (item.type === "dir") {
        const { data: subData } = await octokit.rest.repos.getContent({
          owner: OWNER,
          repo: REPO,
          path: item.path,
          ref: BRANCH,
        });
        if (Array.isArray(subData)) await collectFiles(subData);
      }
    }
  }

  await collectFiles(data);

  // Use Git Data API to delete all files in a single commit
  const { data: refData } = await octokit.rest.git.getRef({
    owner: OWNER,
    repo: REPO,
    ref: `heads/${BRANCH}`,
  });
  const baseSha = refData.object.sha;

  const { data: commitData } = await octokit.rest.git.getCommit({
    owner: OWNER,
    repo: REPO,
    commit_sha: baseSha,
  });

  // Create tree with all files marked as deleted (null sha)
  const treeItems = filePaths.map((p) => ({
    path: p,
    mode: "100644" as const,
    type: "blob" as const,
    sha: null as unknown as string,
  }));

  // Rebuild and update posts/_index.json in the same commit as deletion.
  const indexPosts = await getIndexPostsForMutation(octokit);
  const updatedIndexPosts = sortBlogIndexPosts(
    indexPosts.filter((post) => post.slug !== slug)
  );
  const { data: indexBlob } = await octokit.rest.git.createBlob({
    owner: OWNER,
    repo: REPO,
    content: encodeUTF8Base64(serializeBlogIndex(updatedIndexPosts)),
    encoding: "base64",
  });
  treeItems.push({
    path: `${BLOG_PATH}/_index.json`,
    mode: "100644" as const,
    type: "blob" as const,
    sha: indexBlob.sha,
  });

  const { data: newTree } = await octokit.rest.git.createTree({
    owner: OWNER,
    repo: REPO,
    base_tree: commitData.tree.sha,
    tree: treeItems,
  });

  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner: OWNER,
    repo: REPO,
    message: `feat(blog): delete "${slug}"`,
    tree: newTree.sha,
    parents: [baseSha],
  });

  await octokit.rest.git.updateRef({
    owner: OWNER,
    repo: REPO,
    ref: `heads/${BRANCH}`,
    sha: newCommit.sha,
  });
}

/**
 * Get existing images in a blog's assets folder
 */
export async function getBlogAssets(
  token: string,
  slug: string
): Promise<Array<{ name: string; download_url: string }>> {
  const octokit = createOctokit(token);

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: `${BLOG_PATH}/${slug}/assets`,
      ref: BRANCH,
    });

    if (!Array.isArray(data)) return [];

    return data
      .filter((item) => item.type === "file")
      .map((item) => ({
        name: item.name,
        download_url: item.download_url || "",
      }));
  } catch {
    return [];
  }
}
