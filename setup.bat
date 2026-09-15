@echo off
echo ===================================================
echo MOIL AI Command Center - Setup Script
echo ===================================================

echo.
echo [1/3] Setting up Backend Virtual Environment...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
echo Upgrading pip and installing backend dependencies strictly in venv...
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m pip install torch --extra-index-url https://download.pytorch.org/whl/cpu

echo.
echo [2/3] Compiling Nationwide Manganese ^& Space Telemetry Data...
.\venv\Scripts\python.exe download_data.py
cd ..

echo.
echo [3/3] Setting up Frontend Application...
cd frontend
echo Installing frontend dependencies...
call npm install
cd ..

echo.
echo ===================================================
echo Setup Complete! You can now launch using start.bat
echo ===================================================
pause
