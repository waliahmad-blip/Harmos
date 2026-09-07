# Harmos AI Launch Script
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "           HARMOS AI // AUTONOMOUS AGENT VERIFICATION GATEWAY" -ForegroundColor Cyan
Write-Host "           USPTO Patent #63/915,788 -- Architect: Wali Ahmad" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1/2] Opening browser to http://127.0.0.1:8000/ ..." -ForegroundColor Green
Start-Process "http://127.0.0.1:8000/"
Write-Host ""
Write-Host "[2/2] Starting Unified Gateway and Cockpit HUD on port 8000..." -ForegroundColor Yellow
Write-Host ""
python -m uvicorn apps.gateway.main:app --host 127.0.0.1 --port 8000 --reload
