# PrediHealth — AI-Powered Predictive Healthcare Analytics Platform

A full-stack health risk prediction system combining **XGBoost ML models**, **SHAP explainability**, **Ollama LLM integration**, and **cloud OCR** for comprehensive patient health monitoring and doctor coordination.

## 🎯 Key Features

### 1. **Multi-Disease Risk Prediction (87–92% Accuracy)**
- **XGBoost ensemble** predicts cardiac, diabetes, hypertension, metabolic risk
- **SHAP values** explain top risk drivers per patient
- Real-time vital sign ingestion → instant risk score

### 2. **Safety-First Alert Rules Engine**
- Critical thresholds: BP ≥180/110, SpO2 ≤90%, cardiac risk ≥60%
- Auto-notify doctors on high-risk events
- Personalized daily actionable todos

### 3. **Lab Report Ingestion (Cloud OCR Fallback)**
- **Local:** Pytesseract + PDFPlumber (fast, no internet)
- **Cloud Fallback:** Google Vision API (via API key) or service account
- Auto-extract vitals: BP, glucose, SpO2, heart rate

### 4. **Contextual Health AI Chat** 
- Ollama llama3.2 with full patient context
- Pre-trained templates for common questions (offline mode)
- Seamless escalation to doctor

### 5. **Doctor Matching & Smart Booking**
- Real-time specialist availability
- Risk-based matching: high cardiac risk → cardiologist
- One-click appointment scheduling

### 6. **Patient Signup & Full Auth**
- Email verification & bcrypt-hashed passwords
- Granular patient health profiles (smoker status, family history)
- Session-based JWT tokens (1440-min expiry)

### 7. **Responsive UI/UX**
- Glass-morphism design + gradient accents
- Real-time form validation
- 30-day health trajectory charts (Recharts)

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+** (Google Vision requires 3.11+ after 2026)
- **Node.js 16+** (Vite frontend)
- **Optional:** Ollama (for health report generation)
- **Optional:** Google Vision API key (cloud OCR)

### 1. Setup & Install

```bash
# Clone/extract the project
cd efos

# Run one-click setup
./setup.bat   # Windows
# or manually:
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python train_models.py
cd ../frontend
npm install
```

### 2. Environment Configuration

Create `.env` in project root:
```bash
# Optional: Google Vision API key (cloud OCR fallback)
GOOGLE_VISION_API_KEY=your_key_here

# Optional: Ollama service URL
# OLLAMA_BASE=http://localhost:11434
# OLLAMA_MODEL=llama3.2
```

### 3. Start the App

```bash
# Windows: one-click launcher
./start.bat

# Or manually:
# Terminal 1: Backend
cd backend
python -m uvicorn backend.main:app --reload --port 8000

# Terminal 2: Frontend  
cd frontend
npm run dev   # Runs on http://localhost:5174
```

### 4. Access the App
- **Frontend:** http://localhost:5174
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### 5. Demo Login Credentials

**Patients:**
- Email: `arjun@demo.com` | Password: `password123`
- Email: `priya@demo.com` | Password: `password123`
- (More in login page → "Load demo accounts")

**Doctors:**
- Email: `doctor@demo.com` | Password: `doctor123`
- Email: `doctor2@demo.com` | Password: `doctor123`

---

## 📐 Architecture

### Backend (FastAPI)
```
backend/
├── main.py                 # FastAPI app, CORS, startup
├── database.py              # SQLAlchemy ORM + SQLite
├── ml_engine.py             # XGBoost models + SHAP
├── rules_engine.py          # Alert thresholds & todo generation
├── ollama_service.py        # Health report + chatbot LLM
├── train_models.py          # Model training script
├── schemas.py               # Pydantic request/response
├── routers/
│   ├── auth.py              # JWT login/register
│   ├── checkin.py           # /checkin/{patient_id} + /whatif
│   ├── chatbot.py           # /chat/{patient_id}
│   ├── dashboard.py         # /dashboard/patient/{id}
│   ├── ingest.py            # /ingest/report (OCR)
│   └── doctor.py            # /doctors/list, /doctors/book
└── saved_models/            # XGBoost .pkl files
```

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── App.tsx              # Router + auth guard
│   ├── main.tsx             # Axios config (baseURL)
│   ├── context/
│   │   └── AuthContext.tsx  # Global auth state + login
│   ├── pages/
│   │   ├── Login.tsx        # Email/password login
│   │   ├── Signup.tsx       # Patient profile + registration
│   │   ├── PatientDashboard.tsx       # 5 tabs: overview, report, chat, doctor, history
│   │   ├── DoctorDashboard.tsx        # Doctor triage queue
│   │   └── CheckIn.tsx      # Daily vitals form
│   └── components/
│       ├── RiskGauge.tsx            # Circular risk meter
│       ├── ChatBot.tsx              # LLM input/output
│       ├── DoctorBooking.tsx        # Select doctor + book
│       ├── LabReportUpload.tsx      # File upload + OCR parse
│       ├── TodoList.tsx             # AI-generated action items
│       └── HealthTrajectory.tsx     # 30-day risk trends
```

---

## 🔐 Security & Accuracy

### Authentication
- ✅ bcrypt password hashing (passlib)
- ✅ JWT tokens (HS256, 1440-min expiry)
- ✅ CORS locked to frontend domains
- ✅ Protected routes via useAuth guard

### ML Model Accuracy
- **Diabetes Risk:** 89% (on synthetic UCI dataset)
- **Cardiac Risk:** 87.67%
- **Hypertension Risk:** 92.67%
- **Metabolic Risk:** 89.5%

### Data Validation
- ✅ Pydantic schema validation (email, age, vitals ranges)
- ✅ SHAP-based feature importance ranked
- ✅ Edge cases: max BP 200 mmHg, min SpO2 80%
- ✅ Graceful fallbacks for missing data

### OCR Accuracy
- **Local:** Pytesseract accuracy depends on image quality
- **Cloud:** Google Vision 95%+ accuracy for lab reports
- **Regex fallback:** Extracts BP, glucose, SpO2 from any format

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` → JWT token
- `POST /api/auth/register` → Create patient account
- `GET /api/auth/demo-accounts` → List demo credentials

### Patient Vitals & Predictions
- `POST /api/checkin/{patient_id}` → Submit daily vitals → auto-generate risks, alerts, todos
- `POST /api/whatif` → "What-if" risk simulation  

### Health Analytics
- `GET /api/dashboard/patient/{patient_id}` → Full patient overview
- `GET /api/alerts` → Unread alert list
- `PUT /api/alerts/{id}/read` → Mark alert as read

### Doctor Coordination
- `GET /api/doctors/` → List all doctors (optionally filter by specialty)
- `POST /api/doctors/book` → Book appointment with doctor

### AI Services
- `POST /api/chat/{patient_id}` → Chat with health AI
- `POST /api/ingest/report` → Upload lab report, extract vitals

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI 0.104 + Uvicorn |
| **Database** | SQLite + SQLAlchemy ORM |
| **ML** | XGBoost 2.0 + SHAP 0.43 |
| **LLM** | Ollama (llama3.2) or templates |
| **OCR** | Pytesseract + Google Vision API |
| **Frontend** | React 18 + TypeScript + Vite |
| **Charts** | Recharts + custom gauges |
| **Auth** | JWT + bcrypt |
| **API Docs** | Swagger (FastAPI `/docs`) |

---

## 🔄 Deployment

### Local Development → Production Checklist

1. **Backend hardening:**
   ```python
   app.add_middleware(HTTPSRedirectMiddleware)  # Force HTTPS
   app.middleware("http")(validate_api_key)     # API key auth
   ```

2. **Frontend build:**
   ```bash
   cd frontend
   npm run build  # Creates dist/
   # Deploy dist/ to S3 + CloudFront or Netlify
   ```

3. **Database migration:**
   ```bash
   # Switch from SQLite to PostgreSQL
   DATABASE_URL=postgresql://user:pass@host/dbname
   ```

4. **SSL certificates:**
   - Use Let's Encrypt (free) for HTTPS
   - Update CORS origins to production domain

5. **Organ**

---

## 📝 Example Usage

### 1. Patient Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"arjun@demo.com","password":"password123","role":"patient"}'
# Returns: {access_token, token_type, user_id, name, role}
```

### 2. Daily Check-In
```bash
curl -X POST http://localhost:8000/api/checkin/1 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "bp_systolic":155, "bp_diastolic":95, "weight":82, 
    "mood":7, "sleep_hours":6.5, "spo2":97, 
    "heart_rate":85, "glucose":138
  }'
# Returns: {risks, alerts_generated, report, shap_values}
```

### 3. Lab Report OCR
```bash
curl -X POST http://localhost:8000/api/ingest/report \
  -H "Authorization: Bearer {token}" \
  -F "file=@lab_report.pdf"
# Returns: {text_excerpt, parsed: {bp_systolic, glucose, ...}, method}
```

### 4. Health Chat
```bash
curl -X POST http://localhost:8000/api/chat/1 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"patient_id":1,"message":"Why is my cardiac risk high?"}'
# Returns: contextual AI response
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'database'` | Backend must be run from project root: `python -m uvicorn backend.main:app` |
| Backend won't start on port 8000 | Check `lsof -i :8000` (macOS) or `netstat -ano \| findstr 8000` (Windows) |
| OCR failing: "pytesseract not found" | Install system Tesseract OR set `GOOGLE_VISION_API_KEY` for cloud fallback |
| `bcrypt` errors on login | Run `pip install bcrypt==4.0.1` in venv |
| Frontend can't reach backend | Verify `axios.defaults.baseURL = 'http://localhost:8000'` in `main.tsx` |
| Ollama health reports not generating | Start Ollama: `ollama serve` then `ollama pull llama3.2` |

---

## 🤝 Contributing

### Add a New Prediction Model
1. Create model in `backend/train_models.py`
2. Save as `.pkl` in `backend/saved_models/`
3. Register in `ml_engine.py`
4. Add SHAP explainer

### Add a New Vitals Input
1. Add field to `schemas.CheckInRequest`
2. Update `database.CheckIn` model
3. Add regex extraction in `routers/ingest.py`

---

## 📄 License

This project is provided as-is for educational and healthcare research purposes. Always comply with HIPAA, GDPR, and local data protection regulations when handling patient data.

---

## 💡 Future Enhancements

- [ ] Multi-language support (Hindi, Spanish)
- [ ] Wearable integration (Fitbit, Apple Watch APIs)
- [ ] Telehealth video calls (WebRTC)
- [ ] Prescription management + pharmacy integration
- [ ] Insurance claim automation
- [ ] Explainable AI reports for compliance (GDPR Article 22)
- [ ] Federated learning for privacy-preserving model training

---

## 🙋 Support

For issues or questions:
1. Check `/docs` (Swagger) for API specs
2. Review backend logs: `uvicorn main:app --log-level debug`
3. Inspect browser dev tools (Network tab) for frontend errors

---

**Built with ❤️ using FastAPI, React, XGBoost, and modern web standards.**
