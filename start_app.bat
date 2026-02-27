@echo off
echo Starting Space2Thread...

:: Start Backend in a new window with persistence
start "Space2Thread Backend" cmd /k "python -m uvicorn backend.main:app --reload && pause"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

:: Start Frontend in a new window with persistence
cd frontend
start "Space2Thread Frontend" cmd /k "npm run dev && pause"

:: Open Browser
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo App started! 
echo If the Black Windows close immediately, there is an error inside them.
echo.
pause
