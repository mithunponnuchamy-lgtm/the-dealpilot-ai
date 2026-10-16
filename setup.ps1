$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
py -3.12 -m venv backend/.venv
if ($LASTEXITCODE -ne 0) { throw 'Install Python 3.12 and run again.' }
& backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.lock.txt
if ($LASTEXITCODE -ne 0) { throw 'Python dependency installation failed.' }
& backend/.venv/Scripts/python.exe scripts/configure.py
Push-Location frontend
try {
  npm.cmd ci
  if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed. Check Node.js is installed.' }
} finally { Pop-Location }
Write-Host 'Setup complete. Open backend/.env locally, then run start.ps1.'
