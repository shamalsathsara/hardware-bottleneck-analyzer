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
