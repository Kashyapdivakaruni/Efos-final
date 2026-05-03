import json
from typing import List, Tuple

THRESHOLDS = {
    "bp_systolic_critical": 180,
    "bp_systolic_high": 140,
    "bp_diastolic_critical": 110,
    "bp_diastolic_high": 90,
    "cardiac_risk_critical": 60,
    "cardiac_risk_high": 40,
    "diabetes_risk_high": 50,
    "spo2_critical": 90,
    "spo2_low": 94,
}


def evaluate_rules(checkin: dict, risks: dict) -> List[dict]:
    alerts = []
    bp_s = checkin.get("bp_systolic", 120)
    bp_d = checkin.get("bp_diastolic", 80)
    spo2 = checkin.get("spo2", 97)
    cardiac = risks.get("cardiac_risk", 0)
    diabetes = risks.get("diabetes_risk", 0)

    if bp_s >= THRESHOLDS["bp_systolic_critical"] or bp_d >= THRESHOLDS["bp_diastolic_critical"]:
        alerts.append({
            "alert_type": "critical_bp",
            "message": f"CRITICAL: BP reading {bp_s}/{bp_d} mmHg — immediate rest required, doctor notified",
            "severity": "critical",
        })
    elif bp_s >= THRESHOLDS["bp_systolic_high"] or bp_d >= THRESHOLDS["bp_diastolic_high"]:
        alerts.append({
            "alert_type": "high_bp",
            "message": f"BP elevated at {bp_s}/{bp_d} mmHg — monitor closely and reduce sodium intake",
            "severity": "high",
        })

    if cardiac >= THRESHOLDS["cardiac_risk_critical"]:
        alerts.append({
            "alert_type": "critical_cardiac",
            "message": f"CRITICAL: Cardiac risk at {cardiac:.0f}% — doctor immediately notified. Please rest.",
            "severity": "critical",
        })
    elif cardiac >= THRESHOLDS["cardiac_risk_high"]:
        alerts.append({
            "alert_type": "high_cardiac_risk",
            "message": f"Cardiac risk elevated at {cardiac:.0f}% — avoid strenuous activity",
            "severity": "high",
        })

    if diabetes >= THRESHOLDS["diabetes_risk_high"]:
        alerts.append({
            "alert_type": "high_diabetes_risk",
            "message": f"Diabetes risk at {diabetes:.0f}% — check fasting glucose, reduce sugar intake",
            "severity": "medium",
        })

    if spo2 <= THRESHOLDS["spo2_critical"]:
        alerts.append({
            "alert_type": "critical_spo2",
            "message": f"CRITICAL: SpO2 at {spo2:.0f}% — seek immediate medical attention",
            "severity": "critical",
        })
    elif spo2 <= THRESHOLDS["spo2_low"]:
        alerts.append({
            "alert_type": "low_spo2",
            "message": f"SpO2 low at {spo2:.0f}% — rest and monitor breathing",
            "severity": "high",
        })

    return alerts


def generate_todos(checkin: dict, risks: dict, shap_json: str) -> List[str]:
    todos = []
    bp_s = checkin.get("bp_systolic", 120)
    sleep = checkin.get("sleep_hours", 7)
    mood = checkin.get("mood", 7)
    cardiac = risks.get("cardiac_risk", 0)
    diabetes = risks.get("diabetes_risk", 0)

    if bp_s > 140:
        todos.append("Rest immediately — avoid physical exertion today")
        todos.append("Reduce sodium: skip salt in all meals today")
    if sleep < 6:
        todos.append("Sleep deprivation detected — aim for 7–8 hours tonight")
    if mood < 4:
        todos.append("Take a 10-minute mindfulness break to manage stress")
    if cardiac > 40:
        todos.append("Walk gently for 15 minutes — no intense exercise")
        todos.append("Take your prescribed cardiac medication if applicable")
    if diabetes > 40:
        todos.append("Avoid sugary drinks and high-GI foods today")
        todos.append("Check fasting blood glucose tomorrow morning")
    todos.append("Log your water intake — aim for 8 glasses today")
    todos.append("Do a 5-minute breathing exercise before bed")
    return todos[:6]
