"use client";

import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * 多层白色粒子星场（客户端组件，Canvas 2D）。
 *
 * 设计取舍：
 * - 用 Canvas 2D 而不是 WebGL/Three.js：星场只需要「点 + 缓动」，Canvas 2D 足够，
 *   且不必在首屏引入几百 KB 的 3D 引擎；
 * - 每帧只做一次 clearRect + 若干 fillRect/arc，不通过 React state 更新粒子
 *   （几百个粒子走 React 渲染会直接卡死）；
 * - 画布 pointer-events: none，指针事件全部挂在 window 上且 { passive: true }，
 *   所以不会拦截点击、滚动与文本选择；
 * - 页面切到后台 / 画布滚出视口时暂停 rAF；
 * - prefers-reduced-motion 下只静态绘制一帧，不做任何动画；
 * - Canvas 不可用时隐藏画布，深空底色与 CSS 底衬继续生效。
 */

type LayerDef = {
  /** 视差倍率：远景几乎不动，近景移动明显 */
  depth: number;
  sizeMin: number;
  sizeMax: number;
  alpha: number;
  /** 基础漂移速度（CSS px / 秒） */
  speed: number;
  /** 占总数量的比例 */
  share: number;
};

type Particle = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  phase: number;
  twinkle: number;
  vx: number;
  vy: number;
  /** 指针扰动造成的临时位移，离开后平滑归零 */
  ox: number;
  oy: number;
};

type Layer = {
  def: LayerDef;
  items: Particle[];
};

const TAU = Math.PI * 2;
/** 指针影响半径（CSS px） */
const POINTER_RADIUS = 120;
/** 指针最大推力（CSS px） */
const POINTER_PUSH = 26;
/** 视差最大位移（CSS px） */
const PARALLAX = 18;

const DESKTOP_LAYERS: LayerDef[] = [
  { depth: 0.2, sizeMin: 0.4, sizeMax: 0.9, alpha: 0.45, speed: 3, share: 0.55 },
  { depth: 0.5, sizeMin: 0.7, sizeMax: 1.3, alpha: 0.7, speed: 7, share: 0.32 },
  { depth: 1, sizeMin: 1, sizeMax: 1.9, alpha: 1, speed: 12, share: 0.13 },
];

/** 移动端减层：两层粒子、更少的数量，避免耗电 */
const MOBILE_LAYERS: LayerDef[] = [
  { depth: 0.25, sizeMin: 0.4, sizeMax: 0.9, alpha: 0.45, speed: 3, share: 0.62 },
  { depth: 0.6, sizeMin: 0.8, sizeMax: 1.5, alpha: 0.85, speed: 8, share: 0.38 },
];

function createParticle(def: LayerDef, width: number, height: number): Particle {
  const angle = Math.random() * TAU;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    r: def.sizeMin + Math.random() * (def.sizeMax - def.sizeMin),
    alpha: def.alpha * (0.6 + Math.random() * 0.4),
    phase: Math.random() * TAU,
    twinkle: 0.5 + Math.random() * 1.4,
    vx: Math.cos(angle) * def.speed * 0.5,
    vy: Math.sin(angle) * def.speed * 0.35 - def.speed * 0.12,
    ox: 0,
    oy: 0,
  };
}

export default function Starfield({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      // 不支持 Canvas（或上下文被禁用）：隐藏画布，让 CSS 深空底衬独自承担视觉
      canvas.style.display = "none";
      return;
    }

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    let dpr = 1;
    let layers: Layer[] = [];
    let rafId = 0;
    let running = false;
    let inView = true;
    let lastFrame = 0;
    let elapsed = 0;

    const pointer = { x: -9999, y: -9999, active: false };
    const parallaxTarget = { x: 0, y: 0 };
    const parallaxCurrent = { x: 0, y: 0 };

    const isMobile = () => width < 768;

    function rebuild() {
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      if (width === 0 || height === 0) return;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      // 之后所有绘制都用 CSS 像素坐标，高清屏由 transform 放大
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const defs = isMobile() ? MOBILE_LAYERS : DESKTOP_LAYERS;
      // 粒子数量按屏幕面积缩放，并夹在合理区间内
      const density = isMobile() ? 17000 : 9000;
      const min = isMobile() ? 45 : 80;
      const max = isMobile() ? 130 : 280;
      const total = Math.max(min, Math.min(max, Math.round((width * height) / density)));

      layers = defs.map((def) => ({
        def,
        items: Array.from({ length: Math.max(1, Math.round(total * def.share)) }, () =>
          createParticle(def, width, height),
        ),
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      for (const layer of layers) {
        const { def, items } = layer;
        const lx = -parallaxCurrent.x * PARALLAX * def.depth;
        const ly = -parallaxCurrent.y * PARALLAX * def.depth;

        for (const p of items) {
          const alpha = reducedMotion
            ? p.alpha
            : p.alpha * (0.55 + 0.45 * Math.sin(elapsed * p.twinkle + p.phase));

          ctx!.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
          const x = p.x + lx + p.ox;
          const y = p.y + ly + p.oy;

          if (p.r <= 1) {
            // 远景星点用方点即可（肉眼无法分辨），比 arc 更快
            const s = p.r * 2;
            ctx!.fillRect(x, y, s, s);
          } else {
            ctx!.beginPath();
            ctx!.arc(x, y, p.r, 0, TAU);
            ctx!.fill();

            // 近景大颗粒补一层很淡的光晕，形成景深而不产生刺眼闪烁
            ctx!.fillStyle = `rgba(255,255,255,${(alpha * 0.18).toFixed(3)})`;
            ctx!.beginPath();
            ctx!.arc(x, y, p.r * 2.6, 0, TAU);
            ctx!.fill();
          }
        }
      }
    }

    function step(now: number) {
      rafId = requestAnimationFrame(step);

      const dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      elapsed += dt;

      // 视差缓动：指针离开后自动回到 0
      parallaxCurrent.x += (parallaxTarget.x - parallaxCurrent.x) * Math.min(1, dt * 4);
      parallaxCurrent.y += (parallaxTarget.y - parallaxCurrent.y) * Math.min(1, dt * 4);

      const ease = Math.min(1, dt * 6);

      for (const layer of layers) {
        const { def, items } = layer;

        for (const p of items) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          // 环绕：从一侧出界后从另一侧回来，避免粒子慢慢跑光
          if (p.x < -4) p.x = width + 4;
          else if (p.x > width + 4) p.x = -4;
          if (p.y < -4) p.y = height + 4;
          else if (p.y > height + 4) p.y = -4;

          // 指针扰动：距离越近推力越大，且近景层响应更强
          let targetX = 0;
          let targetY = 0;
          if (pointer.active) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 0.01 && distance < POINTER_RADIUS) {
              const falloff = (1 - distance / POINTER_RADIUS) ** 2;
              const push = falloff * POINTER_PUSH * def.depth;
              targetX = (dx / distance) * push;
              targetY = (dy / distance) * push;
            }
          }

          p.ox += (targetX - p.ox) * ease;
          p.oy += (targetY - p.oy) * ease;
        }
      }

      draw();
    }

    function start() {
      if (running || reducedMotion) return;
      running = true;
      lastFrame = performance.now();
      rafId = requestAnimationFrame(step);
    }

    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(rafId);
      rafId = 0;
    }

    function syncPlayback() {
      if (inView && !document.hidden) start();
      else stop();
    }

    rebuild();

    if (reducedMotion) {
      // 减少动态效果：静态绘制一帧，完全不启动动画循环
      draw();
    } else {
      syncPlayback();
    }

    /* ---------------------------------------------------------------- 事件 */
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;

      // 归一化到 -1..1，限制幅度，避免晕动感
      parallaxTarget.x = (pointer.x / width) * 2 - 1;
      parallaxTarget.y = (pointer.y / height) * 2 - 1;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      parallaxTarget.x = 0;
      parallaxTarget.y = 0;
    };

    let resizeFrame = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        rebuild();
        if (reducedMotion) draw();
      });
    };

    const onVisibilityChange = () => syncPlayback();

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        syncPlayback();
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    // passive: 不阻塞滚动；pointermove 同时覆盖鼠标与触摸
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} aria-hidden className={`cosmic-canvas ${className}`} />;
}