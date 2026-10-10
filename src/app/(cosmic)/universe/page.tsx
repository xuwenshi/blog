import type { Metadata } from "next";

import PostCard from "@/components/blog/PostCard";
import CosmicLink from "@/components/cosmic/CosmicLink";
import Starfield from "@/components/cosmic/Starfield";
import StarMap from "@/components/cosmic/StarMap";
import ProjectCard from "@/components/project/ProjectCard";
import { ArrowLeftIcon } from "@/components/ui/Icons";
import SectionHeading, { EmptyState } from "@/components/ui/SectionHeading";
import { getRecentPosts } from "@/lib/posts";
import { getFeaturedProjects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "星图",
  description: `${siteConfig.author} 的五大行星分区导航：简历、项目、文章、日记、目标。`,
  alternates: { canonical: "/universe" },
};

/**
 * 星图（/universe）。
 *
 * 这里是「入口 → 各分区」的中转站：五颗大行星分别对应五个真实路由。
 * 页面下方的「本星系最新动态」承载了原首页的精选项目与最新文章，
 * 保证这些内容仍然可以在入口两跳以内到达（内容没有被删除）。
 */
export default function UniversePage() {
  const projects = getFeaturedProjects(3);
  const posts = getRecentPosts(3);

  return (
    <div className="relative flex-1">
      <Starfield />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col px-5 py-14 sm:px-8 sm:py-16">
        <header className="cosmic-enter">
          <CosmicLink
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-cosmic-muted transition-colors hover:text-cosmic-text"
          >
            <ArrowLeftIcon width={15} height={15} />
            返回星海入口
          </CosmicLink>

          <p className="mt-6 inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-cosmic-ice">
            <span aria-hidden className="cosmic-pulse h-1.5 w-1.5 rounded-full bg-cosmic-ice" />
            Star Map
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-cosmic-text sm:text-4xl">
            星图
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-cosmic-muted">
            五颗行星，五个分区。选择一颗进入 —— 简历、项目、文章、日记、目标。
          </p>
        </header>

        <div className="cosmic-enter mt-12 sm:mt-16">
          <StarMap />
        </div>

        {/* ------------------------------------------- 本星系最新动态（原首页内容） */}
        <section className="mt-20 border-t border-cosmic-line pt-12">
          <SectionHeading
            title="工程星 · 精选项目"
            description="每个项目都说明为什么这样设计、解决了什么问题、最终效果如何。"
            action={{ href: "/projects", label: "全部项目" }}
          />

          {projects.length === 0 ? (
            <EmptyState>还没有项目。在 content/projects 下新建一个 .md 文件即可。</EmptyState>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-16">
          <SectionHeading
            title="知识星环 · 最新文章"
            description="问题 → 原理 → 实现 → 实验 → 踩坑 → 总结。"
            action={{ href: "/blog", label: "全部文章" }}
          />

          {posts.length === 0 ? (
            <EmptyState>还没有文章。在 content/blog 下新建一个 .md 文件即可。</EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}