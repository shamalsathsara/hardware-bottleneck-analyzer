"""
Project Aura — AI Model Accuracy Report
Comprehensive evaluation of the trained Random Forest Regressor
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    mean_absolute_percentage_error
)
import warnings
warnings.filterwarnings('ignore')

print("=" * 60)
print("  PROJECT AURA — AI ACCURACY REPORT")
print("=" * 60)

# ── 1. Load model & data ───────────────────────────────────
print("\n📦 Loading trained model and dataset...")
model        = joblib.load('project_aura.joblib')
model_cols   = joblib.load('ai_columns.joblib')
data         = pd.read_csv('FpsTest/fps_dataset.csv')

print(f"   Dataset rows  : {len(data)}")
print(f"   Dataset cols  : {len(data.columns)}")
print(f"   Model features: {len(model_cols)}")
print(f"   Model type    : {type(model).__name__}")
print(f"   Trees in forest: {model.n_estimators}")

# ── 2. Reproduce the exact training split ─────────────────
X = data.drop(columns=['Min FPS', 'Avg FPS', 'Max FPS', 'Bottleneck Score', 'Total System TDP (W)'])
y = data['Avg FPS']
X = pd.get_dummies(X)
X = X.reindex(columns=model_cols, fill_value=0)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"\n   Training samples: {len(X_train)}")
print(f"   Test samples    : {len(X_test)}")

# ── 3. Predictions ─────────────────────────────────────────
y_pred = model.predict(X_test)

# ── 4. Core Metrics ────────────────────────────────────────
mae   = mean_absolute_error(y_test, y_pred)
rmse  = np.sqrt(mean_squared_error(y_test, y_pred))
r2    = r2_score(y_test, y_pred)
mape  = mean_absolute_percentage_error(y_test, y_pred) * 100

print("\n" + "=" * 60)
print("  CORE PERFORMANCE METRICS")
print("=" * 60)
print(f"  MAE   (Mean Absolute Error)  : {mae:.4f} FPS")
print(f"  RMSE  (Root Mean Sq Error)   : {rmse:.4f} FPS")
print(f"  R²    (Coefficient of Det.)  : {r2:.6f}")
print(f"  MAPE  (Mean Abs % Error)     : {mape:.4f} %")
print(f"  Accuracy (1 - MAPE)          : {100 - mape:.4f} %")

# ── 5. Error Distribution ──────────────────────────────────
errors      = np.abs(y_pred - y_test)
within_5fps  = (errors <= 5).sum()
within_10fps = (errors <= 10).sum()
within_15fps = (errors <= 15).sum()
n = len(y_test)

print("\n" + "=" * 60)
print("  PREDICTION ACCURACY BY FPS TOLERANCE")
print("=" * 60)
print(f"  Within  ±5  FPS : {within_5fps}/{n}  ({within_5fps/n*100:.1f}%)")
print(f"  Within ±10  FPS : {within_10fps}/{n}  ({within_10fps/n*100:.1f}%)")
print(f"  Within ±15  FPS : {within_15fps}/{n}  ({within_15fps/n*100:.1f}%)")
print(f"  Max error       : {errors.max():.2f} FPS")
print(f"  Min error       : {errors.min():.2f} FPS")
print(f"  Median error    : {np.median(errors):.2f} FPS")
print(f"  Std of errors   : {errors.std():.2f} FPS")

# ── 6. Cross-Validation (more robust check) ────────────────
print("\n" + "=" * 60)
print("  5-FOLD CROSS VALIDATION (full dataset)")
print("=" * 60)
cv_scores = cross_val_score(model, X, y, cv=5, scoring='neg_mean_absolute_error', n_jobs=-1)
cv_mae    = -cv_scores
print(f"  CV MAE per fold : {[f'{s:.2f}' for s in cv_mae]}")
print(f"  CV MAE mean     : {cv_mae.mean():.4f} FPS")
print(f"  CV MAE std      : {cv_mae.std():.4f} FPS")

cv_r2 = cross_val_score(model, X, y, cv=5, scoring='r2', n_jobs=-1)
print(f"  CV R²  per fold : {[f'{s:.4f}' for s in cv_r2]}")
print(f"  CV R²  mean     : {cv_r2.mean():.6f}")

# ── 7. FPS Range Performance ───────────────────────────────
print("\n" + "=" * 60)
print("  ACCURACY BY FPS RANGE")
print("=" * 60)

results_df = pd.DataFrame({'actual': y_test.values, 'predicted': y_pred, 'error': errors.values})
bins   = [0, 30, 60, 90, 120, 200, 9999]
labels = ['<30 FPS (Slideshow)', '30–60 FPS (Playable)', '60–90 FPS (Smooth)',
          '90–120 FPS (Great)', '120–200 FPS (High Refresh)', '200+ FPS (Elite)']
results_df['range'] = pd.cut(results_df['actual'], bins=bins, labels=labels)

for label, group in results_df.groupby('range', observed=True):
    if len(group) > 0:
        r_mae = group['error'].mean()
        r_pct = len(group) / n * 100
        print(f"  {label:<28}: n={len(group):>3}  ({r_pct:4.1f}%)  avg err={r_mae:.2f} FPS")

# ── 8. Top 10 Feature Importances ─────────────────────────
print("\n" + "=" * 60)
print("  TOP 10 MOST IMPORTANT FEATURES (what drives FPS)")
print("=" * 60)
importances = pd.Series(model.feature_importances_, index=model_cols).sort_values(ascending=False)
for feat, imp in importances.head(10).items():
    bar = '█' * int(imp * 200)
    print(f"  {feat:<35}: {imp:.4f}  {bar}")

# ── 9. Sample Predictions ─────────────────────────────────
print("\n" + "=" * 60)
print("  SAMPLE PREDICTIONS vs ACTUAL (first 10 test rows)")
print("=" * 60)
print(f"  {'Actual FPS':>12}  {'Predicted FPS':>14}  {'Error':>8}  {'Status':>10}")
print("  " + "-" * 52)
for actual, pred, err in zip(y_test.values[:10], y_pred[:10], errors.values[:10]):
    status = '✅ Good' if err <= 5 else (' Fair' if err <= 10 else '❌ High')
    print(f"  {actual:>12.1f}  {pred:>14.2f}  {err:>7.2f}  {status:>10}")

# ── 10. Final Verdict ──────────────────────────────────────
print("\n" + "=" * 60)
print("  FINAL VERDICT")
print("=" * 60)

if r2 >= 0.99:
    grade = "S — Exceptional"
elif r2 >= 0.97:
    grade = "A+ — Excellent"
elif r2 >= 0.95:
    grade = "A  — Very Good"
elif r2 >= 0.90:
    grade = "B  — Good"
else:
    grade = "C  — Needs Improvement"

print(f"  Model Grade     : {grade}")
print(f"  R² Score        : {r2:.6f} (1.0 = perfect)")
print(f"  Avg FPS error   : {mae:.2f} FPS")
print(f"  CV Stability    : {cv_mae.std():.4f} std dev (lower = more stable)")
print(f"  Overfitting Risk: {'Low ✅' if abs(cv_mae.mean() - mae) < 5 else 'Possible '}")

print("\n" + "=" * 60)
print("  Report generated for: Project Aura (project_aura.joblib)")
print("=" * 60 + "\n")
