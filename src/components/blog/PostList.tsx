"use client";

import { useMemo, useState } from "react";

import PostCard from "./PostCard";
import { EmptyState } from "@/components/ui/SectionHeading";
import type { PostMeta } from "@/types";

/**
 * 文章列表 + 标签筛选。
 *
 * 筛选完全在客户端完成：文章数量在个人博客的量级下很小，
 * 不需要为此引入搜索服务，也不必把列表页变成动态路由。
 */
export default function PostList({ posts }: { posts: PostMeta[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = useMemo(() => {
    const counter = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags) {
        counter.set(tag, (counter.get(tag) ?? 0) + 1);
      }
    }
    return [...counter.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
  }, [posts]);

  const visiblePosts = useMemo(
    () => (activeTag ? posts.filter((post) => post.tags.includes(activeTag)) : posts),
    [posts, activeTag],
  );

  if (posts.length === 0) {
    return <EmptyState>还没有文章。在 content/blog 下新建一个 .md 文件即可。</EmptyState>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTag(null)}
          aria-pressed={activeTag === null}
          className={`inline-flex min-h-11 items-center rounded-full border px-3.5 text-xs font-medium transition-colors ${
            activeTag === null
              ? "border-accent bg-accent text-on-accent"
              : "border-border bg-surface text-muted hover:text-foreground"
          }`}
        >
          全部（{posts.length}）
        </button>

        {tags.map(([tag, count]) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag)}
            aria-pressed={activeTag === tag}
            className={`inline-flex min-h-11 items-center rounded-full border px-3.5 text-xs font-medium transition-colors ${
              activeTag === tag
                ? "border-accent bg-accent text-on-accent"
                : "border-border bg-surface text-muted hover:text-foreground"
            }`}
          >
            {tag}（{count}）
          </button>
        ))}
      </div>

      {visiblePosts.length === 0 ? (
        <EmptyState>该标签下暂时没有文章。</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visiblePosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}