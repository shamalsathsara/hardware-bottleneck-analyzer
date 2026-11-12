"""HTTP-level tests for the Aura AI service: payload validation and V1 rollback."""

import os
import sys
import unittest
from unittest.mock import patch

AI_DIR = os.path.dirname(os.path.abspath(__file__))
if AI_DIR not in sys.path:
    sys.path.insert(0, AI_DIR)

from app import app  # noqa: E402

V1_ENV = {'MODEL_VERSION': 'v1'}


class TestPayloadValidation(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_array_payload_rejected(self):
        res = self.client.post('/predict', json=[{'cpu': 'Intel i9'}])
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.get_json()['error'], 'INVALID_PAYLOAD')

    def test_empty_payload_rejected(self):
        res = self.client.post('/predict', json={})
        self.assertEqual(res.status_code, 400)

    def test_malformed_json_is_400_not_500(self):
        res = self.client.post('/predict', data='{"CPU": ', content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_wrong_content_type_is_400_not_500(self):
        res = self.client.post('/predict', data='CPU=x', content_type='text/plain')
        self.assertEqual(res.status_code, 400)

    def test_unknown_route_is_json_404(self):
        res = self.client.get('/nope')
        self.assertEqual(res.status_code, 404)
        self.assertIn('error', res.get_json())

    def test_invalid_model_version_env_is_503(self):
        with patch.dict(os.environ, {'MODEL_VERSION': 'v9'}):
            res = self.client.post('/predict', json={'CPU': 'x'})
        self.assertEqual(res.status_code, 503)

    def test_client_cannot_select_model_version(self):
        """modelVersion in the body is ignored; the server env decides (default v2)."""
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('MODEL_VERSION', None)
            res = self.client.post('/predict', json={'modelVersion': 'v1', 'CPU': 'Ryzen 5 5600X'})
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.get_json()['error'], 'MODEL_V2_HARDWARE_DATA_INCOMPLETE')


class TestModelV1Rollback(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()

    def post_v1(self, payload):
        with patch.dict(os.environ, V1_ENV):
            return self.client.post('/predict', json=payload)

    def test_string_numbers_and_custom_hardware(self):
        res = self.post_v1({
            'CPU': 'AMD Ryzen 7 7800X3D',
            'CPU Cores': '8',
            'CPU Threads': '16',
            'CPU TDP (W)': '120',
            'GPU': 'NVIDIA GeForce RTX 4080',
            'GPU Series': 'RTX 4000',
            'GPU VRAM (GB)': '16',
            'GPU Bandwidth (GB/s)': '716',
            'GPU TDP (W)': '320',
            'RAM (GB)': '32',
            'Resolution': '2560x1440',
            'Graphics Settings': 'Ultra',
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['modelVersion'], 'v1')
        self.assertTrue(5.0 <= data['predictedFps'] <= 1200.0)

    def test_extreme_values_are_clamped(self):
        res = self.post_v1({
            'CPU': 'Unknown CPU',
            'CPU Cores': 999,
            'RAM (GB)': 1024,
            'GPU VRAM (GB)': 'inf',
            'Resolution': '4k',
            'Graphics Settings': 'ultra',
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(5.0 <= res.get_json()['predictedFps'] <= 1200.0)

    def test_non_string_and_nested_values_do_not_crash(self):
        res = self.post_v1({
            'CPU': 123,
            'GPU': {'name': 'RTX 3080'},
            'Resolution': ['1080p'],
            'rawCpu': {'nested': [1, 2, 3]},
        })
        self.assertEqual(res.status_code, 200)


if __name__ == '__main__':
    unittest.main()
