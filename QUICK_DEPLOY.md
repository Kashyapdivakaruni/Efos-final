# ⚡ FAST DEPLOYMENT - DO THIS NOW (15 MINUTES)

## Your GitHub Repo
https://github.com/Kashyapdivakaruni/Efos-final

---

## STEP 1: DEPLOY BACKEND (5 MIN) ✅

### Go to: https://render.com/

1. **Sign Up** → Use GitHub (link your account)
2. **Click "New +"** → Select **"Web Service"**
3. **Connect GitHub** → Select: `Efos-final`
4. **Configure:**
   - Name: `predihealth-backend`
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port 8000`
   - Plan: **Free**
5. **Click "Create Web Service"** → Takes 2-3 minutes to build
6. **Your Backend URL will appear** → Copy it (looks like: `https://predihealth-backend.onrender.com`)

---

## STEP 2: DEPLOY FRONTEND (5 MIN) ✅

### Go to: https://vercel.com/

1. **Sign Up** → Use GitHub
2. **Click "Add New..."** → Select **"Project"**
3. **Import from Git** → Select: `Efos-final`
4. **Configure:**
   - Framework: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `frontend/dist`
5. **Environment Variable:**
   - Key: `VITE_API_URL`
   - Value: `https://predihealth-backend.onrender.com` (paste your Render URL here)
6. **Click "Deploy"** → Takes 1-2 minutes
7. **Your Frontend URL will appear** → This is your final link!

---

## STEP 3: LINK THEM TOGETHER (2 MIN) ✅

**Go back to Render Dashboard:**

1. Select your `predihealth-backend` service
2. Go to **Environment** → Add Variable:
   - Key: `FRONTEND_URL`
   - Value: `https://your-frontend.vercel.app` (paste your Vercel URL)
3. Service auto-redeploys ✅

---

## 🎯 FINAL RESULT

| Component | URL |
|-----------|-----|
| **Frontend** | https://your-project.vercel.app |
| **Backend API** | https://predihealth-backend.onrender.com |

---

## ✅ TEST YOUR DEPLOYMENT

1. Open your Vercel URL in browser
2. You should see the login page
3. Login with: `demo@patient` / `password123`
4. Go to Patient Dashboard → Upload Lab Report
5. Should work end-to-end! ✅

---

## 🚨 IF UPLOAD FAILS

Check browser console (F12):
- Look for "Network" tab
- Check if `VITE_API_URL` is set correctly
- Verify backend URL is in CORS (should be automatic)

---

## 📝 THAT'S IT! 

No code changes needed. Just click buttons and paste URLs.

**Time: 15 minutes**
**Cost: FREE (Render free tier + Vercel free tier)**
