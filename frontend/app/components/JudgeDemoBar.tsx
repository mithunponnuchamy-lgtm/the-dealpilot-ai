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
      <div
        role="region"
        aria-label="Client mode controls"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
        }}
      >
        <button
          type="button"
          onClick={() => setMinimized(false)}
          aria-expanded="false"
          style={{
            background: 'linear-gradient(135deg, #0A192F 0%, #1E3A8A 100%)',
            color: '#FFFFFF',
            border: '1px solid #3B82F6',
            borderRadius: 30,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>{role === 'client' ? '👤 Client Mode' : '🧑‍💻 Freelancer Mode'}</span>
          <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 10 }}>
            Switch ▾
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Client mode switcher"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        background: role === 'client'
          ? 'linear-gradient(90deg, #064E3B 0%, #065F46 45%, #047857 100%)'
          : 'linear-gradient(90deg, #0A192F 0%, #1E3A8A 45%, #0F172A 100%)',
        color: '#F8FAFC',
        borderBottom: role === 'client' ? '1px solid #10B981' : '1px solid rgba(59, 130, 246, 0.35)',
        padding: '10px 24px',
        fontSize: 13,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        transition: 'background 0.3s ease',
      }}
    >
      {/* Left: Mode Badge & Quick Role Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: role === 'client' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.25)',
            border: role === 'client' ? '1px solid #34D399' : '1px solid #60A5FA',
            borderRadius: 6,
            padding: '3px 8px',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <span>{role === 'client' ? '👤' : '🧑‍💻'}</span>
          <span>{role === 'client' ? 'Client Mode Active' : 'Freelancer View'}</span>
        </div>

        {activeDealId && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 8,
              padding: 2,
              border: '1px solid rgba(255, 255, 255, 0.15)',
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
                color: role === 'freelancer' ? '#FFFFFF' : '#CBD5E1',
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
              <span>Freelancer View</span>
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
                color: role === 'client' ? '#FFFFFF' : '#CBD5E1',
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
              <span>Client Mode</span>
            </button>
          </div>
        )}
      </div>

      {/* Middle: Stepper Shortcuts (if on a deal) */}
      {activeDealId && (
        <nav
          aria-label="Workflow quick navigation steps"
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
                  background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#E2E8F0',
                  border: isActive
                    ? '1px solid rgba(255, 255, 255, 0.4)'
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
            background: 'rgba(255, 255, 255, 0.12)',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.25)',
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
          <span>Reset Sample Deal</span>
        </button>

        <button
          type="button"
          onClick={() => setMinimized(true)}
          title="Minimize bar"
          aria-label="Minimize bar"
          style={{
            background: 'transparent',
            color: '#E2E8F0',
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
    </div>
  );
}
