import pandas as pd
import numpy as np

# FIX BUG 4: This script used to OVERWRITE the original CSV file.
# Running it twice would stack the multipliers (0.85 * 0.85 = 0.7225), permanently
# corrupting the training data with no way to recover.
# Fix: Write to a NEW file (fps_dataset_fixed.csv) and keep original untouched.

SOURCE_FILE = 'FpsTest/fps_dataset.csv'
OUTPUT_FILE = 'FpsTest/fps_dataset_fixed.csv'

df = pd.read_csv(SOURCE_FILE)

# Apply RAM-based FPS scaling
# 8GB  RAM → 15% FPS reduction (memory pressure)
# 32GB RAM → 5% FPS increase  (headroom)
df['Avg FPS'] = df['Avg FPS'].astype(float)
df.loc[df['RAM (GB)'] == 8,  'Avg FPS'] *= 0.85
df.loc[df['RAM (GB)'] == 32, 'Avg FPS'] *= 1.05
df['Avg FPS'] = np.round(df['Avg FPS']).astype(int)

df['Min FPS'] = df['Min FPS'].astype(float)
df.loc[df['RAM (GB)'] == 8,  'Min FPS'] *= 0.85
df.loc[df['RAM (GB)'] == 32, 'Min FPS'] *= 1.05
df['Min FPS'] = np.round(df['Min FPS']).astype(int)

df['Max FPS'] = df['Max FPS'].astype(float)
df.loc[df['RAM (GB)'] == 8,  'Max FPS'] *= 0.85
df.loc[df['RAM (GB)'] == 32, 'Max FPS'] *= 1.05
df['Max FPS'] = np.round(df['Max FPS']).astype(int)

# Save to a NEW file — original CSV is preserved untouched
df.to_csv(OUTPUT_FILE, index=False)
print(f"✅ Successfully modified FPS according to RAM amount!")
print(f"   Output saved to: {OUTPUT_FILE}")
print(f"   Original file preserved: {SOURCE_FILE}")
print(f"\n   NOTE: Update train.py to read from '{OUTPUT_FILE}' to use the fixed dataset.")
