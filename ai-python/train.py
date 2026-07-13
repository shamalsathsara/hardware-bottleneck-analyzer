# --------------------------------------------------------------------------
# AI TRAINING SCRIPT — PROJECT AURA
# --------------------------------------------------------------------------
# Trains a Random Forest Regressor using the FPS benchmark dataset.
# The trained model and expected feature columns are serialized to .joblib files
# for use by the production Flask server.

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import joblib

print("Loading dataset...") 
data = pd.read_csv('FpsTest/fps_dataset.csv') 

# Isolate features (X) and target variable (y)
# We exclude leakage columns (e.g., Min/Max FPS, Bottleneck Score) to prevent data leakage during training.
X = data.drop(columns=['Min FPS','Avg FPS','Max FPS','Bottleneck Score','Total System TDP (W)'])
y = data['Avg FPS']  

# One-hot encode categorical variables for the model
X = pd.get_dummies(X)

# Split dataset into training (80%) and testing (20%) sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42) 

print("Training Random Forest Regressor...")
# Initialize and train the Random Forest model with 100 estimators
model = RandomForestRegressor(n_estimators=100, random_state=42) 
model.fit(X_train, y_train)

print("Evaluating model on test data...")
predictions = model.predict(X_test)

# Calculate and display the Mean Absolute Error (MAE)
error = mean_absolute_error(y_test, predictions)
print(f"✅ Training Complete! Average Prediction Error: {error:.2f} FPS")

print("Serializing model and feature schema to disk...")
# Save the trained model
joblib.dump(model, 'project_aura.joblib')
# Save the feature column structure to ensure consistent one-hot encoding at inference time
joblib.dump(list(X.columns), 'ai_columns.joblib') 

print("✅ Model artifacts successfully saved!")
