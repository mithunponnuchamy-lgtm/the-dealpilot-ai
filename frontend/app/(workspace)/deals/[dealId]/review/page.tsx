'use client';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDealPilot, money } from '@/context/DealPilotContext';
import { TaskActionBar } from '@/components/TaskActionBar';

export default function ReviewPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = use(params);
  const router = useRouter();
  const {
    deal,
    offer,
    role,
    mutateDeal,
    runAction,
    actionLoading,
    setShowCert,
    setNavDirection,
  } = useDealPilot();

  if (!deal) return null;

  const hasMyApproval = Boolean(offer && offer.approvals.includes(role));
  const isBothApproved = Boolean(offer && offer.approvals.length === 2);
  const isLocked = deal.frozen || deal.cancelled;

  const handleApprove = async () => {
    if (!offer) return;
    try {
      await runAction('Recording approval…', async () => {
        await mutateDeal('/approve', { version: offer.version });
      });
    } catch {
      // Handled in context
    }
  };

  const handleReject = async () => {
    if (!offer) return;
    try {
      await runAction('Recording rejection…', async () => {
        await mutateDeal('/reject', { version: offer.version });
      });
    } catch {
      // Handled in context
    }
  };

  return (
    <div className="task-page-container">
      <section className="card proposal" aria-labelledby="review-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">STEP 4 OF 5</span>
            <h2 id="review-heading">Current agreement & review</h2>
          </div>
          <span className="badge">
            {offer ? `Version ${offer.version}` : 'Not proposed'}
          </span>
        </div>

        {offer ? (
          <>
            <strong className="price">
              {money(offer.terms.amount_cents)} <small>USD</small>
            </strong>
            <p>{offer.terms.payment_terms}</p>
            <hr />

            <h3>Included in the scope</h3>
            <ul className="scope">
              {offer.terms.deliverables.map((x, i) => (
                <li key={i}>✓ {x}</li>
              ))}
            </ul>

            <h3>Not included</h3>
            <ul>
              {offer.terms.exclusions.map((x, i) => (
                <li key={i}>✕ {x}</li>
              ))}
            </ul>

            <div className="terms-row">
              <div>
                <small>Delivery after payment</small>
                <b>{offer.terms.delivery_days} days</b>
              </div>
              <div>
                <small>Revision rounds</small>
                <b>{offer.terms.revisions}</b>
              </div>
            </div>

            <hr />

            {['freelancer', 'client'].map(r => (
              <div className="approval-row" key={r}>
                <span>{r === 'freelancer' ? deal.freelancer : deal.client}</span>
                <span
                  className={`badge ${
                    offer.approvals.includes(r) ? 'green' : 'amber'
                  }`}
                >
                  {offer.approvals.includes(r)
                    ? '✓ Approved'
                    : 'Awaiting approval'}
                </span>
              </div>
            ))}

            {isBothApproved && (
              <div className="executed-banner" style={{ marginTop: '16px' }}>
                <p>
                  <b>✓ Mutually Approved Agreement</b>
                </p>
                <button
                  type="button"
                  className="secondary cert-btn"
                  onClick={() => setShowCert(true)}
                >
                  📄 View Executed Agreement & Certificate
                </button>
              </div>
            )}

            {offer.rejected ? (
              <div className="error" style={{ marginTop: '14px' }}>
                <span>Rejected. Submit a new proposal to continue.</span>
                <Link
                  href={`/deals/${dealId}/proposal`}
                  className="secondary"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => setNavDirection('backward')}
                >
                  Draft revision →
                </Link>
              </div>
            ) : (
              !isLocked && (
                <div className="actions" style={{ marginTop: '18px' }}>
                  <button
                    className="primary"
                    disabled={Boolean(actionLoading) || hasMyApproval}
                    onClick={() => void handleApprove()}
                  >
                    {hasMyApproval ? 'You approved' : 'Approve these exact terms'}
                  </button>

                  <button
                    disabled={Boolean(actionLoading)}
                    className="danger"
                    onClick={() => void handleReject()}
                  >
                    Reject
                  </button>

                  <Link
                    href={`/deals/${dealId}/proposal`}
                    className="quiet"
                    onClick={() => setNavDirection('backward')}
                  >
                    Edit / Revise proposal
                  </Link>
                </div>
              )
            )}

            <small style={{ marginTop: '14px', display: 'block' }}>
              Review all terms before approving. This proposal represents the exact agreement to be paid.
            </small>

            {role === 'freelancer' && (
              <p className="private-guard">
                <span className="lock-icon" aria-hidden="true">
                  🔒
                </span>
                <span>
                  Private to you · Minimum {money(deal.minimum_cents || 0)}
                </span>
              </p>
            )}

            <TaskActionBar
              backHref={`/deals/${dealId}/proposal`}
              backLabel="Proposal"
              continueLabel={
                isBothApproved
                  ? role === 'client'
                    ? 'Continue to PayPal'
                    : 'View payment status'
                  : undefined
              }
              continueDesc={
                isBothApproved
                  ? 'Proceed to verified PayPal Sandbox payment'
                  : undefined
              }
              onContinue={() => {
                setNavDirection('forward');
                router.push(`/deals/${dealId}/payment`);
              }}
            />
          </>
        ) : (
          <div className="empty">
            <h3>No proposal has been created yet.</h3>
            <p>Draft a proposal first to review and record approvals.</p>
            <Link
              href={`/deals/${dealId}/proposal`}
              className="primary continue-btn"
              style={{ marginTop: '14px' }}
              onClick={() => setNavDirection('backward')}
            >
              <span>Draft a proposal</span>
              <span>→</span>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
