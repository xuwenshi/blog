import CosmicLink from "@/components/cosmic/CosmicLink";

import { siteConfig } from "@/lib/site";

/**
 * 宇宙层的极简外壳（服务端组件）。
 *
 * 刻意保持克制：品牌 + 「入口 / 星图」两个真实链接。
 * 悬停在 fixed 头部之上，让星海/星图保持整屏观感；容器不拦截鼠标事件，
 * 只有链接本身可点（pointer-events-auto），所以不会挡住下方的星球交互。
 *
 * 两个链接都走 CosmicLink（warp 变体）—— 宇宙层内部的移动本身
 * 就是一次「星球穿越」，不应该是没有转场的硬跳。
 */
export default function CosmicChrome() {
  const navLinkClass =
    "inline-flex min-h-11 items-center rounded-md px-3 text-xs font-medium uppercase tracking-[0.16em] text-cosmic-muted transition-colors hover:text-cosmic-text";

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 bg-gradient-to-b from-cosmic-void/85 to-transparent">
      {/* paddingTop 用 safe-area-inset：横屏时避开刘海 / 挖孔 */}
      <div
        className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 pb-4 sm:px-8"
        style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}
      >
        <CosmicLink
          href="/"
          variant="warp"
          className="pointer-events-auto inline-flex min-h-11 items-center rounded-md text-sm font-semibold tracking-tight text-cosmic-text transition-opacity hover:opacity-80"
        >
          {siteConfig.name}
        </CosmicLink>

        <nav aria-label="宇宙导航" className="pointer-events-auto flex items-center gap-1">
          <CosmicLink href="/" variant="warp" className={navLinkClass}>
            入口
          </CosmicLink>
          <CosmicLink href="/universe" variant="warp" className={navLinkClass}>
            星图
          </CosmicLink>
        </nav>
      </div>
    </header>
  );
}