# ERP Billing System - Quick Start Script (Windows PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ERP Billing System - Setup & Launch   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$backendEnv = "backend\.env"
if (-not (Test-Path $backendEnv)) {
    Write-Host "`n[1/4] Creating backend .env from example..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" $backendEnv
    Write-Host "      Created backend\.env - add your MongoDB Atlas URI before starting" -ForegroundColor Green
}

Write-Host "`n[2/4] Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
Set-Location ..

Write-Host "`n[3/4] Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

Write-Host "`n[4/4] Seeding database with demo data..." -ForegroundColor Yellow
Set-Location backend
node src/seed/index.js
Set-Location ..

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Setup complete! Starting servers...   " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`n  Backend API : http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Frontend    : http://localhost:5173" -ForegroundColor Cyan
Write-Host "`n  Login: admin@erp.com / admin123" -ForegroundColor Yellow
Write-Host "  Login: staff@erp.com / staff123`n" -ForegroundColor Yellow

# Start both servers
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -PassThru
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -PassThru

Write-Host "Two terminal windows opened. Press Ctrl+C in each to stop." -ForegroundColor Gray
