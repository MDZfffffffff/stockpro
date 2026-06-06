@echo off
chcp 65001 >nul
title AS Delivery Server

echo.
echo  ╔══════════════════════════════════════╗
echo  ║        AS Delivery System            ║
echo  ║    AS Welding Supply Co., Ltd.       ║
echo  ╚══════════════════════════════════════╝
echo.

:: เปลี่ยนไปที่โฟลเดอร์โปรแกรม
cd /d "%~dp0"

:: ตรวจสอบว่ามี Node.js ไหม
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ข้อผิดพลาด] ไม่พบ Node.js
    echo  กรุณาติดตั้ง Node.js จาก https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: ตรวจสอบว่ามี node_modules ไหม
if not exist "node_modules" (
    echo  กำลังติดตั้ง dependencies ครั้งแรก...
    echo  (รอสักครู่ ใช้เวลาประมาณ 1-2 นาที)
    echo.
    npm install
    echo.
)

:: หา IP ของเครื่อง
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

echo  ═══════════════════════════════════════
echo  กำลังเริ่มต้นระบบ...
echo  ═══════════════════════════════════════
echo.
echo  เข้าใช้งานได้ที่:
echo.
echo    บนเครื่องนี้  :  http://localhost:3100
if defined LOCAL_IP (
    echo    มือถือ/อุปกรณ์อื่น:  http://%LOCAL_IP%:3100
)
echo.
echo  บัญชีผู้ใช้เริ่มต้น:
echo    Admin   : admin    / admin1234
echo    Driver  : driver01 / driver1234
echo.
echo  ═══════════════════════════════════════
echo  กด Ctrl+C เพื่อปิดระบบ
echo  ═══════════════════════════════════════
echo.

:: เปิด browser อัตโนมัติ (หน่วงเวลา 2 วิ ให้ server พร้อมก่อน)
start "" /b cmd /c "timeout /t 2 >nul && start http://localhost:3100"

:: เริ่ม server
node server/index.js

echo.
echo  ระบบหยุดทำงานแล้ว
pause
