@echo off
echo ===================================================
echo MOIL AI Command Center - Start Script
echo ===================================================

echo.
echo Compiling latest synthetic telemetry and weather zones...
cd backend
.\venv\Scripts\python.exe download_data.py

echo.
echo Starting Backend Server on port 8000 (FastAPI + FLAN-T5)...
start "MOIL Backend (FastAPI)" cmd /k ".\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"
cd ..

echo.
echo Starting Frontend Server on port 3000 (Next.js Dashboard)...
cd frontend
start "MOIL Frontend (Next.js)" cmd /k "npm run dev"
cd ..

echo.
echo Waiting for servers to initialize...
timeout /t 6 /nobreak > nul

echo.
echo Opening Dashboard in your default web browser...
start http://localhost:3000

echo.
echo ===================================================
echo Servers are running in separate terminal windows.
echo Close both windows to stop the servers.
echo ===================================================
pause
