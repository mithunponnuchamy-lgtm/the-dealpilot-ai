'use client';
import { use, useEffect } from 'react';
import { useDealPilot } from '@/context/DealPilotContext';
import { DealStepper } from '@/components/DealStepper';
import { NextActionPanel } from '@/components/NextActionPanel';
import { SharePanel } from '@/components/SharePanel';

export default function DealLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = use(params);
  const {
    deal,
    activeDealId,
    loadDeal,
    role,
    api,
    setInvitation,
    refreshDeals,
    actionLoading,
    runAction,
    navDirection,
  } = useDealPilot();

  useEffect(() => {
    if (dealId && dealId !== activeDealId) {
      void loadDeal(dealId);
    }
  }, [dealId, activeDealId, loadDeal]);

  if (!deal) {
    return (
      <div className="task-page-container">
        <div className="empty">
          <h3>Loading agreement workspace…</h3>
          <p>Retrieving stored deal information and version trail.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="deal-layout-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DEAL WORKSPACE · {deal.id.slice(0, 8)}</span>
          <h1>{deal.title}</h1>
          <p>
            {deal.freelancer} with {deal.client}{' '}
            <span
              className={`badge ${
                deal.status === 'paid'
                  ? 'green'
                  : deal.status === 'awaiting approval'
                  ? 'amber'
                  : ''
              }`}
            >
              {deal.status}
            </span>
          </p>
        </div>
        <div className="actions">
          <button
            disabled={Boolean(actionLoading)}
            onClick={() => void runAction('Refreshing…', async () => { await refreshDeals(); })}
          >
            Refresh
          </button>
          {role === 'freelancer' && (
            <button
              disabled={Boolean(actionLoading)}
              className="secondary"
              onClick={() =>
                void runAction('Creating invitation…', async () => {
                  const r = await api(`/deals/${dealId}/invitation`, 'POST');
                  setInvitation(`${location.origin}/?deal=${dealId}#invite=${r.client_token}`);
                })
              }
            >
              🔗 Share deal
            </button>
          )}
        </div>
      </div>

      <SharePanel dealId={dealId} />

      <NextActionPanel />

      <DealStepper dealId={dealId} />

      <div
        key={dealId}
        className={`deal-task-content ${
          navDirection === 'forward'
            ? 'page-transition-forward'
            : navDirection === 'backward'
            ? 'page-transition-backward'
            : 'page-transition-fade'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
