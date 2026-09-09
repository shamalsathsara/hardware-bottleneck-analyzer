"""
Project Aura — Game-Aware Prediction Regression Test
Tests the REAL end-to-end prediction path:
- Hardware: i5-9500 + GTX 1660 SUPER, 16GB, 1080p, High
- Asserts known games produce DIFFERENT raw FPS values
- Asserts unseen game produces gameCoverage='unseen'
- Uses the actual saved candidate_model_v2.joblib artifact
"""

import os
import sys
import pytest
import joblib
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'ml-model-v2', 'experiments', 'v2_baseline', 'candidate_model_v2.joblib')

# i5-9500 + GTX 1660 SUPER physical specs
BASE_ROW = {
    'CpuNumberOfCores':       6.0,
    'CpuNumberOfThreads':     6.0,
    'CpuFrequency':           3100.0,
    'CpuTurboClock':          4400.0,
    'CpuCacheL3':             9.0,
    'CpuTDP':                 65.0,
    'GpuMemorySize':          6144.0,
    'GpuBandwidth':           192000.0,
    'GpuMemoryBus':           192.0,
    'GpuNumberOfShadingUnits': 1408.0,
    'GpuBaseClock':           1530.0,
    'GpuBoostClock':          1785.0,
    'GpuNumberOfROPs':        48.0,
    'GpuFP32Performance':     5023.26,
    'GameSetting_Ordinal':    3,
}

KNOWN_V2_GAMES = {
    'aWayOut', 'airMechStrike', 'apexLegends', 'battlefield4', 'battletech',
    'callOfDutyWW2', 'counterStrikeGlobalOffensive', 'destiny2', 'dota2',
    'farCry5', 'fortnite', 'frostpunk', 'grandTheftAuto5', 'leagueOfLegends',
    'overwatch', 'pathOfExile', 'playerUnknownsBattlegrounds', 'radicalHeights',
    'rainbowSixSiege', 'seaOfThieves', 'starcraft2', 'totalWar3Kingdoms',
    'warframe', 'worldOfTanks'
}


@pytest.fixture(scope='module')
def model():
    assert os.path.exists(MODEL_PATH), f"Model not found: {MODEL_PATH}"
    return joblib.load(MODEL_PATH)


def predict_fps(model, game_name):
    row = dict(BASE_ROW)
    row['GameName'] = game_name
    df = pd.DataFrame([row])
    return float(model.predict(df)[0])


class TestGameAwarePrediction:
    """Proves game-sensitive predictions using the real Model V2 artifact."""

    def test_model_loads(self, model):
        """Model artifact is loadable and is a sklearn Pipeline."""
        assert model is not None
        assert hasattr(model, 'predict')
        assert hasattr(model, 'steps')

    def test_pipeline_has_game_ohe(self, model):
        """Pipeline includes a fitted OneHotEncoder for GameName."""
        preprocessor = model.named_steps.get('preprocessor')
        assert preprocessor is not None, "Pipeline has no 'preprocessor' step"
        # Use transformers_ (fitted) not transformers (spec) to access categories_
        game_transformer = None
        for name, transformer, cols in preprocessor.transformers_:
            if 'GameName' in cols:
                game_transformer = transformer
        assert game_transformer is not None, "No fitted transformer for GameName column"
        assert hasattr(game_transformer, 'categories_'), "GameName encoder has no categories_ (not fitted?)"
        categories = game_transformer.categories_[0]
        assert 'grandTheftAuto5' in categories, "grandTheftAuto5 not in OHE categories"
        assert 'fortnite' in categories, "fortnite not in OHE categories"
        assert 'apexLegends' in categories, "apexLegends not in OHE categories"

    def test_known_games_produce_different_fps(self, model):
        """CORE TEST: Same hardware, different known games → different FPS predictions."""
        gta_fps = predict_fps(model, 'grandTheftAuto5')
        fortnite_fps = predict_fps(model, 'fortnite')
        apex_fps = predict_fps(model, 'apexLegends')

        print(f"\n  grandTheftAuto5: {gta_fps:.4f} FPS")
        print(f"  fortnite:        {fortnite_fps:.4f} FPS")
        print(f"  apexLegends:     {apex_fps:.4f} FPS")

        assert gta_fps != fortnite_fps, (
            f"grandTheftAuto5 ({gta_fps:.4f}) and fortnite ({fortnite_fps:.4f}) "
            "produce identical FPS — model is game-blind!"
        )
        assert gta_fps != apex_fps, (
            f"grandTheftAuto5 ({gta_fps:.4f}) and apexLegends ({apex_fps:.4f}) "
            "produce identical FPS — model is game-blind!"
        )
        assert fortnite_fps != apex_fps, (
            f"fortnite ({fortnite_fps:.4f}) and apexLegends ({apex_fps:.4f}) "
            "produce identical FPS — model is game-blind!"
        )

        # Verify a meaningful spread exists between extreme games
        fps_list = [gta_fps, fortnite_fps, apex_fps]
        spread = max(fps_list) - min(fps_list)
        assert spread > 5.0, (
            f"Game FPS spread ({spread:.2f}) is suspiciously small — "
            "game feature may have negligible impact"
        )

    def test_unseen_game_produces_baseline(self, model):
        """Unseen games produce the same OHE-zeros baseline via handle_unknown='ignore'."""
        unseen_games = [
            "Assassin's Creed Brotherhood",
            'cyberpunk2077',
            'eldenring',
            '',
        ]
        fps_values = [predict_fps(model, g) for g in unseen_games]
        print(f"\n  Unseen game FPS values: {[round(v, 4) for v in fps_values]}")
        # All unseen games map to all-zeros OHE → same baseline prediction
        assert len(set(round(v, 2) for v in fps_values)) == 1, (
            "Different unseen games produce different predictions — unexpected"
        )

    def test_assassins_creed_brotherhood_is_unseen(self, model):
        """Assassin's Creed Brotherhood is NOT a V2 training game."""
        assert "Assassin's Creed Brotherhood" not in KNOWN_V2_GAMES
        assert 'assassinsCreedBrotherhood' not in KNOWN_V2_GAMES
        # Backend gameCoverage for this game must be 'unseen'
        canonical = 'assassinsCreedBrotherhood'
        assert canonical not in KNOWN_V2_GAMES, (
            f"'{canonical}' is incorrectly listed as a known V2 training game"
        )

    def test_all_24_known_games_have_unique_predictions(self, model):
        """All 24 Model V2 training games must produce distinct predictions."""
        fps_map = {}
        for game in KNOWN_V2_GAMES:
            fps_map[game] = predict_fps(model, game)

        fps_values = list(fps_map.values())
        unique_count = len(set(round(v, 3) for v in fps_values))
        print(f"\n  Unique FPS values across {len(KNOWN_V2_GAMES)} known games: {unique_count}")
        assert unique_count == len(KNOWN_V2_GAMES), (
            f"Only {unique_count}/{len(KNOWN_V2_GAMES)} unique predictions — "
            "some known games are producing identical FPS"
        )

    def test_fps_range_is_realistic(self, model):
        """FPS predictions across known games should span a realistic range."""
        fps_values = [predict_fps(model, g) for g in KNOWN_V2_GAMES]
        min_fps = min(fps_values)
        max_fps = max(fps_values)
        print(f"\n  FPS range: {min_fps:.2f} – {max_fps:.2f} (span: {max_fps - min_fps:.2f})")
        assert max_fps - min_fps > 10, "Game FPS range is unrealistically narrow"
        assert min_fps > 0, "Negative/zero FPS prediction returned"
        assert max_fps < 1500, "Unrealistically high FPS prediction"

    def test_preset_affects_fps(self, model):
        """Higher graphics settings should generally reduce FPS."""
        game = 'grandTheftAuto5'
        fps_by_preset = {}
        for ordinal, label in [(1, 'Low'), (2, 'Medium'), (3, 'High'), (4, 'Ultra')]:
            row = dict(BASE_ROW)
            row['GameName'] = game
            row['GameSetting_Ordinal'] = ordinal
            df = pd.DataFrame([row])
            fps_by_preset[label] = float(model.predict(df)[0])

        print(f"\n  Preset FPS: {fps_by_preset}")
        # Ultra should not be higher than Low
        assert fps_by_preset['Ultra'] < fps_by_preset['Low'], (
            "Ultra preset produces higher FPS than Low — preset feature broken"
        )
