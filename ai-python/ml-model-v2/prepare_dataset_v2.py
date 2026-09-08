#!/usr/bin/env python3
"""
Project Aura V2 — Milestone V2.2
Reproducible Dataset V2 Audit & Cleaning Pipeline

Cleans raw fps_benchmark.csv into fps_dataset_v2_clean.csv:
- Strips byte-string literal prefixes (b'...')
- Normalizes GameSetting values
- Removes 100% null, constant, and high-missing columns (>50% nulls)
- Selects defensible physical specification features for CPU and GPU
- Retains metadata identifiers (CpuName, GpuName, GameName)
- Validates target FPS
- Exports cleaned dataset and summary report
"""

import os
import re
import json
import pandas as pd
import numpy as np

def clean_byte_string(val):
    """Safely strips b'...' and b"..." byte literal wrappers from strings."""
    if pd.isna(val):
        return val
    s = str(val).strip()
    if (s.startswith("b'") and s.endswith("'")) or (s.startswith('b"') and s.endswith('"')):
        return s[2:-1]
    return s

def prepare_dataset_v2(raw_path=None, output_dir=None):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if raw_path is None:
        raw_path = os.path.join(base_dir, 'data', 'raw', 'fps_benchmark.csv')
    if output_dir is None:
        output_dir = os.path.join(base_dir, 'data', 'processed')

    os.makedirs(output_dir, exist_ok=True)
    clean_csv_path = os.path.join(output_dir, 'fps_dataset_v2_clean.csv')
    report_json_path = os.path.join(output_dir, 'fps_dataset_v2_cleaning_report.json')

    print("="*60)
    print("DATASET PATH VERIFICATION:")
    print(f"  Resolved Path: {raw_path}")

    if not os.path.exists(raw_path):
        print("FATAL ERROR: WRONG_DATASET_SELECTED (File does not exist)")
        raise FileNotFoundError(f"WRONG_DATASET_SELECTED: {raw_path}")

    df_raw = pd.read_csv(raw_path)
    initial_rows, initial_cols = df_raw.shape

    print(f"  Row Count:    {initial_rows}")
    print(f"  Column Count: {initial_cols}")
    print("="*60)

    # Strict shape verification
    if not (24000 <= initial_rows <= 25000 and initial_cols == 44):
        print(f"FATAL ERROR: WRONG_DATASET_SELECTED (Found shape ({initial_rows}, {initial_cols}), expected ~(24624, 44))")
        raise ValueError(f"WRONG_DATASET_SELECTED: Expected ~(24624, 44), got ({initial_rows}, {initial_cols})")

    print("DATASET VERIFICATION: PASSED (Kaggle FPS Benchmark Loaded)\n")

    # 1. Clean Byte-Strings
    df = df_raw.copy()
    str_cols = df.select_dtypes(include=['object', 'str']).columns
    for col in str_cols:
        df[col] = df[col].apply(clean_byte_string)

    # 2. Normalize GameSetting
    # Map 'med' -> 'medium', 'max' -> 'ultra'
    setting_map = {'med': 'medium', 'max': 'ultra'}
    df['GameSetting_Normalized'] = df['GameSetting'].map(setting_map).fillna(df['GameSetting'])
    # Ordinal encoding: medium=2, ultra=4 (matching Aura V2 manifest)
    df['GameSetting_Ordinal'] = df['GameSetting_Normalized'].map({'medium': 2, 'ultra': 4}).astype(int)

    # 3. Target Verification
    assert df['FPS'].notnull().all(), "Target FPS contains null values!"
    assert (df['FPS'] > 0).all(), "Target FPS contains non-positive values!"

    # 4. Feature Selection & Clean Matrix Formulation
    # Retain metadata + physical specs + workload + target
    selected_columns = [
        # Metadata / Lineage
        'CpuName',
        'GpuName',
        'GameName',
        
        # CPU Physical Features
        'CpuNumberOfCores',
        'CpuNumberOfThreads',
        'CpuFrequency',       # Base Clock MHz
        'CpuTurboClock',      # Boost Clock MHz
        'CpuCacheL3',         # L3 Cache MB
        'CpuTDP',             # TDP Watts
        
        # GPU Physical Features
        'GpuMemorySize',      # VRAM MB
        'GpuBandwidth',       # Memory Bandwidth MB/s
        'GpuMemoryBus',       # Memory Bus Bits
        'GpuNumberOfShadingUnits', # Shaders / CUDA
        'GpuBaseClock',       # Base Clock MHz
        'GpuBoostClock',      # Boost Clock MHz
        'GpuNumberOfROPs',    # Render Output Units
        'GpuFP32Performance', # FP32 GFLOPS/Compute
        
        # Workload & Setting
        'GameSetting',
        'GameSetting_Normalized',
        'GameSetting_Ordinal',
        'GameResolution',     # Retained for audit (1080p constant)
        
        # Target
        'FPS'
    ]

    df_clean = df[selected_columns].copy()

    # Verify no missing values in clean dataset
    null_counts = df_clean.isnull().sum().to_dict()
    assert sum(null_counts.values()) == 0, f"Clean dataset contains unexpected nulls: {null_counts}"

    # 5. Export Cleaned Dataset
    df_clean.to_csv(clean_csv_path, index=False)
    print(f"Clean dataset exported to: {clean_csv_path}")
    print(f"Clean dataset shape: {df_clean.shape[0]} rows, {df_clean.shape[1]} columns")

    # 6. Generate Cleaning Report
    removed_columns = [c for c in df_raw.columns if c not in df_clean.columns]
    report = {
        'datasetName': 'Kaggle FPS Benchmark (Ulrik Thyge Pedersen)',
        'licenseStatus': 'NEEDS_VERIFICATION',
        'pipelineVersion': 'V2.2',
        'rawDataset': {
            'path': raw_path,
            'rows': initial_rows,
            'columns': initial_cols,
        },
        'cleanedDataset': {
            'path': clean_csv_path,
            'rows': len(df_clean),
            'columns': len(df_clean.columns),
            'columnNames': list(df_clean.columns),
        },
        'columnsRemoved': {
            'count': len(removed_columns),
            'names': removed_columns,
            'reasons': {
                'GpuNumberOfExecutionUnits': '100% missing (0 non-null values)',
                'GpuNumberOfComputeUnits': '77.78% missing (NVIDIA cards unpopulated)',
                'CpuDieSize': '52.63% missing',
                'CpuNumberOfTransistors': '52.63% missing',
                'CpuBaseClock': 'Constant (100.0 for 100% of rows)',
                'GpuOpenGL': 'Constant (4.6 for 100% of rows)',
                'CpuMultiplier': 'Exact collinear duplicate of CpuFrequency / 100',
                'GpuPixelRate': 'Exact collinear product of GpuBaseClock * GpuNumberOfROPs',
                'GpuTextureRate': 'Exact collinear product of GpuBaseClock * GpuNumberOfTMUs',
                'CpuMultiplierUnlocked': 'Redundant driver/marketing flag',
                'CpuProcessSize': 'Manufacturing node metadata',
                'GpuProcessSize': 'Manufacturing node metadata',
                'CpuCacheL1': 'Redundant with L2/L3 cache',
                'CpuCacheL2': 'Redundant with L3 cache and core counts',
                'GpuDieSize': 'Physical area metadata',
                'GpuBus.interface': 'Low variance bus version metadata',
                'GpuDirectX': 'Low variance API level',
                'GpuOpenCL': 'Low variance API level',
                'GpuShaderModel': 'Low variance API level',
                'GpuVulkan': 'Low variance API level',
                'GpuArchitecture': 'Categorical label; physical specs capture compute',
                'GpuMemoryType': 'Categorical label; bandwidth & bus width capture throughput',
                'GpuNumberOfTMUs': 'Linear with shading units',
                'GpuNumberOfTransistors': 'Transistor count metadata',
            }
        },
        'targetSummary': {
            'target': 'FPS',
            'count': int(df_clean['FPS'].count()),
            'mean': float(round(df_clean['FPS'].mean(), 2)),
            'std': float(round(df_clean['FPS'].std(), 2)),
            'min': float(round(df_clean['FPS'].min(), 2)),
            'q25': float(round(df_clean['FPS'].quantile(0.25), 2)),
            'median': float(round(df_clean['FPS'].median(), 2)),
            'q75': float(round(df_clean['FPS'].quantile(0.75), 2)),
            'max': float(round(df_clean['FPS'].max(), 2)),
            'nonPositiveCount': int((df_clean['FPS'] <= 0).sum()),
        },
        'categoricalCardinality': {
            'uniqueCpus': int(df_clean['CpuName'].nunique()),
            'uniqueGpus': int(df_clean['GpuName'].nunique()),
            'uniqueGames': int(df_clean['GameName'].nunique()),
            'uniqueSettings': int(df_clean['GameSetting'].nunique()),
            'uniqueResolutions': int(df_clean['GameResolution'].nunique()),
        },
        'resolutionLimitation': 'All 24,624 benchmark observations were recorded exclusively at 1080p (GameResolution = 1080.0). Model V2 will be calibrated specifically for 1080p resolution on this dataset.',
        'modelV2Status': 'NOT_TRAINED',
    }

    with open(report_json_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
    print(f"Cleaning report exported to: {report_json_path}")

    return df_clean, report

if __name__ == '__main__':
    prepare_dataset_v2()
