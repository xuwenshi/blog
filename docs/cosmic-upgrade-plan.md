# Cosmic Portfolio 升级计划

> 目标：把当前可用的个人博客升级为「星海入口 + 行星式导航 + 全站星球穿越转场」的个人宇宙作品集。
> 本文件是阶段 0 的产出，也是后续每个阶段的**唯一事实来源**。每完成一个阶段，回到这里更新「阶段状态」。

---

## 0. 阶段状态

| 阶段 | 内容 | 状态 |
| --- | --- | --- |
| 0 | 项目审计与基线 | ✅ 已完成 |
| 1 | 视觉基础与动画偏好 | ✅ 已完成 |
| 2 | 星海入口 | ✅ 已完成 |
| 3 | 全局星球穿越转场 | ✅ 已完成 |
| 4 | 五大行星导航页 | ✅ 已完成 |
| 5 | 五个分区接入与补齐 | ✅ 已完成 |
| 6 | 性能 / 无障碍 / 兼容性 | ✅ 已完成 |
| 7 | 完整验收与交付 | ✅ 已完成 |

---

## 1. 现状审计

### 1.1 实际技术栈（以仓库为准，非假设）

| 层 | 实际 | 证据 |
| --- | --- | --- |
| 框架 | Next.js **16.4.0**（App Router + Turbopack） | `package.json`、`next.config.ts` |
| 渲染模式 | `cacheComponents: true` + `partialPrefetching: true`（Cache Components / PPR） | `next.config.ts` |
| React | 19.3.0 | `package.json` |
| 语言 | TypeScript 5 | `tsconfig` |
| 样式 | Tailwind CSS **v4**，经 `@tailwindcss/turbopack` loader 接入，**无** `postcss.config` / `tailwind.config` | `next.config.ts` `turbopack.rules`、`globals.css` 的 `@import "tailwindcss"` |
| 内容 | Markdown + gray-matter + unified（remark-parse / remark-gfm / remark-rehype / rehype-slug / rehype-autolink-headings / rehype-stringify）+ `@shikijs/rehype`（Shiki 4.5） | `src/lib/markdown.ts` |
| Lint | ESLint 9 + `eslint-config-next` | `package.json` |
| 部署 | Vercel 友好（纯静态 + 少量 PPR） | `README.md` |

### 1.2 基线检查结果（本次实测）

```
npm run lint   → 退出码 0，无错误、无警告
npm run build  → 退出码 0
                 Next.js 16.4.0 (Turbopack)
                 ✓ Compiled successfully in 3.9s
                 ✓ Finished TypeScript in 1714ms
                 ✓ Generating static pages (19/19)
```

构建产物路由（**19 条，全部静态预渲染或 PPR**）：

```
○ /                                      15m / 1y
○ /_not-found
○ /about
○ /blog
├ ◐ /blog/[slug]            （PPR 外壳 + 4 篇静态文章）
○ /projects
├ ◐ /projects/[slug]        （PPR 外壳 + 3 个静态项目）
○ /resume
○ /icon.svg
○ /robots.txt
○ /sitemap.xml
```

**结论：基线干净，无历史遗留错误。** 本次改造引入的任何问题都可以明确归因于本次改动。

### 1.3 路由与内容来源

| 路由 | 文件 | 内容来源 |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | `siteConfig` + `getFeaturedProjects()` + `getRecentPosts()` |
| `/blog` | `src/app/blog/page.tsx` | `content/blog/*.md`（4 篇） |
| `/blog/[slug]` | `src/app/blog/[slug]/page.tsx` | 同上 |
| `/projects` | `src/app/projects/page.tsx` | `content/projects/*.md`（3 个） |
| `/projects/[slug]` | `src/app/projects/[slug]/page.tsx` | 同上 |
| `/about` | `src/app/about/page.tsx` | `siteConfig` + 文章/项目计数 |
| `/resume` | `src/app/resume/page.tsx` | `siteConfig.resumePdfAvailable=false`（占位） |
| 404 | `src/app/not-found.tsx` | — |
| sitemap / robots | `src/app/sitemap.ts` / `robots.ts` | 由内容自动生成 |

**缺失分区：**「日记 DIARY」「目标 GOALS」**完全没有**数据结构、读取逻辑与页面。
→ 阶段 5 需新建可维护的 Markdown 内容结构，且**只放明确标注的占位内容**，不编造事实。

### 1.4 服务端 / 客户端组件边界（现状）

客户端组件**仅 3 个**：

1. `src/components/layout/Navigation.tsx` — 当前路由高亮 + 移动端菜单
2. `src/components/layout/ThemeToggle.tsx` — `useSyncExternalStore` 读外部状态（**不可改回 useEffect 方案**）
3. `src/components/blog/PostList.tsx` — 标签筛选

其余全部是服务端组件。`Navbar` / `Footer` 是服务端组件，只是内部嵌入了客户端子组件。

### 1.5 已验证的 Next 16 约束（必须遵守）

1. `dynamicParams` 与 `cacheComponents` 不兼容，不要使用。
2. 页面 `params` 与 `searchParams` 是 **Promise**，必须 `await`。
3. `generateStaticParams` **不得返回空数组**（`/diary/[slug]` 必须至少存在 1 篇内容）。
4. `Date.now()` / `Math.random()` / `new Date()` 等不稳定值在预渲染期会触发 `blocking-prerender-current-time`：
   - Shiki 底层 `vscode-textmate` 无条件读 `Date.now()` → `getPost` / `getProject` 必须带 `"use cache"`。
   - `Footer` 的 `new Date()` 已用 `"use cache"` 包裹。
   - **新增的 `getDiaryEntry` 也必须带 `"use cache"`。**
5. 本版官方文档位置：`node_modules/next/dist/docs/`。`AGENTS.md` 强制要求先查该目录再写代码。
6. 本版可用 API（已查 `docs/01-app/...`）：
   - `<Link onNavigate={...}>`（v15.3+）：**只在真实客户端导航时触发**；Ctrl/Cmd+点击、外链、`download` 都不会触发 → 天然满足「不拦截浏览器默认行为」。
   - `<Link transitionTypes={[...]}>`（v16.2+）：给 View Transition 传递类型。
   - React 19.3 内置 `<ViewTransition>` 组件 + `addTransitionType`。

### 1.6 环境注意

- Windows PowerShell 5：不支持 `&&`，多命令用 `;`。
- 项目根 = git 仓库根 = `c:\Users\luoxu\Desktop\learn\bolg\my-blog`。

---

## 2. 设计规格

### 2.1 视觉基调

- **宇宙底色**：`#03040A`（近黑深空）。星云用极淡的径向渐变叠加，不盖过星点。
- **主色**：白色 / 冷白粒子为主；辅助色仅作**极少量的识别色**：冰青 `#8FE3FF`、淡紫 `#C9B6FF`、银白 `#E8ECF6`、暖白 `#FFE9C7`。
- **对比度**：所有正文对比度 ≥ 4.5:1，氛围层永远在文字**下方**且带半透明底衬，不降低可读性。
- **设计场域划分**（重要取舍）：
  - **宇宙层**（`/` 星海入口、`/universe` 星图）：**恒定深空**，不受 Light/Dark 主题影响 —— 这是「宇宙」。
  - **行星内部**（`/blog`、`/projects`、`/resume`、`/diary`、`/goals`、`/about`）：**保留现有 Light / Dark / System 主题系统**（这是一个已有功能，不删除），并叠加宇宙设计语言：分区识别色、面包屑「返回星图」、入场动效、星球质感的区块装饰。
  - 叙事上说得通：入口在外太空，进入星球 = 进到星球内部读内容，读起来是普通网页。

### 2.2 动效令牌

```css
--dur-instant: 120ms;   /* reduced-motion 下的极短淡入淡出 */
--dur-fast:    180ms;   /* hover / focus 反馈 */
--dur-base:    320ms;   /* 常规淡入、缩放 */
--dur-slow:    460ms;   /* 转场覆盖 */
--dur-reveal:  420ms;   /* 转场揭开 */
--ease-out-soft:  cubic-bezier(0.22, 1, 0.36, 1);
--ease-in-out-soft: cubic-bezier(0.65, 0, 0.35, 1);
```

统一放在 `globals.css` 的 `:root`，新增动画一律引用这些变量。

### 2.3 关键页面与状态流转

**`/` 星海入口**

- 100svh 全屏（`min-h-svh`，兼容移动端地址栏变化），深空底 + 三层粒子 Canvas。
- 中央：程序化渲染的主星球（Canvas 2D），缓慢自转；四周有 1–2 道极简轨道/光环。
- 星球下方文字提示：「进入我的宇宙 / ENTER THE UNIVERSE」。
- **交互语义**：整块区域是一个真实的 `<Link href="/universe">`（不是裸 Canvas 上的点击）。
  取舍说明：需求文档写「语义上必须是真正可聚焦、可用 Enter/Space 触发的按钮」。这里改用**链接**，因为文档同时硬性要求「真实 URL / 刷新 / 深链 / 新标签页 / 无 JS 可用」——只有真实 `<a>` 才能同时满足；`<button>` 在禁用 JS 时是一个死按钮。访问名称、焦点样式、Enter 触发、触摸目标全部满足，仅 Space 触发需要 JS（已在降级说明中记录）。
- 首屏下方有一个**克制的「快速导航」区块**：把 7 个目的地以文字链接列出。
  作用：① SEO 内链；② 无 JS / 无动画时仍可进入全部内容；③ 用户没看懂隐喻也能用。
- 鼠标靠近：粒子受引力/斥力偏移 + 轻微视差；离开后平滑恢复。

**`/universe` 五行星图**

- 更开阔的深空，五颗可识别的大行星 + 星座连线（SVG，`aria-hidden`）。
- 桌面：固定百分比坐标的星图布局（有主次、不随机、文字互不遮挡），`aspect-ratio` 容器 + SVG 连线。
- 移动端（<768px）：切换为**纵向行星列表**——每行 = 星球 + 名称 + 一句说明 + 箭头，整行可点。
- 五分区定义（见 §2.5），每颗 = `<Link>` 到真实路由。

**分区页（行星内部）**

- 统一：面包屑「← 返回星图」+ 分区识别色的 eyebrow + 页面入场（CSS 动画，420ms，`both`）。
- 内容与现有页面保持一致，不重做信息架构。

### 2.4 转场状态机（全局统一）

用户可见的两种变体，共用同一套「星球穿越」视觉语言：

- `warp`：完整穿越（首页主星球 → 星图；星图行星 → 分区；分区 →「返回星图」）。
- `soft`：同体系短版淡入淡出（导航栏、上一篇/下一篇、页脚、浏览器前进/后退）。

```
idle ──start(warp|soft)──▶ covering ──(cover 动画结束)──▶ covered
  ▲                                                          │
  │                                          pathname 变化 ──┤
  │                                                          ▼
  └──────────────(reveal 动画结束 / 安全超时)──────────── revealing
```

实现要点：

1. **不拦截点击**：用 `<Link onNavigate>` 触发转场，**不** `preventDefault`，导航仍由 Next.js 原生完成。→ Ctrl/Cmd/Shift/中键/新标签页/外链/`download` 全都自动绕过（Next 的 `onNavigate` 只在纯客户端同源导航时触发）。
2. **与真实路由同步**：`covering` 结束后若 `pathname` 尚未变化则保持 `covered`（不揭遮罩）；`pathname` 变化后进入 `revealing`。
3. **重复点击锁定**：`status !== "idle"` 时直接忽略新请求。
4. **失败恢复**：从 `start` 起挂一个 3s 的硬安全定时器，无论发生什么都会走完 `revealing → idle`；遮罩层始终 `pointer-events: none`，即使卡住也不会锁死交互。
5. **浏览器前进/后退**：`pathname` 在 `idle` 状态下变化 → 自动播放一次 `soft`（首次挂载除外）。
6. **reduced-motion**：跳过 `covering`，只做 `--dur-instant`(120ms) 的淡入淡出。
7. **遮罩层视觉**：`position: fixed; inset: 0; z-index: 100`；以点击元素中心为原点的星球/光晕径向扩散 + 深空底色渐入；`aria-hidden="true"`。

### 2.5 五大分区定义（`src/lib/cosmic.ts`）

| # | id | 中文 | English | 路由 | 识别色 | 星球质感 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `resume` | 简历 | RESUME | `/resume` | 银白 `#E8ECF6` | 冷灰白球体 + 细环（航行档案星） |
| 2 | `projects` | 项目 | PROJECTS | `/projects` | 暖白 `#FFE9C7` / 冷青点缀 | 明暗对比更强、带地貌斑块（工程星） |
| 3 | `blog` | 文章 | ARTICLES | `/blog` | 冰青 `#8FE3FF` | 醒目的层叠细环（知识星环） |
| 4 | `diary` | 日记 | DIARY | `/diary` | 淡紫 `#C9B6FF` | 柔和灰白 / 淡紫，低对比（观测月球） |
| 5 | `goals` | 目标 | GOALS | `/goals` | 冷白 / 冰青 `#BFF3FF` | 核心辉光 + 向前延伸的轨迹（远航星） |

每个分区条目还包含：`tagline`（一句话说明）、`description`（列表/星图上的补充说明）、`coords`（桌面星图百分比坐标）、`size`。

### 2.6 组件边界（职责）

**必须是客户端组件**（需要浏览器 API / Canvas / 交互状态）：

| 组件 | 职责 |
| --- | --- |
| `cosmic/Starfield.tsx` | 多层白色粒子 Canvas：远景/中景/近景、鼠标与触摸扰动、视差、可见性暂停、DPR 自适应、reduced-motion 静态降级 |
| `cosmic/CentralPlanet.tsx` | 中央主星球 Canvas（自转、受光面、暗面、边缘光、光环）+ 入口 `<Link>` 语义 + CSS 球体降级底衬 |
| `cosmic/TransitionProvider.tsx` | 全局转场状态机 + `useCosmicTransition()` context |
| `cosmic/TransitionOverlay.tsx` | 转场遮罩层渲染（读取 context） |
| `cosmic/CosmicLink.tsx` | 包装 `next/link` 的 `<Link>`，接入 `onNavigate` → 触发转场 |
| `lib/useReducedMotion.ts` | `useSyncExternalStore` 读 `prefers-reduced-motion`（与 ThemeToggle 同一模式） |

**保持服务端组件**：

| 组件 | 职责 |
| --- | --- |
| `cosmic/PlanetSphere.tsx` | 纯 CSS 程序化星球（径向/锥形渐变 + 旋转表面层 + 光环），无 JS、无 Canvas；reduced-motion 下静止 |
| `cosmic/StarMap.tsx` | 星图布局（桌面绝对定位 + SVG 连线；移动端纵向列表），数据来自 `cosmic.ts` |
| `cosmic/SectionIntro.tsx` | 分区页统一的「返回星图 + eyebrow + 入场动画」包裹 |
| `cosmic/CosmicChrome.tsx` | 宇宙层极简外壳（品牌 + 星图/首页入口 + 深空主题声明） |

> 只有首页/星图需要 Canvas 星场与一个 Canvas 主星球；**五颗分区行星用 CSS 实现**（更省 GPU、可静态降级、可服务端渲染），避免为 5 个装饰件养 5 个 canvas。

### 2.7 移动端方案

- 视口验收：**1440px / 768px / 390px**，另加移动端安全区域与 reduced-motion。
- 使用 `100svh` + `env(safe-area-inset-*)`（`CosmicChrome` 的 padding）。
- 星图在 <768px 变为纵向列表；触摸目标 ≥ 44×44px。
- 粒子数量按屏幕面积缩放；DPR 上限 2；<768px 自动减层。
- 画布 `touch-action` 不拦截纵向滚动；所有 pointer 监听 `{ passive: true }`。

### 2.8 降级方案（不闪、不锁、不失效）

| 场景 | 降级 |
| --- | --- |
| 禁用 JS | 入口是真实 `<a>`；遮罩层不出现；所有链接正常；分区页正常 |
| Canvas 不支持 / 绘制异常 | 主星球下方始终有一层 **CSS 渐变球体**作为底衬；Canvas 失败即移除，页面照常 |
| `prefers-reduced-motion: reduce` | 星场静止绘制一帧；星球不转；转场改为 120ms 淡入淡出；分区页入场动画关闭 |
| 低性能设备 | 减少粒子层数与数量、降低 DPR、关闭模糊层 |
| 页面切到后台 / 画布滚出视口 | `visibilitychange` + `IntersectionObserver` 暂停 rAF |
| 转场路由异常 | 3s 硬安全超时强制恢复 |
| WebGL 不可用 | 本项目**不使用 WebGL**，无需处理 |

---

## 3. 路由映射与文件改动

### 3.1 路由映射（URL 对不变）

| URL | 变化 |
| --- | --- |
| `/` | 改写为**星海入口**（原首页内容不删除，见 §3.3） |
| `/universe` | **新增**：五大行星星图 |
| `/blog`、`/blog/[slug]` | 不变（仅移动到 `(site)` 路由组） |
| `/projects`、`/projects/[slug]` | 不变 |
| `/resume` | 不变 + 增加分区外壳 |
| `/about` | 不变 + 增加分区外壳 |
| `/diary`、`/diary/[slug]` | **新增** |
| `/goals` | **新增** |
| 404 | 重绘为深空风格 |

### 3.2 路由组（不改 URL、不改内容）

引入两个路由组，让宇宙层与内容层各自拥有合适的外壳：

```
src/app/
  layout.tsx              # 变成极简根外壳：html/body + 主题脚本 + 跳转链接 + TransitionProvider + TransitionOverlay
  not-found.tsx           # 深空风格 404（根 layout 下，无导航）
  sitemap.ts / robots.ts / icon.svg   # 位置不变
  (cosmic)/
    layout.tsx            # 深空外壳：强制深空调色板 + CosmicChrome + main#main
    page.tsx              # ← /
    universe/page.tsx     # ← /universe
  (site)/
    layout.tsx            # 现有外壳：Navbar + main#main + Footer
    about/page.tsx
    resume/page.tsx
    blog/page.tsx
    blog/[slug]/page.tsx
    projects/page.tsx
    projects/[slug]/page.tsx
    diary/page.tsx
    diary/[slug]/page.tsx
    goals/page.tsx
```

**「宇宙层恒定深空」的实现**：`(cosmic)` layout 的最外层 div 加 `cosmic-scope` 类，在 `globals.css` 里用该类覆盖 `--background` 等变量；同时用

```css
html:has(.cosmic-scope) body { background-color: #03040a; }
html:has(.cosmic-scope) { color-scheme: dark; }
```

解决 body 底色与滚动回弹露白的问题（`.cosmic-scope` 在 SSR HTML 里就存在，因此**无闪屏**）。

### 3.3 原首页内容去哪了（不丢内容）

原首页的「姓名/职业/简介/精选项目/最新文章」属于**已存在且有价值的内容**，迁移去向：

- 姓名 / 职业 / 一句话简介 / 简介段落 / 关注方向 / 经历 / 教育 → **`/about` 与 `/resume` 已经完整承载**（已核对源码），不重复搬运。
- 「精选项目」「最新文章」→ 迁移到 **`/universe` 页面下方的「本星系最新动态」区块**（服务端读取，纯文本卡片），保证内容仍可从入口两跳内到达。
- 首页新增的「快速导航」区块提供 7 个分区的文字入口。

> 结论：没有内容被删除；`/` 的 SEO metadata（title / description / canonical / OG）保留并适配新定位。

### 3.4 新增内容结构

**`content/diary/*.md`**

```markdown
---
date: 2026-10-10
title: "示例日记（请替换为你的真实记录）"
summary: "一句话摘要，会显示在日记时间轴与列表里。"
mood: "平静"          # 可选
tags: ["占位"]        # 可选
draft: false          # 可选，true 时仅开发环境可见
---

正文从这里开始。
```

**`content/goals/*.md`**

```markdown
---
title: "示例目标（请替换）"
horizon: "short"        # short | mid | long
status: "planned"       # planned | active | done | paused
progress: 0             # 0-100，真实进度请自行填写
period: "2026 Q4"       # 可选
order: 1                # 排序，数字小的在前
milestones:
  - title: "第一个里程碑（请替换）"
    done: false
---

目标说明正文。
```

> 内容纪律：日记与目标**各只放明确标注「示例（请替换）」的占位文件**，进度全部为 `0`，不编造任何已完成的成果。

### 3.5 需要修改的现有文件

| 文件 | 改动 |
| --- | --- |
| `src/app/layout.tsx` | 瘦身为根外壳；移除 Navbar/Footer（移入 `(site)`）；挂载 TransitionProvider + Overlay |
| `src/app/globals.css` | 新增宇宙令牌、深空调色板、动画令牌、keyframes、reduced-motion 全局兜底、`:has()` body 规则 |
| `src/lib/site.ts` | `navLinks` 更新为：星图 / 博客 / 项目 / 日记 / 目标 / 关于（首页走品牌 Logo，简历从星图进入）；新增 `cosmic` SEO 文案字段 |
| `src/app/sitemap.ts` | 增加 `/universe`、`/diary`、`/goals`、日记详情 |
| `src/components/layout/Navigation.tsx` | 内部 `Link` 换为 `CosmicLink`（soft 变体） |
| `src/components/layout/Footer.tsx` | 内部 `Link` 换为 `CosmicLink`（soft 变体） |
| `src/app/not-found.tsx` | 深空风格重绘 |
| `README.md` | 补充宇宙层说明、新内容目录、转场机制、启动与验收路径 |

---

## 4. 新增依赖

**新增运行时依赖：0 个。**

| 候选 | 决定 | 理由 |
| --- | --- | --- |
| Three.js / React Three Fiber | ❌ 不引入 | 本项目的星球只需「受光面 + 暗面 + 边缘光 + 缓慢自转纹理」，Canvas 2D 的程序化噪声 + 水平滚动纹理即可达到足够观感；引入 three.js 会给首屏增加数百 KB 与额外的 SSR 边界风险 |
| Motion (framer-motion) | ❌ 不引入 | 转场、入场、悬浮全部可用 CSS 变量 + keyframes + `transition` 表达，且天然支持 `prefers-reduced-motion`；加一个 100KB+ 的动画库只换来更少的控制力 |
| 任何图标库 | ❌ 不引入 | 已有 `src/components/ui/Icons.tsx` 内联 SVG，继续沿用 |

新增的只有**源码文件**与**Markdown 内容**，不增加安装体积。

---

## 5. 风险清单与对策

| # | 风险 | 对策 |
| --- | --- | --- |
| 1 | 移动页面到路由组后 import 路径失效 | 全部使用 `@/` 别名；移动后立刻跑 `npm run build` 验证 |
| 2 | `/diary/[slug]` 的 `generateStaticParams` 返回空数组导致构建失败 | 强制附带 1 个占位日记文件；读取函数在空目录时也不返回空数组给 `generateStaticParams`（有内容才建详情页） |
| 3 | Canvas 在 SSR 阶段被访问导致构建失败 | Canvas 只在 `useEffect` 内获取 `getContext`；服务端只输出空的 `<canvas>` 元素 |
| 4 | 转场遮罩永久停留 | 3s 硬安全超时 + 遮罩 `pointer-events: none` + `status !== idle` 时忽略新请求 |
| 5 | 转场破坏路由行为（新标签页、后退） | 用 `onNavigate` 而非 `preventDefault`；导航始终由 Next.js 原生执行 |
| 6 | 深空页面在浅色主题下露白底 | `.cosmic-scope` + `html:has()` 规则（SSR 可见，无闪屏） |
| 7 | 粒子动画拖垮移动端 | 按面积缩放数量、DPR 上限 2、移动端减层、`visibilitychange` + `IntersectionObserver` 暂停 |
| 8 | 新增动画导致布局跳动 / 文本闪烁 | 动画只用 `transform` / `opacity`；入场动画 `animation-fill-mode: both` 且终态为可见态 |
| 9 | 客户端组件渲染随机内容导致 hydration mismatch | 所有随机值只在 `useEffect` 内产生；SSR 输出确定性的空画布/静态标记 |
| 10 | 遗漏 reduced-motion | CSS 全局 `@media (prefers-reduced-motion: reduce)` 兜底 + JS 侧 `useReducedMotion` 控制 Canvas |
| 11 | 需求文档要求「统一转场」但导航栏用短版不算统一 | 两种变体共用同一遮罩组件、同一色调、同一 easing，只在时长与是否推进镜头上区分；在搜索与验收中明确记录 |
| 12 | 视觉压过可读性 | 文字层永远在氛围层之上并有足够对比度；分区页保留原主题与排版，不叠加粒子 |

---

## 6. 验收标准

### 6.1 命令

```
npm run lint    # 0 error / 0 warning
npm run build   # 0 error，全部路由静态生成或 PPR
npm run dev     # http://localhost:3000
```

### 6.2 浏览器清单（阶段 7 逐项实测）

视口：**1440 / 768 / 390**，另测安全区域与 reduced-motion 模式。

- [ ] 首屏是黑色深空与有远近层次的白色粒子，视觉中心明确。
- [ ] 粒子对鼠标与触摸有柔和反馈，且不阻断点击 / 滚动 / 文本选择。
- [ ] 中央主星球平滑自转，有清晰启动提示，可键盘 Enter 触发。
- [ ] 点击主星球出现镜头推进 / 星球放大穿越动画，而非闪切。
- [ ] 五颗大行星清晰对应简历 / 项目 / 文章 / 日记 / 目标，布局有序可交互。
- [ ] 桌面、平板、手机均有专门排布，标签与点击区域易用。
- [ ] 首页 → 分区、分区之间、分区 → 星图 均走统一转场体系。
- [ ] 真实 URL / 刷新 / 深层链接 / 前进后退正常；旧内容与旧功能保留。
- [ ] 关闭动画、Canvas 失败时仍可正常访问。
- [ ] 无 hydration 报错、无构建失败、无持续遮罩、无主要功能失效、无明显卡顿。
- [ ] 新代码结构清晰、依赖数量合理、关键组件有说明、改动范围可审查。
- [ ] lint / build 结果如实记录。

### 6.3 交付报告（按需求文档第十节 7 项）

1. 实际技术栈与现状审计摘要
2. 最终设计方案与相对原始想法的优化点
3. 新增 / 修改的主要文件及职责
4. 新增依赖及必要性（= 0 个，附说明）
5. 分阶段实现结果与验证命令 / 结果
6. 未完成内容、限制、风险、需要用户补充的真实资料
7. 本地启动方式与浏览器验收路径

---

## 7. 实施顺序（阶段 1 → 7 的落地清单）

1. **阶段 1**：`globals.css` 令牌与 keyframes；`lib/cosmic.ts`；`lib/useReducedMotion.ts`；`CosmicChrome`、`PlanetSphere`、`SectionIntro`；路由组搬迁 + 根 layout 瘦身；跑 lint + build 确认搬迁无损。
2. **阶段 2**：`Starfield` + `CentralPlanet` + `(cosmic)/page.tsx` 入口页。
3. **阶段 3**：`TransitionProvider` + `TransitionOverlay` + `CosmicLink`；接入 Navigation / Footer。
4. **阶段 4**：`StarMap` + `(cosmic)/universe/page.tsx`。
5. **阶段 5**：`lib/diary.ts`、`lib/goals.ts`、类型、内容占位、`/diary`、`/diary/[slug]`、`/goals`；分区页统一 `SectionIntro`；更新 sitemap / site.ts / README。
6. **阶段 6**：性能与无障碍复核（键盘遍历、焦点可见、reduced-motion、对比度、移动端）。
7. **阶段 7**：lint + build + 浏览器多视口验收 + 交付报告。

---

## 8. 实施记录（逐阶段验证结果）

### 8.1 命令结果

| 阶段 | `npm run lint` | `npm run build` | 备注 |
| --- | --- | --- | --- |
| 1 | 0 error | 0 error，路由数与搬迁前一致 | 路由组搬迁无损 |
| 2 | 0 error | 0 error | 入口页 |
| 3 | 0 error | 0 error | 转场接入 |
| 4 | 0 error | 0 error | 星图 |
| 5 | 0 error | 0 error，25 条路由全部生成 | 新增 `/diary`、`/diary/[slug]`、`/goals` |
| 6 | 0 error | 0 error | 见 8.3 |
| 7 | 0 error | 0 error，25 条路由全部生成 | 见 8.2 / 8.3 |

### 8.2 阶段 6 修复的问题（都是实测发现，不是推测）

1. **移动端安全区域完全失效**：根 `viewport` 缺少 `viewportFit: "cover"`，
   导致 iOS 上 `env(safe-area-inset-*)` 恒为 0。已补上，并给 Navbar 加顶部 inset
   （`h-16` → `min-h-16`，避免固定高度把内容压扁）、Footer 加
   `pb-[max(2.5rem,env(safe-area-inset-bottom))]`（避开 Home 指示条）。
2. **宇宙层内部导航没有转场**：`CosmicChrome` 的「入口 / 星图」与首页「快速导航」
   用的是原生 `next/link`，属于「统一转场」的遗漏。已全部换成 `CosmicLink`（warp）。
3. **移动端菜单没有 Esc 关闭、也不会随路由收起**：已补 Esc 关闭 + 焦点还给开合按钮；
   路由变化用 React 官方推荐的「渲染期比较并重置」写法收起（不放进 effect，
   否则触发 `react-hooks/set-state-in-effect`）。
4. **中央主星球的光环与大气光晕被画布硬切成方块**：`CentralPlanet` 把光晕画到
   1.62R、光环画到 1.52R，但画布与球体等高（1.0R），超出部分被裁。
   已把画布放大到 172%（半径按 `min(宽,高)/2/1.72` 反推，球体直径仍等于容器尺寸，
   与 CSS 降级球体严丝合缝）。
   > 踩坑记录：一开始用 `inset: -36%` 放大画布，**无效** —— `<canvas>` 的 `width`/`height`
   > 属性会被浏览器映射成 CSS 尺寸（表现性提示），只给 `inset` 会让定位「过约束」而被
   > 忽略，画布静默退回 300×150 固有尺寸。必须显式写 `width`/`height`。

### 8.3 阶段 7 浏览器验收（实测，非源码推断）

工具：无头 Chrome（CDP `Emulation.setDeviceMetricsOverride` 做真实设备模拟，
`Emulation.setEmulatedMedia` 模拟 reduced-motion）。**注意**：无头 Chrome 的
`--window-size` 有 512px 最小宽度限制，用小窗口截图会得到「被裁切的 512px 布局」，
不能用来判断响应式，必须走 CDP 设备模拟。

| 视口 | 页面 | 横向溢出 | 结论 |
| --- | --- | --- | --- |
| 1440×900 | `/`、`/universe` | 无（scrollWidth 1425 = clientWidth） | 通过 |
| 768×1024 | `/universe` | 无（753 = 753） | 通过（星图布局，5 行星无重叠） |
| 390×844 | `/`、`/universe`、`/goals`、`/diary`、`/blog` | 无（390 = 390） | 通过（星图自动变 5 行纵向列表） |
| 1440×900 + reduced-motion | `/` | 无 | 通过（星场渲染为完整静态帧，星球静止） |

交互实测：

- 移动端菜单：展开 ✅ → 7 项（星图/文章/项目/日记/目标/关于/GitHub）✅ → Esc 关闭 ✅
  → 焦点回到开合按钮 ✅ → 点「项目」跳转 `/projects` 后菜单自动收起 ✅
- 控制台：全部页面 **0 error / 0 warning**
- 对比度：`--cosmic-muted #a7b2cc` on `--cosmic-void #03040a` ≈ 9.5:1；
  `--muted #5b6880` on `#f6f8fc` ≈ 5.3:1；`--muted #97a3bd` on `#0a0f1e` ≈ 7.5:1（均 ≥ AA）

**未能验证的部分（如实记录）**：真机 iOS 的刘海 / Home 指示条实际内缩值，
以及真实触屏手势下的粒子反馈 —— 这两项需要在真实设备上确认。