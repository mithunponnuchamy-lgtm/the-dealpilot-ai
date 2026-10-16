$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Test-Path 'backend/.env')) { throw 'Run setup.ps1 first.' }
Start-Process -FilePath "$PSScriptRoot/backend/.venv/Scripts/python.exe" -ArgumentList '-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000' -WorkingDirectory "$PSScriptRoot/backend"
Start-Process -FilePath 'cmd.exe' -ArgumentList '/k','npm.cmd run dev' -WorkingDirectory "$PSScriptRoot/frontend"
Write-Host 'Backend: http://localhost:8000/docs'
Write-Host 'Website: http://localhost:3000 (allow time for startup)'
