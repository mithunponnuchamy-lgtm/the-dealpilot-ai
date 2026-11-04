'use client';
import { use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useDealPilot, money } from '@/context/DealPilotContext';
import { TaskActionBar } from '@/components/TaskActionBar';
import { MultiCurrencyPreview } from '@/components/MultiCurrencyPreview';
import { MilestoneEscrowCard } from '@/components/MilestoneEscrowCard';

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
    setShowDisputeShield,
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
          <div className="paid-action-buttons" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              className="primary"
              style={{ width: '100%', padding: '12px', fontSize: '13.5px', fontWeight: 700 }}
              onClick={() => setShowCert(true)}
            >
              📄 View Official Agreement & Payment Certificate
            </button>
            <button
              type="button"
              className="shield-trigger-btn"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '13.5px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(6, 95, 70, 0.25)',
              }}
              onClick={() => setShowDisputeShield(true)}
            >
              <span>🛡️ Export PayPal Dispute Shield Bundle</span>
            </button>
          </div>
        )}

        {isPaid && <MilestoneEscrowCard />}

        {offer && <MultiCurrencyPreview amountCents={offer.terms.amount_cents} />}

        {role === 'client' && !isPaid && isBothApproved && (
          <div className="stack" style={{ marginTop: '18px', gap: '14px' }}>
            {configured.paypal_configured && (
              <div className="stack" style={{ gap: '8px' }}>
                <button
                  className="paypal"
                  disabled={Boolean(actionLoading) || deal.cancelled}
                  onClick={() => void handlePayPalCheckout()}
                >
                  {deal.payment?.order_id ? 'Resume PayPal checkout' : 'Continue to PayPal'}
                </button>
                <small>Connects directly to PayPal Sandbox checkout.</small>
              </div>
            )}

            {deal.payment?.order_id && (
              <div className="actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

            {deal.payment && !deal.payment.order_id && (
              <div className="actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#FFF7ED', border: '1px solid #FED7AA', padding: '10px 14px', borderRadius: '8px' }}>
                <button
                  type="button"
                  className="secondary"
                  disabled={Boolean(actionLoading)}
                  onClick={() =>
                    void runAction('Resetting checkout…', () => mutateDeal('/payment/cancel'))
                  }
                >
                  🔄 Reset Checkout Attempt
                </button>
                <small style={{ color: '#9A3412', margin: 0 }}>
                  Order creation was interrupted. Reset to retry checkout or use the instant simulator below.
                </small>
              </div>
            )}

            <div
              className="stack"
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                padding: '14px',
                marginTop: configured.paypal_configured ? '6px' : '0',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <b style={{ color: '#166534', fontSize: '13px' }}>⚡ Instant Sandbox Simulator (Judge & Demo Mode)</b>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#15803D' }}>
                    Simulates verified PayPal capture, locks version terms, and initiates two-phase milestone escrow instantly.
                  </p>
                </div>
                <button
                  type="button"
                  className="primary sim-pay-btn"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    padding: '9px 18px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                    whiteSpace: 'nowrap',
                  }}
                  disabled={Boolean(actionLoading) || deal.cancelled}
                  onClick={() => void handleSimulatePayment()}
                >
                  ⚡ Complete Instant Verification
                </button>
              </div>
            </div>
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
