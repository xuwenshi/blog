import type { ReactNode } from "react";

import CosmicLink from "@/components/cosmic/CosmicLink";
import { ArrowLeftIcon } from "@/components/ui/Icons";
import type { CosmicSection } from "@/lib/cosmic";

/**
 * 分区页统一的页头（服务端组件）。
 *
 * 在原有 PageHeader 的基础上叠加宇宙设计语言：
 * ①「← 返回星图」让用户随时回到五大行星；
 * ② 分区识别色的 eyebrow（文字仍走主题色 text-accent 以保证对比度，
 *   只在旁边放一个极小的识别色圆点，颜色不承担阅读职责）；
 * ③ 入场动效（cosmic-enter），reduced-motion 下由全局兜底自动关闭。
 */
export default function SectionIntro({
  section,
  title,
  description,
  children,
}: {
  section: CosmicSection;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="cosmic-enter border-b border-border pb-8">
      <CosmicLink
        href="/universe"
        variant="warp"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon width={15} height={15} />
        返回星图
      </CosmicLink>

      <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: section.accent }}
        />
        {section.latin}
      </p>

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