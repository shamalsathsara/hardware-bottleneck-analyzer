import os
import sys
import unittest

AI_DIR = os.path.dirname(os.path.abspath(__file__))
if AI_DIR not in sys.path:
    sys.path.insert(0, AI_DIR)

from app import app

class TestModelV1App(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_predict_invalid_payload(self):
        """Test sending an array instead of a dictionary returns 400"""
        response = self.client.post('/predict', json=[{"cpu": "Intel i9"}])
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.get_json())

    def test_predict_valid_payload(self):
        """Test predicting with a valid legacy payload structure"""
        payload = {
            "modelVersion": "v1",
            "CPU_Make": "Intel",
            "CPU_Model": "Core i7",
            "GPU_Make": "NVIDIA",
            "GPU_Model": "RTX 3080",
            "RAM_Size": 32,
            "Game_Name": "Cyberpunk 2077",
            "Resolution": "1440p",
            "Graphics_Setting": "High"
        }
        response = self.client.post('/predict', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('predicted_fps', data)
        self.assertTrue(isinstance(data['predicted_fps'], (int, float)))

    def test_predict_empty_payload(self):
        """Test predicting with an empty payload"""
        response = self.client.post('/predict', json={})
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn('error', data)

    def test_predict_string_numbers_and_custom_hardware(self):
        """Test payload with string-formatted numbers and hardware outside training set"""
        payload = {
            "modelVersion": "v1",
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
        response = self.client.post('/predict', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('predicted_fps', data)
        self.assertTrue(5.0 <= data['predicted_fps'] <= 1200.0)

    def test_predict_extreme_values(self):
        """Test extreme / boundary values don't crash prediction"""
        payload = {
            "modelVersion": "v1",
            "CPU": "Unknown CPU",
            "CPU Cores": 999,
            "RAM (GB)": 1024,
            "GPU VRAM (GB)": 64,
            "Resolution": "3840x2160",
            "Graphics Settings": "Ultra"
        }
        response = self.client.post('/predict', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('predicted_fps', data)
        self.assertTrue(5.0 <= data['predicted_fps'] <= 1200.0)

if __name__ == '__main__':
    unittest.main()

