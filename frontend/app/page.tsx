'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useDealPilot, getResumeRoute } from './context/DealPilotContext';
import { BrandHeader } from './components/BrandHeader';
import { AgreementPreview } from './components/AgreementPreview';
import { WorkspaceAccessCard } from './components/WorkspaceAccessCard';

export default function EntryPage() {
  const router = useRouter();
  const { role, login, health, deals, actionLoading, error, apiUrl, updateApiUrl, loadJudgeDemo } = useDealPilot();

  const [entry, setEntry] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (role) {
      const dealParam = typeof window !== 'undefined' ? new URLSearchParams(location.search).get('deal') : null;
      if (dealParam) {
        const found = deals.find(d => d.id === dealParam);
        const route = found ? getResumeRoute(found, role) : `/deals/${dealParam}/review`;
        router.push(route);
      } else {
        router.push('/dashboard');
      }
    }
  }, [role, deals, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!entry.trim()) return;
    setIsSubmitting(true);
    try {
      const { dealId, role: newRole } = await login(entry.trim());
      if (dealId && newRole === 'client') {
        const found = deals.find(d => d.id === dealId);
        const route = found ? getResumeRoute(found, newRole) : `/deals/${dealId}/review`;
        router.push(route);
      } else {
        router.push('/dashboard');
      }
    } catch {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="entry-wrapper page-transition-fade">
      <BrandHeader />
      <main className="entry-grid">
        <div className="intro-col">
          <div className="intro-block">
            <span className="eyebrow">FREELANCE AGREEMENTS, MADE CLEAR</span>
            <h1 className="entry-headline">
              Agree on the work.
              <br />
              Move forward together.
            </h1>
            <p className="intro-description">
              Turn project conversations into clear proposals, shared approvals, and
              PayPal Sandbox payments.
            </p>
          </div>
          <AgreementPreview />
        </div>
        <div className="access-col">
          <WorkspaceAccessCard
            entry={entry}
            setEntry={setEntry}
            showCode={showCode}
            setShowCode={setShowCode}
            busy={isSubmitting || Boolean(actionLoading)}
            error={error}
            health={health}
            apiUrl={apiUrl}
            onUpdateApiUrl={updateApiUrl}
            onSubmit={handleSubmit}
            onLaunchJudgeDemo={() => void loadJudgeDemo()}
          />
        </div>
      </main>
      <footer className="entry-footer">
        <p>DealPilot AI · From conversation to agreement to payment.</p>
      </footer>
    </div>
  );
}
