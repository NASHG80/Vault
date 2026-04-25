"""
train_model.py
Run from the `backend/` directory:  python scripts/train_model.py
Generates a synthetic dataset and trains a Logistic Regression model that
predicts job-success probability from 5 worker features:
  [skill_similarity, trust_score, experience, acceptance_rate, location_match]
"""

import os
import random
import joblib
from sklearn.linear_model import LogisticRegression

# ── Resolve output path regardless of CWD ────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))          # .../backend/scripts
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)                         # .../backend
MODEL_PATH = os.path.join(BACKEND_DIR, "app", "ml", "model.pkl")

os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

# ── Generate synthetic dataset ────────────────────────────────────────────────
random.seed(42)
X, y = [], []

for _ in range(1000):
    skill        = random.uniform(0, 1)          # skill overlap ratio [0–1]
    trust        = random.uniform(40, 100)        # trust score [40–100]
    exp          = random.randint(0, 100)         # completed jobs [0–100]
    acc          = random.uniform(0, 1)           # acceptance rate [0–1]
    loc          = random.choice([0, 1])          # location match binary

    # Composite score – any combination above threshold → success
    score = skill + (trust / 100) + (exp / 100) + acc + loc
    label = 1 if score > 2.5 else 0

    X.append([skill, trust, exp, acc, loc])
    y.append(label)

# ── Train ─────────────────────────────────────────────────────────────────────
model = LogisticRegression(max_iter=500, random_state=42)
model.fit(X, y)

# ── Persist ───────────────────────────────────────────────────────────────────
joblib.dump(model, MODEL_PATH)
print(f"✅  Model trained ({sum(y)}/{len(y)} positive samples) and saved → {MODEL_PATH}")