import pandas as pd
import numpy as np
import json
import os

raw_csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'data', 'raw', 'fps_benchmark.csv'))
print("="*60)
print("DATASET PATH VERIFICATION:")
print(f"  Resolved Path: {raw_csv_path}")

if not os.path.exists(raw_csv_path):
    print("FATAL ERROR: WRONG_DATASET_SELECTED (File does not exist)")
    raise FileNotFoundError(f"WRONG_DATASET_SELECTED: {raw_csv_path}")

df = pd.read_csv(raw_csv_path)

print(f"  Row Count:    {len(df)}")
print(f"  Column Count: {len(df.columns)}")
print("="*60)

# Strict shape verification
if not (24000 <= len(df) <= 25000 and len(df.columns) == 44):
    print(f"FATAL ERROR: WRONG_DATASET_SELECTED (Found shape {df.shape}, expected ~(24624, 44))")
    raise ValueError(f"WRONG_DATASET_SELECTED: Expected ~(24624, 44), got {df.shape}")

print("DATASET VERIFICATION: PASSED (Kaggle FPS Benchmark Loaded)\n")

print("\n--- ALL COLUMN NAMES & DTYPES ---")
for i, (col, dtype) in enumerate(df.dtypes.items()):
    missing_cnt = df[col].isnull().sum()
    missing_pct = (missing_cnt / len(df)) * 100
    n_unique = df[col].nunique()
    sample_val = df[col].dropna().iloc[0] if df[col].dropna().shape[0] > 0 else "ALL_NULL"
    print(f"{i+1:2d}. {col:30s} | {str(dtype):10s} | Nulls: {missing_cnt:6d} ({missing_pct:5.1f}%) | Unique: {n_unique:6d} | Sample: {repr(sample_val)[:40]}")

print("\n--- TARGET FPS SUMMARY ---")
fps_col = 'FPS'
if fps_col in df.columns:
    fps = df[fps_col]
    print(f"Count: {fps.count()}")
    print(f"Mean: {fps.mean():.2f}")
    print(f"Std: {fps.std():.2f}")
    print(f"Min: {fps.min()}")
    print(f"25%: {fps.quantile(0.25):.2f}")
    print(f"Median (50%): {fps.median():.2f}")
    print(f"75%: {fps.quantile(0.75):.2f}")
    print(f"90%: {fps.quantile(0.90):.2f}")
    print(f"99%: {fps.quantile(0.99):.2f}")
    print(f"Max: {fps.max()}")
    print(f"FPS <= 0: {(fps <= 0).sum()}")
    print(f"FPS > 500: {(fps > 500).sum()}")
    print(f"FPS > 1000: {(fps > 1000).sum()}")
    print(f"FPS is null: {fps.isnull().sum()}")

print("\n--- CATEGORICAL & HIGH LEVEL COLUMNS ---")
for col in ['GameName', 'GameResolution', 'GameSetting', 'CpuName', 'GpuName', 'GpuManufacturer', 'CpuManufacturer']:
    if col in df.columns:
        unique_vals = df[col].unique()
        print(f"\n{col} (Count: {len(unique_vals)}):")
        print(unique_vals[:20])

print("\n--- DUPLICATE ROW AUDIT ---")
exact_dupes = df.duplicated().sum()
print(f"Exact full-row duplicates: {exact_dupes}")

core_cols = ['CpuName', 'GpuName', 'GameName', 'GameResolution', 'GameSetting']
present_core = [c for c in core_cols if c in df.columns]
if present_core:
    core_dupes = df.duplicated(subset=present_core, keep=False).sum()
    print(f"Rows sharing same (CPU, GPU, Game, Res, Setting): {core_dupes}")

print("\n--- CHECK FOR BYTE STRINGS ---")
byte_cols = []
for col in df.select_dtypes(include=['object']).columns:
    sample_series = df[col].dropna().astype(str)
    has_b_prefix = sample_series.str.startswith("b'").any() or sample_series.str.startswith('b"').any()
    if has_b_prefix:
        byte_cols.append(col)
        print(f"Column '{col}' has byte-string prefix! Example: {sample_series.iloc[0]}")

print(f"Total byte-string columns: {len(byte_cols)}")

print("\n--- CONSTANT / ZERO-VARIANCE COLUMNS ---")
constant_cols = [col for col in df.columns if df[col].nunique() <= 1]
print(f"Constant columns ({len(constant_cols)}): {constant_cols}")
for c in constant_cols:
    val = df[c].unique()
    print(f"  {c}: {val}")

print("\n--- NUMERIC SPECIFICATION SUMMARY ---")
num_cols = df.select_dtypes(include=[np.number]).columns
print(df[num_cols].describe().T[['count', 'mean', 'std', 'min', '50%', 'max']])
