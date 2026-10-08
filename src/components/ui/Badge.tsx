import Link from "next/link";
import type { ReactNode } from "react";

/** 标签样式的小圆角 chip，博客与项目共用 */
export function Chip({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-muted ${className}`}
    >
      {children}
    </span>
  );
}

/** 可点击的标签（用于标签筛选） */
export function TagLink({ tag }: { tag: string }) {
  return (
    <Link
      href="/blog"
      className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-muted transition-colors hover:border-accent/60 hover:text-foreground"
    >
      {tag}
    </Link>
  );
}

const STATUS_LABELS: Record<string, string> = {
  active: "维护中",
  "in-progress": "开发中",
  completed: "已完成",
  archived: "已归档",
};

const STATUS_STYLES: Record<string, string> = {
  active: "border-emerald-500/35 text-emerald-600 dark:text-emerald-400",
  "in-progress": "border-amber-500/35 text-amber-600 dark:text-amber-400",
  completed: "border-sky-500/35 text-sky-600 dark:text-sky-400",
  archived: "border-border text-muted",
};

/** 项目状态徽标 */
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border bg-transparent px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? STATUS_STYLES.archived
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}