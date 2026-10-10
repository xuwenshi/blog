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

/** 技术栈 / 技能标签：等宽字体的小方块，about 与 resume 共用同一份样式 */
export function TechChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-muted">
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

/**
 * 项目状态徽标配色。
 *
 * 全部走语义令牌（success / warning / accent），不再硬编码 emerald / amber / sky：
 * ① 浅色与深色两套值在 globals.css 里各定义一次，这里只表达「语义」；
 * ② 换主题时不会再出现「某个 chip 忘了跟着改」的漂移。
 * 「已完成」用 accent 而不是 error —— 完成是中性偏正面的状态，
 * 红色会误导成出错；error 令牌留给真正的错误界面（app/error.tsx）。
 */
const STATUS_STYLES: Record<string, string> = {
  active: "border-success/35 text-success",
  "in-progress": "border-warning/35 text-warning",
  completed: "border-accent/35 text-accent",
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