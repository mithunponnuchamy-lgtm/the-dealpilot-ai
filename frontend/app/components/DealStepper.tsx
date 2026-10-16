'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDealPilot } from '../context/DealPilotContext';

export function DealStepper({ dealId }: { dealId: string }) {
  const pathname = usePathname();
  const { deal, offer, setNavDirection } = useDealPilot();

  if (!deal) return null;

  const s1Done = Boolean(deal.requirements || deal.offers.length > 0);
  const s2Done = deal.events.length > 1;
  const s3Done = Boolean(offer);
  const s4Done = offer?.approvals.length === 2;
  const s5Done = deal.status === 'paid';

  const steps = [
    { num: '01', label: 'Brief', path: `/deals/${dealId}/brief`, done: s1Done },
    { num: '02', label: 'Negotiation', path: `/deals/${dealId}/negotiation`, done: s2Done },
    { num: '03', label: 'Proposal', path: `/deals/${dealId}/proposal`, done: s3Done },
    { num: '04', label: 'Review', path: `/deals/${dealId}/review`, done: s4Done },
    { num: '05', label: 'Payment', path: `/deals/${dealId}/payment`, done: s5Done },
  ];

  const currentIdx = steps.findIndex(s => pathname.startsWith(s.path));

  const handleStepClick = (targetIdx: number) => {
    if (currentIdx === -1) {
      setNavDirection('none');
    } else if (targetIdx > currentIdx) {
      setNavDirection('forward');
    } else if (targetIdx < currentIdx) {
      setNavDirection('backward');
    }
  };

  return (
    <nav className="deal-stepper" aria-label="Workflow progress">
      {steps.map((step, idx) => {
        const isActive = pathname.startsWith(step.path);
        return (
          <span key={step.path} style={{ display: 'contents' }}>
            <Link
              href={step.path}
              className={`deal-step-link ${isActive ? 'active' : ''} ${step.done ? 'done' : ''}`}
              onClick={() => handleStepClick(idx)}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="step-num">{step.done ? '✓' : step.num}</span>{' '}
              <span>{step.label}</span>
            </Link>
            {idx < steps.length - 1 && <span className="deal-step-divider">›</span>}
          </span>
        );
      })}

      <Link
        href={`/deals/${dealId}/history`}
        className={`deal-step-link secondary-tab ${pathname.includes('/history') ? 'active' : ''}`}
        onClick={() => setNavDirection('none')}
      >
        <span>Version history · {deal.offers.length}</span>
      </Link>
    </nav>
  );
}
