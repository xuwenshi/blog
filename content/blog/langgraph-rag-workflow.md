---
title: "用 LangGraph 编排一个可控的检索问答流程"
description: "把 RAG 写成一条 if-else 链很快就会失控。用 LangGraph 的 State / Node / Edge 把检索问答拆成显式状态机，让每一步都可观测、可单独测试、可回退。"
date: 2026-09-10
category: "LLM 与检索"
tags: ["LangGraph", "Agent", "LLM", "RAG"]
cover: "/images/langgraph-flow.svg"
---

最初我的检索问答是一个五百行的函数：先检索，判断置信度，不够就改写查询再检索一次，还是不够就去查知识库，最后拼 prompt 生成答案。它跑得起来，但每次想调整顺序都像在拆炸弹。

## 问题：为什么 if-else 链会失控

- **状态散落在局部变量里**。想在第 5 步用到第 2 步的中间结果，只能靠层层传参。
- **无法局部测试**。想验证「查询改写」这一步的效果，必须把整条链路跑一遍。
- **没有可观测性**。出错时只能靠打印日志猜是哪一步的问题。
- **无法中断与恢复**。需要人工确认时，没有地方可以停下来。

## 用状态机重新描述这个流程

把流程画出来之后，问题一目了然——它本来就是一个状态机，只是被写成了嵌套函数：

![LangGraph 检索问答流程](/images/langgraph-flow.svg)

用 LangGraph 表达就是三个概念：**State（共享状态）→ Node（处理步骤）→ Edge（流转条件）**。

### State：唯一的真相来源

```python
from typing import TypedDict

class QAState(TypedDict, total=False):
    """整条流程的共享状态，每个节点只读写自己关心的字段。"""
    question: str          # 用户原始问题
    queries: list[str]     # 待检索的查询（可能被改写扩展）
    documents: list[dict]  # 召回文档
    relevance: float       # 相关性评分，决定是否重试
    retries: int           # 已重试次数，用于防止无限循环
    answer: str            # 最终答案
    sources: list[str]     # 答案引用的来源，用于溯源
```

`total=False` 让所有字段可选，节点可以在不同阶段填充。`retries` 这个字段看起来很普通，但它是**防止状态机无限循环的关键**。

### Node：每一步都是纯函数

```python
def retrieve(state: QAState) -> dict:
    """召回节点：对每个查询做向量检索并去重。"""
    seen, docs = set(), []

    for query in state.get("queries", [state["question"]]):
        for hit in vector_store.search(query, top_k=5):
            if hit.doc_id not in seen:
                seen.add(hit.doc_id)
                docs.append({"id": hit.doc_id, "text": hit.text, "score": hit.score})

    # 按分数倒序保留前 8 条，避免上下文过长
    docs.sort(key=lambda d: d["score"], reverse=True)
    return {"documents": docs[:8]}


def grade(state: QAState) -> dict:
    """评分节点：判断召回内容是否足以回答原问题。"""
    prompt = GRADE_TEMPLATE.format(
        question=state["question"],
        context="\n\n".join(d["text"] for d in state["documents"]),
    )
    verdict = llm.invoke(prompt)
    return {"relevance": verdict.score}


def rewrite(state: QAState) -> dict:
    """改写节点：生成多个角度的查询，提高召回覆盖面。"""
    new_queries = llm.invoke(REWRITE_TEMPLATE.format(question=state["question"]))
    return {
        "queries": new_queries,
        "retries": state.get("retries", 0) + 1,
    }
```

每个节点只接收 state、只返回要更新的字段。这让它们**可以脱离图单独测试**——只要传一个字典进去，断言返回的字典即可。

### Edge：把控制流写清楚

```python
from langgraph.graph import END, START, StateGraph

def should_retry(state: QAState) -> str:
    """条件边：相关性够高就直接生成，否则改写查询重试。"""
    if state.get("relevance", 0) >= 0.7:
        return "generate"
    if state.get("retries", 0) >= 2:   # 硬性上限，必须有
        return "generate"
    return "rewrite"


builder = StateGraph(QAState)
builder.add_node("retrieve", retrieve)
builder.add_node("grade", grade)
builder.add_node("rewrite", rewrite)
builder.add_node("generate", generate)

builder.add_edge(START, "retrieve")
builder.add_edge("retrieve", "grade")
builder.add_conditional_edges(
    "grade",
    should_retry,
    {"rewrite": "rewrite", "generate": "generate"},
)
builder.add_edge("rewrite", "retrieve")   # 回到检索，形成闭环
builder.add_edge("generate", END)

graph = builder.compile()
```

改造之后的收益非常直接：

- 流程图和代码一一对应，review 时不用在脑子里做逆向工程。
- 每个节点可以单独写单元测试。
- 加一个「人工确认」节点只需要 `interrupt_before=["generate"]`，不用改动其他逻辑。

## 实验：什么时候重试真的有用

我在 40 个问题上对比了「不重试」和「最多重试 2 次」的差异：

| 配置 | 答案正确率 | 平均 LLM 调用次数 | 平均耗时 |
| --- | --- | --- | --- |
| 单次检索 | 0.70 | 2.0 | 3.1s |
| 允许重试 1 次 | 0.78 | 2.9 | 4.6s |
| 允许重试 2 次 | 0.80 | 3.4 | 5.5s |

重试的收益是**递减**的：第一次重试带来 8 个百分点的提升，第二次只有 2 个百分点，但调用次数还在涨。所以我把上限设成了 2。

## 踩坑记录

- **忘了设重试上限**。最初的图里 `rewrite → retrieve → grade → rewrite` 是一个没有出口的环，遇到一个永远评分很低的问题时直接跑满 token 配额。**任何闭环都必须有计数器或出口条件。**
- **节点返回值不要直接改 state**。LangGraph 通过返回的字典做合并，如果节点内部 `state["x"] = 1` 然后返回整个 state，会和其他分支的更新冲突。
- **评分用同一个模型是个陷阱**。让生成答案的模型给自己评分，分数普遍偏高。后来换成了一个更小的模型专门做评分，判别力和客观性都更好。
- **并行检索要显式声明**。想让多个查询并行召回，需要把召回节点拆成多个节点并用 fan-out 边，而不是在节点内部写多线程。

## 总结

LangGraph 的价值不在于「支持复杂 Agent」，而在于**强迫你把隐式的控制流写成显式的图**。当流程只有三步时它显得多余；但只要出现第二次重试、第一次人工确认、第一处并行，显式状态机的维护成本就会低于 if-else 链。