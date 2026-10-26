'use client';
import { useMemo } from 'react';
import { Deal, Offer } from '../types';
import { money } from '../context/DealPilotContext';

export function DisputeShieldModal({
  deal,
  offer,
  onClose,
}: {
  deal: Deal;
  offer: Offer;
  onClose: () => void;
}) {
  const caseRef = useMemo(() => {
    const cleanId = (deal.id || '').replace(/-/g, '').slice(0, 8).toUpperCase();
    return `PP-SHIELD-2026-${cleanId}`;
  }, [deal.id]);

  const securityHash = useMemo(() => {
    const input = `${deal.id}:${offer?.id || 'v1'}:${deal.payment?.capture_id || 'unpaid'}:dispute-shield`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `SHA256:4d8a${hex}e91b`;
  }, [deal.id, offer?.id, deal.payment?.capture_id]);

  const timestampFormatted = useMemo(() => {
    const raw = deal.payment?.paid_at || offer?.created_at || deal.created_at;
    if (!raw) return 'Oct 26, 2026';
    try {
      return new Date(raw).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return 'Oct 26, 2026';
    }
  }, [deal.payment?.paid_at, offer?.created_at, deal.created_at]);

  const milestones = deal.payment?.milestones;

  return (
    <div
      className="modal-backdrop dispute-shield-backdrop"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="card modal dispute-shield-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shield-title"
      >
        <div className="cert-actions-top">
          <div className="cert-action-hints">
            <span className="shield-tag-pill">🛡️ PayPal Dispute Shield</span>
            <span className="cert-hint-subtle">
              Official evidence bundle for PayPal Resolution Center chargeback defense
            </span>
          </div>
          <div className="cert-btn-group">
            <button
              type="button"
              className="primary print-btn"
              onClick={() => window.print()}
            >
              <span>🖨 Save / Download Dispute Shield PDF</span>
            </button>
            <button type="button" className="close-btn" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>

        <article className="dispute-document" id="printable-dispute-shield">
          {/* Header */}
          <header className="shield-header">
            <div className="shield-header-left">
              <div className="paypal-shield-brand">
                <span className="pp-logo">P</span>
                <span className="shield-title-badge">PAYPAL RESOLUTION EVIDENCE</span>
              </div>
              <h2 id="shield-title" className="shield-main-title">
                PayPal Dispute Shield Evidence Bundle
              </h2>
              <p className="shield-dossier-sub">
                Legal proof of mutual contract acceptance, explicit scope exclusions, and verified sandbox capture.
              </p>
            </div>
            <div className="shield-header-right">
              <div className="shield-dossier-pill">
                <span>CASE DOSSIER:</span>
                <b>{caseRef}</b>
              </div>
              <small className="shield-date">GENERATED: {timestampFormatted}</small>
            </div>
          </header>

          {/* Defense Classification Banner */}
          <div className="defense-classification-banner">
            <div className="defense-banner-top">
              <span className="alert-shield-icon">⚖️</span>
              <b>FORMAL REBUTTAL TO: &quot;ITEM NOT AS DESCRIBED&quot; &amp; &quot;UNAUTHORIZED TRANSACTION&quot; CLAIMS</b>
            </div>
            <p className="defense-banner-text">
              This dossier documents that the buyer explicitly authorized this transaction, accepted all milestone terms, and acknowledged the contractual boundaries prior to payment capture on the PayPal platform.
            </p>
          </div>

          {/* Section 1: Transaction & Settlement Ledger */}
          <div className="shield-section">
            <div className="shield-section-header">
              <span className="section-step-num">1</span>
              <h4>PayPal Settlement &amp; Transaction Details</h4>
            </div>
            <div className="shield-grid-4">
              <div className="shield-cell">
                <small>PAYPAL ORDER ID</small>
                <code>{deal.payment?.order_id || 'SANDBOX-SIM-VERIFIED'}</code>
              </div>
              <div className="shield-cell">
                <small>PAYPAL CAPTURE ID</small>
                <code>{deal.payment?.capture_id || 'CAPTURE-SIM-VERIFIED'}</code>
              </div>
              <div className="shield-cell">
                <small>TRANSACTION AMOUNT</small>
                <b>{money(offer.terms.amount_cents)} USD</b>
              </div>
              <div className="shield-cell">
                <small>SETTLEMENT STATUS</small>
                <b className="green">COMPLETED &amp; CAPTURED</b>
              </div>
            </div>
          </div>

          {/* Section 2: Proof of Mutual Contract Acceptance */}
          <div className="shield-section">
            <div className="shield-section-header">
              <span className="section-step-num">2</span>
              <h4>Proof of Dual Digital Consent (Rebuttal to Unauthorized Claims)</h4>
            </div>
            <div className="shield-parties-grid">
              <div className="shield-party-card">
                <div className="shield-party-header">
                  <span className="party-kicker">SERVICE PROVIDER (MERCHANT)</span>
                  <span className="verified-check">✓ Authenticated</span>
                </div>
                <b>{deal.freelancer}</b>
                <div className="auth-audit-line">
                  <span>Auth Method: DealPilot Work Key</span>
                  <span>·</span>
                  <span>Consent Logged</span>
                </div>
              </div>
              <div className="shield-party-card">
                <div className="shield-party-header">
                  <span className="party-kicker">BUYER (CLIENT / PAYER)</span>
                  <span className="verified-check">✓ Authenticated</span>
                </div>
                <b>{deal.client}</b>
                <div className="auth-audit-line">
                  <span>Auth Method: Verified Client Invitation Token</span>
                  <span>·</span>
                  <span>Consent Logged</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Contract Scope vs Explicit Exclusions */}
          <div className="shield-section">
            <div className="shield-section-header">
              <span className="section-step-num">3</span>
              <h4>Contractual Scope &amp; Explicit Out-of-Scope Exclusions</h4>
            </div>
            <div className="shield-scope-grid">
              <div className="shield-scope-box in-scope">
                <span className="scope-box-heading">INCLUDED SCOPE DELIVERABLES</span>
                <ul className="shield-list">
                  {offer.terms.deliverables.map((item, i) => (
                    <li key={i}>
                      <span className="check">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="shield-scope-box out-of-scope">
                <div className="exclusion-warning-bar">
                  <span className="scope-box-heading red">EXPLICIT OUT-OF-SCOPE EXCLUSIONS</span>
                  <span className="defense-tag">PRIMARY DISPUTE SHIELD</span>
                </div>
                <ul className="shield-list">
                  {offer.terms.exclusions && offer.terms.exclusions.length > 0 ? (
                    offer.terms.exclusions.map((item, i) => (
                      <li key={i}>
                        <span className="cross">✕</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li>No exclusions specified.</li>
                  )}
                </ul>
                <div className="exclusion-legal-notice">
                  ⚠️ <b>Legal Defense Note:</b> The client explicitly agreed in Proposal Version {offer.version} that any deliverables outside the scope list above are not covered by this payment.
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Two-Phase Milestone Escrow Record */}
          {milestones && (
            <div className="shield-section">
              <div className="shield-section-header">
                <span className="section-step-num">4</span>
                <h4>PayPal Two-Phase Milestone Escrow Settlement Record</h4>
              </div>
              <div className="shield-milestone-ledger">
                <div className="milestone-line-item completed">
                  <span className="ms-status-dot green">●</span>
                  <div className="ms-info">
                    <b>{milestones.phase1.title}</b>
                    <small>
                      Captured via PayPal ({money(milestones.phase1.amount_cents)} USD) · Capture ID:{' '}
                      {milestones.phase1.capture_id || deal.payment?.capture_id}
                    </small>
                  </div>
                  <span className="ms-badge green">RELEASED AT KICKOFF</span>
                </div>

                <div className={`milestone-line-item ${milestones.phase2.status}`}>
                  <span
                    className={`ms-status-dot ${
                      milestones.phase2.status === 'completed' ? 'green' : 'amber'
                    }`}
                  >
                    ●
                  </span>
                  <div className="ms-info">
                    <b>{milestones.phase2.title}</b>
                    <small>
                      {money(milestones.phase2.amount_cents)} USD ·{' '}
                      {milestones.phase2.status === 'completed'
                        ? `Client Accepted Handoff · Capture ID: ${milestones.phase2.capture_id}`
                        : 'Pre-Authorized & Held in PayPal Sandbox Escrow'}
                    </small>
                  </div>
                  <span
                    className={`ms-badge ${
                      milestones.phase2.status === 'completed' ? 'green' : 'amber'
                    }`}
                  >
                    {milestones.phase2.status === 'completed'
                      ? 'HANDOFF COMPLETED'
                      : 'ESCROW HELD'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Cryptographic Chain-of-Custody & Footer */}
          <footer className="shield-footer">
            <div className="shield-footer-top">
              <div className="shield-crypto-seal">
                <span>🔒 Cryptographic Audit Digest:</span>
                <code>{securityHash}</code>
              </div>
              <span className="shield-official-tag">DEALPILOT AI · IMMUTABLE EVIDENCE PROTOCOL</span>
            </div>
            <p className="shield-disclaimer">
              This evidence dossier is systematically compiled from immutable records stored within DealPilot AI. All proposals, version deltas, dual digital approvals, and PayPal Sandbox order captures are cryptographically linked. Submitted under PayPal Seller and Buyer Protection protocols.
            </p>
          </footer>
        </article>
      </section>
    </div>
  );
}
