import type { Metadata } from "next";

import SectionIntro from "@/components/cosmic/SectionIntro";
import ProjectCard from "@/components/project/ProjectCard";
import { getSection } from "@/lib/cosmic";
import { getAllProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "项目",
  description: "数据建模、RAG 工程与前端实践的项目作品集，包含背景、目标、技术选型与实验结果。",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <SectionIntro
        section={getSection("projects")}
        title="项目"
        description="这里记录我做过的完整项目。每个项目都会说明背景、目标、技术选型的理由、核心实现、遇到的问题以及最终结果。"
      >
        <p className="text-sm text-muted">
          共 <span className="font-medium text-foreground">{projects.length}</span> 个项目
        </p>
      </SectionIntro>

      <div className="mt-8">
        {projects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-muted">
            还没有项目。在 content/projects 下新建一个 .md 文件即可。
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}