from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.database import get_db, Patient, CheckIn, RiskScore
from backend.schemas import ChatRequest
from backend.ollama_service import chat_with_patient
import json

router = APIRouter(prefix="/api", tags=["chatbot"])


@router.post("/chat")
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    latest_checkin = db.query(CheckIn).filter(
        CheckIn.patient_id == req.patient_id
    ).order_by(desc(CheckIn.timestamp)).first()

    latest_risk = db.query(RiskScore).filter(
        RiskScore.patient_id == req.patient_id
    ).order_by(desc(RiskScore.timestamp)).first()

    patient_dict = {
        "name": patient.name, "age": patient.age, "gender": patient.gender,
        "smoker": patient.smoker,
        "family_history_diabetes": patient.family_history_diabetes,
        "family_history_cardiac": patient.family_history_cardiac,
    }

    checkin_dict = {}
    if latest_checkin:
        checkin_dict = {
            "bp_systolic": latest_checkin.bp_systolic,
            "bp_diastolic": latest_checkin.bp_diastolic,
            "sleep_hours": latest_checkin.sleep_hours,
            "mood": latest_checkin.mood,
            "spo2": latest_checkin.spo2,
            "heart_rate": latest_checkin.heart_rate,
            "weight": latest_checkin.weight,
        }

    risks_dict = {}
    shap_json = "{}"
    if latest_risk:
        risks_dict = {
            "cardiac_risk": latest_risk.cardiac_risk,
            "diabetes_risk": latest_risk.diabetes_risk,
            "hypertension_risk": latest_risk.hypertension_risk,
            "metabolic_risk": latest_risk.metabolic_risk,
        }
        shap_json = latest_risk.shap_values or "{}"

    response = await chat_with_patient(
        patient=patient_dict,
        checkin=checkin_dict,
        risks=risks_dict,
        shap_json=shap_json,
        user_message=req.message,
    )

    return {"response": response, "patient_name": patient.name}
