---
title: "农业数据挖掘中的特征工程：从原始气象数据到可建模特征"
description: "原始气象与土壤数据往往带着缺失、量纲混乱和季节性偏差，直接丢给模型效果很差。本文记录从数据清洗到特征构造的完整流程，以及一次让模型 R² 提升 0.14 的关键改造。"
date: 2026-08-26
category: "数据科学"
tags: ["特征工程", "数据挖掘", "scikit-learn", "农业数据"]
---

这是一个作物产量预测的项目。数据来自公开的气象与土壤数据集，目标是预测单位面积产量。模型从 SVM 换成 MLP 又换成梯度提升，R² 始终卡在 0.6 附近——问题不在模型，而在喂进去的特征。

## 问题：原始数据的三个陷阱

### 缺失不是随机的

气象站的数据缺失有明显的季节性。生长季（4 月到 9 月）设备维护频繁，缺失率反而更高：

```python
import pandas as pd

df = pd.read_csv("data/weather_raw.csv", parse_dates=["date"])
missing = df.isna().mean().sort_values(ascending=False)
print(missing[missing > 0])

# 生长季（4-9 月）的缺失率远高于非生长季
df["is_growing"] = df["date"].dt.month.between(4, 9)
print(df.groupby("is_growing")["precipitation"].apply(lambda s: s.isna().mean()))
```

如果直接用全局均值填充，等于**把生长季的信息抹平**——而生长季恰好是影响产量最关键的时段。

### 量纲不统一

温度用摄氏度、降水用毫米、日照用小时、土壤 pH 无量纲。距离类模型（SVM、KNN）对量纲极其敏感，一个 0~2000 的降水特征会把 0~1 的 pH 特征完全压住。

### 累计量与时点量混在一起

降水是累计量（一段时间内的总和），温度是时点量（某个时刻的观测值）。两者不能用同一套统计方式处理。

## 解决方案

### 第一步：按生长季分组填充

```python
def impute_by_season(df: pd.DataFrame, cols: list[str]) -> pd.DataFrame:
    """
    对气象列按「生长季 / 非生长季」分组，用组内中位数填充。
    相比全局均值，这样能保留季节性差异。
    """
    df = df.copy()
    df["is_growing"] = df["date"].dt.month.between(4, 9)

    for col in cols:
        # 先按站点 + 生长季分组填充，最贴近该站点当季的典型值
        grouped = df.groupby(["station_id", "is_growing"])[col]
        df[col] = df[col].fillna(grouped.transform("median"))
        # 站点内依然全空的列，再退回全局中位数兜底
        df[col] = df[col].fillna(df[col].median())

    return df


weather_cols = ["temperature", "precipitation", "sunshine_hours", "humidity"]
df = impute_by_season(df, weather_cols)
```

### 第二步：构造有物理意义的衍生特征

这是提升最大的一步。原始数据只有「日平均温度」，但作物真正关心的是**积温**——生长期内有效温度的总和：

```python
import numpy as np

def add_agronomic_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy().sort_values(["station_id", "date"])

    # 有效积温：日平均温度高于基温（10℃）的部分累加
    BASE_TEMP = 10
    df["effective_temp"] = (df["temperature"] - BASE_TEMP).clip(lower=0)

    group = df.groupby(["station_id", "year"])
    df["gdd"] = group["effective_temp"].cumsum()        # 生长度日
    df["cum_precip"] = group["precipitation"].cumsum()  # 累计降水

    # 极端天气计数：高温日、暴雨日
    df["heat_days"] = group["temperature"].transform(lambda s: (s > 35).cumsum())
    df["heavy_rain_days"] = group["precipitation"].transform(
        lambda s: (s > 50).cumsum()
    )

    # 水分平衡：降水与蒸散的差值，反映水分是否充足
    df["water_balance"] = df["cum_precip"] - df["potential_et"]

    return df
```

### 第三步：按生长阶段聚合

把日频数据聚合成几个关键生育期的统计量，比把 200 天的原始序列直接丢给模型有效得多：

```python
STAGES = {
    "sowing": (4, 5),       # 播种期
    "tillering": (6, 6),    # 分蘖期
    "jointing": (7, 7),     # 拔节期
    "filling": (8, 9),      # 灌浆期
}

def aggregate_by_stage(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    rows = []

    for (station, year), sub in df.groupby(["station_id", "year"]):
        record = {"station_id": station, "year": year}

        for stage, (start, end) in STAGES.items():
            stage_df = sub[sub["date"].dt.month.between(start, end)]
            if stage_df.empty:
                continue
            # 每个生育期取均值与极值，既反映水平也反映波动
            record[f"{stage}_gdd"] = stage_df["gdd"].max()
            record[f"{stage}_precip"] = stage_df["precipitation"].sum()
            record[f"{stage}_temp_mean"] = stage_df["temperature"].mean()
            record[f"{stage}_temp_max"] = stage_df["temperature"].max()
            record[f"{stage}_sunshine"] = stage_df["sunshine_hours"].mean()

        rows.append(record)

    return pd.DataFrame(rows)
```

### 第四步：流水线封装

把标准化和建模串成同一个 Pipeline，避免「先划分数据集再标准化」这类数据泄漏：

```python
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import cross_val_score

numeric_features = X.select_dtypes(include=np.number).columns.tolist()

preprocess = ColumnTransformer([
    ("num", Pipeline([
        ("impute", SimpleImputer(strategy="median")),
        ("scale", StandardScaler()),
    ]), numeric_features),
])

model = Pipeline([
    ("preprocess", preprocess),
    ("regressor", GradientBoostingRegressor(
        n_estimators=400,
        learning_rate=0.05,
        max_depth=3,
        random_state=42,
    )),
])

# 交叉验证：标准化只在训练折上拟合，测试折不参与，杜绝数据泄漏
scores = cross_val_score(model, X, y, cv=5, scoring="r2")
print(f"R² = {scores.mean():.3f} ± {scores.std():.3f}")
```

## 实验：每一步带来多少提升

我在同一份数据、同一个模型上逐步加入特征，观察交叉验证 R² 的变化：

| 特征集合 | 特征数 | 交叉验证 R² |
| --- | --- | --- |
| 原始气象 + 全局均值填充 | 6 | 0.61 |
| 分季节填充 | 6 | 0.64 |
| + 积温 / 累计降水 | 10 | 0.71 |
| + 极端天气计数 | 12 | 0.73 |
| + 生育期聚合（完整方案） | 26 | **0.75** |

提升最大的两步是「分季节填充」（+0.03）和「积温特征」（+0.07）。**后者不需要更多数据，只需要领域知识**。

## 踩坑记录

- **标准化顺序错误**。最初我在划分训练集之前就对整个数据集做了 `fit_transform`，交叉验证分数虚高到 0.85，上线后直接跌到 0.6。标准化必须放在 Pipeline 里，让它在每一折上独立拟合。
- **区域特征泄漏**。把 `station_id` 当数值特征放进了模型，而训练集和测试集是按年份划分的、站点有重叠——模型实际上在背站点，不是在学气象规律。
- **降水做对数变换前要加一**。有大量 0 值，直接取对数会产生 `-inf`。

## 总结

在那个项目里，把模型从 SVM 换成梯度提升只带来约 0.02 的提升，而**分季节填充 + 积温特征**带来了 0.14。特征工程的上限远高于换模型，尤其在有明确领域知识的场景里。下一步我准备把生育期的划分从固定月份改成按积温阈值动态判定，这应该更符合作物的实际生长节奏。