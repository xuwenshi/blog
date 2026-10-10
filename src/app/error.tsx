"use client";

import Link from "next/link";
import { useEffect } from "react";

import Starfield from "@/components/cosmic/Starfield";
import { ArrowRightIcon } from "@/components/ui/Icons";

/**
 * 错误边界（客户端组件）。
 *
 * Next.js 的约定：`error.tsx` 必须声明 "use client"，并接收 `error` 与 `reset`。
 * 它捕获的是「渲染子树里抛出的异常」——本项目里最可能的是内容读取或渲染出错。
 *
 * 视觉沿用深空语言（`cosmic-scope` 会把它拉回恒定深空的调色板，
 * 与 404 一致），但语义上用 error 令牌而不是 404 的冰青：
 * 让用户一眼区分「地址错了」和「这边出故障了」。
 *
 * 这里刻意用原生 `next/link` 而不是 `CosmicLink`：
 * 兜底界面的第一优先级是「一定能用」，不依赖转场状态机是否健康。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 把错误留在控制台，便于定位；页面本身只给用户看友好文案
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="cosmic-scope flex min-h-svh flex-1 flex-col">
      <span aria-hidden className="cosmic-backdrop" />

      <div className="relative flex flex-1 items-center overflow-hidden px-5 py-24 sm:px-8">
        <Starfield />

        <div className="cosmic-enter relative z-10 mx-auto w-full max-w-3xl">
          <p className="inline-flex items-center gap-2 font-mono text-sm font-medium text-error">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-error" />
            航线异常 · 系统故障
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cosmic-text sm:text-4xl">
            这一段航线出了问题
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-cosmic-muted">
            页面在渲染时遇到了一个未预期的错误。可以重试一次，或者先回到星海入口。
            如果问题持续出现，请把浏览器控制台里的报错信息反馈给我。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-cosmic-ice px-4 text-sm font-medium text-cosmic-void transition-opacity hover:opacity-90"
            >
              重新尝试
            </button>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cosmic-line bg-white/[0.04] px-4 text-sm font-medium text-cosmic-text transition-colors hover:border-cosmic-ice/60"
            >
              回到星海入口
              <ArrowRightIcon width={15} height={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}