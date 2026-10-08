# luoxu.dev · 个人技术博客

一个用 **Next.js + TypeScript + Tailwind CSS + Markdown** 搭建的个人技术博客与作品集。

没有数据库、没有 CMS、没有用户系统 —— 所有内容都是仓库里的 Markdown 文件，全部页面在构建时静态生成。

## 功能

- **文章系统**：Markdown 写作，支持 frontmatter（标题、描述、日期、标签、分类、头图、草稿）
- **代码高亮**：Shiki 双主题，暗色模式切换无需重新高亮
- **文章目录**：从 h2/h3 自动生成锚点目录，与正文标题 id 严格一致
- **标签筛选**：客户端筛选，无需服务端搜索
- **项目展示**：渐变封面 + 状态徽标 + 技术栈，可关联到相关文章
- **暗色模式**：Light / Dark / System 三态，内联脚本消除闪屏
- **响应式**：桌面 / 平板 / 手机均可正常阅读，宽表格内部横向滚动
- **SEO**：metadata、canonical、Open Graph、Twitter Card、JSON-LD、`sitemap.xml`、`robots.txt`
- **可访问性**：跳转链接、语义化标签、键盘可操作、`aria-*` 标注

## 技术栈

| 层 | 选择 |
| --- | --- |
| 框架 | Next.js 16（App Router、Cache Components、PPR） |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4 + `@tailwindcss/typography` |
| 内容 | Markdown + gray-matter + unified（remark / rehype） |
| 高亮 | Shiki（`@shikijs/rehype`） |
| 字体 | `next/font`（Geist / Geist Mono） |
| 部署 | Vercel（或任何支持 Node 的平台） |

## 本地运行

```bash
npm install
npm run dev        # 开发服务器 http://localhost:3000
```

提交前请确保这两条命令都通过：

```bash
npm run lint       # ESLint
npm run build      # 生产构建（含 TypeScript 类型检查）
npm start          # 用生产产物本地验证
```

## 项目结构

```text
my-blog/
├─ content/
│  ├─ blog/                 # 文章：一个 .md 文件就是一篇文章，文件名即 URL slug
│  └─ projects/             # 项目：同上
├─ public/images/           # 文章与项目中引用的图片
├─ src/
│  ├─ app/
│  │  ├─ page.tsx           # 首页
│  │  ├─ blog/              # /blog 列表 + /blog/[slug] 详情
│  │  ├─ projects/          # /projects 列表 + /projects/[slug] 详情
│  │  ├─ about/             # /about
│  │  ├─ resume/            # /resume
│  │  ├─ layout.tsx         # 根布局：导航、页脚、主题脚本、站点 metadata
│  │  ├─ not-found.tsx      # 404
│  │  ├─ sitemap.ts         # /sitemap.xml
│  │  └─ robots.ts          # /robots.txt
│  ├─ components/
│  │  ├─ layout/            # Navbar / Navigation / ThemeToggle / Footer
│  │  ├─ blog/              # PostCard / PostList / PostToc
│  │  ├─ project/           # ProjectCard
│  │  └─ ui/                # Icons / Badge / SectionHeading / PageHeader
│  ├─ lib/
│  │  ├─ site.ts            # ★ 站点配置：姓名、简介、技术栈、经历、社交链接
│  │  ├─ posts.ts           # 文章读取（frontmatter 校验、排序、相关文章）
│  │  ├─ projects.ts        # 项目读取
│  │  ├─ markdown.ts        # Markdown → HTML（高亮 + 锚点 + 目录提取）
│  │  └─ format.ts          # 日期格式化等工具
│  └─ types/index.ts        # 共享类型定义
└─ next.config.ts
```

## 把它变成你自己的

只有两处需要改：

1. **`src/lib/site.ts`** —— 站点名称、姓名、职业、简介、邮箱、GitHub、技术栈、工作经历、教育背景。首页 / 关于 / 简历 / 导航 / SEO / sitemap 都会自动跟随。
2. **`content/`** —— 把你自己的文章与项目写成 `.md` 文件。

另外记得把 `siteConfig.url` 换成你的真实域名（或设置环境变量 `NEXT_PUBLIC_SITE_URL`），它决定了 canonical、Open Graph 与 sitemap 里的地址。

### 写一篇新文章

在 `content/blog/` 下新建 `your-slug.md`，文件名就是 URL：

```markdown
---
title: "文章标题"
description: "一句话摘要，会显示在列表卡片与搜索结果里"
date: 2026-10-08
category: "工程实践"
tags: ["Next.js", "TypeScript"]
cover: "/images/your-cover.svg"   # 可选，文章头图
draft: false                      # true 时只在开发环境显示
---

正文从这里开始。二级标题会成为目录项。

## 第一节

正文内容。
```

### 添加一个项目

在 `content/projects/` 下新建 `.md`：

```markdown
---
name: "项目名称"
description: "一句话描述"
techStack: ["Python", "scikit-learn"]
status: "in-progress"        # active | in-progress | completed | archived
period: "2026.01 - 2026.06"  # 可选
role: "建模与评估"            # 可选
github: "https://github.com/you/repo"  # 可选
article: "your-slug"          # 可选，关联到某篇文章
featured: true                # 是否在首页精选项目区展示
order: 1                      # 排序，数字小的在前
---

项目正文。
```

## 部署

### 1. 推到 GitHub

```bash
git init
git add .
git commit -m "feat: initial blog"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

`.gitignore` 已经忽略了 `node_modules/`、`.next/` 和 `.env*`，不会把依赖与密钥提交上去。

### 2. 部署到 Vercel

1. 打开 [vercel.com/new](https://vercel.com/new)，用 GitHub 账号登录
2. 选择刚才的仓库，框架会自动识别为 Next.js，直接点 Deploy
3. 构建完成后会得到一个 `*.vercel.app` 的地址

之后每次 `git push`，Vercel 都会自动重新构建并发布。

### 3. 绑定自定义域名

1. 在域名服务商购买域名（如 `luoxu.dev`）
2. 在 Vercel 项目的 **Settings → Domains** 添加该域名
3. 按提示到域名服务商添加 DNS 记录：通常根域名用 A 记录、`www` 用 CNAME
4. 等待 DNS 生效，Vercel 会自动签发并续期 HTTPS 证书

最后把 `src/lib/site.ts` 里的 `url` 改成真实域名，或在 Vercel 里配置环境变量 `NEXT_PUBLIC_SITE_URL=https://你的域名`，然后重新部署。

## 几个实现说明

- **为什么不用 MDX**：纯 Markdown 已经够用，不需要运行时编译，也不需要维护组件映射表；代码高亮和目录都在构建期一次性完成。
- **为什么内容加载是同步的**：`fs.readFileSync` 属于「可预测值」，同一份输入永远得到同一份输出，Next.js 会在构建时完成渲染，因此文章页无需任何显式缓存配置。
- **为什么 `getPost` / `getProject` 用了 `use cache`**：Shiki 底层的 `vscode-textmate` 在分词时会读取 `Date.now()`（用于超时保护），在 Cache Components 模式下这属于「不稳定值」，必须放进缓存作用域；顺带也让高亮结果按 slug 缓存。
- **客户端 JavaScript 只有三处**：导航栏（路由高亮 + 移动端菜单）、主题切换、文章标签筛选。其余全部是服务端组件。