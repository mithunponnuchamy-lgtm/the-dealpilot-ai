'use client';
import { use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useDealPilot, money } from '@/context/DealPilotContext';
import { TaskActionBar } from '@/components/TaskActionBar';

export default function PaymentPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = use(params);
  const searchParams = useSearchParams();
  const returnState = searchParams?.get('checkout');

  const {
    deal,
    offer,
    role,
    api,
    mutateDeal,
    runAction,
    actionLoading,
    configured,
    setShowCert,
  } = useDealPilot();

  if (!deal) return null;

  const isBothApproved = Boolean(offer && offer.approvals.length === 2);
  const isPaid = deal.status === 'paid';

  const handlePayPalCheckout = async () => {
    if (!offer) return;
    try {
      await runAction('Connecting to PayPal Sandbox…', async () => {
        const r = await api(`/deals/${dealId}/checkout`, 'POST', {
          version: offer.version,
        });
        location.assign(r.approval_url);
      });
    } catch {
      // Handled in context
    }
  };

  const handleSimulatePayment = async () => {
    if (!offer) return;
    try {
      await runAction('Simulating PayPal Sandbox capture…', async () => {
        await mutateDeal('/simulate-payment', { version: offer.version });
      });
    } catch {
      // Handled in context
    }
  };

  return (
    <div className="task-page-container">
      <section className="card checkout" aria-labelledby="payment-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">STEP 5 OF 5 · PAYPAL SANDBOX</span>
            <h2 id="payment-heading">
              {isPaid ? 'Payment verified & agreement locked' : 'Agreement checkout'}
            </h2>
          </div>
          <span className={`badge ${isPaid ? 'green' : isBothApproved ? 'amber' : ''}`}>
            {isPaid ? '✓ Verified paid' : isBothApproved ? 'Awaiting payment' : 'Payment locked'}
          </span>
        </div>

        <p>
          One payment, directly bound to the exact approved proposal version. Sandbox funds only.
        </p>

        {returnState && role === 'client' && (
          <div className="notification" role="status">
            <b>PayPal Checkout Notice</b>
            <p>
              {returnState === 'cancelled'
                ? 'You returned from PayPal checkout without completing. You can resume checkout below.'
                : 'Returned from PayPal. Verify and finalize payment below.'}
            </p>
          </div>
        )}

        {offer && (
          <div className="compact-offer-summary" style={{ margin: '16px 0' }}>
            <div>
              <span className="eyebrow" style={{ margin: 0 }}>APPROVED VERSION</span>
              <b>Version {offer.version} · {money(offer.terms.amount_cents)} USD</b>
            </div>
            <span className="subtle">{offer.terms.payment_terms}</span>
          </div>
        )}

        {!isBothApproved && !isPaid && (
          <div className="notification" style={{ background: '#FFFDF9', borderColor: '#F8E2BD' }}>
            <b>Approvals Required</b>
            <p>
              Payment is locked until both parties explicitly approve Version {offer?.version || 1}.
            </p>
            <Link
              href={`/deals/${dealId}/review`}
              className="primary continue-btn"
              style={{ marginTop: '8px' }}
            >
              <span>Return to review</span>
              <span>→</span>
            </Link>
          </div>
        )}

        {deal.payment && (
          <div className="payment-data">
            <p>
              <span>Payment status</span>
              <b>{deal.payment.status.toUpperCase()}</b>
            </p>
            <p>
              <span>Locked proposal</span>
              <b>v{deal.offers.find(x => x.id === deal.payment?.offer_id)?.version || offer?.version}</b>
            </p>
            <p>
              <span>PayPal Order ID</span>
              <code>{deal.payment.order_id || 'Awaiting confirmation'}</code>
            </p>
            <p>
              <span>PayPal Capture ID</span>
              <code>{deal.payment.capture_id || 'Not verified'}</code>
            </p>
            {deal.payment.paid_at && (
              <p>
                <span>Captured timestamp</span>
                <b>{new Date(deal.payment.paid_at).toLocaleString()}</b>
              </p>
            )}
          </div>
        )}

        {isPaid && (
          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="primary"
              style={{ width: '100%', padding: '12px' }}
              onClick={() => setShowCert(true)}
            >
              📄 View Official Agreement & Payment Certificate
            </button>
          </div>
        )}

        {role === 'client' && !isPaid && isBothApproved && (
          <div className="stack" style={{ marginTop: '18px' }}>
            {configured.paypal_configured ? (
              <>
                <button
                  className="paypal"
                  disabled={Boolean(actionLoading) || deal.cancelled}
                  onClick={() => void handlePayPalCheckout()}
                >
                  {deal.payment ? 'Resume PayPal checkout' : 'Continue to PayPal'}
                </button>
                {deal.payment?.order_id && (
                  <div className="actions">
                    <button
                      disabled={Boolean(actionLoading)}
                      onClick={() =>
                        void runAction('Verifying payment…', () => mutateDeal('/payment/verify'))
                      }
                    >
                      Verify & complete payment
                    </button>
                    <button
                      disabled={Boolean(actionLoading)}
                      onClick={() =>
                        void runAction('Cancelling checkout…', () => mutateDeal('/payment/cancel'))
                      }
                    >
                      Record checkout cancellation
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="stack">
                <button
                  className="primary sim-pay-btn"
                  disabled={Boolean(actionLoading) || deal.cancelled}
                  onClick={() => void handleSimulatePayment()}
                >
                  ⚡ Complete with Sandbox Simulator (Demo Mode)
                </button>
                <small>
                  Simulates verified PayPal Sandbox capture. Real credentials can be configured in <code>backend/.env</code>.
                </small>
              </div>
            )}
          </div>
        )}

        {role === 'freelancer' && !isPaid && (
          <div style={{ marginTop: '16px' }}>
            <small>
              The client completes checkout from their private invitation link. Once PayPal capture is verified, the agreement will be marked paid.
            </small>
          </div>
        )}

        <TaskActionBar
          backHref={`/deals/${dealId}/review`}
          backLabel="Review"
          continueLabel={isPaid ? 'Back to dashboard' : undefined}
          continueDesc={isPaid ? 'Return to your deal overview' : undefined}
          onContinue={isPaid ? () => location.assign('/dashboard') : undefined}
        />
      </section>
    </div>
  );
}
