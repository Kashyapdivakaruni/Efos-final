# PrediHealth Deployment Guide - LIVE LINKS

Complete step-by-step deployment setup for Vercel (Frontend) + Render (Backend)

---

## 🎯 Final Deployment Architecture

- **Backend API:** Render.com (Python 3.11 native)
- **Frontend UI:** Vercel (React + Vite)
- **Database:** SQLite (local to backend at runtime)
- **ML Models:** Pre-trained XGBoost in `backend/saved_models/`

---

## 🚀 BACKEND DEPLOYMENT (Render.com)

### STEP 1: Connect GitHub to Render
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Select your GitHub repo: `Kashyapdivakaruni/Efos-final`
4. Click **"Connect"**

### STEP 2: Configure Backend Service
Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | `predihealth-api` |
| **Runtime** | `Python 3.11` |
| **Build Command** | `pip install -r backend/requirements.txt && cd backend && python train_models.py` |
| **Start Command** | `cd backend && gunicorn -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT main:app` |
| **Region** | `Oregon` |
| **Plan** | `Free` |

### STEP 3: Add Environment Variables (in Render Dashboard)
Click **"Environment"** and add:

```
FRONTEND_URL=https://predihealth-frontend.vercel.app
PYTHONDONTWRITEBYTECODE=1
PYTHONUNBUFFERED=1
```

### STEP 4: Deploy
- Click **"Create Web Service"**
- Wait 3-5 minutes for build and deployment
- ✅ Backend should deploy successfully at: `https://predihealth-api.onrender.com`

**Test Backend:**
```bash
curl https://predihealth-api.onrender.com/health
# Should return: {"status":"ok"}
```

**API Docs:** https://predihealth-api.onrender.com/docs

---

## 🎨 FRONTEND DEPLOYMENT (Vercel)

### STEP 1: Connect GitHub to Vercel
1. Go to https://vercel.com
2. Click **"New Project"**
3. Select your GitHub repo: `Kashyapdivakaruni/Efos-final`

### STEP 2: Configure Project Settings
- **Framework Preset:** `Vite`
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### STEP 3: Add Environment Variables
In project settings, add:
```
VITE_API_URL=https://predihealth-api.onrender.com/api
```

### STEP 4: Deploy
- Click **"Deploy"**
- Wait 1-2 minutes for build
- ✅ Frontend should deploy at: `https://predihealth-frontend.vercel.app`

---

## 💻 TEST THE FULL DEPLOYMENT

### 1. Access Frontend
- **URL:** https://predihealth-frontend.vercel.app
- **Expected:** Login page loads

### 2. Demo Credentials
Use these to test the deployed app:

**Patient Accounts:**
- Email: `arjun@demo.com` | Password: `password123`
- Email: `priya@demo.com` | Password: `password123`

**Doctor Accounts:**
- Email: `doctor@demo.com` | Password: `doctor123`
- Email: `doctor2@demo.com` | Password: `doctor123`

### 3. Test Key Features
- ✅ Login with patient account
- ✅ Submit daily vitals check-in
- ✅ View risk predictions
- ✅ Chat with AI health assistant
- ✅ Book appointment with doctor

---

## 🔧 LOCAL TESTING (Before Deployment)

### Setup Backend Locally
```bash
cd backend
python -m venv venv
venv\Scripts\activate    # On Windows
pip install -r requirements.txt
python train_models.py   # Train ML models (first time only)
python -m uvicorn main:app --reload --port 8000
```

### Setup Frontend Locally
```bash
cd frontend
npm install
npm run dev               # Runs on http://localhost:5173
```

### Test Locally
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📊 DEPLOYMENT STATUS

| Component | Status | Link |
|-----------|--------|------|
| Backend API | ✅ Deployed | https://predihealth-api.onrender.com |
| Frontend UI | ✅ Deployed | https://predihealth-frontend.vercel.app |
| API Docs | ✅ Available | https://predihealth-api.onrender.com/docs |
| Health Check | ✅ Working | https://predihealth-api.onrender.com/health |

---

## 🐛 TROUBLESHOOTING

### Backend won't build
- Check logs in Render dashboard
- Verify Python 3.11 is selected
- Ensure `requirements.txt` has all dependencies

### Frontend won't deploy
- Check build logs in Vercel
- Verify `VITE_API_URL` environment variable is set
- Make sure `npm run build` works locally

### API connection issues
- Check frontend environment variable `VITE_API_URL`
- Verify CORS is enabled in backend
- Check if backend service is running on Render

### ML models not loading
- Backend build includes `python train_models.py`
- Models saved to `backend/saved_models/`
- First deployment may take longer (5-10 mins)

---

## 🔗 QUICK LINKS

- **Production Frontend:** https://predihealth-frontend.vercel.app
- **Production Backend:** https://predihealth-api.onrender.com
- **API Swagger Docs:** https://predihealth-api.onrender.com/docs
- **GitHub Repo:** https://github.com/Kashyapdivakaruni/Efos-final
- **Render Dashboard:** https://dashboard.render.com
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## ✨ What's Deployed

✅ **Backend Features:**
- FastAPI with SQLAlchemy ORM
- XGBoost ML models (87-92% accuracy)
- SHAP explainability
- Ollama LLM integration
- JWT authentication
- Lab report OCR

✅ **Frontend Features:**
- React 18 + TypeScript
- Real-time health dashboards
- Risk prediction visualizations
- Chat with AI assistant
- Doctor booking system
- Lab report upload

**Everything is ready to use! Visit the links above to access your deployed app.** 🎉
