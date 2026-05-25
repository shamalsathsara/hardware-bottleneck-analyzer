from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

#Starting auta AI
print("Starting Aura AI....")
model = joblib.load('project_aura.joblib') #Load model from brain
model_columns = joblib.load('ai_columns.joblib') #Load columns

#Create the communication ( API )
@app.route('/predict', methods=['POST']) #POST - sending data to server
def predict():
    try:
        #Get the hardware req from backend (node.js)
        data =  request.json

        #Convert into Pandas spreadsheet format
        df = pd.DataFrame([data])

        #Translate text to num 0-1  
        df = pd.get_dummies(df)

        #Aligh the columns
        df = df.reindex(columns=model_columns, fill_value=0) #if any column in folder is missing , it will be added and filled with 0

        #Ask aura for prediction
        prediction = model.predict(df)

        #Return answer back to user
        return jsonify({'predicted_fps': round(prediction[0], 2)})
    
    except Exception as e: #Err handling
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__': 
    print("✅ Project Aura is online and listening on port 5000!")
    app.run(port=5000, debug=False)