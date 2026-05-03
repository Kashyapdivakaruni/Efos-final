import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")


def generate_synthetic_data(n=3000):
    np.random.seed(42)
    age = np.random.randint(25, 80, n)
    gender = np.random.randint(0, 2, n)
    bmi = np.clip(np.random.normal(27, 5, n), 15, 50)
    bp_sys = np.clip(np.random.normal(130, 22, n), 90, 210)
    bp_dia = np.clip(bp_sys * 0.62 + np.random.normal(5, 6, n), 60, 130)
    glucose = np.clip(np.random.normal(105, 35, n), 70, 400)
    cholesterol = np.clip(np.random.normal(200, 42, n), 100, 400)
    hdl = np.clip(np.random.normal(55, 15, n), 20, 100)
    ldl = np.clip(cholesterol - hdl - np.random.normal(25, 8, n), 40, 300)
    sleep_hours = np.clip(np.random.normal(7, 1.5, n), 3, 12)
    heart_rate = np.clip(np.random.normal(75, 12, n), 45, 130)
    spo2 = np.clip(np.random.normal(97, 1.8, n), 85, 100)
    smoker = np.random.randint(0, 2, n)
    family_diabetes = np.random.randint(0, 2, n)
    family_cardiac = np.random.randint(0, 2, n)
    mood = np.random.randint(1, 11, n)

    X = pd.DataFrame({
        "age": age, "gender": gender, "bmi": bmi,
        "bp_systolic": bp_sys, "bp_diastolic": bp_dia,
        "glucose": glucose, "cholesterol": cholesterol,
        "hdl": hdl, "ldl": ldl, "sleep_hours": sleep_hours,
        "heart_rate": heart_rate, "spo2": spo2,
        "smoker": smoker, "family_diabetes": family_diabetes,
        "family_cardiac": family_cardiac, "mood": mood,
    })

    noise = lambda: np.random.normal(0, 0.08, n)

    diabetes_score = (
        (glucose > 126) * 0.40 + (bmi > 30) * 0.20 + (age > 45) * 0.15 +
        family_diabetes * 0.15 + (sleep_hours < 6) * 0.05 + noise()
    )
    y_diabetes = (diabetes_score > 0.38).astype(int)

    cardiac_score = (
        (bp_sys > 140) * 0.28 + (cholesterol > 240) * 0.18 + (ldl > 160) * 0.15 +
        smoker * 0.20 + (age > 50) * 0.10 + family_cardiac * 0.15 +
        (hdl < 40) * 0.10 + noise()
    )
    y_cardiac = (cardiac_score > 0.33).astype(int)

    hypertension_score = (
        (bp_sys > 130) * 0.38 + (bp_dia > 85) * 0.20 + (bmi > 28) * 0.15 +
        (age > 40) * 0.12 + smoker * 0.12 + (mood < 4) * 0.05 + noise()
    )
    y_hypertension = (hypertension_score > 0.33).astype(int)

    metabolic_score = (
        (bmi > 30) * 0.28 + (glucose > 100) * 0.20 + (cholesterol > 200) * 0.15 +
        (bp_sys > 130) * 0.15 + (hdl < 40) * 0.18 + (sleep_hours < 6) * 0.07 + noise()
    )
    y_metabolic = (metabolic_score > 0.33).astype(int)

    return X, y_diabetes, y_cardiac, y_hypertension, y_metabolic


def train_and_save():
    os.makedirs(MODELS_DIR, exist_ok=True)
    X, y_diabetes, y_cardiac, y_hypertension, y_metabolic = generate_synthetic_data()

    targets = {
        "diabetes": y_diabetes,
        "cardiac": y_cardiac,
        "hypertension": y_hypertension,
        "metabolic": y_metabolic,
    }

    for name, y in targets.items():
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Better hyperparameters for realistic probabilities
        model = XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            min_child_weight=5,
            gamma=1.0,
            reg_alpha=0.5,
            reg_lambda=2.0,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42
        )
        model.fit(X_train, y_train)
        acc = model.score(X_test, y_test)
        print(f"  [OK] {name} model accuracy: {acc:.2%}")
        joblib.dump(model, os.path.join(MODELS_DIR, f"{name}_model.pkl"))

    print("[DONE] All 4 models trained and saved!")


if __name__ == "__main__":
    train_and_save()
