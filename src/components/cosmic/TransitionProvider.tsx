"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * 全局「星球穿越」转场控制器。
 *
 * 两种变体共用同一套遮罩与同一套缓动，只在时长与是否推进镜头上区分：
 * - `warp` 完整穿越（入口 → 星图、星图行星 → 分区、分区 → 返回星图）
 * - `soft` 同体系短版淡入淡出（导航栏、上一篇/下一篇、页脚、浏览器前进/后退）
 *
 * 状态机：
 *   idle ──start──▶ covering ──(cover 动画结束)──▶ covered ──(pathname 变化 / 等待超时)──▶ revealing ──▶ idle
 *
 * 三条硬性保证：
 * ① 不拦截点击：触发方是 <Link onNavigate>，从不调用 preventDefault，
 *   导航始终由 Next.js 原生完成（Ctrl/Cmd/Shift/中键/新标签页/外链 自动绕过）；
 * ② 不会永久遮挡：3s 硬安全超时 + 遮罩恒 pointer-events: none；
 * ③ 重复点击锁定：status !== idle 时直接忽略新的 start 请求。
 */

export type TransitionVariant = "warp" | "soft";
export type TransitionStatus = "idle" | "covering" | "covered" | "revealing";
/** 覆盖层的扩散原点，取被点击元素的中心（视口百分比） */
export type TransitionOrigin = { x: number; y: number };

type StartMode = "cover" | "reveal";

type TransitionContextValue = {
  status: TransitionStatus;
  variant: TransitionVariant;
  origin: TransitionOrigin;
  coverDuration: number;
  revealDuration: number;
  start: (
    variant: TransitionVariant,
    origin?: TransitionOrigin,
    mode?: StartMode,
  ) => void;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function useCosmicTransition(): TransitionContextValue {
  const value = useContext(TransitionContext);
  if (!value) {
    throw new Error("useCosmicTransition 必须在 <TransitionProvider> 内部使用");
  }
  return value;
}

/** 常规时长（未开启 reduced-motion） */
const DURATIONS = {
  // warp 的 cover + reveal 刻意压在 0.7s 以内：穿越感由缩放与缓动表达，
  // 而不是靠拉长时间；一旦超过 0.7s，连续导航（入口 → 星图 → 分区）会明显发钝。
  warp: { cover: 380, reveal: 300 },
  soft: { cover: 240, reveal: 240 },
} as const;

/** reduced-motion：跳过镜头推进，只做极短的淡入淡出 */
const REDUCED_DURATION = 120;
/** 覆盖完成后等待路由变化的最长时间；超过就照常揭开，避免长时间遮挡 */
const PATH_WAIT = 900;
/** 硬安全超时：无论发生什么，3s 之后一定恢复 */
const SAFETY_TIMEOUT = 3000;

const CENTER: TransitionOrigin = { x: 50, y: 50 };

export default function TransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  const [status, setStatus] = useState<TransitionStatus>("idle");
  const [variant, setVariant] = useState<TransitionVariant>("soft");
  const [origin, setOrigin] = useState<TransitionOrigin>(CENTER);

  /**
   * status 的镜像：事件回调里需要「同步」知道当前状态，
   * 不能等 setState 提交后再读，否则会和路由变化产生先后顺序竞争。
   */
  const statusRef = useRef<TransitionStatus>("idle");
  /** 本次转场开始时的 pathname */
  const startPathRef = useRef(pathname);
  /** 当前 pathname 的镜像（start 是稳定引用，不能闭包捕获 pathname） */
  const pathRef = useRef(pathname);
  /** 是否在等路由变化（observe 模式为 false） */
  const waitForPathRef = useRef(true);
  /** 首次挂载不播转场 */
  const mountedRef = useRef(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    mountedRef.current = true;
  }, []);

  const coverDuration = reducedMotion ? REDUCED_DURATION : DURATIONS[variant].cover;
  const revealDuration = reducedMotion ? REDUCED_DURATION : DURATIONS[variant].reveal;

  const start = useCallback(
    (nextVariant: TransitionVariant, nextOrigin?: TransitionOrigin, mode: StartMode = "cover") => {
      // 重复点击锁定
      if (statusRef.current !== "idle") return;

      setVariant(nextVariant);
      setOrigin(nextOrigin ?? CENTER);
      startPathRef.current = pathRef.current;

      if (mode === "reveal") {
        // 路由已经变化（浏览器前进/后退）：只揭遮罩，让新页面淡入
        statusRef.current = "revealing";
        setStatus("revealing");
        return;
      }

      waitForPathRef.current = true;
      statusRef.current = "covering";
      setStatus("covering");
    },
    [],
  );

  /* covering → covered（覆盖动画结束） */
  useEffect(() => {
    if (status !== "covering") return;
    const timer = setTimeout(() => setStatus("covered"), coverDuration);
    return () => clearTimeout(timer);
  }, [status, coverDuration]);

  /* covered → revealing（等 pathname 变化；不等待则立即揭开） */
  useEffect(() => {
    if (status !== "covered") return;

    if (!waitForPathRef.current || pathname !== startPathRef.current) {
      setStatus("revealing");
      return;
    }

    const timer = setTimeout(() => setStatus("revealing"), PATH_WAIT);
    return () => clearTimeout(timer);
  }, [status, pathname]);

  /* revealing → idle（揭开动画结束） */
  useEffect(() => {
    if (status !== "revealing") return;
    const timer = setTimeout(() => setStatus("idle"), revealDuration);
    return () => clearTimeout(timer);
  }, [status, revealDuration]);

  /*
   * 回到 idle 时，把「上一次转场的出发页」同步为当前页。
   *
   * 为什么必须有这一条：startPathRef 只在 start() 里被写成出发页，
   * 一次 A → B 的转场结束后它仍然停在 A。此时用户按浏览器后退回到 A，
   * 下面那条外部导航副作用会命中 `pathname === startPathRef.current`
   * 而直接 return，于是后退全程静默（status 恒为 idle）。
   * 把基准点推进到「当前页」，后退才会被识别成一次真实的路径变化。
   */
  useEffect(() => {
    if (status !== "idle") return;
    startPathRef.current = pathRef.current;
  }, [status]);

  /* 硬安全超时：任何异常都不会让遮罩永久停留 */
  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => {
      setStatus((current) => (current === "idle" ? current : "revealing"));
    }, SAFETY_TIMEOUT);
    return () => clearTimeout(timer);
  }, [status]);

  /*
   * 外部导航（浏览器前进/后退、或未走 CosmicLink 的普通 <Link>）：
   * pathname 在 idle 状态下变化 → 补播一次 soft，避免「突兀闪屏」。
   * 注意：这里读 statusRef 而不是 status，确保与 CosmicLink 触发的转场不打架。
   */
  useEffect(() => {
    if (pathname === startPathRef.current) return;
    if (!mountedRef.current) return;

    if (statusRef.current === "idle") {
      start("soft", undefined, "reveal");
      return;
    }
    if (statusRef.current === "covered") {
      statusRef.current = "revealing";
      setStatus("revealing");
    }
    // start / statusRef 都是稳定引用或 ref，不需要进依赖
  }, [pathname, start]);

  const value = useMemo<TransitionContextValue>(
    () => ({ status, variant, origin, coverDuration, revealDuration, start }),
    [status, variant, origin, coverDuration, revealDuration, start],
  );

  return <TransitionContext.Provider value={value}>{children}</TransitionContext.Provider>;
}