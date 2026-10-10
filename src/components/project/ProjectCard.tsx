import CosmicLink from "@/components/cosmic/CosmicLink";
import { Chip, StatusBadge } from "@/components/ui/Badge";
import { ArrowRightIcon, ExternalLinkIcon, GithubIcon } from "@/components/ui/Icons";
import type { ProjectMeta } from "@/types";

/**
 * 项目卡片。
 *
 * 封面不用真实图片：改由「统一的深空底 + 主强调色柔光 + 项目首字母」构成。
 * 早先的版本按 slug 哈希出随机色相，问题有两个：
 * ① 卡片之间颜色互不相关，视觉上像拼贴，破坏设计系统的一致性；
 * ② 随机色相里的深色配白字，没有经过对比度校验。
 * 现在封面色走宇宙层恒定令牌（--cosmic-deep / --cosmic-void / --cosmic-text），
 * 无论 Light 还是 Dark 主题都是同一块深空底，白字对比度稳定在 17:1 以上。
 */
export default function ProjectCard({ project }: { project: ProjectMeta }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-elevated transition-colors hover:border-accent/50">
      <div
        className="relative flex h-28 items-center justify-between overflow-hidden px-5"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--cosmic-deep), var(--cosmic-void))",
        }}
      >
        {/* 主强调色的柔光，给统一的深空底一点层次，不改变整体一致性 */}
        <span
          aria-hidden
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(120% 130% at 18% 0%, var(--accent), transparent 58%)",
          }}
        />
        <span
          aria-hidden
          className="relative text-4xl font-bold text-cosmic-text drop-shadow-sm"
        >
          {project.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="relative rounded-full border border-cosmic-line bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-cosmic-text backdrop-blur">
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