import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_predict_invalid_payload(client):
    """Test sending an array instead of a dictionary returns 400"""
    response = client.post('/predict', json=[{"cpu": "Intel i9"}])
    assert response.status_code == 400
    assert 'error' in response.get_json()

def test_predict_valid_payload(client):
    """Test predicting with a valid payload structure"""
    # Note: Using random hardware values as the model will pad missing columns with 0s.
    payload = {
        "CPU_Make": "Intel",
        "CPU_Model": "Core i7",
        "GPU_Make": "NVIDIA",
        "GPU_Model": "RTX 3080",
        "RAM_Size": 32,
        "Game_Name": "Cyberpunk 2077",
        "Resolution": "1440p",
        "Graphics_Setting": "High"
    }
    response = client.post('/predict', json=payload)
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'predicted_fps' in data
    assert isinstance(data['predicted_fps'], (int, float))

def test_predict_empty_payload(client):
    """Test predicting with an empty payload"""
    response = client.post('/predict', json={})
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data

def test_predict_string_numbers_and_custom_hardware(client):
    """Test payload with string-formatted numbers and hardware outside training set"""
    payload = {
        "CPU": "AMD Ryzen 7 7800X3D",
        "CPU Cores": "8",
        "CPU Threads": "16",
        "CPU TDP (W)": "120",
        "GPU": "NVIDIA GeForce RTX 4080",
        "GPU Series": "RTX 4000",
        "GPU VRAM (GB)": "16",
        "GPU Bandwidth (GB/s)": "716",
        "GPU TDP (W)": "320",
        "RAM (GB)": "32",
        "Resolution": "2560x1440",
        "Graphics Settings": "Ultra"
    }
    response = client.post('/predict', json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert 'predicted_fps' in data
    assert 5 <= data['predicted_fps'] <= 1200

def test_predict_extreme_values(client):
    """Test extreme / boundary values don't crash prediction"""
    payload = {
        "CPU": "Unknown CPU",
        "CPU Cores": 999,
        "RAM (GB)": 1024,
        "GPU VRAM (GB)": 64,
        "Resolution": "3840x2160",
        "Graphics Settings": "Ultra"
    }
    response = client.post('/predict', json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert 'predicted_fps' in data
    assert 5 <= data['predicted_fps'] <= 1200
