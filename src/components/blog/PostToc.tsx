import type { TocItem } from "@/types";

/**
 * 文章目录。
 *
 * 纯服务端渲染的锚点列表 —— 不需要 JavaScript，也不需要滚动监听，
 * 因此不会给文章页增加任何客户端开销。
 */
export default function PostToc({
  items,
  title = "目录",
}: {
  items: TocItem[];
  title?: string | null;
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="文章目录">
      {title ? (
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          {title}
        </h2>
      ) : null}

      <ul className="space-y-0.5 border-l border-border text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-3" : undefined}>
            <a
              href={`#${item.id}`}
              className="-ml-px flex min-h-11 items-center border-l border-transparent pl-3 leading-snug text-muted transition-colors hover:border-accent hover:text-foreground"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}