import os
from decimal import Decimal
from urllib.parse import urlparse
import httpx
from fastapi import HTTPException
from ..config import FRONTEND_URL
BASE = 'https://api-m.sandbox.paypal.com'  # Intentionally no live-mode switch.

def request(method, path, payload=None, request_id=None):
    client_id, secret = os.getenv('PAYPAL_CLIENT_ID'), os.getenv('PAYPAL_CLIENT_SECRET')
    if not client_id or not secret: raise HTTPException(503, 'PayPal Sandbox credentials are not configured on the backend.')
    try:
        with httpx.Client(timeout=30) as client:
            auth = client.post(BASE+'/v1/oauth2/token', auth=(client_id,secret), data={'grant_type':'client_credentials'})
            auth.raise_for_status()
            headers = {'Authorization':'Bearer '+auth.json()['access_token'], 'Content-Type':'application/json', 'Prefer':'return=representation'}
            if request_id: headers['PayPal-Request-Id'] = request_id
            response = client.request(method, BASE+path, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
    except (httpx.HTTPError, KeyError, ValueError):
        raise HTTPException(502, 'PayPal could not confirm this request. Status is unverified. Retry verification; do not create a second payment.')

def create(payment, offer):
    amount = f"{Decimal(offer.terms['amount_cents'])/100:.2f}"
    data = request('POST','/v2/checkout/orders', {
        'intent':'CAPTURE',
        'purchase_units':[{'reference_id':offer.id,'custom_id':offer.id,'amount':{'currency_code':offer.terms['currency'],'value':amount}}],
        'payment_source':{'paypal':{'experience_context':{'shipping_preference':'NO_SHIPPING','user_action':'PAY_NOW','return_url':FRONTEND_URL+'/?deal='+payment.deal_id+'&checkout=returned','cancel_url':FRONTEND_URL+'/?deal='+payment.deal_id+'&checkout=cancelled'}}}
    }, 'create-'+payment.id)
    link = next((x['href'] for x in data.get('links',[]) if x.get('rel') in ('approve','payer-action')), None)
    if not data.get('id') or not link or urlparse(link).hostname != 'www.sandbox.paypal.com' or urlparse(link).scheme != 'https':
        raise HTTPException(502, 'PayPal returned an unexpected checkout response; payment remains unverified.')
    return data['id'], link

def get(order_id): return request('GET','/v2/checkout/orders/'+order_id)
def capture(payment): return request('POST','/v2/checkout/orders/'+payment.order_id+'/capture', {}, 'capture-'+payment.id)
def verify(data, payment, offer):
    try:
        units = data['purchase_units']
        if data['id'] != payment.order_id or len(units) != 1: raise ValueError()
        unit = units[0]
        if unit.get('reference_id') != offer.id: raise ValueError()
        captures = unit.get('payments',{}).get('captures',[])
        if not captures:
            if data.get('status') == 'APPROVED':
                amount = unit['amount']
                if amount['currency_code'] != offer.terms['currency'] or Decimal(amount['value']) != Decimal(offer.terms['amount_cents'])/100: raise ValueError()
            return None
        if len(captures) != 1: raise ValueError()
        c = captures[0]
        if c['status'] != 'COMPLETED' or data['status'] != 'COMPLETED': return None
        if c['amount']['currency_code'] != offer.terms['currency'] or Decimal(c['amount']['value']) != Decimal(offer.terms['amount_cents'])/100: raise ValueError()
        if not c.get('id'): raise ValueError()
        return c['id']
    except (KeyError, TypeError, ValueError, ArithmeticError):
        raise HTTPException(502, 'PayPal verification mismatch. Payment has NOT been marked paid. Contact the workspace owner.')
