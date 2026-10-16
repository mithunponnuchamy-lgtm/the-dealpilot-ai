'use client';
import { CheckIcon } from './Icons';

export function AgreementPreview() {
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
              <path d="M2.5 8h11M9.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>5 pages → 3 pages · $300 → $250</span>
          </div>
        </div>

        <div className="preview-deliverables-block">
          <span className="preview-subheading">Included scope</span>
          <ul className="preview-deliverables-list">
            <li>
              <span className="preview-check-icon" aria-hidden="true"><CheckIcon /></span>
              <span>3 pages</span>
            </li>
            <li>
              <span className="preview-check-icon" aria-hidden="true"><CheckIcon /></span>
              <span>Responsive layout</span>
            </li>
            <li>
              <span className="preview-check-icon" aria-hidden="true"><CheckIcon /></span>
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
              <span className="status-indicator-amber" aria-hidden="true" />
              Awaiting both approvals
            </span>
          </div>
          <div className="preview-status-line">
            <span className="preview-status-label">Payment status</span>
            <span className="preview-pill not-started">
              <span className="status-indicator-gray" aria-hidden="true" />
              Not started
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
