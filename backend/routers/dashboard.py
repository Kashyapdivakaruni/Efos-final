from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.database import get_db, Patient, Doctor, CheckIn, RiskScore, Alert, Todo, HealthReport
from typing import List
import json
from datetime import datetime, timedelta

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard/patient/{patient_id}")
def patient_dashboard(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    latest_checkin = db.query(CheckIn).filter(
        CheckIn.patient_id == patient_id
    ).order_by(desc(CheckIn.timestamp)).first()

    latest_risk = db.query(RiskScore).filter(
        RiskScore.patient_id == patient_id
    ).order_by(desc(RiskScore.timestamp)).first()

    latest_report = db.query(HealthReport).filter(
        HealthReport.patient_id == patient_id
    ).order_by(desc(HealthReport.timestamp)).first()

    history = db.query(CheckIn).filter(
        CheckIn.patient_id == patient_id
    ).order_by(desc(CheckIn.timestamp)).limit(30).all()

    risk_history = db.query(RiskScore).filter(
        RiskScore.patient_id == patient_id
    ).order_by(desc(RiskScore.timestamp)).limit(30).all()

    todos = db.query(Todo).filter(
        Todo.patient_id == patient_id
    ).order_by(desc(Todo.created_at)).limit(10).all()

    alerts = db.query(Alert).filter(
        Alert.patient_id == patient_id
    ).order_by(desc(Alert.timestamp)).limit(5).all()

    trajectory = []
    if risk_history:
        latest_r = risk_history[0]
        for d in range(0, 91, 10):
            decay = 0.995 ** d
            trajectory.append({
                "day": d,
                "current": {
                    "cardiac": round(latest_r.cardiac_risk * decay, 1),
                    "diabetes": round(latest_r.diabetes_risk * decay, 1),
                },
                "improved": {
                    "cardiac": round(latest_r.cardiac_risk * (decay ** 1.3), 1),
                    "diabetes": round(latest_r.diabetes_risk * (decay ** 1.3), 1),
                },
            })

    shap_data = {}
    if latest_risk and latest_risk.shap_values:
        try:
            shap_data = json.loads(latest_risk.shap_values)
        except Exception:
            pass

    return {
        "patient": {
            "id": patient.id, "name": patient.name, "age": patient.age,
            "gender": patient.gender, "email": patient.email,
        },
        "latest_checkin": {
            "bp_systolic": latest_checkin.bp_systolic if latest_checkin else None,
            "bp_diastolic": latest_checkin.bp_diastolic if latest_checkin else None,
            "weight": latest_checkin.weight if latest_checkin else None,
            "mood": latest_checkin.mood if latest_checkin else None,
            "sleep_hours": latest_checkin.sleep_hours if latest_checkin else None,
            "spo2": latest_checkin.spo2 if latest_checkin else None,
            "heart_rate": latest_checkin.heart_rate if latest_checkin else None,
            "timestamp": latest_checkin.timestamp.isoformat() if latest_checkin else None,
        } if latest_checkin else None,
        "risk_scores": {
            "diabetes_risk": latest_risk.diabetes_risk if latest_risk else 0,
            "cardiac_risk": latest_risk.cardiac_risk if latest_risk else 0,
            "hypertension_risk": latest_risk.hypertension_risk if latest_risk else 0,
            "metabolic_risk": latest_risk.metabolic_risk if latest_risk else 0,
        } if latest_risk else None,
        "shap_values": shap_data,
        "report": latest_report.report_text if latest_report else None,
        "history": [
            {
                "date": c.timestamp.strftime("%b %d"),
                "bp_systolic": c.bp_systolic,
                "bp_diastolic": c.bp_diastolic,
                "weight": c.weight,
                "heart_rate": c.heart_rate,
                "sleep_hours": c.sleep_hours,
                "mood": c.mood,
            }
            for c in reversed(history)
        ],
        "risk_history": [
            {
                "date": r.timestamp.strftime("%b %d"),
                "cardiac": r.cardiac_risk,
                "diabetes": r.diabetes_risk,
                "hypertension": r.hypertension_risk,
                "metabolic": r.metabolic_risk,
            }
            for r in reversed(risk_history)
        ],
        "todos": [
            {"id": t.id, "task": t.task, "is_completed": t.is_completed, "source": t.source}
            for t in todos
        ],
        "alerts": [
            {"id": a.id, "message": a.message, "severity": a.severity,
             "alert_type": a.alert_type, "is_read": a.is_read,
             "timestamp": a.timestamp.isoformat()}
            for a in alerts
        ],
        "trajectory": trajectory,
    }


@router.get("/dashboard/doctor/{doctor_id}")
def doctor_dashboard(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    patients = db.query(Patient).all()
    patient_summaries = []

    for p in patients:
        latest_risk = db.query(RiskScore).filter(
            RiskScore.patient_id == p.id
        ).order_by(desc(RiskScore.timestamp)).first()

        latest_checkin = db.query(CheckIn).filter(
            CheckIn.patient_id == p.id
        ).order_by(desc(CheckIn.timestamp)).first()

        unread_alerts = db.query(Alert).filter(
            Alert.patient_id == p.id, Alert.is_read == False
        ).count()

        critical_alerts = db.query(Alert).filter(
            Alert.patient_id == p.id,
            Alert.severity == "critical",
            Alert.is_read == False
        ).all()

        max_risk = 0
        if latest_risk:
            max_risk = max(
                latest_risk.cardiac_risk,
                latest_risk.diabetes_risk,
                latest_risk.hypertension_risk,
                latest_risk.metabolic_risk
            )

        patient_summaries.append({
            "id": p.id, "name": p.name, "age": p.age, "gender": p.gender,
            "max_risk": round(max_risk, 1),
            "cardiac_risk": round(latest_risk.cardiac_risk, 1) if latest_risk else 0,
            "diabetes_risk": round(latest_risk.diabetes_risk, 1) if latest_risk else 0,
            "hypertension_risk": round(latest_risk.hypertension_risk, 1) if latest_risk else 0,
            "unread_alerts": unread_alerts,
            "is_critical": unread_alerts > 0 and any(a.severity == "critical" for a in critical_alerts),
            "latest_bp": f"{latest_checkin.bp_systolic}/{latest_checkin.bp_diastolic}" if latest_checkin else "N/A",
            "last_checkin": latest_checkin.timestamp.strftime("%b %d, %H:%M") if latest_checkin else "No data",
        })

    patient_summaries.sort(key=lambda x: (-x["is_critical"], -x["max_risk"]))

    unread_doc_alerts = db.query(Alert).filter(
        Alert.doctor_id == doctor_id, Alert.is_read == False
    ).order_by(desc(Alert.timestamp)).all()

    return {
        "doctor": {"id": doctor.id, "name": doctor.name, "specialty": doctor.specialty},
        "patients": patient_summaries,
        "critical_alerts": [
            {
                "id": a.id,
                "patient_id": a.patient_id,
                "message": a.message,
                "severity": a.severity,
                "timestamp": a.timestamp.isoformat(),
            }
            for a in unread_doc_alerts
        ],
        "stats": {
            "total_patients": len(patients),
            "critical_count": sum(1 for p in patient_summaries if p["is_critical"]),
            "high_risk_count": sum(1 for p in patient_summaries if p["max_risk"] > 40),
        }
    }


@router.get("/patient/{patient_id}/detail")
def patient_detail(patient_id: int, db: Session = Depends(get_db)):
    return patient_dashboard(patient_id, db)


@router.put("/todos/{todo_id}")
def update_todo(todo_id: int, is_completed: bool, db: Session = Depends(get_db)):
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    todo.is_completed = is_completed
    db.commit()
    return {"success": True}


@router.put("/alerts/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.is_read = True
        db.commit()
    return {"success": True}
