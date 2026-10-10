import CosmicLink from "@/components/cosmic/CosmicLink";

import Navigation from "./Navigation";
import ThemeToggle from "./ThemeToggle";
import { navWithGithub, siteConfig } from "@/lib/site";

/**
 * 全站导航栏。
 * 服务端组件：只有 Navigation / ThemeToggle 是客户端组件。
 */
export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      {/* paddingTop 用 safe-area-inset：横屏时避开刘海 / 挖孔；
          竖屏与桌面端该值为 0，min-h-16 保证高度不变 */}
      <div
        className="relative mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <CosmicLink
          href="/"
          className="rounded-md text-base font-semibold tracking-tight text-foreground"
        >
          {siteConfig.name}
        </CosmicLink>

        <div className="flex items-center gap-2">
          <Navigation links={navWithGithub} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}