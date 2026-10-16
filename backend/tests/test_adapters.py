from types import SimpleNamespace
import httpx, json, pytest
from fastapi import HTTPException
from app.services import paypal, ai

def test_paypal_http_adapter_and_idempotency(monkeypatch):
    monkeypatch.setenv('PAYPAL_CLIENT_ID','test-only');monkeypatch.setenv('PAYPAL_CLIENT_SECRET','test-only')
    calls=[]
    def handler(request):
        calls.append(request)
        if request.url.path=='/v1/oauth2/token': return httpx.Response(200,json={'access_token':'test-access'})
        return httpx.Response(200,json={'id':'TEST-ORDER','links':[{'rel':'payer-action','href':'https://www.sandbox.paypal.com/checkoutnow?token=TEST-ORDER'}]})
    original=httpx.Client
    monkeypatch.setattr(paypal.httpx,'Client',lambda **kw:original(transport=httpx.MockTransport(handler),**kw))
    p=SimpleNamespace(id='persistent-key',deal_id='deal')
    o=SimpleNamespace(id='offer-id',terms={'amount_cents':25000,'currency':'USD'})
    assert paypal.create(p,o)[0]=='TEST-ORDER'
    req=calls[-1]
    assert str(req.url)=='https://api-m.sandbox.paypal.com/v2/checkout/orders'
    assert req.headers['PayPal-Request-Id']=='create-persistent-key'
    payload=json.loads(req.content)
    assert payload['purchase_units'][0]['amount']=={'currency_code':'USD','value':'250.00'}
    assert payload['purchase_units'][0]['reference_id']=='offer-id'
    p.order_id='TEST-ORDER';paypal.capture(p)
    assert calls[-1].headers['PayPal-Request-Id']=='capture-persistent-key'
    assert calls[-1].url.path=='/v2/checkout/orders/TEST-ORDER/capture'

@pytest.mark.parametrize('url',['https://evil.example/checkout','http://www.sandbox.paypal.com/checkout','https://www.paypal.com/checkout'])
def test_checkout_redirect_allowlist(monkeypatch,url):
    monkeypatch.setattr(paypal,'request',lambda *a,**k:{'id':'ORDER','links':[{'rel':'payer-action','href':url}]})
    with pytest.raises(HTTPException):paypal.create(SimpleNamespace(id='p',deal_id='d'),SimpleNamespace(id='o',terms={'amount_cents':100,'currency':'USD'}))

def test_ai_validated_schema(monkeypatch):
    monkeypatch.delenv('GEMINI_API_KEY', raising=False)
    monkeypatch.setenv('OPENAI_API_KEY','test-only')
    result={'title':'Portfolio','description':'A portfolio','deliverables':['Home'],'budget_usd':300,'deadline':None,'requirements':[],'missing_information':['How many revisions?'],'assumptions':[]}
    def handler(request):
        payload=json.loads(request.content)
        assert payload['response_format']['json_schema']['strict'] is True
        assert payload['response_format']['json_schema']['schema']['additionalProperties'] is False
        return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps(result)}}]})
    original=httpx.Client
    monkeypatch.setattr(ai.httpx,'Client',lambda **kw:original(transport=httpx.MockTransport(handler),**kw))
    assert ai.extract('A portfolio for $300')['budget_usd']==300

def test_gemini_validated_schema(monkeypatch):
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)
    monkeypatch.setenv('GEMINI_API_KEY', 'test-only')
    result={'title':'Portfolio','description':'A portfolio','deliverables':['Home'],'budget_usd':300,'deadline':None,'requirements':[],'missing_information':['How many revisions?'],'assumptions':[]}
    def handler(request):
        payload=json.loads(request.content)
        assert payload['generationConfig']['responseMimeType'] == 'application/json'
        assert 'additionalProperties' not in payload['generationConfig']['responseSchema']
        return httpx.Response(200,json={'candidates':[{'content':{'parts':[{'text':json.dumps(result)}]}}]})
    original=httpx.Client
    monkeypatch.setattr(ai.httpx,'Client',lambda **kw:original(transport=httpx.MockTransport(handler),**kw))
    assert ai.extract('A portfolio for $300')['budget_usd']==300
