@echo off
setlocal
cd /d "%~dp0"
set SUPABASE_URL=https://dzbxmrzomzbnkwgujmmm.supabase.co
set FLOW_BROWSER_HEADLESS=0
set FLOW_BROWSER_OFFSCREEN=1
npm run flow:worker
