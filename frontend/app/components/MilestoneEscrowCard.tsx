'use client';
import { useState } from 'react';
import { useDealPilot, money } from '../context/DealPilotContext';

export function MilestoneEscrowCard() {
  const { deal, offer, role, api, refreshDeals, runAction, actionLoading } = useDealPilot();
  const [submitting, setSubmitting] = useState(false);

  if (!deal || !deal.payment || deal.status !== 'paid') return null;

  const milestones = deal.payment.milestones;
  if (!milestones) return null;

  const phase1 = milestones.phase1;
  const phase2 = milestones.phase2;

  const handleFreelancerSubmit = async () => {
    try {
      setSubmitting(true);
      await runAction('Submitting deliverables for handoff review…', async () => {
        await api(`/deals/${deal.id}/milestones/submit`, 'POST');
        await refreshDeals();
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClientRelease = async () => {
    try {
      setSubmitting(true);
      await runAction('Releasing Phase 2 milestone payment via PayPal…', async () => {
        await api(`/deals/${deal.id}/milestones/release`, 'POST');
        await refreshDeals();
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card milestone-escrow-card">
      <div className="milestone-card-header">
        <div className="milestone-title-group">
          <span className="milestone-icon">🔒</span>
          <div>
            <h3 className="milestone-heading">PayPal Two-Phase Milestone Escrow</h3>
            <p className="milestone-subheading">
              Protects both parties: 50% deposit released at kickoff, 50% locked until client approval.
            </p>
          </div>
        </div>
        <span className={`milestone-badge ${phase2.status === 'completed' ? 'green' : 'amber'}`}>
          {phase2.status === 'completed' ? '● 100% Settled' : '● Milestone 2 In Escrow'}
        </span>
      </div>

      <div className="milestones-grid">
        {/* Phase 1 Card */}
        <div className="milestone-box phase1 completed">
          <div className="milestone-box-top">
            <span className="milestone-step-pill completed">PHASE 1 · DEPOSIT</span>
            <span className="milestone-status-tag green">✓ Released</span>
          </div>
          <h4 className="milestone-name">{phase1.title}</h4>
          <div className="milestone-amount">{money(phase1.amount_cents)} USD</div>
          <p className="milestone-desc">
            Captured immediately upon mutual proposal approval to fund project kickoff.
          </p>
          <div className="milestone-footer-meta">
            <span>Capture ID:</span>
            <code>{phase1.capture_id || deal.payment.capture_id}</code>
          </div>
        </div>

        {/* Phase 2 Card */}
        <div className={`milestone-box phase2 ${phase2.status}`}>
          <div className="milestone-box-top">
            <span className={`milestone-step-pill ${phase2.status}`}>
              PHASE 2 · FINAL HANDOFF
            </span>
            <span
              className={`milestone-status-tag ${
                phase2.status === 'completed'
                  ? 'green'
                  : phase2.status === 'submitted'
                  ? 'blue'
                  : 'amber'
              }`}
            >
              {phase2.status === 'completed'
                ? '✓ Released'
                : phase2.status === 'submitted'
                ? '⏱ In Client Review'
                : '🔒 Held in Escrow'}
            </span>
          </div>
          <h4 className="milestone-name">{phase2.title}</h4>
          <div className="milestone-amount">{money(phase2.amount_cents)} USD</div>
          <p className="milestone-desc">
            Pre-authorized and held securely in PayPal Sandbox. Released upon formal client handoff approval.
          </p>

          <div className="milestone-action-zone">
            {phase2.status === 'held' && (
              <>
                {role === 'freelancer' ? (
                  <button
                    type="button"
                    className="primary milestone-btn"
                    disabled={Boolean(actionLoading) || submitting}
                    onClick={() => void handleFreelancerSubmit()}
                  >
                    <span>📦 Submit Deliverables for Client Handoff</span>
                  </button>
                ) : (
                  <div className="milestone-waiting-notice">
                    <span>⏱ Freelancer is currently developing deliverables…</span>
                  </div>
                )}
              </>
            )}

            {phase2.status === 'submitted' && (
              <>
                {role === 'client' ? (
                  <button
                    type="button"
                    className="primary milestone-btn release-btn"
                    disabled={Boolean(actionLoading) || submitting}
                    onClick={() => void handleClientRelease()}
                  >
                    <span>✅ Accept Handoff & Release Final 50% ({money(phase2.amount_cents)})</span>
                  </button>
                ) : (
                  <div className="milestone-waiting-notice blue">
                    <span>⏱ Deliverables submitted! Awaiting client review and release.</span>
                  </div>
                )}
              </>
            )}

            {phase2.status === 'completed' && (
              <div className="milestone-footer-meta green">
                <span>Phase 2 Capture ID:</span>
                <code>{phase2.capture_id || 'CAPTURE-SIM-P2-VERIFIED'}</code>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
