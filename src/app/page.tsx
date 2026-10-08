import Link from "next/link";

import PostCard from "@/components/blog/PostCard";
import ProjectCard from "@/components/project/ProjectCard";
import SectionHeading from "@/components/ui/SectionHeading";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  GithubIcon,
  MailIcon,
  MapPinIcon,
  TagIcon,
} from "@/components/ui/Icons";
import { getRecentPosts } from "@/lib/posts";
import { getFeaturedProjects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";

const container = "mx-auto w-full max-w-5xl px-4 sm:px-6";

export default function HomePage() {
  // 内容在构建期读取：同步文件读取属于「可预测值」，因此首页会被完整预渲染
  const projects = getFeaturedProjects(3);
  const posts = getRecentPosts(3);

  return (
    <div className="pb-8">
      {/* ---------------------------------------------------------------- Hero */}
      <section className={`${container} pt-16 pb-14 sm:pt-20`}>
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          持续更新中
        </p>

        <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {siteConfig.author}
          <span className="mt-2 block text-2xl font-semibold text-muted sm:text-3xl">
            {siteConfig.role}
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          {siteConfig.tagline}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            浏览文章
            <ArrowRightIcon width={15} height={15} />
          </Link>

          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-elevated px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent/50"
          >
            查看项目
          </Link>

          <a
            href={siteConfig.github}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-elevated px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent/50"
          >
            <GithubIcon width={15} height={15} />
            GitHub
          </a>
        </div>

        <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted">
          <div className="inline-flex items-center gap-2">
            <MapPinIcon width={15} height={15} />
            <dt className="sr-only">所在地</dt>
            <dd>{siteConfig.location}</dd>
          </div>
          <div className="inline-flex items-center gap-2">
            <MailIcon width={15} height={15} />
            <dt className="sr-only">邮箱</dt>
            <dd>
              <a
                href={`mailto:${siteConfig.email}`}
                className="transition-colors hover:text-foreground"
              >
                {siteConfig.email}
              </a>
            </dd>
          </div>
        </dl>
      </section>

      {/* --------------------------------------------------------------- About */}
      <section className={`${container} border-t border-border py-14`}>
        <SectionHeading
          title="关于我"
          description="我在做什么，以及这个博客记录什么。"
          action={{ href: "/about", label: "了解更多" }}
        />

        <div className="grid gap-8 md:grid-cols-5">
          <div className="space-y-4 md:col-span-3">
            {siteConfig.bio.map((paragraph) => (
              <p key={paragraph} className="text-base leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="md:col-span-2">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <TagIcon width={15} height={15} className="text-accent" />
              当前关注
            </h3>
            <ul className="mt-3 space-y-2">
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
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Projects */}
      <section className={`${container} border-t border-border py-14`}>
        <SectionHeading
          title="精选项目"
          description="每个项目都说明为什么这样设计、解决了什么问题、最终效果如何。"
          action={{ href: "/projects", label: "全部项目" }}
        />

        {projects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-muted">
            还没有项目。在 content/projects 下新建一个 .md 文件即可。
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        )}
      </section>

      {/* --------------------------------------------------------------- Posts */}
      <section className={`${container} border-t border-border py-14`}>
        <SectionHeading
          title="最新文章"
          description="问题 → 原理 → 实现 → 实验 → 踩坑 → 总结。"
          action={{ href: "/blog", label: "全部文章" }}
        />

        {posts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-muted">
            还没有文章。在 content/blog 下新建一个 .md 文件即可。
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------- TechStack */}
      <section className={`${container} border-t border-border py-14`}>
        <SectionHeading
          title="技术栈"
          description="日常使用、并且能说清楚为什么用它们的工具。"
        />

        <div className="grid gap-5 sm:grid-cols-3">
          {siteConfig.techStack.map((group) => (
            <div
              key={group.group}
              className="rounded-xl border border-border bg-elevated p-5"
            >
              <h3 className="text-sm font-semibold text-foreground">{group.group}</h3>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <li key={item}>
                    <span className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-muted">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- Contact */}
      <section className={`${container} border-t border-border pt-14`}>
        <div className="rounded-2xl border border-border bg-surface px-6 py-10 text-center sm:px-10">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            想聊聊？
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
            对文章有疑问，或者想讨论数据建模、RAG 工程相关的话题，欢迎通过邮件或 GitHub
            联系我。
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`mailto:${siteConfig.email}`}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <MailIcon width={15} height={15} />
              发邮件
            </a>
            <Link
              href="/resume"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-elevated px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent/50"
            >
              查看简历
              <ArrowRightIcon width={15} height={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}