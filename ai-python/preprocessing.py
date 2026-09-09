import pandas as pd

RESOLUTION_MAP = {
    "1080p": "1920x1080",
    "1440p": "2560x1440",
    "4K": "3840x2160",
}

def safe_num(val, default, min_val=1, max_val=10000):
    """Safely coerces input to a float within realistic bounds."""
    try:
        num = float(val) if val is not None else float(default)
        if pd.isna(num):
            return float(default)
        return max(float(min_val), min(float(max_val), num))
    except (ValueError, TypeError):
        return float(default)

def preprocess_features(raw_data, model_columns):
    """
    Transforms raw JSON input dictionary into a one-hot encoded DataFrame
    matching the trained Model V1 71-dimension column order and schema.
    """
    data = dict(raw_data)

    if 'Resolution' in data and data['Resolution'] in RESOLUTION_MAP:
        data['Resolution'] = RESOLUTION_MAP[data['Resolution']]

    if 'CPU' in data and 'Core i' in data['CPU']:
        data['CPU'] = data['CPU'].replace('Core i', 'i')

    data['CPU Cores'] = safe_num(data.get('CPU Cores'), 6, min_val=1, max_val=128)
    data['CPU Threads'] = safe_num(data.get('CPU Threads'), 12, min_val=1, max_val=256)
    data['CPU TDP (W)'] = safe_num(data.get('CPU TDP (W)'), 65, min_val=10, max_val=1000)
    data['GPU VRAM (GB)'] = safe_num(data.get('GPU VRAM (GB)'), 8, min_val=1, max_val=128)
    data['GPU Bandwidth (GB/s)'] = safe_num(data.get('GPU Bandwidth (GB/s)'), 300, min_val=10, max_val=5000)
    data['GPU TDP (W)'] = safe_num(data.get('GPU TDP (W)'), 200, min_val=10, max_val=1500)
    data['RAM (GB)'] = safe_num(data.get('RAM (GB)'), 16, min_val=1, max_val=512)

    df = pd.DataFrame([data])

    num_cols = ['CPU Cores', 'CPU Threads', 'CPU TDP (W)', 'GPU VRAM (GB)', 'GPU Bandwidth (GB/s)', 'GPU TDP (W)', 'RAM (GB)']
    for col in num_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(data[col])

    df = pd.get_dummies(df)
    df = df.reindex(columns=model_columns, fill_value=0)

    return df, data
