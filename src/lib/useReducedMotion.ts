"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * 读取用户的「减少动态效果」偏好。
 *
 * 与 ThemeToggle 使用同一模式：偏好属于「外部状态」（浏览器媒体查询），
 * 因此用 useSyncExternalStore 订阅，而不是在 useEffect 里 setState。
 *
 * 服务端与 hydration 阶段统一返回 false（即「允许动画」），
 * 保证服务端输出与客户端首次渲染一致，不产生 hydration mismatch；
 * 真实偏好会在订阅后立即生效。
 */
let queryList: MediaQueryList | null = null;

function getMediaQueryList(): MediaQueryList {
  if (!queryList) queryList = window.matchMedia(QUERY);
  return queryList;
}

function subscribe(onChange: () => void) {
  const media = getMediaQueryList();
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return getMediaQueryList().matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export { QUERY as REDUCED_MOTION_QUERY };