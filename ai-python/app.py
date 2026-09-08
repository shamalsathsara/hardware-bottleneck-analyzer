# --------------------------------------------------------------------------
# FLASK AI PREDICTION SERVER — PROJECT AURA (V1 & V2)
# --------------------------------------------------------------------------
# Serves both Model V1 (Random Forest baseline) and Model V2 (HistGradientBoosting
# physical-spec pipeline) via a unified, robust REST API.

import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from preprocessing import preprocess_features

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

print("Starting Aura AI...")

# Model V2 Known Games Catalog from clean training dataset
KNOWN_V2_GAMES = {
    'aWayOut', 'airMechStrike', 'apexLegends', 'battlefield4', 'battletech',
    'callOfDutyWW2', 'counterStrikeGlobalOffensive', 'destiny2', 'dota2',
    'farCry5', 'fortnite', 'frostpunk', 'grandTheftAuto5', 'leagueOfLegends',
    'overwatch', 'pathOfExile', 'playerUnknownsBattlegrounds', 'radicalHeights',
    'rainbowSixSiege', 'seaOfThieves', 'starcraft2', 'totalWar3Kingdoms',
    'warframe', 'worldOfTanks'
}

# Required 16 Input Features for Model V2 Pipeline
V2_REQUIRED_FEATURES = [
    'CpuNumberOfCores',
    'CpuNumberOfThreads',
    'CpuFrequency',
    'CpuTurboClock',
    'CpuCacheL3',
    'CpuTDP',
    'GpuMemorySize',
    'GpuBandwidth',
    'GpuMemoryBus',
    'GpuNumberOfShadingUnits',
    'GpuBaseClock',
    'GpuBoostClock',
    'GpuNumberOfROPs',
    'GpuFP32Performance',
    'GameName',
    'GameSetting_Ordinal'
]

# Setting Ordinal to Preset Name Mapping
ORDINAL_PRESET_MAP = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Ultra'
}

# 1. Load Model V1 Artifacts
v1_model_path = os.path.join(BASE_DIR, 'project_aura.joblib')
v1_cols_path = os.path.join(BASE_DIR, 'ai_columns.joblib')
model_v1 = None
model_columns_v1 = None

try:
    model_v1 = joblib.load(v1_model_path)
    model_columns_v1 = joblib.load(v1_cols_path)
    print("AI Model V1 loaded successfully! [OK]")
except FileNotFoundError as e:
    print(f"\nModel V1 file not found: {e} [WARNING]")

# 2. Load Model V2 Candidate Artifact
v2_model_path = os.path.join(BASE_DIR, 'ml-model-v2', 'experiments', 'v2_baseline', 'candidate_model_v2.joblib')
model_v2 = None

try:
    model_v2 = joblib.load(v2_model_path)
    print("AI Model V2 Candidate pipeline loaded successfully! [OK]")
except FileNotFoundError as e:
    print(f"\nModel V2 file not found: {e} [WARNING]")


def is_v2_payload(data):
    """Detects whether payload contains explicit V2 physical feature fields."""
    v2_signature = {'CpuNumberOfCores', 'GpuNumberOfShadingUnits', 'GpuFP32Performance'}
    return bool(v2_signature.intersection(data.keys()))


# --------------------------------------------------------------------------
# HEALTH / DIAGNOSTIC ENDPOINT
# --------------------------------------------------------------------------
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'models': {
            'v1_available': model_v1 is not None,
            'v2_available': model_v2 is not None,
            'default_version': os.environ.get('MODEL_VERSION', 'v2')
        },
        'known_games_count': len(KNOWN_V2_GAMES)
    }), 200


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

        # Determine target model version
        requested_version = (
            data.get('modelVersion') or
            request.headers.get('X-Model-Version') or
            os.environ.get('MODEL_VERSION')
        )

        # Infer version if not explicitly passed
        if not requested_version:
            requested_version = 'v2' if is_v2_payload(data) else 'v1'

        requested_version = str(requested_version).lower().strip()

        # ==============================================================
        # MODEL V2 INFERENCE
        # ==============================================================
        if requested_version == 'v2':
            if model_v2 is None:
                return jsonify({'error': 'Model V2 is not loaded on this server.'}), 503

            # Strict Validation of required physical features (no fake fallbacks)
            missing_fields = []
            for field in V2_REQUIRED_FEATURES:
                val = data.get(field)
                if val is None or (isinstance(val, (int, float)) and np.isnan(val)):
                    missing_fields.append(field)

            if missing_fields:
                return jsonify({
                    'error': 'MODEL_V2_HARDWARE_DATA_INCOMPLETE',
                    'message': 'Required physical hardware specifications are missing.',
                    'missingFields': missing_fields
                }), 400

            # Build DataFrame with exact feature order
            try:
                row_dict = {
                    'GameName': str(data['GameName']),
                    'GameSetting_Ordinal': int(data['GameSetting_Ordinal']),
                    'CpuNumberOfCores': float(data['CpuNumberOfCores']),
                    'CpuNumberOfThreads': float(data['CpuNumberOfThreads']),
                    'CpuFrequency': float(data['CpuFrequency']),
                    'CpuTurboClock': float(data['CpuTurboClock']),
                    'CpuCacheL3': float(data['CpuCacheL3']),
                    'CpuTDP': float(data['CpuTDP']),
                    'GpuMemorySize': float(data['GpuMemorySize']),
                    'GpuBandwidth': float(data['GpuBandwidth']),
                    'GpuMemoryBus': float(data['GpuMemoryBus']),
                    'GpuNumberOfShadingUnits': float(data['GpuNumberOfShadingUnits']),
                    'GpuBaseClock': float(data['GpuBaseClock']),
                    'GpuBoostClock': float(data['GpuBoostClock']),
                    'GpuNumberOfROPs': float(data['GpuNumberOfROPs']),
                    'GpuFP32Performance': float(data['GpuFP32Performance']),
                }
            except (ValueError, TypeError) as conv_err:
                return jsonify({
                    'error': 'MODEL_V2_INVALID_FEATURE_TYPE',
                    'message': f'Feature numeric conversion failed: {str(conv_err)}'
                }), 400

            input_df = pd.DataFrame([row_dict])

            # Run Model V2 candidate pipeline directly
            raw_prediction = float(model_v2.predict(input_df)[0])
            final_prediction = max(5.0, min(raw_prediction, 1200.0))

            game_name = str(data['GameName'])
            game_coverage = 'known' if game_name in KNOWN_V2_GAMES else 'unseen'
            preset_ordinal = int(data['GameSetting_Ordinal'])
            preset_label = ORDINAL_PRESET_MAP.get(preset_ordinal, f'Ordinal_{preset_ordinal}')

            return jsonify({
                'predictedFps': round(final_prediction, 2),
                'predicted_fps': round(final_prediction, 2),
                'modelVersion': 'v2',
                'gameCoverage': game_coverage,
                'resolution': '1080p',
                'preset': preset_label,
                'game': game_name
            }), 200

        # ==============================================================
        # MODEL V1 INFERENCE (ROLLBACK & LEGACY PATH)
        # ==============================================================
        elif requested_version == 'v1':
            if model_v1 is None or model_columns_v1 is None:
                return jsonify({'error': 'Model V1 is not loaded on this server.'}), 503

            # Preprocess features into legacy 71-dim model schema
            df, processed_data = preprocess_features(data, model_columns_v1)

            # Generate base FPS prediction
            base_prediction = float(model_v1.predict(df)[0])
            
            # Extrapolation & Outlier Handling
            vram = processed_data.get('GPU VRAM (GB)', 8)
            if vram > 24:
                base_prediction *= 1.15
            elif vram > 16:
                base_prediction *= 1.05
                
            # Clamp FPS bounds
            final_prediction = max(5.0, min(base_prediction, 1200.0))

            return jsonify({
                'predicted_fps': round(final_prediction, 2),
                'predictedFps': round(final_prediction, 2),
                'modelVersion': 'v1'
            }), 200

        else:
            return jsonify({'error': f'Unsupported modelVersion: "{requested_version}". Supported versions: "v1", "v2".'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Start server on port 5000
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Project Aura is online and listening on port {port}! [OK]")
    app.run(port=port, debug=False)