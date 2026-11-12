"""Project Aura AI service.

Internal HTTP service that serves FPS predictions. It is called only by the
Node backend and must stay bound to localhost / a private network.

Model selection is controlled exclusively by the MODEL_VERSION environment
variable ("v2" by default, "v1" as a legacy rollback). Clients cannot choose.
"""

import logging
import math
import os

import joblib
import pandas as pd
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

from preprocessing import preprocess_features

logging.basicConfig(
    level=os.environ.get('LOG_LEVEL', 'INFO'),
    format='%(asctime)s %(levelname)s [aura-ai] %(message)s',
)
log = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SUPPORTED_VERSIONS = ('v1', 'v2')

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 64 * 1024

# Model V2 numeric features (GameName is handled separately).
V2_NUMERIC_FEATURES = (
    'CpuNumberOfCores',
    'CpuNumberOfThreads',
    'CpuFrequency',            # MHz
    'CpuTurboClock',           # MHz
    'CpuCacheL3',              # MB
    'CpuTDP',                  # W
    'GpuMemorySize',           # MB
    'GpuBandwidth',            # MB/s
    'GpuMemoryBus',            # bits
    'GpuNumberOfShadingUnits',
    'GpuBaseClock',            # MHz
    'GpuBoostClock',           # MHz
    'GpuNumberOfROPs',
    'GpuFP32Performance',      # MFLOPS (2 * shaders * boost MHz)
)
V2_REQUIRED_FEATURES = V2_NUMERIC_FEATURES + ('GameName', 'GameSetting_Ordinal')

# The V2 training data only contains these presets, at 1080p.
SUPPORTED_PRESETS = {2: 'Medium', 4: 'Ultra'}
SUPPORTED_RESOLUTION = '1080p'

FPS_MIN, FPS_MAX = 5.0, 1200.0


def _load(path, label):
    try:
        obj = joblib.load(path)
        log.info('%s loaded from %s', label, path)
        return obj
    except Exception:  # corrupt pickle, version mismatch, missing file...
        log.exception('Failed to load %s from %s', label, path)
        return None


model_v1 = _load(os.path.join(BASE_DIR, 'project_aura.joblib'), 'Model V1')
model_columns_v1 = _load(os.path.join(BASE_DIR, 'ai_columns.joblib'), 'Model V1 columns')
model_v2 = _load(
    os.path.join(BASE_DIR, 'ml-model-v2', 'experiments', 'v2_baseline', 'candidate_model_v2.joblib'),
    'Model V2',
)


def _known_games(model):
    """Reads the game categories the V2 pipeline was trained on."""
    try:
        encoder = model.named_steps['preprocessor'].named_transformers_['game']
        return frozenset(str(g) for g in encoder.categories_[0])
    except Exception:
        return frozenset()


KNOWN_V2_GAMES = _known_games(model_v2) if model_v2 is not None else frozenset()


def active_version():
    return os.environ.get('MODEL_VERSION', 'v2').strip().lower()


def model_ready(version):
    if version == 'v2':
        return model_v2 is not None
    if version == 'v1':
        return model_v1 is not None and model_columns_v1 is not None
    return False


def error(code, message, status, **extra):
    return jsonify({'error': code, 'message': message, **extra}), status


def _positive_number(value):
    """Returns a finite float > 0, or None if the value is not acceptable."""
    if isinstance(value, bool) or not isinstance(value, (int, float, str)):
        return None
    try:
        num = float(value)
    except ValueError:
        return None
    return num if math.isfinite(num) and num > 0 else None


def _preset_ordinal(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)) and float(value).is_integer():
        return int(value)
    if isinstance(value, str) and value.strip().isdigit():
        return int(value.strip())
    return None


def _clamp_fps(value):
    return round(max(FPS_MIN, min(float(value), FPS_MAX)), 2)


@app.errorhandler(HTTPException)
def handle_http_error(exc):
    return error(exc.name.upper().replace(' ', '_'), exc.description, exc.code)


@app.errorhandler(Exception)
def handle_unexpected_error(exc):
    log.exception('Unhandled prediction error')
    return error('INTERNAL_ERROR', 'Prediction failed due to an internal error.', 500)


@app.route('/health', methods=['GET'])
def health():
    version = active_version()
    ready = model_ready(version)
    return jsonify({
        'status': 'healthy' if ready else 'unhealthy',
        'activeVersion': version,
        'models': {
            'v1_available': model_ready('v1'),
            'v2_available': model_ready('v2'),
        },
        'known_games_count': len(KNOWN_V2_GAMES),
    }), 200 if ready else 503


def predict_v2(data):
    missing = [f for f in V2_REQUIRED_FEATURES if data.get(f) is None]
    if missing:
        return error(
            'MODEL_V2_HARDWARE_DATA_INCOMPLETE',
            'Required physical hardware specifications are missing.',
            400,
            missingFields=missing,
        )

    row = {}
    invalid = []
    for field in V2_NUMERIC_FEATURES:
        num = _positive_number(data[field])
        if num is None:
            invalid.append(field)
        row[field] = num

    game_name = data['GameName']
    if not isinstance(game_name, str) or not game_name.strip():
        invalid.append('GameName')

    if invalid:
        return error(
            'MODEL_V2_INVALID_FEATURE',
            'Hardware features must be positive finite numbers and GameName a non-empty string.',
            400,
            invalidFields=invalid,
        )

    ordinal = _preset_ordinal(data['GameSetting_Ordinal'])
    if ordinal not in SUPPORTED_PRESETS:
        return error(
            'UNSUPPORTED_PRESET',
            'FPS prediction is only available for the Medium and Ultra presets.',
            400,
            supportedPresets=list(SUPPORTED_PRESETS.values()),
        )

    game_name = game_name.strip()
    row['GameName'] = game_name
    row['GameSetting_Ordinal'] = ordinal

    prediction = model_v2.predict(pd.DataFrame([row]))[0]

    return jsonify({
        'predictedFps': _clamp_fps(prediction),
        'modelVersion': 'v2',
        'gameCoverage': 'known' if game_name in KNOWN_V2_GAMES else 'unseen',
        'resolution': SUPPORTED_RESOLUTION,
        'preset': SUPPORTED_PRESETS[ordinal],
        'supportedPresets': list(SUPPORTED_PRESETS.values()),
        'game': game_name,
    }), 200


def predict_v1(data):
    df = preprocess_features(data, model_columns_v1)
    prediction = model_v1.predict(df)[0]
    return jsonify({'predictedFps': _clamp_fps(prediction), 'modelVersion': 'v1'}), 200


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not data:
        return error('INVALID_PAYLOAD', 'Expected a non-empty JSON object.', 400)

    version = active_version()
    if version not in SUPPORTED_VERSIONS:
        log.error('Invalid MODEL_VERSION configured: %r', version)
        return error('MODEL_MISCONFIGURED', 'The prediction service is misconfigured.', 503)
    if not model_ready(version):
        return error('MODEL_UNAVAILABLE', f'Model {version} is not loaded on this server.', 503)

    return predict_v2(data) if version == 'v2' else predict_v1(data)


if __name__ == '__main__':
    # Development only. In production run: gunicorn -w 2 --preload -b 127.0.0.1:5000 app:app
    port = int(os.environ.get('AI_PORT', 5000))
    log.info('Project Aura AI (dev server) on 127.0.0.1:%d', port)
    app.run(host='127.0.0.1', port=port, debug=False)
