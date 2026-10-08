import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 首页 / 列表页通用的区块标题。
 * 传入 action 会在右侧渲染一个跳转链接。
 */
export default function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string; external?: boolean };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>

      {action ? (
        action.external ? (
          <a
            href={action.href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            {action.label}
          </a>
        ) : (
          <Link
            href={action.href}
            className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            {action.label}
          </Link>
        )
      ) : null}
    </div>
  );
}

/** 空状态提示 */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-muted">
      {children}
    </p>
  );
}