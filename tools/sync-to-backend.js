#!/usr/bin/env node
/**
 * Sync posts from hexi-site to hexi-agent-backend/docs/blog
 *
 * This script:
 * 1. Reads markdown files from apps/site/posts/
 * 2. Extracts title from frontmatter as H1
 * 3. Converts relative asset paths to absolute URLs
 * 4. Writes to hexi-agent-backend/docs/blog/
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'apps', 'site', 'posts');
const BACKEND_DIR = process.env.BACKEND_DIR || path.join(__dirname, '..', '..', 'hexi-agent-backend');
const OUTPUT_DIR = path.join(BACKEND_DIR, 'docs', 'blog');
const BLOG_ASSETS_BASE = 'https://hexi.men/blog-assets';

/**
 * Parse frontmatter and content from markdown
 */
function parseMarkdown(content) {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterText = frontmatterMatch[1];
  const body = frontmatterMatch[2];

  // Simple YAML parser for frontmatter
  const frontmatter = {};
  frontmatterText.split('\n').forEach(line => {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  });

  return { frontmatter, body };
}

/**
 * Convert relative asset paths to absolute URLs
 */
function convertAssetPaths(body, postSlug) {
  // Match both assets/xxx and ./assets/xxx patterns
  // Handles markdown images ![alt](path) and HTML <img src="path">
  const assetRegex = /(!\[.*?\]\(|src=")((\.\/)?assets\/[^\s")]+)/g;

  return body.replace(assetRegex, (match, prefix, assetPath) => {
    const filename = path.basename(assetPath);
    const newUrl = `${BLOG_ASSETS_BASE}/${postSlug}/assets/${filename}`;
    return `${prefix}${newUrl}`;
  });
}

/**
 * Process a single post file
 */
function processPost(postDir) {
  const indexPath = path.join(postDir, 'index.md');

  if (!fs.existsSync(indexPath)) {
    return null;
  }

  const content = fs.readFileSync(indexPath, 'utf-8');
  const { frontmatter, body } = parseMarkdown(content);

  // Skip if no title
  if (!frontmatter.title) {
    console.warn(`Warning: No title found in ${indexPath}, skipping`);
    return null;
  }

  const postSlug = path.basename(postDir);

  // Convert asset paths
  const convertedBody = convertAssetPaths(body, postSlug);

  // Build output: title as H1 + body (without frontmatter)
  const output = `# ${frontmatter.title}\n\n${convertedBody.trim()}\n`;

  return {
    slug: postSlug,
    title: frontmatter.title,
    content: output,
  };
}

/**
 * Main sync function
 */
function sync() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Read all post directories
  const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true });
  const postDirs = entries
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.'))
    .map(entry => path.join(POSTS_DIR, entry.name));

  let syncedCount = 0;

  for (const postDir of postDirs) {
    const result = processPost(postDir);
    if (result) {
      const outputPath = path.join(OUTPUT_DIR, `${result.slug}.md`);
      fs.writeFileSync(outputPath, result.content, 'utf-8');
      console.log(`Synced: ${result.slug} -> ${outputPath}`);
      syncedCount++;
    }
  }

  console.log(`\nSynced ${syncedCount} posts to ${OUTPUT_DIR}`);
}

// Run sync
sync();
