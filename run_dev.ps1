# Launch script for PowerShell
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting Currency Converter (FastAPI + Vite React TS)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; npm run dev"

Write-Host "`nBoth servers have been launched in separate terminal windows:" -ForegroundColor Green
Write-Host "- Backend API: http://localhost:8000 (Swagger docs at http://localhost:8000/docs)" -ForegroundColor Yellow
Write-Host "- Frontend UI:  http://localhost:5173" -ForegroundColor Yellow

