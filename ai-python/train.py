import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import joblib

print("Loading dataset...") 
data = pd.read_csv('FpsTest/fps_dataset.csv') 

# Exclude target-correlated metrics to prevent leakage
X = data.drop(columns=['Min FPS', 'Avg FPS', 'Max FPS', 'Bottleneck Score', 'Total System TDP (W)'])
y = data['Avg FPS']  

X = pd.get_dummies(X)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42) 

print("Training Random Forest Regressor...")
model = RandomForestRegressor(n_estimators=100, random_state=42) 
model.fit(X_train, y_train)

print("Evaluating model on test data...")
predictions = model.predict(X_test)
error = mean_absolute_error(y_test, predictions)
print(f"Training Complete. MAE: {error:.2f} FPS")

# Save model and column schema for V1 inference
joblib.dump(model, 'project_aura.joblib')
joblib.dump(list(X.columns), 'ai_columns.joblib') 
print("Model V1 artifacts saved successfully.")
