import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { extractHeadings, renderMarkdown } from "./markdown";
import { PROJECT_STATUSES, type Project, type ProjectMeta, type ProjectStatus } from "@/types";

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");

type Frontmatter = {
  name?: unknown;
  description?: unknown;
  techStack?: unknown;
  status?: unknown;
  period?: unknown;
  role?: unknown;
  github?: unknown;
  demo?: unknown;
  article?: unknown;
  featured?: unknown;
  order?: unknown;
};

function listProjectFiles(): string[] {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  return fs
    .readdirSync(PROJECTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort();
}

function requireString(value: unknown, field: string, file: string): string {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  throw new Error(`[content/projects/${file}] frontmatter 缺少必填字段 "${field}"`);
}

function optionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  return undefined;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toStatus(value: unknown, file: string): ProjectStatus {
  if (typeof value === "string" && (PROJECT_STATUSES as readonly string[]).includes(value)) {
    return value as ProjectStatus;
  }
  throw new Error(
    `[content/projects/${file}] 字段 "status" 必须是 ${PROJECT_STATUSES.join(" / ")} 之一`,
  );
}

type ParsedProject = {
  meta: ProjectMeta;
  body: string;
};

function parseProjectFile(file: string): ParsedProject {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(PROJECTS_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const frontmatter = data as Frontmatter;

  const meta: ProjectMeta = {
    slug,
    name: requireString(frontmatter.name, "name", file),
    description: requireString(frontmatter.description, "description", file),
    techStack: toStringArray(frontmatter.techStack),
    status: toStatus(frontmatter.status, file),
    period: optionalString(frontmatter.period),
    role: optionalString(frontmatter.role),
    github: optionalString(frontmatter.github),
    demo: optionalString(frontmatter.demo),
    article: optionalString(frontmatter.article),
    featured: frontmatter.featured === true,
    order: typeof frontmatter.order === "number" ? frontmatter.order : 999,
  };

  return { meta, body: content };
}

function readAllParsedProjects(): ParsedProject[] {
  return listProjectFiles()
    .map(parseProjectFile)
    .sort((a, b) => a.meta.order - b.meta.order || a.meta.name.localeCompare(b.meta.name));
}

/** 全部项目元信息 */
export function getAllProjects(): ProjectMeta[] {
  return readAllParsedProjects().map((project) => project.meta);
}

/** 首页展示的精选项目 */
export function getFeaturedProjects(limit = 3): ProjectMeta[] {
  const projects = getAllProjects();
  const featured = projects.filter((project) => project.featured);
  return (featured.length > 0 ? featured : projects).slice(0, limit);
}

/**
 * 单个项目（含渲染后的 HTML 与目录）。
 * 与 getPost 同理：按 slug 缓存重计算，并隔离 Shiki 内部对 `Date.now()` 的读取。
 */
export async function getProject(slug: string): Promise<Project | null> {
  "use cache";

  const parsed = readAllParsedProjects().find((project) => project.meta.slug === slug);
  if (!parsed) return null;

  const [html, headings] = await Promise.all([
    renderMarkdown(parsed.body),
    Promise.resolve(extractHeadings(parsed.body)),
  ]);

  return { ...parsed.meta, html, headings };
}