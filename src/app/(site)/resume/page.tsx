import type { Metadata } from "next";

import SectionIntro from "@/components/cosmic/SectionIntro";
import { TechChip } from "@/components/ui/Badge";
import {
  CheckCircleIcon,
  DownloadIcon,
  GithubIcon,
  MailIcon,
  MapPinIcon,
} from "@/components/ui/Icons";
import { getSection } from "@/lib/cosmic";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "简历",
  description: `${siteConfig.author} 的简历：${siteConfig.role}，包含经历、技能与教育背景。`,
  alternates: { canonical: "/resume" },
};

export default function ResumePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <SectionIntro
        section={getSection("resume")}
        title="简历"
        description={`${siteConfig.author} · ${siteConfig.role}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          {siteConfig.resumePdfAvailable ? (
            <a
              href="/resume.pdf"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
            >
              <DownloadIcon width={15} height={15} />
              下载 PDF
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface px-4 py-2 text-xs text-muted">
              <DownloadIcon width={15} height={15} />
              暂未提供 PDF 版本，把文件放到 public/resume.pdf 并在
              src/lib/site.ts 中把 resumePdfAvailable 设为 true 即可启用
            </span>
          )}
        </div>
      </SectionIntro>

      {/* 联系方式 */}
      <section className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
        <span className="inline-flex items-center gap-2">
          <MapPinIcon width={15} height={15} />
          {siteConfig.location}
        </span>
        <a
          href={`mailto:${siteConfig.email}`}
          className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
        >
          <MailIcon width={15} height={15} />
          {siteConfig.email}
        </a>
        <a
          href={siteConfig.github}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
        >
          <GithubIcon width={15} height={15} />
          GitHub
        </a>
      </section>

      {/* 概述 */}
      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">概述</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{siteConfig.bio[0]}</p>
      </section>

      {/* 经历 */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">工作与项目经历</h2>

        <div className="mt-5 space-y-6">
          {siteConfig.experiences.map((item) => (
            <article
              key={`${item.period}-${item.title}`}
              className="rounded-xl border border-border bg-elevated p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="text-xs font-medium text-muted">{item.period}</p>
              </div>
              <p className="mt-1 text-sm text-muted">{item.org}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {item.description}
              </p>

              {item.highlights && item.highlights.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {item.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-start gap-2 text-sm text-muted"
                    >
                      <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {/* 技能 */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">技能</h2>

        <dl className="mt-5 space-y-4">
          {siteConfig.techStack.map((group) => (
            <div key={group.group} className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
              <dt className="text-sm font-medium text-foreground">{group.group}</dt>
              <dd>
                <ul className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li key={item}>
                      <TechChip>{item}</TechChip>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>

        <h3 className="mt-8 text-sm font-medium text-foreground">关注方向</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {siteConfig.focus.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted">
              <CheckCircleIcon
                width={15}
                height={15}
                className="mt-0.5 shrink-0 text-accent"
              />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* 教育 */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">教育背景</h2>
        <ul className="mt-5 space-y-4">
          {siteConfig.education.map((item) => (
            <li
              key={`${item.period}-${item.school}`}
              className="rounded-xl border border-border bg-elevated p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">{item.school}</h3>
                <p className="text-xs font-medium text-muted">{item.period}</p>
              </div>
              <p className="mt-1 text-sm text-muted">{item.major}</p>
              {item.note ? (
                <p className="mt-2 text-xs text-muted">{item.note}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}