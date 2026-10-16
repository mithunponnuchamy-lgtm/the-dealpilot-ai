'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDealPilot, money } from '../context/DealPilotContext';

export function NextActionPanel() {
  const pathname = usePathname();
  const { deal, offer, role, setShowCert, setNavDirection } = useDealPilot();

  if (!deal) return null;

  let stateClass = 'pending';
  let badge = 'Action required';
  let title = '';
  let desc = '';
  let actionNode: React.ReactNode = null;

  if (deal.status === 'paid') {
    stateClass = 'complete';
    badge = 'Verified & complete';
    title = 'Official agreement executed and PayPal Sandbox payment verified.';
    desc = 'The deliverables and price are locked. Digital signatures and transaction details are recorded.';
    actionNode = (
      <button className="primary" onClick={() => setShowCert(true)}>
        📄 View certificate
      </button>
    );
  } else if (deal.cancelled) {
    stateClass = 'pending';
    badge = 'Cancelled';
    title = 'This deal has been cancelled.';
    desc = 'No further proposals or payments can be made for this record.';
  } else if (offer && offer.approvals.length === 2) {
    stateClass = 'pending';
    if (role === 'client') {
      badge = 'Payment required';
      title = 'Next step: Complete Sandbox Payment';
      desc = `Both parties approved Version ${offer.version} (${money(offer.terms.amount_cents)}). Work begins once payment is verified.`;
      actionNode = (
        <Link
          href={`/deals/${deal.id}/payment`}
          className="primary continue-btn"
          onClick={() => setNavDirection('forward')}
        >
          <span>Go to checkout</span>
          <span>→</span>
        </Link>
      );
    } else {
      badge = 'Awaiting payment';
      title = `Next step: Awaiting ${deal.client} checkout`;
      desc = `Both parties approved Version ${offer.version}. The agreement will be marked paid once ${deal.client} completes PayPal Sandbox capture.`;
    }
  } else if (offer && !offer.rejected) {
    if (offer.approvals.includes(role)) {
      stateClass = 'pending';
      const counterparty = role === 'freelancer' ? deal.client : deal.freelancer;
      badge = 'Awaiting counterparty';
      title = `Next step: Awaiting ${counterparty} approval`;
      desc = `You approved Version ${offer.version}. Both parties must approve the exact terms before payment unlocks.`;
    } else {
      stateClass = 'pending';
      badge = 'Your approval needed';
      title = `Next step: Review Version ${offer.version} (${money(offer.terms.amount_cents)})`;
      desc = `Review the deliverables, timeline (${offer.terms.delivery_days} days), and payment terms, then approve or suggest changes.`;
      actionNode = (
        <Link
          href={`/deals/${deal.id}/review`}
          className="primary continue-btn"
          onClick={() => setNavDirection('forward')}
        >
          <span>Review terms</span>
          <span>→</span>
        </Link>
      );
    }
  } else if (offer && offer.rejected) {
    stateClass = 'pending';
    badge = 'Revision needed';
    title = 'Next step: Propose updated terms';
    desc = 'The previous proposal was rejected. Submit updated deliverables, price, or timeline to keep negotiating.';
    actionNode = (
      <Link
        href={`/deals/${deal.id}/proposal`}
        className="primary continue-btn"
        onClick={() => setNavDirection('backward')}
      >
        <span>Draft revision</span>
        <span>→</span>
      </Link>
    );
  } else if (deal.requirements) {
    stateClass = 'pending';
    badge = 'Proposal needed';
    title = 'Next step: Draft proposal v1';
    desc = 'Brief is recorded. Propose specific deliverables, asking price, and delivery timeframe.';
    actionNode = (
      <Link
        href={`/deals/${deal.id}/proposal`}
        className="primary continue-btn"
        onClick={() => setNavDirection('forward')}
      >
        <span>Draft proposal</span>
        <span>→</span>
      </Link>
    );
    const isOnBriefPage = pathname === `/deals/${deal.id}/brief`;
    actionNode = isOnBriefPage ? (
      <button
        type="button"
        className="primary continue-btn"
        onClick={() => {
          const form = document.querySelector('form');
          if (form) {
            form.requestSubmit();
          } else {
            const input = document.getElementById('requirements-input');
            input?.focus();
          }
        }}
      >
        <span>Save brief</span>
        <span>→</span>
      </button>
    ) : (
      <Link
        href={`/deals/${deal.id}/brief`}
        className="primary continue-btn"
        onClick={() => setNavDirection('forward')}
      >
        <span>Enter brief</span>
        <span>→</span>
      </Link>
    );
  }

  return (
    <div className={`next-action-panel ${stateClass}`} role="region" aria-label="Authoritative next step">
      <div className="next-action-content">
        <span className="next-action-label">
          <span className="badge-dot" aria-hidden="true" />
          {badge}
        </span>
        <h3 className="next-action-text">{title}</h3>
        <p className="next-action-subtext">{desc}</p>
      </div>
      {actionNode && <div className="next-action-btn">{actionNode}</div>}
    </div>
  );
}
