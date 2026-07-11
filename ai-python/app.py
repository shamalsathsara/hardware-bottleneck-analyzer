# --------------------------------------------------------------------------
# FLASK AI PREDICTION SERVER
# --------------------------------------------------------------------------
# This small Python server loads our trained Random Forest AI model into memory.
# It listens for hardware data from the Node.js backend, formats it into a
# Pandas DataFrame, and asks the AI to predict the FPS.

from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

print("Starting Aura AI....")

# FIX BUG 11: Load model files inside try/except.
# Before this fix, a missing .joblib file crashed the whole server at startup
# with a cryptic FileNotFoundError, giving the user no helpful guidance.
try:
    # 1. Load the AI Brain (the mathematical model) from disk
    model = joblib.load('project_aura.joblib')
    # 2. Load the exact column structure the AI expects to see
    model_columns = joblib.load('ai_columns.joblib')
    print("AI model loaded successfully! [OK]")
except FileNotFoundError as e:
    print(f"\nModel file not found: {e} [ERROR]")
    print("   Please run train.py first to generate the model files.")
    exit(1)

# --------------------------------------------------------------------------
# PREDICTION API ENDPOINT
# --------------------------------------------------------------------------
@app.route('/predict', methods=['POST']) 
def predict():
    try:
        # Step 1: Get the hardware specs JSON sent from our Node.js backend
        data = request.json
        
        # Security/Stability Check: Make sure the payload is a non-empty dictionary
        # If a hacker sends a list, string, or empty dict, Pandas may crash.
        if not isinstance(data, dict) or not data:
            return jsonify({'error': 'Invalid payload format. Expected a non-empty JSON object.'}), 400

        # Step 2: Convert the JSON into a Pandas DataFrame (like a spreadsheet row)
        df = pd.DataFrame([data])

        # Step 3: Encoding — Convert text (like "Nvidia") into binary columns (0s and 1s)
        # because the AI only understands math, not text!
        df = pd.get_dummies(df)

        # Step 4: Align the columns. If the new data is missing any columns that 
        # were present during training, this fills them with 0s so the AI doesn't crash.
        df = df.reindex(columns=model_columns, fill_value=0) 

        # Step 5: Ask the AI for the prediction!
        prediction = model.predict(df)

        # Step 6: Send the answer (rounded to 2 decimal places) back to Node.js
        return jsonify({'predicted_fps': round(prediction[0], 2)})
    
    except Exception as e: 
        # If anything goes wrong, return the error message with a 500 status code
        return jsonify({'error': str(e)}), 500
    
# Start the server on port 5000 (debug=False for security)
if __name__ == '__main__': 
    print("Project Aura is online and listening on port 5000! [OK]")
    app.run(port=5000, debug=False)