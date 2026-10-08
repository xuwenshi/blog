import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { extractHeadings, renderMarkdown } from "./markdown";
import type { Post, PostMeta, TagCount } from "@/types";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/** 生产构建时隐藏 draft: true 的文章 */
const includeDrafts = process.env.NODE_ENV !== "production";

type Frontmatter = {
  title?: unknown;
  description?: unknown;
  date?: unknown;
  tags?: unknown;
  category?: unknown;
  cover?: unknown;
  draft?: unknown;
};

function listPostFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort();
}

/** frontmatter 中的日期可能是字符串，也可能被 YAML 解析成 Date */
function normalizeDate(value: unknown, file: string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  throw new Error(
    `[content/blog/${file}] frontmatter 缺少必填字段 "date"（建议写成 "2026-10-08"）`,
  );
}

function requireString(value: unknown, field: string, file: string): string {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  throw new Error(
    `[content/blog/${file}] frontmatter 缺少必填字段 "${field}"`,
  );
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

/**
 * 估算阅读时间（分钟）。
 * 中文按 350 字/分钟、英文按 200 词/分钟计算，并对代码块做一定折扣。
 */
function estimateReadingTime(markdown: string): number {
  const cjkPattern = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g;
  const cjkCount = (markdown.match(cjkPattern) ?? []).length;
  const latinCount = (
    markdown.replace(cjkPattern, " ").match(/[A-Za-z0-9_'-]+/g) ?? []
  ).length;

  const minutes = cjkCount / 350 + latinCount / 200;
  return Math.max(1, Math.round(minutes));
}

type ParsedPost = {
  meta: PostMeta;
  body: string;
};

/** 解析单个文章文件（未渲染 HTML），列表页只需元信息 */
function parsePostFile(file: string): ParsedPost {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const frontmatter = data as Frontmatter;

  const meta: PostMeta = {
    slug,
    title: requireString(frontmatter.title, "title", file),
    description: requireString(frontmatter.description, "description", file),
    date: normalizeDate(frontmatter.date, file),
    tags: toStringArray(frontmatter.tags),
    category:
      typeof frontmatter.category === "string" && frontmatter.category.trim() !== ""
        ? frontmatter.category.trim()
        : "未分类",
    cover:
      typeof frontmatter.cover === "string" && frontmatter.cover.trim() !== ""
        ? frontmatter.cover.trim()
        : undefined,
    draft: frontmatter.draft === true,
    readingTime: estimateReadingTime(content),
  };

  return { meta, body: content };
}

function readAllParsedPosts(): ParsedPost[] {
  return listPostFiles()
    .map(parsePostFile)
    .filter((post) => includeDrafts || !post.meta.draft);
}

/** 全部文章元信息，按日期倒序（新文章在前） */
export function getAllPosts(): PostMeta[] {
  return readAllParsedPosts()
    .map((post) => post.meta)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** 首页 / 侧栏使用的精选文章 */
export function getRecentPosts(limit = 3): PostMeta[] {
  return getAllPosts().slice(0, limit);
}

/**
 * 单篇文章（含渲染后的 HTML 与目录）。
 *
 * 标记 `use cache` 有两个原因：
 * 1. 代码高亮是这里最重的计算，按 slug 缓存后列表 / 详情 / 元数据只算一次；
 * 2. Shiki 底层的 vscode-textmate 在分词时会读取 `Date.now()`（用于超时保护），
 *    在 Cache Components 模式下这属于「不稳定值」，必须放进缓存作用域里。
 */
export async function getPost(slug: string): Promise<Post | null> {
  "use cache";

  const parsed = readAllParsedPosts().find((post) => post.meta.slug === slug);
  if (!parsed) return null;

  const [html, headings] = await Promise.all([
    renderMarkdown(parsed.body),
    Promise.resolve(extractHeadings(parsed.body)),
  ]);

  return { ...parsed.meta, html, headings };
}

/** 上一篇 / 下一篇（按时间顺序，新文章在前） */
export function getAdjacentPosts(slug: string): {
  prev: PostMeta | null;
  next: PostMeta | null;
} {
  const posts = getAllPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return { prev: null, next: null };

  return {
    // 列表是倒序的：index - 1 更新，index + 1 更旧
    prev: index > 0 ? posts[index - 1] : null,
    next: index < posts.length - 1 ? posts[index + 1] : null,
  };
}

/** 相关文章：优先标签重合，其次同分类 */
export function getRelatedPosts(slug: string, limit = 3): PostMeta[] {
  const posts = getAllPosts();
  const current = posts.find((post) => post.slug === slug);
  if (!current) return [];

  return posts
    .filter((post) => post.slug !== slug)
    .map((post) => {
      const sharedTags = post.tags.filter((tag) => current.tags.includes(tag)).length;
      const sameCategory = post.category === current.category ? 1 : 0;
      return { post, score: sharedTags * 2 + sameCategory };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
    .slice(0, limit)
    .map((entry) => entry.post);
}

/** 全部标签及数量，按数量倒序 */
export function getAllTags(): TagCount[] {
  const counter = new Map<string, number>();

  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      counter.set(tag, (counter.get(tag) ?? 0) + 1);
    }
  }

  return [...counter.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** 全部分类及数量 */
export function getAllCategories(): TagCount[] {
  const counter = new Map<string, number>();

  for (const post of getAllPosts()) {
    counter.set(post.category, (counter.get(post.category) ?? 0) + 1);
  }

  return [...counter.entries()]
    .map(([category, count]) => ({ tag: category, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}