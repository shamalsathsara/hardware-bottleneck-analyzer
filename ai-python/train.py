#Import libraries

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import joblib

#Load Dataset
print("Loading Dataset....")  #MSG
data = pd.read_csv('FpsTest/fps_dataset.csv') #This is the csv file location

#Select features like I/O
X = data.drop(columns=['Min FPS','Avg FPS','Max FPS','Bottleneck Score','Total System TDP (W)'])
y = data['Avg FPS']  #What we want to predict (Output)

#Data preprocessing ENCODING
#translate all dummy text to binaries
X = pd.get_dummies(X)

#Split data
X_train,X_test,y_train,y_test = train_test_split(X,y,test_size=0.2, random_state=42)  #Get only 80% data and other 20% keep for test


#Train the Brain 
print("Training the Random Forest AI(Wait a second)...")
model = RandomForestRegressor(n_estimators=100, random_state=42) #number of trees in the forest MORE Tress = More Accuracy
model.fit(X_train,y_train) #Train                                #Random numb 42



#Test the AI
print("Testing the AI on unseen data...")
predictions = model.predict(X_test)

#Calculate Accuracy of my AI
error =  mean_absolute_error(y_test, predictions)

#Test outputs

print(f"✅ AI Training Complete! Average Prediction Error: {error:.2f} FPS")

#Saving Ai using joblib
print(" Saving the trained AI model to disk...")
joblib.dump(model, 'project_aura.joblib')
joblib.dump(list(X.columns), 'ai_columns.joblib') # Save the data structure
print("✅ Brain successfully saved!")


