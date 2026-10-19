'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDealPilot } from '@/context/DealPilotContext';

export function JudgeDemoBar() {
  const pathname = usePathname();
  const {
    role,
    deal,
    offer,
    activeDealId,
    loadJudgeDemo,
    switchRole,
    actionLoading,
  } = useDealPilot();

  const [minimized, setMinimized] = useState(false);

  const isBothApproved = Boolean(offer && offer.approvals.length === 2);
  const isPaid = deal?.status === 'paid';

  const steps = [
    { label: '01 Brief', path: `/deals/${activeDealId}/brief` },
    { label: '02 Negotiation', path: `/deals/${activeDealId}/negotiation` },
    { label: '03 Proposal', path: `/deals/${activeDealId}/proposal` },
    { label: '04 Review', path: `/deals/${activeDealId}/review` },
    {
      label: isPaid ? '05 Paid ✓' : isBothApproved ? '05 PayPal 🔓' : '05 PayPal 🔒',
      path: `/deals/${activeDealId}/payment`,
    },
  ];

  if (minimized) {
    return (
      <aside aria-label="Judge demo mode controls">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          aria-expanded="false"
          style={{
            position: 'fixed',
            top: 10,
            right: 16,
            zIndex: 9999,
            background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
            color: '#F8FAFC',
            border: '1px solid #3B82F6',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>⚖️ Judge Demo Bar</span>
          <span style={{ fontSize: 10, opacity: 0.8 }}>▾ Open</span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Judge demo mode bar"
      style={{
        background: 'linear-gradient(90deg, #091322 0%, #152A4A 45%, #0B192E 100%)',
        color: '#F8FAFC',
        borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
        padding: '8px 16px',
        fontSize: 13,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* Left: Judge Badge & Quick Role Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(234, 179, 8, 0.15)',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            borderRadius: 6,
            padding: '3px 8px',
            color: '#FDE047',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <span>⚖️</span>
          <span>Judge Mode</span>
        </div>

        {activeDealId ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.35)',
              borderRadius: 8,
              padding: 2,
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <button
              type="button"
              disabled={Boolean(actionLoading) || role === 'freelancer'}
              onClick={() => void switchRole('freelancer')}
              style={{
                background:
                  role === 'freelancer'
                    ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
                    : 'transparent',
                color: role === 'freelancer' ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: role === 'freelancer' ? 700 : 500,
                cursor: role === 'freelancer' ? 'default' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <span>🧑‍💻</span>
              <span>Freelancer (Sarah)</span>
            </button>

            <button
              type="button"
              disabled={Boolean(actionLoading) || role === 'client'}
              onClick={() => void switchRole('client')}
              style={{
                background:
                  role === 'client'
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : 'transparent',
                color: role === 'client' ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: role === 'client' ? 700 : 500,
                cursor: role === 'client' ? 'default' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <span>👤</span>
              <span>Client (Alex)</span>
            </button>
          </div>
        ) : (
          <span style={{ color: '#94A3B8', fontSize: 12 }}>
            Viewing Workspace Overview
          </span>
        )}
      </div>

      {/* Middle: Stepper Shortcuts (if on a deal) */}
      {activeDealId && (
        <nav
          aria-label="Judge quick navigation steps"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            overflowX: 'auto',
          }}
        >
          {steps.map(s => {
            const isActive = pathname === s.path;
            return (
              <Link
                key={s.path}
                href={s.path}
                style={{
                  background: isActive ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  color: isActive ? '#60A5FA' : '#CBD5E1',
                  border: isActive
                    ? '1px solid rgba(96, 165, 250, 0.5)'
                    : '1px solid transparent',
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 500,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s ease',
                }}
              >
                {s.label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Right: Reset Demo Deal & Minimize */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          disabled={Boolean(actionLoading)}
          onClick={() => void loadJudgeDemo()}
          title="Reload fresh showcase deal with sample proposal & negotiation"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#F8FAFC',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            transition: 'background 0.15s ease',
          }}
        >
          <span>⚡</span>
          <span>Reset Demo Deal</span>
        </button>

        <button
          type="button"
          onClick={() => setMinimized(true)}
          title="Minimize judge bar"
          aria-label="Minimize judge bar"
          style={{
            background: 'transparent',
            color: '#94A3B8',
            border: 'none',
            fontSize: 14,
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          ✕
        </button>
      </div>
    </aside>
  );
}
