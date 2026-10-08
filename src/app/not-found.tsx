import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "页面不存在",
  description: "你访问的页面不存在或已经被移动。",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-start px-4 py-20 sm:px-6 sm:py-28">
      <p className="font-mono text-sm font-medium text-accent">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        这个页面不存在
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
        你访问的地址可能已经失效，或者链接里有一个小错误。
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          回到首页
        </Link>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
        >
          浏览全部文章
          <ArrowRightIcon width={15} height={15} />
        </Link>
      </div>
    </div>
  );
}