@echo off
echo ============================================
echo   PrediHealth - One-Click Setup
echo ============================================
echo.

:: Backend setup
echo [1/4] Creating Python virtual environment...
cd /d "%~dp0backend"
python -m venv venv
call venv\Scripts\activate.bat

echo [2/4] Installing Python dependencies...
pip install -r requirements.txt

echo [3/4] Training ML models (XGBoost on synthetic data)...
python train_models.py

echo [4/4] Seeding database...
python -c "from database import Base, engine, SessionLocal, seed_database; Base.metadata.create_all(bind=engine); db=SessionLocal(); seed_database(db); db.close(); print('Done!')"

echo.
echo [Frontend] Installing npm packages...
cd /d "%~dp0frontend"
npm install

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo   Run start.bat to launch PrediHealth
echo.
pause
