"""Isolated server for local browser tests. Never uses real provider credentials."""
import os
import sys
import tempfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
with tempfile.TemporaryDirectory(prefix='dealpilot-e2e-') as folder:
    os.environ.update(DATABASE_URL='sqlite:///'+str(Path(folder)/'e2e.db'),WORKSPACE_TOKEN='e2e-only-not-a-real-token-'+'x'*32,FRONTEND_URL='http://localhost:3000',OPENAI_API_KEY='',PAYPAL_CLIENT_ID='',PAYPAL_CLIENT_SECRET='')
    import uvicorn
    uvicorn.run('app.main:app',host='127.0.0.1',port=8000)
