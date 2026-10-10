import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PostToc from "@/components/blog/PostToc";
import CosmicLink from "@/components/cosmic/CosmicLink";
import { Chip, StatusBadge } from "@/components/ui/Badge";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GithubIcon,
} from "@/components/ui/Icons";
import { getAllPosts } from "@/lib/posts";
import { getAllProjects, getProject } from "@/lib/projects";
import { siteConfig } from "@/lib/site";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "项目不存在" };

  return {
    title: project.name,
    description: project.description,
    keywords: project.techStack,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      title: project.name,
      description: project.description,
      url: `${siteConfig.url}/projects/${project.slug}`,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) notFound();

  // 关联文章：project.article 存的是文章 slug
  const linkedPost = project.article
    ? (getAllPosts().find((post) => post.slug === project.article) ?? null)
    : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <CosmicLink
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon width={15} height={15} />
        返回项目列表
      </CosmicLink>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0">
          <article>
            <header className="border-b border-border pb-8">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={project.status} />
                {project.period ? <Chip>{project.period}</Chip> : null}
                {project.role ? <Chip>{project.role}</Chip> : null}
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
                {project.name}
              </h1>

              <p className="mt-4 text-base leading-relaxed text-muted">
                {project.description}
              </p>

              {project.techStack.length > 0 ? (
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {project.techStack.map((tech) => (
                    <li key={tech}>
                      <Chip>{tech}</Chip>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {project.github ? (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                  >
                    <GithubIcon width={15} height={15} />
                    查看源码
                  </a>
                ) : null}

                {project.demo ? (
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-elevated px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/50"
                  >
                    <ExternalLinkIcon width={15} height={15} />
                    在线演示
                  </a>
                ) : null}

                {linkedPost ? (
                  <CosmicLink
                    href={`/blog/${linkedPost.slug}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-elevated px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/50"
                  >
                    <FileTextIcon width={15} height={15} />
                    相关文章
                  </CosmicLink>
                ) : null}
              </div>
            </header>

            <div
              className="prose prose-slate mt-8 max-w-none"
              dangerouslySetInnerHTML={{ __html: project.html }}
            />
          </article>

          {linkedPost ? (
            <section className="mt-12 border-t border-border pt-8">
              <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
                相关文章
              </h2>
              <CosmicLink
                href={`/blog/${linkedPost.slug}`}
                className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-elevated p-4 transition-colors hover:border-accent/50"
              >
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    {linkedPost.title}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {linkedPost.description}
                  </span>
                </span>
                <ArrowRightIcon
                  width={16}
                  height={16}
                  className="shrink-0 text-accent transition-transform group-hover:translate-x-0.5"
                />
              </CosmicLink>
            </section>
          ) : null}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <PostToc items={project.headings} />
          </div>
        </aside>
      </div>
    </div>
  );
}