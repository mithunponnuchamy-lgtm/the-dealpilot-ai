import json
import os
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update, func, delete
from sqlalchemy.orm import Session
from .database import get_db
from .models import Deal, Offer, Approval, Payment, Event, now
from .schemas import DealCreate, OfferCreate, VersionAction, Message
from .security import token_from_header, role_for, owner, is_owner, digest
from .services import ai, paypal
from .services.integrity import compare
router = APIRouter()
DB = Depends(get_db)
AUTH = Depends(token_from_header)

def event(db, deal_id, role, message): db.add(Event(deal_id=deal_id, role=role, message=message))
def access(db, deal_id, token, write=False):
    d = db.get(Deal, deal_id)
    if not d: raise HTTPException(404, 'Deal not found.')
    role = role_for(d, token)
    if write:
        # A real write obtains a row lock on PostgreSQL and write lock on SQLite.
        db.execute(update(Deal).where(Deal.id == deal_id).values(current_version=Deal.current_version))
        db.refresh(d)
    return d, role

def current(db, d): return db.scalar(select(Offer).where(Offer.deal_id == d.id, Offer.version == d.current_version))
def approved(db, o): return set(db.scalars(select(Approval.role).where(Approval.offer_id == o.id)))
def editable(d):
    if d.frozen or d.cancelled: raise HTTPException(409, 'This deal is locked. Checkout has started or the deal was cancelled.')
def version(db, d, n):
    o = current(db,d)
    if not o or o.version != n or o.rejected: raise HTTPException(409, 'Proposal changed or was rejected. Reload and review the current version.')
    return o

def view(db,d,role):
    offers = list(db.scalars(select(Offer).where(Offer.deal_id == d.id).order_by(Offer.version)))
    p = db.scalar(select(Payment).where(Payment.deal_id == d.id))
    o = offers[-1] if offers else None
    approvals = approved(db,o) if o else set()
    state = 'negotiating'
    if o and not o.rejected: state = 'approved' if len(approvals)==2 else 'awaiting approval'
    if d.cancelled: state = 'cancelled'
    if p: state = {'paid':'paid','failed':'payment failed','cancelled':'cancelled'}.get(p.status,'payment pending')
    result = {'id':d.id,'title':d.title,'client':d.client,'freelancer':d.freelancer,'asking_cents':d.asking_cents,'role':role,'status':state,'frozen':d.frozen,'cancelled':d.cancelled,'requirements':d.requirements,'extraction':d.extraction,'created_at':d.created_at,
        'offers':[{'id':x.id,'version':x.version,'terms':x.terms,'author':x.author,'rejected':x.rejected,'approvals':sorted(approved(db,x)),'created_at':x.created_at,'changes':compare(offers[i-1].terms,x.terms) if i else {}} for i,x in enumerate(offers)],
        'payment': {'status':p.status,'order_id':p.order_id,'capture_id':p.capture_id,'offer_id':p.offer_id,'paid_at':p.paid_at,'approval_url':p.approval_url} if p else None,
        'events':[{'id':e.id,'role':e.role,'message':e.message,'created_at':e.created_at} for e in db.scalars(select(Event).where(Event.deal_id==d.id).order_by(Event.created_at))]}
    if role=='freelancer': result['minimum_cents']=d.minimum_cents
    return result

@router.get('/session')
def session(token=AUTH,db:Session=DB):
    ai_info = ai.get_provider_info()
    paypal_ready = bool(os.getenv('PAYPAL_CLIENT_ID') and os.getenv('PAYPAL_CLIENT_SECRET'))
    if is_owner(token):
        return {
            'role': 'freelancer',
            'ai_configured': ai_info['configured'],
            'ai_provider': ai_info['label'],
            'paypal_configured': paypal_ready
        }
    d = db.scalar(select(Deal).where(Deal.client_hash==digest(token)))
    if not d: raise HTTPException(401,'Invalid access token.')
    return {
        'role': 'client',
        'deal_id': d.id,
        'ai_configured': ai_info['configured'],
        'ai_provider': ai_info['label'],
        'paypal_configured': paypal_ready
    }
@router.get('/deals')
def list_deals(token=AUTH,db:Session=DB):
    q=select(Deal).order_by(Deal.created_at.desc())
    if not is_owner(token): q=q.where(Deal.client_hash==digest(token))
    return [view(db,d,role_for(d,token)) for d in db.scalars(q)]
@router.post('/deals',status_code=201)
def create_deal(body:DealCreate,token=AUTH,db:Session=DB):
    owner(token)
    if body.minimum_cents > body.asking_cents: raise HTTPException(422,'Minimum cannot exceed asking price.')
    invitation=secrets.token_urlsafe(32)
    d=Deal(**body.model_dump(), client_hash=digest(invitation))
    db.add(d); db.flush(); event(db,d.id,'freelancer','Deal created.'); db.commit()
    return {'deal':view(db,d,'freelancer'),'client_token':invitation}
@router.get('/deals/{deal_id}')
def get_deal(deal_id:str,token=AUTH,db:Session=DB):
    d,role=access(db,deal_id,token); return view(db,d,role)
@router.post('/deals/{deal_id}/invitation')
def rotate_invitation(deal_id:str,token=AUTH,db:Session=DB):
    owner(token); d,role=access(db,deal_id,token,True)
    invitation=secrets.token_urlsafe(32); d.client_hash=digest(invitation)
    event(db,d.id,role,'Client invitation rotated. Previous link revoked.'); db.commit()
    return {'client_token':invitation}
@router.post('/deals/{deal_id}/requirements')
def requirements(deal_id:str,body:Message,token=AUTH,db:Session=DB):
    d,role=access(db,deal_id,token,True); editable(d)
    if d.current_version: raise HTTPException(409,'Requirements are fixed after the first proposal. Request changes in the discussion and create a revised proposal.')
    d.requirements=body.text; event(db,d.id,role,'Requirements saved.'); db.commit()
    return view(db,d,role)
def ai_budget(db, d, role):
    since = (datetime.now(timezone.utc)-timedelta(hours=1)).isoformat()
    count = db.scalar(select(func.count()).select_from(Event).where(Event.deal_id==d.id, Event.created_at>=since, Event.message=='AI request started.'))
    if count >= 20: raise HTTPException(429, 'This deal reached its 20 AI requests per hour limit. Please wait.')
    event(db,d.id,role,'AI request started.')
    db.commit()

@router.post('/deals/{deal_id}/extract')
def extract(deal_id:str,body:dict|None=None,token=AUTH,db:Session=DB):
    d,role=access(db,deal_id,token,True); editable(d)
    req_text = (body.get('text') if isinstance(body, dict) else None) or d.requirements
    if req_text and req_text.strip():
        d.requirements = req_text.strip()
        db.commit()
    if not d.requirements: raise HTTPException(422,'Please enter project brief requirements first.')
    ai_budget(db,d,role)
    d,role=access(db,deal_id,token,True); editable(d)
    d.extraction=ai.extract(d.requirements); event(db,d.id,role,'AI extracted draft requirements for review.'); db.commit()
    return view(db,d,role)
@router.post('/deals/{deal_id}/suggest')
def suggest(deal_id:str,token=AUTH,db:Session=DB):
    d,role=access(db,deal_id,token,True)
    ai_budget(db,d,role)
    public=view(db,d,role)
    # Never include private minimum, tokens or other internal data in LLM context.
    return ai.suggest(json.dumps({'requirements':d.requirements,'offers':public['offers'][-2:]}))

@router.post('/deals/{deal_id}/analyze')
def analyze(deal_id:str,token=AUTH,db:Session=DB):
    d,role=access(db,deal_id,token,True)
    ai_budget(db,d,role)
    public=view(db,d,role)
    offers = public.get('offers', [])
    if not offers:
        raise HTTPException(400, 'At least one proposal is required to perform risk analysis.')
    prev_terms = offers[-2]['terms'] if len(offers) >= 2 else None
    curr_terms = offers[-1]['terms']
    return ai.analyze_deal(d.requirements, prev_terms, curr_terms)
@router.post('/deals/{deal_id}/messages')
def message(deal_id:str,body:Message,token=AUTH,db:Session=DB):
    d,role=access(db,deal_id,token,True)
    event(db,d.id,role,body.text); db.commit(); return view(db,d,role)
@router.post('/deals/{deal_id}/offers',status_code=201)
def offer(deal_id:str,body:OfferCreate,token=AUTH,db:Session=DB):
    d,role=access(db,deal_id,token,True); editable(d)
    if body.expected_version != d.current_version: raise HTTPException(409,'Another proposal was added. Reload before submitting.')
    d.current_version+=1
    db.add(Offer(deal_id=d.id,version=d.current_version,terms=body.terms.model_dump(),author=role))
    event(db,d.id,role,f'Proposed version {d.current_version}. Both approvals required.'); db.commit(); return view(db,d,role)
@router.post('/deals/{deal_id}/approve')
def approve(deal_id:str,body:VersionAction,token=AUTH,db:Session=DB):
    d,role=access(db,deal_id,token,True); editable(d); o=version(db,d,body.version)
    if role=='freelancer' and o.terms['amount_cents'] < d.minimum_cents: raise HTTPException(409,'This offer is below your private minimum. Submit a revised proposal.')
    if role not in approved(db,o):
        db.add(Approval(offer_id=o.id,role=role)); event(db,d.id,role,f'Explicitly approved version {o.version}.')
    db.commit(); return view(db,d,role)
@router.post('/deals/{deal_id}/reject')
def reject(deal_id:str,body:VersionAction,token=AUTH,db:Session=DB):
    d,role=access(db,deal_id,token,True); editable(d); o=version(db,d,body.version)
    o.rejected=True; event(db,d.id,role,f'Rejected version {o.version}. Submit a new version to continue.'); db.commit(); return view(db,d,role)
@router.post('/deals/{deal_id}/cancel')
def cancel(deal_id:str,token=AUTH,db:Session=DB):
    d,role=access(db,deal_id,token,True); editable(d); d.cancelled=True
    event(db,d.id,role,'Deal cancelled before checkout.'); db.commit(); return view(db,d,role)
@router.post('/deals/{deal_id}/checkout')
def checkout(deal_id:str,body:VersionAction,token=AUTH,db:Session=DB):
    d,role=access(db,deal_id,token,True)
    if role!='client': raise HTTPException(403,'Only the client may start checkout.')
    if d.cancelled: raise HTTPException(409,'Deal cancelled.')
    o=version(db,d,body.version)
    if approved(db,o) != {'client','freelancer'}: raise HTTPException(409,'Both people must approve this version first.')
    if not os.getenv('PAYPAL_CLIENT_ID') or not os.getenv('PAYPAL_CLIENT_SECRET'): raise HTTPException(503,'Configure PayPal Sandbox credentials on the backend first.')
    p=db.scalar(select(Payment).where(Payment.deal_id==d.id))
    if not p:
        p=Payment(deal_id=d.id,offer_id=o.id); db.add(p); d.frozen=True
        event(db,d.id,role,f'Checkout requested for version {o.version}. Terms locked.'); db.commit()
        # Persist the idempotency key BEFORE making an external request.
        d,role=access(db,deal_id,token,True); db.refresh(p)
    if p.order_id:
        if p.status in ('paid','failed'): raise HTTPException(409,'This payment is complete or terminal. Review its status.')
        return {'approval_url':p.approval_url,'order_id':p.order_id}
    if datetime.now(timezone.utc)-datetime.fromisoformat(p.created_at)>timedelta(hours=5):
        raise HTTPException(409,'Unresolved order creation is too old to retry safely. Reconcile with the sandbox merchant account before proceeding.')
    p.order_id,p.approval_url=paypal.create(p,o); p.status='pending'; db.commit()
    return {'approval_url':p.approval_url,'order_id':p.order_id}
@router.post('/deals/{deal_id}/payment/verify')
def verify(deal_id:str,token=AUTH,db:Session=DB):
    d,role=access(db,deal_id,token,True)
    if role!='client': raise HTTPException(403,'Client access required to complete payment.')
    p=db.scalar(select(Payment).where(Payment.deal_id==d.id))
    if not p or not p.order_id: raise HTTPException(409,'No PayPal order exists yet. Retry checkout to recover order creation.')
    if p.status=='paid': return view(db,d,role)
    o=db.get(Offer,p.offer_id)
    if o.version!=d.current_version or approved(db,o)!={'client','freelancer'}: raise HTTPException(409,'Proposal approval mismatch.')
    data=paypal.get(p.order_id)
    capture_id=paypal.verify(data,p,o)
    if not capture_id and data.get('status')=='APPROVED':
        data=paypal.capture(p); capture_id=paypal.verify(data,p,o)
    if capture_id:
        p.capture_id=capture_id; p.status='paid'; p.paid_at=now()
        event(db,d.id,'system',f'PayPal Sandbox capture verified for proposal v{o.version}.')
    elif data.get('status')=='VOIDED' or any(c.get('status') in ('DECLINED','FAILED','DENIED') for u in data.get('purchase_units',[]) for c in u.get('payments',{}).get('captures',[])): p.status='failed'
    else: p.status='pending'
    db.commit(); return view(db,d,role)
@router.post('/deals/{deal_id}/payment/cancel')
def cancel_payment(deal_id:str,token=AUTH,db:Session=DB):
    d,role=access(db,deal_id,token,True)
    if role!='client': raise HTTPException(403,'Client access required.')
    p=db.scalar(select(Payment).where(Payment.deal_id==d.id))
    if not p or not p.order_id: raise HTTPException(409,'No checkout to cancel.')
    # A browser cancellation is NOT evidence that PayPal did not capture.
    if p.status!='paid':
        o=db.get(Offer,p.offer_id); data=paypal.get(p.order_id); cid=paypal.verify(data,p,o)
        if cid: p.capture_id=cid; p.status='paid'; p.paid_at=now()
        elif data.get('status') in ('CREATED','PAYER_ACTION_REQUIRED'): p.status='cancelled'
        else: p.status='pending'
        event(db,d.id,role,'Checkout exit recorded; status checked with PayPal. Existing order retained.')
    db.commit(); return view(db,d,role)

@router.post('/deals/{deal_id}/simulate-payment')
def simulate_payment(deal_id:str,body:VersionAction,token=AUTH,db:Session=DB):
    d,role=access(db,deal_id,token,True)
    if role!='client': raise HTTPException(403,'Client access required to simulate payment.')
    if d.cancelled: raise HTTPException(409,'Deal is cancelled.')
    o=version(db,d,body.version)
    if approved(db,o)!={'client','freelancer'}:
        raise HTTPException(409,'Both people must approve this version first.')
    p=db.scalar(select(Payment).where(Payment.deal_id==d.id))
    if not p:
        p=Payment(deal_id=d.id,offer_id=o.id); db.add(p)
    d.frozen=True
    sim_order='SANDBOX-SIM-'+secrets.token_hex(6).upper()
    sim_capture='CAPTURE-SIM-'+secrets.token_hex(6).upper()
    p.order_id=sim_order; p.capture_id=sim_capture; p.status='paid'; p.paid_at=now()
    event(db,d.id,'system',f'PayPal Sandbox capture verified (simulation) for proposal v{o.version}.')
    db.commit()
    return view(db,d,role)

@router.post('/demo/seed')
def seed_demo(db: Session = DB):
    """Seed or reset the official Hackathon Judge showcase deal."""
    from . import config
    demo_title = 'FinTech Mobile App Redesign & Design System'
    existing = db.scalars(select(Deal).where(Deal.title == demo_title)).all()
    for old_d in existing:
        db.execute(delete(Approval).where(Approval.offer_id.in_(select(Offer.id).where(Offer.deal_id == old_d.id))))
        db.execute(delete(Payment).where(Payment.deal_id == old_d.id))
        db.execute(delete(Offer).where(Offer.deal_id == old_d.id))
        db.execute(delete(Event).where(Event.deal_id == old_d.id))
        db.delete(old_d)
    db.commit()

    client_token = secrets.token_urlsafe(32)
    deal = Deal(
        title=demo_title,
        client='Acme Payments Corp (Alex Rivera)',
        freelancer='Sarah Chen (Senior UI/UX Specialist)',
        asking_cents=350000,
        minimum_cents=280000,
        current_version=1,
        frozen=False,
        cancelled=False,
        requirements=(
            'Design high-fidelity iOS & Android checkout flows with integrated PayPal Sandbox '
            'payment modal, complete Figma component design system (40+ components), and '
            'developer handoff specifications with micro-interaction prototypes.'
        ),
        extraction={
            'deliverables': [
                'High-fidelity Figma UI prototypes for iOS & Android checkout flows',
                'Complete design system with 40+ responsive payment & wallet components',
                'PayPal Sandbox checkout interactive prototype & developer handoff specs'
            ],
            'exclusions': [
                'Native iOS/Android Swift/Kotlin production backend deployment',
                'Merchant account registration and regulatory compliance filing'
            ],
            'estimated_budget_cents': 350000,
            'estimated_delivery_days': 14,
            'clarification_questions': [
                'Do you require dark mode variants for the payment flow screens?',
                'Will the Figma handoff require tokenized style variables for Tailwind CSS?'
            ],
            'assumptions': [
                'Client provides the brand guidelines and PayPal Sandbox credentials.'
            ]
        },
        client_hash=digest(client_token)
    )
    db.add(deal)
    db.flush()

    offer = Offer(
        deal_id=deal.id,
        version=1,
        terms={
            'deliverables': [
                'High-fidelity Figma UI prototypes for iOS & Android checkout flows',
                'Complete design system with 40+ responsive payment & wallet components',
                'PayPal Sandbox checkout interactive prototype & developer handoff specs'
            ],
            'exclusions': [
                'Native iOS/Android Swift/Kotlin production backend deployment',
                'Merchant account registration and regulatory compliance filing'
            ],
            'amount_cents': 350000,
            'currency': 'USD',
            'delivery_days': 14,
            'revisions': 2,
            'payment_terms': '50% deposit via PayPal Sandbox upon proposal approval; 50% upon final delivery.'
        },
        author='freelancer',
        rejected=False
    )
    db.add(offer)
    db.flush()

    # Pre-approve by freelancer so it is awaiting client approval (the ideal testing state)
    approval = Approval(offer_id=offer.id, role='freelancer')
    db.add(approval)

    events = [
        Event(deal_id=deal.id, role='freelancer', message='Deal created with $3,500 asking price and $2,800 private minimum.'),
        Event(deal_id=deal.id, role='freelancer', message='Requirements saved and structured deliverables extracted with Gemini AI.'),
        Event(deal_id=deal.id, role='client', message='Hi Sarah, excited to work together! Can we ensure the PayPal checkout screens match our new brand palette?'),
        Event(deal_id=deal.id, role='freelancer', message='Absolutely Alex. I have included the complete design system and responsive mobile flows with PayPal Sandbox verification.'),
        Event(deal_id=deal.id, role='freelancer', message='Proposal Version 1 submitted for $3,500 USD (14 days delivery, 2 revision rounds).'),
        Event(deal_id=deal.id, role='freelancer', message='Sarah Chen approved Proposal Version 1. Waiting for Acme Payments Corp approval.')
    ]
    for ev in events:
        db.add(ev)
    db.commit()

    return {
        'deal': view(db, deal, 'freelancer'),
        'deal_id': deal.id,
        'client_token': client_token,
        'freelancer_token': config.WORKSPACE_TOKEN
    }

@router.get('/deals/{deal_id}/client-token')
def get_or_create_client_token(deal_id: str, token=AUTH, db: Session = DB):
    """Provides client invitation token for quick role switching."""
    owner(token)
    d, role = access(db, deal_id, token, True)
    invitation = secrets.token_urlsafe(32)
    d.client_hash = digest(invitation)
    db.commit()
    return {'client_token': invitation}

