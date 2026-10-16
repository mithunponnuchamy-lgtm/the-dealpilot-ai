'use client';
import { Deal } from '../types';
import { money } from '../context/DealPilotContext';

export function AgreementCertificateModal({
  deal,
  offer,
  onClose,
}: {
  deal: Deal;
  offer: any;
  onClose: () => void;
}) {
  return (
    <div
      className="modal-backdrop cert-backdrop"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="card modal cert-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cert-title"
      >
        <div className="cert-actions-top">
          <button type="button" className="primary" onClick={() => window.print()}>
            🖨 Print / Save as PDF
          </button>
          <button type="button" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        <article className="cert-document" id="printable-certificate">
          <header className="cert-header">
            <div className="cert-brand">
              <span className="mark" aria-hidden="true">D↗</span>
              <div>
                <h2 id="cert-title">
                  DealPilot<span className="ai">AI</span>
                </h2>
                <small>Official Agreement & Execution Record</small>
              </div>
            </div>
            <div
              className={`cert-status-badge ${
                deal.status === 'paid' ? 'paid' : 'approved'
              }`}
            >
              {deal.status === 'paid'
                ? '● VERIFIED & PAID (PayPal Sandbox)'
                : '● MUTUALLY APPROVED AGREEMENT'}
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
              <span className="cert-amount">
                {money(offer.terms.amount_cents)} USD
              </span>
              <span className="cert-payment-rule">
                {offer.terms.payment_terms}
              </span>
            </div>
            <div className="cert-meta-row">
              <div>
                <small>Estimated Delivery</small>
                <b>{offer.terms.delivery_days} days after payment</b>
              </div>
              <div>
                <small>Included Revision Rounds</small>
                <b>{offer.terms.revisions}</b>
              </div>
            </div>
          </section>

          <section className="cert-section">
            <h4>Included Scope Deliverables</h4>
            <ul className="cert-deliverables">
              {offer.terms.deliverables.map((item: string, i: number) => (
                <li key={i}>✓ {item}</li>
              ))}
            </ul>
          </section>

          {offer.terms.exclusions && offer.terms.exclusions.length > 0 && (
            <section className="cert-section">
              <h4>Explicit Exclusions (Out of Scope)</h4>
              <ul className="cert-exclusions">
                {offer.terms.exclusions.map((item: string, i: number) => (
                  <li key={i}>✕ {item}</li>
                ))}
              </ul>
            </section>
          )}

          {deal.payment && (
            <section className="cert-section cert-payment-box">
              <h4>PayPal Sandbox Transaction Verification</h4>
              <div className="cert-pay-grid">
                <div>
                  <small>Status</small>
                  <b>{deal.payment.status.toUpperCase()}</b>
                </div>
                <div>
                  <small>PayPal Order ID</small>
                  <code>{deal.payment.order_id || 'N/A'}</code>
                </div>
                <div>
                  <small>PayPal Capture ID</small>
                  <code>{deal.payment.capture_id || 'N/A'}</code>
                </div>
                <div>
                  <small>Captured Timestamp</small>
                  <b>
                    {deal.payment.paid_at
                      ? new Date(deal.payment.paid_at).toLocaleString()
                      : 'Pending'}
                  </b>
                </div>
              </div>
            </section>
          )}

          <footer className="cert-footer">
            <p>
              Certified agreement executed through DealPilot AI. All proposals,
              deltas, and independent approvals are immutably logged on the
              platform audit trail.
            </p>
          </footer>
        </article>
      </section>
    </div>
  );
}
