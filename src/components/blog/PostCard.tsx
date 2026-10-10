import CosmicLink from "@/components/cosmic/CosmicLink";
import { Chip } from "@/components/ui/Badge";
import { ArrowRightIcon, CalendarIcon, ClockIcon, FolderIcon } from "@/components/ui/Icons";
import { formatDate } from "@/lib/format";
import type { PostMeta } from "@/types";

/** 文章卡片：列表页与首页共用 */
export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="group relative flex flex-col rounded-xl border border-border bg-elevated p-5 transition-colors hover:border-accent/50">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <CalendarIcon width={13} height={13} />
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FolderIcon width={13} height={13} />
          {post.category}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ClockIcon width={13} height={13} />
          约 {post.readingTime} 分钟
        </span>
      </div>

      <h3 className="mt-3 text-base font-semibold tracking-tight text-foreground sm:text-lg">
        <CosmicLink href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
          {post.title}
        </CosmicLink>
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
        {post.description}
      </p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <ul className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 4).map((tag) => (
            <li key={tag}>
              <Chip>{tag}</Chip>
            </li>
          ))}
        </ul>

        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent">
          阅读
          <ArrowRightIcon
            width={15}
            height={15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </article>
  );
}