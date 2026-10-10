"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import type {
  ComponentProps,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

import { useCosmicTransition } from "./TransitionProvider";
import type { TransitionOrigin, TransitionVariant } from "./TransitionProvider";

/**
 * 会触发「星球穿越」转场的 Link。
 *
 * 设计要点：
 * - **绝不拦截导航**：只在 Next.js 的 `onNavigate` 回调里启动转场，
 *   从不调用 `preventDefault`。因此 Ctrl/Cmd/Shift/中键、新标签页、
 *   外链、`download`、以及在页面加载前的快速连点，行为全部保持原生。
 * - **提前记录原点**：`onNavigate` 的事件对象不含坐标，所以在
 *   `pointerdown` / `keydown(Enter)`（必定早于 click 与导航）时读取
 *   元素中心作为遮罩扩散原点。
 * - 元素引用直接用事件的 `currentTarget`，不需要额外的 ref 与合并逻辑。
 */

type LinkProps = ComponentProps<typeof Link>;

export type CosmicLinkProps = Omit<LinkProps, "onNavigate"> & {
  /** `warp` = 完整穿越（入口 → 星图 → 分区）；`soft` = 同体系短版淡入淡出 */
  variant?: TransitionVariant;
  onNavigate?: (event: { preventDefault: () => void }) => void;
};

export default function CosmicLink({
  variant = "soft",
  onNavigate,
  onPointerDown,
  onKeyDown,
  ...rest
}: CosmicLinkProps) {
  const { start } = useCosmicTransition();
  const originRef = useRef<TransitionOrigin | null>(null);

  const captureOrigin = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    originRef.current = {
      x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
      y: ((rect.top + rect.height / 2) / window.innerHeight) * 100,
    };
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLAnchorElement>) => {
      onPointerDown?.(event);
      // 只处理主键；修饰键组合会开新标签页/新窗口，不需要转场
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      captureOrigin(event.currentTarget);
    },
    [captureOrigin, onPointerDown],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLAnchorElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.key !== "Enter") return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      captureOrigin(event.currentTarget);
    },
    [captureOrigin, onKeyDown],
  );

  const handleNavigate = useCallback(
    (event: { preventDefault: () => void }) => {
      /*
       * Next.js 只在「未按修饰键的站内跳转」时调用 onNavigate，
       * 且该事件对象只暴露 preventDefault（不提供 defaultPrevented）。
       * 所以这里自己包一层，把取消状态记录下来。
       */
      let prevented = false;
      onNavigate?.({
        preventDefault: () => {
          prevented = true;
          event.preventDefault();
        },
      });
      if (prevented) return;

      start(variant, originRef.current ?? undefined);
      originRef.current = null;
    },
    [onNavigate, start, variant],
  );

  return (
    <Link
      {...rest}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onNavigate={handleNavigate}
    />
  );
}