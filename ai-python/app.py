# --------------------------------------------------------------------------
# FLASK AI PREDICTION SERVER
# --------------------------------------------------------------------------
# Serves the trained Random Forest regression model via a REST API.
# Receives hardware specifications from the backend, preprocesses the features
# to match the model's expected training schema, and returns the predicted FPS.

from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

print("Starting Aura AI....")

# Load model artifacts with error handling to provide actionable feedback 
# if the model hasn't been trained yet (fixes startup crash on missing .joblib).
try:
    # Load the serialized model and its expected feature schema
    model = joblib.load('project_aura.joblib')
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
        # Extract hardware specifications from the incoming JSON payload
        data = request.json
        
        # Validate payload structure to prevent Pandas DataFrame initialization errors
        if not isinstance(data, dict) or not data:
            return jsonify({'error': 'Invalid payload format. Expected a non-empty JSON object.'}), 400

        # FEATURE ALIGNMENT PREPROCESSING
        # Map frontend resolution strings to exact model training columns
        res_map = {"1080p": "1920x1080", "1440p": "2560x1440", "4K": "3840x2160"}
        if 'Resolution' in data and data['Resolution'] in res_map:
            data['Resolution'] = res_map[data['Resolution']]
            
        # Map frontend CPU naming conventions ("Intel Core i7" -> "Intel i7")
        if 'CPU' in data and 'Core i' in data['CPU']:
            data['CPU'] = data['CPU'].replace('Core i', 'i')
            
        # Provide safe realistic medians for numerical columns before Pandas fills with 0
        def safe_num(val, default, min_val=1, max_val=10000):
            try:
                num = float(val) if val is not None else float(default)
                if pd.isna(num):
                    return float(default)
                return max(float(min_val), min(float(max_val), num))
            except (ValueError, TypeError):
                return float(default)

        data['CPU Cores'] = safe_num(data.get('CPU Cores'), 6, min_val=1, max_val=128)
        data['CPU Threads'] = safe_num(data.get('CPU Threads'), 12, min_val=1, max_val=256)
        data['CPU TDP (W)'] = safe_num(data.get('CPU TDP (W)'), 65, min_val=10, max_val=1000)
        data['GPU VRAM (GB)'] = safe_num(data.get('GPU VRAM (GB)'), 8, min_val=1, max_val=128)
        data['GPU Bandwidth (GB/s)'] = safe_num(data.get('GPU Bandwidth (GB/s)'), 300, min_val=10, max_val=5000)
        data['GPU TDP (W)'] = safe_num(data.get('GPU TDP (W)'), 200, min_val=10, max_val=1500)
        data['RAM (GB)'] = safe_num(data.get('RAM (GB)'), 16, min_val=1, max_val=512)

        # Convert request payload to DataFrame
        df = pd.DataFrame([data])

        # Ensure all continuous features are explicitly numeric
        num_cols = ['CPU Cores', 'CPU Threads', 'CPU TDP (W)', 'GPU VRAM (GB)', 'GPU Bandwidth (GB/s)', 'GPU TDP (W)', 'RAM (GB)']
        for col in num_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(data[col])

        # Apply one-hot encoding for categorical variables to match training data
        df = pd.get_dummies(df)

        # Reindex columns to match the trained model's exact schema.
        # Missing features are padded with 0 to prevent prediction failures.
        df = df.reindex(columns=model_columns, fill_value=0) 

        # Generate base FPS prediction
        base_prediction = float(model.predict(df)[0])
        
        # EXTRAPOLATION & OUTLIER HANDLING
        # If hardware is significantly stronger than training bounds, extrapolate slightly
        vram = data.get('GPU VRAM (GB)', 8)
        if vram > 24:
            base_prediction *= 1.15
        elif vram > 16:
            base_prediction *= 1.05
            
        # Clamp FPS bounds to ensure realistic engine limits and prevent negative values
        final_prediction = max(5.0, min(base_prediction, 1200.0))

        # Return the prediction rounded to 2 decimal places
        return jsonify({'predicted_fps': round(final_prediction, 2)})
    
    except Exception as e: 
        # Catch unexpected errors and return a standard 500 Internal Server Error
        return jsonify({'error': str(e)}), 500
    
# Start the server on port 5000 (debug=False for security)
if __name__ == '__main__': 
    print("Project Aura is online and listening on port 5000! [OK]")
    app.run(port=5000, debug=False)