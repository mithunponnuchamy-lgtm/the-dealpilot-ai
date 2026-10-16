"""Create local configuration without displaying credentials or overwriting files."""
from pathlib import Path
import secrets
root=Path(__file__).resolve().parents[1]
backend=root/'backend'/'.env'
if not backend.exists():
    template=(root/'backend'/'.env.example').read_text()
    template=template.replace('WORKSPACE_TOKEN=\n','WORKSPACE_TOKEN='+secrets.token_urlsafe(36)+'\n')
    backend.write_text(template)
    backend.chmod(0o600)
    print('Created backend/.env. Open it locally to find your freelancer token and configure API keys.')
else: print('Preserved existing backend/.env.')
frontend=root/'frontend'/'.env.local'
if not frontend.exists(): frontend.write_text((root/'frontend'/'.env.example').read_text())
print('Configuration ready. Do not commit or share .env files.')
