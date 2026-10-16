'use client';
import { useDealPilot } from '../context/DealPilotContext';
import { EyeIcon, EyeSlashIcon } from './Icons';

export function SharePanel({ dealId }: { dealId: string }) {
  const {
    invitation,
    setInvitation,
    showInviteLink,
    setShowInviteLink,
    copied,
    copyInvite,
    api,
    runAction,
    actionLoading,
  } = useDealPilot();

  if (!invitation) return null;

  return (
    <section className="share-panel" role="region" aria-label="Share deal invitation">
      <div className="share-panel-header">
        <div className="share-panel-title-wrap">
          <span className="share-icon-badge" aria-hidden="true">
            🔗
          </span>
          <div>
            <h3 className="share-panel-title">Private invitation</h3>
            <p className="share-panel-desc">
              Share only with your client. They can review, propose, and approve terms
              without seeing your private minimum price.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="quiet"
          onClick={() => setInvitation('')}
          aria-label="Dismiss invitation banner"
        >
          ✕
        </button>
      </div>

      <div className="share-link-row">
        <input
          aria-label="Client invitation link"
          readOnly
          type={showInviteLink ? 'text' : 'password'}
          value={invitation}
          onFocus={e => e.target.select()}
          className="share-link-input"
        />
        <button
          type="button"
          className="quiet"
          onClick={() => setShowInviteLink(!showInviteLink)}
          aria-label={showInviteLink ? 'Hide link' : 'Reveal link'}
          title={showInviteLink ? 'Hide link' : 'Reveal link'}
        >
          {showInviteLink ? <EyeSlashIcon /> : <EyeIcon />}
        </button>
        <button type="button" className="primary copy-btn" onClick={copyInvite}>
          {copied ? '✓ Copied' : 'Copy link'}
        </button>
      </div>

      <div className="share-panel-footer">
        <button
          type="button"
          className="quiet"
          disabled={Boolean(actionLoading)}
          onClick={() =>
            void runAction('Generating new link…', async () => {
              const r = await api(`/deals/${dealId}/invitation`, 'POST');
              setInvitation(`${location.origin}/?deal=${dealId}#invite=${r.client_token}`);
            })
          }
        >
          🔄 Generate new key (revokes previous link)
        </button>
        <span className="subtle">Opens in client role</span>
      </div>
    </section>
  );
}
