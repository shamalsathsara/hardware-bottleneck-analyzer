import pandas as pd
import numpy as np

df = pd.read_csv('FpsTest/fps_dataset.csv')
# Convert Avg FPS to float first
df['Avg FPS'] = df['Avg FPS'].astype(float)
df.loc[df['RAM (GB)'] == 8, 'Avg FPS'] *= 0.85
df.loc[df['RAM (GB)'] == 32, 'Avg FPS'] *= 1.05
# Round and back to int
df['Avg FPS'] = np.round(df['Avg FPS']).astype(int)

# Apply same logic to Min FPS and Max FPS to keep consistency
df['Min FPS'] = df['Min FPS'].astype(float)
df.loc[df['RAM (GB)'] == 8, 'Min FPS'] *= 0.85
df.loc[df['RAM (GB)'] == 32, 'Min FPS'] *= 1.05
df['Min FPS'] = np.round(df['Min FPS']).astype(int)

df['Max FPS'] = df['Max FPS'].astype(float)
df.loc[df['RAM (GB)'] == 8, 'Max FPS'] *= 0.85
df.loc[df['RAM (GB)'] == 32, 'Max FPS'] *= 1.05
df['Max FPS'] = np.round(df['Max FPS']).astype(int)

df.to_csv('FpsTest/fps_dataset.csv', index=False)
print("Successfully modified FPS according to RAM amount!")
