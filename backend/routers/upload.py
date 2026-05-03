from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import pdfplumber
import io
import json

from backend.database import get_db, Patient, CheckIn
from backend.ollama_service import extract_metrics_from_text

router = APIRouter(prefix="/api/upload", tags=["upload"])

@router.post("/lab-report")
async def upload_lab_report(patient_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported currently")

    try:
        content = await file.read()
        extracted_text = ""
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        metrics = await extract_metrics_from_text(extracted_text)

        return {"message": "Report processed successfully", "metrics_extracted": metrics}

    except Exception as e:
        print(f"Error processing upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))
