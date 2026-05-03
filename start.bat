@echo off
echo ============================================
echo   PrediHealth - Starting Servers
echo ============================================
echo.
echo Backend  -> http://localhost:8000
echo Frontend -> http://localhost:5173
echo API Docs -> http://localhost:8000/docs
echo.

:: Start backend
start "PrediHealth Backend" cmd /k "cd /d ""%~dp0backend"" && venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"

:: Wait 3 seconds for backend to start
timeout /t 3 /nobreak > nul

:: Start frontend
start "PrediHealth Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo Both servers started!
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak > nul
start http://localhost:5173

echo Press any key to close this window (servers keep running)
pause > nul
