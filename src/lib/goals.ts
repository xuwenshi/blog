import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { extractHeadings, renderMarkdown } from "./markdown";
import {
  GOAL_HORIZONS,
  GOAL_STATUSES,
  type Goal,
  type GoalHorizon,
  type GoalMilestone,
  type GoalStatus,
} from "@/types";

/**
 * 目标内容读取（content/goals/*.md）。
 *
 * `progress` 只来自 frontmatter，不做任何推断 —— 仓库内的占位内容全部是 `0`，
 * 表示「还没有填写真实进度」，不是「已完成 0%」的暗示。
 */

const GOALS_DIR = path.join(process.cwd(), "content", "goals");

type Frontmatter = {
  title?: unknown;
  horizon?: unknown;
  status?: unknown;
  progress?: unknown;
  period?: unknown;
  order?: unknown;
  milestones?: unknown;
};

function listGoalFiles(): string[] {
  if (!fs.existsSync(GOALS_DIR)) return [];
  return fs
    .readdirSync(GOALS_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort();
}

function requireString(value: unknown, field: string, file: string): string {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  throw new Error(`[content/goals/${file}] frontmatter 缺少必填字段 "${field}"`);
}

function optionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  return undefined;
}

function toHorizon(value: unknown, file: string): GoalHorizon {
  if (typeof value === "string" && (GOAL_HORIZONS as readonly string[]).includes(value)) {
    return value as GoalHorizon;
  }
  throw new Error(
    `[content/goals/${file}] 字段 "horizon" 必须是 ${GOAL_HORIZONS.join(" / ")} 之一`,
  );
}

function toStatus(value: unknown, file: string): GoalStatus {
  if (typeof value === "string" && (GOAL_STATUSES as readonly string[]).includes(value)) {
    return value as GoalStatus;
  }
  throw new Error(
    `[content/goals/${file}] 字段 "status" 必须是 ${GOAL_STATUSES.join(" / ")} 之一`,
  );
}

/** 进度统一夹在 0-100，避免内容里写错数字把进度条画到容器外 */
function toProgress(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toMilestones(value: unknown): GoalMilestone[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as { title?: unknown; done?: unknown };
    if (typeof record.title !== "string" || record.title.trim() === "") return [];
    return [{ title: record.title.trim(), done: record.done === true }];
  });
}

type ParsedGoal = {
  meta: Omit<Goal, "html" | "headings">;
  body: string;
};

function parseGoalFile(file: string): ParsedGoal {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(GOALS_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const frontmatter = data as Frontmatter;

  const meta = {
    slug,
    title: requireString(frontmatter.title, "title", file),
    horizon: toHorizon(frontmatter.horizon, file),
    status: toStatus(frontmatter.status, file),
    progress: toProgress(frontmatter.progress),
    period: optionalString(frontmatter.period),
    order: typeof frontmatter.order === "number" ? frontmatter.order : 999,
    milestones: toMilestones(frontmatter.milestones),
  };

  return { meta, body: content };
}

function readAllParsedGoals(): ParsedGoal[] {
  return listGoalFiles()
    .map(parseGoalFile)
    .sort((a, b) => a.meta.order - b.meta.order || a.meta.title.localeCompare(b.meta.title));
}

/**
 * 全部目标（按 order 升序，含渲染后的 HTML）。
 *
 * 目标数量少、正文短，所以列表页直接一次性渲染完 —— 页面不需要 JS 就能展开阅读。
 * 与文章/项目/日记列表同理，必须走 `"use cache"` 隔离 Shiki 内部对 `Date.now()` 的读取。
 */
export async function getAllGoals(): Promise<Goal[]> {
  "use cache";

  const parsed = readAllParsedGoals();

  return Promise.all(
    parsed.map(async ({ meta, body }) => ({
      ...meta,
      // 正文嵌在卡片里（分组 h2 → 卡片标题 h3），Markdown 标题要降到卡片标题之下，
      // 所以整体下移两级：正文里的 ## 变成 h4，### 变成 h5。
      html: await renderMarkdown(body, { headingOffset: 2 }),
      headings: extractHeadings(body),
    })),
  );
}