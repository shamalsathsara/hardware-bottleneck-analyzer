import os
import sys
import unittest
import json

AI_DIR = os.path.dirname(os.path.abspath(__file__))
if AI_DIR not in sys.path:
    sys.path.insert(0, AI_DIR)

from app import app, KNOWN_V2_GAMES

class TestModelV2Integration(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_health_endpoint(self):
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertTrue(data['models']['v1_available'])
        self.assertTrue(data['models']['v2_available'])
        self.assertEqual(data['known_games_count'], 24)

    def test_model_v1_legacy_payload(self):
        payload = {
            "modelVersion": "v1",
            "CPU": "AMD Ryzen 7 7800X3D",
            "CPU Cores": 8,
            "CPU Threads": 16,
            "CPU TDP (W)": 120,
            "GPU": "NVIDIA GeForce RTX 4080",
            "GPU Series": "RTX 4000",
            "GPU VRAM (GB)": 16,
            "GPU Bandwidth (GB/s)": 716,
            "GPU TDP (W)": 320,
            "RAM (GB)": 32,
            "Resolution": "1920x1080",
            "Graphics Settings": "Ultra"
        }
        response = self.app.post('/predict', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('predicted_fps', data)
        self.assertEqual(data['modelVersion'], 'v1')
        self.assertTrue(5.0 <= data['predicted_fps'] <= 1200.0)

    def test_model_v2_known_game(self):
        # i5-9500 + GTX 1660 SUPER specs on Apex Legends (Medium)
        payload = {
            "modelVersion": "v2",
            "GameName": "apexLegends",
            "GameSetting_Ordinal": 2, # Medium
            "CpuNumberOfCores": 6.0,
            "CpuNumberOfThreads": 6.0,
            "CpuFrequency": 3000.0,
            "CpuTurboClock": 4400.0,
            "CpuCacheL3": 9.0,
            "CpuTDP": 65.0,
            "GpuMemorySize": 6000.0,
            "GpuBandwidth": 336000.0,
            "GpuMemoryBus": 192.0,
            "GpuNumberOfShadingUnits": 1408.0,
            "GpuBaseClock": 1530.0,
            "GpuBoostClock": 1785.0,
            "GpuNumberOfROPs": 48.0,
            "GpuFP32Performance": 5027000.0
        }
        response = self.app.post('/predict', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['modelVersion'], 'v2')
        self.assertEqual(data['gameCoverage'], 'known')
        self.assertEqual(data['preset'], 'Medium')
        self.assertTrue(data['predictedFps'] > 0)
        self.assertTrue(np_isfinite := isinstance(data['predictedFps'], (int, float)))

    def test_model_v2_unseen_game(self):
        # Forza Horizon 5 (Unseen game)
        payload = {
            "modelVersion": "v2",
            "GameName": "Forza Horizon 5",
            "GameSetting_Ordinal": 4, # Ultra
            "CpuNumberOfCores": 6.0,
            "CpuNumberOfThreads": 6.0,
            "CpuFrequency": 3000.0,
            "CpuTurboClock": 4400.0,
            "CpuCacheL3": 9.0,
            "CpuTDP": 65.0,
            "GpuMemorySize": 6000.0,
            "GpuBandwidth": 336000.0,
            "GpuMemoryBus": 192.0,
            "GpuNumberOfShadingUnits": 1408.0,
            "GpuBaseClock": 1530.0,
            "GpuBoostClock": 1785.0,
            "GpuNumberOfROPs": 48.0,
            "GpuFP32Performance": 5027000.0
        }
        response = self.app.post('/predict', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['modelVersion'], 'v2')
        self.assertEqual(data['gameCoverage'], 'unseen')
        self.assertEqual(data['preset'], 'Ultra')
        self.assertTrue(data['predictedFps'] > 0)

    def test_model_v2_missing_hardware_fields(self):
        # Missing GPU Shaders and FP32 Performance
        payload = {
            "modelVersion": "v2",
            "GameName": "apexLegends",
            "GameSetting_Ordinal": 2,
            "CpuNumberOfCores": 6.0,
            "CpuNumberOfThreads": 6.0,
            "CpuFrequency": 3000.0,
            "CpuTurboClock": 4400.0,
            "CpuCacheL3": 9.0,
            "CpuTDP": 65.0,
            "GpuMemorySize": 6000.0
            # Missing: GpuBandwidth, GpuMemoryBus, GpuNumberOfShadingUnits, etc.
        }
        response = self.app.post('/predict', json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertEqual(data['error'], 'MODEL_V2_HARDWARE_DATA_INCOMPLETE')
        self.assertIn('missingFields', data)
        self.assertIn('GpuNumberOfShadingUnits', data['missingFields'])
        self.assertIn('GpuFP32Performance', data['missingFields'])

    def test_model_v2_preset_scaling(self):
        base_payload = {
            "modelVersion": "v2",
            "GameName": "apexLegends",
            "CpuNumberOfCores": 6.0,
            "CpuNumberOfThreads": 6.0,
            "CpuFrequency": 3000.0,
            "CpuTurboClock": 4400.0,
            "CpuCacheL3": 9.0,
            "CpuTDP": 65.0,
            "GpuMemorySize": 6000.0,
            "GpuBandwidth": 336000.0,
            "GpuMemoryBus": 192.0,
            "GpuNumberOfShadingUnits": 1408.0,
            "GpuBaseClock": 1530.0,
            "GpuBoostClock": 1785.0,
            "GpuNumberOfROPs": 48.0,
            "GpuFP32Performance": 5027000.0
        }

        # Medium (Ordinal 2)
        med_payload = dict(base_payload, GameSetting_Ordinal=2)
        med_res = self.app.post('/predict', json=med_payload).get_json()

        # Ultra (Ordinal 4)
        ultra_payload = dict(base_payload, GameSetting_Ordinal=4)
        ultra_res = self.app.post('/predict', json=ultra_payload).get_json()

        self.assertLessEqual(ultra_res['predictedFps'], med_res['predictedFps'])

if __name__ == '__main__':
    unittest.main()
