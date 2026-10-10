"use client";

import type { CSSProperties } from "react";

import { useCosmicTransition } from "./TransitionProvider";

/**
 * 转场遮罩层。
 *
 * 只做一件事：把 TransitionProvider 的状态翻译成一段 CSS 动画。
 * 它没有子节点、没有事件、`aria-hidden` 且 `pointer-events: none`，
 * 所以对屏幕阅读器与键盘用户完全透明。
 *
 * 关键细节：`covering` 与 `covered` 必须使用**完全相同**的 animation 字符串，
 * 否则 React 会认为动画变了而从第 0 帧重启，遮罩会闪一下。
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function TransitionOverlay() {
  const { status, variant, origin, coverDuration, revealDuration } = useCosmicTransition();

  const animation =
    status === "covering" || status === "covered"
      ? `${variant === "warp" ? "cosmic-warp-cover" : "cosmic-fade-cover"} ${coverDuration}ms ${EASE} both`
      : status === "revealing"
        ? `${variant === "warp" ? "cosmic-warp-reveal" : "cosmic-fade-reveal"} ${revealDuration}ms ${EASE} both`
        : undefined;

  return (
    <div
      aria-hidden
      className="cosmic-transition-overlay"
      data-variant={variant}
      data-status={status}
      style={
        {
          "--origin-x": `${origin.x}%`,
          "--origin-y": `${origin.y}%`,
          animation,
        } as CSSProperties
      }
    />
  );
}