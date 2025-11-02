@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo 正在启动轩慧工作台Web服务器...
echo.
node server.js
pause

