'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDealPilot } from '@/context/DealPilotContext';
import { TaskActionBar } from '@/components/TaskActionBar';

export default function CreateDealPage() {
  const router = useRouter();
  const { createDeal, runAction, actionLoading, error } = useDealPilot();
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    const f = new FormData(e.currentTarget);
    const title = String(f.get('title') || '').trim();
    const freelancer = String(f.get('freelancer') || '').trim();
    const client = String(f.get('client') || '').trim();
    const asking = Number(f.get('asking'));
    const minimum = Number(f.get('minimum'));

    if (!title || !freelancer || !client || isNaN(asking) || isNaN(minimum)) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      await runAction('Creating deal & generating invitation…', async () => {
        const res = await createDeal({
          title,
          client,
          freelancer,
          asking_cents: Math.round(asking * 100),
          minimum_cents: Math.round(minimum * 100),
        });
        router.push(`/deals/${res.deal.id}/brief`);
      });
    } catch {
      // Error handled by context
    }
  };

  return (
    <div className="task-page-container page-transition-fade">
      <div className="page-heading">
        <div>
          <span className="eyebrow">NEW PROJECT AGREEMENT</span>
          <h1>Create a deal</h1>
          <p>Define participants and baseline pricing. Next, you will establish the project brief.</p>
        </div>
      </div>

      <section className="card" aria-labelledby="new-deal-heading">
        <h2 id="new-deal-heading">Project & participant details</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="deal-title">
            Project title
            <input
              id="deal-title"
              name="title"
              required
              maxLength={160}
              placeholder="Portfolio website"
              autoFocus
            />
          </label>

          <div className="form-row">
            <label htmlFor="deal-freelancer">
              Your name
              <input
                id="deal-freelancer"
                name="freelancer"
                required
                maxLength={100}
                placeholder="Freelancer name"
              />
            </label>
            <label htmlFor="deal-client">
              Client name
              <input
                id="deal-client"
                name="client"
                required
                maxLength={100}
                placeholder="Client name"
              />
            </label>
          </div>

          <div className="form-row">
            <label htmlFor="deal-asking">
              Asking price (USD)
              <input
                id="deal-asking"
                name="asking"
                type="number"
                min="0.01"
                max="1000000"
                step="0.01"
                required
                defaultValue="300"
              />
            </label>
            <label htmlFor="deal-minimum">
              Private minimum (USD)
              <input
                id="deal-minimum"
                name="minimum"
                type="number"
                min="0"
                max="1000000"
                step="0.01"
                required
                defaultValue="200"
              />
            </label>
          </div>

          <p className="subtle" style={{ marginTop: '8px' }}>
            🔒 Your minimum price stays private to you and is never revealed to your client or AI.
          </p>

          {(formError || error) && (
            <p className="error" role="alert">
              {formError || error}
            </p>
          )}

          <TaskActionBar
            backHref="/dashboard"
            backLabel="Dashboard"
            continueLabel="Create & get invitation"
            continueDesc="Establishes deal and opens the Project Brief"
            continueLoading={Boolean(actionLoading)}
            isSubmit={true}
          />
        </form>
      </section>
    </div>
  );
}
