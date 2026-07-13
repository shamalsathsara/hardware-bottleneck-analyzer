import pandas as pd
import numpy as np

# Modifies FPS metrics in the dataset based on RAM capacity.
# Outputs to a new file to prevent destructive overwriting of the original dataset,
# which would cause compounding scaling errors if run multiple times.

SOURCE_FILE = 'FpsTest/fps_dataset.csv'
OUTPUT_FILE = 'FpsTest/fps_dataset_fixed.csv'

df = pd.read_csv(SOURCE_FILE)

# Apply scaling factors to simulate RAM constraints and headroom:
# - 8GB RAM: 15% FPS reduction due to memory pressure
# - 32GB RAM: 5% FPS increase due to memory headroom
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

# Serialize the modified dataset to the designated output file
df.to_csv(OUTPUT_FILE, index=False)
print(f"✅ FPS scaling successfully applied.")
print(f"   Output saved to: {OUTPUT_FILE}")
print(f"   Original dataset preserved: {SOURCE_FILE}")
print(f"\n   NOTE: Ensure train.py is updated to consume '{OUTPUT_FILE}'.")
