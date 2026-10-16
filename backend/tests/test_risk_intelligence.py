import json
import httpx
import pytest
from app.services import integrity, ai

def test_detect_pricing_imbalance_and_scope_creep():
    prev = {
        'amount_cents': 100000,
        'delivery_days': 14,
        'revisions': 2,
        'deliverables': ['Page 1', 'Page 2', 'Page 3', 'Page 4', 'Page 5'],
        'exclusions': ['Hosting and domain fees']
    }
    # Client counteroffer: price drops to $700, deliverables double to 10 pages, timeline cut to 7 days, revisions to 4
    curr = {
        'amount_cents': 70000,
        'delivery_days': 7,
        'revisions': 4,
        'deliverables': [f'Page {i}' for i in range(1, 11)],
        'exclusions': ['Hosting and domain fees']
    }
    risks = integrity.evaluate_proposal_risks(prev, curr)
    categories = [r['category'] for r in risks]
    severities = {r['category']: r['severity'] for r in risks}

    assert 'pricing_imbalance' in categories
    assert severities['pricing_imbalance'] == 'high'
    assert 'timeline_pressure' in categories
    assert severities['timeline_pressure'] == 'high'
    assert 'revision_risk' in categories

def test_generate_3_tier_counteroffers():
    prev = {
        'amount_cents': 100000,
        'delivery_days': 14,
        'revisions': 2,
        'deliverables': ['Page 1', 'Page 2', 'Page 3', 'Page 4', 'Page 5'],
        'exclusions': ['Hosting']
    }
    curr = {
        'amount_cents': 70000,
        'delivery_days': 7,
        'revisions': 4,
        'deliverables': [f'Page {i}' for i in range(1, 11)],
        'exclusions': ['Hosting']
    }
    options = integrity.generate_compromise_options(prev, curr)
    assert len(options) == 3

    strategies = [o['strategy'] for o in options]
    assert 'maintain_scope' in strategies
    assert 'maintain_budget' in strategies
    assert 'balanced_compromise' in strategies

    # Option A (Maintain Scope) should adjust price and delivery days upwards
    opt_a = next(o for o in options if o['strategy'] == 'maintain_scope')
    assert opt_a['amount_cents'] >= 100000
    assert opt_a['delivery_days'] >= 14
    assert len(opt_a['deliverables']) == 10

    # Option B (Maintain Budget) should keep $700 budget but reduce deliverables
    opt_b = next(o for o in options if o['strategy'] == 'maintain_budget')
    assert opt_b['amount_cents'] == 70000
    assert len(opt_b['deliverables']) < 10

    # Option C (Balanced Compromise) should be in the middle
    opt_c = next(o for o in options if o['strategy'] == 'balanced_compromise')
    assert opt_c['amount_cents'] == 85000  # (100000 + 70000) / 2
    assert opt_c['revisions'] == 2

def test_gemini_api_adapter(monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'test-gemini-key')
    monkeypatch.setenv('GEMINI_MODEL', 'gemini-4-argon')

    calls = []
    fake_result = {
        'title': 'E-Commerce Store',
        'description': 'Shop with checkout',
        'deliverables': ['Storefront', 'Cart'],
        'budget_usd': 1000.0,
        'deadline': '14 days',
        'requirements': ['Stripe/PayPal integration'],
        'missing_information': ['Who manages shipping?'],
        'assumptions': ['Provided brand assets']
    }

    def handler(request):
        calls.append(request)
        assert 'key=test-gemini-key' in str(request.url)
        assert 'gemini-4-argon' in str(request.url)
        body = json.loads(request.content)
        assert body['generationConfig']['responseMimeType'] == 'application/json'
        return httpx.Response(200, json={
            'candidates': [
                {
                    'content': {
                        'parts': [{'text': json.dumps(fake_result)}]
                    }
                }
            ]
        })

    original = httpx.Client
    monkeypatch.setattr(ai.httpx, 'Client', lambda **kw: original(transport=httpx.MockTransport(handler), **kw))

    res = ai.extract('Build an e-commerce website for $1000 in 14 days')
    assert res['budget_usd'] == 1000.0
    assert res['deliverables'] == ['Storefront', 'Cart']
    assert len(calls) == 1

def test_analyze_endpoint_workflow(client, flow, owner):
    path, buyer = flow
    # Create proposal 1 (Alex: $1000, 5 pages, 14 days)
    p1 = {
        'expected_version': 0,
        'terms': {
            'deliverables': [f'Page {i}' for i in range(1, 6)],
            'exclusions': ['Hosting fees'],
            'amount_cents': 100000,
            'currency': 'USD',
            'delivery_days': 14,
            'revisions': 2,
            'payment_terms': 'Full payment upfront; work starts after payment.'
        }
    }
    assert client.post(path + '/offers', headers=owner, json=p1).status_code == 201

    # Counteroffer 2 (Jordan: $700, 10 pages, 7 days, 4 revisions)
    p2 = {
        'expected_version': 1,
        'terms': {
            'deliverables': [f'Page {i}' for i in range(1, 11)],
            'exclusions': ['Hosting fees'],
            'amount_cents': 70000,
            'currency': 'USD',
            'delivery_days': 7,
            'revisions': 4,
            'payment_terms': 'Full payment upfront; work starts after payment.'
        }
    }
    assert client.post(path + '/offers', headers=buyer, json=p2).status_code == 201

    # Request AI risk analysis
    res = client.post(path + '/analyze', headers=owner)
    assert res.status_code == 200
    data = res.json()
    assert 'risks' in data
    assert 'options' in data
    assert len(data['risks']) >= 2
    assert len(data['options']) == 3

    risk_cats = [r['category'] for r in data['risks']]
    assert 'pricing_imbalance' in risk_cats
    assert 'timeline_pressure' in risk_cats
