'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDealPilot } from '../context/DealPilotContext';
import { NotificationItem } from '../types';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleIcon,
  CreditCardIcon,
  CloseIcon,
  BellIcon,
} from './Icons';

export function NotificationToaster() {
  const router = useRouter();
  const { toasts, dismissToast, markNotificationRead, setActiveDealId } = useDealPilot();

  if (!toasts.length) return null;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'approval':
        return <CheckCircleIcon />;
      case 'rejection':
        return <XCircleIcon />;
      case 'payment':
        return <CreditCardIcon />;
      case 'negotiation':
      case 'message':
        return <ChatBubbleIcon />;
      default:
        return <BellIcon />;
    }
  };

  const getBadgeStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'approval':
        return { background: 'rgba(16, 185, 129, 0.12)', color: '#059669', borderColor: '#10b981' };
      case 'payment':
        return { background: 'rgba(16, 185, 129, 0.15)', color: '#047857', borderColor: '#059669' };
      case 'rejection':
        return { background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', borderColor: '#ef4444' };
      case 'negotiation':
        return { background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', borderColor: '#3b82f6' };
      default:
        return { background: 'rgba(100, 116, 139, 0.12)', color: '#475569', borderColor: '#94a3b8' };
    }
  };

  const handleClick = (toast: NotificationItem) => {
    markNotificationRead(toast.id);
    dismissToast(toast.id);
    if (toast.dealId) {
      setActiveDealId(toast.dealId);
    }
    if (toast.actionUrl) {
      router.push(toast.actionUrl);
    }
  };

  return (
    <aside
      className="toast-container"
      aria-live="polite"
      aria-label="Real-time notifications"
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 380,
        width: 'calc(100vw - 40px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => {
        const badge = getBadgeStyle(toast.type);
        return (
          <div
            key={toast.id}
            role="alert"
            className="toast-card page-transition-fade"
            style={{
              pointerEvents: 'auto',
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '14px 16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.06)',
              borderLeft: `4px solid ${badge.borderColor}`,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={() => handleClick(toast)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getIcon(toast.type)}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: 99,
                    background: badge.background,
                    color: badge.color,
                  }}
                >
                  {toast.type}
                </span>
              </div>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  dismissToast(toast.id);
                }}
                aria-label="Dismiss notification"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 4,
                }}
              >
                <CloseIcon />
              </button>
            </div>

            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>
                {toast.title}
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569', lineHeight: 1.4 }}>
                {toast.message}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                {toast.dealTitle || 'Deal update'}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--blue-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                View deal →
              </span>
            </div>
          </div>
        );
      })}
    </aside>
  );
}
