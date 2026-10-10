import CosmicLink from "@/components/cosmic/CosmicLink";
import { Chip, StatusBadge } from "@/components/ui/Badge";
import { ArrowRightIcon, ExternalLinkIcon, GithubIcon } from "@/components/ui/Icons";
import { hueFromSlug } from "@/lib/format";
import type { ProjectMeta } from "@/types";

/**
 * 项目卡片。
 * 封面使用「由 slug 推导出的稳定渐变 + 首字母」，不依赖任何外部图片资源，
 * 保持仓库轻量，也避免图片加载失败。
 */
export default function ProjectCard({ project }: { project: ProjectMeta }) {
  const hue = hueFromSlug(project.slug);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-elevated transition-colors hover:border-accent/50">
      <div
        className="relative flex h-28 items-center justify-between px-5"
        style={{
          backgroundImage: `linear-gradient(135deg, hsl(${hue} 65% 46%), hsl(${
            (hue + 48) % 360
          } 60% 32%))`,
        }}
      >
        <span
          aria-hidden
          className="text-4xl font-bold text-white/90 drop-shadow-sm"
        >
          {project.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/90 backdrop-blur">
          {project.period ?? "项目"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} />
          {project.role ? <Chip>{project.role}</Chip> : null}
        </div>

        <h3 className="mt-3 text-base font-semibold tracking-tight text-foreground sm:text-lg">
          <CosmicLink
            href={`/projects/${project.slug}`}
            className="after:absolute after:inset-0"
          >
            {project.name}
          </CosmicLink>
        </h3>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          {project.description}
        </p>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {project.techStack.slice(0, 5).map((tech) => (
            <li key={tech}>
              <Chip>{tech}</Chip>
            </li>
          ))}
        </ul>
      </div>

      {/* 卡片外的独立链接：用 relative 容器避免被整卡链接覆盖 */}
      <div className="relative z-10 flex flex-wrap items-center gap-4 border-t border-border px-5 py-3 text-sm">
        <CosmicLink
          href={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1 font-medium text-accent transition-colors hover:text-accent-hover"
        >
          查看详情
          <ArrowRightIcon
            width={15}
            height={15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </CosmicLink>

        {project.github ? (
          <a
            href={project.github}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-foreground"
          >
            <GithubIcon width={15} height={15} />
            GitHub
          </a>
        ) : null}

        {project.demo ? (
          <a
            href={project.demo}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-foreground"
          >
            <ExternalLinkIcon width={15} height={15} />
            Demo
          </a>
        ) : null}
      </div>
    </article>
  );
}