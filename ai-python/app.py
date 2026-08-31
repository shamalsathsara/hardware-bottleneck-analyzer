# --------------------------------------------------------------------------
# FLASK AI PREDICTION SERVER
# --------------------------------------------------------------------------
# Serves the trained Random Forest regression model via a REST API.
# Receives hardware specifications from the backend, preprocesses the features
# to match the model's expected training schema, and returns the predicted FPS.

from flask import Flask, request, jsonify
import joblib
from preprocessing import preprocess_features

app = Flask(__name__)

print("Starting Aura AI....")

# Load model artifacts once on startup
try:
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
        data = request.json
        
        # Validate payload structure
        if not isinstance(data, dict) or not data:
            return jsonify({'error': 'Invalid payload format. Expected a non-empty JSON object.'}), 400

        # Preprocess features into model schema
        df, processed_data = preprocess_features(data, model_columns)

        # Generate base FPS prediction
        base_prediction = float(model.predict(df)[0])
        
        # Extrapolation & Outlier Handling
        vram = processed_data.get('GPU VRAM (GB)', 8)
        if vram > 24:
            base_prediction *= 1.15
        elif vram > 16:
            base_prediction *= 1.05
            
        # Clamp FPS bounds
        final_prediction = max(5.0, min(base_prediction, 1200.0))

        return jsonify({'predicted_fps': round(final_prediction, 2)})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Start server on port 5000
if __name__ == '__main__':
    print("Project Aura is online and listening on port 5000! [OK]")
    app.run(port=5000, debug=False)