---
title: "RAG 分块策略：为什么固定长度切分总是效果不好"
description: "用固定字符数切分文档是最省事的做法，也是最容易埋下隐患的做法。本文对比四种分块策略，并给出一个可复现的评估方法来判断哪种更适合你的语料。"
date: 2026-09-24
category: "LLM 与检索"
tags: ["RAG", "LLM", "向量检索", "文本分块"]
cover: "/images/rag-pipeline.svg"
---

检索增强生成（RAG）系统的第一个环节是分块：把长文档切成若干片段，分别向量化后存入向量库。很多教程会直接给出 `chunk_size=512` 这样的默认值，但在实际项目里，这个数字几乎总是错的。

## 问题：固定长度切分破坏了什么

固定长度切分（fixed-size chunking）按字符数或 token 数机械地切分文本，实现只要十行代码：

```python
def fixed_size_chunks(text: str, size: int = 512, overlap: int = 50) -> list[str]:
    """最简单的固定长度切分，带滑动窗口重叠。"""
    chunks = []
    step = size - overlap
    for start in range(0, len(text), step):
        chunk = text[start : start + size].strip()
        if chunk:
            chunks.append(chunk)
    return chunks
```

它破坏的东西比想象中多：

1. **切断语义单元**。一句话、一张表格、一段代码被从中间截断，检索到的片段无法独立回答任何问题。
2. **稀释关键信息**。一个 512 字符的片段里可能 480 个字符都是铺垫，真正相关的那句话被淹没在噪声中。
3. **表格与列表失效**。Markdown 表格被拦腰截断后，表头和表体分离，模型看到的是无意义的数字列。

## 四种分块策略对比

| 策略 | 切分依据 | 优点 | 适用场景 |
| --- | --- | --- | --- |
| 固定长度 | 字符 / token 数 | 实现简单、块大小均匀 | 无结构纯文本、日志 |
| 递归切分 | 段落 → 句子 → 字符 | 尽量保持语义完整 | 通用文档、说明文 |
| 结构化切分 | 标题层级 | 保留上下文归属 | Markdown、HTML、技术文档 |
| 语义切分 | 相邻句子相似度 | 块内主题一致 | 长篇文章、会议记录 |

### 递归切分

递归切分（recursive chunking）先尝试在最大的语义边界切，切不动再降级到更小的边界：

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=120,
    # 从"段落"逐级降级到"字符"，尽量不在句子中间断开
    separators=["\n## ", "\n\n", "\n", "。", "！", "？", "；", " ", ""],
    keep_separator=True,
)

chunks = splitter.split_text(markdown_text)
```

这里的 `separators` 是关键：**分隔符列表需要针对中文语料调整**。默认值是英文的 `["\n\n", "\n", " ", ""]`，对中文长句几乎无效——中文没有空格，最后往往退化成按字符硬切。

### 结构化切分

对技术文档而言，标题本身就是最有价值的结构信息。按标题切分不仅能让每个块语义自洽，还能把标题路径写进块的元数据：

```python
import re

def structure_aware_chunks(markdown: str) -> list[dict]:
    """按 Markdown 标题切分，并把标题路径附加到每个块的元数据中。"""
    chunks, stack = [], []

    for block in re.split(r"(?m)^(?=#{1,6}\s)", markdown):
        heading = re.match(r"^(#{1,6})\s+(.*)$", block)
        if heading:
            level, title = len(heading.group(1)), heading.group(2).strip()
            # 维护标题栈，保证深层标题能继承父级路径
            stack = stack[: level - 1] + [title]

        if not block.strip():
            continue

        chunks.append({
            "text": block.strip(),
            # 例如 "RAG 检索 → 召回优化 → 重排序"
            "heading_path": " → ".join(stack),
        })

    return chunks
```

把 `heading_path` 一起向量化（或至少存入元数据用于过滤），能显著缓解「检索到的片段缺少上下文」的问题。

## 一个可以落地的评估方法

分块策略好不好，不能靠感觉。我的做法是构造一个小规模但可靠的评测集：

1. 从语料中挑 **30 个真实问题**，每个问题标注它应该命中的原文片段。
2. 对每种分块策略，跑一遍检索，统计 **Recall@5**（正确答案是否出现在前 5 条结果里）。
3. 同时记录 **平均块长度**，用于观察「召回率是否靠堆块数换来的」。

```python
def evaluate(chunks: list[str], questions: list[dict], k: int = 5) -> dict:
    """questions: [{"query": str, "gold_doc_id": str}]"""
    hits, total_len = 0, 0

    for item in questions:
        results = vector_store.search(item["query"], top_k=k)
        # 只要黄金片段出现在前 k 条里就算命中
        if any(r.doc_id == item["gold_doc_id"] for r in results):
            hits += 1

    total_len = sum(len(c) for c in chunks) / max(len(chunks), 1)
    return {
        f"recall@{k}": hits / len(questions),
        "avg_chunk_len": round(total_len, 1),
        "chunk_count": len(chunks),
    }
```

## 实验数据

在一个约 12 万字的中文技术文档语料上，四种策略的对比结果：

| 策略 | Recall@5 | 平均块长度 | 块数量 |
| --- | --- | --- | --- |
| 固定长度 512 | 0.63 | 512 | 268 |
| 递归切分 800 | 0.74 | 711 | 184 |
| 结构化切分 | 0.86 | 892 | 151 |
| 结构化 + 标题路径 | **0.91** | 934 | 151 |

结论很明确：**在这个语料上，结构信息比块大小更重要**。固定长度策略的召回率最低，而且它检索到的片段最容易让人工评审看不懂——因为片段本身就不完整。

## 踩坑记录

- **重叠并非越多越好**。把 overlap 从 120 提高到 300 后，Recall@5 只涨了 0.01，但存储量增加了四成。重叠的作用是防止边界切断关键句，而不是提供冗余上下文。
- **块太大反而伤召回**。向量是把整段文本压成一个点，块越长，语义越被平均掉。900 字符左右是不错的起点，但必须用自己的语料验证。
- **不要忽略过滤**。有了 `heading_path` 之后，可以先按章节过滤再检索，这对「只在某一章节内找答案」这类问题提升非常明显。

## 总结

分块不是预处理里可以随便设个默认值的步骤，它直接决定了检索的上限。我的建议是：**先用结构化切分，补齐元数据，再用评测集验证参数**，而不是一开始就去调 chunk_size 这个数字。