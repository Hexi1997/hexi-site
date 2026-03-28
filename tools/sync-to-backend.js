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
const BLOG_POSTS_INDEX_PATH = path.join(BACKEND_DIR, 'docs', 'blog-posts.md');
const BLOG_ASSETS_BASE = 'https://hexi.men/blog-assets';
const BLOG_POST_URL_BASE = 'https://hexi.men/blog';

function sortPosts(posts) {
  return [...posts].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }

    const dateDiff = Date.parse(b.date || '') - Date.parse(a.date || '');
    if (!Number.isNaN(dateDiff) && dateDiff !== 0) {
      return dateDiff;
    }

    return (a.slug || '').localeCompare(b.slug || '');
  });
}

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

  const frontmatter = {};
  const lines = frontmatterText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) continue;

    const key = match[1].trim();
    let value = match[2].trim();

    if (key === 'tags') {
      const tags = [];

      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).trim();
        if (value) {
          value.split(',').forEach(tag => {
            const normalizedTag = stripWrappingQuotes(tag.trim());
            if (normalizedTag) tags.push(normalizedTag);
          });
        }
      } else if (!value) {
        for (let j = i + 1; j < lines.length; j++) {
          const tagMatch = lines[j].match(/^\s*-\s*(.+)$/);
          if (!tagMatch) break;
          const normalizedTag = stripWrappingQuotes(tagMatch[1].trim());
          if (normalizedTag) tags.push(normalizedTag);
          i = j;
        }
      } else {
        tags.push(stripWrappingQuotes(value));
      }

      frontmatter[key] = tags.filter(Boolean);
      continue;
    }

    frontmatter[key] = stripWrappingQuotes(value);
  }

  return { frontmatter, body };
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
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
    date: frontmatter.date || '',
    pinned: frontmatter.pinned === 'true',
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    content: output,
  };
}

function buildBlogPostsMarkdown(posts) {
  const latestPost = posts.reduce((currentLatest, post) => {
    if (!currentLatest) return post;

    const postDate = Date.parse(post.date || '');
    const latestDate = Date.parse(currentLatest.date || '');

    if (Number.isNaN(postDate)) return currentLatest;
    if (Number.isNaN(latestDate) || postDate > latestDate) return post;

    return currentLatest;
  }, null);
  const pinnedPostsCount = posts.filter(post => post.pinned).length;
  const lines = [
    '# Blog Posts',
    '',
    'This file is auto-generated from Hexi\'s blog posts.',
    '',
    '## Summary',
    `- total_posts: ${posts.length}`,
    `- latest_post_title: ${latestPost ? JSON.stringify(latestPost.title) : 'null'}`,
    `- latest_post_slug: ${latestPost ? latestPost.slug : 'null'}`,
    `- latest_post_date: ${latestPost && latestPost.date ? latestPost.date : 'null'}`,
    `- pinned_posts_count: ${pinnedPostsCount}`,
    `- blog_posts_page_url: ${BLOG_POST_URL_BASE}`,
    '- note: Use this file to locate posts. Read docs/blog/<slug>.md for full content.',
    '',
    '## Catalog',
    '',
  ];

  posts.forEach(post => {
    lines.push(`### Post: ${post.title}`);
    lines.push('```yaml');
    lines.push(`slug: ${post.slug}`);
    lines.push(`path: docs/blog/${post.slug}.md`);
    lines.push(`post_page_url: ${BLOG_POST_URL_BASE}/${post.slug}`);
    lines.push(`title: ${JSON.stringify(post.title)}`);
    lines.push(`date: ${post.date || 'unknown'}`);
    lines.push(`pinned: ${post.pinned ? 'true' : 'false'}`);
    if (post.tags && post.tags.length > 0) {
      lines.push('tags:');
      post.tags.forEach(tag => {
        lines.push(`  - ${JSON.stringify(tag)}`);
      });
    } else {
      lines.push('tags: []');
    }
    lines.push('```');
    lines.push(
      `This catalog entry describes the blog post ${JSON.stringify(post.title)}. ` +
      `Read \`docs/blog/${post.slug}.md\` for the full synced article content, or open ` +
      `${BLOG_POST_URL_BASE}/${post.slug} for the public page.`
    );
    lines.push('');
  });

  return `${lines.join('\n').trimEnd()}\n`;
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
  const syncedPosts = [];

  for (const postDir of postDirs) {
    const result = processPost(postDir);
    if (result) {
      const outputPath = path.join(OUTPUT_DIR, `${result.slug}.md`);
      fs.writeFileSync(outputPath, result.content, 'utf-8');
      console.log(`Synced: ${result.slug} -> ${outputPath}`);
      syncedPosts.push(result);
      syncedCount++;
    }
  }

  const postsForMarkdown = sortPosts(syncedPosts);
  const markdownIndex = buildBlogPostsMarkdown(postsForMarkdown);

  fs.writeFileSync(BLOG_POSTS_INDEX_PATH, markdownIndex, 'utf-8');
  console.log(`Synced: blog-posts index -> ${BLOG_POSTS_INDEX_PATH}`);

  console.log(`\nSynced ${syncedCount} posts to ${OUTPUT_DIR}`);
}

// Run sync
sync();
