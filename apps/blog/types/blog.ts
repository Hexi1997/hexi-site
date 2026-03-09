export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  pinned?: boolean;
  author: string;
  description: string; // Auto-extracted from content when not specified in frontmatter
  cover: string;
  content: string;
  source?: string;
  tags?: string[];
}

export interface BlogMetadata {
  slug: string;
  title: string;
  date: string;
  pinned?: boolean;
  author: string;
  description: string; // Auto-extracted from content when not specified in frontmatter
  cover: string;
  source?: string;
  tags?: string[];
}
