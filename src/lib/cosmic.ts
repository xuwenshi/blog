/**
 * 宇宙层数据：五大行星分区定义。
 *
 * 这里是「星海入口 / 星图 / 分区页」共用的唯一事实来源。
 * 每个分区包含：真实路由、中英文名称、一句话说明、识别色、纯 CSS 星球配色、
 * 以及桌面星图上的百分比坐标。
 *
 * 注意：本文件只描述「视觉与导航」，不存放任何内容数据 ——
 * 文章、项目、日记、目标的内容各自来自 content/ 目录，避免重复存储。
 */

export const COSMIC_SECTION_IDS = [
  "resume",
  "projects",
  "blog",
  "diary",
  "goals",
] as const;

export type CosmicSectionId = (typeof COSMIC_SECTION_IDS)[number];

/** 纯 CSS 星球所需的配色（球体径向渐变的四个色档） */
export type PlanetPalette = {
  /** 受光面最亮处 */
  light: string;
  /** 球体主色 */
  base: string;
  /** 中间调（向暗面过渡） */
  mid: string;
  /** 暗面 */
  dark: string;
};

export type CosmicSection = {
  id: CosmicSectionId;
  /** 中文名，用于标题与标签 */
  name: string;
  /** 英文名，用于 eyebrow 与星图副标题 */
  latin: string;
  /** 真实路由（可直接访问、可被搜索引擎收录） */
  href: string;
  /** 一句话说明，出现在星图上 */
  tagline: string;
  /** 补充说明，用于星图的次要文字 */
  description: string;
  /** 分区识别色（只用于装饰，正文颜色仍走主题变量以保证对比度） */
  accent: string;
  /** 星球配色 */
  planet: PlanetPalette;
  /** 是否显示光环 */
  ring: boolean;
  /** 球体表面纹理的自转周期，数值越大越慢 */
  spin: string;
  /**
   * 桌面星图坐标（相对星图容器的百分比，0-100）。
   * 刻意不随机：有主次、文字不互相遮挡。
   */
  coords: { x: number; y: number };
  /** 桌面基准直径（px），用于营造远近层次 */
  size: number;
};

export const cosmicSections: CosmicSection[] = [
  {
    id: "resume",
    name: "简历",
    latin: "RESUME",
    href: "/resume",
    tagline: "航行档案星",
    description: "经历、技能与教育背景。",
    accent: "#e8ecf6",
    planet: {
      light: "#ffffff",
      base: "#d7dded",
      mid: "#8e9ab8",
      dark: "#232c45",
    },
    ring: true,
    spin: "38s",
    coords: { x: 17, y: 30 },
    size: 132,
  },
  {
    id: "projects",
    name: "项目",
    latin: "PROJECTS",
    href: "/projects",
    tagline: "工程星",
    description: "构建、实验与作品：目标、技术栈、关键实现与结果。",
    accent: "#ffe9c7",
    planet: {
      light: "#fff6e4",
      base: "#e3c79a",
      mid: "#8d6a4a",
      dark: "#2c1d16",
    },
    ring: false,
    spin: "30s",
    coords: { x: 52, y: 18 },
    size: 176,
  },
  {
    id: "blog",
    name: "文章",
    latin: "ARTICLES",
    href: "/blog",
    tagline: "知识星环",
    description: "问题 → 原理 → 实现 → 实验 → 踩坑 → 总结。",
    accent: "#8fe3ff",
    planet: {
      light: "#e6faff",
      base: "#8fe3ff",
      mid: "#3d7fa3",
      dark: "#0d2740",
    },
    ring: true,
    spin: "26s",
    coords: { x: 82, y: 34 },
    size: 158,
  },
  {
    id: "diary",
    name: "日记",
    latin: "DIARY",
    href: "/diary",
    tagline: "观测月球",
    description: "安静、私密、持续记录的时间线。",
    accent: "#c9b6ff",
    planet: {
      light: "#f0eaff",
      base: "#c9b6ff",
      mid: "#7f72a8",
      dark: "#241f3c",
    },
    ring: false,
    spin: "44s",
    coords: { x: 30, y: 68 },
    size: 122,
  },
  {
    id: "goals",
    name: "目标",
    latin: "GOALS",
    href: "/goals",
    tagline: "远航星",
    description: "短期与长期目标、状态、进度与里程碑。",
    accent: "#bff3ff",
    planet: {
      light: "#f2feff",
      base: "#bff3ff",
      mid: "#4f93b4",
      dark: "#0f2b3f",
    },
    ring: true,
    spin: "34s",
    coords: { x: 68, y: 70 },
    size: 138,
  },
];

/** 按 id 取分区（找不到时抛错，属于开发期错误，不应静默） */
export function getSection(id: CosmicSectionId): CosmicSection {
  const section = cosmicSections.find((item) => item.id === id);
  if (!section) throw new Error(`[lib/cosmic] 未知分区 id: ${id}`);
  return section;
}

/** 按路由取分区（分区页用它拿到识别色与英文名） */
export function getSectionByHref(href: string): CosmicSection | undefined {
  return cosmicSections.find((item) => item.href === href);
}

/**
 * 首页中央主星球的配色。
 * 刻意与五颗分区行星区分：更冷、更亮、对比更强，突出「主入口」的地位。
 */
export const heroPlanet: PlanetPalette = {
  light: "#f2fbff",
  base: "#a9c3e6",
  mid: "#44598a",
  dark: "#080d1c",
};

/** 首页主星球的边缘光 / 光晕颜色 */
export const heroAccent = "#8fe3ff";

/**
 * 首页「快速导航」与星图的共用入口列表。
 * 除五大分区外额外包含「关于」——它是既有页面，但不作为一颗行星出现在星图上。
 */
export const cosmicQuickNav: { href: string; label: string; latin: string }[] = [
  ...cosmicSections.map((section) => ({
    href: section.href,
    label: section.name,
    latin: section.latin,
  })),
  { href: "/about", label: "关于", latin: "ABOUT" },
];