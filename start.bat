@echo off
echo ================================================
echo   Drone RL Simulator - Starting All Services
echo ================================================
echo.

REM Kill any existing processes on ports 5000 and 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing existing process on port 5000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

echo [1/2] Starting Python Backend (Flask API on port 5000)...
start "Drone RL Backend" cmd /c "cd /d %~dp0 && python python_code\api.py"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo [2/2] Starting React Frontend (Vite on port 3000)...
start "Drone RL Frontend" cmd /c "cd /d %~dp0 && npm run dev"

echo.
echo ================================================
echo   Both services started!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo ================================================
echo.
echo Press any key to open the app in your browser...
pause >nul
start http://localhost:3000
