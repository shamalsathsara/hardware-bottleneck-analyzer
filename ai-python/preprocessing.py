"""Feature preprocessing for the legacy Model V1 (rollback only)."""

import math

import pandas as pd

RESOLUTION_MAP = {
    '1080p': '1920x1080',
    '1440p': '2560x1440',
    '4k': '3840x2160',
    '2160p': '3840x2160',
}

# (field, default, min, max)
NUMERIC_FIELDS = (
    ('CPU Cores', 6, 1, 128),
    ('CPU Threads', 12, 1, 256),
    ('CPU TDP (W)', 65, 10, 1000),
    ('GPU VRAM (GB)', 8, 1, 128),
    ('GPU Bandwidth (GB/s)', 300, 10, 5000),
    ('GPU TDP (W)', 200, 10, 1500),
    ('RAM (GB)', 16, 1, 512),
)
CATEGORICAL_FIELDS = ('CPU', 'GPU', 'GPU Series', 'Resolution', 'Graphics Settings')


def safe_num(val, default, min_val, max_val):
    """Coerces input to a float clamped to realistic bounds; falls back to default."""
    if isinstance(val, bool):
        return float(default)
    try:
        num = float(val)
    except (ValueError, TypeError):
        return float(default)
    if not math.isfinite(num):
        return float(default)
    return max(float(min_val), min(float(max_val), num))


def _text(val):
    return val.strip() if isinstance(val, str) else ''


def preprocess_features(raw_data, model_columns):
    """Builds a one-hot encoded single-row DataFrame aligned to the V1 training columns.

    Only known V1 fields are read, so arbitrary or nested client values can't
    break the encoding.
    """
    row = {name: safe_num(raw_data.get(name), d, lo, hi) for name, d, lo, hi in NUMERIC_FIELDS}

    for name in CATEGORICAL_FIELDS:
        value = _text(raw_data.get(name))
        if value:
            row[name] = value

    if 'Resolution' in row:
        row['Resolution'] = RESOLUTION_MAP.get(row['Resolution'].lower(), row['Resolution'])
    if 'CPU' in row:
        row['CPU'] = row['CPU'].replace('Core i', 'i')
    if 'Graphics Settings' in row:
        row['Graphics Settings'] = row['Graphics Settings'].capitalize()

    df = pd.get_dummies(pd.DataFrame([row]))
    return df.reindex(columns=model_columns, fill_value=0)
