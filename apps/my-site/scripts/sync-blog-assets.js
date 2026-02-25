#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BLOGS_DIR = path.join(process.cwd(), 'blogs');
const PUBLIC_ASSETS_DIR = path.join(process.cwd(), 'public', 'blog-assets');

/**
 * Recursively copy folder contents
 */
function copyFolderRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);

  files.forEach((file) => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      copyFolderRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

/**
 * Remove assets for blogs that no longer exist
 */
function cleanupOrphanedAssets(blogsDir, publicAssetsDir) {
  if (!fs.existsSync(publicAssetsDir)) {
    return;
  }

  const existingSlugs = fs.readdirSync(blogsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const publicSlugs = fs.readdirSync(publicAssetsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  publicSlugs.forEach((slug) => {
    if (!existingSlugs.includes(slug)) {
      const orphanedDir = path.join(publicAssetsDir, slug);
      fs.rmSync(orphanedDir, { recursive: true, force: true });
    }
  });
}

/**
 * Sync assets for specific blog slug
 */
function syncBlogAssets(slug) {
  const assetsSourceDir = path.join(BLOGS_DIR, slug, 'assets');
  const assetsTargetDir = path.join(PUBLIC_ASSETS_DIR, slug, 'assets');

  if (fs.existsSync(assetsSourceDir)) {
    console.log(`📁 ${slug}`);
    
    // Remove existing target directory to ensure deleted files are also synced
    if (fs.existsSync(assetsTargetDir)) {
      fs.rmSync(assetsTargetDir, { recursive: true, force: true });
    }
    
    copyFolderRecursive(assetsSourceDir, assetsTargetDir);
  } else {
    // Clean up target assets if source doesn't exist
    const blogTargetDir = path.join(PUBLIC_ASSETS_DIR, slug);
    if (fs.existsSync(blogTargetDir)) {
      fs.rmSync(blogTargetDir, { recursive: true, force: true });
    }
  }
}

/**
 * Main sync function
 */
function main() {
  console.log('🔄 Syncing blog assets...\n');

  if (!fs.existsSync(BLOGS_DIR)) {
    console.error(`❌ Error: blogs directory not found at ${BLOGS_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(PUBLIC_ASSETS_DIR)) {
    fs.mkdirSync(PUBLIC_ASSETS_DIR, { recursive: true });
  }

  // Sync all blogs
  const entries = fs.readdirSync(BLOGS_DIR, { withFileTypes: true });
  const blogDirs = entries.filter((entry) => 
    entry.isDirectory() && entry.name !== 'images' && !entry.name.startsWith('.')
  );

  blogDirs.forEach((entry) => {
    syncBlogAssets(entry.name);
  });

  console.log('\n🧹 Cleaning up orphaned assets...');
  cleanupOrphanedAssets(BLOGS_DIR, PUBLIC_ASSETS_DIR);

  console.log('✅ Sync complete!');
}

try {
  main();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
