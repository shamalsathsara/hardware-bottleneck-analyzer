import pandas as pd
import joblib
import sys

# Change standard output encoding to utf-8 so emojis don't crash
sys.stdout.reconfigure(encoding='utf-8')

try:
    from app import app
    client = app.test_client()
    response = client.post('/predict', json={})
    print("Status:", response.status_code)
    print("Response:", response.get_json())
except Exception as e:
    print("Exception:", repr(e))
