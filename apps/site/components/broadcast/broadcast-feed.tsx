"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Heart, MessageCircle, Plus, Trash2 } from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { useSession } from "@/lib/auth-client";
import { apiClient, apiRequest } from "@/lib/api-client";
import { avatarColor } from "@/lib/avatar";

const MAX_CONTENT_LENGTH = 4000;
const MAX_IMAGE_COUNT = 4;
const PAGE_SIZE = 20;
const TRAILING_URL_PUNCTUATION = /[),.;!?]+$/;

type FeedUser = {
  id: string;
  name: string;
  image: string | null;
};

type FeedPost = {
  id: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  user: FeedUser;
  images: string[];
  likeCount: number;
  likedByMe: boolean;
};

type FeedNode = FeedPost & { children: FeedNode[] };
type LinkPreview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  type: string | null;
};

const linkPreviewCache = new Map<string, LinkPreview | null>();

type ComposerImage = {
  file: File;
  previewUrl: string;
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function trimMatchedUrl(rawUrl: string) {
  const punctuation = rawUrl.match(TRAILING_URL_PUNCTUATION)?.[0] ?? "";
  const url = punctuation ? rawUrl.slice(0, -punctuation.length) : rawUrl;
  return {
    url,
    trailing: punctuation,
  };
}

function findFirstUrl(text: string) {
  const match = text.match(/https?:\/\/[^\s]+/i);
  if (!match?.[0]) return null;
  const normalized = trimMatchedUrl(match[0]).url;
  return normalized || null;
}

function shorten(text: string, maxLength = 90) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function renderTextWithLinks(text: string): ReactNode[] {
  const matches = Array.from(text.matchAll(/https?:\/\/[^\s]+/gi));
  if (matches.length === 0) return [text];

  const nodes: ReactNode[] = [];
  let currentIndex = 0;

  for (const match of matches) {
    const raw = match[0];
    if (!raw || match.index === undefined) continue;

    const start = match.index;
    const end = start + raw.length;
    if (start > currentIndex) {
      nodes.push(text.slice(currentIndex, start));
    }

    const { url, trailing } = trimMatchedUrl(raw);
    if (url) {
      nodes.push(
        <a
          key={`${url}-${start}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline underline-offset-2 hover:text-blue-500"
        >
          {shorten(url, 120)}
        </a>,
      );
    } else {
      nodes.push(raw);
    }
    if (trailing) {
      nodes.push(trailing);
    }
    currentIndex = end;
  }

  if (currentIndex < text.length) {
    nodes.push(text.slice(currentIndex));
  }
  return nodes;
}

function buildFeedTree(posts: FeedPost[]) {
  const map = new Map<string, FeedNode>();
  const roots: FeedNode[] = [];

  for (const item of posts) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of posts) {
    const current = map.get(item.id);
    if (!current) continue;
    if (item.parentId) {
      const parent = map.get(item.parentId);
      if (parent) {
        parent.children.push(current);
      } else {
        roots.push(current);
      }
    } else {
      roots.push(current);
    }
  }

  const byCreatedAsc = (a: FeedNode, b: FeedNode) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  };

  const byCreatedDesc = (a: FeedNode, b: FeedNode) => {
    const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (diff !== 0) return diff;
    return b.id.localeCompare(a.id);
  };

  const sortReplies = (nodes: FeedNode[]) => {
    nodes.sort(byCreatedAsc);
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortReplies(node.children);
      }
    }
  };

  roots.sort(byCreatedDesc);
  for (const root of roots) {
    if (root.children.length > 0) {
      sortReplies(root.children);
    }
  }
  return roots;
}

function countDescendants(node: FeedNode): number {
  let total = node.children.length;
  for (const child of node.children) {
    total += countDescendants(child);
  }
  return total;
}

function BroadcastAvatar({ user }: { user: FeedPost["user"] }) {
  if (user.image) {
    return <img src={user.image} alt={user.name} className="size-8 rounded-full border border-neutral-200 object-cover" />;
  }

  const initials = user.name.trim().slice(0, 1).toUpperCase() || "?";
  const bg = avatarColor(user.id!);
  return (
    <span
      className="flex size-8 translate-y-0.5 items-center justify-center rounded-full text-sm font-semibold text-white select-none"
      style={{ backgroundColor: bg }}
    >
      {initials}
    </span>
  );
}

function BroadcastImages({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  const isSingleImage = images.length === 1;
  const columns = isSingleImage ? "grid-cols-1" : "grid-cols-2";
  return (
    <PhotoProvider>
      <div className={`mt-2 grid gap-2 ${columns}`}>
        {images.map((imageUrl, index) => (
          <PhotoView key={`${imageUrl}-${index}`} src={imageUrl}>
            <button
              type="button"
              className={`block cursor-zoom-in overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 ${isSingleImage ? "" : "aspect-[4/3]"}`}
              aria-label={`Preview image ${index + 1}`}
            >
              <img
                src={imageUrl}
                alt={`broadcast-image-${index + 1}`}
                className={isSingleImage ? "h-auto w-full object-contain" : "h-full w-full object-cover"}
              />
            </button>
          </PhotoView>
        ))}
      </div>
    </PhotoProvider>
  );
}

function LinkPreviewCard({ url }: { url: string }) {
  const [preview, setPreview] = useState<LinkPreview | null>(() => linkPreviewCache.get(url) ?? null);
  const [loading, setLoading] = useState(() => !linkPreviewCache.has(url));
  const isCompactLoading = (() => {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host === "b23.tv" || host.endsWith(".bilibili.com");
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    const cached = linkPreviewCache.get(url);
    if (cached !== undefined) {
      setPreview(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function loadPreview() {
      setLoading(true);
      try {
        const data = await apiRequest(
          apiClient.api.broadcast["link-preview"].$get({
            query: { url },
          }),
          "Failed to load link preview",
        );
        linkPreviewCache.set(url, data.preview);
        if (!cancelled) {
          setPreview(data.preview);
        }
      } catch {
        linkPreviewCache.set(url, null);
        if (!cancelled) {
          setPreview(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    if (isCompactLoading) {
      return (
        <div className="mt-2 flex items-center gap-3 overflow-hidden rounded-xl border border-neutral-200 bg-white p-3">
          <div className="h-16 w-24 shrink-0 animate-pulse rounded-lg bg-neutral-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-100" />
            <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
          </div>
        </div>
      );
    }
    return (
      <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="relative aspect-[1.91/1] w-full animate-pulse bg-neutral-100">
          <div className="absolute inset-x-0 bottom-0 px-4 py-3">
            <div className="h-4 w-2/3 rounded bg-white/45" />
          </div>
        </div>
      </div>
    );
  }
  if (!preview || (!preview.title && !preview.description && !preview.image)) {
    return null;
  }

  const isCompact = Boolean(preview.type?.toLowerCase().startsWith("video"));
  const hostname = new URL(preview.url).hostname;

  if (isCompact) {
    return (
      <a
        href={preview.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-2 overflow-hidden rounded-xl border border-neutral-200 bg-white p-2 transition-colors hover:bg-neutral-50"
      >
        {preview.image ? (
          <img
            src={preview.image}
            alt={preview.title ?? preview.siteName ?? "Link preview image"}
            className="h-16 w-24 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="h-16 w-24 shrink-0 rounded-lg bg-neutral-100" />
        )}
        <div className="min-w-0 flex-1">
          {(preview.siteName || preview.url) && (
            <p className="text-xs text-neutral-500">{preview.siteName ?? hostname}</p>
          )}
          {preview.title && <p className="mt-1 line-clamp-2 text-sm font-medium text-neutral-900">{preview.title}</p>}
        </div>
      </a>
    );
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors hover:bg-neutral-50"
    >
      <div className="relative aspect-[1.91/1] w-full bg-neutral-100">
        {preview.image ? (
          <img
            src={preview.image}
            alt={preview.title ?? preview.siteName ?? "Link preview image"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-neutral-100" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/35 to-transparent px-4 py-3">
          {preview.title && (
            <p className="line-clamp-2 text-xs font-medium text-white">
              {preview.title}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

type BroadcastItemProps = {
  node: FeedNode;
  depth: number;
  canInteract: boolean;
  currentUserId: string | null;
  likeUpdatingIds: Set<string>;
  deletingIds: Set<string>;
  onReply: (post: FeedPost) => void;
  onToggleLike: (post: FeedPost) => void;
  onDelete: (post: FeedPost) => void;
};

function BroadcastItem({
  node,
  depth,
  canInteract,
  currentUserId,
  likeUpdatingIds,
  deletingIds,
  onReply,
  onToggleLike,
  onDelete,
}: BroadcastItemProps) {
  const previewUrl = findFirstUrl(node.content);
  const likeUpdating = likeUpdatingIds.has(node.id);
  const deleting = deletingIds.has(node.id);
  const canDelete = currentUserId === node.user.id && node.children.length === 0;
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const replyCount = countDescendants(node);

  return (
    <article className={depth > 0 ? "ml-5 border-l border-neutral-200 pl-4" : ""}>
      <div className="flex items-start gap-3">
        <BroadcastAvatar user={node.user} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-neutral-900">{node.user.name}</span>
            <span className="text-xs text-neutral-500">{formatDate(node.createdAt)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-neutral-800">
            {renderTextWithLinks(node.content)}
          </p>
          <BroadcastImages images={node.images} />
          {node.images.length === 0 && previewUrl && <LinkPreviewCard url={previewUrl} />}

          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              disabled={!canInteract || likeUpdating || deleting}
              onClick={() => onToggleLike(node)}
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Heart className={`h-3.5 w-3.5 ${node.likedByMe ? "fill-current text-red-500" : ""}`} />
              <span className="tabular-nums">{node.likeCount}</span>
            </button>
            <button
              type="button"
              disabled={!canInteract || deleting}
              onClick={() => onReply(node)}
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MessageCircle className="h-3 w-3" />
              <span>Reply</span>
            </button>
            {canDelete ? (
              <button
                type="button"
                disabled={deleting}
                onClick={() => onDelete(node)}
                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                <span>{deleting ? "Deleting..." : "Delete"}</span>
              </button>
            ) : null}
          </div>

          {node.children.length > 0 ? (
            <button
              type="button"
              onClick={() => setRepliesExpanded((value) => !value)}
              className="mt-3 text-xs text-neutral-500 hover:text-neutral-900"
            >
              {repliesExpanded ? "Hide" : "Show"} {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </button>
          ) : null}
        </div>
      </div>

      {node.children.length > 0 && repliesExpanded && (
        <div className="mt-4 space-y-4">
          {node.children.map((child: FeedNode) => (
            <BroadcastItem
              key={child.id}
              node={child}
              depth={depth + 1}
              canInteract={canInteract}
              currentUserId={currentUserId}
              likeUpdatingIds={likeUpdatingIds}
              deletingIds={deletingIds}
              onReply={onReply}
              onToggleLike={onToggleLike}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </article>
  );
}

export function BroadcastFeed() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<FeedPost | null>(null);
  const [composerImages, setComposerImages] = useState<ComposerImage[]>([]);
  const composerImagesRef = useRef<ComposerImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [likeUpdatingIds, setLikeUpdatingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<FeedPost | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const canInteract = Boolean(session?.user);
  const currentUserId = session?.user.id ?? null;
  const signInHref = `/sign-in?redirect=${encodeURIComponent("/broadcast")}`;

  const loadFeed = useCallback(async (nextCursor: string | null, isLoadMore: boolean) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await apiRequest(
        apiClient.api.broadcast.$get({
          query: {
            limit: String(PAGE_SIZE),
            ...(nextCursor ? { cursor: nextCursor } : {}),
          },
        }),
        "Failed to load broadcast feed",
      );
      setPosts((prev) => {
        if (!isLoadMore) return data.posts;
        const map = new Map(prev.map((item) => [item.id, item]));
        for (const item of data.posts) {
          map.set(item.id, item);
        }
        return Array.from(map.values());
      });
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load broadcast feed");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed(null, false);
  }, [loadFeed]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (!first?.isIntersecting || loading || loadingMore || !hasMore || !cursor) return;
      void loadFeed(cursor, true);
    }, {
      rootMargin: "120px",
    });

    observer.observe(target);
    return () => observer.disconnect();
  }, [cursor, hasMore, loadFeed, loading, loadingMore]);

  useEffect(() => {
    composerImagesRef.current = composerImages;
  }, [composerImages]);

  useEffect(() => {
    return () => {
      for (const item of composerImagesRef.current) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (!composerOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        setComposerOpen(false);
        setReplyTo(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [composerOpen, submitting]);

  const tree = useMemo(() => buildFeedTree(posts), [posts]);

  const handleComposerEntry = useCallback(() => {
    if (!canInteract) {
      if (!isPending) {
        router.push(signInHref);
      }
      return;
    }
    setReplyTo(null);
    setComposerOpen(true);
  }, [canInteract, isPending, router, signInHref]);

  const openComposer = useCallback((post?: FeedPost | null) => {
    if (!canInteract) return;
    setReplyTo(post ?? null);
    setComposerOpen(true);
  }, [canInteract]);

  const closeComposer = useCallback(() => {
    if (submitting) return;
    setComposerOpen(false);
    setReplyTo(null);
  }, [submitting]);

  function removeComposerImage(targetPreviewUrl: string) {
    setComposerImages((prev) => {
      const item = prev.find((image) => image.previewUrl === targetPreviewUrl);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((image) => image.previewUrl !== targetPreviewUrl);
    });
  }

  function handleImageSelect(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files);
    if (incoming.length === 0) return;
    setError(null);
    setComposerImages((prev) => {
      const remain = Math.max(0, MAX_IMAGE_COUNT - prev.length);
      if (remain <= 0) {
        setError(`You can upload up to ${MAX_IMAGE_COUNT} images.`);
        return prev;
      }
      if (incoming.length > remain) {
        setError(`You can upload up to ${MAX_IMAGE_COUNT} images.`);
      }
      const accepted = incoming.slice(0, remain).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...accepted];
    });
  }

  async function handleSubmit() {
    if (!canInteract) return;
    const content = draft.trim();
    if (!content || content.length > MAX_CONTENT_LENGTH) return;

    setSubmitting(true);
    setError(null);
    try {
      const uploadedImages: string[] = [];
      for (const item of composerImages) {
        const formData = new FormData();
        formData.append("file", item.file);
        const upload = await apiRequest(
          apiClient.api.broadcast.image.$post({}, {
            init: {
              body: formData,
            },
          }),
          "Failed to upload image",
        );
        uploadedImages.push(upload.image);
      }

      const data = await apiRequest(
        apiClient.api.broadcast.$post({
          json: {
            content,
            parentId: replyTo?.id ?? null,
            images: uploadedImages,
          },
        }),
        "Failed to publish",
      );
      const created = data.post;
      setPosts((prev) => {
        if (prev.some((item) => item.id === created.id)) return prev;
        return [created, ...prev];
      });
      setComposerOpen(false);
      setDraft("");
      setReplyTo(null);
      setComposerImages((prev) => {
        for (const item of prev) {
          URL.revokeObjectURL(item.previewUrl);
        }
        return [];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleLike(post: FeedPost) {
    if (!canInteract) return;
    if (likeUpdatingIds.has(post.id)) return;

    setLikeUpdatingIds((prev) => {
      const next = new Set(prev);
      next.add(post.id);
      return next;
    });

    setPosts((prev) =>
      prev.map((item) => {
        if (item.id !== post.id) return item;
        const nextLiked = !item.likedByMe;
        return {
          ...item,
          likedByMe: nextLiked,
          likeCount: Math.max(0, item.likeCount + (nextLiked ? 1 : -1)),
        };
      }),
    );

    try {
      if (post.likedByMe) {
        await apiRequest(
          apiClient.api.broadcast[":id"].like.$delete({
            param: { id: post.id },
          }),
          "Failed to remove like",
        );
      } else {
        await apiRequest(
          apiClient.api.broadcast[":id"].like.$post({
            param: { id: post.id },
          }),
          "Failed to like",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update like");
      await loadFeed(null, false);
    } finally {
      setLikeUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  }

  async function handleDelete(post: FeedPost) {
    if (!currentUserId || currentUserId !== post.user.id) return;

    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.add(post.id);
      return next;
    });
    setError(null);

    try {
      await apiRequest(
        apiClient.api.broadcast[":id"].$delete({
          param: { id: post.id },
        }),
        "Failed to delete post",
      );
      setPosts((prev) => prev.filter((item) => item.id !== post.id));
      setDeleteTarget((current: FeedPost | null) => (current?.id === post.id ? null : current));
      if (replyTo?.id === post.id) {
        setReplyTo(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
      await loadFeed(null, false);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  }

  function requestDelete(post: FeedPost) {
    if (!currentUserId || currentUserId !== post.user.id) return;
    setDeleteTarget(post);
  }

  function closeDeleteDialog() {
    const target = deleteTarget;
    if (target && deletingIds.has(target.id)) return;
    setDeleteTarget(null);
  }

  return (
    <section className="mx-auto mt-10 max-w-[520px] pb-16">
      <div className="flex items-center justify-between gap-4">
        {/* Reserved space for the page title if it is restored later. */}
        <div></div>
        <button
          type="button"
          onClick={handleComposerEntry}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
          aria-label="Add post"
        >
          <Plus className="h-4 w-4" />
          <span>Add</span>
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      <div className="mt-8 space-y-6">
        {loading ? (
          <div className="text-sm text-neutral-500">Loading...</div>
        ) : tree.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500">
            No posts yet. Be the first to share something.
          </div>
        ) : (
          tree.map((item) => (
            <BroadcastItem
              key={item.id}
              node={item}
              depth={0}
              canInteract={canInteract}
              currentUserId={currentUserId}
              likeUpdatingIds={likeUpdatingIds}
              deletingIds={deletingIds}
              onReply={openComposer}
              onToggleLike={(post) => void handleToggleLike(post)}
              onDelete={requestDelete}
            />
          ))
        )}
      </div>
      <div ref={loadMoreRef} className="h-6" />
      {loadingMore ? (
        <div className="mt-2 text-sm text-neutral-500">Loading more...</div>
      ) : null}

      {composerOpen && canInteract && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-4 py-6 sm:items-center"
          onClick={closeComposer}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {replyTo ? `Reply to ${replyTo.user.name}` : "Create post"}
                </h2>
              </div>
              <button
                type="button"
                className="text-sm text-neutral-500 hover:text-neutral-900"
                onClick={closeComposer}
                disabled={submitting}
              >
                Close
              </button>
            </div>

            {replyTo && (
              <div className="mt-4 flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                <span>Replying to @{replyTo.user.name}</span>
                <button
                  type="button"
                  className="text-neutral-500 hover:text-neutral-900"
                  onClick={() => setReplyTo(null)}
                >
                  Switch to new post
                </button>
              </div>
            )}

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={7}
              maxLength={MAX_CONTENT_LENGTH}
              placeholder={replyTo ? `Reply to ${replyTo.user.name}...` : "Share what is on your mind"}
              className="mt-4 w-full resize-y rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
            />
            <div className="mt-3 flex items-center justify-between">
              <label className="inline-flex cursor-pointer items-center rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50">
                Upload images
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleImageSelect(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              <span className="text-xs text-neutral-500">
                {composerImages.length}/{MAX_IMAGE_COUNT}
              </span>
            </div>
            {composerImages.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {composerImages.map((item) => (
                  <div key={item.previewUrl} className="relative overflow-hidden rounded-lg border border-neutral-200">
                    <img src={item.previewUrl} alt="selected-image" className="h-28 w-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 rounded bg-black/65 px-1.5 py-0.5 text-xs text-white"
                      onClick={() => removeComposerImage(item.previewUrl)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                {draft.trim().length}/{MAX_CONTENT_LENGTH}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeComposer}
                  disabled={submitting}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || !draft.trim()}
                  onClick={() => void handleSubmit()}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 px-4 py-6 sm:items-center"
          onClick={closeDeleteDialog}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-neutral-900">Delete post?</h2>
            <p className="mt-2 text-sm text-neutral-600">
              This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={deletingIds.has(deleteTarget.id)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(deleteTarget)}
                disabled={deletingIds.has(deleteTarget.id)}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingIds.has(deleteTarget.id) ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
