"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

import CosmicLink from "@/components/cosmic/CosmicLink";
import { heroAccent, heroPlanet } from "@/lib/cosmic";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * 首页中央主星球 —— 网站的入口。
 *
 * 三层结构（从下到上）：
 * ① CSS 渐变球体底衬：服务端就渲染，首屏立即可见；Canvas 失败时它就是最终效果；
 * ② Canvas 2D 球体：程序化噪声纹理横向滚动模拟自转 + 受光面 / 暗面 / 边缘光 / 光环；
 * ③ 覆盖在整块区域之上的真实 <CosmicLink href="/universe" variant="warp">。
 *
 * 为什么用 <Link> 而不是 <button>：
 * 需求同时要求「真实 URL / 刷新 / 深链 / 新标签页 / 无 JS 可用」，只有真实 <a>
 * 能同时满足（<button> 在禁用 JS 时是一个死按钮）。可访问名称、键盘 Enter 触发、
 * 可见焦点、足够大的点击区域全部由 <a> 天然提供；仅 Space 触发依赖浏览器行为。
 *
 * 为什么用 Canvas 2D 而不是 WebGL：这里只需要「球体 + 自转纹理 + 光照」，
 * Canvas 2D 每帧约 300 列 fillRect 即可达到足够观感，不必引入 3D 引擎。
 */

const TAU = Math.PI * 2;
/** 自转速度：每秒转过的圈数（数值小 = 转得慢） */
const ROTATION_SPEED = 0.02;
/**
 * 画布相对球体轮廓的放大倍数。
 *
 * 大气光晕画到 1.62R、光环画到 1.52R，两者都超出球体本身；
 * 画布必须留出这部分余量，否则光晕与光环会在画布边界被硬切成一个可见的方块。
 * 因此画布取 172%，半径按 `min(宽,高) / 2 / 1.72` 反推 —— 球体直径恰好等于容器尺寸，
 * 与下方的 CSS 降级球体严丝合缝。
 */
const CANVAS_SCALE = 1.72;

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgba(color: Rgb, alpha: number): string {
  return `rgba(${color.r},${color.g},${color.b},${alpha})`;
}

function mix(from: Rgb, to: Rgb, t: number): string {
  const clampT = t < 0 ? 0 : t > 1 ? 1 : t;
  const r = Math.round(from.r + (to.r - from.r) * clampT);
  const g = Math.round(from.g + (to.g - from.g) * clampT);
  const b = Math.round(from.b + (to.b - from.b) * clampT);
  return `rgb(${r},${g},${b})`;
}

/** CSS 降级球体：与 Canvas 使用同一套配色，Canvas 就绪后无缝接管 */
const fallbackStyle: CSSProperties = {
  backgroundImage: `radial-gradient(circle at 32% 28%, ${heroPlanet.light} 0%, ${heroPlanet.base} 32%, ${heroPlanet.mid} 62%, ${heroPlanet.dark} 100%)`,
};

export default function CentralPlanet() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotion();
  /** 噪声谐波放在 ref 里，切换 reduced-motion 重新跑 effect 时纹理保持不变 */
  const harmonicsRef = useRef<{ freq: number; amp: number; phase: number }[] | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      // 不支持 Canvas：隐藏画布，下面的 CSS 球体继续作为最终视觉
      canvas.style.display = "none";
      return;
    }

    if (!harmonicsRef.current) {
      harmonicsRef.current = Array.from({ length: 6 }, (_, index) => ({
        freq: index + 2,
        amp: 1 / (index + 1),
        phase: Math.random() * TAU,
      }));
    }
    const harmonics = harmonicsRef.current;
    const harmonicTotal = harmonics.reduce((sum, h) => sum + h.amp, 0);

    /** 周期性噪声：t 以「圈」为单位，整数频率保证首尾相接、旋转不跳变 */
    function noise(t: number): number {
      let value = 0;
      for (const h of harmonics) {
        value += Math.sin(t * TAU * h.freq + h.phase) * h.amp;
      }
      return value / harmonicTotal;
    }

    const cBase = hexToRgb(heroPlanet.base);
    const cMid = hexToRgb(heroPlanet.mid);
    const cDark = hexToRgb(heroPlanet.dark);
    const cAccent = hexToRgb(heroAccent);

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;
    let running = false;
    let inView = true;
    let lastFrame = 0;
    let rotation = 0;

    function resize() {
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      if (width === 0 || height === 0) return;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function render() {
      if (width === 0 || height === 0) return;

      const cx = width / 2;
      const cy = height / 2;
      // 半径按画布放大倍数反推，保证球体直径 = 容器尺寸（见 CANVAS_SCALE 说明）
      const radius = Math.min(width, height) / 2 / CANVAS_SCALE;
      const rot = -0.28; // 光环倾角

      ctx!.clearRect(0, 0, width, height);

      /* 1. 大气光晕：球体外的一圈柔光，营造「有大气层」的体积感 */
      const halo = ctx!.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius * 1.62);
      halo.addColorStop(0, rgba(cAccent, 0.22));
      halo.addColorStop(0.55, rgba(cAccent, 0.07));
      halo.addColorStop(1, rgba(cAccent, 0));
      ctx!.fillStyle = halo;
      ctx!.beginPath();
      ctx!.arc(cx, cy, radius * 1.62, 0, TAU);
      ctx!.fill();

      /* 2. 光环后半段（先画，随后被球体遮住，形成「绕到球后」的错觉） */
      ctx!.strokeStyle = "rgba(232,236,246,0.3)";
      ctx!.lineWidth = Math.max(1, radius * 0.02);
      ctx!.beginPath();
      ctx!.ellipse(cx, cy, radius * 1.52, radius * 0.4, rot, Math.PI, TAU);
      ctx!.stroke();

      /* 3. 球体本体：逐列噪声纹理 + 明暗 */
      ctx!.save();
      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, 0, TAU);
      ctx!.clip();

      // 3a. 逐列绘制：经度经 asin 映射，靠近球体边缘时纹理自然压缩，形成球面错觉
      for (let x = -radius; x <= radius; x += 1) {
        const nx = Math.max(-1, Math.min(1, x / radius));
        const lon = Math.asin(nx) / (Math.PI / 2); // -1..1
        const terrain = noise(lon * 1.6 + rotation);
        const cloud = noise(lon * 3.2 - rotation * 1.7 + 0.31) * 0.5;
        const t = (terrain * 0.62 + cloud) * 0.5 + 0.5; // 0..1

        // 中间调与暗色之间插值，得到更接近岩石/云层的地貌层次
        ctx!.fillStyle = t > 0.62 ? mix(cMid, cBase, (t - 0.62) / 0.38) : mix(cDark, cMid, t / 0.62);
        ctx!.fillRect(cx + x, cy - radius, 1.4, radius * 2);
      }

      // 3b. 受光面 + 暗面（终止线）：左上受光，右下进入暗部
      const shade = ctx!.createRadialGradient(
        cx - radius * 0.44,
        cy - radius * 0.46,
        radius * 0.04,
        cx - radius * 0.12,
        cy - radius * 0.1,
        radius * 1.72,
      );
      shade.addColorStop(0, "rgba(255,255,255,0.2)");
      shade.addColorStop(0.34, "rgba(255,255,255,0)");
      shade.addColorStop(0.6, "rgba(3,4,10,0.34)");
      shade.addColorStop(1, "rgba(3,4,10,0.94)");
      ctx!.fillStyle = shade;
      ctx!.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      // 3c. 边缘光：沿背光侧的弧线内侧做一圈冷色辉光
      const rim = ctx!.createRadialGradient(
        cx + radius * 0.62,
        cy + radius * 0.58,
        radius * 0.2,
        cx,
        cy,
        radius,
      );
      rim.addColorStop(0.7, rgba(cAccent, 0));
      rim.addColorStop(0.93, rgba(cAccent, 0.4));
      rim.addColorStop(1, rgba(cAccent, 0));
      ctx!.fillStyle = rim;
      ctx!.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx!.restore();

      /* 4. 光环前半段：覆盖在球体之上，强化「环在球前」的立体关系 */
      ctx!.strokeStyle = "rgba(232,236,246,0.55)";
      ctx!.lineWidth = Math.max(1, radius * 0.022);
      ctx!.beginPath();
      ctx!.ellipse(cx, cy, radius * 1.52, radius * 0.4, rot, 0, Math.PI);
      ctx!.stroke();
    }

    function step(now: number) {
      rafId = requestAnimationFrame(step);
      const dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      rotation += dt * ROTATION_SPEED;
      render();
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

    resize();

    if (reducedMotion) {
      // 减少动态效果：静态画一帧（rotation 停在 0），不启动动画循环
      render();
    } else {
      syncPlayback();
    }

    const onVisibilityChange = () => syncPlayback();

    let resizeFrame = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resize();
        if (reducedMotion) render();
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        syncPlayback();
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [reducedMotion]);

  return (
    <CosmicLink
      href="/universe"
      variant="warp"
      aria-label="进入我的宇宙：查看简历、项目、文章、日记、目标五大行星分区"
      className="group flex flex-col items-center gap-7 rounded-3xl sm:gap-9"
    >
      {/* 星球视觉区：CSS 底衬 + Canvas */}
      <span className="relative block h-[190px] w-[190px] sm:h-[250px] sm:w-[250px] lg:h-[310px] lg:w-[310px]">
        <span
          aria-hidden
          className="cosmic-planet absolute inset-0 h-full w-full"
          style={{ ...fallbackStyle, width: "100%", height: "100%" }}
        >
          <span className="cosmic-planet__surface" />
          <span className="cosmic-planet__shade" />
          <span className="cosmic-planet__rim" />
        </span>

        {/* 画布比球体大 72%：给大气光晕与光环留出余量，否则超出球体轮廓的
            部分会被画布边界切出一个可见的方块。
            必须显式写 width/height —— <canvas> 的 width/height 属性会被浏览器
            映射成 CSS 尺寸（表现性提示），只给 inset 会让定位被「过约束」忽略，
            画布静默退回 300×150 的固有尺寸。 */}
        <canvas
          ref={canvasRef}
          aria-hidden
          style={{ left: "-36%", top: "-36%", width: "172%", height: "172%" }}
          className="pointer-events-none absolute transition-[filter] duration-500 ease-out group-hover:brightness-110 group-focus-visible:brightness-110 group-active:brightness-90"
        />
      </span>

      {/* 入口提示：文字永远在氛围层之上 */}
      <span className="flex flex-col items-center gap-1.5 text-center">
        <span className="text-lg font-semibold tracking-tight text-cosmic-text sm:text-xl">
          进入我的宇宙
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.28em] text-cosmic-muted transition-colors group-hover:text-cosmic-ice group-focus-visible:text-cosmic-ice">
          Enter the universe
        </span>
      </span>
    </CosmicLink>
  );
}