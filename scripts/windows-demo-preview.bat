@echo off
setlocal

cd /d "%~dp0.."

echo ==========================================
echo On Learning Searcher Demo Preview Launcher
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js가 설치되어 있지 않습니다.
  echo Node.js LTS를 설치한 뒤 다시 실행해 주세요.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm을 찾을 수 없습니다.
  echo Node.js 설치 상태를 확인해 주세요.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [1/3] 의존성을 설치합니다...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install 실패
    pause
    exit /b 1
  )
) else (
  echo [1/3] node_modules가 이미 존재합니다. 설치를 건너뜁니다.
)

echo [2/3] 시연용 빌드를 생성합니다...
call npm run build
if errorlevel 1 (
  echo [ERROR] npm run build 실패
  pause
  exit /b 1
)

echo [3/3] 시연 서버를 실행합니다...
echo 브라우저 접속 주소: http://127.0.0.1:5173
start "" "http://127.0.0.1:5173"
call npm run preview -- --host 0.0.0.0 --port 5173

endlocal
