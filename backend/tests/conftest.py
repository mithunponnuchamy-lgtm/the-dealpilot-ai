import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, get_db
from app import config

@pytest.fixture
def client(tmp_path,monkeypatch):
    engine=create_engine('sqlite:///'+str(tmp_path/'test.db'),connect_args={'check_same_thread':False})
    Base.metadata.create_all(engine)
    factory=sessionmaker(engine,expire_on_commit=False)
    def db():
        with factory() as s: yield s
    monkeypatch.setattr(config,'WORKSPACE_TOKEN','owner-test-token-'+'x'*32)
    monkeypatch.setenv('PAYPAL_CLIENT_ID','test-only')
    monkeypatch.setenv('PAYPAL_CLIENT_SECRET','test-only')
    app.dependency_overrides[get_db]=db
    with TestClient(app) as c: yield c
    app.dependency_overrides.clear(); engine.dispose()
@pytest.fixture
def owner(): return {'Authorization':'Bearer owner-test-token-'+'x'*32}
@pytest.fixture
def flow(client,owner):
    r=client.post('/deals',headers=owner,json={'title':'Portfolio','client':'Client','freelancer':'Freelancer','asking_cents':30000,'minimum_cents':20000})
    assert r.status_code==201,r.text
    d=r.json()
    return '/deals/'+d['deal']['id'],{'Authorization':'Bearer '+d['client_token']}
