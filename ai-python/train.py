# --------------------------------------------------------------------------
# AI TRAINING SCRIPT — PROJECT AURA
# --------------------------------------------------------------------------
# This script is NOT run by the live web app. It is only used by the developer
# to train the Random Forest AI model using the CSV dataset, evaluate its
# accuracy, and save the resulting "Brain" to a .joblib file.

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import joblib

# Step 1: Load the raw benchmark dataset
print("Loading Dataset....") 
data = pd.read_csv('FpsTest/fps_dataset.csv') 

# Step 2: Split the data into Inputs (X) and Output (y)
# We drop columns that the AI shouldn't use to cheat (like other FPS numbers)
X = data.drop(columns=['Min FPS','Avg FPS','Max FPS','Bottleneck Score','Total System TDP (W)'])
# The AI's sole goal is to predict the Average FPS
y = data['Avg FPS']  

# Step 3: Data Preprocessing (Encoding)
# Machine Learning models only understand numbers. get_dummies converts text columns 
# (like GPU Manufacturer = "AMD") into binary columns (Manufacturer_AMD = 1 or 0).
X = pd.get_dummies(X)

# Step 4: Split data into Training and Testing sets
# We hold back 20% of the data. The AI will never see this 20% during training,
# so we can use it later to test how well the AI predicts "unseen" hardware combinations.
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42) 

# Step 5: Train the AI Brain
print("Training the Random Forest AI (Wait a second)...")
# A Random Forest works by creating many "Decision Trees" and averaging their answers.
# We are building a forest with 100 trees (n_estimators=100).
model = RandomForestRegressor(n_estimators=100, random_state=42) 
model.fit(X_train, y_train) # This is where the actual machine learning happens!

# Step 6: Test the AI on the unseen 20% of data
print("Testing the AI on unseen data...")
predictions = model.predict(X_test)

# Calculate the Mean Absolute Error (how many FPS the AI is off by, on average)
error = mean_absolute_error(y_test, predictions)

print(f"✅ AI Training Complete! Average Prediction Error: {error:.2f} FPS")

# Step 7: Save the trained AI model to the hard drive so the Flask server can load it
print("Saving the trained AI model to disk...")
joblib.dump(model, 'project_aura.joblib')
# Also save the exact column structure so the Flask server knows how to format incoming data
joblib.dump(list(X.columns), 'ai_columns.joblib') 

print("✅ Brain successfully saved!")
