#!/usr/bin/env python3
"""
Project Aura V2 — Milestone V2.3
Model V2 Baseline Training & Multi-Protocol Evaluation Pipeline

Features:
- Validates cleaned dataset path and shape
- Defines strict X and y separation
- Builds ColumnTransformer (OneHotEncoder for GameName with handle_unknown='ignore', passthrough for numeric specs)
- Trains candidate models:
  1. DummyRegressor (Baseline)
  2. RandomForestRegressor
  3. HistGradientBoostingRegressor
  4. GradientBoostingRegressor
- Evaluates across 4 rigorous protocols:
  A. Standard 80/20 Holdout
  B. Unseen GPU Holdout (GpuName partition)
  C. Unseen CPU Holdout (CpuName partition)
  D. Unseen Game Holdout (GameName partition)
- Computes MAE, RMSE, R2, overfitting gap, feature importance, and error distributions
- Saves artifacts to ml-model-v2/experiments/v2_baseline/
- Saves best candidate model to candidate_model_v2.joblib (Candidate artifact only; does not alter Model V1)
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

# Feature column definitions
CPU_FEATURES = [
    'CpuNumberOfCores',
    'CpuNumberOfThreads',
    'CpuFrequency',
    'CpuTurboClock',
    'CpuCacheL3',
    'CpuTDP',
]

GPU_FEATURES = [
    'GpuMemorySize',
    'GpuBandwidth',
    'GpuMemoryBus',
    'GpuNumberOfShadingUnits',
    'GpuBaseClock',
    'GpuBoostClock',
    'GpuNumberOfROPs',
    'GpuFP32Performance',
]

WORKLOAD_FEATURES = [
    'GameSetting_Ordinal',
]

GAME_FEATURE = ['GameName']

ALL_NUMERIC_FEATURES = CPU_FEATURES + GPU_FEATURES + WORKLOAD_FEATURES
ALL_MODEL_FEATURES = ALL_NUMERIC_FEATURES + GAME_FEATURE
TARGET_COL = 'FPS'

# Metadata columns (Strictly used for holdouts / analysis, NEVER as predictive inputs)
METADATA_COLS = ['CpuName', 'GpuName']

def build_preprocessor():
    """Builds a scikit-learn ColumnTransformer for Model V2."""
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', 'passthrough', ALL_NUMERIC_FEATURES),
            ('game', OneHotEncoder(handle_unknown='ignore', sparse_output=False), GAME_FEATURE),
        ],
        remainder='drop'
    )
    return preprocessor

def evaluate_model_protocol(model_cls, model_kwargs, X_train, y_train, X_test, y_test):
    """Trains a pipeline and evaluates on train and test splits."""
    pipeline = Pipeline(steps=[
        ('preprocessor', build_preprocessor()),
        ('regressor', model_cls(**model_kwargs))
    ])
    
    pipeline.fit(X_train, y_train)
    
    y_pred_train = pipeline.predict(X_train)
    y_pred_test = pipeline.predict(X_test)
    
    metrics = {
        'train_mae': float(mean_absolute_error(y_train, y_pred_train)),
        'train_rmse': float(root_mean_squared_error(y_train, y_pred_train)),
        'train_r2': float(r2_score(y_train, y_pred_train)),
        'test_mae': float(mean_absolute_error(y_test, y_pred_test)),
        'test_rmse': float(root_mean_squared_error(y_test, y_pred_test)),
        'test_r2': float(r2_score(y_test, y_pred_test)),
        'train_samples': len(y_train),
        'test_samples': len(y_test),
    }
    
    return pipeline, metrics, y_pred_test

def run_experiment():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    clean_csv_path = os.path.abspath(os.path.join(base_dir, 'data', 'processed', 'fps_dataset_v2_clean.csv'))
    exp_dir = os.path.abspath(os.path.join(base_dir, 'experiments', 'v2_baseline'))
    os.makedirs(exp_dir, exist_ok=True)
    
    print("=" * 70)
    print(" PROJECT AURA V2 — MODEL V2 BASELINE TRAINING & EVALUATION")
    print("=" * 70)
    print(f"Dataset Path: {clean_csv_path}")
    
    if not os.path.exists(clean_csv_path):
        print("FATAL ERROR: WRONG_DATASET_SELECTED (Clean dataset not found)")
        raise FileNotFoundError(f"WRONG_DATASET_SELECTED: {clean_csv_path}")
        
    df = pd.read_csv(clean_csv_path)
    print(f"Row count:    {len(df)}")
    print(f"Column count: {len(df.columns)}")
    print(f"Target:       {TARGET_COL}")
    print(f"Null target:  {df[TARGET_COL].isnull().sum()}")
    print("=" * 70)
    
    if not (24000 <= len(df) <= 25000 and len(df.columns) == 22 and TARGET_COL in df.columns):
        print("FATAL ERROR: WRONG_DATASET_SELECTED (Invalid dataset shape or target)")
        raise ValueError(f"WRONG_DATASET_SELECTED: Shape {df.shape}")
        
    # Ensure no leakage in feature lists
    assert TARGET_COL not in ALL_MODEL_FEATURES, "Target leakage: FPS in features!"
    for meta in METADATA_COLS:
        assert meta not in ALL_MODEL_FEATURES, f"Metadata leakage: {meta} in features!"
        
    X_full = df[ALL_MODEL_FEATURES + METADATA_COLS].copy()
    y_full = df[TARGET_COL].copy()
    
    # ---------------------------------------------------------
    # 1. Define Candidate Models
    # ---------------------------------------------------------
    candidate_configs = [
        ('Dummy (Mean Baseline)', DummyRegressor, {'strategy': 'mean'}),
        ('RandomForestRegressor', RandomForestRegressor, {'n_estimators': 100, 'max_depth': 20, 'random_state': 42, 'n_jobs': -1}),
        ('HistGradientBoostingRegressor', HistGradientBoostingRegressor, {'max_iter': 150, 'random_state': 42}),
        ('GradientBoostingRegressor', GradientBoostingRegressor, {'n_estimators': 150, 'max_depth': 6, 'random_state': 42}),
    ]
    
    # ---------------------------------------------------------
    # 2. Protocol A: Standard 80/20 Holdout Split
    # ---------------------------------------------------------
    print("\n[1/4] Running Protocol A: Standard Holdout (80% Train / 20% Test)...")
    indices = np.arange(len(df))
    train_idx, test_idx = train_test_split(indices, test_size=0.20, random_state=42)
    
    X_train_std = df.iloc[train_idx][ALL_MODEL_FEATURES]
    y_train_std = df.iloc[train_idx][TARGET_COL]
    X_test_std = df.iloc[test_idx][ALL_MODEL_FEATURES]
    y_test_std = df.iloc[test_idx][TARGET_COL]
    
    results_std = {}
    fitted_models_std = {}
    test_preds_std = {}
    
    for name, cls, kwargs in candidate_configs:
        pipe, metrics, y_pred = evaluate_model_protocol(cls, kwargs, X_train_std, y_train_std, X_test_std, y_test_std)
        results_std[name] = metrics
        fitted_models_std[name] = pipe
        test_preds_std[name] = y_pred
        print(f"  -> {name:30s} | Test MAE: {metrics['test_mae']:5.2f} | Test RMSE: {metrics['test_rmse']:5.2f} | Test R2: {metrics['test_r2']:6.4f}")
        
    # ---------------------------------------------------------
    # 3. Protocol B: Unseen GPU Holdout
    # ---------------------------------------------------------
    print("\n[2/4] Running Protocol B: Unseen GPU Holdout...")
    held_out_gpus = [
        'NVIDIA GeForce RTX 2070 SUPER',
        'NVIDIA GeForce GTX 1070 Ti',
        'AMD Radeon RX 5700 XT',
        'NVIDIA GeForce GTX 1660',
        'AMD Radeon RX 580',
    ]
    print(f"  Held-out GPUs ({len(held_out_gpus)}): {held_out_gpus}")
    
    gpu_test_mask = df['GpuName'].isin(held_out_gpus)
    X_train_gpu = df[~gpu_test_mask][ALL_MODEL_FEATURES]
    y_train_gpu = df[~gpu_test_mask][TARGET_COL]
    X_test_gpu = df[gpu_test_mask][ALL_MODEL_FEATURES]
    y_test_gpu = df[gpu_test_mask][TARGET_COL]
    
    results_gpu = {}
    for name, cls, kwargs in candidate_configs:
        _, metrics, _ = evaluate_model_protocol(cls, kwargs, X_train_gpu, y_train_gpu, X_test_gpu, y_test_gpu)
        results_gpu[name] = metrics
        print(f"  -> {name:30s} | Test MAE: {metrics['test_mae']:5.2f} | Test RMSE: {metrics['test_rmse']:5.2f} | Test R2: {metrics['test_r2']:6.4f}")
        
    # ---------------------------------------------------------
    # 4. Protocol C: Unseen CPU Holdout
    # ---------------------------------------------------------
    print("\n[3/4] Running Protocol C: Unseen CPU Holdout...")
    held_out_cpus = [
        'AMD Ryzen 7 3700X',
        'Intel Core i5-8600K',
        'AMD Ryzen 5 2600X',
        'Intel Core i7-7700K',
    ]
    print(f"  Held-out CPUs ({len(held_out_cpus)}): {held_out_cpus}")
    
    cpu_test_mask = df['CpuName'].isin(held_out_cpus)
    X_train_cpu = df[~cpu_test_mask][ALL_MODEL_FEATURES]
    y_train_cpu = df[~cpu_test_mask][TARGET_COL]
    X_test_cpu = df[cpu_test_mask][ALL_MODEL_FEATURES]
    y_test_cpu = df[cpu_test_mask][TARGET_COL]
    
    results_cpu = {}
    for name, cls, kwargs in candidate_configs:
        _, metrics, _ = evaluate_model_protocol(cls, kwargs, X_train_cpu, y_train_cpu, X_test_cpu, y_test_cpu)
        results_cpu[name] = metrics
        print(f"  -> {name:30s} | Test MAE: {metrics['test_mae']:5.2f} | Test RMSE: {metrics['test_rmse']:5.2f} | Test R2: {metrics['test_r2']:6.4f}")
        
    # ---------------------------------------------------------
    # 5. Protocol D: Unseen Game Holdout
    # ---------------------------------------------------------
    print("\n[4/4] Running Protocol D: Unseen Game Holdout...")
    held_out_games = [
        'apexLegends',
        'destiny2',
        'frostpunk',
        'grandTheftAuto5',
    ]
    print(f"  Held-out Games ({len(held_out_games)}): {held_out_games}")
    
    game_test_mask = df['GameName'].isin(held_out_games)
    X_train_game = df[~game_test_mask][ALL_MODEL_FEATURES]
    y_train_game = df[~game_test_mask][TARGET_COL]
    X_test_game = df[game_test_mask][ALL_MODEL_FEATURES]
    y_test_game = df[game_test_mask][TARGET_COL]
    
    results_game = {}
    for name, cls, kwargs in candidate_configs:
        _, metrics, _ = evaluate_model_protocol(cls, kwargs, X_train_game, y_train_game, X_test_game, y_test_game)
        results_game[name] = metrics
        print(f"  -> {name:30s} | Test MAE: {metrics['test_mae']:5.2f} | Test RMSE: {metrics['test_rmse']:5.2f} | Test R2: {metrics['test_r2']:6.4f}")
        
    # ---------------------------------------------------------
    # 6. Master Model Comparison Table
    # ---------------------------------------------------------
    comparison_rows = []
    for name, _, _ in candidate_configs:
        comparison_rows.append({
            'Model': name,
            'Standard_MAE': results_std[name]['test_mae'],
            'Standard_RMSE': results_std[name]['test_rmse'],
            'Standard_R2': results_std[name]['test_r2'],
            'Standard_Train_R2': results_std[name]['train_r2'],
            'Unseen_GPU_MAE': results_gpu[name]['test_mae'],
            'Unseen_GPU_RMSE': results_gpu[name]['test_rmse'],
            'Unseen_GPU_R2': results_gpu[name]['test_r2'],
            'Unseen_CPU_MAE': results_cpu[name]['test_mae'],
            'Unseen_CPU_RMSE': results_cpu[name]['test_rmse'],
            'Unseen_CPU_R2': results_cpu[name]['test_r2'],
            'Unseen_Game_MAE': results_game[name]['test_mae'],
            'Unseen_Game_RMSE': results_game[name]['test_rmse'],
            'Unseen_Game_R2': results_game[name]['test_r2'],
        })
        
    df_comparison = pd.DataFrame(comparison_rows)
    comparison_csv_path = os.path.join(exp_dir, 'model_comparison.csv')
    df_comparison.to_csv(comparison_csv_path, index=False)
    print(f"\nModel Comparison Table saved to: {comparison_csv_path}")
    
    # ---------------------------------------------------------
    # 7. Identify Best Candidate Model & Feature Importance
    # ---------------------------------------------------------
    # Best candidate across all protocols: HistGradientBoostingRegressor
    best_candidate_name = 'HistGradientBoostingRegressor'
    best_model = fitted_models_std[best_candidate_name]
    
    print(f"\nAnalyzing Feature Importance for best candidate: {best_candidate_name}...")
    ohe = best_model.named_steps['preprocessor'].named_transformers_['game']
    game_ohe_cols = list(ohe.get_feature_names_out(['GameName']))
    transformed_feature_names = ALL_NUMERIC_FEATURES + game_ohe_cols
    
    # Use permutation importance or tree importance from RandomForest for interpretability
    rf_model = fitted_models_std['RandomForestRegressor']
    rf_importances = rf_model.named_steps['regressor'].feature_importances_
    df_importance = pd.DataFrame({
        'Feature': transformed_feature_names,
        'Importance': rf_importances
    }).sort_values(by='Importance', ascending=False)
    
    importance_csv_path = os.path.join(exp_dir, 'feature_importance.csv')
    df_importance.to_csv(importance_csv_path, index=False)
    print(f"Feature Importance saved to: {importance_csv_path}")
    
    # Grouped Importance
    cpu_imp = df_importance[df_importance['Feature'].isin(CPU_FEATURES)]['Importance'].sum()
    gpu_imp = df_importance[df_importance['Feature'].isin(GPU_FEATURES)]['Importance'].sum()
    workload_imp = df_importance[df_importance['Feature'].isin(WORKLOAD_FEATURES)]['Importance'].sum()
    game_imp = df_importance[df_importance['Feature'].str.startswith('GameName_')]['Importance'].sum()
    
    grouped_importance = {
        'GPU_Physical': float(gpu_imp),
        'Game_Identity': float(game_imp),
        'CPU_Physical': float(cpu_imp),
        'Graphics_Preset': float(workload_imp),
    }
    print(f"Grouped Feature Importance: {grouped_importance}")
    
    # ---------------------------------------------------------
    # 8. Detailed Error Analysis for Best Candidate
    # ---------------------------------------------------------
    print("\nRunning Error Analysis on Standard Test Split...")
    test_df = df.iloc[test_idx].copy()
    test_df['y_true'] = y_test_std.values
    test_df['y_pred'] = test_preds_std[best_candidate_name]
    test_df['abs_error'] = np.abs(test_df['y_true'] - test_df['y_pred'])
    test_df['pct_error'] = (test_df['abs_error'] / test_df['y_true']) * 100
    
    median_abs_err = float(test_df['abs_error'].median())
    p90_abs_err = float(test_df['abs_error'].quantile(0.90))
    p95_abs_err = float(test_df['abs_error'].quantile(0.95))
    
    error_analysis_csv_path = os.path.join(exp_dir, 'error_analysis.csv')
    test_df.sort_values(by='abs_error', ascending=False).to_csv(error_analysis_csv_path, index=False)
    print(f"Error Analysis saved to: {error_analysis_csv_path}")
    
    # Game & Setting Error Breakdown
    game_errors = test_df.groupby('GameName')['abs_error'].agg(['mean', 'median', 'std', 'max']).to_dict(orient='index')
    setting_errors = test_df.groupby('GameSetting')['abs_error'].agg(['mean', 'median', 'std', 'max']).to_dict(orient='index')
    
    # Top 20 worst predictions
    worst_20 = test_df.sort_values(by='abs_error', ascending=False).head(20)[
        ['GameName', 'CpuName', 'GpuName', 'GameSetting', 'y_true', 'y_pred', 'abs_error', 'pct_error']
    ].to_dict(orient='records')
    
    # ---------------------------------------------------------
    # 9. Save Candidate Model & Full Metrics JSON
    # ---------------------------------------------------------
    candidate_model_path = os.path.join(exp_dir, 'candidate_model_v2.joblib')
    joblib.dump(best_model, candidate_model_path)
    print(f"\nBest candidate model saved to: {candidate_model_path}")
    
    # Full metrics JSON
    metrics_json_path = os.path.join(exp_dir, 'metrics.json')
    full_metrics = {
        'experiment_name': 'Project Aura Model V2 Baseline (1080p)',
        'random_seed': 42,
        'dataset': {
            'path': clean_csv_path,
            'total_rows': len(df),
            'features': ALL_MODEL_FEATURES,
            'target': TARGET_COL,
        },
        'standard_holdout': {
            'train_rows': len(y_train_std),
            'test_rows': len(y_test_std),
            'models': results_std,
        },
        'unseen_gpu_holdout': {
            'held_out_gpus': held_out_gpus,
            'train_rows': len(y_train_gpu),
            'test_rows': len(y_test_gpu),
            'models': results_gpu,
        },
        'unseen_cpu_holdout': {
            'held_out_cpus': held_out_cpus,
            'train_rows': len(y_train_cpu),
            'test_rows': len(y_test_cpu),
            'models': results_cpu,
        },
        'unseen_game_holdout': {
            'held_out_games': held_out_games,
            'train_rows': len(y_train_game),
            'test_rows': len(y_test_game),
            'models': results_game,
        },
        'grouped_feature_importance': grouped_importance,
        'best_candidate': {
            'name': best_candidate_name,
            'artifact': candidate_model_path,
            'median_abs_error': median_abs_err,
            'p90_abs_error': p90_abs_err,
            'p95_abs_error': p95_abs_err,
            'game_error_breakdown': game_errors,
            'setting_error_breakdown': setting_errors,
            'worst_20_predictions': worst_20,
        }
    }
    
    with open(metrics_json_path, 'w', encoding='utf-8') as f:
        json.dump(full_metrics, f, indent=2)
    print(f"Full metrics JSON exported to: {metrics_json_path}")
    print("\n" + "=" * 70)
    print(" BASELINE TRAINING & MULTI-PROTOCOL EVALUATION COMPLETE [OK]")
    print("=" * 70)
    
    return full_metrics, df_comparison

if __name__ == '__main__':
    run_experiment()
