"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { MonitorIcon, MoonIcon, SunIcon } from "@/components/ui/Icons";

type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "theme";
/** 自定义事件：localStorage 的 storage 事件不会在本标签页触发，需要自己通知订阅者 */
const CHANGE_EVENT = "themechange";
/** 循环顺序：跟随系统 → 浅色 → 深色 */
const ORDER: Theme[] = ["system", "light", "dark"];

const LABELS: Record<Theme, string> = {
  system: "跟随系统",
  light: "浅色",
  dark: "深色",
};

/* --------------------------------------------------------------------------
   主题是一个「外部状态」：它存在 localStorage 和 <html> 的 class 上。
   因此用 useSyncExternalStore 读取，而不是在 useEffect 里 setState。
-------------------------------------------------------------------------- */

function isTheme(value: unknown): value is Theme {
  return value === "system" || value === "light" || value === "dark";
}

function readTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    // 隐私模式下访问 localStorage 可能抛错，退回到默认主题
  }
  // 与 layout 的 themeInitScript 保持一致：首次访问默认深色（宇宙）
  return "dark";
}

/** 服务端与 hydration 阶段返回默认主题 "dark"，让首屏图标与最常见的实际状态吻合 */
function readServerTheme(): Theme {
  return "dark";
}

function subscribeTheme(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * 主题切换：Light / Dark / System 三态循环。
 *
 * 页面首次渲染前由 layout 中的内联脚本应用真实主题，
 * 这里只负责「用户点击切换」与「跟随系统时的实时同步」。
 */
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, readServerTheme);

  // 把状态同步到 <html> —— 这是对外部系统（DOM）的写入，属于 effect 的正当用途
  useEffect(() => {
    const root = document.documentElement;

    const sync = () => {
      const isDark =
        theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", isDark);
      root.style.colorScheme = isDark ? "dark" : "light";
      // 同步浏览器界面配色：主题由 class 决定，媒体查询的 meta 猜不准
      for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
        meta.setAttribute("content", isDark ? "#060a18" : "#ffffff");
      }
    };

    sync();

    // 只有「跟随系统」时才需要监听系统主题变化
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [theme]);

  const cycle = useCallback(() => {
    const next = ORDER[(ORDER.indexOf(readTheme()) + 1) % ORDER.length];
    window.localStorage.setItem(STORAGE_KEY, next);
    // 通知订阅者重新读取，state 会随之更新
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const Icon = theme === "light" ? SunIcon : theme === "dark" ? MoonIcon : MonitorIcon;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`切换主题（当前：${LABELS[theme]}）`}
      title={`主题：${LABELS[theme]}，点击切换`}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-muted transition-colors hover:bg-surface hover:text-foreground"
    >
      <Icon width={17} height={17} />
    </button>
  );
}