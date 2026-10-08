/** 统一的日期展示：把 2026-10-08 显示成 2026 年 10 月 8 日 */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;

  const [, year, month, day] = match;
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

/** 项目卡片 / 详情页用的技术栈标签去重 */
export function uniqueTags(values: string[]): string[] {
  return [...new Set(values)];
}

/** 根据 slug 生成一个稳定的色相，用于项目卡片封面渐变 */
export function hueFromSlug(slug: string): number {
  let hash = 0;
  for (const char of slug) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360;
  }
  return hash;
}