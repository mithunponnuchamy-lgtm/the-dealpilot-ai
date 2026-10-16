'use client';
import Link from 'next/link';
import { useDealPilot, money, getResumeRoute, getResumeLabel } from '@/context/DealPilotContext';

export default function DashboardPage() {
  const { deals, role, health, configured, setActiveDealId, setNavDirection } = useDealPilot();

  const activeCount = deals.filter(d => !['paid', 'cancelled'].includes(d.status)).length;
  const awaitingCount = deals.filter(d => d.status === 'awaiting approval').length;
  const paidCount = deals.filter(d => d.status === 'paid').length;

  return (
    <div className="page-transition-fade">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR WORK, IN AGREEMENT</span>
          <h1>Deal overview</h1>
          <p>Every conversation. Every version. One clear record.</p>
        </div>
        {role === 'freelancer' && (
          <Link
            role="button"
            href="/deals/new"
            className="primary"
            onClick={() => setNavDirection('none')}
          >
            ＋ Create a deal
          </Link>
        )}
      </div>

      <div className="stats">
        <div>
          <small>Active deals</small>
          <strong>{activeCount}</strong>
        </div>
        <div>
          <small>Awaiting approval</small>
          <strong>{awaitingCount}</strong>
        </div>
        <div>
          <small>Verified sandbox payments</small>
          <strong>{paidCount}</strong>
        </div>
      </div>

      <section className="card">
        <h2>Your deals</h2>
        {deals.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Project / client</th>
                  <th>Current proposal</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deals.map(d => {
                  const targetRoute = getResumeRoute(d, role);
                  const resumeLabel = getResumeLabel(d, role);
                  const latestOffer = d.offers.at(-1);

                  return (
                    <tr key={d.id}>
                      <td>
                        <b>{d.title}</b>
                        <small>{d.client}</small>
                      </td>
                      <td>
                        {latestOffer
                          ? money(latestOffer.terms.amount_cents)
                          : 'Not proposed'}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            d.status === 'paid'
                              ? 'green'
                              : d.status === 'awaiting approval'
                              ? 'amber'
                              : ''
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={targetRoute}
                          className="secondary resume-btn"
                          onClick={() => {
                            setActiveDealId(d.id);
                            setNavDirection('none');
                          }}
                        >
                          {resumeLabel}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <h3>A clear agreement starts here.</h3>
            <p>Create your first deal, then invite a client to define the work.</p>
          </div>
        )}
      </section>

      <p className="subtle" style={{ marginTop: '24px' }}>
        {health} · AI {configured.ai_configured ? 'configured' : 'not configured'} ·
        PayPal {configured.paypal_configured ? 'configured' : 'not configured'}
      </p>
    </div>
  );
}
