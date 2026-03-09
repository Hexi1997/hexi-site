const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const POSTS_DIR = path.join(__dirname, '..', 'posts');
const INDEX_FILE = path.join(POSTS_DIR, '_index.json');

function normalizeTags(rawTags) {
  if (!rawTags) return [];

  if (Array.isArray(rawTags)) {
    return rawTags
      .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
      .filter(Boolean);
  }

  if (typeof rawTags === 'string') {
    return rawTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function toDateValue(date) {
  if (typeof date !== 'string' || !date) return 0;
  const t = Date.parse(date);
  return Number.isNaN(t) ? 0 : t;
}

function isPinnedValue(value) {
  return value === true;
}

function loadPostIndexItem(slug) {
  const markdownPath = path.join(POSTS_DIR, slug, 'index.md');
  if (!fs.existsSync(markdownPath)) return null;

  const rawMarkdown = fs.readFileSync(markdownPath, 'utf8');
  const { data } = matter(rawMarkdown);

  return {
    slug,
    title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : slug,
    date:
      typeof data.date === 'string' && data.date.trim()
        ? data.date.trim()
        : new Date().toISOString().slice(0, 10),
    pinned: isPinnedValue(data.pinned),
    tags: normalizeTags(data.tags),
    source: typeof data.source === 'string' ? data.source : undefined,
    cover: typeof data.cover === 'string' ? data.cover : undefined,
  };
}

function generatePostIndex() {
  if (!fs.existsSync(POSTS_DIR)) {
    throw new Error(`Posts directory not found: ${POSTS_DIR}`);
  }

  const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true });
  const posts = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => loadPostIndexItem(entry.name))
    .filter(Boolean)
    .sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }
      return toDateValue(b.date) - toDateValue(a.date);
    });

  const result = {
    count: posts.length,
    posts,
  };

  fs.writeFileSync(INDEX_FILE, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return result;
}

const result = generatePostIndex();
console.log(`Generated ${path.relative(process.cwd(), INDEX_FILE)} with ${result.count} posts.`);
