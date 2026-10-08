/**
 * 站点全局配置。
 *
 * 想把这个博客变成你自己的，只需要修改这个文件 + content/ 目录下的内容，
 * 其余页面（首页 / About / Resume / SEO / sitemap）都会自动跟随。
 */

export type NavLink = {
  href: string;
  label: string;
  /** 外部链接会在新标签页打开 */
  external?: boolean;
};

export type SocialLink = {
  label: string;
  href: string;
};

export type ExperienceItem = {
  period: string;
  title: string;
  org: string;
  description: string;
  highlights?: string[];
};

export type SiteConfig = {
  /** 站点名称，同时用于浏览器标题与 Logo */
  name: string;
  /** 姓名 / 昵称 */
  author: string;
  /** 职业方向 */
  role: string;
  /** 一句话介绍 */
  tagline: string;
  /** 站点描述，用于 SEO description */
  description: string;
  /** 部署地址，用于 metadataBase / sitemap / robots / canonical */
  url: string;
  email: string;
  location: string;
  github: string;
  /** 个人简介（首页 About 区块） */
  bio: string[];
  /** 当前关注方向 */
  focus: string[];
  techStack: { group: string; items: string[] }[];
  navLinks: NavLink[];
  socials: SocialLink[];
  /** 是否提供在线简历 PDF（对应 public/resume.pdf） */
  resumePdfAvailable: boolean;
  experiences: ExperienceItem[];
  education: { period: string; school: string; major: string; note?: string }[];
};

export const siteConfig: SiteConfig = {
  name: "luoxu.dev",
  author: "luoxu",
  role: "数据科学与机器学习工程师",
  tagline: "用数据与代码解决真实世界的问题。",
  description:
    "个人技术博客与项目作品集：记录机器学习、数据挖掘、RAG 与 LLM 工程实践中的问题、原理、实验与踩坑。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://luoxu-blog.vercel.app",
  email: "luoxu@example.com",
  location: "中国",
  github: "https://github.com/luoxu",

  bio: [
    "我是 luoxu，关注数据科学与机器学习在真实业务中的落地。",
    "过去几年做过农业数据挖掘、特征工程与模型评估相关的工作，习惯把「问题 → 原理 → 实现 → 实验 → 结论」完整记录下来。",
    "这个博客既是我的学习笔记，也是我的项目作品集：每个项目都会说明为什么这样设计、解决了什么问题、以及最终效果。",
  ],

  focus: [
    "机器学习建模与模型评估",
    "农业数据挖掘与特征工程",
    "RAG / 向量检索",
    "LLM 工程化与 Agent",
  ],

  techStack: [
    {
      group: "数据与机器学习",
      items: ["Python", "pandas", "NumPy", "scikit-learn", "PyTorch", "Matplotlib"],
    },
    {
      group: "LLM 与检索",
      items: ["LangGraph", "RAG", "Qdrant", "Embedding", "Ollama", "llama.cpp"],
    },
    {
      group: "工程与前端",
      items: ["TypeScript", "Next.js", "React", "Tailwind CSS", "FastAPI", "Docker"],
    },
  ],

  navLinks: [
    { href: "/", label: "首页" },
    { href: "/blog", label: "博客" },
    { href: "/projects", label: "项目" },
    { href: "/about", label: "关于" },
    { href: "/resume", label: "简历" },
  ],

  socials: [
    { label: "GitHub", href: "https://github.com/luoxu" },
    { label: "Email", href: "mailto:luoxu@example.com" },
  ],

  resumePdfAvailable: false,

  experiences: [
    {
      period: "2024 - 至今",
      title: "机器学习 / 数据科学工程师",
      org: "农业数据智能方向",
      description:
        "负责作物相关数据的清洗、特征工程与建模评估，输出可复现的实验流程与结论。",
      highlights: [
        "构建作物产量预测基线模型，对比 SVM / MLP / 决策树三类模型的泛化表现",
        "沉淀特征工程与数据预处理规范，减少重复的数据清洗工作",
        "搭建 RAG 知识库，把散落在文档中的实验结论变成可检索的知识",
      ],
    },
    {
      period: "2023 - 2024",
      title: "数据分析项目实践",
      org: "个人项目与开源",
      description:
        "围绕公开农业数据集做端到端的数据分析与建模实践，并把过程整理成技术文章。",
      highlights: [
        "完成多份公开数据集的分析报告，包含相关性分析与残差诊断",
        "使用 Next.js 从零搭建个人技术博客，作为长期内容与作品集载体",
      ],
    },
  ],

  education: [
    {
      period: "2020 - 2024",
      school: "本科",
      major: "数据科学 / 计算机相关专业",
      note: "主修机器学习、统计学与数据挖掘",
    },
  ],
};

/** 站点导航（含外链 GitHub，方便在导航栏展示） */
export const navWithGithub: NavLink[] = [
  ...siteConfig.navLinks,
  { href: siteConfig.github, label: "GitHub", external: true },
];