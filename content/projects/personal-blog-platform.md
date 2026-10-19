---
name: "个人技术博客平台"
description: "用 Next.js App Router + Markdown 搭建的技术博客与作品集，全站静态预渲染，零数据库依赖，支持暗色模式、代码高亮与自动目录。"
techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Shiki", "Markdown"]
status: "active"
period: "2026.09 - 至今"
role: "设计与开发"
github: "https://github.com/xuwenshi"
article: "build-personal-blog-with-nextjs"
featured: true
order: 1
---

这个站点本身就是第一个项目。目标很明确：做一个**三年后还改得动**的个人博客。

## 背景

原来的笔记散落在各种文档工具里，缺乏统一的组织方式，也没法沉淀成作品集。我需要一个能长期维护的载体：写文章的成本要低，改样式的成本也要低。

## 目标

- 写文章只需要新建一个 Markdown 文件，不碰任何代码
- 全站静态生成，不引入数据库和 CMS
- 支持暗色模式、代码高亮、文章目录、标签筛选
- SEO 完整：metadata、sitemap、robots、结构化数据
- 移动端可用，键盘可操作

## 架构

```text
content/*.md  ──►  lib/posts.ts（读取 + 校验）
                        │
                        ├──►  lib/markdown.ts（渲染 + 高亮 + 目录）
                        │
                        └──►  app/blog/[slug]/page.tsx（构建时预渲染）
```

内容读取与渲染完全分离：列表页只需要 frontmatter，不触发 Markdown 渲染；详情页才做完整渲染。

## 技术栈与选择理由

| 选择 | 理由 |
| --- | --- |
| Next.js App Router | 页面即文件，静态生成开箱可用，无需额外 SSG 配置 |
| Markdown（非 MDX） | 内容不需要运行时编译，避免维护组件映射表 |
| Shiki 双主题 | 高亮结果与编辑器一致，暗色切换纯 CSS 完成 |
| Tailwind CSS | 样式与结构写在一起，改版时不用在多个文件间跳转 |
| 无数据库 | 内容即仓库文件，可回溯、可评审 |

## 核心实现

### 构建期预渲染

内容读取刻意使用同步 `fs.readFileSync`，属于「可预测值」——同一份输入永远得到同一份输出，因此 Next.js 会在构建时完成渲染，不需要任何显式缓存指令。

```typescript
export function generateStaticParams() {
  // 构建时枚举全部文章，生成静态页面
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

// 未列出的 slug 直接返回 404，不进入运行时渲染
export const dynamicParams = false;
```

### 目录与正文的一致性

目录锚点必须和正文标题 id 完全一致。实现时对**所有层级**的标题都调用 slug 生成器，只把 h2/h3 收进目录，避免同名标题导致后续锚点整体偏移。

## 问题与解决

| 问题 | 原因 | 解决方案 |
| --- | --- | --- |
| 暗色切换时高亮闪烁 | 重新执行高亮有延迟 | Shiki 双主题 + CSS 变量，切换零成本 |
| 移动端表格溢出 | 表格宽度超过视口 | 表格改为可横向滚动容器 |
| 首屏主题闪白 | 服务端不知道用户偏好 | layout 内联脚本，渲染前读取并应用主题 |
| 目录跳转错位 | 标题 id 生成序列不一致 | 所有标题统一调用 slug 生成器 |

## 结果

- 全站 20 余个页面全部静态预渲染，首屏无阻塞请求
- 客户端 JavaScript 仅用于导航高亮、主题切换与标签筛选三处
- Lighthouse 各项指标均在 95 分以上（桌面端）

## 后续计划

- 加入 RSS 订阅
- 文章支持系列（series）聚合
- 补充站内搜索（基于构建期生成的索引，仍然不需要服务端）