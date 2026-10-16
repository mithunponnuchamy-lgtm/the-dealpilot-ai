import { useState, useEffect, FormEvent } from 'react';
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from './Icons';

export function WorkspaceAccessCard({
  entry,
  setEntry,
  showCode,
  setShowCode,
  busy,
  error,
  health,
  apiUrl = '',
  onUpdateApiUrl,
  onSubmit,
}: {
  entry: string;
  setEntry: (v: string) => void;
  showCode: boolean;
  setShowCode: (v: boolean) => void;
  busy: boolean;
  error: string;
  health: string;
  apiUrl?: string;
  onUpdateApiUrl?: (url: string) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const [customUrl, setCustomUrl] = useState(apiUrl);

  useEffect(() => {
    if (apiUrl) setCustomUrl(apiUrl);
  }, [apiUrl]);

  return (
    <section className="card access-card" aria-labelledby="access-title">
      <span className="eyebrow">YOUR WORKSPACE</span>
      <h2 id="access-title" className="access-title">
        Open your workspace
      </h2>
      <p className="access-desc">
        Use your private access code, or open the invitation shared with you.
      </p>

      <form onSubmit={onSubmit} className="access-form">
        <label htmlFor="workspace-code" className="access-label">
          Workspace access code
          <span className="sr-only"> / Private access token</span>
        </label>
        <div className="access-input-wrap">
          <input
            id="workspace-code"
            type={showCode ? 'text' : 'password'}
            autoComplete="off"
            value={entry}
            onChange={e => setEntry(e.target.value)}
            required
            minLength={32}
            placeholder="Paste your 32+ character code…"
            aria-describedby="code-helper"
            className="access-input"
          />
          <button
            type="button"
            className="toggle-visibility-btn"
            onClick={() => setShowCode(!showCode)}
            aria-label={showCode ? 'Hide access code' : 'Show access code'}
            aria-pressed={showCode}
            title={showCode ? 'Hide access code' : 'Show access code'}
          >
            {showCode ? <EyeSlashIcon /> : <EyeIcon />}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <p id="code-helper" className="helper-text" style={{ margin: 0 }}>
            Your freelancer code or client invitation code.
          </p>
          <button
            type="button"
            onClick={() => setEntry('l23kTxGL6jBc21F0AMTvB2A6VYJfzco0VcqBqsZxTlbz2qGi')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--blue-primary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              padding: '2px 4px',
              textDecoration: 'underline',
            }}
          >
            Use demo code
          </button>
        </div>

        <button disabled={busy} className="primary open-workspace-btn continue-btn" type="submit">
          {busy ? (
            'Connecting…'
          ) : (
            <>
              <span>Open workspace</span>
              <span className="arrow-icon"><ArrowRightIcon /></span>
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <details className="setup-details" open={health === 'API offline'}>
        <summary className="setup-summary">
          Setup help & backend connection {health === 'API offline' && '⚠️ (Action needed)'}
        </summary>
        <div className="setup-body">
          <div className="health-status-row">
            <span
              className={`health-dot ${
                health === 'API connected'
                  ? 'connected'
                  : health === 'Connecting'
                  ? 'connecting'
                  : 'offline'
              }`}
              aria-hidden="true"
            />
            <span>{health} · Single-freelancer demo</span>
          </div>

          <div style={{ marginTop: 12, padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <label htmlFor="custom-backend-url" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
              BACKEND API ENDPOINT:
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                id="custom-backend-url"
                type="text"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder="https://dealpilot-backend-xxxx.onrender.com"
                style={{
                  flex: 1,
                  fontSize: 12,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                }}
              />
              <button
                type="button"
                onClick={() => onUpdateApiUrl?.(customUrl)}
                className="primary"
                style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
              >
                Connect
              </button>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
              Render backend URL or local <code>http://localhost:8000</code>.
            </p>
          </div>
        </div>
      </details>
    </section>
  );
}
