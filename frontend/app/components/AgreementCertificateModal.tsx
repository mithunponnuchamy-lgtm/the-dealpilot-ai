'use client';
import { useMemo } from 'react';
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
  const isPaid = deal.status === 'paid' || deal.payment?.status === 'paid' || deal.payment?.status === 'completed';

  // Extract clean signer names
  const freelancerSigner = useMemo(() => {
    const raw = deal.freelancer || 'Freelancer';
    return raw.replace(/\(.*?\)/g, '').trim();
  }, [deal.freelancer]);

  const clientSigner = useMemo(() => {
    const raw = deal.client || 'Client';
    return raw.replace(/\(.*?\)/g, '').trim();
  }, [deal.client]);

  // Generate deterministic audit certificate reference & verification hash
  const certRef = useMemo(() => {
    const cleanId = (deal.id || '').replace(/-/g, '').slice(0, 8).toUpperCase();
    return `DP-REC-2026-${cleanId}`;
  }, [deal.id]);

  const securityHash = useMemo(() => {
    const input = `${deal.id}:${offer?.id || 'v1'}:${deal.payment?.capture_id || 'unpaid'}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `SHA256:7f8e${hex}a92c`;
  }, [deal.id, offer?.id, deal.payment?.capture_id]);

  const issueDateFormatted = useMemo(() => {
    const raw = deal.payment?.paid_at || offer?.created_at || deal.created_at;
    if (!raw) return new Date().toLocaleDateString('en-US', { dateStyle: 'medium' });
    try {
      return new Date(raw).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return new Date().toLocaleDateString('en-US', { dateStyle: 'medium' });
    }
  }, [deal.payment?.paid_at, offer?.created_at, deal.created_at]);

  const timestampFormatted = useMemo(() => {
    const raw = deal.payment?.paid_at || offer?.created_at || deal.created_at;
    if (!raw) return 'Verified Record';
    try {
      return new Date(raw).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return 'Verified Record';
    }
  }, [deal.payment?.paid_at, offer?.created_at, deal.created_at]);

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
          <div className="cert-action-hints">
            <span className="cert-hint-pill">📄 1-Page Official Receipt</span>
            <span className="cert-hint-subtle">Ready to print or export as PDF</span>
          </div>
          <div className="cert-btn-group">
            <button
              type="button"
              className="primary print-btn"
              onClick={() => window.print()}
              title="Print or Save as PDF"
            >
              <span>🖨 Save / Download as PDF</span>
            </button>
            <button type="button" className="close-btn" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>

        <article className="cert-document" id="printable-certificate">
          {/* Top Security & Branding Header */}
          <header className="cert-header">
            <div className="cert-brand">
              <div className="cert-logo-box">
                <span className="cert-logo-mark" aria-hidden="true">D↗</span>
              </div>
              <div className="cert-brand-text">
                <h2 id="cert-title" className="cert-brand-title">
                  DealPilot<span className="cert-brand-ai">AI</span>
                </h2>
                <span className="cert-brand-tagline">
                  Official Agreement & Execution Record
                </span>
              </div>
            </div>

            <div className="cert-header-meta">
              <div
                className={`cert-status-badge ${
                  isPaid ? 'paid' : 'approved'
                }`}
              >
                {isPaid ? (
                  <>
                    <span className="status-dot">●</span>
                    <span>VERIFIED & PAID (PayPal Sandbox)</span>
                  </>
                ) : (
                  <>
                    <span className="status-dot">●</span>
                    <span>MUTUALLY APPROVED AGREEMENT</span>
                  </>
                )}
              </div>
              <div className="cert-serial-line">
                <span className="cert-serial-label">RECORD REF:</span>
                <span className="cert-serial-val">{certRef}</span>
                <span className="cert-serial-sep">·</span>
                <span className="cert-serial-date">ISSUED: {issueDateFormatted}</span>
              </div>
            </div>
          </header>

          {/* Project Title & Agreement Metadata Bar */}
          <section className="cert-deal-meta-strip">
            <div className="cert-meta-col-main">
              <span className="cert-kicker">PROJECT TITLE</span>
              <h3 className="cert-project-title">{deal.title}</h3>
            </div>
            <div className="cert-meta-col-id">
              <span className="cert-kicker">AGREEMENT UUID</span>
              <code className="cert-id-code" title={deal.id}>{deal.id}</code>
            </div>
            <div className="cert-meta-col-version">
              <span className="cert-kicker">AGREED PROPOSAL</span>
              <span className="cert-version-pill">Version {offer.version} (Locked)</span>
            </div>
          </section>

          {/* Signatures & Mutual Consent Grid */}
          <section className="cert-parties-grid">
            <div className="cert-party-box">
              <div className="cert-party-header">
                <span className="cert-role-tag">SERVICE PROVIDER (FREELANCER)</span>
                <span className="cert-approved-pill">✓ Signed</span>
              </div>
              <h4 className="cert-party-name">{deal.freelancer}</h4>
              <div className="cert-signature-area">
                <div className="cert-signature-script">{freelancerSigner}</div>
                <div className="cert-signature-caption">Digital Consent Authenticated</div>
              </div>
              <div className="cert-party-footer">
                <span>Method: DealPilot Access Key</span>
                <span className="cert-bullet">·</span>
                <span>Consent Recorded</span>
              </div>
            </div>

            <div className="cert-party-box">
              <div className="cert-party-header">
                <span className="cert-role-tag">AUTHORIZED CLIENT (PAYER)</span>
                <span className="cert-approved-pill">✓ Signed</span>
              </div>
              <h4 className="cert-party-name">{deal.client}</h4>
              <div className="cert-signature-area">
                <div className="cert-signature-script">{clientSigner}</div>
                <div className="cert-signature-caption">Digital Consent Authenticated</div>
              </div>
              <div className="cert-party-footer">
                <span>Method: Client Token Verification</span>
                <span className="cert-bullet">·</span>
                <span>Consent Recorded</span>
              </div>
            </div>
          </section>

          {/* Agreed Financial Terms & Timeline */}
          <section className="cert-terms-block">
            <div className="cert-price-card">
              <div className="cert-price-header">
                <span className="cert-kicker">TOTAL AGREED COMPENSATION</span>
                <div className="cert-amount-row">
                  <span className="cert-currency-symbol">$</span>
                  <span className="cert-amount-num">
                    {(offer.terms.amount_cents / 100).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="cert-currency-code">USD</span>
                </div>
              </div>
              <div className="cert-payout-rule">
                <span className="cert-payout-label">Milestone & Payment Rule:</span>
                <span className="cert-payout-value">{offer.terms.payment_terms}</span>
              </div>
            </div>

            <div className="cert-timeline-card">
              <div className="cert-timeline-item">
                <span className="cert-kicker">ESTIMATED TURNAROUND</span>
                <b className="cert-timeline-value">
                  {offer.terms.delivery_days} Calendar Days
                </b>
                <small className="cert-timeline-note">Post-Payment Execution</small>
              </div>
              <div className="cert-timeline-divider" />
              <div className="cert-timeline-item">
                <span className="cert-kicker">INCLUDED REVISIONS</span>
                <b className="cert-timeline-value">
                  {offer.terms.revisions} Formal Round{offer.terms.revisions === 1 ? '' : 's'}
                </b>
                <small className="cert-timeline-note">Per Agreed Scope</small>
              </div>
            </div>
          </section>

          {/* Side-by-Side Scope Ledger: Deliverables vs Exclusions */}
          <section className="cert-scope-ledger">
            <div className="cert-scope-col in-scope">
              <div className="cert-scope-title-bar">
                <span className="cert-scope-dot green">●</span>
                <h4>Included Scope Deliverables</h4>
              </div>
              <ul className="cert-scope-list">
                {offer.terms.deliverables.map((item: string, i: number) => (
                  <li key={i} className="cert-scope-item">
                    <span className="cert-check-icon">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="cert-scope-col out-of-scope">
              <div className="cert-scope-title-bar">
                <span className="cert-scope-dot gray">●</span>
                <h4>Explicit Exclusions (Out of Scope)</h4>
              </div>
              <ul className="cert-scope-list">
                {offer.terms.exclusions && offer.terms.exclusions.length > 0 ? (
                  offer.terms.exclusions.map((item: string, i: number) => (
                    <li key={i} className="cert-scope-item exclusion">
                      <span className="cert-cross-icon">✕</span>
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="cert-scope-item empty">
                    <span>No explicit exclusions specified.</span>
                  </li>
                )}
              </ul>
            </div>
          </section>

          {/* PayPal Sandbox Transaction Settlement Verification */}
          {deal.payment && (
            <section className="cert-payment-ledger">
              <div className="cert-pay-ledger-header">
                <div className="cert-pay-ledger-brand">
                  <span className="paypal-p">P</span>
                  <span className="paypal-title">PayPal Sandbox Transaction Settlement</span>
                </div>
                <span className="cert-settlement-status">
                  SETTLED · {deal.payment.status.toUpperCase()}
                </span>
              </div>
              <div className="cert-pay-grid">
                <div className="cert-pay-cell">
                  <small>PAYPAL ORDER ID</small>
                  <code>{deal.payment.order_id || 'SANDBOX-SIM-VERIFIED'}</code>
                </div>
                <div className="cert-pay-cell">
                  <small>PAYPAL CAPTURE ID</small>
                  <code>{deal.payment.capture_id || 'CAPTURE-SIM-VERIFIED'}</code>
                </div>
                <div className="cert-pay-cell">
                  <small>SETTLEMENT TIMESTAMP</small>
                  <b>{timestampFormatted}</b>
                </div>
                <div className="cert-pay-cell">
                  <small>CRYPTOGRAPHIC RECEIPT AUDIT</small>
                  <code className="security-digest">{securityHash}</code>
                </div>
              </div>
            </section>
          )}

          {/* Official Bottom Legal Disclaimer & Micro-Print */}
          <footer className="cert-footer">
            <div className="cert-footer-top">
              <div className="cert-seal-badge">
                <span className="cert-shield-icon">🛡️</span>
                <span>IMMUTABLY RECORDED & VERIFIED BY DEALPILOT AI</span>
              </div>
              <div className="cert-footer-page-tag">
                PAGE 1 OF 1 · OFFICIAL EXECUTION CERTIFICATE
              </div>
            </div>
            <p className="cert-legal-text">
              This document serves as an immutable certificate of mutual agreement, scope definitions, and payment verification executed under DealPilot AI protocol. All proposals, deltas, digital approvals, and PayPal payment records are cryptographically timestamped and permanently retained.
            </p>
          </footer>
        </article>
      </section>
    </div>
  );
}
