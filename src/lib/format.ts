/**
 * 日期格式化器。
 *
 * 用 Intl 而不是手写字符串拼接：数字、月份名、连接方式都由 locale 决定，
 * 将来要支持多语言时只需要换 locale，不必再改一处格式模板。
 *
 * 必须显式指定 `timeZone: "UTC"`：内容里的日期是 `YYYY-MM-DD`，
 * `new Date()` 会按 UTC 零点解析，若用构建机器的本地时区格式化，
 * 处在 UTC 负偏移的时区会把 10 月 8 日显示成 10 月 7 日。
 * 固定 UTC 同时保证服务端预渲染与客户端 hydration 结果一致。
 */
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

/** 统一的日期展示：把 2026-10-08 显示成 2026年10月8日 */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;

  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;

  return dateFormatter.format(date);
}

/** 项目卡片 / 详情页用的技术栈标签去重 */
export function uniqueTags(values: string[]): string[] {
  return [...new Set(values)];
}