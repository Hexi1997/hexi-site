export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
}

export interface AuthState {
  token: string | null;
  user: GitHubUser | null;
  isAuthenticated: boolean;
}

export interface BlogFrontmatter {
  title: string;
  date: string;
  cover?: string;
  sortIndex?: number;
  source?: string;
}

export interface PostItem {
  slug: string;
  title: string;
  date: string;
}

export interface PendingImage {
  id: string;
  file: File;
  blobUrl: string;
  filename: string;
}
