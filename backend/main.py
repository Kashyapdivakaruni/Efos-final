from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import Base, engine, SessionLocal, seed_database
from backend.routers import auth, checkin, dashboard, chatbot, ingest, doctor, upload

app = FastAPI(
    title="PrediHealth API",
    description="AI-powered healthcare analytics platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(checkin.router)
app.include_router(dashboard.router)
app.include_router(chatbot.router)
app.include_router(ingest.router)
app.include_router(doctor.router)
app.include_router(upload.router)

@app.on_event("startup")
async def startup_event():
    print("[START] PrediHealth API starting up...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Pre-load ML models
    try:
        from backend.ml_engine import get_models
        get_models()
    except Exception as e:
        print(f"⚠️  ML models not loaded yet: {e}")

    print("[READY] PrediHealth API ready!")


@app.get("/")
def root():
    return {
        "status": "healthy",
        "message": "PrediHealth API v1.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
