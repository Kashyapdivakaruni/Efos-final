from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Patient, CheckIn, RiskScore, HealthReport, Alert, Todo, Doctor
from schemas import CheckInRequest, WhatIfRequest
from ml_engine import predict_risks, get_specialist_recommendations, predict_health_trajectory
from rules_engine import evaluate_rules, generate_todos
from ollama_service import generate_health_report
import json
from datetime import datetime

router = APIRouter(prefix="/api", tags=["checkin"])


def validate_vitals(req: CheckInRequest) -> tuple[bool, str]:
    """Validate vital signs are within reasonable ranges"""
    issues = []
    
    # BP validation
    if req.bp_systolic < 80 or req.bp_systolic > 200:
        issues.append(f"BP systolic {req.bp_systolic} is out of normal range (80-200)")
    if req.bp_diastolic < 40 or req.bp_diastolic > 130:
        issues.append(f"BP diastolic {req.bp_diastolic} is out of normal range (40-130)")
    
    # SpO2 validation
    if req.spo2 < 85 or req.spo2 > 100:
        issues.append(f"SpO2 {req.spo2} is out of normal range (85-100)")
    
    # Heart rate validation
    if req.heart_rate < 40 or req.heart_rate > 150:
        issues.append(f"Heart rate {req.heart_rate} is out of normal range (40-150)")
    
    # Glucose validation
    if req.glucose and (req.glucose < 50 or req.glucose > 400):
        issues.append(f"Glucose {req.glucose} is out of normal range (50-400)")
    
    # Sleep validation
    if req.sleep_hours < 0 or req.sleep_hours > 24:
        issues.append(f"Sleep hours {req.sleep_hours} is invalid (0-24)")
    
    if issues:
        return False, " | ".join(issues)
    return True, "Valid"



@router.post("/checkin/{patient_id}")
async def submit_checkin(patient_id: int, req: CheckInRequest, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Validate vitals
    is_valid, validation_msg = validate_vitals(req)
    if not is_valid:
        raise HTTPException(status_code=422, detail=f"Invalid vitals: {validation_msg}")

    checkin = CheckIn(
        patient_id=patient_id,
        bp_systolic=req.bp_systolic,
        bp_diastolic=req.bp_diastolic,
        weight=req.weight,
        mood=req.mood,
        sleep_hours=req.sleep_hours,
        spo2=req.spo2,
        heart_rate=req.heart_rate,
        glucose=req.glucose,
    )
    db.add(checkin)
    db.flush()

    patient_dict = {
        "age": patient.age, "gender": patient.gender,
        "height_cm": patient.height_cm, "smoker": patient.smoker,
        "family_history_diabetes": patient.family_history_diabetes,
        "family_history_cardiac": patient.family_history_cardiac,
        "glucose_baseline": patient.glucose_baseline,
        "cholesterol_baseline": patient.cholesterol_baseline,
        "hdl_baseline": patient.hdl_baseline,
        "name": patient.name,
    }
    checkin_dict = req.dict()

    risks = predict_risks(patient_dict, checkin_dict)

    risk_score = RiskScore(
        patient_id=patient_id,
        checkin_id=checkin.id,
        diabetes_risk=risks["diabetes_risk"],
        cardiac_risk=risks["cardiac_risk"],
        hypertension_risk=risks["hypertension_risk"],
        metabolic_risk=risks["metabolic_risk"],
        shap_values=risks["shap_values"],
    )
    db.add(risk_score)
    db.flush()

    # Generate alerts
    doctor = db.query(Doctor).first()
    alerts = evaluate_rules(checkin_dict, risks)
    for a in alerts:
        db.add(Alert(
            patient_id=patient_id,
            doctor_id=doctor.id if doctor else None,
            alert_type=a["alert_type"],
            message=a["message"],
            severity=a["severity"],
        ))

    # Generate todos
    db.query(Todo).filter(Todo.patient_id == patient_id, Todo.source == "ai", Todo.is_completed == False).delete()
    todo_tasks = generate_todos(checkin_dict, risks, risks["shap_values"])
    for task in todo_tasks:
        db.add(Todo(patient_id=patient_id, task=task, source="ai"))

    # Generate health report
    report_text = await generate_health_report(patient_dict, checkin_dict, risks, risks["shap_values"])
    db.add(HealthReport(
        patient_id=patient_id,
        checkin_id=checkin.id,
        report_text=report_text,
    ))

    db.commit()

    # Get specialist recommendations
    recommendations = get_specialist_recommendations(risks)
    
    # Get historical checkins for trajectory prediction
    historical_checkins = db.query(CheckIn).filter(CheckIn.patient_id == patient_id).order_by(CheckIn.timestamp).all()
    historical_dicts = [
        {
            "bp_systolic": c.bp_systolic,
            "bp_diastolic": c.bp_diastolic,
            "glucose": c.glucose or patient.glucose_baseline,
            "heart_rate": c.heart_rate,
            "weight": c.weight,
            "spo2": c.spo2,
        }
        for c in historical_checkins
    ]
    trajectory = predict_health_trajectory(historical_dicts)

    return {
        "message": "Check-in complete!",
        "risks": {
            "diabetes_risk": risks["diabetes_risk"],
            "cardiac_risk": risks["cardiac_risk"],
            "hypertension_risk": risks["hypertension_risk"],
            "metabolic_risk": risks["metabolic_risk"],
        },
        "specialist_recommendations": recommendations,
        "health_trajectory": trajectory,
        "alerts_generated": len(alerts),
        "report": report_text,
        "shap_values": json.loads(risks["shap_values"]),
    }



@router.post("/whatif")
def what_if_simulation(req: WhatIfRequest, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_dict = {
        "age": patient.age, "gender": patient.gender,
        "height_cm": patient.height_cm, "smoker": patient.smoker,
        "family_history_diabetes": patient.family_history_diabetes,
        "family_history_cardiac": patient.family_history_cardiac,
        "glucose_baseline": patient.glucose_baseline,
        "cholesterol_baseline": patient.cholesterol_baseline,
        "hdl_baseline": patient.hdl_baseline,
    }
    checkin_dict = req.dict()
    del checkin_dict["patient_id"]

    risks = predict_risks(patient_dict, checkin_dict)
    return {
        "diabetes_risk": risks["diabetes_risk"],
        "cardiac_risk": risks["cardiac_risk"],
        "hypertension_risk": risks["hypertension_risk"],
        "metabolic_risk": risks["metabolic_risk"],
    }
