import CosmicLink from "@/components/cosmic/CosmicLink";
import PlanetSphere from "@/components/cosmic/PlanetSphere";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { cosmicSections } from "@/lib/cosmic";
import type { CosmicSectionId } from "@/lib/cosmic";

/**
 * 五行星星图（服务端组件）。
 *
 * 布局策略：
 * - ≥768px：绝对定位的星图。坐标来自 `cosmic.ts` 的百分比（刻意不随机：
 *   有主次、文字互不遮挡），叠加一层 `aria-hidden` 的星座连线 SVG。
 * - <768px：纵向行星列表，每行「星球 + 名称 + 说明 + 箭头」整行可点，
 *   触摸目标 ≥ 64px 高，避免小屏幕上绝对定位带来的重叠与错位。
 *
 * 两个布局都输出真实 `<CosmicLink>`（`warp` 变体），只是用 `md:block` /
 * `md:hidden` 切换显示；被 `display:none` 隐藏的那一份不会被读屏软件读到。
 */

/** 星座连线：一条闭合的折线，把五颗行星串成一个「星座」而不是散点 */
const CONSTELLATION: [CosmicSectionId, CosmicSectionId][] = [
  ["resume", "projects"],
  ["projects", "blog"],
  ["blog", "goals"],
  ["goals", "diary"],
  ["diary", "resume"],
];

export default function StarMap() {
  const byId = new Map(cosmicSections.map((section) => [section.id, section]));

  return (
    <div className="w-full">
      {/* ------------------------------------------------- 桌面 / 平板：星图布局 */}
      <div className="relative mx-auto hidden w-full max-w-5xl md:block">
        <div className="relative aspect-[16/11] w-full">
          {/* 星座连线：纯装饰，对读屏与键盘完全透明 */}
          <svg
            aria-hidden
            focusable="false"
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {CONSTELLATION.map(([from, to]) => {
              const a = byId.get(from);
              const b = byId.get(to);
              if (!a || !b) return null;
              return (
                <line
                  key={`${from}-${to}`}
                  x1={a.coords.x}
                  y1={a.coords.y}
                  x2={b.coords.x}
                  y2={b.coords.y}
                  stroke="rgba(232, 236, 246, 0.16)"
                  strokeWidth={1}
                  strokeDasharray="2 5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          <ul className="absolute inset-0">
            {cosmicSections.map((section, index) => (
              <li
                key={section.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${section.coords.x}%`, top: `${section.coords.y}%` }}
              >
                <CosmicLink
                  href={section.href}
                  variant="warp"
                  className="group flex flex-col items-center gap-3 rounded-3xl px-4 py-3 text-center"
                >
                  <span
                    aria-hidden
                    className="cosmic-float inline-block"
                    style={{ animationDelay: `${index * -1.7}s` }}
                  >
                    <PlanetSphere section={section} />
                  </span>

                  <span className="flex flex-col items-center gap-1">
                    <span className="text-base font-semibold tracking-tight text-cosmic-text transition-colors group-hover:text-cosmic-ice">
                      {section.name}
                    </span>
                    <span className="text-[0.65rem] font-medium uppercase tracking-[0.22em] text-cosmic-muted">
                      {section.latin}
                    </span>
                    <span className="max-w-[15rem] text-xs leading-relaxed text-cosmic-muted">
                      {section.tagline}
                    </span>
                  </span>
                </CosmicLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ------------------------------------------------------ 手机：纵向行星列表 */}
      <ul className="flex flex-col gap-3 md:hidden">
        {cosmicSections.map((section) => (
          <li key={section.id}>
            <CosmicLink
              href={section.href}
              variant="warp"
              className="group flex min-h-[64px] items-center gap-4 rounded-2xl border border-cosmic-line bg-white/[0.03] px-4 py-3.5 transition-colors hover:border-cosmic-ice/60 hover:bg-white/[0.06]"
            >
              <PlanetSphere section={section} size={44} />

              <span className="flex-1">
                <span className="block text-base font-medium text-cosmic-text">
                  {section.name}
                  <span className="ml-2 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-cosmic-muted">
                    {section.latin}
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-cosmic-muted">
                  {section.tagline} · {section.description}
                </span>
              </span>

              <ArrowRightIcon
                width={16}
                height={16}
                className="shrink-0 text-cosmic-muted transition-transform group-hover:translate-x-0.5 group-hover:text-cosmic-ice"
              />
            </CosmicLink>
          </li>
        ))}
      </ul>
    </div>
  );
}