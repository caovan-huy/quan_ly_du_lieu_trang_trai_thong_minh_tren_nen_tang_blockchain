@echo off
title VAC SmartFarm System
echo ===================================================
echo   KHOI DONG HE THONG VAC SMARTFARM
echo ===================================================
echo.

:: 1. Chay Backend Node.js
echo [1/2] Dang khoi dong Backend Node.js tai port 3000...
start "VAC SmartFarm Backend" cmd /c "cd /d "%~dp0chatbot_backend" && npm start"

:: Cho backend 2 giay de khoi dong
timeout /t 2 /nobreak > nul

:: 2. Mo Frontend tren trinh duyet
echo [2/2] Dang mo giao dien nguoi dung (Frontend)...
start "" "%~dp0frontend\index.html"

echo.
echo ===================================================
echo   HE THONG DA SANG SANG!
echo   - Backend Node.js dang chay o cua so dong lenh moi.
echo   - Frontend da duoc mo tren trinh duyet cua ban.
echo   - Muon dung backend, hay dong cua so dong lenh do.
echo ===================================================
pause
