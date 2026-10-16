from fastapi import HTTPException
from app.services import paypal, ai
from app.schemas import Extraction
import pytest
TERMS={'deliverables':['Home','About','Contact'],'exclusions':['Hosting'],'amount_cents':25000,'currency':'USD','delivery_days':7,'revisions':1,'payment_terms':'Full payment upfront; work starts after payment.'}
def offer(client,path,headers,n=0,terms=None): return client.post(path+'/offers',headers=headers,json={'expected_version':n,'terms':terms or TERMS})
def approve(client,path,headers,n=1): return client.post(path+'/approve',headers=headers,json={'version':n})
def ready(client,flow,owner):
    path,buyer=flow
    assert offer(client,path,owner).status_code==201
    assert approve(client,path,owner).status_code==200
    assert approve(client,path,buyer).status_code==200
    return path,buyer

def test_create_list_and_privacy(client,flow,owner):
    path,buyer=flow
    assert len(client.get('/deals',headers=owner).json())==1
    private=client.get(path,headers=owner).json()
    public=client.get(path,headers=buyer).json()
    assert private['minimum_cents']==20000
    assert 'minimum_cents' not in public and 'client_hash' not in public
    assert client.get(path,headers={'Authorization':'Bearer stranger'}).status_code==404
    assert client.get(path).status_code==401
    assert client.post('/deals',headers=buyer,json={'title':'x','client':'x','freelancer':'x','asking_cents':1,'minimum_cents':0}).status_code==403

def test_invitation_rotation(client,flow,owner):
    path,buyer=flow
    r=client.post(path+'/invitation',headers=owner)
    assert r.status_code==200
    assert client.get(path,headers=buyer).status_code==404
    assert client.get(path,headers={'Authorization':'Bearer '+r.json()['client_token']}).status_code==200

@pytest.mark.parametrize('value',[0,-1,1.5,True])
def test_invalid_offer(client,flow,owner,value):
    assert offer(client,flow[0],owner,terms={**TERMS,'amount_cents':value}).status_code==422

def test_empty_requirements_and_invalid_asking(client,flow,owner):
    assert client.post(flow[0]+'/requirements',headers=owner,json={'text':'   '}).status_code==422
    assert client.post('/deals',headers=owner,json={'title':'x','client':'x','freelancer':'x','asking_cents':-1,'minimum_cents':0}).status_code==422

def test_new_version_invalidates_approvals(client,flow,owner):
    path,buyer=ready(client,flow,owner)
    r=offer(client,path,buyer,1,{**TERMS,'amount_cents':23000,'deliverables':['Home']})
    assert r.status_code==201
    assert r.json()['offers'][-1]['approvals']==[]
    assert r.json()['offers'][-1]['changes']['amount_cents']=={'before':25000,'after':23000}
    assert approve(client,path,owner,1).status_code==409
    assert client.post(path+'/checkout',headers=buyer,json={'version':2}).status_code==409
    assert offer(client,path,owner,1).status_code==409

def test_low_offer_and_rejection(client,flow,owner):
    path,buyer=flow
    assert offer(client,path,buyer,terms={**TERMS,'amount_cents':10000}).status_code==201
    assert approve(client,path,owner).status_code==409
    assert client.post(path+'/reject',headers=owner,json={'version':1}).status_code==200
    assert approve(client,path,buyer).status_code==409
    assert offer(client,path,owner,1).status_code==201

def test_approval_cannot_impersonate(client,flow,owner):
    path,buyer=flow; offer(client,path,owner)
    assert client.post(path+'/approve',headers=buyer,json={'version':1,'role':'freelancer'}).status_code==422
    approve(client,path,buyer); r=approve(client,path,buyer)
    assert r.json()['offers'][-1]['approvals']==['client']
    assert client.post(path+'/checkout',headers=buyer,json={'version':1}).status_code==409

def test_cancel_deal(client,flow,owner):
    path,buyer=flow
    assert client.post(path+'/cancel',headers=owner).json()['status']=='cancelled'
    assert offer(client,path,buyer).status_code==409

@pytest.fixture
def provider(monkeypatch):
    state={'create':0,'capture':0,'amount':'250.00','currency':'USD','status':'APPROVED','order':'ORDER-TEST','offer':None}
    def create(p,o):
        state['create']+=1;state['offer']=o.id
        assert o.terms['amount_cents']==25000
        return 'ORDER-TEST','https://www.sandbox.paypal.com/checkoutnow?token=ORDER-TEST'
    def get(id):
        unit={'reference_id':state['offer'],'amount':{'value':state['amount'],'currency_code':state['currency']}}
        if state['status']=='COMPLETED': unit['payments']={'captures':[{'id':'CAPTURE-TEST','status':'COMPLETED','amount':{'value':state['amount'],'currency_code':state['currency']}}]}
        return {'id':state['order'],'status':state['status'],'purchase_units':[unit]}
    def capture(p):
        state['capture']+=1;state['status']='COMPLETED';return get(p.order_id)
    monkeypatch.setattr(paypal,'create',create);monkeypatch.setattr(paypal,'get',get);monkeypatch.setattr(paypal,'capture',capture)
    return state

def checkout(client,path,buyer): return client.post(path+'/checkout',headers=buyer,json={'version':1})
def test_payment_verified_and_idempotent(client,flow,owner,provider):
    path,buyer=ready(client,flow,owner)
    assert client.post(path+'/checkout',headers=owner,json={'version':1}).status_code==403
    assert client.post(path+'/checkout',headers=buyer,json={'version':1,'amount_cents':1}).status_code==422
    assert checkout(client,path,buyer).status_code==200
    assert checkout(client,path,buyer).status_code==200
    assert provider['create']==1
    assert offer(client,path,owner,1).status_code==409
    assert client.get(path,headers=buyer).json()['status']=='payment pending'
    r=client.post(path+'/payment/verify',headers=buyer)
    assert r.status_code==200,r.text
    assert r.json()['status']=='paid' and r.json()['payment']['capture_id']=='CAPTURE-TEST'
    assert client.post(path+'/payment/verify',headers=buyer).json()['status']=='paid'
    assert provider['capture']==1

@pytest.mark.parametrize('field,value',[('amount','1.00'),('currency','EUR'),('order','WRONG')])
def test_capture_mismatch_not_paid(client,flow,owner,provider,field,value):
    path,buyer=ready(client,flow,owner);checkout(client,path,buyer);provider[field]=value
    assert client.post(path+'/payment/verify',headers=buyer).status_code==502
    assert client.get(path,headers=buyer).json()['status']!='paid'

def test_network_error_retry_same_order(client,flow,owner,provider,monkeypatch):
    path,buyer=ready(client,flow,owner);checkout(client,path,buyer)
    old=paypal.get
    def fail(_): raise HTTPException(502,'Network timeout')
    monkeypatch.setattr(paypal,'get',fail)
    assert client.post(path+'/payment/verify',headers=buyer).status_code==502
    assert client.get(path,headers=buyer).json()['payment']['order_id']=='ORDER-TEST'
    monkeypatch.setattr(paypal,'get',old)
    assert client.post(path+'/payment/verify',headers=buyer).json()['status']=='paid'

def test_reconcile_completed_after_restart(client,flow,owner,provider):
    path,buyer=ready(client,flow,owner);checkout(client,path,buyer)
    # Every HTTP request opens a new DB session. Simulate lost capture response.
    provider['status']='COMPLETED'
    assert client.post(path+'/payment/verify',headers=buyer).json()['status']=='paid'
    assert provider['capture']==0

def test_cancel_does_not_fake_payment_or_duplicate(client,flow,owner,provider):
    path,buyer=ready(client,flow,owner);checkout(client,path,buyer)
    provider['status']='PAYER_ACTION_REQUIRED'
    assert client.post(path+'/payment/cancel',headers=buyer).json()['payment']['status']=='cancelled'
    checkout(client,path,buyer)
    assert provider['create']==1
    provider['status']='COMPLETED'
    assert client.post(path+'/payment/cancel',headers=buyer).json()['status']=='paid'

def test_ai_missing_key_and_private_context(client,flow,owner,monkeypatch):
    path,buyer=flow
    monkeypatch.delenv('GEMINI_API_KEY',raising=False)
    monkeypatch.delenv('OPENAI_API_KEY',raising=False)
    client.post(path+'/requirements',headers=buyer,json={'text':'A website for $300'})
    assert client.post(path+'/extract',headers=buyer).status_code==503
    contexts=[]
    monkeypatch.setattr(ai,'suggest',lambda context:contexts.append(context) or {'recommendation':'Review scope','tradeoffs':[],'questions':[]})
    assert client.post(path+'/suggest',headers=owner).status_code==200
    assert 'minimum' not in contexts[0] and 'client_hash' not in contexts[0]

def test_invalid_ai_json(monkeypatch):
    import httpx
    monkeypatch.setenv('OPENAI_API_KEY','test-only')
    class FakeClient:
        def __init__(self,**kw):pass
        def __enter__(self):return self
        def __exit__(self,*args):pass
        def post(self,*args,**kwargs):return httpx.Response(200,json={'choices':[{'message':{'content':'{"unexpected":true}'}}]},request=httpx.Request('POST','https://api.openai.com'))
    monkeypatch.setattr(ai.httpx,'Client',FakeClient)
    with pytest.raises(HTTPException) as e:ai.extract('A website')
    assert e.value.status_code==502

def test_concurrent_checkout_uses_one_order(client,flow,owner,provider):
    from concurrent.futures import ThreadPoolExecutor
    path,buyer=ready(client,flow,owner)
    with ThreadPoolExecutor(max_workers=4) as pool:
        results=list(pool.map(lambda _:checkout(client,path,buyer),range(4)))
    assert [r.status_code for r in results]==[200]*4
    assert provider['create']==1

def test_ai_rate_limit(client,flow,owner,monkeypatch):
    path,_=flow
    monkeypatch.setattr(ai,'suggest',lambda text:{'recommendation':'Review','tradeoffs':[],'questions':[]})
    for _ in range(20): assert client.post(path+'/suggest',headers=owner).status_code==200
    assert client.post(path+'/suggest',headers=owner).status_code==429

def test_creation_timeout_preserves_retry_key(client,flow,owner,provider,monkeypatch):
    path,buyer=ready(client,flow,owner)
    original=paypal.create;keys=[]
    def uncertain(p,o):keys.append(p.id);raise HTTPException(502,'Timeout')
    monkeypatch.setattr(paypal,'create',uncertain)
    assert checkout(client,path,buyer).status_code==502
    assert client.get(path,headers=buyer).json()['frozen'] is True
    def recover(p,o):keys.append(p.id);return original(p,o)
    monkeypatch.setattr(paypal,'create',recover)
    assert checkout(client,path,buyer).status_code==200
    assert len(keys)==2 and keys[0]==keys[1]

def test_simulate_payment(client,flow,owner):
    path,buyer=ready(client,flow,owner)
    # Freelancer cannot simulate client payment
    assert client.post(path+'/simulate-payment',headers=owner,json={'version':1}).status_code==403
    # Client simulation succeeds and marks deal paid
    res=client.post(path+'/simulate-payment',headers=buyer,json={'version':1})
    assert res.status_code==200
    data=res.json()
    assert data['status']=='paid'
    assert data['payment']['status']=='paid'
    assert data['payment']['order_id'].startswith('SANDBOX-SIM-')
    assert data['payment']['capture_id'].startswith('CAPTURE-SIM-')
    assert data['frozen'] is True
