@echo off
echo ===================================================
echo   Running GuardianPulse Automated Pytest Suite
echo ===================================================
cd /d "%~dp0\.."
backend\venv\Scripts\pytest.exe -o pythonpath=backend backend\tests
pause
