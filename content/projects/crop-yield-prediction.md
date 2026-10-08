---
name: "作物产量预测建模"
description: "基于公开气象与土壤数据的产量预测项目。通过分季节填充与积温特征工程，把交叉验证 R² 从 0.61 提升到 0.75。"
techStack: ["Python", "scikit-learn", "pandas", "NumPy", "Matplotlib"]
status: "completed"
period: "2026.03 - 2026.08"
role: "数据科学与建模"
article: "agriculture-feature-engineering"
featured: true
order: 2
---

一个端到端的数据建模项目：从原始气象观测数据出发，构建可用于预测作物单位面积产量的模型，并完整记录每一步的数据处理决策。

## 背景

公开农业数据集提供了日频的气象观测与土壤属性，但数据质量参差不齐：生长季设备维护频繁导致缺失集中出现，量纲差异巨大，且缺乏农学意义上的衍生特征。

## 问题

1. 气象数据缺失集中在生长季——恰恰是对产量影响最大的时段
2. 温度（时点量）与降水（累计量）混用同一套统计方式
3. 直接把 200 天日频序列丢给模型，效果很差

## 目标

- 建立可复现的数据清洗与特征工程流程
- 对比 SVM / MLP / 决策树三类模型的泛化表现
- 输出特征重要性分析，验证领域知识的价值

## 核心实现

### 分季节填充

```python
def impute_by_season(df, cols):
    """按站点 + 生长季分组，用组内中位数填充缺失值。"""
    df = df.copy()
    df["is_growing"] = df["date"].dt.month.between(4, 9)

    for col in cols:
        grouped = df.groupby(["station_id", "is_growing"])[col]
        df[col] = df[col].fillna(grouped.transform("median"))
        df[col] = df[col].fillna(df[col].median())  # 兜底
    return df
```

### 积温特征构造

农学上真正决定作物发育进度的是**有效积温**，而不是单日温度：

```python
BASE_TEMP = 10
df["effective_temp"] = (df["temperature"] - BASE_TEMP).clip(lower=0)

group = df.groupby(["station_id", "year"])
df["gdd"] = group["effective_temp"].cumsum()      # 生长度日
df["cum_precip"] = group["precipitation"].cumsum() # 累计降水
df["water_balance"] = df["cum_precip"] - df["potential_et"]
```

### 生育期聚合

把日频数据按播种期 / 分蘖期 / 拔节期 / 灌浆期聚合，得到 26 个建模特征。

## 实验

在同一份数据、同一模型上逐步加入特征，观察 5 折交叉验证 R²：

| 特征集合 | 特征数 | R² |
| --- | --- | --- |
| 原始气象 + 全局均值填充 | 6 | 0.61 |
| 分季节填充 | 6 | 0.64 |
| + 积温 / 累计降水 | 10 | 0.71 |
| + 极端天气计数 | 12 | 0.73 |
| + 生育期聚合 | 26 | **0.75** |

模型对比（完整特征集）：

| 模型 | R² | MAE |
| --- | --- | --- |
| SVM (RBF) | 0.68 | 0.52 t/ha |
| MLP | 0.71 | 0.47 t/ha |
| 梯度提升树 | **0.75** | **0.41 t/ha** |

## 问题与解决

- **标准化顺序错误导致虚高**：最初在划分数据集前做了全局 `fit_transform`，交叉验证 R² 达到 0.85，上线后跌到 0.60。改为把标准化放进 Pipeline，每一折独立拟合。
- **区域特征泄漏**：`station_id` 作为数值特征进入模型，导致模型在背站点而非学习气象规律，已移除。
- **降水量取对数产生 `-inf`**：存在大量 0 值，改为 `log1p` 处理。

## 结果

- 交叉验证 R² 从 0.61 提升到 0.75，其中特征工程的贡献（+0.14）远大于更换模型（+0.02）
- 特征重要性显示，灌浆期的积温和累计降水是最重要的两个特征，与农学经验一致
- 沉淀出一套可复用的数据清洗规范，后续项目直接沿用

## 后续计划

把生育期的划分从固定月份改为按积温阈值动态判定，更贴近不同品种的实际生长节奏。