from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db, Doctor, Appointment, Patient
from datetime import datetime

router = APIRouter(prefix="/api/doctors", tags=["doctors"])


@router.get("/")
def list_doctors(specialty: str | None = None, db: Session = Depends(get_db)) -> List[dict]:
    try:
        q = db.query(Doctor)
        if specialty:
            q = q.filter(Doctor.specialty.ilike(f"%{specialty}%"))
        doctors = q.order_by(Doctor.rating.desc()).all()
        
        return [
            {
                "id": d.id,
                "name": d.name,
                "email": d.email,
                "specialty": d.specialty,
                "rating": d.rating,
                "hospital": d.hospital
            }
            for d in doctors
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching doctors: {str(e)}")


@router.get("/by-specialty/{specialty}")
def get_doctors_by_specialty(specialty: str, db: Session = Depends(get_db)) -> List[dict]:
    """Get doctors by medical specialty (Cardiologist, Diabetologist, etc.)"""
    try:
        doctors = db.query(Doctor).filter(
            Doctor.specialty.ilike(f"%{specialty}%")
        ).order_by(Doctor.rating.desc()).all()
        
        return [
            {
                "id": d.id,
                "name": d.name,
                "specialty": d.specialty,
                "rating": d.rating,
                "hospital": d.hospital
            }
            for d in doctors
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching doctors: {str(e)}")


@router.post("/book")
def book_appointment(patient_id: int, doctor_id: int, slot: datetime, db: Session = Depends(get_db)):
    """Book an appointment with a doctor"""
    try:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

        appt = Appointment(patient_id=patient_id, doctor_id=doctor_id, slot=slot, status="booked")
        db.add(appt)
        db.commit()
        db.refresh(appt)
        
        return {
            "message": f"Appointment booked with {doctor.name} ({doctor.specialty})",
            "appointment_id": appt.id,
            "doctor_name": doctor.name,
            "doctor_specialty": doctor.specialty,
            "slot": appt.slot.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error booking appointment: {str(e)}")

