"""HTTP-level tests for the Model V2 prediction path."""

import os
import sys
import unittest
from unittest.mock import patch

AI_DIR = os.path.dirname(os.path.abspath(__file__))
if AI_DIR not in sys.path:
    sys.path.insert(0, AI_DIR)

from app import app, KNOWN_V2_GAMES  # noqa: E402

# i5-9500 + GTX 1660 SUPER, in training units (MHz, MB, MB/s, MFLOPS)
HARDWARE = {
    'CpuNumberOfCores': 6.0,
    'CpuNumberOfThreads': 6.0,
    'CpuFrequency': 3000.0,
    'CpuTurboClock': 4400.0,
    'CpuCacheL3': 9.0,
    'CpuTDP': 65.0,
    'GpuMemorySize': 6000.0,
    'GpuBandwidth': 336000.0,
    'GpuMemoryBus': 192.0,
    'GpuNumberOfShadingUnits': 1408.0,
    'GpuBaseClock': 1530.0,
    'GpuBoostClock': 1785.0,
    'GpuNumberOfROPs': 48.0,
    'GpuFP32Performance': 5027000.0,
}


def payload(**overrides):
    return {**HARDWARE, 'GameName': 'apexLegends', 'GameSetting_Ordinal': 2, **overrides}


class TestModelV2Integration(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()
        self.env = patch.dict(os.environ, {'MODEL_VERSION': 'v2'})
        self.env.start()

    def tearDown(self):
        self.env.stop()

    def post(self, body):
        return self.client.post('/predict', json=body)

    def test_health_endpoint(self):
        res = self.client.get('/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['activeVersion'], 'v2')
        self.assertTrue(data['models']['v1_available'])
        self.assertTrue(data['models']['v2_available'])
        self.assertEqual(data['known_games_count'], 24)
        self.assertEqual(len(KNOWN_V2_GAMES), 24)

    def test_known_game(self):
        res = self.post(payload())
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['modelVersion'], 'v2')
        self.assertEqual(data['gameCoverage'], 'known')
        self.assertEqual(data['preset'], 'Medium')
        self.assertEqual(data['resolution'], '1080p')
        self.assertEqual(data['supportedPresets'], ['Medium', 'Ultra'])
        self.assertGreater(data['predictedFps'], 0)

    def test_unseen_game(self):
        res = self.post(payload(GameName='Forza Horizon 5', GameSetting_Ordinal=4))
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['gameCoverage'], 'unseen')
        self.assertEqual(data['preset'], 'Ultra')

    def test_numeric_string_ordinal_accepted(self):
        res = self.post(payload(GameSetting_Ordinal='4'))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()['preset'], 'Ultra')

    def test_missing_hardware_fields(self):
        body = payload()
        for key in ('GpuBandwidth', 'GpuNumberOfShadingUnits', 'GpuFP32Performance'):
            body.pop(key)
        res = self.post(body)
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertEqual(data['error'], 'MODEL_V2_HARDWARE_DATA_INCOMPLETE')
        self.assertIn('GpuNumberOfShadingUnits', data['missingFields'])
        self.assertIn('GpuFP32Performance', data['missingFields'])

    def test_unsupported_presets_rejected(self):
        for ordinal in (1, 3, 99, 2.5, 'High', True):
            with self.subTest(ordinal=ordinal):
                res = self.post(payload(GameSetting_Ordinal=ordinal))
                self.assertEqual(res.status_code, 400)
                self.assertEqual(res.get_json()['error'], 'UNSUPPORTED_PRESET')

    def test_invalid_numeric_values_rejected(self):
        for bad in ('NaN', 'inf', -100, 0, True, 'abc', [6]):
            with self.subTest(value=bad):
                res = self.post(payload(CpuNumberOfCores=bad))
                self.assertEqual(res.status_code, 400)
                data = res.get_json()
                self.assertEqual(data['error'], 'MODEL_V2_INVALID_FEATURE')
                self.assertIn('CpuNumberOfCores', data['invalidFields'])

    def test_non_string_game_rejected(self):
        res = self.post(payload(GameName=['apexLegends']))
        self.assertEqual(res.status_code, 400)
        self.assertIn('GameName', res.get_json()['invalidFields'])

    def test_ultra_not_faster_than_medium(self):
        med = self.post(payload(GameSetting_Ordinal=2)).get_json()['predictedFps']
        ultra = self.post(payload(GameSetting_Ordinal=4)).get_json()['predictedFps']
        self.assertLessEqual(ultra, med)

    def test_game_sensitivity(self):
        fps = {}
        for game in ('apexLegends', 'grandTheftAuto5', 'counterStrikeGlobalOffensive'):
            data = self.post(payload(GameName=game)).get_json()
            self.assertEqual(data['gameCoverage'], 'known')
            self.assertEqual(data['game'], game)
            fps[game] = data['predictedFps']

        self.assertEqual(len(set(fps.values())), 3)
        self.assertGreater(fps['counterStrikeGlobalOffensive'], fps['grandTheftAuto5'])

        unseen = self.post(payload(GameName='Cyberpunk 2077')).get_json()
        self.assertEqual(unseen['gameCoverage'], 'unseen')
        self.assertGreater(unseen['predictedFps'], 0)


if __name__ == '__main__':
    unittest.main()
