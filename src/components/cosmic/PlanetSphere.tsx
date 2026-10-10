import type { CSSProperties } from "react";

import type { CosmicSection } from "@/lib/cosmic";

/**
 * 纯 CSS 程序化星球（服务端组件，无 JS、无 Canvas）。
 *
 * 为什么不用 Canvas：五颗分区行星只是装饰件，用 CSS 实现可以
 * ① 服务端渲染、无客户端开销；② 浏览器不支持 Canvas 时依然好看；
 * ③ reduced-motion 下自动静止。只有首页的中央主星球值得用 Canvas。
 *
 * 层次：body（球体渐变）→ surface（自转纹理）→ shade（受光/暗面）→ rim（边缘光）→ ring（光环）
 */
export default function PlanetSphere({
  section,
  size,
  className = "",
}: {
  section: CosmicSection;
  /** 覆盖默认直径（px）；不传则使用该分区在 cosmic.ts 里的基准尺寸 */
  size?: number;
  className?: string;
}) {
  const { planet, ring, spin, accent } = section;
  const diameter = size ?? section.size;

  const vars = {
    width: `${diameter}px`,
    height: `${diameter}px`,
    backgroundImage: `radial-gradient(circle at 32% 28%, ${planet.light} 0%, ${planet.base} 32%, ${planet.mid} 62%, ${planet.dark} 100%)`,
    "--planet-spin": spin,
    "--planet-accent": accent,
    "--planet-glow": `${Math.round(diameter * 0.28)}px`,
  } as CSSProperties;

  return (
    <span aria-hidden className={`cosmic-planet ${className}`} style={vars}>
      <span className="cosmic-planet__surface" />
      <span className="cosmic-planet__shade" />
      <span className="cosmic-planet__rim" />
      {ring ? <span className="cosmic-planet__ring" /> : null}
    </span>
  );
}