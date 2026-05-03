# PrediHealth Deployment Guide

## Overview
This is a full-stack application with:
- **Frontend**: React + TypeScript (Deploy to Vercel/Netlify)
- **Backend**: FastAPI + Uvicorn (Deploy to Railway/Render/Heroku)
- **Database**: SQLite (local) or PostgreSQL (production)

## Recommended Deployment Stack

### Option 1: Recommended (Free + Pro Tier)
- **Backend**: [Railway](https://railway.app) (Python support, $5/month)
- **Frontend**: [Vercel](https://vercel.com) (Free tier)
- **Database**: Railway PostgreSQL add-on

### Option 2: Alternative
- **Backend**: [Render](https://render.com) (Free tier with limitations)
- **Frontend**: [Netlify](https://netlify.com) (Free tier)

### Option 3: Docker-based (Most Scalable)
- **Backend**: AWS, DigitalOcean, Google Cloud Run (Docker container)
- **Frontend**: Vercel or any CDN

---

## Quick Deployment Steps

### 1. Backend Deployment on Railway

**Step 1: Create Railway Account**
- Go to https://railway.app
- Sign up with GitHub account
- Link your GitHubrepository

**Step 2: Create New Project**
```
Railway Dashboard → New Project → GitHub Repo
Select: efos-final repository
```

**Step 3: Configure Environment**
Railway will auto-detect Python from `requirements.txt`

**Step 4: Set Environment Variables**
```
SECRET_KEY=your_secret_key_generate_with_openssl_rand_hex_32
DATABASE_URL=postgresql://user:pass@host/dbname (if using PostgreSQL)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
OLLAMA_BASE_URL=http://localhost:11434 (or your Ollama server URL)
```

**Step 5: Deploy**
- Railway auto-deploys on git push
- Your backend URL: `https://your-project.up.railway.app`

---

### 2. Frontend Deployment on Vercel

**Step 1: Create Vercel Account**
- Go to https://vercel.com
- Sign up with GitHub

**Step 2: Import Project**
```
Vercel Dashboard → Import Project → Select GitHub Repo (efos-final)
```

**Step 3: Configure Build Settings**
```
Framework: Vite
Build Command: cd frontend && npm run build
Output Directory: frontend/dist
Root Directory: ./
```

**Step 4: Set Environment Variables**
```
VITE_API_URL=https://your-backend-url.up.railway.app
```

**Step 5: Deploy**
- Vercel auto-deploys on git push
- Your frontend URL: `https://your-project.vercel.app`

---

### 3. Update Frontend API Configuration

**Edit `frontend/src/context/AuthContext.tsx`** (Change backend URL):
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

**Edit `frontend/src/components/LabReportUpload.tsx`** (Change backend URL):
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const response = await axios.post(`${API_URL}/api/ingest/report?patient_id=${user.id}`, ...);
```

**Edit `frontend/vite.config.ts`** (Add environment support):
```typescript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
  }
})
```

---

### 4. Backend URL Configuration

**Edit `backend/main.py`** (Allow production domains):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174", 
        "https://your-frontend.vercel.app",  # Add your Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Or use environment variable:**
```python
import os
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:*"],
    ...
)
```

---

## Production Checklist

- [ ] Generate new SECRET_KEY for production
- [ ] Set DATABASE_URL to PostgreSQL (don't use SQLite in production)
- [ ] Update CORS origins to production domain
- [ ] Enable HTTPS (automatic on Railway/Vercel)
- [ ] Set up environment variables in Railway dashboard
- [ ] Test API connectivity from frontend
- [ ] Configure backup strategy for database
- [ ] Set up error monitoring (Sentry)
- [ ] Enable rate limiting for API
- [ ] Test OCR service availability
- [ ] Verify Ollama deployment (if using)

---

## Testing Production Deployment

**Test backend connectivity:**
```bash
curl https://your-backend.up.railway.app/api/docs
```

**Test frontend:**
```bash
Open https://your-frontend.vercel.app
Try login with demo@patient (password: password123)
Upload a lab report
```

---

## Troubleshooting

### Backend won't deploy
- Check Python version: 3.11+ required
- Verify `requirements.txt` is at project root or backend folder
- Check build logs in Railway dashboard

### Frontend shows blank page
- Check browser console for CORS errors
- Verify VITE_API_URL environment variable is set
- Ensure backend URL is accessible

### OCR not working in production
- pytesseract needs tesseract-ocr system library
- Use Docker deployment OR install on Railway via buildpacks
- Fallback to Google Cloud Vision API (recommended)

### Database connection errors
- Use PostgreSQL instead of SQLite for production
- Ensure DATABASE_URL is set correctly
- Run migrations if needed

---

## Advanced: Docker Deployment

### Push to Docker Hub
```bash
docker build -t your-username/predihealth-backend:latest .
docker push your-username/predihealth-backend:latest
```

### Deploy on Google Cloud Run
```bash
gcloud run deploy predihealth-backend \
  --image your-username/predihealth-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Support
For issues, check logs in:
- Railway: Project → Deployments → View Logs
- Vercel: Deployments → Function Logs
