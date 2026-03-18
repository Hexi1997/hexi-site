"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { avatarColor } from "@/lib/avatar";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL ?? "";
const PAGE_SIZE = 20;
const MAX_CONTENT_LENGTH = 2000;

type ApiComment = {
  id: string;
  postSlug: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
};

type CommentNode = ApiComment & { children: CommentNode[] };

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

function buildCommentsTree(comments: ApiComment[]) {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const item of comments) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of comments) {
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

  const sortChildren = (nodes: CommentNode[]) => {
    nodes.sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortChildren(node.children);
      }
    }
  };

  roots.sort((a, b) => {
    const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (diff !== 0) return diff;
    return b.id.localeCompare(a.id);
  });
  for (const node of roots) {
    if (node.children.length > 0) {
      sortChildren(node.children);
    }
  }
  return roots;
}

function CommentAvatar({ user }: { user: ApiComment["user"] }) {
  if (user.image) {
    return (
      <Image
        src={user.image}
        alt={user.name}
        width={36}
        height={36}
        className="h-9 w-9 rounded-full border border-neutral-200 object-cover"
      />
    );
  }

  const initials = user.name.trim().slice(0, 1).toUpperCase() || "?";
  const bg = avatarColor(user.id);
  return (
    <span
      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white select-none"
      style={{ backgroundColor: bg }}
    >
      {initials}
    </span>
  );
}

type CommentItemProps = {
  node: CommentNode;
  depth: number;
  onReply: (comment: ApiComment) => void;
};

function CommentItem({ node, depth, onReply }: CommentItemProps) {
  return (
    <div className={depth > 0 ? "ml-5 border-l border-neutral-200 pl-4" : ""}>
      <div className="flex items-start gap-3">
        <CommentAvatar user={node.user} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-neutral-900">{node.user.name}</span>
            <span className="text-xs text-neutral-500">{formatDate(node.createdAt)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm text-neutral-800">{node.content}</p>
          <button
            type="button"
            className="mt-2 text-xs text-neutral-500 hover:text-neutral-900"
            onClick={() => onReply(node)}
          >
            回复
          </button>
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="mt-3 space-y-4">
          {node.children.map((child) => (
            <CommentItem key={child.id} node={child} depth={depth + 1} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}

export function BlogComments({ postSlug }: { postSlug: string }) {
  const { data: session, isPending } = useSession();
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ApiComment | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const signInHref = `/sign-in?redirect=${encodeURIComponent(`/blog/${postSlug}`)}`;

  const loadComments = useCallback(
    async (nextCursor: string | null, isLoadMore: boolean) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const params = new URLSearchParams({
          postSlug,
          limit: String(PAGE_SIZE),
        });
        if (nextCursor) {
          params.set("cursor", nextCursor);
        }
        const response = await fetch(`${AUTH_API_URL}/api/comments?${params.toString()}`, {
          credentials: "include",
        });
        const data = await response.json().catch(() => null) as {
          comments?: ApiComment[];
          nextCursor?: string | null;
          hasMore?: boolean;
          error?: string;
        } | null;

        if (!response.ok) {
          throw new Error(data?.error || "评论加载失败");
        }

        const incoming = data?.comments ?? [];
        setComments((prev) => {
          if (!isLoadMore) return incoming;
          const map = new Map(prev.map((item) => [item.id, item]));
          for (const item of incoming) {
            map.set(item.id, item);
          }
          return Array.from(map.values());
        });
        setCursor(data?.nextCursor ?? null);
        setHasMore(Boolean(data?.hasMore));
      } catch (err) {
        setError(err instanceof Error ? err.message : "评论加载失败");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [postSlug],
  );

  useEffect(() => {
    void loadComments(null, false);
  }, [loadComments]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (!first?.isIntersecting || loadingMore || loading || !hasMore) return;
      void loadComments(cursor, true);
    }, {
      rootMargin: "120px",
    });

    observer.observe(target);
    return () => observer.disconnect();
  }, [cursor, hasMore, loadComments, loading, loadingMore]);

  const tree = useMemo(() => buildCommentsTree(comments), [comments]);

  async function handleSubmit() {
    if (!session?.user) return;
    const content = draft.trim();
    if (!content || content.length > MAX_CONTENT_LENGTH) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${AUTH_API_URL}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          postSlug,
          parentId: replyTo?.id ?? null,
          content,
        }),
      });
      const data = await response.json().catch(() => null) as { comment?: ApiComment; error?: string } | null;
      if (!response.ok || !data?.comment) {
        throw new Error(data?.error || "评论发布失败");
      }
      const createdComment = data.comment;

      setComments((prev) => {
        if (prev.some((item) => item.id === createdComment.id)) return prev;
        if (createdComment.parentId) {
          return [...prev, createdComment];
        }
        return [createdComment, ...prev];
      });
      setDraft("");
      setReplyTo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "评论发布失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-12 border-t border-neutral-100 pt-8">
      <h2 className="text-xl font-semibold text-neutral-900">评论 ({comments.length})</h2>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
        {session?.user ? (
          <>
            {replyTo && (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                <span>回复 {replyTo.user.name}</span>
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
              placeholder={replyTo ? `回复 ${replyTo.user.name}...` : "写下你的评论..."}
              maxLength={MAX_CONTENT_LENGTH}
              rows={4}
              className="w-full resize-y rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-neutral-500">{draft.trim().length}/{MAX_CONTENT_LENGTH}</span>
              <button
                type="button"
                disabled={submitting || !draft.trim()}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void handleSubmit()}
              >
                {submitting ? "发布中..." : "发布评论"}
              </button>
            </div>
          </>
        ) : isPending ? (
          <p className="text-sm text-neutral-500">登录状态加载中...</p>
        ) : (
          <p className="text-sm text-neutral-600">
            <Link href={signInHref} className="text-neutral-900 underline underline-offset-4">
              登录
            </Link>
            后参与评论
          </p>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-6">
        {loading ? (
          <div className="text-sm text-neutral-500">Loading comments...</div>
        ) : tree.length === 0 ? (
          <></>
        ) : (
          tree.map((node) => (
            <CommentItem key={node.id} node={node} depth={0} onReply={setReplyTo} />
          ))
        )}
      </div>
      <div ref={loadMoreRef}></div>
    </section>
  );
}
