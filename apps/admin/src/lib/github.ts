import { Octokit } from "octokit";
import type { BlogFrontmatter, PostItem, PendingImage } from "@/types";

interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
  sha?: string;
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

const OWNER = "Hexi1997";
const REPO = "hexi-site";
const BLOG_PATH = "apps/site/posts";
const BRANCH = "main";

let _owner = OWNER;
let _repo = REPO;

export function configureRepo(owner: string, repo: string) {
  _owner = owner;
  _repo = repo;
}

function createOctokit(token: string) {
  return new Octokit({ auth: token });
}

// Detect owner/repo from the authenticated user's token by reading the remote
export async function detectRepo(token: string): Promise<{ owner: string; repo: string }> {
  const octokit = createOctokit(token);
  // Try to get the repo info - use a simple search to find repos matching our name
  // For now, return configured values. The user can override via configureRepo.
  try {
    await octokit.rest.repos.get({ owner: _owner, repo: _repo });
    return { owner: _owner, repo: _repo };
  } catch {
    return { owner: _owner, repo: _repo };
  }
}

function parseFrontmatter(raw: string): { frontmatter: BlogFrontmatter; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return {
      frontmatter: { title: "Untitled", date: new Date().toISOString().slice(0, 10) },
      content: raw,
    };
  }

  const yamlBlock = match[1];
  const content = match[2].trim();

  const fm: Record<string, string> = {};
  for (const line of yamlBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }

  return {
    frontmatter: {
      title: fm.title || "Untitled",
      date: fm.date || new Date().toISOString().slice(0, 10),
      cover: fm.cover,
      sortIndex: fm.sortIndex ? parseInt(fm.sortIndex, 10) : undefined,
      source: fm.source,
    },
    content,
  };
}

function serializeFrontmatter(fm: BlogFrontmatter): string {
  const lines = ["---"];
  lines.push(`title: "${fm.title}"`);
  lines.push(`date: "${fm.date}"`);
  if (fm.cover) lines.push(`cover: "${fm.cover}"`);
  if (fm.sortIndex !== undefined) lines.push(`sortIndex: ${fm.sortIndex}`);
  if (fm.source) lines.push(`source: "${fm.source}"`);
  lines.push("---");
  return lines.join("\n");
}

export async function listBlogs(token: string): Promise<PostItem[]> {
  const octokit = createOctokit(token);

  const { data } = await octokit.rest.repos.getContent({
    owner: _owner,
    repo: _repo,
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
        owner: _owner,
        repo: _repo,
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
      };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      posts.push(result.value);
    }
  }

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getBlog(token: string, slug: string): Promise<BlogPost> {
  const octokit = createOctokit(token);

  const { data } = await octokit.rest.repos.getContent({
    owner: _owner,
    repo: _repo,
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

  // 1. Get current HEAD ref
  const { data: refData } = await octokit.rest.git.getRef({
    owner: _owner,
    repo: _repo,
    ref: `heads/${BRANCH}`,
  });
  const baseSha = refData.object.sha;

  // 2. Get the base tree
  const { data: commitData } = await octokit.rest.git.getCommit({
    owner: _owner,
    repo: _repo,
    commit_sha: baseSha,
  });
  const baseTreeSha = commitData.tree.sha;

  // 3. Create blob for index.md
  const fullMarkdown = `${serializeFrontmatter(frontmatter)}\n\n${markdownContent}\n`;
  const { data: mdBlob } = await octokit.rest.git.createBlob({
    owner: _owner,
    repo: _repo,
    content: encodeUTF8Base64(fullMarkdown),
    encoding: "base64",
  });

  // 4. Create blobs for images
  const treeItems: Array<{
    path: string;
    mode: "100644";
    type: "blob";
    sha: string;
  }> = [
    {
      path: `${BLOG_PATH}/${slug}/index.md`,
      mode: "100644",
      type: "blob",
      sha: mdBlob.sha,
    },
  ];

  for (const img of images) {
    const base64 = await fileToBase64(img.file);
    const { data: imgBlob } = await octokit.rest.git.createBlob({
      owner: _owner,
      repo: _repo,
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

  // 5. Create new tree
  const { data: newTree } = await octokit.rest.git.createTree({
    owner: _owner,
    repo: _repo,
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  // 6. Create commit
  const message = isNew
    ? `feat(blog): add blog post`
    : `feat(blog): update blog post`;

  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner: _owner,
    repo: _repo,
    message,
    tree: newTree.sha,
    parents: [baseSha],
  });

  // 7. Update ref
  await octokit.rest.git.updateRef({
    owner: _owner,
    repo: _repo,
    ref: `heads/${BRANCH}`,
    sha: newCommit.sha,
  });
}

export async function deleteBlog(token: string, slug: string): Promise<void> {
  const octokit = createOctokit(token);

  // List all files in the blog directory
  const { data } = await octokit.rest.repos.getContent({
    owner: _owner,
    repo: _repo,
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
          owner: _owner,
          repo: _repo,
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
    owner: _owner,
    repo: _repo,
    ref: `heads/${BRANCH}`,
  });
  const baseSha = refData.object.sha;

  const { data: commitData } = await octokit.rest.git.getCommit({
    owner: _owner,
    repo: _repo,
    commit_sha: baseSha,
  });

  // Create tree with all files marked as deleted (null sha)
  const treeItems = filePaths.map((p) => ({
    path: p,
    mode: "100644" as const,
    type: "blob" as const,
    sha: null as unknown as string,
  }));

  const { data: newTree } = await octokit.rest.git.createTree({
    owner: _owner,
    repo: _repo,
    base_tree: commitData.tree.sha,
    tree: treeItems,
  });

  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner: _owner,
    repo: _repo,
    message: `feat(blog): delete "${slug}"`,
    tree: newTree.sha,
    parents: [baseSha],
  });

  await octokit.rest.git.updateRef({
    owner: _owner,
    repo: _repo,
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
      owner: _owner,
      repo: _repo,
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
