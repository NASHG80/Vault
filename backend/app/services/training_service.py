from app.db.mongo import workers, job_requests
from sklearn.linear_model import LogisticRegression
import joblib

MODEL_PATH = "app/ml/model.pkl"


def generate_dataset():
    X = []
    y = []

    for req in job_requests.find():
        worker = workers.find_one({"_id": req["worker_id"]})
        if not worker:
            continue

        # FEATURES
        skill_score = len(set(worker.get("skills", [])) & set(req.get("skills", []))) / max(len(req.get("skills", [])), 1)

        trust = worker.get("trust_score", 50)
        exp = worker.get("jobs_completed", 0)

        accepted = worker.get("accepted", 1)
        total = worker.get("total_requests", 1)
        acceptance_rate = accepted / total

        location_match = 1 if worker.get("location") == req.get("location") else 0

        X.append([
            skill_score,
            trust,
            exp,
            acceptance_rate,
            location_match
        ])

        # LABEL
        if req.get("status") == "completed":
            y.append(1)
        else:
            y.append(0)

    return X, y


def train_model():
    X, y = generate_dataset()

    if len(X) < 10:
        print("Not enough data, skipping training")
        return

    model = LogisticRegression()
    model.fit(X, y)

    joblib.dump(model, MODEL_PATH)
    print("Model trained and saved!")


def retrain_model():
    print("Retraining model...")
    train_model()