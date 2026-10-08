import GithubSlugger from "github-slugger";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import type { Element, Root as HastRoot } from "hast";
import type { Root as MdastRoot, RootContent } from "mdast";

import type { TocItem } from "@/types";

/**
 * 给代码块加上语言标识。
 *
 * 读取 <code class="language-xxx">，把 xxx 写到外层容器的 data-language 上，
 * 由 CSS 通过 ::before 渲染成右上角的小标签。
 *
 * 这里额外包一层 div 而不是直接给 <pre> 加属性：<pre> 是横向滚动容器，
 * 绝对定位的标签会跟着内容一起滚走。
 */
function rehypeCodeBlockLanguage() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "pre" || !parent || index === undefined) return;

      const code = node.children.find(
        (child): child is Element =>
          child.type === "element" && child.tagName === "code",
      );
      if (!code) return;

      // Shiki 直接写入 hast 的 `class` 属性（而不是惯用的 `className`），两者都要兼容
      const raw = code.properties.className ?? code.properties.class;
      const classNames = Array.isArray(raw) ? raw.map(String) : [];
      const language = classNames
        .find((name) => name.startsWith("language-"))
        ?.slice("language-".length);

      const wrapper: Element = {
        type: "element",
        tagName: "div",
        properties: {
          className: ["code-block"],
          ...(language && language !== "plaintext"
            ? { dataLanguage: language }
            : {}),
        },
        children: [node],
      };

      parent.children[index] = wrapper;
    });
  };
}

/** 把 mdast 节点里的纯文本抽出来（标题可能包含行内代码、链接等） */
function nodeToText(node: RootContent | { type: string; value?: unknown; children?: unknown[] }): string {
  if (typeof (node as { value?: unknown }).value === "string") {
    return (node as { value: string }).value;
  }

  const children = (node as { children?: unknown[] }).children;
  if (!Array.isArray(children)) return "";

  return children
    .map((child) => nodeToText(child as { type: string; children?: unknown[] }))
    .join("");
}

/**
 * 从 Markdown 提取 h2 / h3 目录。
 *
 * 这里对「所有」标题调用 slugger.slug()，因为 rehype-slug 也是按文档顺序
 * 为 h1~h6 逐个生成 id 的 —— 跳过任何一个都会导致目录锚点错位。
 */
export function extractHeadings(markdown: string): TocItem[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MdastRoot;
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];

  visit(tree, "heading", (node) => {
    const text = nodeToText(node).trim();
    const id = slugger.slug(text);

    if (node.depth === 2 || node.depth === 3) {
      items.push({ id, text, level: node.depth });
    }
  });

  return items;
}

/**
 * Markdown → HTML。
 *
 * 刻意不使用 MDX：纯 Markdown 内容完全够用，而且能在构建期一次性完成
 * 代码高亮与目录生成，不需要额外的运行时编译和客户端组件。
 *
 * @see https://nextjs.org/docs 中的 caching 章节：fs 同步读取属于「可预测值」，
 * 因此文章页会在构建时被完整预渲染。
 */
export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      content: { type: "text", value: "#" },
      properties: {
        className: ["heading-anchor"],
        ariaLabel: "本节链接",
      },
    })
    .use(rehypeShiki, {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: "light",
      // 未知语言退化为纯文本，避免构建直接失败
      fallbackLanguage: "plaintext",
      addLanguageClass: true,
    })
    .use(rehypeCodeBlockLanguage)
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}