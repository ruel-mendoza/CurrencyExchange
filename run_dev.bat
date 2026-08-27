@echo off
echo ========================================================
echo Starting Currency Converter (FastAPI Backend + Vite Frontend)
echo ========================================================

start "FastAPI Backend (Port 8000)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
start "Vite Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers have been launched in separate terminal windows:
echo - Backend API: http://localhost:8000 (Swagger docs at http://localhost:8000/docs)
echo - Frontend UI:  http://localhost:5173
echo.
pause

