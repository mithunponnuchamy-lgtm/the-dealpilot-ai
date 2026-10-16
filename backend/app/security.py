import hashlib
import hmac
from fastapi import Header, HTTPException
from . import config

def digest(token): return hashlib.sha256(token.encode()).hexdigest()
def token_from_header(authorization: str = Header(default='')):
    if not authorization.startswith('Bearer '): raise HTTPException(401, 'Enter your private access token.')
    return authorization[7:]
def is_owner(token):
    return len(config.WORKSPACE_TOKEN) >= 32 and hmac.compare_digest(token, config.WORKSPACE_TOKEN)
def owner(token):
    if not is_owner(token): raise HTTPException(403, 'Freelancer access required.')
def role_for(deal, token):
    if is_owner(token): return 'freelancer'
    if hmac.compare_digest(digest(token), deal.client_hash): return 'client'
    raise HTTPException(404, 'Deal not found.')
