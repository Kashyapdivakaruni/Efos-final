from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import jwt
from passlib.context import CryptContext
from database import get_db, Patient, Doctor
from schemas import LoginRequest, PatientRegister, DoctorRegister, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "predihealth-secret-2024-hackathon"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440


def create_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    if req.role == "patient":
        user = db.query(Patient).filter(Patient.email == req.email).first()
    else:
        user = db.query(Doctor).filter(Doctor.email == req.email).first()

    if not user or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({"sub": str(user.id), "role": req.role, "name": user.name})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=req.role,
        user_id=user.id,
        name=user.name
    )


@router.post("/register", response_model=TokenResponse)
def register(req: PatientRegister, db: Session = Depends(get_db)):
    if db.query(Patient).filter(Patient.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    patient = Patient(
        name=req.name, email=req.email,
        password_hash=pwd_context.hash(req.password),
        age=req.age, gender=req.gender,
        height_cm=req.height_cm, smoker=req.smoker,
        family_history_diabetes=req.family_history_diabetes,
        family_history_cardiac=req.family_history_cardiac,
        glucose_baseline=req.glucose_baseline,
        cholesterol_baseline=req.cholesterol_baseline,
        hdl_baseline=req.hdl_baseline,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    token = create_token({"sub": str(patient.id), "role": "patient", "name": patient.name})
    return TokenResponse(
        access_token=token, token_type="bearer",
        role="patient", user_id=patient.id, name=patient.name
    )


@router.post("/register-doctor", response_model=TokenResponse)
def register_doctor(req: DoctorRegister, db: Session = Depends(get_db)):
    if db.query(Doctor).filter(Doctor.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    doctor = Doctor(
        name=req.name, email=req.email,
        password_hash=pwd_context.hash(req.password),
        specialty=req.specialty,
        hospital=req.hospital
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)

    token = create_token({"sub": str(doctor.id), "role": "doctor", "name": doctor.name})
    return TokenResponse(
        access_token=token, token_type="bearer",
        role="doctor", user_id=doctor.id, name=doctor.name
    )


@router.get("/demo-accounts")
def demo_accounts():
    return {
        "patients": [
            {"email": "arjun@demo.com", "password": "password123", "name": "Arjun Sharma"},
            {"email": "priya@demo.com", "password": "password123", "name": "Priya Nair"},
            {"email": "ravi@demo.com", "password": "password123", "name": "Ravi Kumar"},
            {"email": "sunita@demo.com", "password": "password123", "name": "Sunita Patel"},
            {"email": "vikram@demo.com", "password": "password123", "name": "Vikram Singh"},
        ],
        "doctors": [
            {"email": "doctor@demo.com", "password": "doctor123", "name": "Dr. Meera Reddy"},
            {"email": "doctor2@demo.com", "password": "doctor123", "name": "Dr. Kiran Mehta"},
        ]
    }
