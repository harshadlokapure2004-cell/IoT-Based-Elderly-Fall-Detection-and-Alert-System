@echo off
echo ===================================================
echo   Starting GuardianPulse Backend Server (Flask)
echo ===================================================
cd /d "%~dp0\.."
call backend\venv\Scripts\activate.bat
set PYTHONPATH=backend
python backend\app\main.py
pause
