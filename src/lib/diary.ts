import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { extractHeadings, renderMarkdown } from "./markdown";
import type { DiaryEntry, DiaryMeta } from "@/types";

/**
 * 日记内容读取（content/diary/*.md）。
 *
 * 与 posts / projects 保持同一套约定：
 * - 只读取 frontmatter 的函数是同步的（构建期可预测）；
 * - 需要渲染 Markdown 的函数带 `"use cache"`，隔离 Shiki 内部对 `Date.now()` 的读取。
 */

const DIARY_DIR = path.join(process.cwd(), "content", "diary");

/** 开发环境显示草稿，生产环境隐藏 */
const includeDrafts = process.env.NODE_ENV !== "production";

type Frontmatter = {
  title?: unknown;
  summary?: unknown;
  date?: unknown;
  mood?: unknown;
  tags?: unknown;
  draft?: unknown;
};

function listDiaryFiles(): string[] {
  if (!fs.existsSync(DIARY_DIR)) return [];
  return fs
    .readdirSync(DIARY_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort();
}

function requireString(value: unknown, field: string, file: string): string {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  throw new Error(`[content/diary/${file}] frontmatter 缺少必填字段 "${field}"`);
}

function optionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  return undefined;
}

/** frontmatter 里的日期可能是字符串，也可能被 YAML 解析成 Date（与 posts.ts 同一处理） */
function normalizeDate(value: unknown, file: string): string {
  const raw =
    value instanceof Date
      ? value.toISOString().slice(0, 10)
      : typeof value === "string"
        ? value.trim()
        : "";

  if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    throw new Error(
      `[content/diary/${file}] frontmatter 缺少必填字段 "date"（写成 "2026-10-10" 最稳妥）`,
    );
  }
  return raw;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

type ParsedDiary = {
  meta: DiaryMeta;
  body: string;
};

function parseDiaryFile(file: string): ParsedDiary {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(DIARY_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const frontmatter = data as Frontmatter;

  const date = normalizeDate(frontmatter.date, file);

  const meta: DiaryMeta = {
    slug,
    title: requireString(frontmatter.title, "title", file),
    summary: requireString(frontmatter.summary, "summary", file),
    date,
    mood: optionalString(frontmatter.mood),
    tags: toStringArray(frontmatter.tags),
    draft: frontmatter.draft === true,
  };

  return { meta, body: content };
}

/** 全部日记（按日期倒序；开发环境包含草稿） */
function readAllParsedDiary(): ParsedDiary[] {
  return listDiaryFiles()
    .map(parseDiaryFile)
    .filter((entry) => includeDrafts || !entry.meta.draft)
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date) || a.meta.slug.localeCompare(b.meta.slug));
}

/** 全部日记元信息 */
export function getAllDiaryEntries(): DiaryMeta[] {
  return readAllParsedDiary().map((entry) => entry.meta);
}

/**
 * 可供 `generateStaticParams` 使用的 slug 列表。
 *
 * 注意：Next 16 在 Cache Components 模式下**不允许返回空数组**，
 * 所以 `content/diary/` 至少需要保留 1 篇内容（仓库内已附带明确标注的占位日记）。
 */
export function getDiarySlugs(): string[] {
  return getAllDiaryEntries().map((entry) => entry.slug);
}

/** 单篇日记（含渲染后的 HTML 与目录） */
export async function getDiaryEntry(slug: string): Promise<DiaryEntry | null> {
  "use cache";

  const parsed = readAllParsedDiary().find((entry) => entry.meta.slug === slug);
  if (!parsed) return null;

  const [html, headings] = await Promise.all([
    renderMarkdown(parsed.body),
    Promise.resolve(extractHeadings(parsed.body)),
  ]);

  return { ...parsed.meta, html, headings };
}