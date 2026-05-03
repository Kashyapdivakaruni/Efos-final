from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class LoginRequest(BaseModel):
    email: str
    password: str
    role: str  # "patient" or "doctor"


class PatientRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    age: int
    gender: str
    height_cm: float = 170.0
    smoker: bool = False
    family_history_diabetes: bool = False
    family_history_cardiac: bool = False
    glucose_baseline: float = 95.0
    cholesterol_baseline: float = 190.0
    hdl_baseline: float = 55.0


class DoctorRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    specialty: str = "General"
    hospital: str = "PrediHealth Clinic"


class CheckInRequest(BaseModel):
    bp_systolic: int
    bp_diastolic: int
    weight: float
    mood: int
    sleep_hours: float
    spo2: float
    heart_rate: int
    glucose: Optional[float] = None


class WhatIfRequest(BaseModel):
    patient_id: int
    bp_systolic: int
    bp_diastolic: int
    weight: float
    sleep_hours: float
    mood: int
    spo2: float
    heart_rate: int
    glucose: Optional[float] = None


class ChatRequest(BaseModel):
    patient_id: int
    message: str


class TodoUpdate(BaseModel):
    is_completed: bool


class RiskScoreOut(BaseModel):
    diabetes_risk: float
    cardiac_risk: float
    hypertension_risk: float
    metabolic_risk: float
    shap_values: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class CheckInOut(BaseModel):
    id: int
    timestamp: datetime
    bp_systolic: int
    bp_diastolic: int
    weight: float
    mood: int
    sleep_hours: float
    spo2: float
    heart_rate: int
    risk_score: Optional[RiskScoreOut] = None

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: int
    patient_id: int
    alert_type: str
    message: str
    severity: str
    is_read: bool
    timestamp: datetime

    class Config:
        from_attributes = True


class TodoOut(BaseModel):
    id: int
    task: str
    is_completed: bool
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


class PatientSummary(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    latest_risk: Optional[RiskScoreOut] = None
    latest_checkin: Optional[CheckInOut] = None
    unread_alerts: int = 0

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    name: str
