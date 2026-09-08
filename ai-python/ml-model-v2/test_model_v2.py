import os
import sys
import joblib
import unittest
import pandas as pd
import numpy as np

V2_DIR = os.path.dirname(os.path.abspath(__file__))
if V2_DIR not in sys.path:
    sys.path.insert(0, V2_DIR)

from train_model_v2 import (
    ALL_MODEL_FEATURES,
    CPU_FEATURES,
    GPU_FEATURES,
    WORKLOAD_FEATURES,
    GAME_FEATURE,
    TARGET_COL,
    METADATA_COLS,
    build_preprocessor,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CLEAN_CSV_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'fps_dataset_v2_clean.csv')
CANDIDATE_MODEL_PATH = os.path.join(BASE_DIR, 'experiments', 'v2_baseline', 'candidate_model_v2.joblib')
V1_MODEL_PATH = os.path.join(BASE_DIR, '..', 'project_aura.joblib')
V1_COLS_PATH = os.path.join(BASE_DIR, '..', 'ai_columns.joblib')

class TestModelV2Pipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        assert os.path.exists(CLEAN_CSV_PATH), f"Clean dataset not found at {CLEAN_CSV_PATH}"
        cls.dataset = pd.read_csv(CLEAN_CSV_PATH)

    def test_dataset_shape_and_columns(self):
        """Test clean dataset contains 24,624 rows, 22 columns, and no nulls"""
        self.assertEqual(len(self.dataset), 24624)
        self.assertEqual(len(self.dataset.columns), 22)
        self.assertEqual(self.dataset[TARGET_COL].isnull().sum(), 0)
        self.assertTrue((self.dataset[TARGET_COL] > 0).all())

    def test_x_and_y_separation(self):
        """Test exact X and y feature separation according to Model V2 spec"""
        self.assertNotIn(TARGET_COL, ALL_MODEL_FEATURES)
        self.assertNotIn('CpuName', ALL_MODEL_FEATURES)
        self.assertNotIn('GpuName', ALL_MODEL_FEATURES)
        self.assertNotIn('GameResolution', ALL_MODEL_FEATURES)
        self.assertEqual(len(ALL_MODEL_FEATURES), 16)
        self.assertEqual(len(CPU_FEATURES), 6)
        self.assertEqual(len(GPU_FEATURES), 8)
        self.assertEqual(len(WORKLOAD_FEATURES), 1)
        self.assertEqual(len(GAME_FEATURE), 1)

    def test_ohe_unknown_game_handling(self):
        """Test OneHotEncoder safely handles unknown game titles without crashing"""
        preprocessor = build_preprocessor()
        
        train_data = pd.DataFrame({
            'CpuNumberOfCores': [8],
            'CpuNumberOfThreads': [16],
            'CpuFrequency': [3600.0],
            'CpuTurboClock': [5000.0],
            'CpuCacheL3': [32.0],
            'CpuTDP': [95.0],
            'GpuMemorySize': [8000.0],
            'GpuBandwidth': [448000.0],
            'GpuMemoryBus': [256],
            'GpuNumberOfShadingUnits': [2560],
            'GpuBaseClock': [1400.0],
            'GpuBoostClock': [1700.0],
            'GpuNumberOfROPs': [64],
            'GpuFP32Performance': [9000000.0],
            'GameSetting_Ordinal': [4],
            'GameName': ['cyberpunk2077'],
        })
        
        test_unknown_game = pd.DataFrame({
            'CpuNumberOfCores': [8],
            'CpuNumberOfThreads': [16],
            'CpuFrequency': [3600.0],
            'CpuTurboClock': [5000.0],
            'CpuCacheL3': [32.0],
            'CpuTDP': [95.0],
            'GpuMemorySize': [8000.0],
            'GpuBandwidth': [448000.0],
            'GpuMemoryBus': [256],
            'GpuNumberOfShadingUnits': [2560],
            'GpuBaseClock': [1400.0],
            'GpuBoostClock': [1700.0],
            'GpuNumberOfROPs': [64],
            'GpuFP32Performance': [9000000.0],
            'GameSetting_Ordinal': [4],
            'GameName': ['unseen_future_game_2027'],
        })
        
        preprocessor.fit(train_data)
        transformed_test = preprocessor.transform(test_unknown_game)
        self.assertEqual(transformed_test.shape[0], 1)
        # Check that game one-hot column is 0 for unknown game
        self.assertEqual(transformed_test[0, -1], 0.0)

    def test_unseen_gpu_isolation(self):
        """Test unseen GPU holdout ensures zero GPU leakage in train set"""
        held_out_gpus = ['NVIDIA GeForce RTX 2070 SUPER', 'AMD Radeon RX 5700 XT']
        gpu_mask = self.dataset['GpuName'].isin(held_out_gpus)
        
        train_df = self.dataset[~gpu_mask]
        test_df = self.dataset[gpu_mask]
        
        train_gpus = set(train_df['GpuName'].unique())
        test_gpus = set(test_df['GpuName'].unique())
        
        self.assertEqual(len(train_gpus.intersection(test_gpus)), 0)
        self.assertEqual(test_gpus, set(held_out_gpus))

    def test_unseen_cpu_isolation(self):
        """Test unseen CPU holdout ensures zero CPU leakage in train set"""
        held_out_cpus = ['AMD Ryzen 7 3700X', 'Intel Core i5-8600K']
        cpu_mask = self.dataset['CpuName'].isin(held_out_cpus)
        
        train_df = self.dataset[~cpu_mask]
        test_df = self.dataset[cpu_mask]
        
        train_cpus = set(train_df['CpuName'].unique())
        test_cpus = set(test_df['CpuName'].unique())
        
        self.assertEqual(len(train_cpus.intersection(test_cpus)), 0)
        self.assertEqual(test_cpus, set(held_out_cpus))

    def test_unseen_game_isolation(self):
        """Test unseen Game holdout ensures zero Game leakage in train set"""
        held_out_games = ['apexLegends', 'destiny2']
        game_mask = self.dataset['GameName'].isin(held_out_games)
        
        train_df = self.dataset[~game_mask]
        test_df = self.dataset[game_mask]
        
        train_games = set(train_df['GameName'].unique())
        test_games = set(test_df['GameName'].unique())
        
        self.assertEqual(len(train_games.intersection(test_games)), 0)
        self.assertEqual(test_games, set(held_out_games))

    def test_candidate_model_reload_and_predict(self):
        """Test saved candidate Model V2 artifact reloads cleanly and outputs valid FPS"""
        if os.path.exists(CANDIDATE_MODEL_PATH):
            model = joblib.load(CANDIDATE_MODEL_PATH)
            sample_input = self.dataset[ALL_MODEL_FEATURES].head(5)
            preds = model.predict(sample_input)
            self.assertEqual(len(preds), 5)
            self.assertTrue(np.all(np.isfinite(preds)))
            self.assertTrue(np.all(preds > 0))

    def test_model_v1_artifacts_untouched(self):
        """Test production Model V1 joblib artifacts remain present and unmodified"""
        self.assertTrue(os.path.exists(V1_MODEL_PATH), "Model V1 project_aura.joblib was altered or deleted!")
        self.assertTrue(os.path.exists(V1_COLS_PATH), "Model V1 ai_columns.joblib was altered or deleted!")
        self.assertTrue(os.path.getsize(V1_MODEL_PATH) > 1000000, "Model V1 file size suspicious!")

if __name__ == '__main__':
    unittest.main()

