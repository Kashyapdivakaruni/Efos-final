from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timedelta
from passlib.context import CryptContext
import random

SQLALCHEMY_DATABASE_URL = "sqlite:///./predihealth.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    age = Column(Integer)
    gender = Column(String)
    height_cm = Column(Float, default=170.0)
    smoker = Column(Boolean, default=False)
    family_history_diabetes = Column(Boolean, default=False)
    family_history_cardiac = Column(Boolean, default=False)
    glucose_baseline = Column(Float, default=95.0)
    cholesterol_baseline = Column(Float, default=190.0)
    hdl_baseline = Column(Float, default=55.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    checkins = relationship("CheckIn", back_populates="patient", cascade="all, delete")
    risk_scores = relationship("RiskScore", back_populates="patient", cascade="all, delete")
    alerts = relationship("Alert", back_populates="patient", cascade="all, delete")
    todos = relationship("Todo", back_populates="patient", cascade="all, delete")
    reports = relationship("HealthReport", back_populates="patient", cascade="all, delete")


class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    specialty = Column(String)
    rating = Column(Float, default=4.5)
    hospital = Column(String)

    alerts = relationship("Alert", back_populates="doctor")


class CheckIn(Base):
    __tablename__ = "checkins"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    bp_systolic = Column(Integer)
    bp_diastolic = Column(Integer)
    weight = Column(Float)
    mood = Column(Integer)
    sleep_hours = Column(Float)
    spo2 = Column(Float)
    heart_rate = Column(Integer)
    glucose = Column(Float, nullable=True)

    patient = relationship("Patient", back_populates="checkins")
    risk_score = relationship("RiskScore", back_populates="checkin", uselist=False)


class RiskScore(Base):
    __tablename__ = "risk_scores"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    checkin_id = Column(Integer, ForeignKey("checkins.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    diabetes_risk = Column(Float)
    cardiac_risk = Column(Float)
    hypertension_risk = Column(Float)
    metabolic_risk = Column(Float)
    shap_values = Column(Text)

    patient = relationship("Patient", back_populates="risk_scores")
    checkin = relationship("CheckIn", back_populates="risk_score")


class HealthReport(Base):
    __tablename__ = "health_reports"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    checkin_id = Column(Integer, ForeignKey("checkins.id"))
    report_text = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="reports")


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    alert_type = Column(String)
    message = Column(String)
    severity = Column(String)
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="alerts")
    doctor = relationship("Doctor", back_populates="alerts")


class Todo(Base):
    __tablename__ = "todos"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    task = Column(String)
    is_completed = Column(Boolean, default=False)
    source = Column(String, default="ai")
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="todos")


class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    slot = Column(DateTime)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)


def seed_database(db):
    if db.query(Patient).count() > 0:
        return

    patients_data = [
        {"name": "Arjun Sharma", "email": "arjun@demo.com", "age": 52, "gender": "M",
         "height_cm": 172, "smoker": True, "family_history_diabetes": True,
         "family_history_cardiac": False, "glucose_baseline": 138, "cholesterol_baseline": 235,
         "hdl_baseline": 42},
        {"name": "Priya Nair", "email": "priya@demo.com", "age": 38, "gender": "F",
         "height_cm": 160, "smoker": False, "family_history_diabetes": True,
         "family_history_cardiac": False, "glucose_baseline": 105, "cholesterol_baseline": 195,
         "hdl_baseline": 62},
        {"name": "Ravi Kumar", "email": "ravi@demo.com", "age": 61, "gender": "M",
         "height_cm": 168, "smoker": True, "family_history_diabetes": False,
         "family_history_cardiac": True, "glucose_baseline": 115, "cholesterol_baseline": 260,
         "hdl_baseline": 38},
        {"name": "Sunita Patel", "email": "sunita@demo.com", "age": 45, "gender": "F",
         "height_cm": 155, "smoker": False, "family_history_diabetes": False,
         "family_history_cardiac": False, "glucose_baseline": 92, "cholesterol_baseline": 178,
         "hdl_baseline": 68},
        {"name": "Vikram Singh", "email": "vikram@demo.com", "age": 57, "gender": "M",
         "height_cm": 175, "smoker": False, "family_history_diabetes": True,
         "family_history_cardiac": True, "glucose_baseline": 122, "cholesterol_baseline": 248,
         "hdl_baseline": 45},
    ]

    patients = []
    for pd_data in patients_data:
        p = Patient(
            **pd_data,
            password_hash=pwd_context.hash("password123")
        )
        db.add(p)
        patients.append(p)
    db.flush()

    doctors_data = [
        {"name": "Dr. Meera Reddy", "email": "doctor@demo.com",
         "specialty": "Cardiologist", "rating": 4.8, "hospital": "Apollo Hospitals"},
        {"name": "Dr. Kiran Mehta", "email": "doctor2@demo.com",
         "specialty": "Diabetologist", "rating": 4.6, "hospital": "Fortis Healthcare"},
    ]
    doctors = []
    for doc_data in doctors_data:
        d = Doctor(**doc_data, password_hash=pwd_context.hash("doctor123"))
        db.add(d)
        doctors.append(d)
    db.flush()

    random.seed(42)
    vitals_profiles = [
        {"bp_sys": (155, 12), "bp_dia": (95, 8), "weight": (82, 3), "hr": (85, 8)},
        {"bp_sys": (118, 8), "bp_dia": (76, 5), "weight": (62, 1), "hr": (72, 5)},
        {"bp_sys": (168, 15), "bp_dia": (102, 10), "weight": (91, 2), "hr": (88, 10)},
        {"bp_sys": (112, 6), "bp_dia": (72, 4), "weight": (58, 1), "hr": (68, 4)},
        {"bp_sys": (148, 10), "bp_dia": (91, 7), "weight": (87, 2), "hr": (82, 7)},
    ]

    for i, patient in enumerate(patients):
        profile = vitals_profiles[i]
        for day in range(30, 0, -1):
            ts = datetime.utcnow() - timedelta(days=day)
            bp_s = max(90, min(200, int(random.gauss(*profile["bp_sys"]))))
            bp_d = max(60, min(130, int(random.gauss(*profile["bp_dia"]))))
            wt = round(random.gauss(*profile["weight"]), 1)
            hr = max(50, min(130, int(random.gauss(*profile["hr"]))))
            ci = CheckIn(
                patient_id=patient.id,
                timestamp=ts,
                bp_systolic=bp_s,
                bp_diastolic=bp_d,
                weight=wt,
                mood=random.randint(4, 9),
                sleep_hours=round(random.gauss(6.5, 1.2), 1),
                spo2=round(random.gauss(97, 1.5), 1),
                heart_rate=hr,
                glucose=round(random.gauss(patient.glucose_baseline, 12), 1),
            )
            db.add(ci)
    db.flush()

    base_todos = [
        ("Walk 15 minutes after each meal", "ai"),
        ("Check blood pressure in the morning", "ai"),
        ("Take prescribed medication at 8 AM", "doctor"),
        ("Log meals in health journal", "ai"),
        ("Sleep by 10:30 PM tonight", "ai"),
    ]
    for patient in patients:
        for task, source in base_todos:
            db.add(Todo(patient_id=patient.id, task=task, source=source))

    db.add(Alert(
        patient_id=patients[0].id,
        doctor_id=doctors[0].id,
        alert_type="high_cardiac_risk",
        message=f"Patient {patients[0].name} cardiac risk elevated — BP 168/105",
        severity="critical",
    ))
    db.add(Alert(
        patient_id=patients[2].id,
        doctor_id=doctors[0].id,
        alert_type="critical_bp",
        message=f"Patient {patients[2].name} BP critically high — 182/110",
        severity="critical",
    ))

    db.commit()
    print("[DONE] Database seeded successfully!")
