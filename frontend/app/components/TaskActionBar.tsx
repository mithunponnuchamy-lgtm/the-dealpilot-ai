'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';
import { useDealPilot } from '../context/DealPilotContext';

export function TaskActionBar({
  backHref,
  backLabel = 'Back',
  continueLabel,
  continueDesc,
  onContinue,
  continueDisabled = false,
  continueLoading = false,
  isSubmit = false,
}: {
  backHref?: string;
  backLabel?: string;
  continueLabel?: string;
  continueDesc?: string;
  onContinue?: () => void;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  isSubmit?: boolean;
}) {
  const router = useRouter();
  const { setNavDirection } = useDealPilot();

  const handleBack = () => {
    setNavDirection('backward');
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <footer className="task-action-bar">
      <div className="task-action-bar-left">
        {backHref ? (
          <button
            type="button"
            className="quiet"
            onClick={handleBack}
            aria-label={`Go back to ${backLabel}`}
          >
            <ArrowLeftIcon />
            <span>{backLabel}</span>
          </button>
        ) : <div />}
      </div>

      <div className="task-action-bar-right">
        {continueLabel && (
          <button
            type={isSubmit ? 'submit' : 'button'}
            className="primary continue-btn"
            disabled={continueDisabled || continueLoading}
            onClick={!isSubmit ? onContinue : undefined}
          >
            {continueLoading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>Working…</span>
              </>
            ) : (
              <>
                <span>{continueLabel}</span>
                <span className="arrow-icon"><ArrowRightIcon /></span>
              </>
            )}
          </button>
        )}
        {continueDesc && <span className="task-action-desc">{continueDesc}</span>}
      </div>
    </footer>
  );
}
