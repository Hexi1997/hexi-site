"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import type { InferResponseType } from "@workspace/api-rpc/client";
import { useSession } from "@/lib/auth-client";
import { apiClient, apiRequest } from "@/lib/api-client";
import { avatarColor } from "@/lib/avatar";

const MAX_CONTENT_LENGTH = 4000;
const MAX_IMAGE_COUNT = 4;
const TRAILING_URL_PUNCTUATION = /[),.;!?]+$/;

type FeedResponse = InferResponseType<typeof apiClient.api.broadcast.$get, 200>;
type FeedPost = FeedResponse["posts"][number];
type FeedNode = FeedPost & { children: FeedNode[] };
type LinkPreview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
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

function BroadcastAvatar({ user }: { user: FeedPost["user"] }) {
  if (user.image) {
    return <img src={user.image} alt={user.name} className="h-10 w-10 rounded-full border border-neutral-200 object-cover" />;
  }

  const initials = user.name.trim().slice(0, 1).toUpperCase() || "?";
  const bg = avatarColor(user.id);
  return (
    <span
      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white select-none"
      style={{ backgroundColor: bg }}
    >
      {initials}
    </span>
  );
}

function BroadcastImages({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  const columns = images.length === 1 ? "grid-cols-1" : "grid-cols-2";
  return (
    <div className={`mt-2 grid gap-2 ${columns}`}>
      {images.map((imageUrl, index) => (
        <a
          key={`${imageUrl}-${index}`}
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-lg border border-neutral-200"
        >
          <img src={imageUrl} alt={`broadcast-image-${index + 1}`} className="h-44 w-full object-cover" />
        </a>
      ))}
    </div>
  );
}

function LinkPreviewCard({ url }: { url: string }) {
  const [preview, setPreview] = useState<LinkPreview | null>(() => linkPreviewCache.get(url) ?? null);
  const [loading, setLoading] = useState(() => !linkPreviewCache.has(url));

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
    return <div className="mt-2 h-16 rounded-lg border border-neutral-200 bg-neutral-50" />;
  }
  if (!preview || (!preview.title && !preview.description && !preview.image)) {
    return null;
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors hover:bg-neutral-50"
    >
      {preview.image && (
        <img
          src={preview.image}
          alt={preview.title ?? preview.siteName ?? "Link preview image"}
          className="h-40 w-full object-cover"
        />
      )}
      <div className="p-3">
        {(preview.siteName || preview.url) && (
          <p className="text-xs text-neutral-500">{preview.siteName ?? new URL(preview.url).hostname}</p>
        )}
        {preview.title && <p className="mt-1 line-clamp-2 text-sm font-medium text-neutral-900">{preview.title}</p>}
        {preview.description && (
          <p className="mt-1 line-clamp-3 text-xs text-neutral-600">{preview.description}</p>
        )}
      </div>
    </a>
  );
}

type BroadcastItemProps = {
  node: FeedNode;
  depth: number;
  canInteract: boolean;
  likeUpdatingIds: Set<string>;
  onReply: (post: FeedPost) => void;
  onToggleLike: (post: FeedPost) => void;
};

function BroadcastItem({
  node,
  depth,
  canInteract,
  likeUpdatingIds,
  onReply,
  onToggleLike,
}: BroadcastItemProps) {
  const previewUrl = findFirstUrl(node.content);
  const likeUpdating = likeUpdatingIds.has(node.id);

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
          {previewUrl && <LinkPreviewCard url={previewUrl} />}

          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              disabled={!canInteract || likeUpdating}
              onClick={() => onToggleLike(node)}
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Heart className={`h-3.5 w-3.5 ${node.likedByMe ? "fill-current text-red-500" : ""}`} />
              <span>{node.likeCount}</span>
            </button>
            <button
              type="button"
              disabled={!canInteract}
              onClick={() => onReply(node)}
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>回复</span>
            </button>
          </div>
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="mt-4 space-y-4">
          {node.children.map((child) => (
            <BroadcastItem
              key={child.id}
              node={child}
              depth={depth + 1}
              canInteract={canInteract}
              likeUpdatingIds={likeUpdatingIds}
              onReply={onReply}
              onToggleLike={onToggleLike}
            />
          ))}
        </div>
      )}
    </article>
  );
}

export function BroadcastFeed() {
  const { data: session, isPending } = useSession();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<FeedPost | null>(null);
  const [composerImages, setComposerImages] = useState<ComposerImage[]>([]);
  const composerImagesRef = useRef<ComposerImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [likeUpdatingIds, setLikeUpdatingIds] = useState<Set<string>>(new Set());

  const canInteract = Boolean(session?.user);
  const signInHref = `/sign-in?redirect=${encodeURIComponent("/broadcast")}`;

  const loadFeed = useCallback(async () => {
    setError(null);
    try {
      const data = await apiRequest(apiClient.api.broadcast.$get(), "Failed to load broadcast feed");
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load broadcast feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

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

  const tree = useMemo(() => buildFeedTree(posts), [posts]);

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
        setError(`最多只能上传 ${MAX_IMAGE_COUNT} 张图片`);
        return prev;
      }
      if (incoming.length > remain) {
        setError(`最多只能上传 ${MAX_IMAGE_COUNT} 张图片`);
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
      await loadFeed();
    } finally {
      setLikeUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  }

  return (
    <section className="mx-auto mt-10 max-w-[780px] px-4 pb-16">
      <h1 className="text-2xl font-semibold text-neutral-900">Broadcast</h1>
      <p className="mt-2 text-sm text-neutral-500">公共空间：所有人可浏览，登录后可发言、点赞和回复。</p>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
        {canInteract ? (
          <>
            {replyTo && (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                <span>回复 @{replyTo.user.name}</span>
                <button
                  type="button"
                  className="text-neutral-500 hover:text-neutral-900"
                  onClick={() => setReplyTo(null)}
                >
                  取消
                </button>
              </div>
            )}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              maxLength={MAX_CONTENT_LENGTH}
              placeholder={replyTo ? `回复 ${replyTo.user.name}...` : "分享你的想法（纯文本，支持换行）"}
              className="w-full resize-y rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
            />
            <div className="mt-3 flex items-center justify-between">
              <label className="inline-flex cursor-pointer items-center rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50">
                添加图片
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
                {composerImages.length}/{MAX_IMAGE_COUNT} 张
              </span>
            </div>
            {composerImages.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {composerImages.map((item) => (
                  <div key={item.previewUrl} className="relative overflow-hidden rounded-lg border border-neutral-200">
                    <img src={item.previewUrl} alt="selected-image" className="h-28 w-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 rounded bg-black/65 px-1.5 py-0.5 text-xs text-white"
                      onClick={() => removeComposerImage(item.previewUrl)}
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                {draft.trim().length}/{MAX_CONTENT_LENGTH}
              </span>
              <button
                type="button"
                disabled={submitting || !draft.trim()}
                onClick={() => void handleSubmit()}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "发布中..." : "发布"}
              </button>
            </div>
          </>
        ) : isPending ? (
          <p className="text-sm text-neutral-500">正在检查登录状态...</p>
        ) : (
          <p className="text-sm text-neutral-600">
            <Link href={signInHref} className="text-neutral-900 underline underline-offset-4">
              登录
            </Link>
            后即可发言、点赞、回复。
          </p>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      <div className="mt-8 space-y-6">
        {loading ? (
          <div className="text-sm text-neutral-500">加载中...</div>
        ) : tree.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500">
            暂无内容，来发第一条吧。
          </div>
        ) : (
          tree.map((item) => (
            <BroadcastItem
              key={item.id}
              node={item}
              depth={0}
              canInteract={canInteract}
              likeUpdatingIds={likeUpdatingIds}
              onReply={setReplyTo}
              onToggleLike={(post) => void handleToggleLike(post)}
            />
          ))
        )}
      </div>
    </section>
  );
}
