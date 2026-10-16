'use client';
import { use, FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDealPilot, initialTerms, lines, Terms } from '@/context/DealPilotContext';
import { TaskActionBar } from '@/components/TaskActionBar';

export default function ProposalPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = use(params);
  const router = useRouter();
  const {
    deal,
    offer,
    mutateDeal,
    runAction,
    actionLoading,
    drafts,
    setDraftProposalTerms,
    setNavDirection,
  } = useDealPilot();

  // Active form terms from draft, latest offer, or defaults
  const [terms, setTerms] = useState<Terms>(() => {
    return (
      drafts[dealId]?.proposalTerms ||
      offer?.terms || {
        ...initialTerms,
        amount_cents: deal?.asking_cents || 30000,
      }
    );
  });

  useEffect(() => {
    if (drafts[dealId]?.proposalTerms) {
      setTerms(drafts[dealId].proposalTerms!);
    } else if (offer?.terms) {
      setTerms(offer.terms);
    } else if (deal?.asking_cents) {
      setTerms(prev => ({ ...prev, amount_cents: deal.asking_cents }));
    }
  }, [dealId, drafts, offer, deal?.asking_cents]);

  if (!deal) return null;

  const nextVersion = (offer?.version || 0) + 1;
  const isLocked = deal.frozen || deal.cancelled;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const deliverables = lines(String(f.get('deliverables') || ''));
    const exclusions = lines(String(f.get('exclusions') || ''));
    const amount = Number(f.get('amount'));
    const days = Number(f.get('days'));
    const revisions = Number(f.get('revisions'));

    const newTerms: Terms = {
      deliverables,
      exclusions,
      amount_cents: Math.round(amount * 100),
      delivery_days: days,
      revisions,
      currency: 'USD',
      payment_terms: initialTerms.payment_terms,
    };

    setDraftProposalTerms(dealId, newTerms);

    try {
      await runAction('Submitting proposal for review…', async () => {
        await mutateDeal('/offers', {
          expected_version: offer?.version || 0,
          terms: newTerms,
        });
        setNavDirection('forward');
        router.push(`/deals/${dealId}/review`);
      });
    } catch {
      // Handled in context
    }
  };

  return (
    <div className="task-page-container">
      <section className="card" aria-labelledby="proposal-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">STEP 3 OF 5</span>
            <h2 id="proposal-heading">
              {offer ? `Propose a revision · v${nextVersion}` : `Create a proposal · v1`}
            </h2>
          </div>
          <span className="badge">
            {offer ? `Active: v${offer.version}` : 'Not proposed yet'}
          </span>
        </div>

        <p>
          Each new version requires fresh explicit approval from both participants before
          payment is unlocked.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="deliverables-input">
            Deliverables · one per line
            <textarea
              id="deliverables-input"
              name="deliverables"
              defaultValue={terms.deliverables.join('\n')}
              required
              rows={4}
              disabled={isLocked}
            />
          </label>

          <label htmlFor="exclusions-input">
            Exclusions · one per line
            <textarea
              id="exclusions-input"
              name="exclusions"
              defaultValue={terms.exclusions.join('\n')}
              rows={2}
              disabled={isLocked}
            />
          </label>

          <div className="form-row">
            <label htmlFor="amount-input">
              Amount (USD)
              <input
                id="amount-input"
                name="amount"
                type="number"
                min="0.01"
                max="1000000"
                step="0.01"
                required
                defaultValue={terms.amount_cents / 100}
                disabled={isLocked}
              />
            </label>
            <label htmlFor="days-input">
              Delivery days
              <input
                id="days-input"
                name="days"
                type="number"
                min="1"
                max="365"
                required
                defaultValue={terms.delivery_days}
                disabled={isLocked}
              />
            </label>
            <label htmlFor="revisions-input">
              Revision rounds
              <input
                id="revisions-input"
                name="revisions"
                type="number"
                min="0"
                max="20"
                required
                defaultValue={terms.revisions}
                disabled={isLocked}
              />
            </label>
          </div>

          <p className="subtle" style={{ marginTop: '10px' }}>
            Full payment upfront; delivery timing starts after PayPal Sandbox payment is verified.
          </p>

          <TaskActionBar
            backHref={`/deals/${dealId}/negotiation`}
            backLabel="Negotiation"
            continueLabel={isLocked ? 'View review' : 'Submit proposal for review'}
            continueDesc="Submits proposal and opens Review for mutual approvals"
            continueLoading={Boolean(actionLoading)}
            isSubmit={!isLocked}
            onContinue={
              isLocked
                ? () => {
                    setNavDirection('forward');
                    router.push(`/deals/${dealId}/review`);
                  }
                : undefined
            }
          />
        </form>
      </section>
    </div>
  );
}
