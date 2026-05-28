@echo off
setlocal
cd /d "%~dp0"
set FLOW_BROWSER_HEADLESS=0
set FLOW_BROWSER_OFFSCREEN=0
npm run flow:login
