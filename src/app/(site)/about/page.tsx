import type { Metadata } from "next";

import CosmicLink from "@/components/cosmic/CosmicLink";
import SectionIntro from "@/components/cosmic/SectionIntro";
import { TechChip } from "@/components/ui/Badge";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  GithubIcon,
  LayersIcon,
  MailIcon,
  MapPinIcon,
} from "@/components/ui/Icons";
import { aboutMeta } from "@/lib/cosmic";
import { getAllCategories, getAllPosts } from "@/lib/posts";
import { getAllProjects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "关于",
  description: `关于 ${siteConfig.author}：${siteConfig.role}，关注机器学习建模、农业数据挖掘、RAG 与 LLM 工程实践。`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const posts = getAllPosts();
  const projects = getAllProjects();
  const categories = getAllCategories();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      {/* 与其它分区页共用同一套页头（返回星图 + eyebrow + 入场动效），
          不再自己拼一遍「返回星图」链接 + 一个纯文本页头 */}
      <SectionIntro
        section={aboutMeta}
        title={`关于 ${siteConfig.author}`}
        description={siteConfig.role}
      />

      {/* 概览数字 */}
      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "文章", value: posts.length },
          { label: "项目", value: projects.length },
          { label: "分类", value: categories.length },
          { label: "专注方向", value: siteConfig.focus.length },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-elevated px-4 py-5 text-center"
          >
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-foreground">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* 简介 */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          我是谁
        </h2>
        <div className="mt-4 space-y-4">
          {siteConfig.bio.map((paragraph) => (
            <p key={paragraph} className="max-w-3xl text-base leading-relaxed text-muted">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
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
        </div>
      </section>

      {/* 关注方向 */}
      <section className="mt-14 border-t border-border pt-10">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          关注方向
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {siteConfig.focus.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-xl border border-border bg-elevated px-4 py-4 text-sm text-foreground"
            >
              <CheckCircleIcon
                width={16}
                height={16}
                className="mt-0.5 shrink-0 text-accent"
              />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* 技术栈 */}
      <section className="mt-14 border-t border-border pt-10">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          技术栈
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {siteConfig.techStack.map((group) => (
            <div
              key={group.group}
              className="rounded-xl border border-border bg-elevated p-5"
            >
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <LayersIcon width={15} height={15} className="text-accent" />
                {group.group}
              </h3>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <li key={item}>
                    <TechChip>{item}</TechChip>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 经历 */}
      <section className="mt-14 border-t border-border pt-10">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">经历</h2>

        <ol className="mt-5 space-y-6 border-l border-border pl-6">
          {siteConfig.experiences.map((item) => (
            <li key={`${item.period}-${item.title}`} className="relative">
              <span
                aria-hidden
                className="absolute -left-[1.72rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent"
              />
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {item.period}
              </p>
              <h3 className="mt-1 text-base font-semibold text-foreground">
                {item.title}
                <span className="ml-2 text-sm font-normal text-muted">{item.org}</span>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
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
            </li>
          ))}
        </ol>

        <h3 className="mt-10 text-base font-semibold text-foreground">教育背景</h3>
        <ul className="mt-4 space-y-3">
          {siteConfig.education.map((item) => (
            <li key={`${item.period}-${item.school}`} className="text-sm text-muted">
              <span className="font-medium text-foreground">{item.school}</span>
              <span className="mx-2">·</span>
              {item.major}
              <span className="mx-2">·</span>
              {item.period}
              {item.note ? (
                <span className="mt-1 block text-xs">{item.note}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {/* 下一步 */}
      <section className="mt-14 border-t border-border pt-10">
        <div className="flex flex-wrap items-center gap-3">
          <CosmicLink
            href="/resume"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
          >
            查看简历
            <ArrowRightIcon width={15} height={15} />
          </CosmicLink>
          <CosmicLink
            href="/blog"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-elevated px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent/50"
          >
            阅读文章
          </CosmicLink>
        </div>
      </section>
    </div>
  );
}