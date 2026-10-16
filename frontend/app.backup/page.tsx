'use client';
import {useEffect,useState,FormEvent} from 'react';
import {Deal,Terms,Suggestion} from './types';
const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';
const money=(c:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(c/100);
const lines=(s:string)=>s.split('\n').map(x=>x.trim()).filter(Boolean);
const initial:Terms={deliverables:['Home page','About page','Contact page'],exclusions:['Hosting and domain fees'],amount_cents:25000,currency:'USD',delivery_days:7,revisions:1,payment_terms:'Full payment upfront; work starts after payment.'};
export default function Home(){
const [token,setToken]=useState(''),[entry,setEntry]=useState(''),[showCode,setShowCode]=useState(false),[showCert,setShowCert]=useState(false),[role,setRole]=useState(''),[deals,setDeals]=useState<Deal[]>([]),[selected,setSelected]=useState(''),[health,setHealth]=useState('Connecting'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[newDeal,setNewDeal]=useState(false),[tab,setTab]=useState('workspace'),[invitation,setInvitation]=useState(''),[suggestion,setSuggestion]=useState<Suggestion|null>(null),[formTerms,setFormTerms]=useState<Terms|null>(null),[configured,setConfigured]=useState({ai_configured:false,ai_provider:'',paypal_configured:false});
const deal=deals.find(x=>x.id===selected),offer=deal?.offers.at(-1);
async function api(path:string,method='GET',body?:unknown,t=token){const r=await fetch(API+path,{method,headers:{Authorization:'Bearer '+t,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Error(typeof data.detail==='string'?data.detail:'Check the form fields and try again.');return data;}
async function refresh(t=token){setDeals(await api('/deals','GET',undefined,t));}
async function run(action:()=>Promise<void>){setBusy(true);setError('');try{await action();}catch(e){setError(e instanceof Error?e.message:'Request failed.');}finally{setBusy(false);}}
async function login(t:string){const s=await api('/session','GET',undefined,t);setToken(t);setRole(s.role);setConfigured(s);sessionStorage.setItem('dealpilot-token',t);const list:Deal[]=await api('/deals','GET',undefined,t);setDeals(list);setSelected(s.deal_id||new URLSearchParams(location.search).get('deal')||list[0]?.id||'');}
useEffect(()=>{fetch(API+'/health').then(r=>{if(!r.ok)throw Error();return r.json()}).then(()=>setHealth('API connected')).catch(()=>setHealth('API offline'));const invite=new URLSearchParams(location.hash.slice(1)).get('invite');const saved=invite||sessionStorage.getItem('dealpilot-token');if(invite)history.replaceState(null,'',location.pathname+location.search);if(saved)void run(()=>login(saved));},[]);
async function mutate(path:string,body?:unknown){await api('/deals/'+selected+path,'POST',body);await refresh();}
function select(id:string){setSelected(id);setSuggestion(null);setInvitation('');setTab('workspace');setError('');}
async function create(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);await run(async()=>{const r=await api('/deals','POST',{title:f.get('title'),client:f.get('client'),freelancer:f.get('freelancer'),asking_cents:Math.round(Number(f.get('asking'))*100),minimum_cents:Math.round(Number(f.get('minimum'))*100)});await refresh();select(r.deal.id);setInvitation(location.origin+'/?deal='+r.deal.id+'#invite='+r.client_token);setNewDeal(false);});}
function logout(){sessionStorage.removeItem('dealpilot-token');setToken('');setRole('');setDeals([]);setInvitation('');setSelected('');setEntry('');setError('');}
const returnState=typeof window!=='undefined'?new URLSearchParams(location.search).get('checkout'):null;
const brand=<a className="brand" href="/" aria-label="DealPilot AI"><span className="mark" aria-hidden="true">D↗</span>DealPilot<span className="ai">AI</span></a>;
if(!role)return <div className="entry-wrapper"><BrandHeader/><main className="entry-grid"><div className="intro-col"><div className="intro-block"><span className="eyebrow">FREELANCE AGREEMENTS, MADE CLEAR</span><h1 className="entry-headline">Agree on the work.<br/>Move forward together.</h1><p className="intro-description">Turn project conversations into clear proposals, shared approvals, and PayPal Sandbox payments.</p></div><AgreementPreview/></div><div className="access-col"><WorkspaceAccessCard entry={entry} setEntry={setEntry} showCode={showCode} setShowCode={setShowCode} busy={busy} error={error} health={health} onSubmit={e=>{e.preventDefault();void run(()=>login(entry.trim()));}}/></div></main><footer className="entry-footer"><p>DealPilot AI · From conversation to agreement to payment.</p></footer></div>;
return <div className="app"><aside>{brand}<div className="space-label">WORKSPACE</div><button className="nav" onClick={()=>select('')}>▦ Overview</button><div className="space-label">YOUR DEALS · {deals.length}</div><nav>{deals.map(d=><button className={'deal-nav '+(d.id===selected?'active':'')} key={d.id} onClick={()=>select(d.id)}><span>{d.title}</span><small>{d.client}</small></button>)}</nav>{role==='freelancer'&&<button className="new-button" onClick={()=>setNewDeal(true)}>＋ New deal</button>}<div className="sidebar-bottom"><span className="avatar">{role==='client'?'C':'F'}</span><div><b>{role}</b><small>Private demo access</small></div><button onClick={logout}>Exit</button></div></aside><div className="main"><header className="topbar"><span>Workspace / {deal?.title||'Overview'}</span><span className="badge">● Sandbox only</span></header><main>{error&&<div className="error" role="alert">{error}</div>}
{!deal?<><div className="page-heading"><div><span className="eyebrow">YOUR WORK, IN AGREEMENT</span><h1>Deal overview</h1><p>Every conversation. Every version. One clear record.</p></div>{role==='freelancer'&&<button className="primary" onClick={()=>setNewDeal(true)}>＋ Create a deal</button>}</div><div className="stats"><div><small>Active deals</small><strong>{deals.filter(d=>!['paid','cancelled'].includes(d.status)).length}</strong></div><div><small>Awaiting approval</small><strong>{deals.filter(d=>d.status==='awaiting approval').length}</strong></div><div><small>Verified sandbox payments</small><strong>{deals.filter(d=>d.status==='paid').length}</strong></div></div><section className="card"><h2>Your deals</h2>{deals.length?<div className="table-scroll"><table><thead><tr><th>Project / client</th><th>Current proposal</th><th>Status</th><th></th></tr></thead><tbody>{deals.map(d=><tr key={d.id}><td><b>{d.title}</b><small>{d.client}</small></td><td>{d.offers.at(-1)?money(d.offers.at(-1)!.terms.amount_cents):'Not proposed'}</td><td><span className="badge">{d.status}</span></td><td><button onClick={()=>select(d.id)}>Open →</button></td></tr>)}</tbody></table></div>:<div className="empty"><h3>A clear agreement starts here.</h3><p>Create your first deal, then invite a client to define the work.</p></div>}</section><p className="subtle">{health} · AI {configured.ai_configured?'configured':'not configured'} · PayPal {configured.paypal_configured?'configured':'not configured'}</p></>:<>
<div className="page-heading"><div><span className="eyebrow">DEAL WORKSPACE · {deal.id.slice(0,8)}</span><h1>{deal.title}</h1><p>{deal.freelancer} with {deal.client} <span className="badge">{deal.status}</span></p></div><div className="actions"><button disabled={busy} onClick={()=>void run(()=>refresh())}>Refresh</button>{role==='freelancer'&&<button disabled={busy} onClick={()=>void run(async()=>{const r=await api('/deals/'+selected+'/invitation','POST');setInvitation(location.origin+'/?deal='+selected+'#invite='+r.client_token);})}>New client invitation</button>}</div></div>
{invitation&&<div className="notification"><b>Private client invitation</b><p>Copy and share only with your client. For testing, open in another browser or private window. A new invitation revokes the previous one.</p><input aria-label="Client invitation link" readOnly value={invitation} onFocus={e=>e.target.select()}/></div>}
<div className="progress"><span className="done">01 Conversation</span><span className={offer?'done':''}>02 Proposal</span><span className={offer?.approvals.length===2?'done':''}>03 Mutual approval</span><span className={deal.status==='paid'?'done':''}>04 Verified payment</span></div><div className="tabs"><button className={tab==='workspace'?'selected':''} onClick={()=>setTab('workspace')}>Workspace</button><button className={tab==='history'?'selected':''} onClick={()=>setTab('history')}>Version history · {deal.offers.length}</button></div>
{tab==='workspace'?<div className="workspace-grid"><div className="stack"><section className="card"><h2>Project brief</h2><form key={deal.id+deal.requirements} onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void run(()=>mutate('/requirements',{text:f.get('requirements')}));}}><label>What are we building?<textarea name="requirements" rows={4} defaultValue={deal.requirements} placeholder="I need a five-page portfolio website with a contact form, delivered in seven days. My budget is $300." required maxLength={2000} disabled={deal.offers.length>0||deal.frozen||deal.cancelled}/></label>{!deal.offers.length&&!deal.frozen&&!deal.cancelled&&<button disabled={busy}>Save brief</button>}</form><div className="actions"><button disabled={busy||!deal.requirements||deal.frozen||deal.cancelled||!configured.ai_configured} onClick={()=>void run(()=>mutate('/extract'))}>✧ Extract with AI</button><small>{configured.ai_configured?'Suggestions need your review.':'AI key not configured. Manual proposals are available.'}</small></div>{deal.extraction&&<div className="ai-result"><h3>AI draft · review before using</h3><p>{deal.extraction.description}</p><ul>{deal.extraction.deliverables.map((x,i)=><li key={i}>{x}</li>)}</ul><p>Budget: {deal.extraction.budget_usd===null?'Not specified':money(deal.extraction.budget_usd*100)} · Deadline: {deal.extraction.deadline||'Not specified'}</p><b>Clarification questions</b><ul>{deal.extraction.missing_information.map((x,i)=><li key={i}>{x}</li>)}</ul><b>Unconfirmed assumptions</b><ul>{deal.extraction.assumptions.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}</section>
<section className="card"><h2>Conversation & activity</h2><div className="timeline">{deal.events.map((e,i)=><article key={i}><span className="timeline-dot"/><div><b>{e.role}</b><time>{new Date(e.created_at).toLocaleString()}</time><p>{e.message}</p></div></article>)}</div><form onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const text=new FormData(form).get('message');void run(async()=>{await mutate('/messages',{text});form.reset();});}}><label>Message<textarea name="message" rows={2} required maxLength={2000} placeholder="Ask a question or suggest a change…"/></label><button disabled={busy} className="primary">Send message</button></form></section>
{!deal.frozen&&!deal.cancelled&&<section className="card"><h2>{offer?'Propose a revision':'Create a proposal'} · v{(offer?.version||0)+1}</h2><p>Each new version needs fresh approval from both people.</p><ProposalForm key={deal.id+'-'+(offer?.version||0)+'-'+(formTerms?JSON.stringify(formTerms):'default')} terms={formTerms||offer?.terms||{...initial,amount_cents:deal.asking_cents}} busy={busy} submit={terms=>{setFormTerms(null);return run(()=>mutate('/offers',{expected_version:offer?.version||0,terms}));}}/></section>}</div>
<div className="stack"><section className="card proposal"><div className="section-heading"><h2>Current agreement</h2><span className="badge">{offer?'Version '+offer.version:'Not proposed'}</span></div>{offer?<><strong className="price">{money(offer.terms.amount_cents)} <small>USD</small></strong><p>{offer.terms.payment_terms}</p><hr/><h3>Included in the scope</h3><ul className="scope">{offer.terms.deliverables.map((x,i)=><li key={i}>✓ {x}</li>)}</ul><h3>Not included</h3><ul>{offer.terms.exclusions.map((x,i)=><li key={i}>{x}</li>)}</ul><div className="terms-row"><div><small>Delivery after payment</small><b>{offer.terms.delivery_days} days</b></div><div><small>Revision rounds</small><b>{offer.terms.revisions}</b></div></div><hr/>{['freelancer','client'].map(r=><div className="approval-row" key={r}><span>{r==='freelancer'?deal.freelancer:deal.client}</span><span className={'badge '+(offer.approvals.includes(r)?'green':'')}>{offer.approvals.includes(r)?'✓ Approved':'Awaiting approval'}</span></div>)}{offer.approvals.length===2&&<div className="executed-banner"><p><b>✓ Mutually Approved Agreement</b></p><button type="button" className="secondary cert-btn" onClick={()=>setShowCert(true)}>📄 View Executed Agreement & Certificate</button></div>}{offer.rejected?<p className="error">Rejected. Submit a new proposal to continue.</p>:!deal.frozen&&!deal.cancelled&&<div className="actions"><button className="primary" disabled={busy||offer.approvals.includes(role)} onClick={()=>void run(()=>mutate('/approve',{version:offer.version}))}>{offer.approvals.includes(role)?'You approved':'Approve these exact terms'}</button><button disabled={busy} onClick={()=>void run(()=>mutate('/reject',{version:offer.version}))}>Reject</button></div>}<small>Review all terms before approving. This proposal has not been legally reviewed.</small></>:<p>Your proposal will appear here. Start with the scope and amount.</p>}{role==='freelancer'&&<p className="private">Private to you · Minimum {money(deal.minimum_cents||0)}</p>}</section>
<section className="card"><div className="section-heading"><h2>AI Deal Risk Intelligence <span className="ai">AI</span></h2>{configured.ai_provider&&<span className="badge">{configured.ai_provider}</span>}</div><p>Evaluate proposals for scope creep, pricing imbalance, and timeline compression.</p><button disabled={busy||!offer} onClick={()=>void run(async()=>setSuggestion(await api('/deals/'+selected+'/suggest','POST')))}>{busy?'Analyzing proposal…':'✧ Analyze risks & generate options'}</button>{suggestion&&<div className="ai-result"><p><b>Assessment:</b> {suggestion.recommendation}</p>{suggestion.risks&&suggestion.risks.length>0&&<div className="risk-grid"><h4>Detected Negotiation Risks ({suggestion.risks.length})</h4>{suggestion.risks.map((r,i)=><div key={i} className={`risk-card ${r.severity}`}><div className="risk-header"><h4>{r.title}</h4><span className={`badge ${r.severity}`}>{r.severity.toUpperCase()} RISK</span></div><p>{r.explanation}</p><div className="risk-rec"><b>Recommended action:</b> {r.recommendation}</div></div>)}</div>}{suggestion.options&&suggestion.options.length>0&&<div className="option-grid"><h4>AI Counteroffer Options</h4>{suggestion.options.map((opt,i)=><div key={i} className="option-card"><div className="option-header"><div><b>{opt.name}</b><p style={{margin:'2px 0 0',fontSize:'12px'}}>{opt.summary}</p></div><span className="option-price">{money(opt.amount_cents)}</span></div><div className="option-meta"><span>⏱ {opt.delivery_days} days</span><span>🔄 {opt.revisions} revisions</span><span>📦 {opt.deliverables.length} deliverables</span></div><div className="option-reason"><b>Reasoning:</b> {opt.reasoning}</div>{!deal.frozen&&!deal.cancelled&&<button type="button" className="apply-opt-btn" onClick={()=>setFormTerms({deliverables:opt.deliverables,exclusions:opt.exclusions,amount_cents:opt.amount_cents,delivery_days:opt.delivery_days,revisions:opt.revisions,currency:'USD',payment_terms:initial.payment_terms})}>Apply terms to proposal form ↓</button>}</div>)}</div>}{suggestion.tradeoffs&&suggestion.tradeoffs.length>0&&<div><b>Key Trade-offs:</b><ul>{suggestion.tradeoffs.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}{suggestion.questions&&suggestion.questions.length>0&&<div><b>Clarifications to Settle:</b><ul>{suggestion.questions.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}</div>}</section>
<section className="card checkout"><span className="eyebrow">PAYPAL SANDBOX</span><h2>{deal.status==='paid'?'Payment verified':'Ready when you both are.'}</h2><p>One payment, linked to the exact approved proposal. Sandbox funds only.</p>{returnState&&role==='client'&&<p className="notification">{returnState==='cancelled'?'You left checkout. Check the existing order before trying again.':'Returned from PayPal. Verify and complete payment below.'}</p>}{deal.payment&&<div className="payment-data"><p>Status: <b>{deal.payment.status}</b></p><p>Proposal: v{deal.offers.find(x=>x.id===deal.payment?.offer_id)?.version}</p><p>Order: {deal.payment.order_id||'Awaiting confirmation'}</p><p>Capture: {deal.payment.capture_id||'Not verified'}</p>{deal.payment.paid_at&&<p>{new Date(deal.payment.paid_at).toLocaleString()}</p>}</div>}{deal.status==='paid'&&<button type="button" className="primary" style={{marginTop:'12px',width:'100%'}} onClick={()=>setShowCert(true)}>📄 View Official Agreement & Payment Certificate</button>}{role==='client'&&deal.status!=='paid'&&(configured.paypal_configured?<div className="stack"><button className="paypal" disabled={busy||!offer||offer.rejected||offer.approvals.length!==2||deal.cancelled||deal.payment?.status==='failed'} onClick={()=>void run(async()=>{const r=await api('/deals/'+selected+'/checkout','POST',{version:offer!.version});location.assign(r.approval_url);})}>{deal.payment?'Resume PayPal checkout':'Continue to PayPal'}</button>{deal.payment?.order_id&&<><button disabled={busy} onClick={()=>void run(()=>mutate('/payment/verify'))}>Verify & complete payment</button><button disabled={busy} onClick={()=>void run(()=>mutate('/payment/cancel'))}>Record checkout cancellation</button></>}</div>:<div className="stack"><button className="primary sim-pay-btn" disabled={busy||!offer||offer.rejected||offer.approvals.length!==2||deal.cancelled} onClick={()=>void run(()=>mutate('/simulate-payment',{version:offer!.version}))}>⚡ Complete with Sandbox Simulator (Demo Mode)</button><small>Simulates verified PayPal Sandbox capture. Real credentials can be added to <code>backend/.env</code>.</small></div>)}{!configured.paypal_configured&&role==='freelancer'&&<small>PayPal credentials not yet configured in backend. Simulation mode is available for clients.</small>}{role==='freelancer'&&<small>The client completes checkout from their invitation.</small>}<p className="subtle">Only a verified capture marks this deal paid.</p></section>{!deal.frozen&&!deal.cancelled&&<button disabled={busy} onClick={()=>void run(()=>mutate('/cancel'))}>Cancel this deal</button>}</div></div>:<section className="card"><h2>Agreement history</h2><p>Changes are calculated from stored versions, not guessed by AI.</p>{[...deal.offers].reverse().map(o=><article className="version" key={o.id}><h3>Version {o.version} · {money(o.terms.amount_cents)}</h3><p>By {o.author} · {o.rejected?'Rejected':o.approvals.length+' of 2 approved'}</p>{Object.keys(o.changes).length?<div className="table-scroll"><table><thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead><tbody>{Object.entries(o.changes).map(([k,v])=><tr key={k}><td>{k.replaceAll('_',' ')}</td><td>{format(k,v.before)}</td><td>{format(k,v.after)}</td></tr>)}</tbody></table></div>:<p>Initial proposal · {o.terms.deliverables.join(', ')}</p>}</article>)}{!deal.offers.length&&<p>No proposals yet.</p>}</section>}</>}
<footer>DealPilot AI · From conversation to agreement to payment.</footer></main></div>
{newDeal&&<div className="modal-backdrop"><section className="card modal" role="dialog" aria-modal="true" aria-labelledby="new-title"><div className="section-heading"><h2 id="new-title">Create a deal</h2><button onClick={()=>setNewDeal(false)}>Close</button></div><form onSubmit={create}><label>Project title<input name="title" required maxLength={160} placeholder="Portfolio website"/></label><div className="form-row"><label>Your name<input name="freelancer" required maxLength={100}/></label><label>Client name<input name="client" required maxLength={100}/></label></div><div className="form-row"><label>Asking price (USD)<input name="asking" type="number" min="0.01" max="1000000" step="0.01" required defaultValue="300"/></label><label>Private minimum (USD)<input name="minimum" type="number" min="0" max="1000000" step="0.01" required defaultValue="200"/></label></div><p>Your minimum stays private and is never sent to AI.</p>{error&&<p className="error">{error}</p>}<button className="primary" disabled={busy}>Create & get invitation</button></form></section></div>}{showCert&&deal&&offer&&<AgreementCertificateModal deal={deal} offer={offer} onClose={()=>setShowCert(false)}/>}{busy&&<div className="busy" role="status">Working…</div>}</div>;
}
function format(k:string,v:unknown){return k==='amount_cents'?money(Number(v)):Array.isArray(v)?v.join(' · '):String(v);}
function ProposalForm({terms:t,busy,submit}:{terms:Terms;busy:boolean;submit:(t:Terms)=>Promise<void>}){return <form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void submit({deliverables:lines(String(f.get('deliverables'))),exclusions:lines(String(f.get('exclusions'))),amount_cents:Math.round(Number(f.get('amount'))*100),delivery_days:Number(f.get('days')),revisions:Number(f.get('revisions')),currency:'USD',payment_terms:initial.payment_terms});}}><label>Deliverables · one per line<textarea name="deliverables" defaultValue={t.deliverables.join('\n')} required rows={4}/></label><label>Exclusions · one per line<textarea name="exclusions" defaultValue={t.exclusions.join('\n')} rows={2}/></label><div className="form-row"><label>Amount (USD)<input name="amount" type="number" min="0.01" max="1000000" step="0.01" required defaultValue={t.amount_cents/100}/></label><label>Delivery days<input name="days" type="number" min="1" max="365" required defaultValue={t.delivery_days}/></label><label>Revision rounds<input name="revisions" type="number" min="0" max="20" required defaultValue={t.revisions}/></label></div><p>Full payment upfront; delivery timing starts after payment.</p><button className="primary" disabled={busy}>Submit proposal for review</button></form>}

function BrandHeader(){
  return (
    <header className="entry-header">
      <a className="brand" href="/" aria-label="DealPilot AI Home">
        <span className="mark" aria-hidden="true">D↗</span>
        DealPilot<span className="ai">AI</span>
      </a>
      <div className="badge sandbox-badge">
        <span className="badge-dot" aria-hidden="true"/>
        <span>Sandbox demo</span>
      </div>
    </header>
  );
}

function AgreementPreview(){
  return (
    <section className="preview-container" aria-label="Illustrative agreement preview">
      <div className="preview-banner">
        <span className="preview-banner-tag">SAMPLE</span>
        <span className="preview-banner-text">Illustrative example — not a real deal.</span>
      </div>
      <div className="preview-card">
        <div className="preview-card-header">
          <div>
            <span className="preview-eyebrow">PROJECT</span>
            <h2 className="preview-title">Portfolio website</h2>
          </div>
          <span className="preview-version-pill">Version 2</span>
        </div>

        <div className="preview-pricing-block">
          <div className="preview-amount">
            <span className="preview-amount-val">$250</span>
            <span className="preview-currency">USD</span>
          </div>
          <div className="preview-change-summary" title="Change summary">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2.5 8h11M9.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>5 pages → 3 pages · $300 → $250</span>
          </div>
        </div>

        <div className="preview-deliverables-block">
          <span className="preview-subheading">Included scope</span>
          <ul className="preview-deliverables-list">
            <li>
              <span className="preview-check-icon" aria-hidden="true"><CheckIcon/></span>
              <span>3 pages</span>
            </li>
            <li>
              <span className="preview-check-icon" aria-hidden="true"><CheckIcon/></span>
              <span>Responsive layout</span>
            </li>
            <li>
              <span className="preview-check-icon" aria-hidden="true"><CheckIcon/></span>
              <span>Contact form</span>
            </li>
          </ul>
        </div>

        <div className="preview-meta-row">
          <div className="preview-meta-item">
            <small>Delivery</small>
            <b>7 days after payment</b>
          </div>
          <div className="preview-meta-item">
            <small>Revisions</small>
            <b>1 round</b>
          </div>
        </div>

        <div className="preview-divider" />

        <div className="preview-statuses">
          <div className="preview-status-line">
            <span className="preview-status-label">Approval status</span>
            <span className="preview-pill awaiting">
              <span className="status-indicator-amber" aria-hidden="true"/>
              Awaiting both approvals
            </span>
          </div>
          <div className="preview-status-line">
            <span className="preview-status-label">Payment status</span>
            <span className="preview-pill not-started">
              <span className="status-indicator-gray" aria-hidden="true"/>
              Not started
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkspaceAccessCard({
  entry,
  setEntry,
  showCode,
  setShowCode,
  busy,
  error,
  health,
  onSubmit,
}:{
  entry:string;
  setEntry:(v:string)=>void;
  showCode:boolean;
  setShowCode:(v:boolean)=>void;
  busy:boolean;
  error:string;
  health:string;
  onSubmit:(e:FormEvent)=>void;
}){
  return (
    <section className="card access-card" aria-labelledby="access-title">
      <span className="eyebrow">YOUR WORKSPACE</span>
      <h2 id="access-title" className="access-title">Open your workspace</h2>
      <p className="access-desc">Use your private access code, or open the invitation shared with you.</p>

      <form onSubmit={onSubmit} className="access-form">
        <label htmlFor="workspace-code" className="access-label">
          Workspace access code
          <span className="sr-only"> / Private access token</span>
        </label>
        <div className="access-input-wrap">
          <input
            id="workspace-code"
            type={showCode?'text':'password'}
            autoComplete="off"
            value={entry}
            onChange={e=>setEntry(e.target.value)}
            required
            minLength={32}
            placeholder="Paste your 32+ character code…"
            aria-describedby="code-helper"
            className="access-input"
          />
          <button
            type="button"
            className="toggle-visibility-btn"
            onClick={()=>setShowCode(!showCode)}
            aria-label={showCode?'Hide access code':'Show access code'}
            aria-pressed={showCode}
            title={showCode?'Hide access code':'Show access code'}
          >
            {showCode?<EyeSlashIcon/>:<EyeIcon/>}
          </button>
        </div>
        <p id="code-helper" className="helper-text">Your freelancer code or client invitation code.</p>

        <button disabled={busy} className="primary open-workspace-btn" type="submit">
          {busy?'Connecting…':(
            <>
              <span>Open workspace</span>
              <ArrowRightIcon/>
            </>
          )}
        </button>
      </form>

      {error&&<div className="error" role="alert">{error}</div>}

      <details className="setup-details">
        <summary className="setup-summary">Setup help</summary>
        <div className="setup-body">
          <p>Follow <code>README.md</code> to start the backend and configure <code>WORKSPACE_TOKEN</code> in <code>backend/.env</code>. Keep your token private.</p>
          <div className="health-status-row">
            <span className={`health-dot ${health==='API connected'?'connected':health==='Connecting'?'connecting':'offline'}`} aria-hidden="true"/>
            <span>{health} · Single-freelancer demo</span>
          </div>
        </div>
      </details>
    </section>
  );
}

function EyeIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeSlashIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function ArrowRightIcon(){
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.333 8h9.334M8.667 4l4 4-4 4"/>
    </svg>
  );
}

function CheckIcon(){
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#176B52" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.333 4L6 11.333 2.667 8"/>
    </svg>
  );
}

function AgreementCertificateModal({deal,offer,onClose}:{deal:Deal;offer:any;onClose:()=>void}){
  return (
    <div className="modal-backdrop cert-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <section className="card modal cert-modal" role="dialog" aria-modal="true" aria-labelledby="cert-title">
        <div className="cert-actions-top">
          <button type="button" className="primary" onClick={()=>window.print()}>🖨 Print / Save as PDF</button>
          <button type="button" onClick={onClose}>✕ Close</button>
        </div>
        
        <article className="cert-document" id="printable-certificate">
          <header className="cert-header">
            <div className="cert-brand">
              <span className="mark" aria-hidden="true">D↗</span>
              <div>
                <h2 id="cert-title">DealPilot<span className="ai">AI</span></h2>
                <small>Official Agreement & Execution Record</small>
              </div>
            </div>
            <div className={`cert-status-badge ${deal.status==='paid'?'paid':'approved'}`}>
              {deal.status==='paid'?'● VERIFIED & PAID (PayPal Sandbox)':'● MUTUALLY APPROVED AGREEMENT'}
            </div>
          </header>

          <div className="cert-deal-meta">
            <div>
              <small>PROJECT TITLE</small>
              <h3>{deal.title}</h3>
            </div>
            <div>
              <small>DEAL ID</small>
              <code>{deal.id}</code>
            </div>
            <div>
              <small>PROPOSAL VERSION</small>
              <b>Version {offer.version}</b>
            </div>
          </div>

          <div className="cert-parties-grid">
            <div className="cert-party-box">
              <span className="cert-role-tag">FREELANCER</span>
              <h4>{deal.freelancer}</h4>
              <p className="cert-approved-check">✓ Digital approval recorded</p>
            </div>
            <div className="cert-party-box">
              <span className="cert-role-tag">CLIENT</span>
              <h4>{deal.client}</h4>
              <p className="cert-approved-check">✓ Digital approval recorded</p>
            </div>
          </div>

          <section className="cert-section">
            <h4>Agreed Terms & Compensation</h4>
            <div className="cert-price-row">
              <span className="cert-amount">{money(offer.terms.amount_cents)} USD</span>
              <span className="cert-payment-rule">{offer.terms.payment_terms}</span>
            </div>
            <div className="cert-meta-row">
              <div><small>Estimated Delivery</small><b>{offer.terms.delivery_days} days after payment</b></div>
              <div><small>Included Revision Rounds</small><b>{offer.terms.revisions}</b></div>
            </div>
          </section>

          <section className="cert-section">
            <h4>Included Scope Deliverables</h4>
            <ul className="cert-deliverables">
              {offer.terms.deliverables.map((item:string,i:number)=>(
                <li key={i}>✓ {item}</li>
              ))}
            </ul>
          </section>

          {offer.terms.exclusions&&offer.terms.exclusions.length>0&&(
            <section className="cert-section">
              <h4>Explicit Exclusions (Out of Scope)</h4>
              <ul className="cert-exclusions">
                {offer.terms.exclusions.map((item:string,i:number)=>(
                  <li key={i}>✕ {item}</li>
                ))}
              </ul>
            </section>
          )}

          {deal.payment&&(
            <section className="cert-section cert-payment-box">
              <h4>PayPal Sandbox Transaction Verification</h4>
              <div className="cert-pay-grid">
                <div><small>Status</small><b>{deal.payment.status.toUpperCase()}</b></div>
                <div><small>PayPal Order ID</small><code>{deal.payment.order_id||'N/A'}</code></div>
                <div><small>PayPal Capture ID</small><code>{deal.payment.capture_id||'N/A'}</code></div>
                <div><small>Captured Timestamp</small><b>{deal.payment.paid_at?new Date(deal.payment.paid_at).toLocaleString():'Pending'}</b></div>
              </div>
            </section>
          )}

          <footer className="cert-footer">
            <p>Certified agreement executed through DealPilot AI. All proposals, deltas, and independent approvals are immutably logged on the platform audit trail.</p>
          </footer>
        </article>
      </section>
    </div>
  );
}
