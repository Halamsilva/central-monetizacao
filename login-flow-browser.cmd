@echo off
setlocal
cd /d "%~dp0"
set SUPABASE_URL=https://dzbxmrzomzbnkwgujmmm.supabase.co
set SUPABASE_ANON_KEY=sb_publishable_L24WUeagymV8ZST6w2NsXQ_v0dFpQKx
set FLOW_BROWSER_HEADLESS=0
set FLOW_BROWSER_OFFSCREEN=0
set FLOW_BROWSER_VISIBLE=1
npm run flow:login
