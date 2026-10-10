import type { Metadata } from "next";

import SectionIntro from "@/components/cosmic/SectionIntro";
import { EmptyState } from "@/components/ui/SectionHeading";
import { getSection } from "@/lib/cosmic";
import { getAllGoals } from "@/lib/goals";
import { siteConfig } from "@/lib/site";
import type { GoalHorizon, GoalStatus } from "@/types";

export const metadata: Metadata = {
  title: "目标",
  description: `${siteConfig.author} 的短期与长期目标、进度与里程碑。`,
  alternates: { canonical: "/goals" },
};

/** 展示顺序与文案（只影响呈现，不影响数据） */
const HORIZONS: { id: GoalHorizon; label: string; latin: string }[] = [
  { id: "short", label: "短期", latin: "SHORT TERM" },
  { id: "mid", label: "中期", latin: "MID TERM" },
  { id: "long", label: "长期", latin: "LONG TERM" },
];

const STATUS_LABELS: Record<GoalStatus, string> = {
  planned: "计划中",
  active: "进行中",
  done: "已完成",
  paused: "已暂停",
};

/**
 * 目标清单（/goals）。
 *
 * 只展示 frontmatter 里真实写下的数据：进度条宽度来自 `progress`，
 * 里程碑的勾选状态来自 `milestones[].done`。页面不做任何推测或美化，
 * `progress: 0` 就老老实实显示 0%。
 */
export default async function GoalsPage() {
  const section = getSection("goals");
  const goals = await getAllGoals();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <SectionIntro
        section={section}
        title="目标"
        description="短期与长期目标、当前状态、进度与里程碑。进度与勾选状态全部来自 content/goals 下的 frontmatter。"
      />

      {goals.length === 0 ? (
        <div className="mt-10">
          <EmptyState>
            还没有目标。在 content/goals 下新建一个 .md 文件即可（需要 title / horizon /
            status / progress 四个字段）。
          </EmptyState>
        </div>
      ) : (
        <div className="mt-10 space-y-12">
          {HORIZONS.map(({ id, label, latin }) => {
            const group = goals.filter((goal) => goal.horizon === id);
            if (group.length === 0) return null;

            return (
              <section key={id}>
                <h2 className="flex items-baseline gap-2 text-lg font-semibold tracking-tight text-foreground">
                  {label}
                  <span className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
                    {latin}
                  </span>
                </h2>

                <ul className="mt-4 space-y-4">
                  {group.map((goal) => (
                    <li
                      key={goal.slug}
                      className="cosmic-enter rounded-xl border border-border bg-elevated p-5"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h3 className="text-base font-semibold tracking-tight text-foreground">
                          {goal.title}
                        </h3>
                        <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-muted">
                          {STATUS_LABELS[goal.status]}
                        </span>
                        {goal.period ? (
                          <span className="text-xs text-muted">{goal.period}</span>
                        ) : null}
                      </div>

                      {/* 进度：用原生 progressbar 语义，读屏软件能读出数值 */}
                      <div className="mt-4 flex items-center gap-3">
                        <div
                          role="progressbar"
                          aria-valuenow={goal.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${goal.title} 进度`}
                          className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface"
                        >
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${goal.progress}%`,
                              backgroundColor: section.accent,
                            }}
                          />
                        </div>
                        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted">
                          {goal.progress}%
                        </span>
                      </div>

                      {goal.milestones.length > 0 ? (
                        <ul className="mt-4 space-y-2">
                          {goal.milestones.map((milestone) => (
                            <li
                              key={milestone.title}
                              className="flex items-start gap-2 text-sm text-muted"
                            >
                              <span
                                aria-hidden
                                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                  milestone.done ? "bg-accent" : "bg-border"
                                }`}
                              />
                              <span className={milestone.done ? "text-foreground" : undefined}>
                                {milestone.title}
                                <span className="sr-only">
                                  {milestone.done ? "（已完成）" : "（未完成）"}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      <div
                        className="prose prose-slate mt-5 max-w-none text-sm"
                        dangerouslySetInnerHTML={{ __html: goal.html }}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}