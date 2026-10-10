import type { Metadata } from "next";

import CosmicLink from "@/components/cosmic/CosmicLink";
import SectionIntro from "@/components/cosmic/SectionIntro";
import { Chip } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/SectionHeading";
import { ArrowRightIcon, CalendarIcon } from "@/components/ui/Icons";
import { getSection } from "@/lib/cosmic";
import { getAllDiaryEntries } from "@/lib/diary";
import { formatDate } from "@/lib/format";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "日记",
  description: `${siteConfig.author} 的观测日志：安静、持续、按时间排列的记录。`,
  alternates: { canonical: "/diary" },
};

/**
 * 日记时间轴（/diary）。
 *
 * 结构很简单：一条纵向时间轴，每条记录一行，整行可点。
 * `content/diary/` 里目前是明确标注的占位内容 —— 请替换成你的真实记录。
 */
export default function DiaryPage() {
  const section = getSection("diary");
  const entries = getAllDiaryEntries();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <SectionIntro
        section={section}
        title="日记"
        description="安静、私密、持续记录的时间线。这里的每一条都按日期倒序排列。"
      />

      <div className="mt-10">
        {entries.length === 0 ? (
          <EmptyState>
            还没有日记。在 content/diary 下新建一个 .md 文件即可（需要 date / title / summary
            三个字段）。
          </EmptyState>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-6">
            {entries.map((entry) => (
              <li key={entry.slug} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[1.78rem] top-4 h-2.5 w-2.5 rounded-full border-2 border-background"
                  style={{ backgroundColor: section.accent }}
                />

                <CosmicLink
                  href={`/diary/${entry.slug}`}
                  className="group block rounded-xl border border-border bg-elevated px-4 py-4 transition-colors hover:border-accent/50"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarIcon width={13} height={13} />
                      <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                    </span>
                    {entry.mood ? <span>· {entry.mood}</span> : null}
                  </div>

                  <h2 className="mt-2 text-base font-semibold tracking-tight text-foreground">
                    {entry.title}
                  </h2>

                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {entry.summary}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <ul className="flex flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
                        <li key={tag}>
                          <Chip>{tag}</Chip>
                        </li>
                      ))}
                    </ul>

                    <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
                      阅读
                      <ArrowRightIcon
                        width={15}
                        height={15}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </CosmicLink>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}