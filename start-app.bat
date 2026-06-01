@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "LOG_DIR=%PROJECT_DIR%.codex-logs"
set "FRONTEND_LOG=%LOG_DIR%\frontend-dev.out.log"
set "FRONTEND_ERR_LOG=%LOG_DIR%\frontend-dev.err.log"
set "BACKEND_LOG=%LOG_DIR%\backend-dev.out.log"
set "BACKEND_ERR_LOG=%LOG_DIR%\backend-dev.err.log"

if not exist "%PROJECT_DIR%package.json" (
  echo Could not find package.json in "%PROJECT_DIR%".
  pause
  exit /b 1
)

if not exist "%LOG_DIR%" (
  mkdir "%LOG_DIR%"
)

echo Starting Programmer Typing App...
echo Logs:
echo   Frontend: "%FRONTEND_LOG%"
echo   Backend:  "%BACKEND_LOG%"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process -FilePath 'npm.cmd' -WorkingDirectory '%PROJECT_DIR%' -ArgumentList 'run','dev','--','--host','127.0.0.1','--port','5175' -RedirectStandardOutput '%FRONTEND_LOG%' -RedirectStandardError '%FRONTEND_ERR_LOG%' -WindowStyle Hidden"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process -FilePath 'npm.cmd' -WorkingDirectory '%PROJECT_DIR%' -ArgumentList 'run','dev:server' -RedirectStandardOutput '%BACKEND_LOG%' -RedirectStandardError '%BACKEND_ERR_LOG%' -WindowStyle Hidden"

timeout /t 5 /nobreak >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process 'http://127.0.0.1:5175'"

echo Browser launch requested. If the page does not load, check the log files above.
endlocal
