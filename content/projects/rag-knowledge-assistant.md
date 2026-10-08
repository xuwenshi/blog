---
name: "文档知识库问答助手"
description: "面向技术文档的检索问答系统：结构化分块 + 向量检索 + LangGraph 状态机编排，支持相关性评分与查询改写重试，答案可溯源到原文。"
techStack: ["Python", "LangGraph", "FastAPI", "Qdrant", "Embedding"]
status: "in-progress"
period: "2026.07 - 至今"
role: "架构与开发"
article: "langgraph-rag-workflow"
featured: true
order: 3
---

把散落在多份技术文档中的结论变成可检索、可溯源的知识。项目当前处于开发阶段，检索链路已完成，正在优化重排序环节。

## 背景

团队的技术文档分散在多个来源，格式不统一，检索靠全文搜索，命中率和可读性都很差。目标是做一个能回答「某条结论出自哪份文档的哪一节」的问答助手。

## 目标

- 支持 Markdown / HTML / PDF 三种来源的结构化解析
- 答案必须能溯源到具体的文档与章节
- 检索质量可量化：建立评测集并持续跟踪 Recall@5
- 流程可观测、可中断，便于人工介入

## 架构

![检索问答流程](/images/rag-pipeline.svg)

四个阶段：

1. **解析与分块**：按标题层级切分，为每个块附加 `heading_path` 元数据
2. **向量化与存储**：嵌入模型生成向量，写入 Qdrant，元数据一并存储用于过滤
3. **检索与编排**：LangGraph 状态机负责召回 → 评分 → 改写重试 → 生成
4. **服务层**：FastAPI 暴露查询接口，返回答案与来源列表

## 核心实现

### 结构化分块

```python
def structure_aware_chunks(markdown: str) -> list[dict]:
    """按 Markdown 标题切分，并把标题路径写入元数据。"""
    chunks, stack = [], []

    for block in re.split(r"(?m)^(?=#{1,6}\s)", markdown):
        heading = re.match(r"^(#{1,6})\s+(.*)$", block)
        if heading:
            level, title = len(heading.group(1)), heading.group(2).strip()
            stack = stack[: level - 1] + [title]

        if block.strip():
            chunks.append({
                "text": block.strip(),
                "heading_path": " → ".join(stack),
            })

    return chunks
```

### 状态机编排

```python
builder = StateGraph(QAState)
builder.add_node("retrieve", retrieve)
builder.add_node("grade", grade)
builder.add_node("rewrite", rewrite)
builder.add_node("generate", generate)

builder.add_edge(START, "retrieve")
builder.add_edge("retrieve", "grade")
builder.add_conditional_edges(
    "grade",
    should_retry,                       # 相关性 ≥ 0.7 或重试达 2 次则进入生成
    {"rewrite": "rewrite", "generate": "generate"},
)
builder.add_edge("rewrite", "retrieve")
builder.add_edge("generate", END)
```

每个节点是纯函数，接收 state 并返回要更新的字段，因此可以脱离整条链路单独测试。

## 实验

40 个问题的评测集上，重试策略的影响：

| 配置 | 答案正确率 | 平均 LLM 调用 | 平均耗时 |
| --- | --- | --- | --- |
| 单次检索 | 0.70 | 2.0 | 3.1s |
| 重试 1 次 | 0.78 | 2.9 | 4.6s |
| 重试 2 次 | 0.80 | 3.4 | 5.5s |

重试收益递减明显：第一次 +8 个百分点，第二次仅 +2。最终把上限设为 2 次。

分块策略对比（约 12 万字中文技术文档）：

| 策略 | Recall@5 |
| --- | --- |
| 固定长度 512 | 0.63 |
| 递归切分 800 | 0.74 |
| 结构化切分 | 0.86 |
| 结构化 + 标题路径 | **0.91** |

## 问题与解决

- **状态机死循环**：`rewrite → retrieve → grade → rewrite` 形成闭环且没有出口，遇到持续低分的问题时跑满 token 配额。加入 `retries` 计数与硬性上限解决。
- **自评分数偏高**：让生成模型给自己打分，分数普遍虚高。改为用独立的小模型专门做相关性评分。
- **中文递归切分退化**：默认分隔符是为英文设计的，对中文长句无效。调整为中文标点优先的分隔符列表后效果明显改善。

## 结果

- 结构化分块把 Recall@5 从 0.63 提升到 0.91
- 答案全部附带来源章节路径，人工核对成本大幅下降
- 流程可观测：每一步的中间状态都可单独输出，便于定位问题

## 后续计划

- 引入重排序模型（cross-encoder）进一步优化前 5 条结果的排序
- 支持增量索引，文档更新时只重算变化的块
- 补充多轮对话上下文管理