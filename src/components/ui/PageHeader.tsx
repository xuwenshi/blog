import type { ReactNode } from "react";

/**
 * 列表页 / 内容页通用的页头（标题 + 描述）。
 * 单独抽出来是因为 blog、projects、about、resume 四个页面都需要同一套排版。
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-border pb-8">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          {eyebrow}
        </p>
      ) : null}

      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>

      {description ? (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          {description}
        </p>
      ) : null}

      {children ? <div className="mt-5">{children}</div> : null}
    </header>
  );
}