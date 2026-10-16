'use client';
import { FormEvent } from 'react';
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from './Icons';

export function WorkspaceAccessCard({
  entry,
  setEntry,
  showCode,
  setShowCode,
  busy,
  error,
  health,
  onSubmit,
}: {
  entry: string;
  setEntry: (v: string) => void;
  showCode: boolean;
  setShowCode: (v: boolean) => void;
  busy: boolean;
  error: string;
  health: string;
  onSubmit: (e: FormEvent) => void;
}) {
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
        <p id="code-helper" className="helper-text">
          Your freelancer code or client invitation code.
        </p>

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

      <details className="setup-details">
        <summary className="setup-summary">Setup help</summary>
        <div className="setup-body">
          <p>
            Follow <code>README.md</code> to start the backend and configure{' '}
            <code>WORKSPACE_TOKEN</code> in <code>backend/.env</code>. Keep your token
            private.
          </p>
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
        </div>
      </details>
    </section>
  );
}
