import numpy as np
import pandas as pd
from xgboost import XGBClassifier
import shap
import joblib
import os
import json

MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
FEATURE_NAMES = [
    "age", "gender", "bmi", "bp_systolic", "bp_diastolic",
    "glucose", "cholesterol", "hdl", "ldl", "sleep_hours",
    "heart_rate", "spo2", "smoker", "family_diabetes", "family_cardiac", "mood"
]

_models = {}
_explainers = {}


def get_models():
    global _models, _explainers
    if _models:
        return _models, _explainers

    os.makedirs(MODELS_DIR, exist_ok=True)
    model_files = {
        "diabetes": os.path.join(MODELS_DIR, "diabetes_model.pkl"),
        "cardiac": os.path.join(MODELS_DIR, "cardiac_model.pkl"),
        "hypertension": os.path.join(MODELS_DIR, "hypertension_model.pkl"),
        "metabolic": os.path.join(MODELS_DIR, "metabolic_model.pkl"),
    }

    if not all(os.path.exists(f) for f in model_files.values()):
        print("[SETUP] Training ML models (first run)...")
        from train_models import train_and_save
        train_and_save()

    for name, path in model_files.items():
        model = joblib.load(path)
        _models[name] = model
        _explainers[name] = shap.TreeExplainer(model)

    print("[OK] ML models loaded.")
    return _models, _explainers


def build_feature_vector(patient, checkin):
    weight = checkin.get("weight", 75)
    height_m = patient.get("height_cm", 170) / 100
    bmi = weight / (height_m ** 2)

    cholesterol = patient.get("cholesterol_baseline", 190)
    hdl = patient.get("hdl_baseline", 55)
    ldl = max(50, cholesterol - hdl - 30)

    glucose = checkin.get("glucose") or patient.get("glucose_baseline", 95)

    return pd.DataFrame([{
        "age": patient.get("age", 40),
        "gender": 1 if patient.get("gender", "M") == "M" else 0,
        "bmi": round(bmi, 2),
        "bp_systolic": checkin.get("bp_systolic", 120),
        "bp_diastolic": checkin.get("bp_diastolic", 80),
        "glucose": glucose,
        "cholesterol": cholesterol,
        "hdl": hdl,
        "ldl": ldl,
        "sleep_hours": checkin.get("sleep_hours", 7),
        "heart_rate": checkin.get("heart_rate", 75),
        "spo2": checkin.get("spo2", 97),
        "smoker": int(patient.get("smoker", False)),
        "family_diabetes": int(patient.get("family_history_diabetes", False)),
        "family_cardiac": int(patient.get("family_history_cardiac", False)),
        "mood": checkin.get("mood", 7),
    }])


def predict_risks(patient_dict: dict, checkin_dict: dict) -> dict:
    models, explainers = get_models()
    X = build_feature_vector(patient_dict, checkin_dict)

    risks = {}
    shap_summary = {}

    for disease in ["diabetes", "cardiac", "hypertension", "metabolic"]:
        model = models[disease]
        explainer = explainers[disease]

        prob = float(model.predict_proba(X)[0][1])
        
        # Apply calibration: sigmoid transformation for more realistic probabilities
        # Prevents unrealistic 100% predictions
        # Maps extreme values to more reasonable range (5%-95%)
        calibrated_prob = 1 / (1 + np.exp(-3 * (prob - 0.5)))  # Sigmoid calibration
        calibrated_prob = max(0.05, min(0.95, calibrated_prob))  # Cap at 5%-95%
        
        risks[f"{disease}_risk"] = round(calibrated_prob * 100, 1)

        shap_vals = explainer.shap_values(X)
        if isinstance(shap_vals, list):
            sv = shap_vals[1][0]
        else:
            sv = shap_vals[0]

        feat_shap = [(FEATURE_NAMES[i], round(float(sv[i]) * 100, 2)) for i in range(len(FEATURE_NAMES))]
        feat_shap.sort(key=lambda x: abs(x[1]), reverse=True)
        shap_summary[disease] = feat_shap[:5]

    risks["shap_values"] = json.dumps(shap_summary)
    return risks


def get_specialist_recommendations(risks: dict) -> list:
    """Recommend specialists based on risk levels"""
    recommendations = []
    
    # Define specialist mappings with risk thresholds
    specialty_mapping = {
        "cardiac_risk": ("Cardiologist", 0.50),  # High cardiac risk threshold
        "diabetes_risk": ("Diabetologist", 0.55),
        "hypertension_risk": ("General Physician / Cardiologist", 0.60),
        "metabolic_risk": ("Endocrinologist", 0.50),
    }
    
    # Extract numeric risk values
    risk_values = {}
    for key in specialty_mapping:
        val = risks.get(key, 0)
        if isinstance(val, str):
            try:
                risk_values[key] = float(val) / 100.0
            except:
                risk_values[key] = 0
        else:
            risk_values[key] = val / 100.0 if val > 1 else val
    
    # Recommend specialists for elevated risks
    for risk_type, (specialist, threshold) in specialty_mapping.items():
        if risk_values.get(risk_type, 0) >= threshold:
            priority = "urgent" if risk_values[risk_type] >= 0.75 else "high" if risk_values[risk_type] >= 0.60 else "moderate"
            recommendations.append({
                "specialist": specialist,
                "reason": risk_type.replace("_risk", "").title(),
                "risk_level": f"{risk_values[risk_type]*100:.1f}%",
                "priority": priority
            })
    
    # Sort by priority (urgent first)
    priority_order = {"urgent": 0, "high": 1, "moderate": 2}
    recommendations.sort(key=lambda x: priority_order.get(x["priority"], 3))
    
    return recommendations


def predict_health_trajectory(checkins: list) -> dict:
    """Predict 7-day health trajectory based on historical data"""
    if len(checkins) < 3:
        return {"trend": "insufficient_data", "prediction": "Need more historical data"}
    
    # Get last 7 days of data
    recent = checkins[-7:] if len(checkins) >= 7 else checkins
    
    # Calculate trends
    bp_systolic_trend = [c.get("bp_systolic", 120) for c in recent]
    glucose_trend = [c.get("glucose", 100) for c in recent]
    heart_rate_trend = [c.get("heart_rate", 75) for c in recent]
    
    # Simple linear trend (is it increasing or decreasing?)
    def calculate_trend(values):
        if len(values) < 2:
            return "stable"
        avg_early = np.mean(values[:len(values)//2])
        avg_late = np.mean(values[len(values)//2:])
        change = (avg_late - avg_early) / avg_early
        if change > 0.05:
            return "worsening"
        elif change < -0.05:
            return "improving"
        else:
            return "stable"
    
    return {
        "bp_systolic_trend": calculate_trend(bp_systolic_trend),
        "glucose_trend": calculate_trend(glucose_trend),
        "heart_rate_trend": calculate_trend(heart_rate_trend),
        "overall_assessment": "Getting worse, schedule doctor visit soon" if calculate_trend(bp_systolic_trend) == "worsening" else "Stable, continue monitoring"
    }

