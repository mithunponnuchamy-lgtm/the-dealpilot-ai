'use client';
import { use } from 'react';
import { useDealPilot, money } from '@/context/DealPilotContext';
import { TaskActionBar } from '@/components/TaskActionBar';

function formatVal(k: string, v: unknown) {
  return k === 'amount_cents'
    ? money(Number(v))
    : Array.isArray(v)
    ? v.join(' · ')
    : String(v);
}

export default function HistoryPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = use(params);
  const { deal } = useDealPilot();

  if (!deal) return null;

  return (
    <div className="task-page-container">
      <section className="card" aria-labelledby="history-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">AUDIT RECORD</span>
            <h2 id="history-heading">Agreement version trail</h2>
          </div>
          <span className="badge">{deal.offers.length} versions stored</span>
        </div>

        <p>
          Deterministic history comparing each proposal with its predecessor. Changes
          are calculated directly from stored version snapshots, not inferred.
        </p>

        <div className="stack" style={{ marginTop: '20px' }}>
          {[...deal.offers].reverse().map(o => (
            <article className="version" key={o.id}>
              <h3>
                Version {o.version} · {money(o.terms.amount_cents)} USD
              </h3>
              <p>
                Proposed by {o.author} ·{' '}
                {o.rejected
                  ? 'Rejected'
                  : `${o.approvals.length} of 2 approvals recorded`}
              </p>

              {Object.keys(o.changes).length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Before</th>
                        <th>After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(o.changes).map(([k, v]) => (
                        <tr key={k}>
                          <td>{k.replaceAll('_', ' ')}</td>
                          <td>{formatVal(k, (v as { before?: unknown; after?: unknown })?.before)}</td>
                          <td>{formatVal(k, (v as { before?: unknown; after?: unknown })?.after)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="subtle">
                  Initial baseline proposal · Deliverables: {o.terms.deliverables.join(', ')}
                </p>
              )}
            </article>
          ))}

          {!deal.offers.length && (
            <div className="empty">
              <p>No proposals have been created yet.</p>
            </div>
          )}
        </div>

        <TaskActionBar
          backHref={`/deals/${dealId}/review`}
          backLabel="Current proposal review"
          continueLabel="Return to review"
          continueDesc="View the active proposal and approvals"
          onContinue={() => location.assign(`/deals/${dealId}/review`)}
        />
      </section>
    </div>
  );
}
