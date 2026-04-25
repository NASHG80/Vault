"""
ai_service.py
Loads the trained Logistic Regression model (model.pkl) on first call and
exposes a `predict(features)` helper.  Falls back to 0.5 if the model file
doesn't exist yet (graceful degradation).
"""

import os
import joblib

# Resolve model path relative to this file so it works regardless of CWD
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # app/
MODEL_PATH = os.path.join(_BASE_DIR, "ml", "model.pkl")

_model = None


def _load_model():
    global _model
    if _model is None:
        if os.path.exists(MODEL_PATH):
            _model = joblib.load(MODEL_PATH)
        else:
            print(f"[ai_service] WARNING: model not found at {MODEL_PATH}. "
                  "Run 'python scripts/train_model.py' to create it.")
    return _model


def predict(features: list) -> float:
    """
    Returns a probability score in [0, 1].
    features: [skill_similarity, trust_score, experience, acceptance_rate, location_match]
    """
    m = _load_model()
    if m is None:
        return 0.5  # graceful fallback
    return float(m.predict_proba([features])[0][1])