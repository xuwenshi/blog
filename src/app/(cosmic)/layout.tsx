import type { Viewport } from "next";
import type { ReactNode } from "react";

import CosmicChrome from "@/components/cosmic/CosmicChrome";

/**
 * 宇宙层外壳：/（星海入口）与 /universe（行星星图）。
 *
 * 关键点：`.cosmic-scope` 直接出现在服务端输出的 HTML 里，因此
 * 深空底色与滚动区域底色在首屏就已经正确，不会出现「先白后黑」的闪屏。
 */

/* 宇宙层恒定深空，浏览器 UI 的底色也跟随，避免亮色主题下顶部出现一条白条 */
export const viewport: Viewport = {
  themeColor: "#03040a",
};

export default function CosmicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="cosmic-scope flex flex-1 flex-col">
      <span aria-hidden className="cosmic-backdrop" />
      <CosmicChrome />

      <main id="main" className="relative z-10 flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}