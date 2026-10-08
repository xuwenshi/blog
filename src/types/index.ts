/** 文章 / 项目等内容类型的统一定义，供 lib 与 UI 共同使用。 */

/** 文章目录项（由 Markdown 的 h2 / h3 生成） */
export type TocItem = {
  /** 与正文标题 id 一致，用于锚点跳转 */
  id: string;
  text: string;
  /** 2 = h2，3 = h3 */
  level: number;
};

/** 文章元信息（frontmatter + 计算字段） */
export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  /** ISO 日期字符串，如 2026-10-08 */
  date: string;
  tags: string[];
  category: string;
  cover?: string;
  draft: boolean;
  /** 预计阅读时间（分钟） */
  readingTime: number;
};

/** 文章完整内容 */
export type Post = PostMeta & {
  /** 渲染后的 HTML */
  html: string;
  headings: TocItem[];
};

export const PROJECT_STATUSES = [
  "active",
  "in-progress",
  "completed",
  "archived",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** 项目元信息 */
export type ProjectMeta = {
  slug: string;
  name: string;
  description: string;
  techStack: string[];
  status: ProjectStatus;
  /** 项目周期，如 2026.03 - 2026.08 */
  period?: string;
  /** 我在项目中的角色 */
  role?: string;
  github?: string;
  demo?: string;
  /** 关联的文章 slug */
  article?: string;
  featured: boolean;
  order: number;
};

/** 项目完整内容 */
export type Project = ProjectMeta & {
  html: string;
  headings: TocItem[];
};

/** 标签及其文章数量 */
export type TagCount = {
  tag: string;
  count: number;
};