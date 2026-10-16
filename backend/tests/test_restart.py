"""Separate Python processes verify file-database persistence."""
import os, subprocess, sys
from pathlib import Path

def test_restart_persists_deals(tmp_path):
    env={**os.environ,'DATABASE_URL':'sqlite:///'+str(tmp_path/'restart.db'),'WORKSPACE_TOKEN':'restart-test-'+'x'*40}
    root=Path(__file__).resolve().parents[1]
    create="""from fastapi.testclient import TestClient
from app.main import app
import os
with TestClient(app) as c:
 r=c.post('/deals',headers={'Authorization':'Bearer '+os.environ['WORKSPACE_TOKEN']},json={'title':'Survives restart','client':'C','freelancer':'F','asking_cents':30000,'minimum_cents':20000})
 assert r.status_code==201,r.text
"""
    read="""from fastapi.testclient import TestClient
from app.main import app
import os
with TestClient(app) as c:
 r=c.get('/deals',headers={'Authorization':'Bearer '+os.environ['WORKSPACE_TOKEN']})
 assert r.json()[0]['title']=='Survives restart',r.text
"""
    for script in (create,read):
        result=subprocess.run([sys.executable,'-c',script],cwd=root,env=env,capture_output=True,text=True)
        assert result.returncode==0,result.stderr
