'use client';

export function BrandHeader() {
  return (
    <header className="entry-header">
      <a className="brand" href="/" aria-label="DealPilot AI Home">
        <span className="mark" aria-hidden="true">D↗</span>
        DealPilot<span className="ai">AI</span>
      </a>
      <div className="badge sandbox-badge">
        <span className="badge-dot" aria-hidden="true" />
        <span>Sandbox demo</span>
      </div>
    </header>
  );
}
