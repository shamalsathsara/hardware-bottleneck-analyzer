import pandas as pd

#Load dataset
data = pd.read_csv('FpsTest/fps_dataset.csv')

#Print column names
print("---Data Columns---")
print(data.columns.tolist())

#Print the first 5 rows FOR CHECKING
print("\n--- First 5 Rows---")
print(data.head())