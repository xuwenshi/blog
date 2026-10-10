import type { Metadata } from "next";

import CosmicLink from "@/components/cosmic/CosmicLink";
import Starfield from "@/components/cosmic/Starfield";
import { ArrowRightIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "页面不存在",
  description: "你访问的页面不存在或已经被移动。",
};

/**
 * 深空风格 404。
 *
 * 它不在 `(cosmic)` 路由组里（`not-found` 由根布局渲染），
 * 所以这里自己带上 `cosmic-scope` 与 `cosmic-backdrop`，
 * 让 404 也属于同一个宇宙：深空底、星场、两个真实入口。
 */
export default function NotFound() {
  return (
    <div className="cosmic-scope flex min-h-svh flex-1 flex-col">
      <span aria-hidden className="cosmic-backdrop" />

      <div className="relative flex flex-1 items-center overflow-hidden px-5 py-24 sm:px-8">
        <Starfield />

        <div className="cosmic-enter relative z-10 mx-auto w-full max-w-3xl">
          <p className="font-mono text-sm font-medium text-cosmic-ice">404 · 偏离航线</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cosmic-text sm:text-4xl">
            这颗星球不存在
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-cosmic-muted">
            你访问的地址可能已经失效，或者链接里有一个小错误。可以返回星海入口，
            或者直接打开星图挑一颗行星。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <CosmicLink
              href="/"
              variant="warp"
              className="inline-flex items-center gap-2 rounded-lg bg-cosmic-ice px-4 py-2.5 text-sm font-medium text-cosmic-void transition-opacity hover:opacity-90"
            >
              回到星海入口
            </CosmicLink>
            <CosmicLink
              href="/universe"
              variant="warp"
              className="inline-flex items-center gap-2 rounded-lg border border-cosmic-line bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-cosmic-text transition-colors hover:border-cosmic-ice/60"
            >
              打开星图
              <ArrowRightIcon width={15} height={15} />
            </CosmicLink>
          </div>
        </div>
      </div>
    </div>
  );
}