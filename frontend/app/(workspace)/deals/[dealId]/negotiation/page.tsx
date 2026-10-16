'use client';
import { use, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useDealPilot, money, initialTerms } from '@/context/DealPilotContext';
import { TaskActionBar } from '@/components/TaskActionBar';

export default function NegotiationPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = use(params);
  const router = useRouter();
  const {
    deal,
    offer,
    api,
    mutateDeal,
    runAction,
    actionLoading,
    suggestion,
    setSuggestion,
    configured,
    setDraftProposalTerms,
    setNavDirection,
  } = useDealPilot();

  if (!deal) return null;

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const text = String(new FormData(form).get('message') || '').trim();
    if (!text) return;

    try {
      await runAction('Sending message…', async () => {
        await mutateDeal('/messages', { text });
        form.reset();
      });
    } catch {
      // Error is set in context
    }
  };

  const handleAnalyzeRisks = async () => {
    try {
      await runAction('Analyzing proposal risks with AI…', async () => {
        const data = await api(`/deals/${dealId}/suggest`, 'POST');
        setSuggestion(data);
      });
    } catch {
      // Error is set in context
    }
  };

  return (
    <div className="task-page-container">
      {offer && (
        <div className="compact-offer-summary">
          <div>
            <span className="eyebrow" style={{ margin: 0 }}>ACTIVE PROPOSAL</span>
            <b>Version {offer.version} · {money(offer.terms.amount_cents)} USD</b>
          </div>
          <span className="subtle">
            {offer.terms.delivery_days} days delivery · {offer.terms.revisions} revision rounds
          </span>
        </div>
      )}

      <div className="stack">
        <section className="card" aria-labelledby="convo-heading">
          <div className="section-heading">
            <div>
              <span className="eyebrow">STEP 2 OF 5</span>
              <h2 id="convo-heading">Conversation & activity</h2>
            </div>
            <span className="badge">{deal.events.length} messages</span>
          </div>

          <div className="timeline">
            {deal.events.map((e, i) => (
              <article key={i}>
                <span className="timeline-dot" />
                <div>
                  <b>{e.role}</b>
                  <time>{new Date(e.created_at).toLocaleString()}</time>
                  <p>{e.message}</p>
                </div>
              </article>
            ))}
          </div>

          <form onSubmit={handleSendMessage}>
            <label htmlFor="message-input">
              Message
              <textarea
                id="message-input"
                name="message"
                rows={2}
                required
                maxLength={2000}
                placeholder="Ask a question, request a change, or negotiate terms…"
              />
            </label>
            <div style={{ marginTop: '10px' }}>
              <button disabled={Boolean(actionLoading)} className="primary">
                Send message
              </button>
            </div>
          </form>
        </section>

        <section className="card" aria-labelledby="ai-heading">
          <div className="section-heading">
            <div>
              <span className="eyebrow">AI INTELLIGENCE</span>
              <h2 id="ai-heading">
                Deal Risk & Trade-off Review <span className="ai">AI</span>
              </h2>
            </div>
            {configured.ai_provider && (
              <span className="badge">{configured.ai_provider}</span>
            )}
          </div>

          <p>
            Evaluate active terms for scope creep, pricing disparity, and compressed delivery.
          </p>

          <button
            type="button"
            disabled={Boolean(actionLoading) || !offer}
            onClick={() => void handleAnalyzeRisks()}
          >
            {actionLoading === 'Analyzing proposal risks with AI…'
              ? 'Analyzing proposal…'
              : '✧ Analyze risks & generate options'}
          </button>

          {suggestion && (
            <div className="ai-result">
              <p>
                <b>Assessment:</b> {suggestion.recommendation}
              </p>

              {suggestion.risks && suggestion.risks.length > 0 && (
                <div className="risk-grid">
                  <h4>Detected Negotiation Risks ({suggestion.risks.length})</h4>
                  {suggestion.risks.map((r, i) => (
                    <div key={i} className={`risk-card ${r.severity}`}>
                      <div className="risk-header">
                        <h4>{r.title}</h4>
                        <span className={`badge ${r.severity}`}>
                          {r.severity.toUpperCase()} RISK
                        </span>
                      </div>
                      <p>{r.explanation}</p>
                      <div className="risk-rec">
                        <b>Recommended action:</b> {r.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {suggestion.options && suggestion.options.length > 0 && (
                <div className="option-grid">
                  <h4>AI Counteroffer Options</h4>
                  {suggestion.options.map((opt, i) => (
                    <div key={i} className="option-card">
                      <div className="option-header">
                        <div>
                          <b>{opt.name}</b>
                          <p style={{ margin: '2px 0 0', fontSize: '12px' }}>
                            {opt.summary}
                          </p>
                        </div>
                        <span className="option-price">{money(opt.amount_cents)}</span>
                      </div>
                      <div className="option-meta">
                        <span>⏱ {opt.delivery_days} days</span>
                        <span>🔄 {opt.revisions} revisions</span>
                        <span>📦 {opt.deliverables.length} deliverables</span>
                      </div>
                      <div className="option-reason">
                        <b>Reasoning:</b> {opt.reasoning}
                      </div>
                      {!deal.frozen && !deal.cancelled && (
                        <button
                          type="button"
                          className="apply-opt-btn"
                          onClick={() => {
                            setDraftProposalTerms(dealId, {
                              deliverables: opt.deliverables,
                              exclusions: opt.exclusions,
                              amount_cents: opt.amount_cents,
                              delivery_days: opt.delivery_days,
                              revisions: opt.revisions,
                              currency: 'USD',
                              payment_terms: initialTerms.payment_terms,
                            });
                            setNavDirection('forward');
                            router.push(`/deals/${dealId}/proposal`);
                          }}
                        >
                          Apply terms to proposal form ↓
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {suggestion.tradeoffs && suggestion.tradeoffs.length > 0 && (
                <div>
                  <b>Key Trade-offs:</b>
                  <ul>
                    {suggestion.tradeoffs.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}

              {suggestion.questions && suggestion.questions.length > 0 && (
                <div>
                  <b>Clarifications to Settle:</b>
                  <ul>
                    {suggestion.questions.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <TaskActionBar
          backHref={`/deals/${dealId}/brief`}
          backLabel="Brief"
          continueLabel="Go to proposal"
          continueDesc="Proceed to review or adjust proposed scope and price"
          onContinue={() => {
            setNavDirection('forward');
            router.push(`/deals/${dealId}/proposal`);
          }}
        />
      </div>
    </div>
  );
}
