@echo off
title HARMOS AI // Sovereign Verification Gateway
echo ===============================================================================
echo            HARMOS AI // AUTONOMOUS AGENT VERIFICATION GATEWAY
echo            USPTO Patent #63/915,788 -- Architect: Wali Ahmad
echo ===============================================================================
echo.
echo [1/2] Launching browser to http://127.0.0.1:8001/ ...
start http://127.0.0.1:8001/
echo.
echo [2/2] Starting Unified Gateway and Cockpit HUD on port 8001...
echo.
python -m uvicorn apps.gateway.main:app --host 127.0.0.1 --port 8001 --reload
pause
