'use client';
import { use, FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDealPilot, money } from '@/context/DealPilotContext';
import { TaskActionBar } from '@/components/TaskActionBar';

export default function BriefPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = use(params);
  const router = useRouter();
  const {
    deal,
    role,
    mutateDeal,
    runAction,
    actionLoading,
    configured,
    drafts,
    setDraftRequirements,
    setNavDirection,
  } = useDealPilot();

  const [text, setText] = useState('');

  // Initialize draft or deal requirements
  useEffect(() => {
    if (deal) {
      setText(drafts[dealId]?.requirements ?? deal.requirements ?? '');
    }
  }, [deal, dealId, drafts]);

  if (!deal) return null;

  const isLocked = deal.offers.length > 0 || deal.frozen || deal.cancelled;

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await runAction('Saving brief…', async () => {
        await mutateDeal('/requirements', { text });
        setNavDirection('forward');
        router.push(`/deals/${dealId}/proposal`);
      });
    } catch {
      // Handled in context
    }
  };

  const handleExtract = async () => {
    try {
      await runAction('Extracting proposal terms with AI…', async () => {
        await mutateDeal('/extract');
      });
    } catch {
      // Handled in context
    }
  };

  const handleUseExample = () => {
    const example =
      'Three-page portfolio website with responsive design and contact form. Seven days delivery, $250 budget, one revision round.';
    setText(example);
    setDraftRequirements(dealId, example);
  };

  return (
    <div className="task-page-container">
      <section className="card" aria-labelledby="brief-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">STEP 1 OF 5</span>
            <h2 id="brief-heading">Project brief & requirements</h2>
          </div>
          <span className={`badge ${deal.requirements ? 'green' : 'amber'}`}>
            {deal.requirements ? '✓ Brief recorded' : 'Brief needed'}
          </span>
        </div>

        <p>
          State the scope, goals, and constraints. Once saved, you can draft versioned
          proposals or use AI assistance to extract deliverables.
        </p>

        {isLocked && (
          <div className="notification" style={{ margin: '14px 0', background: '#F0F7FF', borderColor: '#C8E1FF' }}>
            <b>Requirements are locked for Proposal v{deal.offers.at(-1)?.version || 1}</b>
            <p>
              Initial requirements are fixed once a proposal is active.
              {role === 'client'
                ? ' As the client, you can review the proposed terms, approve them, or discuss revisions.'
                : ' If scope or price changes, negotiate in Discussion or submit a revised proposal version.'}
            </p>
            <div style={{ marginTop: '10px' }}>
              <Link
                href={`/deals/${dealId}/review`}
                className="primary continue-btn"
                style={{ display: 'inline-flex', width: 'auto', padding: '8px 16px', textDecoration: 'none' }}
                onClick={() => setNavDirection('forward')}
              >
                <span>Go to review proposal</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSave}>
          <label htmlFor="requirements-input">
            What are we building?
            <textarea
              id="requirements-input"
              name="requirements"
              rows={5}
              value={text}
              onChange={e => {
                setText(e.target.value);
                setDraftRequirements(dealId, e.target.value);
              }}
              placeholder="I need a three-page portfolio website with a contact form, delivered in seven days for $250."
              required
              maxLength={2000}
              disabled={isLocked}
            />
          </label>

          {!deal.requirements && !isLocked && (
            <button
              type="button"
              className="example-brief-btn"
              onClick={handleUseExample}
            >
              💡 Use example brief
            </button>
          )}

          <div className="actions" style={{ marginTop: '16px' }}>
            <button
              type="button"
              disabled={
                Boolean(actionLoading) ||
                !text.trim() ||
                isLocked ||
                !configured.ai_configured
              }
              onClick={() => void handleExtract()}
            >
              ✧ Extract with AI
            </button>
            <small>
              {configured.ai_configured
                ? 'AI extraction suggests structured deliverables for review.'
                : 'AI key not configured. Manual proposals are fully supported.'}
            </small>
          </div>

          {deal.extraction && (
            <div className="ai-result">
              <h3>AI draft · review before using</h3>
              <p>{deal.extraction.description}</p>
              <ul>
                {deal.extraction.deliverables.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
              <p>
                Budget:{' '}
                {deal.extraction.budget_usd === null
                  ? 'Not specified'
                  : money(deal.extraction.budget_usd * 100)}{' '}
                · Deadline: {deal.extraction.deadline || 'Not specified'}
              </p>
              <b>Clarification questions</b>
              <ul>
                {deal.extraction.missing_information.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
              <b>Unconfirmed assumptions</b>
              <ul>
                {deal.extraction.assumptions.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}

          <TaskActionBar
            backHref={role === 'client' ? undefined : '/dashboard'}
            backLabel={role === 'client' ? undefined : 'Dashboard'}
            continueLabel={isLocked ? (role === 'client' ? 'Go to review' : 'Go to proposal') : 'Save brief'}
            continueDesc={isLocked ? 'View active terms and approval status' : 'Saves brief and proceeds to Proposal'}
            continueLoading={Boolean(actionLoading)}
            isSubmit={!isLocked}
            onContinue={
              isLocked
                ? () => {
                    setNavDirection('forward');
                    router.push(role === 'client' ? `/deals/${dealId}/review` : `/deals/${dealId}/proposal`);
                  }
                : undefined
            }
          />
        </form>
      </section>
    </div>
  );
}
