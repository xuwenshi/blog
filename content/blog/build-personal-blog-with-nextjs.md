---
title: "从零搭建一个可维护的个人技术博客"
description: "不引入数据库、CMS 和用户系统，只用 Next.js + Markdown + Git 搭一个能长期维护的技术博客：目录结构、内容管线、代码高亮、目录生成与部署流程。"
date: 2026-10-08
category: "工程实践"
tags: ["Next.js", "TypeScript", "前端", "工程化"]
---

写博客最怕两件事：一是搭好之后不会用，二是用了半年之后改不动。这篇文章记录我从零搭这个站点的完整过程，以及每一个技术选择背后的理由。

## 为什么不用现成的博客框架

最先考虑的是直接用现成的静态博客框架。它们开箱即用，但有两个问题：

1. **抽象层太厚**。想改一个卡片的排版，就要先理解它的主题系统、模板语法和插件体系，学习成本反而更高。
2. **能力边界受限**。当我想加一个「按标签筛选的交互式项目列表」时，模板语言往往表达不出来。

而我真正需要的其实很少：**把 Markdown 变成 HTML，加上一套能长期维护的样式**。这正是 Next.js 的 App Router 擅长的部分。

## 信息架构：先定页面，再写代码

动手之前先把 URL 结构写下来，这一步能省掉后面大量返工：

| 路径 | 作用 | 渲染方式 |
| --- | --- | --- |
| `/` | 首页：简介 + 精选项目 + 最新文章 | 静态 |
| `/blog` | 文章列表，带标签筛选 | 静态 + 客户端筛选 |
| `/blog/[slug]` | 文章详情，含代码高亮与目录 | 构建时预渲染 |
| `/projects` | 项目列表 | 静态 |
| `/projects/[slug]` | 项目详情 | 构建时预渲染 |
| `/about` | 关于我 | 静态 |
| `/resume` | 简历 | 静态 |

这里有个关键判断：**博客没有「实时数据」**。所有内容都来自仓库里的 Markdown 文件，所以每一个页面都可以在构建时生成，不需要服务端运行时，也不需要数据库。

### 目录结构

```text
my-blog/
├─ content/
│  ├─ blog/           # 文章 Markdown
│  └─ projects/       # 项目 Markdown
├─ src/
│  ├─ app/            # 路由与页面
│  ├─ components/     # 按 layout / blog / project / ui 分组
│  ├─ lib/            # 内容读取、Markdown 渲染、站点配置
│  └─ types/          # 共享类型定义
└─ public/images/     # 静态图片
```

内容与代码分离，是为了让「写文章」这件事不需要碰 `src/` 下的任何文件。

## 内容管线：Markdown 怎么变成页面

核心只有两个函数：读取 frontmatter 拿到元信息，渲染 Markdown 拿到 HTML。

```typescript
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/** 读取单篇文章的 frontmatter 与正文 */
function parsePostFile(file: string) {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
  const { data, content } = matter(raw);

  return {
    meta: {
      slug,
      title: String(data.title),
      description: String(data.description),
      // YAML 可能把 2026-10-08 解析成 Date，这里统一成字符串
      date: data.date instanceof Date
        ? data.date.toISOString().slice(0, 10)
        : String(data.date),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      category: String(data.category ?? "未分类"),
    },
    body: content,
  };
}
```

有两个设计细节是踩坑后才加上的：

- **日期归一化**。YAML 会把未加引号的 `date: 2026-10-08` 解析成 `Date` 对象，直接渲染会得到一长串 ISO 时间戳，必须在读取层统一处理。
- **必填字段校验**。缺 `title` 或 `description` 时立刻抛出带文件名的错误，而不是等到页面上出现一个空白标题。

### 渲染管线

Markdown 到 HTML 用 unified 生态串起来：

```typescript
const html = await unified()
  .use(remarkParse)          // Markdown → mdast
  .use(remarkGfm)            // 支持表格、任务列表、删除线
  .use(remarkRehype)         // mdast → hast
  .use(rehypeSlug)           // 给标题生成 id
  .use(rehypeAutolinkHeadings, {
    behavior: "append",
    content: { type: "text", value: "#" },
  })
  .use(rehypeShiki, {
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: "light",
    fallbackLanguage: "plaintext",
  })
  .use(rehypeStringify)
  .process(markdown);
```

**为什么不直接用 MDX？** MDX 允许在 Markdown 里写 React 组件，能力更强，但也意味着内容需要经过编译步骤、要维护组件到 Markdown 的映射表。对一个以文字为主的博客来说，这些复杂度换不来实际收益。

## 代码高亮：Shiki 的双主题方案

Shiki 用 TextMate 语法解析，高亮结果和 VS Code 完全一致。暗色模式的做法是把两套主题的颜色都写进 HTML：

```html
<span style="color:#953800;--shiki-dark:#FFA657">const</span>
```

亮色用 `color`，暗色用 `--shiki-dark`。然后只需要一条 CSS 规则来切换：

```css
.dark .shiki,
.dark .shiki span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
}
```

这样做的好处是**切换主题不需要重新高亮**，也不需要 JavaScript 参与，纯 CSS 就够了。

## 目录生成：一个容易被忽略的一致性陷阱

目录需要在两个地方生成 id：`rehype-slug` 在渲染 HTML 时生成，我自己提取目录时也要生成，两边必须完全一致，否则点击目录会跳错位置。

关键点是：**必须对所有层级的标题都调用 slug 生成器**，哪怕只打算展示 h2 和 h3。

```typescript
export function extractHeadings(markdown: string): TocItem[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const slugger = new GithubSlugger();  // 与 rehype-slug 使用同一套算法
  const items: TocItem[] = [];

  visit(tree, "heading", (node) => {
    const text = nodeToText(node).trim();
    const id = slugger.slug(text);      // 每个标题都要调用，不能跳过

    if (node.depth === 2 || node.depth === 3) {
      items.push({ id, text, level: node.depth });
    }
  });

  return items;
}
```

如果只在 h2/h3 时调用 `slug()`，一旦文档里出现同名标题，计数器的状态就会和 `rehype-slug` 错开，从那一处开始所有锚点都会偏移。

## 部署：从本地到线上

在推送到远端之前，先确保本地能通过全部检查：

```bash
npm run lint    # ESLint 检查
npm run build   # 生产构建，任何类型错误都会在这里暴露
npm start       # 用生产产物本地验证
```

部署到 Vercel 只需要把仓库连上去，之后每次 `git push` 都会自动构建发布。自定义域名则是在域名服务商添加一条 CNAME 记录指向 Vercel，再用自动签发的 Let's Encrypt 证书启用 HTTPS。

## 复盘：哪些决定是对的

- **没有引入数据库**。内容就在 Git 里，改文章等于改代码，可回溯、可评审。
- **服务端组件优先**。全站只有导航、主题切换和标签筛选三处需要客户端 JavaScript。
- **图片不用外部服务**。项目封面用「由 slug 推导出的稳定渐变 + 首字母」，构建和部署都不依赖任何外部接口。

如果重来一次，我会更早地把目录生成的逻辑和渲染逻辑放在一起测试——这个 bug 只在文章出现重复标题时才会暴露，很难在开发阶段发现。